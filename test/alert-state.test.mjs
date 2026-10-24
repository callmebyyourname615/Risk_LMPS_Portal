import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { AlertActionError, applyAlertCommand, createAlertWorkspace } from '../src/alert-state.ts'

const fixtures = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const initial = () => createAlertWorkspace(fixtures)
const command = (overrides = {}) => ({
  kind: 'acknowledge', alertId: 'ALT-SYN-1007', expectedVersion: 1,
  institution: 'INST-DEMO-A', actor: 'actor-analyst-a', requestId: 'request-1',
  at: '2026-10-23T08:00:00.000Z', ...overrides,
})
const alert = (state, id = 'ALT-SYN-1007') => state.alerts.find((item) => item.id === id)
const rejects = (callback, code) => assert.throws(callback, (error) => error instanceof AlertActionError && error.code === code)

test('acknowledge and unknown review preserve frozen evidence and remain unverified', () => {
  const before = initial()
  const ack = applyAlertCommand(before, command())
  assert.equal(alert(before).state, 'open')
  assert.equal(alert(ack).state, 'acknowledged')
  const reviewed = applyAlertCommand(ack, command({ kind: 'review', expectedVersion: 2, requestId: 'request-2', opinion: 'unknown', rationale: '  Identity evidence is unavailable.  ' }))
  assert.equal(alert(reviewed).state, 'reviewed')
  assert.equal(alert(reviewed).review.opinion, 'unknown')
  assert.equal(alert(reviewed).review.training_eligible, false)
  assert.equal(alert(reviewed).review.verification, 'unverified')
  assert.equal(alert(reviewed).assessment_id, alert(before).assessment_id)
  assert.equal(alert(reviewed).policy_id, alert(before).policy_id)
  assert.equal(reviewed.events.length, 2)
  assert.equal(reviewed.events[1].version, alert(reviewed).version)
  assert.equal(alert(reviewed).review.rationale, 'Identity evidence is unavailable.')
})

test('duplicate retry is idempotent; changed request and stale version conflict', () => {
  const updated = applyAlertCommand(initial(), command())
  assert.equal(applyAlertCommand(updated, command()), updated)
  rejects(() => applyAlertCommand(updated, command({ at: '2026-10-23T08:01:00Z' })), 'conflict')
  rejects(() => applyAlertCommand(updated, command({ requestId: 'request-2' })), 'conflict')
  assert.equal(updated.events.length, 1)
})

test('scope and state restrictions apply before idempotency or review', () => {
  const before = initial()
  rejects(() => applyAlertCommand(before, command({ institution: 'INST-DEMO-B' })), 'permission')
  rejects(() => applyAlertCommand(before, command({ kind: 'review', opinion: 'unknown', rationale: 'Some evidence' })), 'conflict')
  const updated = applyAlertCommand(before, command())
  rejects(() => applyAlertCommand(updated, command({ institution: 'INST-DEMO-B' })), 'permission')
  const original = JSON.stringify(updated)
  rejects(() => applyAlertCommand(updated, command({ kind: 'review', expectedVersion: 2, requestId: 'bad-review', opinion: 'safe', rationale: 'Some evidence' })), 'validation')
  rejects(() => applyAlertCommand(updated, command({ kind: 'review', expectedVersion: 2, requestId: 'bad-review', opinion: 'unknown', rationale: '  ' })), 'validation')
  assert.equal(JSON.stringify(updated), original)
})

test('case linking is atomic, uniquely owned, and leaves acknowledgement unchanged', () => {
  const before = initial()
  const linked = applyAlertCommand(before, command({ kind: 'link_case', caseId: 'CASE-SYN-1001' }))
  assert.equal(alert(linked).state, 'open')
  assert.equal(alert(linked).case_id, 'CASE-SYN-1001')
  assert.equal(alert(before).case_id, null)
  assert.deepEqual(linked.cases.find((item) => item.id === 'CASE-SYN-1001').alert_ids, ['ALT-SYN-1001', 'ALT-SYN-1007'])
  assert.equal(linked.events.length, 1)
  rejects(() => applyAlertCommand(linked, command({ kind: 'link_case', expectedVersion: 2, requestId: 'request-2', caseId: 'CASE-SYN-1003' })), 'conflict')
})

test('closed, cross-institution and full cases reject links without partial changes', () => {
  const before = initial()
  rejects(() => applyAlertCommand(before, command({ kind: 'link_case', caseId: 'CASE-SYN-1003' })), 'conflict')
  const cross = structuredClone(before)
  cross.cases[0].institution_id = 'INST-DEMO-B'
  rejects(() => applyAlertCommand(cross, command({ kind: 'link_case', caseId: 'CASE-SYN-1001' })), 'permission')
  const full = structuredClone(before)
  full.cases[0].alert_ids = Array.from({ length: 20 }, (_, i) => `ALT-EXAMPLE-${i}`)
  const original = JSON.stringify(full)
  rejects(() => applyAlertCommand(full, command({ kind: 'link_case', caseId: 'CASE-SYN-1001' })), 'validation')
  assert.equal(JSON.stringify(full), original)
})

test('create case adds one scoped case and evidence link; replay creates no duplicates', () => {
  const before = initial()
  const create = command({ kind: 'create_case', caseId: 'CASE-DEMO-new-01', title: '  Investigate signal  ' })
  const next = applyAlertCommand(before, create)
  assert.equal(next.cases.length, before.cases.length + 1)
  const created = next.cases.find((item) => item.id === 'CASE-DEMO-new-01')
  assert.equal(created.title, 'Investigate signal')
  assert.equal(created.institution_id, alert(next).institution_id)
  assert.deepEqual(created.alert_ids, [alert(next).id])
  assert.equal(alert(next).state, 'open')
  assert.equal(applyAlertCommand(next, create), next)
  rejects(() => applyAlertCommand(before, { ...create, title: ' ' }), 'validation')
})
