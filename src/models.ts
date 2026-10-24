import { scopedDetectorTransactions } from './detectors.ts'
import { buildOutcomeView } from './outcomes.ts'
import type { AlertRecord, CaseRecord } from './alert-state.ts'
import type { RiskPolicy } from './policies.ts'

type Seed = typeof import('./data/fixtures.json')
export type ModelDimension = 'fraud' | 'mule' | 'aml'
export const MODEL_DIMENSIONS: ModelDimension[] = ['fraud', 'mule', 'aml']
export type ModelTemplate = { id: string; dimension: ModelDimension; name: string; purpose: string; inputs: string[]; limitation: string }
export const MODEL_TEMPLATES: ModelTemplate[] = [
  { id: 'MODEL-DEMO-FRAUD', dimension: 'fraud', name: 'Fraud candidate template', purpose: 'Structure an evaluation of transaction fraud signals against the same frozen baseline cohort.', inputs: ['Point-in-time transaction features', 'Governed Fraud outcomes', 'Pinned candidate artifact and signature'], limitation: 'No trained artifact, calibrated prediction or measured Fraud performance is supplied.' },
  { id: 'MODEL-DEMO-MULE', dimension: 'mule', name: 'Mule candidate template', purpose: 'Document the prerequisites for evaluating account relationship and forwarding patterns.', inputs: ['Verified account identity', 'Corrected bounded transaction history', 'Governed Mule outcomes', 'Pinned candidate artifact and signature'], limitation: 'Display account references and invented graph bindings do not establish verified account history.' },
  { id: 'MODEL-DEMO-AML', dimension: 'aml', name: 'AML candidate template', purpose: 'Prepare a reproducible review of AML indicators with explicit label maturity and sampling context.', inputs: ['Availability-aware transaction features', 'Governed AML outcomes', 'Representative sampling and QA', 'Pinned candidate artifact and signature'], limitation: 'Analyst opinions and amount signals do not establish money laundering or production model accuracy.' },
]
export type ModelScope = { institution: string; range: string; asOf: string; currency: string; cohort: 'all' | 'alert_linked' | 'without_alert' }
export type ModelContext = ReturnType<typeof buildModelContext>
export function buildModelContext(seed: Seed, cases: CaseRecord[], alerts: AlertRecord[], scope: ModelScope) {
  if (!['all', 'alert_linked', 'without_alert'].includes(scope.cohort)) throw new Error('Choose an assessed fixture cohort.')
  if (!['all', 'SYN', 'USD', 'THB'].includes(scope.currency)) throw new Error('Choose a supplied literal currency.')
  const transactions = scopedDetectorTransactions(seed.transactions, scope).filter((tx) => scope.currency === 'all' || tx.currency === scope.currency)
  const runs = seed.assessments.flatMap((assessment) => {
    const transaction = transactions.find((tx) => tx.id === assessment.transaction_id && tx.revision === assessment.revision && tx.institution_id === assessment.institution_id)
    if (!transaction) return []
    const linkedAlerts = alerts.filter((alert) => alert.assessment_id === assessment.id && alert.transaction_id === transaction.id && alert.institution_id === transaction.institution_id)
    if ((scope.cohort === 'alert_linked' && !linkedAlerts.length) || (scope.cohort === 'without_alert' && linkedAlerts.length)) return []
    const source = seed.transactions.find((tx) => tx.id === transaction.id && tx.revision === transaction.revision && tx.institution_id === transaction.institution_id)!
    return [{ assessment: structuredClone(assessment), transaction: structuredClone(source), alertIds: linkedAlerts.map((alert) => alert.id) }]
  }).sort((a, b) => a.assessment.id.localeCompare(b.assessment.id))
  const alertIds = new Set(runs.flatMap((run) => run.alertIds))
  const outcomes = buildOutcomeView(cases.filter((item) => item.alert_ids.some((id) => alertIds.has(id))), scope)
  const opinions = outcomes.rows.filter((row) => row.freshness !== 'superseded')
  return {
    scope: { ...scope }, runs, recordedOpinions: opinions.length, unknownOpinions: opinions.filter((row) => row.opinion === 'unknown').length,
    // These portal records are synthetic and unverified; no opinion can establish production eligibility.
    eligibleLabels: 0, registeredArtifacts: 0, availabilityGrade: 'snapshot_only_or_unknown' as const,
    sourceWatermark: null, featureSnapshot: null, maturityPolicy: null,
    coverage: MODEL_DIMENSIONS.map((dimension) => ({ dimension, available: runs.filter((run) => run.assessment.dimensions[dimension].index !== null).length, total: runs.length, eligibleLabels: 0 })),
  }
}

