import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createAlertWorkspace } from '../src/alert-state.ts'
import { createPolicyWorkspace } from '../src/policies.ts'
import { createDatasetWorkspace } from '../src/datasets.ts'
import { createAccessSession, switchAccessInstitution, switchAccessPersona } from '../src/access.ts'
import { DEFAULT_AUDIT_FILTERS, HEALTH_DEPENDENCIES, SOURCE_READINESS, buildAuditEvents, buildHealthView, buildNotificationIntents, filterAuditEvents, prepareAuditCsv } from '../src/operations.ts'
const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const scope = { institution: 'INST-DEMO-A', range: '7d', asOf: seed._meta.data_as_of }
const at = '2026-10-23T07:00:00Z'
const role = (id) => switchAccessPersona(createAccessSession(), id, 1, at)
const source = () => ({ alerts: createAlertWorkspace(seed), policies: createPolicyWorkspace(), datasets: createDatasetWorkspace() })
const audit = (session = role('auditor'), data = source(), exports = []) => buildAuditEvents(session, data.alerts, data.policies, data.datasets, exports, { ...scope, institution: session.institution })

test('health derives scoped synthetic coverage and preserves unobserved telemetry as null', () => {
  const data = source(), health = buildHealthView(seed, data.alerts, data.datasets, data.policies, scope)
  assert.equal(health.transactions, 5)
  assert.equal(health.assessed, 4)
  assert.equal(health.unresolved, 5)
  assert.ok(health.jobs.every((job) => job.institution === scope.institution))
  for (const key of ['replicaLag','liveFeatureFreshness','invalidCount','lateCount','quarantineCount','productionThroughput']) assert.equal(health[key], null)
  assert.ok(SOURCE_READINESS.every((item) => item.value === null && item.reason))
  assert.ok(HEALTH_DEPENDENCIES.every((item) => item.reason))
})

test('job evidence keeps supplied frozen policy references rather than adopting a later active binding', () => {
  const data = source(), initial = buildHealthView(seed, data.alerts, data.datasets, data.policies, scope)
  const frozen = structuredClone(initial.jobs)
  data.policies.bindings[0].policyId = 'POL-SYN-04'; data.policies.bindings[0].generation = 99
  const after = buildHealthView(seed, data.alerts, data.datasets, data.policies, scope)
  assert.deepEqual(after.jobs, frozen)
  assert.equal(after.jobs.find((job) => job.kind === 'fixture_result').policyHash, 'DEMO-POLICY-HASH-03')
  assert.equal(after.jobs.find((job) => job.kind === 'selection_snapshot').policyId, 'POL-SYN-03')
  assert.ok(after.jobs.every((job) => job.lease === null && job.retryAt === null))
})

test('sandbox provider acceptance never fills receipt/open/notify-ack, including after an alert acknowledgement', () => {
  const data = source(), before = structuredClone(data.alerts)
  const intents = buildNotificationIntents(data.alerts, scope)
  const accepted = intents.find((intent) => intent.state === 'provider_accepted')
  assert.ok(accepted.providerAcceptedAt)
  assert.equal(accepted.deviceReceiptAt, null); assert.equal(accepted.openedAt, null); assert.equal(accepted.notificationAcknowledgedAt, null)
  data.alerts.alerts.find((alert) => alert.id === accepted.alertId).state = 'acknowledged'
  const after = buildNotificationIntents(data.alerts, scope).find((intent) => intent.id === accepted.id)
  assert.equal(after.alertState, 'acknowledged'); assert.equal(after.notificationAcknowledgedAt, null)
  assert.equal(intents.length, before.alerts.filter((alert) => alert.institution_id === scope.institution).length)
})

test('lock-screen previews contain only generic text and opaque references, with no bank/account/amount or device token', () => {
  const data = source(), original = structuredClone(data.alerts)
  const intents = buildNotificationIntents(data.alerts, scope)
  assert.ok(intents.every((intent) => intent.institution === scope.institution && intent.mode === 'sandbox'))
  for (const intent of intents) {
    assert.deepEqual(Object.keys(intent.payload).sort(), ['reference','title'])
    assert.equal(intent.payload.title, 'A risk alert requires your review')
    assert.match(intent.payload.reference, /^DEMO-REF-\d+$/)
    assert.equal('token' in intent, false)
  }
  assert.deepEqual(data.alerts, original)
})

