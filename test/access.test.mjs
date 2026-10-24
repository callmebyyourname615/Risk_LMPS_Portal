import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ACCESS_CAPABILITIES, ACCESS_PERSONAS, ACCESS_ROUTES, AccessError, allowsInstitution, assertDemoMutation, capabilityState, createAccessSession, decideAccess, decideRouteAccess, resetAccessSession, setDemoSessionStatus, switchAccessInstitution, switchAccessPersona } from '../src/access.ts'
import { applyAlertCommand, createAlertWorkspace } from '../src/alert-state.ts'
import { applyPolicyCommand, createPolicyWorkspace } from '../src/policies.ts'
const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const at = '2026-10-23T07:00:00Z'
const as = (id, session = createAccessSession()) => switchAccessPersona(session, id, session.version, at)
const rejects = (callback, code = 'permission') => assert.throws(callback, (error) => error instanceof AccessError && error.code === code)

test('default demo access is institution A; visible routes and forged filters cannot grant B or ALL', () => {
  const session = createAccessSession(), before = structuredClone(session)
  assert.equal(decideRouteAccess(session, '/transactions/TX-SYN-1001').allowed, true)
  assert.equal(allowsInstitution(session, 'INST-DEMO-B'), false)
  assert.equal(allowsInstitution(session, 'ALL'), false)
  rejects(() => switchAccessInstitution(session, 'INST-DEMO-B', session.version, at))
  rejects(() => switchAccessInstitution(session, 'ALL', session.version, at))
  rejects(() => switchAccessPersona(session, 'ADMIN-FORGED', session.version, at))
  assert.equal(decideAccess({ ...session, personaId: 'FORGED' }, 'read_access').allowed, false)
  assert.deepEqual(session, before)
})

test('network scope requires both explicit membership and capability, and narrows atomically on a persona change', () => {
  const supervisor = as('network-supervisor')
  assert.equal(supervisor.institution, 'INST-DEMO-A')
  assert.equal(allowsInstitution(supervisor, 'ALL'), true)
  const wide = switchAccessInstitution(supervisor, 'ALL', supervisor.version, at)
  const narrowed = as('analyst', wide)
  assert.equal(narrowed.institution, 'INST-DEMO-A')
  assert.equal(decideAccess(narrowed, 'network_wide', 'ALL').allowed, false)
  assert.ok(narrowed.version > wide.version)
})

test('operator has operations access but cannot open banking evidence, including direct detail routes', () => {
  const operator = as('operator')
  for (const route of ['/datasets', '/health', '/notifications', '/audit', '/access']) assert.equal(decideRouteAccess(operator, route).allowed, true, route)
  for (const route of ['/overview', '/transactions/TX-SYN-1001', '/assessments/ASM-SYN-1001', '/alerts/ALT-SYN-1001', '/cases/CASE-SYN-1001', '/network', '/models']) assert.equal(decideRouteAccess(operator, route).allowed, false, route)
  assert.equal(ACCESS_ROUTES.length, 15)
  assert.equal(decideRouteAccess(operator, '/unregistered/private').allowed, false)
})

test('expired and revoked demos deny data/actions but retain own-access inspection and explicit recovery', () => {
  for (const status of ['expired', 'revoked']) {
    const active = createAccessSession(), inactive = setDemoSessionStatus(active, status, active.version, at)
    assert.equal(decideRouteAccess(inactive, '/access').allowed, true)
    assert.equal(decideRouteAccess(inactive, '/alerts').allowed, false)
    rejects(() => assertDemoMutation(inactive, 'alert', { kind: 'acknowledge', actor: 'actor-analyst-a', institution: 'INST-DEMO-A' }, ['INST-DEMO-A']))
    assert.equal(as('network-supervisor', inactive).status, status)
    const restored = resetAccessSession(inactive, inactive.version, at)
    assert.equal(restored.status, 'active'); assert.equal(restored.personaId, 'analyst')
    assert.ok(restored.version > inactive.version)
  }
})