export type TemporalSplit = { trainStart: string; trainEnd: string; validationStart: string; validationEnd: string; testStart: string; testEnd: string; horizonDays: number }
export const DEFAULT_TEMPORAL_SPLIT: TemporalSplit = { trainStart: '2026-10-01', trainEnd: '2026-10-10', validationStart: '2026-10-12', validationEnd: '2026-10-16', testStart: '2026-10-18', testEnd: '2026-10-23', horizonDays: 1 }
const DAY = 86400000
function dateStart(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN
}
export function inspectTemporalSplit(context: ModelContext, split: TemporalSplit) {
  const errors: string[] = []
  const windows = [
    { id: 'train' as const, start: dateStart(split.trainStart), end: dateStart(split.trainEnd) + DAY },
    { id: 'validation' as const, start: dateStart(split.validationStart), end: dateStart(split.validationEnd) + DAY },
    { id: 'test' as const, start: dateStart(split.testStart), end: dateStart(split.testEnd) + DAY },
  ]
  if (!Number.isInteger(split.horizonDays) || split.horizonDays < 0 || split.horizonDays > 365) errors.push('Label horizon must be an integer from 0 to 365 days.')
  for (const window of windows) {
    if (!Number.isFinite(window.start) || !Number.isFinite(window.end) || window.start >= window.end) errors.push(`Choose valid ${window.id} dates with start on or before end.`)
  }
  if (!errors.length) {
    if (windows[1].start - windows[0].end < split.horizonDays * DAY || windows[2].start - windows[1].end < split.horizonDays * DAY) errors.push('Train, validation and test windows must be ordered, non-overlapping, with gaps at least as long as the label horizon.')
    if (windows[2].end > dateStart(context.scope.asOf.slice(0, 10)) + DAY) errors.push('Test dates cannot extend beyond the supplied fixture snapshot date.')
  }
  const assignments = context.runs.map((run) => ({ assessmentId: run.assessment.id, partition: errors.length ? 'excluded' : windows.find((window) => Date.parse(run.transaction.occurred_at) >= window.start && Date.parse(run.transaction.occurred_at) < window.end)?.id ?? 'excluded' }))
  const counts = { train: 0, validation: 0, test: 0, excluded: 0 }
  for (const item of assignments) counts[item.partition as keyof typeof counts]++
  return { valid: !errors.length, errors, counts, assignments, timezone: 'UTC' as const, horizonApproved: false as const }
}