test('audit projects authorized source history and removes note/rationale/source free text', () => {
  const data = source()
  data.alerts.cases[0].history[0].detail = 'SECRET_ACCOUNT_PAYLOAD'
  data.policies.history[0].rationale = 'SECRET_CREDENTIAL_VALUE'
  const events = audit(role('auditor'), data)
  assert.ok(events.some((event) => event.domain === 'case'))
  assert.ok(events.some((event) => event.at === null))
  assert.ok(events.every((event) => event.institution === null || event.institution === scope.institution))
  const text = JSON.stringify(events)
  assert.ok(!text.includes('SECRET_ACCOUNT_PAYLOAD') && !text.includes('SECRET_CREDENTIAL_VALUE'))
  assert.ok(events.every((event) => event.expectedRevision === null))
})

test('operator audit access does not grant case/alert/policy evidence; revoked and mismatched scope reads are empty', () => {
  const data = source(), operator = role('operator')
  data.datasets.actions.push({ id: 'DEMO-DATA-AUDIT', actor: 'DEMO-SUBJECT-OPERATOR', at, kind: 'replay', batchId: 'BATCH-OFF-001' })
  const events = audit(operator, data)
  assert.ok(events.some((event) => event.domain === 'dataset'))
  assert.ok(!events.some((event) => ['case','alert','policy'].includes(event.domain)))
  assert.deepEqual(audit({ ...operator, status: 'revoked' }, data), [])
  assert.deepEqual(buildAuditEvents(operator, data.alerts, data.policies, data.datasets, [], { ...scope, institution: 'INST-DEMO-B' }), [])
})

test('audit date, target, actor and correlation filters retain missing event times honestly', () => {
  const events = audit(), unknown = events.find((event) => event.at === null)
  assert.ok(unknown)
  assert.ok(filterAuditEvents(events, DEFAULT_AUDIT_FILTERS).some((event) => event.id === unknown.id))
  assert.ok(filterAuditEvents(events, { ...DEFAULT_AUDIT_FILTERS, from: '2026-10-20' }).every((event) => event.at !== null))
  const matched = filterAuditEvents(events, { ...DEFAULT_AUDIT_FILTERS, search: unknown.target, actor: unknown.actor, domain: 'case' })
  assert.ok(matched.length)
  assert.ok(matched.every((event) => event.target === unknown.target && event.actor === unknown.actor))
})

test('bounded CSV export rechecks row scope/capability, redacts content and records preparation without altering source history', () => {
  const session = role('auditor'), data = source(), events = audit(session, data), original = structuredClone(events)
  const prepared = prepareAuditCsv(events, events.slice(0, 3).map((event) => event.id), session, 'EXPORT-TEST', at)
  assert.equal(prepared.record.rowCount, 3)
  assert.equal(prepared.record.mode, 'synthetic_csv_prepared')
  assert.match(prepared.csv, /^"export_mode"/)
  assert.match(prepared.csv, /synthetic_preview/)
  assert.deepEqual(events, original)
  assert.ok(audit(session, data, [prepared.record]).some((event) => event.domain === 'export'))
  assert.throws(() => prepareAuditCsv(events, [], session, 'EMPTY', at), /1–100/)
  assert.throws(() => prepareAuditCsv(events, Array.from({length:101},(_,index)=>`ROW-${index}`), session, 'BIG', at), /1–100/)
  assert.throws(() => prepareAuditCsv(events, [events[0].id], role('operator'), 'DENIED', at), /cannot export/)
  const foreign = { ...events[0], id: 'FOREIGN', institution: 'INST-DEMO-B' }
  assert.throws(() => prepareAuditCsv([foreign], ['FOREIGN'], session, 'FORGED', at), /outside/)
})

test('CSV cells prevent formula execution and wide-scope export metadata cannot leak after narrowing the persona', () => {
  let supervisor = role('network-supervisor')
  supervisor = switchAccessInstitution(supervisor, 'ALL', supervisor.version, at)
  const data = source(), events = audit(supervisor, data)
  const sample = { ...events[0], id: 'FORMULA', target: '=2+2' }
  const prepared = prepareAuditCsv([sample], ['FORMULA'], supervisor, 'EXPORT-WIDE', at)
  assert.ok(prepared.csv.includes('"\'=2+2"'))
  assert.ok(audit(supervisor, data, [prepared.record]).some((event) => event.domain === 'export'))
  assert.ok(!audit(role('auditor'), data, [prepared.record]).some((event) => event.id === 'export:EXPORT-WIDE'))
})
