import profiles from './data/case-profiles.json' with { type: 'json' }
import type { AlertWorkspace } from './alert-state'

type Seed = typeof import('./data/fixtures.json')
export const CASE_DIMENSIONS = ['fraud', 'mule', 'aml'] as const
export type CaseDimension = typeof CASE_DIMENSIONS[number]
export type CaseOpinion = 'suspicious' | 'legitimate' | 'unknown'
export type CaseCapability = 'read' | 'create_link' | 'assign' | 'work' | 'reopen' | 'audit'
export const CASE_ACTORS: { id: string; name: string; role: string; capabilities: CaseCapability[] }[] = [
  { id: 'actor-analyst-a', name: 'Noy Analyst', role: 'Analyst', capabilities: ['read', 'create_link', 'work', 'audit'] },
  { id: 'actor-reviewer-a', name: 'Mali Reviewer', role: 'Supervisor', capabilities: ['read', 'create_link', 'assign', 'work', 'reopen', 'audit'] },
  { id: 'actor-auditor', name: 'Anou Auditor', role: 'Read only', capabilities: ['read', 'audit'] },
]
export const canCase = (actor: string, capability: CaseCapability) => CASE_ACTORS.find((item) => item.id === actor)?.capabilities.includes(capability) ?? false
export type CaseEvidence = { alert_id: string; assessment_id: string; transaction_id: string; revision: number; policy_id: string; fingerprint: string }
export type CaseOutcome = {
  dimension: CaseDimension; opinion: CaseOpinion; rationale: string; actor: string; at: string | null; epoch: number
  review_status: 'analyst_reviewed'; verification: 'unverified'; training_eligible: false; evidence: CaseEvidence[]
}
export type CaseEvent = { id: string; action: string; actor: string; at: string | null; version: number; detail: string; request_id: string | null }
export type CaseRecord = Omit<Seed['cases'][number], 'state'> & {
  state: 'open' | 'in_review' | 'closed'; title: string; version: number; alert_ids: string[]
  assigned_to: string | null; review_epoch: number; notes: { id: string; text: string; actor: string; at: string | null }[]
  outcomes: CaseOutcome[]; history: CaseEvent[]
}
export class CaseActionError extends Error {
  code: 'conflict' | 'permission' | 'validation' | 'unavailable'
  constructor(code: CaseActionError['code'], message: string) { super(message); this.name = 'CaseActionError'; this.code = code }
}
export function createCaseRecord(base: Seed['cases'][number], alertIds: string[]): CaseRecord {
  const profile = profiles.cases.find((item) => item.id === base.id)
  return {
    ...base, state: base.state as CaseRecord['state'], title: profile?.id === 'CASE-SYN-1001' ? 'Synthetic amount signal investigation' : profile ? 'Reviewed synthetic evidence' : 'New synthetic investigation',
    version: profile?.revision ?? 1, alert_ids: [...alertIds], assigned_to: profile?.assigned_to ?? null, review_epoch: 1,
    notes: profile?.notes.map((note) => ({ ...note, at: null })) ?? [],
    outcomes: profile ? CASE_DIMENSIONS.flatMap((dimension): CaseOutcome[] => {
      const value = profile.outcomes[dimension]
      return value.opinion ? [{ dimension, opinion: value.opinion as CaseOpinion, rationale: 'reason' in value ? String(value.reason) : 'Invented fixture review', actor: profile.assigned_to, at: null, epoch: 1, review_status: 'analyst_reviewed', verification: 'unverified', training_eligible: false, evidence: [] }] : []
    }) : [],
    history: profile?.timeline.map((event) => ({ id: `FIXTURE-${base.id}-${event.sequence}`, action: event.action, actor: event.actor, at: null, version: event.sequence, detail: 'Reported synthetic fixture history; event time was not supplied.', request_id: null })) ?? [],
  }
}
export const freshCaseOutcomes = (item: CaseRecord) => Object.fromEntries(CASE_DIMENSIONS.map((dimension) => [dimension,
  item.outcomes.slice().reverse().find((outcome) => outcome.dimension === dimension && outcome.epoch === item.review_epoch && outcome.actor === item.assigned_to),
])) as Partial<Record<CaseDimension, CaseOutcome>>
export const invalidateCaseOutcomes = (item: CaseRecord): CaseRecord => ({ ...item, review_epoch: item.review_epoch + 1 })

