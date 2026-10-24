import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyAlertCommand, createAlertWorkspace } from '../src/alert-state.ts'
import { applyCaseCommand, caseEvidence, CaseActionError, CASE_DIMENSIONS, freshCaseOutcomes } from '../src/case-state.ts'

const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const initial = () => createAlertWorkspace(seed)
const getCase = (workspace, id = 'CASE-SYN-1001') => workspace.cases.find((item) => item.id === id)
const command = (workspace, extra = {}) => ({
  kind: 'add_note', text: 'ຫຼັກຖານ: identity is unresolved.', caseId: 'CASE-SYN-1001',
  expectedVersion: getCase(workspace).version, institution: 'INST-DEMO-A', actor: 'actor-analyst-a',
  requestId: 'request-note', at: '2026-10-23T09:00:00Z', ...extra,
})
const opinions = () => CASE_DIMENSIONS.map((dimension) => ({ dimension, opinion: 'unknown', rationale: `Insufficient verified ${dimension} evidence.` }))
const apply = (workspace, extra) => applyCaseCommand(workspace, command(workspace, extra), seed)
const rejects = (callback, code) => assert.throws(callback, (failure) => failure instanceof CaseActionError && failure.code === code)

test('analyst notes, three reviewed unknown opinions and closure preserve alert states and frozen evidence', () => {
  const before = initial()
  const withNote = apply(before, {})
  assert.equal(getCase(before).notes.length, 0)
  assert.equal(getCase(withNote).notes.length, 1)
  const reviewed = apply(withNote, { kind: 'outcomes', opinions: opinions(), requestId: 'review-1' })
  const fresh = freshCaseOutcomes(getCase(reviewed))
  assert.equal(Object.values(fresh).filter(Boolean).length, 3)
  for (const outcome of Object.values(fresh)) {
    assert.equal(outcome.opinion, 'unknown')
    assert.equal(outcome.training_eligible, false)
    assert.equal(outcome.verification, 'unverified')
    assert.equal(outcome.evidence[0].revision, 2)
    assert.equal(outcome.evidence[0].policy_id, 'POL-SYN-03')
  }
  const closed = apply(reviewed, { kind: 'close', requestId: 'close-1' })
  assert.equal(getCase(closed).state, 'closed')
  assert.deepEqual(closed.alerts, before.alerts)
  assert.equal(getCase(closed).history.at(-1).version, getCase(closed).version)
  assert.equal(getCase(closed).history.at(-1).request_id, 'close-1')
})

test('retries are idempotent; stale versions and reused request references conflict', () => {
  const before = initial(), cmd = command(before)
  const after = applyCaseCommand(before, cmd, seed)
  assert.equal(applyCaseCommand(after, cmd, seed), after)
  rejects(() => applyCaseCommand(after, { ...cmd, text: 'different' }, seed), 'conflict')
  rejects(() => applyCaseCommand(after, { ...cmd, requestId: 'stale' }, seed), 'conflict')
  assert.equal(getCase(after).notes.length, 1)
})

test('capabilities, assigned actor and institution scope are checked before mutations or replay', () => {
  const before = initial()
  rejects(() => apply(before, { actor: 'actor-auditor' }), 'permission')
  rejects(() => apply(before, { actor: 'actor-reviewer-a' }), 'permission')
  rejects(() => apply(before, { institution: 'INST-DEMO-B' }), 'permission')
  rejects(() => apply(before, { kind: 'assign', assignee: 'actor-reviewer-a' }), 'permission')
  const after = apply(before, {})
  rejects(() => applyCaseCommand(after, { ...command(before), institution: 'INST-DEMO-B' }, seed), 'permission')
})

test('changing assignment invalidates current opinions but retains the previous review round', () => {
  const reviewed = apply(initial(), { kind: 'outcomes', opinions: opinions(), requestId: 'review' })
  const changed = apply(reviewed, { kind: 'assign', actor: 'actor-reviewer-a', assignee: 'actor-reviewer-a', requestId: 'assign' })
  assert.equal(getCase(changed).outcomes.length, 3)
  assert.equal(Object.values(freshCaseOutcomes(getCase(changed))).filter(Boolean).length, 0)
  rejects(() => apply(changed, { kind: 'close', actor: 'actor-reviewer-a', requestId: 'close' }), 'validation')
})