export const MODEL_METRICS = [
  { id: 'precision', label: 'Precision', denominator: 'True positives + false positives', reason: 'Adjudicated labels and candidate predictions are not supplied.' },
  { id: 'recall', label: 'Recall', denominator: 'All eligible positives in the target population', reason: 'Representative positive-label coverage and predictions are not supplied. Alert-only samples cannot establish population recall.' },
  { id: 'pr_auc', label: 'PR-AUC', denominator: 'Eligible labeled cohort with ranked predictions', reason: 'Ranked predictions and eligible mature labels are not supplied.' },
  { id: 'fpr', label: 'False-positive rate', denominator: 'All eligible negatives in the target population', reason: 'Verified negatives and representative sampling are not supplied. Unknown or unalerted records are not negative labels.' },
  { id: 'calibration', label: 'Calibration', denominator: 'Eligible outcomes with calibrated probabilities', reason: 'Frozen risk indices are not calibrated probabilities; no candidate calibration artifact is supplied.' },
]
export function unavailableModelMetrics(dimension: ModelDimension) {
  return MODEL_METRICS.map((metric) => ({ ...metric, dimension, baseline: null, candidate: null, measuredDenominator: null, confidenceInterval: null, status: 'unavailable' as const }))
}
export function modelReadinessGates(context: ModelContext, split: TemporalSplit) {
  const temporal = inspectTemporalSplit(context, split)
  const populated = temporal.valid && temporal.counts.train > 0 && temporal.counts.validation > 0 && temporal.counts.test > 0
  return [
    { id: 'labels', title: 'Eligible mature labels', status: 'blocked', reason: `${context.eligibleLabels} eligible labels. ${context.recordedOpinions} related case opinions remain unverified; adjudication and maturity are not supplied.`, route: '/outcomes' },
    { id: 'split', title: 'Temporal split & horizon', status: populated ? 'preview_valid' : 'blocked', reason: !temporal.valid ? temporal.errors.join(' ') : `Preview rows: ${temporal.counts.train} train / ${temporal.counts.validation} validation / ${temporal.counts.test} test. ${populated ? 'Dates are valid locally; the horizon still needs governance approval.' : 'All three partitions need coverage; the horizon still needs governance approval.'}`, route: null },
    { id: 'history', title: 'Point-in-time feature availability', status: 'unavailable', reason: 'Only synthetic snapshots are supplied. Historical availability, corrected event history and feature watermarks are not verified.', route: '/datasets' },
    { id: 'sampling', title: 'Representative sampling & QA', status: 'unavailable', reason: context.scope.cohort === 'alert_linked' ? 'This alert-linked cohort cannot support population recall or false-positive-rate claims. Sampling, QA and label definitions are not supplied.' : 'Sampling provenance, reviewer disagreement, label definitions and QA evidence are not supplied.', route: '/outcomes' },
    { id: 'artifact', title: 'Pinned candidate & code artifacts', status: 'unavailable', reason: 'No trained model version, artifact hash, input signature or approved code snapshot has been supplied.', route: null },
  ]
}
export type ModelReadinessSnapshot = {
  id: string; at: string; kind: 'readiness_preview'; status: 'blocked'; name: string
  scope: ModelScope; candidate: ModelTemplate; candidateArtifactHash: null; baseline: RiskPolicy
  split: TemporalSplit; temporal: ReturnType<typeof inspectTemporalSplit>
  manifest: ModelContext; gates: ReturnType<typeof modelReadinessGates>; metrics: ReturnType<typeof unavailableModelMetrics>
  sameCohort: { baselineRunIds: string[]; candidateRunIds: string[] }; manifestHash: string
  evaluationExecuted: false; productionEligible: false
}
export async function createModelReadinessSnapshot(context: ModelContext, candidateId: string, baseline: RiskPolicy, split: TemporalSplit, name: string, id: string, at: string): Promise<ModelReadinessSnapshot> {
  const candidate = MODEL_TEMPLATES.find((item) => item.id === candidateId)
  if (!candidate) throw new Error('Choose a supplied illustrative candidate template.')
  if (baseline.state !== 'approved') throw new Error('Choose an approved synthetic policy as the baseline reference.')
  if (name.trim().length < 3 || name.trim().length > 100) throw new Error('Use a readiness snapshot name of 3–100 characters.')
  if (!context.runs.length) throw new Error('There are no frozen assessment runs in the selected cohort.')
  const temporal = inspectTemporalSplit(context, split)
  if (!temporal.valid) throw new Error(temporal.errors.join(' '))
  if (!id || !Number.isFinite(Date.parse(at))) throw new Error('A snapshot reference and valid recorded time are required.')
  const manifest = structuredClone(context)
  const sameIds = manifest.runs.map((run) => run.assessment.id)
  const payload = { id, at, kind: 'readiness_preview' as const, status: 'blocked' as const, name: name.trim(), scope: { ...manifest.scope }, candidate: structuredClone(candidate), candidateArtifactHash: null, baseline: structuredClone(baseline), split: { ...split }, temporal, manifest, gates: modelReadinessGates(manifest, split), metrics: unavailableModelMetrics(candidate.dimension), sameCohort: { baselineRunIds: [...sameIds], candidateRunIds: [...sameIds] }, evaluationExecuted: false as const, productionEligible: false as const }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))
  const snapshot = { ...payload, manifestHash: `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}` }
  return snapshot
}

export type ModelRegistryFilters = { search: string; dimension: string; status: string; version: string }
export const DEFAULT_MODEL_REGISTRY_FILTERS: ModelRegistryFilters = { search: '', dimension: 'all', status: 'all', version: 'all' }
export function filterModelTemplates(filters: ModelRegistryFilters) {
  const search = filters.search.trim().toLowerCase()
  return MODEL_TEMPLATES.filter((template) => (!search || `${template.id} ${template.name} ${template.purpose}`.toLowerCase().includes(search)) && (filters.dimension === 'all' || template.dimension === filters.dimension) && (filters.status === 'all' || filters.status === 'template') && (filters.version === 'all' || filters.version === 'not_supplied'))
}
export const MODEL_SERVING_CHECKS = [
  { id: 'artifact', label: 'Model artifact loaded', value: null, reason: 'No pinned deployment or loaded model evidence is supplied.' },
  { id: 'signature', label: 'Input signature', value: null, reason: 'No approved model schema or signature hash is supplied.' },
  { id: 'features', label: 'Feature freshness', value: null, reason: 'No live feature store, watermark or freshness observation is connected.' },
  { id: 'calibration', label: 'Calibration reference', value: null, reason: 'No evaluated calibration artifact is supplied.' },
  { id: 'latency', label: 'p95 / p99 latency', value: null, reason: 'No serving measurements or representative load test is supplied.' },
  { id: 'throughput', label: 'Observed throughput', value: null, reason: 'Capacity targets are not measured throughput.' },
  { id: 'capacity', label: 'Operating alert capacity', value: null, reason: 'No approved alert-capacity operating point is supplied.' },
]