export function caseEvidence(workspace: AlertWorkspace, item: CaseRecord, seed: Seed): CaseEvidence[] {
  if (!item.alert_ids.length || item.alert_ids.length > 20 || new Set(item.alert_ids).size !== item.alert_ids.length) throw new CaseActionError('validation', 'A case needs 1–20 unique alert references.')
  return item.alert_ids.map((id) => {
    const alert = workspace.alerts.find((entry) => entry.id === id)
    const assessment = seed.assessments.find((entry) => entry.id === alert?.assessment_id)
    const transaction = seed.transactions.find((entry) => entry.id === alert?.transaction_id)
    if (!alert || alert.case_id !== item.id || alert.institution_id !== item.institution_id || !assessment || !transaction || assessment.institution_id !== item.institution_id || transaction.institution_id !== item.institution_id || assessment.transaction_id !== transaction.id || assessment.revision !== transaction.revision || assessment.policy_id !== alert.policy_id || !seed.policies.some((entry) => entry.id === assessment.policy_id)) {
      throw new CaseActionError('validation', 'Frozen evidence references are incomplete or inconsistent. No changes were saved.')
    }
    return { alert_id: id, assessment_id: assessment.id, transaction_id: transaction.id, revision: assessment.revision, policy_id: assessment.policy_id, fingerprint: assessment.input_fingerprint }
  })
}
export type CaseCommand = {
  caseId: string; expectedVersion: number; institution: string; actor: string; requestId: string; at: string; auditUnavailable?: boolean
} & (
  | { kind: 'create'; title: string; alertIds: string[] }
  | { kind: 'assign'; assignee: string | null }
  | { kind: 'start_review' | 'close' }
  | { kind: 'add_note'; text: string }
  | { kind: 'outcomes'; opinions: { dimension: CaseDimension; opinion: CaseOpinion; rationale: string }[] }
  | { kind: 'reopen'; reason: string }
  | { kind: 'link_alert'; alertId: string }
)