test('linking from either Cases or Alerts invalidates outcomes and preserves independent alert review', () => {
  const reviewed = apply(initial(), { kind: 'outcomes', opinions: opinions(), requestId: 'review' })
  const linked = apply(reviewed, { kind: 'link_alert', alertId: 'ALT-SYN-1002', requestId: 'link' })
  assert.equal(linked.alerts.find((item) => item.id === 'ALT-SYN-1002').state, 'acknowledged')
  assert.equal(getCase(linked).alert_ids.length, 2)
  assert.equal(Object.values(freshCaseOutcomes(getCase(linked))).filter(Boolean).length, 0)
  assert.equal(getCase(linked).outcomes.length, 3)
  rejects(() => apply(linked, { kind: 'link_alert', alertId: 'ALT-SYN-1002', requestId: 'link-again' }), 'conflict')
  const viaAlert = applyAlertCommand(reviewed, { kind: 'link_case', caseId: 'CASE-SYN-1001', alertId: 'ALT-SYN-1007', expectedVersion: 1, institution: 'INST-DEMO-A', actor: 'actor-analyst-a', requestId: 'alert-link', at: '2026-10-23T09:00:00Z' })
  assert.equal(Object.values(freshCaseOutcomes(getCase(viaAlert))).filter(Boolean).length, 0)
  assert.equal(getCase(viaAlert).history.at(-1).request_id, 'alert-link')
  assert.equal(viaAlert.alerts.find((item) => item.id === 'ALT-SYN-1007').state, 'open')
})

test('reopening requires a supervisor reason and invalidates unknown historical outcomes', () => {
  const before = initial(), old = getCase(before, 'CASE-SYN-1003')
  const cmd = command(before, { kind: 'reopen', caseId: old.id, expectedVersion: old.version, reason: 'New evidence needs review.', requestId: 'reopen' })
  rejects(() => applyCaseCommand(before, cmd, seed), 'permission')
  const reopened = applyCaseCommand(before, { ...cmd, actor: 'actor-reviewer-a' }, seed)
  const item = getCase(reopened, old.id)
  assert.equal(item.state, 'in_review')
  assert.equal(item.outcomes.length, 3)
  assert.ok(item.outcomes.every((outcome) => outcome.opinion === 'unknown'))
  assert.equal(Object.values(freshCaseOutcomes(item)).filter(Boolean).length, 0)
  assert.equal(item.history.length, old.history.length + 1)
})

test('create, assign and start review remain separate atomic actions', () => {
  const before = initial()
  const create = command(before, { kind: 'create', caseId: 'CASE-DEMO-new-01', expectedVersion: 0, title: 'Trace a synthetic signal', alertIds: ['ALT-SYN-1002', 'ALT-SYN-1007'], requestId: 'create' })
  const made = applyCaseCommand(before, create, seed)
  const item = getCase(made, create.caseId)
  assert.equal(item.assigned_to, null)
  assert.equal(item.state, 'open')
  assert.equal(item.alert_ids.length, 2)
  assert.equal(applyCaseCommand(made, create, seed), made)
  rejects(() => applyCaseCommand(made, { ...create, kind: 'start_review', expectedVersion: item.version, requestId: 'start' }, seed), 'permission')
  const assigned = applyCaseCommand(made, { ...create, kind: 'assign', actor: 'actor-reviewer-a', assignee: 'actor-analyst-a', expectedVersion: item.version, requestId: 'assign' }, seed)
  const started = applyCaseCommand(assigned, { ...create, kind: 'start_review', expectedVersion: getCase(assigned, item.id).version, requestId: 'start' }, seed)
  assert.equal(getCase(started, item.id).state, 'in_review')
  assert.equal(started.alerts.find((alert) => alert.id === 'ALT-SYN-1007').state, 'open')
})

test('audit failure rolls back notes, links, history and request publication as one operation', () => {
  const before = initial(), original = JSON.stringify(before)
  rejects(() => apply(before, { auditUnavailable: true }), 'unavailable')
  rejects(() => apply(before, { kind: 'link_alert', alertId: 'ALT-SYN-1002', requestId: 'link', auditUnavailable: true }), 'unavailable')
  assert.equal(JSON.stringify(before), original)
  const retried = apply(before, { auditUnavailable: false })
  assert.equal(getCase(retried).notes.length, 1)
})

test('frozen reference corruption blocks work and cannot silently relabel evidence', () => {
  const before = initial(), corrupted = structuredClone(seed)
  corrupted.assessments[0].revision = 99
  assert.throws(() => caseEvidence(before, getCase(before), corrupted), /Frozen evidence/)
  assert.throws(() => applyCaseCommand(before, command(before), corrupted), /Frozen evidence/)
  assert.equal(getCase(before).notes.length, 0)
})

test('empty reviews, over-limit notes, duplicate alert picks and close before outcomes are rejected', () => {
  const before = initial()
  rejects(() => apply(before, { kind: 'close', requestId: 'close' }), 'validation')
  rejects(() => apply(before, { text: 'x'.repeat(2001) }), 'validation')
  rejects(() => apply(before, { kind: 'outcomes', opinions: opinions().map((opinion) => ({ ...opinion, rationale: ' ' })) }), 'validation')
  rejects(() => apply(before, { kind: 'create', caseId: 'CASE-DEMO-duplicate', expectedVersion: 0, title: 'Duplicate picks', alertIds: ['ALT-SYN-1002', 'ALT-SYN-1002'] }), 'validation')
  rejects(() => apply(before, { kind: 'create', caseId: 'CASE-DEMO-empty', expectedVersion: 0, title: 'Empty picks', alertIds: [] }), 'validation')
})
