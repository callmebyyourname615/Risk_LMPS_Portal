import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createAlertWorkspace } from '../src/alert-state.ts'
import { createPolicyWorkspace } from '../src/policies.ts'
import { DEFAULT_MODEL_REGISTRY_FILTERS, DEFAULT_TEMPORAL_SPLIT, MODEL_DIMENSIONS, MODEL_SERVING_CHECKS, MODEL_TEMPLATES, buildModelContext, createModelReadinessSnapshot, filterModelTemplates, inspectTemporalSplit, modelReadinessGates, unavailableModelMetrics } from '../src/models.ts'

const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const scope = { institution: 'INST-DEMO-A', range: '7d', asOf: seed._meta.data_as_of, currency: 'all', cohort: 'all' }
const context = (extra = {}, workspace = createAlertWorkspace(seed), source = seed) => buildModelContext(source, workspace.cases, workspace.alerts, { ...scope, ...extra })
const capture = (ctx = context(), extra = {}) => createModelReadinessSnapshot(ctx, extra.candidateId ?? MODEL_TEMPLATES[0].id, extra.baseline ?? createPolicyWorkspace().policies[0], extra.split ?? { ...DEFAULT_TEMPORAL_SPLIT }, extra.name ?? 'Synthetic readiness snapshot', 'READY-TEST-1', '2026-10-23T07:00:00Z')

test('model cohorts retain explicit revision/institution boundaries, literal currencies and alert linkage', () => {
  const all = context(), alerted = context({ cohort: 'alert_linked' }), unalerted = context({ cohort: 'without_alert' })
  assert.ok(all.runs.every((run) => run.transaction.institution_id === scope.institution && run.transaction.revision === run.assessment.revision))
  assert.ok(alerted.runs.every((run) => run.alertIds.length > 0))
  assert.ok(unalerted.runs.every((run) => run.alertIds.length === 0))
  assert.equal(new Set([...alerted.runs, ...unalerted.runs].map((run) => run.assessment.id)).size, all.runs.length)
  assert.equal(alerted.runs.length + unalerted.runs.length, all.runs.length)
  assert.ok(context({ currency: 'USD' }).runs.every((run) => run.transaction.currency === 'USD'))
  assert.equal(context({ currency: 'USD' }).runs.length, 0)
  assert.equal(context({ range: '24h' }).runs.length, 3)
  assert.ok(context({ institution: 'INST-DEMO-B' }).runs.every((run) => run.assessment.institution_id === 'INST-DEMO-B'))
  assert.throws(() => context({ institution: 'UNAUTHORIZED' }))
  assert.throws(() => context({ currency: 'INVALID' }))
  assert.throws(() => context({ cohort: 'positive_labels' }))
})

test('unknown and closed-case opinions never become eligible labels, even when an assessment index is present', () => {
  const ctx = context()
  assert.equal(ctx.eligibleLabels, 0)
  assert.ok(ctx.unknownOpinions > 0)
  assert.equal(ctx.availabilityGrade, 'snapshot_only_or_unknown')
  assert.equal(ctx.sourceWatermark, null)
  assert.ok(ctx.coverage.every((dimension) => dimension.eligibleLabels === 0))
  assert.ok(ctx.coverage.some((dimension) => dimension.available > 0))
  const gates = modelReadinessGates(ctx, DEFAULT_TEMPORAL_SPLIT)
  assert.equal(gates.find((gate) => gate.id === 'labels').status, 'blocked')
  assert.match(modelReadinessGates(context({ cohort: 'alert_linked' }), DEFAULT_TEMPORAL_SPLIT).find((gate) => gate.id === 'sampling').reason, /population recall/)
})

test('temporal split detects overlap, missing horizon gaps, invalid dates and future test windows', () => {
  const ctx = context(), initial = inspectTemporalSplit(ctx, DEFAULT_TEMPORAL_SPLIT)
  assert.equal(initial.valid, true)
  assert.equal(initial.counts.train, 0)
  assert.equal(initial.counts.validation, 0)
  assert.equal(initial.counts.test, ctx.runs.length)
  assert.equal(modelReadinessGates(ctx, DEFAULT_TEMPORAL_SPLIT).find((gate) => gate.id === 'split').status, 'blocked')
  assert.equal(initial.horizonApproved, false)
  for (const extra of [{ validationStart: '2026-10-10' }, { horizonDays: 2 }, { trainStart: '2026-02-30' }, { trainEnd: '' }, { testEnd: '2026-10-24' }, { horizonDays: 0.5 }, { horizonDays: NaN }]) {
    const result = inspectTemporalSplit(ctx, { ...DEFAULT_TEMPORAL_SPLIT, ...extra })
    assert.equal(result.valid, false)
    assert.ok(result.errors.length)
  }
})

