import { allowsInstitution, decideAccess, getAccessPersona, type AccessSession } from './access.ts'
import { scopedDetectorTransactions } from './detectors.ts'
import { selectOfflineBatches, type DatasetWorkspace } from './datasets.ts'
import type { AlertWorkspace } from './alert-state.ts'
import type { PolicyWorkspace } from './policies.ts'
type Seed = typeof import('./data/fixtures.json')
export type OperationScope = { institution: string; range: string; asOf: string }
export function operationTimeInScope(at: string | null, scope: OperationScope) {
  const days = scope.range === '24h' ? 1 : scope.range === '7d' ? 7 : scope.range === '30d' ? 30 : 0
  if (!days || !Number.isFinite(Date.parse(scope.asOf))) return false
  if (at === null) return true // Missing fixture event time is explicitly unknown, never inferred from object update time.
  return Number.isFinite(Date.parse(at)) && Date.parse(at) >= Date.parse(scope.asOf) - days * 86400000
}
export const HEALTH_DEPENDENCIES = [
  { id: 'source', name: 'Source replica / offline export', stage: 'Source', reason: 'Real source connection, export location, authority and source semantics are not supplied.' },
  { id: 'postgres', name: 'PostgreSQL / audit storage', stage: 'Storage', reason: 'No live database or protected audit telemetry is connected to this portal.' },
  { id: 'worker', name: 'Risk worker / job leases', stage: 'Processing', reason: 'Supplied synthetic job references are not live worker, lease or scheduler observations.' },
  { id: 'models', name: 'FastAPI / model serving', stage: 'Serving', reason: 'Service diagnostics do not establish loaded-model, feature or signature readiness.' },
  { id: 'features', name: 'Feature store / cache', stage: 'Features', reason: 'No live feature watermark, freshness, cache observation or streaming acceptance is supplied.' },
  { id: 'stream', name: 'CDC / Kafka / Flink', stage: 'Streaming', reason: 'Architecture dependencies are not proof of deployed capture or a running streaming pipeline.' },
]
export const SOURCE_READINESS = [
  { name: 'Manual export location', value: null, reason: 'The actual export path and source-access configuration have not been supplied.' },
  { name: 'Source semantics / codebook', value: null, reason: 'Lifecycle, reversal, timestamp and field interpretation remain unapproved.' },
  { name: 'Stable account identity', value: null, reason: 'Display references and routing participants do not establish verified account ownership.' },
  { name: 'Replica lag', value: null, reason: 'No measured replica lag is supplied. Unknown is not zero.' },
  { name: 'CDC / backlog / watermark', value: null, reason: 'No connected live capture, backlog or source watermark evidence is supplied.' },
]
export const RECOVERY_READINESS = [
  { name: 'Restore acceptance', reason: 'A current protected restore report and environment-specific acceptance have not been supplied to this portal.' },
  { name: 'RPO / RTO', reason: 'Approved recovery objectives and accountable owners are not supplied.' },
  { name: 'Capacity & production SLO', reason: '5,000,000 payments/day is a design target, not observed workload, peak rate or accepted capacity.' },
  { name: 'Canary / rollback / stop conditions', reason: 'Scope-specific production sign-offs, recovery evidence and release controls remain prerequisites.' },
]
export type RiskJobView = { id: string; institution: string; kind: 'fixture_result' | 'selection_snapshot'; state: string; transactionId: string | null; assessmentId: string | null; revision: number | null; policyId: string; policyHash: string; receipt: string; fingerprint: string | null; engine: string | null; attempt: number | null; at: string | null; lease: null; retryAt: null }
export function buildHealthView(seed: Seed, workspace: AlertWorkspace, datasets: DatasetWorkspace, policies: PolicyWorkspace, scope: OperationScope) {
  const transactions = scopedDetectorTransactions(seed.transactions, scope)
  const assessments = seed.assessments.filter((item) => transactions.some((tx) => tx.id === item.transaction_id && tx.revision === item.revision && tx.institution_id === item.institution_id))
  const batches = selectOfflineBatches(datasets, scope)
  const jobs: RiskJobView[] = assessments.map((item) => ({ id: item.id.replace('ASM-', 'JOB-'), institution: item.institution_id, kind: 'fixture_result', state: 'completed_demo', transactionId: item.transaction_id, assessmentId: item.id, revision: item.revision, policyId: item.policy_id, policyHash: 'DEMO-POLICY-HASH-03', receipt: 'DEMO-RECEIPT-03', fingerprint: item.input_fingerprint, engine: item.engine_version, attempt: 1, at: item.created_at, lease: null, retryAt: null }))
  for (const job of policies.jobs.filter((item) => (scope.institution === 'ALL' || item.receipt.institution === scope.institution) && operationTimeInScope(item.acceptedAt, scope))) jobs.push({ id: job.id, institution: job.receipt.institution, kind: 'selection_snapshot', state: 'accepted_preview', transactionId: null, assessmentId: null, revision: null, policyId: job.policy.id, policyHash: job.receipt.policyHash, receipt: `g${job.receipt.generation} · ${job.receipt.namespace}/${job.receipt.currency}`, fingerprint: null, engine: job.policy.engineVersion, attempt: null, at: job.acceptedAt, lease: null, retryAt: null })
  return { transactions: transactions.length, assessed: assessments.length, unresolved: transactions.filter((tx) => seed.transactions.find((item) => item.id === tx.id)?.account_identity !== 'verified').length,
    dimensions: (['fraud', 'mule', 'aml'] as const).map((dimension) => ({ dimension, available: assessments.filter((item) => item.dimensions[dimension].index !== null).length, total: assessments.length })),
    batches, pendingBatches: batches.filter((batch) => !batch.reconciled).length, offlineConflicts: batches.reduce((total, batch) => total + batch.conflicts, 0), jobs,
    replicaLag: null, liveFeatureFreshness: null, invalidCount: null, lateCount: null, quarantineCount: null, productionThroughput: null,
  }
}
export type DeliveryState = 'queued' | 'processing' | 'provider_accepted' | 'retry_scheduled' | 'failed' | 'expired' | 'cancelled'
export type NotificationIntent = { id: string; reference: string; alertId: string; institution: string; state: DeliveryState; channel: 'web_app_preview'; mode: 'sandbox'; createdAt: string; expiresAt: string; retryAt: string | null; recipientRef: string; policyRef: string; attempts: { number: number; state: string; at: string; leaseRef: string; reason: string }[]; providerAcceptedAt: string | null; deviceReceiptAt: null; openedAt: null; notificationAcknowledgedAt: null; alertState: string; payload: { title: string; reference: string } }
export function buildNotificationIntents(workspace: AlertWorkspace, scope: OperationScope): NotificationIntent[] {
  const states: DeliveryState[] = ['queued', 'provider_accepted', 'retry_scheduled', 'failed', 'expired']
  return workspace.alerts.map((alert, index): NotificationIntent => {
    const state = states[index % states.length], attemptCount = state === 'queued' ? 0 : state === 'retry_scheduled' ? 2 : 1
    const reference = `DEMO-REF-${String(index + 1).padStart(4, '0')}`
    return { id: `INTENT-DEMO-${String(index + 1).padStart(4, '0')}`, reference, alertId: alert.id, institution: alert.institution_id, state, channel: 'web_app_preview', mode: 'sandbox', createdAt: alert.created_at, expiresAt: new Date(Date.parse(alert.created_at) + 86400000).toISOString(), retryAt: state === 'retry_scheduled' ? new Date(Date.parse(alert.created_at) + 300000).toISOString() : null, recipientRef: 'STAFF-DEMO-RECIPIENT', policyRef: 'DEMO-NOTIFICATION-POLICY-01', attempts: Array.from({ length: attemptCount }, (_, attempt) => ({ number: attempt + 1, state: state === 'provider_accepted' ? 'provider_accepted' : 'sandbox_failure', at: alert.created_at, leaseRef: `DEMO-LEASE-${index + 1}-${attempt + 1}`, reason: state === 'provider_accepted' ? 'Invented provider acceptance; no device receipt is supplied.' : 'Invented delivery failure / expiry example; no external request was made.' })), providerAcceptedAt: state === 'provider_accepted' ? alert.created_at : null, deviceReceiptAt: null, openedAt: null, notificationAcknowledgedAt: null, alertState: alert.state, payload: { title: 'A risk alert requires your review', reference } }
  }).filter((intent) => (scope.institution === 'ALL' || intent.institution === scope.institution) && operationTimeInScope(intent.createdAt, scope))
}
export type AuditDomain = 'alert' | 'case' | 'policy' | 'dataset' | 'access' | 'export'
export type SafeAuditEvent = { id: string; domain: AuditDomain; actor: string; actorType: 'demo_persona' | 'fixture_reference'; action: string; target: string; institution: string | null; at: string | null; revision: number | null; expectedRevision: null; correlation: string | null; summary: string; route: string | null }
export type AuditExportRecord = { id: string; at: string; actor: string; institution: string; rowIds: string[]; rowCount: number; mode: 'synthetic_csv_prepared' }
const safeActor = (actor: string) => /^[A-Za-z0-9:_-]{1,100}$/.test(actor) ? actor : 'REDACTED-ACTOR'
export function buildAuditEvents(session: AccessSession, workspace: AlertWorkspace, policies: PolicyWorkspace, datasets: DatasetWorkspace, exports: AuditExportRecord[], scope: OperationScope) {
  if (!decideAccess(session, 'read_audit').allowed || session.institution !== scope.institution) return []
  const events: SafeAuditEvent[] = []
  const inScope = (owner: string | null) => owner === null || allowsInstitution(session, owner) && (scope.institution === 'ALL' || owner === scope.institution)
  const add = (event: SafeAuditEvent) => { if (inScope(event.institution) && operationTimeInScope(event.at, scope)) events.push({ ...event, actor: safeActor(event.actor) }) }
  if (decideAccess(session, 'read_monitoring').allowed) for (const event of workspace.events) add({ id: `alert:${event.id}`, domain: 'alert', actor: event.actor, actorType: 'demo_persona', action: event.action, target: event.alert_id, institution: event.institution_id, at: event.at, revision: event.version, expectedRevision: null, correlation: event.request_id, summary: 'Alert workflow changed; free-text review content is excluded.', route: `/alerts/${event.alert_id}` })
  if (decideAccess(session, 'read_cases').allowed) for (const item of workspace.cases) for (const event of item.history) add({ id: `case:${item.id}:${event.id}`, domain: 'case', actor: event.actor, actorType: event.id.startsWith('FIXTURE-') ? 'fixture_reference' : 'demo_persona', action: event.action, target: item.id, institution: item.institution_id, at: event.at, revision: event.version, expectedRevision: null, correlation: event.request_id, summary: 'Case activity recorded; note text, opinion rationale and raw evidence are excluded.', route: `/cases/${item.id}` })
  if (decideAccess(session, 'read_catalog').allowed) for (const event of policies.history) add({ id: `policy:${event.id}`, domain: 'policy', actor: event.actor, actorType: event.id.startsWith('DEMO-PE-SEED') ? 'fixture_reference' : 'demo_persona', action: `policy.${event.kind}`, target: event.policyId, institution: event.binding?.institution ?? null, at: event.at, revision: null, expectedRevision: null, correlation: event.id, summary: 'Policy lifecycle or local selection changed; author and review free text are excluded.', route: `/policies/${event.policyId}` })
  if (decideAccess(session, 'read_operations').allowed) for (const event of datasets.actions) { const batch = datasets.batches.find((item) => item.id === event.batchId); if (batch) add({ id: `dataset:${event.id}`, domain: 'dataset', actor: event.actor, actorType: 'demo_persona', action: `dataset.${event.kind}`, target: event.batchId, institution: batch.institution, at: event.at, revision: null, expectedRevision: null, correlation: event.id, summary: 'Offline metadata simulation recorded; source contents and paths are excluded.', route: '/datasets' }) }
  for (const event of session.events) add({ id: `access:${event.id}`, domain: 'access', actor: 'DEMO-SESSION-CONTEXT', actorType: 'demo_persona', action: `access.${event.action}`, target: 'DEMO-ACCESS-CONTEXT', institution: null, at: event.at, revision: null, expectedRevision: null, correlation: event.id, summary: 'Local persona, scope or session scenario changed. This is not an IdP or protected access audit event.', route: '/access' })
  for (const event of exports) { if (event.institution === 'ALL' && (session.institution !== 'ALL' || !allowsInstitution(session, 'ALL'))) continue; add({ id: `export:${event.id}`, domain: 'export', actor: event.actor, actorType: 'demo_persona', action: 'audit.synthetic_csv_prepared', target: event.id, institution: event.institution === 'ALL' ? null : event.institution, at: event.at, revision: null, expectedRevision: null, correlation: event.id, summary: `${event.rowCount} authorized redacted rows prepared as a synthetic CSV. Browser receipt is not verified.`, route: null }) }
  return events.sort((a, b) => (b.at ? Date.parse(b.at) : -Infinity) - (a.at ? Date.parse(a.at) : -Infinity) || a.id.localeCompare(b.id))
}
export type AuditFilters = { search: string; domain: string; actor: string; actorType: string; action: string; correlation: string; from: string; to: string }
export const DEFAULT_AUDIT_FILTERS: AuditFilters = { search: '', domain: 'all', actor: 'all', actorType: 'all', action: 'all', correlation: '', from: '', to: '' }
export function filterAuditEvents(events: SafeAuditEvent[], filters: AuditFilters) {
  return events.filter((event) => (!filters.search.trim() || `${event.target} ${event.id} ${event.action}`.toLowerCase().includes(filters.search.trim().toLowerCase())) && (filters.domain === 'all' || event.domain === filters.domain) && (filters.actor === 'all' || event.actor === filters.actor) && (filters.actorType === 'all' || event.actorType === filters.actorType) && (filters.action === 'all' || event.action === filters.action) && (!filters.correlation || event.correlation?.toLowerCase().includes(filters.correlation.trim().toLowerCase())) && (!filters.from || event.at !== null && event.at.slice(0, 10) >= filters.from) && (!filters.to || event.at !== null && event.at.slice(0, 10) <= filters.to))
}
const csvCell = (value: unknown) => { const text = String(value ?? ''); return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"` }
export function prepareAuditCsv(events: SafeAuditEvent[], ids: string[], session: AccessSession, id: string, at: string) {
  if (!decideAccess(session, 'export_audit_preview').allowed) throw new Error('This demo persona cannot export audit previews.')
  if (!ids.length || ids.length > 100 || new Set(ids).size !== ids.length) throw new Error('Choose 1–100 distinct authorized visible audit rows.')
  const rows = ids.map((selected) => events.find((event) => event.id === selected) ?? (() => { throw new Error('An export row is unavailable in the current authorized scope. Refresh the visible results.') })())
  for (const row of rows) {
    if (row.institution && (!allowsInstitution(session, row.institution) || session.institution !== 'ALL' && row.institution !== session.institution)) throw new Error('An export row is outside the authorized institution scope.')
    const required = row.domain === 'alert' ? 'read_monitoring' : row.domain === 'case' ? 'read_cases' : row.domain === 'policy' ? 'read_catalog' : row.domain === 'dataset' ? 'read_operations' : 'read_audit'
    if (!decideAccess(session, required).allowed) throw new Error('The current persona cannot export this event source.')
  }
  const fields: (keyof SafeAuditEvent)[] = ['id', 'domain', 'actor', 'actorType', 'action', 'target', 'institution', 'at', 'revision', 'correlation', 'summary']
  const csv = [[csvCell('export_mode'), ...fields.map(csvCell)].join(','), ...rows.map((row) => [csvCell('synthetic_preview'), ...fields.map((field) => csvCell(row[field]))].join(','))].join('\r\n')
  return { csv, record: { id, at, actor: getAccessPersona(session)!.subject, institution: session.institution, rowIds: [...ids], rowCount: rows.length, mode: 'synthetic_csv_prepared' as const } }
}
