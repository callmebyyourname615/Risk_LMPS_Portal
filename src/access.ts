// One mock authorization adapter for the portal. These are proposed demo capabilities, not IdP claims.
export const ACCESS_CAPABILITIES = [
  { id: 'read_overview', label: 'Read overview', group: 'Monitoring', detail: 'Scoped workspace summary.', conditional: false, planned: false },
  { id: 'read_monitoring', label: 'Read transaction & alert evidence', group: 'Monitoring', detail: 'Transaction, assessment and alert records in the selected institution.', conditional: false, planned: false },
  { id: 'read_network', label: 'Explore a bounded network', group: 'Monitoring', detail: 'Synthetic graph within authorized institutions and query bounds.', conditional: true, planned: false },
  { id: 'network_wide', label: 'Use network-wide institution scope', group: 'Monitoring', detail: 'Explicit multi-institution permission; a visible menu never grants it.', conditional: true, planned: false },
  { id: 'alert_acknowledge', label: 'Acknowledge an alert', group: 'Monitoring', detail: 'An open alert, current version and matching institution are required.', conditional: true, planned: false },
  { id: 'alert_review', label: 'Record an alert opinion', group: 'Monitoring', detail: 'Acknowledged alert; opinion stays unverified.', conditional: true, planned: false },
  { id: 'read_cases', label: 'Read cases & outcomes', group: 'Investigations', detail: 'Institution-scoped case evidence and unverified opinions.', conditional: false, planned: false },
  { id: 'case_create_link', label: 'Create a case / link evidence', group: 'Investigations', detail: 'Same institution, unique alert ownership and bounded evidence.', conditional: true, planned: false },
  { id: 'case_assign', label: 'Assign case reviewers', group: 'Investigations', detail: 'Separate assignment capability; changes invalidate opinion freshness.', conditional: true, planned: false },
  { id: 'case_work', label: 'Work an assigned case', group: 'Investigations', detail: 'Assigned reviewer, workflow state and expected version are checked again.', conditional: true, planned: false },
  { id: 'case_reopen', label: 'Reopen a closed case', group: 'Investigations', detail: 'Supervisor capability, closed state and a rationale are required.', conditional: true, planned: false },
  { id: 'read_catalog', label: 'Read detectors & policies', group: 'Detection', detail: 'Shared synthetic definitions; evidence remains institution scoped.', conditional: false, planned: false },
  { id: 'rule_author', label: 'Draft a typed detector version', group: 'Detection', detail: 'Local immutable draft preview, never arbitrary executable code.', conditional: true, planned: false },
  { id: 'policy_create', label: 'Create a policy draft', group: 'Detection', detail: 'New configuration version and hash; source is unchanged.', conditional: true, planned: false },
  { id: 'policy_submit', label: 'Submit a policy version', group: 'Detection', detail: 'Draft state and a recorded submission rationale.', conditional: true, planned: false },
  { id: 'policy_review', label: 'Independently approve / reject', group: 'Detection', detail: 'Submitted policy; neither creator nor submitter may review it.', conditional: true, planned: false },
  { id: 'policy_activate', label: 'Activate / roll back local binding', group: 'Detection', detail: 'Approved version, exact namespace/currency and expected generation.', conditional: true, planned: false },
  { id: 'policy_job', label: 'Capture a demo job receipt', group: 'Detection', detail: 'Approved local binding and frozen selection receipt only.', conditional: true, planned: false },
  { id: 'read_models', label: 'Inspect evaluation readiness', group: 'Detection', detail: 'Synthetic manifests and blocked readiness reports, not measured accuracy.', conditional: false, planned: false },
  { id: 'read_operations', label: 'Read data & operations', group: 'Operations', detail: 'Operational readiness does not grant banking evidence or raw source access.', conditional: false, planned: false },
  { id: 'simulate_intake', label: 'Create invented intake metadata', group: 'Operations', detail: 'Known synthetic sample only; no real file content or source connection.', conditional: true, planned: false },
  { id: 'simulate_import', label: 'Simulate staging checkpoints', group: 'Operations', detail: 'Bounded local demo checkpoints and reconciliation; no browser write API is implied.', conditional: true, planned: false },
  { id: 'simulate_replay', label: 'Run invented offline replay', group: 'Operations', detail: 'Reconciled demo staging only; no canonical records, alerts or payment effects.', conditional: true, planned: false },
  { id: 'read_audit', label: 'Read authorized history', group: 'Administration', detail: 'Read-only scoped history; no audit editing capability.', conditional: false, planned: false },
  { id: 'export_audit_preview', label: 'Export visible synthetic audit rows', group: 'Administration', detail: 'At most 100 currently authorized redacted event rows; CSV preparation is recorded locally.', conditional: true, planned: false },
  { id: 'read_access', label: 'Inspect own access', group: 'Administration', detail: 'Read the demo identity, session status and proposed capability contract.', conditional: false, planned: false },
  { id: 'reset_demo_data', label: 'Reset synthetic workspace records', group: 'Administration', detail: 'Local fixture reset requires the Network Supervisor and explicit ALL scope; it does not reset production data.', conditional: true, planned: false },
  { id: 'manage_entitlements', label: 'Manage IdP entitlements', group: 'Administration', detail: 'Requires approved identity-provider and entitlement integration.', conditional: false, planned: true },
  { id: 'export_training', label: 'Export governed training labels', group: 'Investigations', detail: 'Requires eligible labels, adjudication, maturity, sampling and governed export.', conditional: false, planned: true },
] as const
export type AccessCapability = typeof ACCESS_CAPABILITIES[number]['id']
export type AccessPersona = { id: string; name: string; role: string; initials: string; subject: string; institutions: string[]; capabilities: AccessCapability[]; caseActor: string | null; policyActor: string | null }
const readers: AccessCapability[] = ['read_overview', 'read_monitoring', 'read_network', 'read_cases', 'read_catalog', 'read_models', 'read_operations', 'read_audit', 'read_access']
const caseWork: AccessCapability[] = ['alert_acknowledge', 'alert_review', 'case_create_link', 'case_work']
export const ACCESS_PERSONAS: AccessPersona[] = [
  { id: 'analyst', name: 'Noy Analyst', role: 'Analyst', initials: 'NA', subject: 'DEMO-SUBJECT-ANALYST', institutions: ['INST-DEMO-A'], capabilities: [...readers, ...caseWork], caseActor: 'actor-analyst-a', policyActor: null },
  { id: 'reviewer', name: 'Mali Reviewer', role: 'Reviewer', initials: 'MR', subject: 'DEMO-SUBJECT-REVIEWER', institutions: ['INST-DEMO-A'], capabilities: [...readers, ...caseWork, 'case_assign', 'case_reopen'], caseActor: 'actor-reviewer-a', policyActor: null },
  { id: 'policy-maker', name: 'Demo risk author', role: 'Policy Maker', initials: 'PM', subject: 'DEMO-SUBJECT-MAKER', institutions: ['INST-DEMO-A'], capabilities: [...readers, 'rule_author', 'policy_create', 'policy_submit'], caseActor: null, policyActor: 'demo-author' },
  { id: 'policy-checker', name: 'Demo independent checker', role: 'Policy Checker', initials: 'PC', subject: 'DEMO-SUBJECT-CHECKER', institutions: ['INST-DEMO-A'], capabilities: [...readers, 'policy_review'], caseActor: null, policyActor: 'demo-checker' },
  { id: 'policy-activator', name: 'Demo policy activator', role: 'Policy Activator', initials: 'PA', subject: 'DEMO-SUBJECT-ACTIVATOR', institutions: ['INST-DEMO-A'], capabilities: [...readers, 'policy_activate', 'policy_job'], caseActor: null, policyActor: 'demo-activator' },
  { id: 'operator', name: 'Demo data operator', role: 'Operator', initials: 'OP', subject: 'DEMO-SUBJECT-OPERATOR', institutions: ['INST-DEMO-A'], capabilities: ['read_operations', 'read_audit', 'read_access', 'simulate_intake', 'simulate_import', 'simulate_replay'], caseActor: null, policyActor: null },
  { id: 'auditor', name: 'Anou Auditor', role: 'Auditor', initials: 'AA', subject: 'DEMO-SUBJECT-AUDITOR', institutions: ['INST-DEMO-A'], capabilities: [...readers, 'export_audit_preview'], caseActor: 'actor-auditor', policyActor: 'demo-auditor' },
  { id: 'network-supervisor', name: 'Demo network supervisor', role: 'Network Supervisor', initials: 'NS', subject: 'DEMO-SUBJECT-NETWORK', institutions: ['INST-DEMO-A', 'INST-DEMO-B'], capabilities: [...readers, ...caseWork, 'case_assign', 'case_reopen', 'network_wide', 'reset_demo_data', 'export_audit_preview'], caseActor: 'actor-reviewer-a', policyActor: null },
]
export const ACCESS_ROUTES: { path: string; label: string; capability: AccessCapability }[] = [
  { path: '/overview', label: 'Overview', capability: 'read_overview' },
  { path: '/transactions', label: 'Transactions', capability: 'read_monitoring' },
  { path: '/assessments', label: 'Assessments', capability: 'read_monitoring' },
  { path: '/alerts', label: 'Alerts', capability: 'read_monitoring' },
  { path: '/network', label: 'Network Explorer', capability: 'read_network' },
  { path: '/cases', label: 'Cases', capability: 'read_cases' },
  { path: '/outcomes', label: 'Outcomes', capability: 'read_cases' },
  { path: '/detectors', label: 'Detector Catalog', capability: 'read_catalog' },
  { path: '/policies', label: 'Risk Policies', capability: 'read_catalog' },
  { path: '/models', label: 'Evaluation & Models', capability: 'read_models' },
  { path: '/datasets', label: 'Datasets & Imports', capability: 'read_operations' },
  { path: '/health', label: 'System Health', capability: 'read_operations' },
  { path: '/notifications', label: 'Notifications', capability: 'read_operations' },
  { path: '/audit', label: 'Audit', capability: 'read_audit' },
  { path: '/access', label: 'Access & Scope', capability: 'read_access' },
]
export type DemoSessionStatus = 'active' | 'expired' | 'revoked'
export type AccessSessionEvent = { id: string; at: string; action: string; detail: string }
export type AccessSession = { personaId: string; institution: string; status: DemoSessionStatus; version: number; events: AccessSessionEvent[] }
export class AccessError extends Error {
  code: 'permission' | 'conflict'
  constructor(code: AccessError['code'], message: string) { super(message); this.name = 'AccessError'; this.code = code }
}
export const getAccessPersona = (session: AccessSession) => ACCESS_PERSONAS.find((persona) => persona.id === session.personaId)
export function createAccessSession(): AccessSession { return { personaId: 'analyst', institution: 'INST-DEMO-A', status: 'active', version: 1, events: [] } }
export function allowsInstitution(session: AccessSession, institution: string) {
  const persona = getAccessPersona(session)
  if (!persona) return false
  return institution === 'ALL' ? persona.institutions.length > 1 && persona.capabilities.includes('network_wide') : persona.institutions.includes(institution)
}
export function capabilityState(persona: AccessPersona, capability: AccessCapability) {
  const definition = ACCESS_CAPABILITIES.find((item) => item.id === capability)
  if (!definition || definition.planned) return 'planned'
  return !persona.capabilities.includes(capability) ? 'denied' : definition.conditional ? 'conditional' : 'granted'
}
export function decideAccess(session: AccessSession, capability: string, institution = session.institution) {
  const persona = getAccessPersona(session), definition = ACCESS_CAPABILITIES.find((item) => item.id === capability)
  if (!persona || !definition) return { allowed: false, reason: 'No valid demo persona or known capability is available.' }
  if (session.status !== 'active' && capability !== 'read_access') return { allowed: false, reason: `The demo session is ${session.status}. Restore the demo session in Access & Scope to continue.` }
  if (!allowsInstitution(session, institution)) return { allowed: false, reason: institution === 'ALL' ? 'Network-wide scope requires explicit multi-institution permission. Visible navigation does not grant it.' : 'This institution is outside the selected demo persona’s allowed scope.' }
  if (definition.planned) return { allowed: false, reason: definition.detail }
  if (!persona.capabilities.includes(definition.id)) return { allowed: false, reason: 'The selected demo persona does not have this capability.' }
  return { allowed: true, reason: definition.conditional ? `Demo capability available; ${definition.detail}` : 'Available in the selected demo institution scope.' }
}
export function decideRouteAccess(session: AccessSession, route: string) {
  const path = route.split(/[?#]/)[0]
  const definition = ACCESS_ROUTES.find((item) => path === item.path || path.startsWith(`${item.path}/`))
  return definition ? decideAccess(session, definition.capability) : { allowed: false, reason: 'No authorization contract is registered for this route.' }
}
export function assertAccessCapability(session: AccessSession, capability: string, institution = session.institution) {
  const result = decideAccess(session, capability, institution)
  if (!result.allowed) throw new AccessError('permission', result.reason)
}
function transition(session: AccessSession, expectedVersion: number, change: Partial<AccessSession>, at: string, action: string, detail: string): AccessSession {
  if (session.version !== expectedVersion) throw new AccessError('conflict', 'The demo access context changed. Review the current persona and scope before retrying.')
  if (!Number.isFinite(Date.parse(at))) throw new AccessError('permission', 'A valid demo action timestamp is required.')
  const version = session.version + 1
  return { ...session, ...change, version, events: [...session.events.slice(-99), { id: `DEMO-ACCESS-${version}`, at, action, detail }] }
}
export function switchAccessPersona(session: AccessSession, personaId: string, expectedVersion: number, at: string) {
  const persona = ACCESS_PERSONAS.find((item) => item.id === personaId)
  if (!persona) throw new AccessError('permission', 'Choose a known proposed demo persona.')
  const prospective = { ...session, personaId }
  const institution = allowsInstitution(prospective, session.institution) ? session.institution : persona.institutions[0]
  return transition(session, expectedVersion, { personaId, institution }, at, 'persona_changed', `Demo persona changed to ${persona.role}; selected scope: ${institution}. No real entitlement was changed.`)
}
export function switchAccessInstitution(session: AccessSession, institution: string, expectedVersion: number, at: string) {
  assertAccessCapability(session, 'read_access', institution)
  if (session.status !== 'active') throw new AccessError('permission', 'Restore the demo session before changing its selected institution.')
  return transition(session, expectedVersion, { institution }, at, 'institution_changed', `Demo institution filter changed to ${institution}; allowed institutions were not expanded.`)
}
export function setDemoSessionStatus(session: AccessSession, status: DemoSessionStatus, expectedVersion: number, at: string) {
  if (!['active', 'expired', 'revoked'].includes(status)) throw new AccessError('permission', 'Choose a known demo session scenario.')
  return transition(session, expectedVersion, { status }, at, 'session_preview_changed', `Local session scenario: ${status}. This is not an IdP authentication or revocation operation.`)
}
export function resetAccessSession(session: AccessSession, expectedVersion: number, at: string) {
  return transition(session, expectedVersion, { personaId: 'analyst', institution: 'INST-DEMO-A', status: 'active' }, at, 'demo_access_reset', 'Demo access restored to Analyst / Institution A. Investigation and policy records were not reset.')
}
const MUTATION_CAPABILITIES: Record<string, Record<string, AccessCapability>> = {
  alert: { acknowledge: 'alert_acknowledge', review: 'alert_review', create_case: 'case_create_link', link_case: 'case_create_link', reset: 'reset_demo_data' },
  case: { create: 'case_create_link', link_alert: 'case_create_link', assign: 'case_assign', start_review: 'case_work', add_note: 'case_work', outcomes: 'case_work', close: 'case_work', reopen: 'case_reopen' },
  policy: { create: 'policy_create', submit: 'policy_submit', review: 'policy_review', activate: 'policy_activate', rollback: 'policy_activate', simulate_conflict: 'policy_activate', enqueue_preview: 'policy_job' },
  detector: { draft: 'rule_author' },
  dataset: { add_demo_batch: 'simulate_intake', advance_import: 'simulate_import', reconcile: 'simulate_import', replay: 'simulate_replay' },
  audit: { export: 'export_audit_preview' },
}
/** Receives the root-owned demo context, plus ownership from stored records; request bodies cannot grant scopes or impersonate actors. */
export function assertDemoMutation(session: AccessSession, domain: string, command: { kind: string; actor?: string; institution?: string }, resourceInstitutions: string[], expectedSessionVersion = session.version) {
  if (expectedSessionVersion !== session.version) throw new AccessError('conflict', 'The demo persona or institution changed while the action was being prepared. Review before retrying.')
  const capability = MUTATION_CAPABILITIES[domain]?.[command.kind]
  if (!capability) throw new AccessError('permission', 'This action has no registered mock capability contract.')
  assertAccessCapability(session, capability)
  if (domain === 'alert' && command.kind === 'reset' && session.institution !== 'ALL') throw new AccessError('permission', 'Select the explicitly authorized ALL scope before resetting cross-institution demo fixtures.')
  const persona = getAccessPersona(session)!
  const actor = domain === 'policy' ? persona.policyActor : ['detector', 'dataset', 'audit'].includes(domain) ? persona.subject : persona.caseActor
  if (!actor || command.actor !== actor) throw new AccessError('permission', 'The action actor must match the current demo context. A request body cannot override identity.')
  if ((domain === 'alert' || domain === 'case' || domain === 'dataset') && command.institution !== session.institution) throw new AccessError('permission', 'The action scope no longer matches the selected demo institution. Review the current scope.')
  if (domain === 'policy' && command.institution && command.institution !== 'ALL') resourceInstitutions = [...resourceInstitutions, command.institution]
  for (const owner of resourceInstitutions) {
    if (!allowsInstitution(session, owner) || (session.institution !== 'ALL' && owner !== session.institution)) throw new AccessError('permission', 'The stored record belongs to an institution outside the current demo scope.')
  }
}
export const ACCESS_PREREQUISITES = [
  { id: 'idp', group: 'Identity', title: 'Approved identity provider', reason: 'Issuer, audience, signing keys and authenticated server subject are not connected in this browser prototype.', status: 'Not configured' },
  { id: 'directory', group: 'Identity', title: 'Verified entitlement directory', reason: 'Production roles, group claims, owners and institution authority have not been supplied.', status: 'Not supplied' },
  { id: 'revocation', group: 'Session', title: 'Expiry & revocation evidence', reason: 'Real token expiry, refresh and revocation checks require server and identity-provider integration.', status: 'Planned' },
  { id: 'scope', group: 'Scope', title: 'Institution, case & network authorization', reason: 'The backend must recheck stored ownership and explicit network-wide permission on every read and action.', status: 'Integration pending' },
  { id: 'ownership', group: 'Scope', title: 'Routing and account ownership mapping', reason: 'Routing membership is not account ownership. Verified account identities and authority boundaries remain unresolved.', status: 'Unverified' },
  { id: 'separation', group: 'Governance', title: 'Independent review & access audit', reason: 'Production maker–checker assignments, entitlement change approval and protected audit need approved governance.', status: 'Approval pending' },
]