export function applyCaseCommand(workspace: AlertWorkspace, command: CaseCommand, seed: Seed): AlertWorkspace {
  const capability = command.kind === 'create' || command.kind === 'link_alert' ? 'create_link' : command.kind === 'assign' ? 'assign' : command.kind === 'reopen' ? 'reopen' : 'work'
  if (!canCase(command.actor, capability)) throw new CaseActionError('permission', 'This demo persona does not have the required case capability.')
  if (!command.requestId || !Number.isFinite(Date.parse(command.at)) || new TextEncoder().encode(JSON.stringify(command)).length > 16384) throw new CaseActionError('validation', 'A valid request/time is required; demo commands are limited to 16KiB.')
  let item = workspace.cases.find((entry) => entry.id === command.caseId)
  if (command.kind !== 'create' && (!item || (command.institution !== 'ALL' && item.institution_id !== command.institution))) throw new CaseActionError('permission', 'This case is outside the selected institution scope.')
  if (command.kind === 'create' && command.alertIds.some((id) => !workspace.alerts.some((alert) => alert.id === id && (command.institution === 'ALL' || alert.institution_id === command.institution)))) throw new CaseActionError('permission', 'Choose alerts within the selected institution scope.')
  const { requestId, ...payload } = command
  const signature = JSON.stringify(payload)
  const previous = workspace.requests.find((entry) => entry.id === requestId)
  if (previous) { if (previous.signature !== signature) throw new CaseActionError('conflict', 'The request reference already has different content.'); return workspace }
  if (command.kind === 'create') {
    if (item || command.expectedVersion !== 0 || !/^CASE-DEMO-[a-zA-Z0-9-]{1,64}$/.test(command.caseId) || !command.title.trim() || command.title.trim().length > 120) throw new CaseActionError('validation', 'Choose a new demo reference and a title of 1–120 characters.')
    item = { ...createCaseRecord({ id: command.caseId, institution_id: workspace.alerts.find((alert) => alert.id === command.alertIds[0])?.institution_id ?? '', state: 'open', updated_at: command.at }, []), title: command.title.trim(), version: 0 }
  }
  if (!item) throw new CaseActionError('validation', 'Case unavailable.')
  if (item.version !== command.expectedVersion) throw new CaseActionError('conflict', '409 · This case has changed. Reload the latest version and review your draft before retrying.')
  if (item.history.length >= 1000) throw new CaseActionError('validation', 'This demo case has reached its 1000-event history limit.')
  if (command.kind !== 'create') caseEvidence(workspace, item, seed)
  if (capability === 'work' && item.assigned_to !== command.actor) throw new CaseActionError('permission', 'Only the assigned reviewer can work on this demo case.')
  if (item.state === 'closed' && command.kind !== 'reopen') throw new CaseActionError('conflict', 'Reopen this case before making changes.')
  let next = { ...item, version: item.version + 1, updated_at: command.at }
  let alerts = workspace.alerts
  let detail = ''
  const linkAlerts = (ids: string[]) => {
    if (!ids.length || next.alert_ids.length + ids.length > 20 || new Set(ids).size !== ids.length) throw new CaseActionError('validation', 'Select 1–20 unique alerts within the case capacity.')
    for (const id of ids) {
      const alert = alerts.find((entry) => entry.id === id)
      if (!alert || alert.institution_id !== next.institution_id) throw new CaseActionError('permission', 'Every linked alert must belong to the same institution.')
      if (alert.case_id || next.alert_ids.includes(id)) throw new CaseActionError('conflict', `${id} already has an owning case.`)
    }
    alerts = alerts.map((alert) => ids.includes(alert.id) ? { ...alert, case_id: next.id, version: alert.version + 1, updated_at: command.at } : alert)
    next = invalidateCaseOutcomes({ ...next, alert_ids: [...next.alert_ids, ...ids] })
    caseEvidence({ ...workspace, alerts }, next, seed)
  }
  switch (command.kind) {
    case 'create': linkAlerts(command.alertIds); detail = `Created case with ${command.alertIds.length} alerts. Assignment is a separate action.`; break
    case 'link_alert': linkAlerts([command.alertId]); detail = `Linked ${command.alertId}; prior outcomes require reassessment.`; break
    case 'assign':
      if (command.assignee !== null && !CASE_ACTORS.some((actor) => actor.id === command.assignee && actor.capabilities.includes('work'))) throw new CaseActionError('validation', 'Choose an eligible demo reviewer.')
      if (command.assignee === item.assigned_to) throw new CaseActionError('validation', 'Choose a different assignment.')
      next = invalidateCaseOutcomes({ ...next, assigned_to: command.assignee }); detail = `Assigned to ${command.assignee ?? 'unassigned'}; prior outcomes require reassessment.`; break
    case 'start_review':
      if (item.state !== 'open') throw new CaseActionError('conflict', 'Only an open case can enter review.')
      next.state = 'in_review'; detail = 'Started review of frozen linked evidence.'; break
    case 'add_note':
      if (!command.text.trim() || command.text.trim().length > 2000) throw new CaseActionError('validation', 'Enter a note of 1–2000 characters (demo limit).')
      next.notes = [...item.notes, { id: `NOTE-${requestId}`, text: command.text.trim(), actor: command.actor, at: command.at }]; detail = 'Added an append-only analyst note.'; break
    case 'outcomes': {
      if (item.state !== 'in_review' || command.opinions.length !== 3 || new Set(command.opinions.map((opinion) => opinion.dimension)).size !== 3) throw new CaseActionError('validation', 'An in-review case requires one opinion per risk dimension.')
      const evidence = caseEvidence(workspace, item, seed)
      const outcomes = command.opinions.map((opinion): CaseOutcome => {
        if (!CASE_DIMENSIONS.includes(opinion.dimension) || !['suspicious', 'legitimate', 'unknown'].includes(opinion.opinion) || !opinion.rationale.trim() || opinion.rationale.trim().length > 2000) throw new CaseActionError('validation', 'Each dimension needs an opinion and rationale of 1–2000 characters.')
        return { ...opinion, rationale: opinion.rationale.trim(), actor: command.actor, at: command.at, epoch: item!.review_epoch, review_status: 'analyst_reviewed', verification: 'unverified', training_eligible: false, evidence }
      })
      next.outcomes = [...item.outcomes, ...outcomes]; detail = 'Recorded Fraud/Mule/AML opinions. Unverified; training eligible: false.'; break
    }
    case 'close': {
      const fresh = freshCaseOutcomes(item)
      if (item.state !== 'in_review' || !CASE_DIMENSIONS.every((dimension) => fresh[dimension])) throw new CaseActionError('validation', 'Record fresh outcomes for all three dimensions before closing.')
      next.state = 'closed'; detail = 'Closed after fresh review. Unknown opinions remain unknown.'; break
    }
    case 'reopen':
      if (item.state !== 'closed' || !command.reason.trim() || command.reason.trim().length > 1000) throw new CaseActionError('validation', 'A closed case needs a reopening reason of 1–1000 characters.')
      next = invalidateCaseOutcomes({ ...next, state: 'in_review' }); detail = `Reopened (proposed demo destination: in_review). ${command.reason.trim()}`; break
    default: throw new CaseActionError('validation', 'Unsupported case action.')
  }
  if (command.auditUnavailable) throw new CaseActionError('unavailable', 'Audit unavailable (demo). The entire action was rolled back; your draft is preserved.')
  next.history = [...item.history, { id: `CASE-AUD-${requestId}`, action: command.kind, actor: command.actor, at: command.at, version: next.version, detail, request_id: requestId }]
  return { ...workspace, alerts, cases: command.kind === 'create' ? [...workspace.cases, next] : workspace.cases.map((entry) => entry.id === next.id ? next : entry), requests: [...workspace.requests, { id: requestId, signature }] }
}