test('valid adjacent UTC partitions assign each frozen revision once without promoting date validity to production approval', () => {
  const ctx = context({ institution: 'ALL' })
  // Supply an additional event date locally to exercise all three populated partitions.
  ctx.runs[0].transaction.occurred_at = '2026-10-21T12:00:00Z'
  const split = { trainStart: '2026-10-21', trainEnd: '2026-10-21', validationStart: '2026-10-22', validationEnd: '2026-10-22', testStart: '2026-10-23', testEnd: '2026-10-23', horizonDays: 0 }
  const result = inspectTemporalSplit(ctx, split)
  assert.equal(result.valid, true)
  assert.ok(result.counts.train && result.counts.validation && result.counts.test)
  assert.equal(result.counts.train + result.counts.validation + result.counts.test, ctx.runs.length)
  assert.equal(result.horizonApproved, false)
  assert.equal(modelReadinessGates(ctx, split).find((gate) => gate.id === 'split').status, 'preview_valid')
  assert.ok(modelReadinessGates(ctx, split).some((gate) => gate.status === 'blocked'))
})

test('all model quality metrics and serving observations remain unavailable instead of fabricated zeroes', () => {
  for (const dimension of MODEL_DIMENSIONS) {
    const metrics = unavailableModelMetrics(dimension)
    assert.equal(metrics.length, 5)
    assert.ok(metrics.every((metric) => metric.dimension === dimension && metric.baseline === null && metric.candidate === null && metric.measuredDenominator === null && metric.confidenceInterval === null && metric.reason.length > 0))
  }
  assert.ok(MODEL_SERVING_CHECKS.every((check) => check.value === null && check.reason.length > 0))
})

test('readiness snapshots pin the same cohort for both references and preserve provenance after source state changes', async () => {
  const ctx = context(), original = structuredClone(seed), baseline = createPolicyWorkspace().policies[0], split = { ...DEFAULT_TEMPORAL_SPLIT }
  const snapshot = await capture(ctx, { baseline, split })
  assert.deepEqual(snapshot.sameCohort.baselineRunIds, snapshot.sameCohort.candidateRunIds)
  assert.deepEqual(snapshot.sameCohort.baselineRunIds, ctx.runs.map((run) => run.assessment.id))
  assert.equal(snapshot.evaluationExecuted, false)
  assert.equal(snapshot.productionEligible, false)
  assert.equal(snapshot.candidateArtifactHash, null)
  assert.equal(snapshot.status, 'blocked')
  const { manifestHash, ...payload } = snapshot
  assert.equal(manifestHash, `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`)
  const frozenAmount = snapshot.manifest.runs[0].transaction.amount
  ctx.runs[0].transaction.amount = '0.00'; baseline.condition.fraudThreshold = '1.00'; split.horizonDays = 100
  assert.equal(snapshot.manifest.runs[0].transaction.amount, frozenAmount)
  assert.equal(snapshot.baseline.condition.fraudThreshold, '1000000.00')
  assert.equal(snapshot.split.horizonDays, 1)
  assert.deepEqual(seed, original)
})

test('snapshot capture rejects an empty cohort, unknown candidates, unapproved baselines and invalid temporal plans', async () => {
  await assert.rejects(() => capture(context({}, createAlertWorkspace(seed), { ...seed, assessments: [] })), /no frozen assessment runs/i)
  await assert.rejects(() => capture(context(), { candidateId: 'FAKE-TRAINED-MODEL' }), /candidate/)
  await assert.rejects(() => capture(context(), { baseline: createPolicyWorkspace().policies[1] }), /approved/)
  await assert.rejects(() => capture(context(), { split: { ...DEFAULT_TEMPORAL_SPLIT, testStart: '' } }), /test dates/)
  await assert.rejects(() => capture(context(), { name: 'a' }), /3–100/)
})

test('registry filters expose illustrative templates and never manufacture registered or pinned models', () => {
  assert.equal(filterModelTemplates(DEFAULT_MODEL_REGISTRY_FILTERS).length, 3)
  assert.equal(filterModelTemplates({ ...DEFAULT_MODEL_REGISTRY_FILTERS, search: '  model-demo-mule  ', dimension: 'mule', status: 'template', version: 'not_supplied' })[0].id, 'MODEL-DEMO-MULE')
  assert.equal(filterModelTemplates({ ...DEFAULT_MODEL_REGISTRY_FILTERS, status: 'registered' }).length, 0)
  assert.equal(filterModelTemplates({ ...DEFAULT_MODEL_REGISTRY_FILTERS, version: 'pinned' }).length, 0)
})
