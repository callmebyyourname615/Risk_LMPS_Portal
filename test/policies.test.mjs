import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { DEFAULT_POLICY_FILTERS, PolicyError, applyPolicyCommand, comparePolicyVersions, createPolicyWorkspace, filterPolicies, findPolicyBinding, policyHash } from '../src/policies.ts'

const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
let sequence = 0
const command = (state, extra) => ({ actor: 'demo-author', expectedVersion: state.version, at: '2026-10-23T07:00:00Z', requestId: `test-${++sequence}`, ...extra })
const apply = (state, extra) => applyPolicyCommand(state, command(state, extra))
const bindingAction = (extra = {}) => ({ kind: 'activate', actor: 'demo-activator', policyId: 'POL-SYN-04', institution: 'INST-DEMO-A', namespace: 'risk-demo', currency: 'SYN', expectedGeneration: 1, rationale: 'Select this independently reviewed demo policy.', ...extra })
const approved = (state) => apply(state, { kind: 'review', actor: 'demo-checker', policyId: 'POL-SYN-04', decision: 'approved', rationale: 'Independent review of the frozen demo configuration.' })
const rejects = (callback, code) => assert.rejects(callback, (error) => error instanceof PolicyError && error.code === code)

test('seed configuration hashes match Web Crypto and standard SHA-256; workflow state is separate from the hash', async () => {
  assert.equal(createHash('sha256').update('abc').digest('hex'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  for (const policy of createPolicyWorkspace().policies) {
    assert.equal(policy.hash, await policyHash(policy))
    assert.equal(await policyHash({ ...policy, state: 'rejected' }), policy.hash)
    assert.notEqual(await policyHash({ ...policy, condition: { ...policy.condition, fraudThreshold: '1.00' } }), policy.hash)
  }
})

test('draft creation pins a new immutable configuration without editing the source or operational fixtures', async () => {
  const before = createPolicyWorkspace(), original = structuredClone(before), fixturesBefore = structuredClone(seed)
  const parent = before.policies[0]
  const next = await apply(before, { kind: 'create', parentId: parent.id, namespace: 'risk-review', currency: 'USD', condition: { ...parent.condition, fraudThreshold: '9007199254740993.01' }, rationale: 'Propose a separate exact USD amount review rule.' })
  assert.deepEqual(before, original)
  assert.equal(next.policies.length, 4)
  assert.equal(next.policies[3].id, 'POL-SYN-06')
  assert.equal(next.policies[3].state, 'draft')
  assert.equal(next.policies[3].parentId, parent.id)
  assert.equal(next.policies[3].hash, await policyHash(next.policies[3]))
  assert.deepEqual(seed, fixturesBefore)
  await rejects(() => apply(before, { kind: 'create', parentId: parent.id, namespace: 'risk-demo', currency: 'SYN', condition: { ...parent.condition, fraudThreshold: '1e6' }, rationale: 'A rationale with enough characters.' }), 'validation')
})

test('submit, independent approval and rejection follow the lifecycle; creator and submitter cannot self-review', async () => {
  const before = createPolicyWorkspace(), hash = before.policies[2].hash
  const submitted = await apply(before, { kind: 'submit', policyId: 'POL-SYN-05', rationale: 'Submit these frozen conditions for an independent review.' })
  assert.equal(submitted.policies[2].state, 'submitted')
  assert.equal(submitted.policies[2].submitter, 'demo-author')
  await rejects(() => apply(submitted, { kind: 'review', policyId: 'POL-SYN-05', decision: 'approved', rationale: 'Attempt a self review, which must fail.' }), 'permission')
  const reviewed = await apply(submitted, { kind: 'review', actor: 'demo-checker', policyId: 'POL-SYN-05', decision: 'rejected', rationale: 'Reject until broader point-in-time inputs are supplied.' })
  assert.equal(reviewed.policies[2].state, 'rejected')
  assert.equal(reviewed.policies[2].hash, hash)
  assert.equal(reviewed.policies[2].approver, 'demo-checker')
  assert.match(reviewed.policies[2].reviewRationale, /broader/)
  await rejects(() => apply(reviewed, { kind: 'submit', policyId: 'POL-SYN-05', rationale: 'Cannot resubmit the same rejected configuration.' }), 'validation')
  await rejects(() => apply(before, { kind: 'review', actor: 'demo-checker', policyId: 'POL-SYN-05', decision: 'approved', rationale: 'Drafts cannot be approved without submission.' }), 'validation')
})

test('capabilities, stale workspace versions and duplicate action references fail without partial publication', async () => {
  const before = createPolicyWorkspace(), original = structuredClone(before)
  await rejects(() => apply(before, { kind: 'submit', actor: 'demo-auditor', policyId: 'POL-SYN-05', rationale: 'Auditors cannot submit local policy drafts.' }), 'permission')
  const cmd = command(before, { kind: 'submit', policyId: 'POL-SYN-05', rationale: 'Submit for independent review.' })
  const next = await applyPolicyCommand(before, cmd)
  await rejects(() => applyPolicyCommand(next, cmd), 'conflict')
  await rejects(() => applyPolicyCommand(next, { ...cmd, expectedVersion: next.version }), 'conflict')
  assert.deepEqual(before, original)
  assert.equal(next.history.at(-1).policyId, 'POL-SYN-05')
})

test('activation requires approval, literal scope and reviewed generation; conflict simulation requires refresh', async () => {
  const initial = createPolicyWorkspace()
  await rejects(() => apply(initial, bindingAction()), 'validation')
  const reviewed = await approved(initial)
  await rejects(() => apply(reviewed, bindingAction({ institution: 'ALL' })), 'permission')
  await rejects(() => apply(reviewed, bindingAction({ currency: 'USD', expectedGeneration: 0 })), 'validation')
  const conflict = await apply(reviewed, { kind: 'simulate_conflict', actor: 'demo-activator', institution: 'INST-DEMO-A', namespace: 'risk-demo', currency: 'SYN' })
  await rejects(() => apply(conflict, bindingAction()), 'conflict')
  const next = await apply(conflict, bindingAction({ expectedGeneration: 2 }))
  assert.equal(findPolicyBinding(next, 'INST-DEMO-A', 'risk-demo', 'SYN').generation, 3)
  assert.equal(findPolicyBinding(next, 'INST-DEMO-A', 'risk-demo', 'SYN').policyId, 'POL-SYN-04')
  assert.equal(findPolicyBinding(next, 'INST-DEMO-B', 'risk-demo', 'SYN').policyId, 'POL-SYN-03')
})

test('rollback accepts a previously selected approved version in the exact binding scope and keeps jobs frozen', async () => {
  const initial = await approved(createPolicyWorkspace()), job = structuredClone(initial.jobs[0])
  const activated = await apply(initial, bindingAction())
  const captured = await apply(activated, { kind: 'enqueue_preview', actor: 'demo-activator', institution: 'INST-DEMO-A', namespace: 'risk-demo', currency: 'SYN', expectedGeneration: 2 })
  assert.equal(captured.jobs.at(-1).policy.id, 'POL-SYN-04')
  const rolledBack = await apply(captured, bindingAction({ kind: 'rollback', policyId: 'POL-SYN-03', expectedGeneration: 2 }))
  assert.equal(findPolicyBinding(rolledBack, 'INST-DEMO-A', 'risk-demo', 'SYN').policyId, 'POL-SYN-03')
  assert.equal(findPolicyBinding(rolledBack, 'INST-DEMO-A', 'risk-demo', 'SYN').generation, 3)
  assert.deepEqual(rolledBack.jobs[0], job)
  assert.equal(rolledBack.jobs.at(-1).receipt.policyHash, captured.policies[1].hash)
  assert.equal(rolledBack.jobs.at(-1).receipt.generation, 2)
  const noHistory = { ...initial, history: [] }
  await rejects(() => apply(noHistory, bindingAction({ kind: 'rollback' })), 'validation')
})

test('policy comparison pins 1–20 exact assessment revisions, keeps null dimensions and never mutates operational data', () => {
  const state = createPolicyWorkspace(), original = structuredClone(seed)
  const scope = { institution: 'INST-DEMO-A', range: '7d', asOf: seed._meta.data_as_of }
  const ids = seed.assessments.filter((item) => item.institution_id === scope.institution).map((item) => item.id)
  const report = comparePolicyVersions(state.policies[0], state.policies[1], seed.assessments, seed.transactions, ids, scope, 'DEMO-COMPARISON', '2026-10-23T07:00:00Z')
  assert.equal(report.rows.length, ids.length)
  assert.ok(report.rows.every((row) => row.baseline.mule.index === null && row.candidate.mule.index === null))
  assert.ok(report.rows.some((row) => row.candidate.fraud.index === 0))
  assert.equal(report.rows[0].assessment.input_fingerprint, seed.assessments[0].input_fingerprint)
  assert.equal(report.rows[0].transaction.revision, seed.assessments[0].revision)
  state.policies[1].condition.fraudThreshold = '1.00'
  assert.equal(report.candidate.condition.fraudThreshold, '800000.00')
  assert.deepEqual(seed, original)
  const compare = (selected, overrides = {}) => comparePolicyVersions(state.policies[0], state.policies[1], seed.assessments, seed.transactions, selected, { ...scope, ...overrides }, 'bad', '2026-10-23T07:00:00Z')
  assert.throws(() => compare([]), /1–20/)
  assert.throws(() => compare([ids[0], ids[0]]), /distinct/)
  assert.throws(() => compare(Array.from({ length: 21 }, (_, i) => `ASM-${i}`)), /1–20/)
  assert.throws(() => compare([seed.assessments.find((item) => item.institution_id !== scope.institution).id]), /scope/)
  const mismatched = structuredClone(seed.assessments); mismatched[0].revision = 999
  assert.throws(() => comparePolicyVersions(state.policies[0], state.policies[1], mismatched, seed.transactions, [mismatched[0].id], scope, 'bad', '2026-10-23T07:00:00Z'), /revision/)
})

test('policy filters combine state, namespace, reviewer, version and inclusive UTC update dates', () => {
  const state = createPolicyWorkspace()
  const results = filterPolicies(state.policies, { ...DEFAULT_POLICY_FILTERS, status: 'submitted', namespace: 'risk-demo', currency: 'SYN', creator: 'demo-author', approver: 'none', version: '4', from: '2026-10-22', to: '2026-10-22' })
  assert.deepEqual(results.map((policy) => policy.id), ['POL-SYN-04'])
  assert.equal(filterPolicies(state.policies, { ...DEFAULT_POLICY_FILTERS, search: state.policies[0].hash }).length, 1)
})