test('auditor actions and request-body actor/scope overrides are rejected before operational state changes', () => {
  const initial = createAlertWorkspace(seed), before = structuredClone(initial), session = createAccessSession()
  const command = { kind: 'acknowledge', alertId: 'ALT-SYN-1001', expectedVersion: 1, institution: 'INST-DEMO-A', actor: 'actor-analyst-a', requestId: 'ACCESS-ACK', at }
  rejects(() => assertDemoMutation(as('auditor'), 'alert', { ...command, actor: 'actor-auditor' }, ['INST-DEMO-A']))
  rejects(() => assertDemoMutation(session, 'alert', { ...command, actor: 'actor-reviewer-a' }, ['INST-DEMO-A']))
  rejects(() => assertDemoMutation(session, 'alert', { ...command, institution: 'ALL' }, ['INST-DEMO-A']))
  rejects(() => assertDemoMutation(session, 'alert', command, ['INST-DEMO-B']))
  rejects(() => assertDemoMutation(session, 'alert', { ...command, kind: 'unregistered_action' }, ['INST-DEMO-A']))
  assert.deepEqual(initial, before)
  assertDemoMutation(session, 'alert', command, ['INST-DEMO-A'])
  assert.equal(applyAlertCommand(initial, command).alerts.find((alert) => alert.id === command.alertId).state, 'acknowledged')
})

test('policy maker/checker separation is enforced by the shared adapter and the existing immutable lifecycle', async () => {
  const author = as('policy-maker'), checker = as('policy-checker'), initial = createPolicyWorkspace()
  const review = { kind: 'review', policyId: 'POL-SYN-04', decision: 'approved', actor: 'demo-checker', expectedVersion: initial.version, requestId: 'ACCESS-POLICY', at, rationale: 'Independent review of this immutable demo policy.' }
  rejects(() => assertDemoMutation(author, 'policy', { ...review, actor: 'demo-author' }, []))
  assertDemoMutation(checker, 'policy', review, [])
  const approved = await applyPolicyCommand(initial, review)
  assert.equal(approved.policies[1].state, 'approved')
  assert.equal(initial.policies[1].state, 'submitted')
  const changed = as('auditor', checker)
  rejects(() => assertDemoMutation(changed, 'policy', review, [], checker.version), 'conflict')
})

test('fixture reset cannot silently mutate cross-institution demo state from a narrow scope', () => {
  const session = createAccessSession(), supervisor = as('network-supervisor')
  rejects(() => assertDemoMutation(session, 'alert', { kind: 'reset', actor: 'actor-analyst-a', institution: 'INST-DEMO-A' }, []))
  rejects(() => assertDemoMutation(supervisor, 'alert', { kind: 'reset', actor: 'actor-reviewer-a', institution: 'INST-DEMO-A' }, []))
  const wide = switchAccessInstitution(supervisor, 'ALL', supervisor.version, at)
  assertDemoMutation(wide, 'alert', { kind: 'reset', actor: 'actor-reviewer-a', institution: 'ALL' }, [])
})

test('planned entitlements and training exports stay unavailable for every demo persona', () => {
  for (const profile of ACCESS_PERSONAS) {
    const session = as(profile.id)
    for (const capability of ['manage_entitlements', 'export_training']) {
      assert.equal(capabilityState(profile, capability), 'planned')
      assert.equal(decideAccess(session, capability).allowed, false)
    }
    assert.ok(profile.capabilities.every((id) => ACCESS_CAPABILITIES.some((capability) => capability.id === id)))
  }
})

test('stale access updates conflict and local scenario history is bounded without storing credentials', () => {
  let session = createAccessSession()
  const oldVersion = session.version
  session = as('reviewer', session)
  rejects(() => switchAccessInstitution(session, 'INST-DEMO-A', oldVersion, at), 'conflict')
  for (let index = 0; index < 105; index++) session = setDemoSessionStatus(session, index % 2 ? 'active' : 'expired', session.version, at)
  assert.equal(session.events.length, 100)
  assert.ok(session.events.every((event) => event.detail && event.at))
  assert.equal('token' in session, false)
  assert.equal('password' in session, false)
})
