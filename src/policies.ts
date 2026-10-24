import { decimalUnits, scopedDetectorTransactions, type DetectorTransaction } from './detectors.ts'

// Governance metadata and conditions are illustrative extensions of the three portal fixture IDs.
export const POLICY_ACTORS = [
  { id: 'demo-author', name: 'Demo risk author', role: 'Author', capabilities: ['create', 'submit', 'compare'] },
  { id: 'demo-checker', name: 'Demo independent checker', role: 'Checker', capabilities: ['review', 'compare'] },
  { id: 'demo-activator', name: 'Demo policy activator', role: 'Activator', capabilities: ['activate', 'compare', 'enqueue'] },
  { id: 'demo-auditor', name: 'Demo auditor', role: 'Auditor', capabilities: ['compare'] },
] as const
export type PolicyState = 'draft' | 'submitted' | 'approved' | 'rejected'
export type PolicyCondition = { operator: 'amount_gte'; fraudThreshold: string; amlThreshold: string; lifecycle: 'completed' | 'attempted' }
export type RiskPolicy = {
  id: string; version: number; namespace: string; currency: string; condition: PolicyCondition
  catalogVersion: string; engineVersion: string; hash: string; state: PolicyState
  creator: string; submitter: string | null; approver: string | null
  createdAt: string; updatedAt: string; rationale: string; reviewRationale: string | null; parentId: string | null
}
export type PolicyBinding = { institution: string; namespace: string; currency: string; policyId: string; generation: number }
export type PolicyEvent = { id: string; kind: string; policyId: string; actor: string; at: string; rationale: string; binding: PolicyBinding | null; previousPolicyId: string | null }
export type PolicyJob = { id: string; acceptedAt: string; policy: RiskPolicy; receipt: PolicyBinding & { policyHash: string }; mode: 'local_preview' }
export type PolicyWorkspace = { version: number; policies: RiskPolicy[]; bindings: PolicyBinding[]; history: PolicyEvent[]; jobs: PolicyJob[] }
export class PolicyError extends Error {
  code: 'validation' | 'permission' | 'conflict'
  constructor(code: PolicyError['code'], message: string) { super(message); this.name = 'PolicyError'; this.code = code }
}
const fail = (message: string): never => { throw new PolicyError('validation', message) }
const at = '2026-10-23T07:00:00Z'
export function policyActorName(id: string | null) { return POLICY_ACTORS.find((actor) => actor.id === id)?.name ?? 'Not recorded' }
export function canPolicy(actor: string, capability: string) {
  return POLICY_ACTORS.find((item) => item.id === actor)?.capabilities.some((item) => item === capability) ?? false
}
function requireCapability(actor: string, capability: string) {
  if (!canPolicy(actor, capability)) throw new PolicyError('permission', `The selected demo persona cannot ${capability} policies.`)
}
function validateCondition(condition: PolicyCondition, currency: string, namespace: string) {
  if (condition.operator !== 'amount_gte') fail('Only typed amount_gte conditions are supported in this local preview.')
  for (const threshold of [condition.fraudThreshold, condition.amlThreshold]) {
    try { if (decimalUnits(threshold) <= 0n) fail('Both thresholds must be greater than zero.') } catch (failure) { fail(failure instanceof Error ? failure.message : 'Invalid threshold.') }
  }
  if (!['SYN', 'USD', 'THB'].includes(currency)) fail('Select a supported literal currency: SYN, USD or THB.')
  if (!['completed', 'attempted'].includes(condition.lifecycle)) fail('Select completed or attempted lifecycle.')
  if (!/^[a-z][a-z0-9/-]{2,39}$/.test(namespace)) fail('Namespace must be 3–40 lowercase letters, digits, slashes or hyphens, starting with a letter.')
}
function rationale(value: string) { if (value.trim().length < 8 || value.trim().length > 1000) fail('Provide a rationale of 8–1000 characters.'); return value.trim() }
export async function policyHash(policy: Pick<RiskPolicy, 'id' | 'version' | 'namespace' | 'currency' | 'condition' | 'catalogVersion' | 'engineVersion'>) {
  const payload = JSON.stringify({ id: policy.id, version: policy.version, namespace: policy.namespace, currency: policy.currency,
    condition: { operator: policy.condition.operator, fraudThreshold: policy.condition.fraudThreshold, amlThreshold: policy.condition.amlThreshold, lifecycle: policy.condition.lifecycle },
    catalogVersion: policy.catalogVersion, engineVersion: policy.engineVersion })
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return `sha256:${[...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}
export function createPolicyWorkspace(): PolicyWorkspace {
  const policies: RiskPolicy[] = [
    { id: 'POL-SYN-03', version: 3, state: 'approved', condition: { operator: 'amount_gte', fraudThreshold: '1000000.00', amlThreshold: '200000.00', lifecycle: 'completed' }, hash: 'sha256:5b8b6a2dea78e7bb9b282b3a015c0c13cfe652f263c5063b8b1e592a6a31b888', approver: 'demo-checker', submitter: 'demo-author', rationale: 'Illustrative baseline for the local policy binding.' },
    { id: 'POL-SYN-04', version: 4, state: 'submitted', condition: { operator: 'amount_gte', fraudThreshold: '800000.00', amlThreshold: '150000.00', lifecycle: 'completed' }, hash: 'sha256:ef17935e5a5303a6abe6ebad5efa169d6cca3f199874db4800fd28f7c09e9834', approver: null, submitter: 'demo-author', rationale: 'Illustrative proposal for independent checker review.' },
    { id: 'POL-SYN-05', version: 5, state: 'draft', condition: { operator: 'amount_gte', fraudThreshold: '600000.00', amlThreshold: '100000.00', lifecycle: 'completed' }, hash: 'sha256:a02e900275ec4218f9ac7baa675cc4e25f6afe9cb0372cb5d89e38fea033615b', approver: null, submitter: null, rationale: 'Illustrative draft for testing a typed rule proposal.' },
  ].map((item, index) => ({ ...item, state: item.state as PolicyState, condition: item.condition as PolicyCondition, namespace: 'risk-demo', currency: 'SYN', creator: 'demo-author', catalogVersion: 'DEMO-CATALOG-01', engineVersion: 'DEMO-TYPED-EVALUATOR-01', createdAt: `2026-10-${21 + index}T02:00:00Z`, updatedAt: `2026-10-${21 + index}T03:00:00Z`, reviewRationale: item.approver ? 'Illustrative independent approval of the baseline configuration.' : null, parentId: index ? `POL-SYN-0${index + 2}` : null }))
  const bindings = ['INST-DEMO-A', 'INST-DEMO-B'].map((institution) => ({ institution, namespace: 'risk-demo', currency: 'SYN', policyId: 'POL-SYN-03', generation: 1 }))
  const history: PolicyEvent[] = bindings.map((binding, index) => ({ id: `DEMO-PE-SEED-${index}`, kind: 'activate', actor: 'demo-activator', policyId: binding.policyId, at: '2026-10-22T03:00:00Z', rationale: 'Illustrative initial namespace binding.', binding: { ...binding }, previousPolicyId: null }))
  return { version: 1, policies, bindings, history, jobs: [{ id: 'JOB-DEMO-POLICY-1001', acceptedAt: at, mode: 'local_preview', policy: structuredClone(policies[0]), receipt: { ...bindings[0], policyHash: policies[0].hash } }] }
}
type CommonCommand = { actor: string; expectedVersion: number; at: string; requestId: string }
export type PolicyCommand = CommonCommand & (
  | { kind: 'create'; parentId: string; namespace: string; currency: string; condition: PolicyCondition; rationale: string }
  | { kind: 'submit'; policyId: string; rationale: string }
  | { kind: 'review'; policyId: string; decision: 'approved' | 'rejected'; rationale: string }
  | { kind: 'activate' | 'rollback'; policyId: string; institution: string; namespace: string; currency: string; expectedGeneration: number; rationale: string }
  | { kind: 'simulate_conflict'; institution: string; namespace: string; currency: string }
  | { kind: 'enqueue_preview'; institution: string; namespace: string; currency: string; expectedGeneration: number }
)
export type PolicyAction = PolicyCommand extends infer C ? C extends PolicyCommand ? Omit<C, keyof CommonCommand> : never : never
export function findPolicyBinding(workspace: PolicyWorkspace, institution: string, namespace: string, currency: string) {
  return workspace.bindings.find((item) => item.institution === institution && item.namespace === namespace && item.currency === currency)
}
export async function applyPolicyCommand(workspace: PolicyWorkspace, command: PolicyCommand): Promise<PolicyWorkspace> {
  if (command.expectedVersion !== workspace.version) throw new PolicyError('conflict', 'The policy workspace changed. Refresh before repeating the action.')
  if (!command.requestId || !Number.isFinite(Date.parse(command.at))) fail('An action reference and valid timestamp are required.')
  if (workspace.history.some((event) => event.id === command.requestId)) throw new PolicyError('conflict', 'This action reference was already used. Refresh the workspace.')
  const next = structuredClone(workspace)
  let policyId = '', reason = '', binding: PolicyBinding | null = null, previousPolicyId: string | null = null
  if (command.kind === 'create') {
    requireCapability(command.actor, 'create')
    const parent = workspace.policies.find((item) => item.id === command.parentId) ?? fail('Select an existing source policy.')
    validateCondition(command.condition, command.currency, command.namespace)
    reason = rationale(command.rationale)
    const version = Math.max(...workspace.policies.map((item) => item.version)) + 1
    policyId = `POL-SYN-${String(version).padStart(2, '0')}`
    const policy: RiskPolicy = { ...structuredClone(parent), id: policyId, version, namespace: command.namespace, currency: command.currency, condition: { ...command.condition }, state: 'draft', creator: command.actor, submitter: null, approver: null, createdAt: command.at, updatedAt: command.at, rationale: reason, reviewRationale: null, parentId: parent.id, hash: '' }
    policy.hash = await policyHash(policy)
    next.policies.push(policy)
  } else if (command.kind === 'submit' || command.kind === 'review') {
    const policy = next.policies.find((item) => item.id === command.policyId) ?? fail('Policy version is unavailable.')
    policyId = policy.id; reason = rationale(command.rationale)
    if (command.kind === 'submit') {
      requireCapability(command.actor, 'submit')
      if (policy.state !== 'draft') fail('Only a draft can be submitted. Create a new version to revise frozen conditions.')
      policy.state = 'submitted'; policy.submitter = command.actor
    } else {
      if (command.actor === policy.creator || command.actor === policy.submitter) throw new PolicyError('permission', 'The creator or submitter cannot review their own policy. Select an independent checker.')
      requireCapability(command.actor, 'review')
      if (policy.state !== 'submitted') fail('Only a submitted policy can be approved or rejected.')
      if (!['approved', 'rejected'].includes(command.decision)) fail('Select approve or reject.')
      policy.state = command.decision; policy.approver = command.actor; policy.reviewRationale = reason
    }
    policy.updatedAt = command.at
  } else {
    requireCapability(command.actor, command.kind === 'enqueue_preview' ? 'enqueue' : 'activate')
    if (!['INST-DEMO-A', 'INST-DEMO-B'].includes(command.institution)) throw new PolicyError('permission', 'Select one authorized institution for the binding. ALL is not an activation scope.')
    const current = findPolicyBinding(next, command.institution, command.namespace, command.currency)
    const generation = current?.generation ?? 0
    if (command.kind === 'simulate_conflict') {
      if (!current) fail('Choose an existing binding to simulate a competing update.')
      current!.generation++; binding = { ...current! }; policyId = current!.policyId; previousPolicyId = policyId
      reason = 'Simulated competing binding update; refresh the reviewed generation before activation.'
    } else {
      if (command.expectedGeneration !== generation) throw new PolicyError('conflict', `Generation conflict: reviewed ${command.expectedGeneration}, current ${generation}. Refresh the binding before retrying.`)
      if (command.kind === 'enqueue_preview') {
        if (!current) fail('There is no active binding in this scope.')
        const policy = next.policies.find((item) => item.id === current!.policyId) ?? fail('Bound policy is unavailable.')
        if (policy.state !== 'approved') fail('Only an approved policy may be frozen into a demo job.')
        policyId = policy.id; binding = { ...current! }; reason = 'Captured a local job snapshot without dispatching an operational job.'
        next.jobs.push({ id: `JOB-${command.requestId}`, mode: 'local_preview', acceptedAt: command.at, policy: structuredClone(policy), receipt: { ...binding, policyHash: policy.hash } })
      } else {
        const policy = next.policies.find((item) => item.id === command.policyId) ?? fail('Policy version is unavailable.')
        if (policy.state !== 'approved') fail('Approve this immutable policy version before changing its local binding.')
        if (policy.namespace !== command.namespace || policy.currency !== command.currency) fail('Policy namespace and currency must match the explicit binding scope.')
        reason = rationale(command.rationale); policyId = policy.id; previousPolicyId = current?.policyId ?? null
        if (current?.policyId === policyId) fail('This policy is already selected in this binding.')
        if (command.kind === 'rollback' && !workspace.history.some((event) => event.binding?.institution === command.institution && event.binding.namespace === command.namespace && event.binding.currency === command.currency && event.policyId === policy.id && ['activate', 'rollback'].includes(event.kind))) fail('Rollback requires a previously selected approved version in this exact binding scope.')
        binding = { institution: command.institution, namespace: command.namespace, currency: command.currency, generation: generation + 1, policyId }
        if (current) Object.assign(current, binding); else next.bindings.push(binding)
      }
    }
  }
  next.history.push({ id: command.requestId, kind: command.kind === 'review' ? command.decision : command.kind, policyId, actor: command.actor, at: command.at, rationale: reason, binding, previousPolicyId })
  next.version++
  return next
}

export type PolicyFilters = { search: string; status: string; namespace: string; currency: string; creator: string; approver: string; version: string; from: string; to: string }
export const DEFAULT_POLICY_FILTERS: PolicyFilters = { search: '', status: 'all', namespace: 'all', currency: 'all', creator: 'all', approver: 'all', version: 'all', from: '', to: '' }
export function filterPolicies(policies: RiskPolicy[], filters: PolicyFilters) {
  const term = filters.search.trim().toLowerCase()
  return policies.filter((policy) => (!term || `${policy.id} ${policy.hash} ${policy.namespace} ${policy.rationale}`.toLowerCase().includes(term)) &&
    (filters.status === 'all' || policy.state === filters.status) && (filters.namespace === 'all' || policy.namespace === filters.namespace) &&
    (filters.currency === 'all' || policy.currency === filters.currency) && (filters.creator === 'all' || policy.creator === filters.creator) &&
    (filters.approver === 'all' || (filters.approver === 'none' ? policy.approver === null : policy.approver === filters.approver)) &&
    (filters.version === 'all' || policy.version === Number(filters.version)) && (!filters.from || policy.updatedAt.slice(0, 10) >= filters.from) && (!filters.to || policy.updatedAt.slice(0, 10) <= filters.to))
}
export type FrozenAssessment = {
  id: string; transaction_id: string; revision: number; institution_id: string; policy_id: string; input_fingerprint: string; created_at: string
  dimensions: { fraud: { index: number | null }; mule: { index: number | null }; aml: { index: number | null } }
}
type DimensionResult = { index: number | null; available: number; required: number; reason: string }
export type PolicyComparisonRow = { assessment: FrozenAssessment; transaction: DetectorTransaction; baseline: Record<'fraud' | 'mule' | 'aml', DimensionResult>; candidate: Record<'fraud' | 'mule' | 'aml', DimensionResult> }
export type PolicyComparison = { id: string; at: string; institution: string; range: string; asOf: string; baseline: RiskPolicy; candidate: RiskPolicy; rows: PolicyComparisonRow[]; baselineMatches: number; candidateMatches: number }
function evaluatePolicy(policy: RiskPolicy, tx: DetectorTransaction, assessment: FrozenAssessment): PolicyComparisonRow['baseline'] {
  const dimension = (name: 'fraud' | 'aml'): DimensionResult => {
    if (tx.currency !== policy.currency || tx.lifecycle !== policy.condition.lifecycle) return { index: null, available: 0, required: 1, reason: 'Outside the policy currency / lifecycle scope.' }
    if (assessment.dimensions[name].index === null) return { index: null, available: 0, required: 1, reason: 'Required dimension inputs were unavailable in the frozen run.' }
    try { return { index: decimalUnits(tx.amount) >= decimalUnits(name === 'fraud' ? policy.condition.fraudThreshold : policy.condition.amlThreshold) ? 1 : 0, available: 1, required: 1, reason: 'Illustrative amount-rule index, not the original frozen assessment score.' } }
    catch { return { index: null, available: 0, required: 1, reason: 'Exact transaction amount is unavailable.' } }
  }
  return { fraud: dimension('fraud'), mule: { index: null, available: 0, required: 3, reason: 'Verified account identity and required history are not supplied.' }, aml: dimension('aml') }
}
export function comparePolicyVersions(baseline: RiskPolicy, candidate: RiskPolicy, assessments: FrozenAssessment[], transactions: DetectorTransaction[], ids: string[], scope: { institution: string; range: string; asOf: string }, id: string, at: string): PolicyComparison {
  if (baseline.id === candidate.id) fail('Choose two different policy versions.')
  if (!ids.length || ids.length > 20 || new Set(ids).size !== ids.length) fail('Select 1–20 distinct frozen assessment runs.')
  validateCondition(baseline.condition, baseline.currency, baseline.namespace); validateCondition(candidate.condition, candidate.currency, candidate.namespace)
  const scoped = scopedDetectorTransactions(transactions, scope)
  const rows = ids.map((runId): PolicyComparisonRow => {
    const assessment = assessments.find((item) => item.id === runId) ?? fail('A selected frozen assessment is unavailable.')
    const tx = scoped.find((item) => item.id === assessment.transaction_id && item.revision === assessment.revision && item.institution_id === assessment.institution_id) ?? fail('A selected assessment revision is outside the current institution or time scope.')
    return { assessment: structuredClone(assessment), transaction: { ...tx }, baseline: evaluatePolicy(baseline, tx, assessment), candidate: evaluatePolicy(candidate, tx, assessment) }
  })
  const matches = (side: 'baseline' | 'candidate') => rows.filter((row) => [row[side].fraud.index, row[side].aml.index].some((value) => value !== null && value > 0)).length
  return { id, at, ...scope, baseline: structuredClone(baseline), candidate: structuredClone(candidate), rows, baselineMatches: matches('baseline'), candidateMatches: matches('candidate') }
}
