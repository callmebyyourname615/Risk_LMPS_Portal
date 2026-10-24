// Illustrative portal contracts, not the authoritative backend catalog of 15 detectors.
export type DetectorFamily = 'fraud' | 'mule' | 'aml'
export type AmountCondition = { kind: 'amount_gte'; threshold: string; currency: string; lifecycle: string }
export type ReferenceCondition = { kind: 'velocity_reference' | 'pass_through_reference'; window: string; parameter: string }
export type DetectorCondition = AmountCondition | ReferenceCondition
export type DetectorVersion = {
  version: number; condition: DetectorCondition; state: 'example' | 'local_draft'
  reference: string; parentVersion: number | null; rationale: string
}
export type DetectorDefinition = {
  code: string; reasonCode: string; family: DetectorFamily
  name: { en: string; lo: string }; description: { en: string; lo: string }
  inputs: { name: string; available: boolean; detail: string }[]
  limitations: string[]; featureVersion: string; versions: DetectorVersion[]
}

const amountInputs = () => [
  { name: 'Exact transaction amount', available: true, detail: 'Literal decimal string on the selected frozen revision.' },
  { name: 'Currency & lifecycle', available: true, detail: 'Compared literally; no exchange rate or cross-currency totals.' },
]
const amountVersions = (code: string, first: string, latest: string): DetectorVersion[] => [
  { version: 1, state: 'example', reference: `${code}:v1`, parentVersion: null, condition: { kind: 'amount_gte', threshold: first, currency: 'SYN', lifecycle: 'completed' }, rationale: 'Illustrative starting threshold; not a production rule.' },
  { version: 2, state: 'example', reference: `${code}:v2`, parentVersion: 1, condition: { kind: 'amount_gte', threshold: latest, currency: 'SYN', lifecycle: 'completed' }, rationale: 'Illustrative threshold change for version comparison.' },
]

export const DETECTOR_EXAMPLES: DetectorDefinition[] = [
  {
    code: 'DEMO-FRAUD-AMOUNT', reasonCode: 'DEMO_AMOUNT_SIGNAL', family: 'fraud',
    name: { en: 'Transaction amount signal', lo: 'ສັນຍານຈຳນວນເງິນທຸລະກຳ' },
    description: { en: 'Compare an exact amount with a typed threshold for one currency and lifecycle.', lo: 'ປຽບທຽບຈຳນວນເງິນກັບເກນທີ່ກຳນົດ ຕາມສະກຸນເງິນ ແລະ ສະຖານະ.' },
    inputs: amountInputs(), featureVersion: 'DEMO-AMOUNT-01', versions: amountVersions('DEMO-FRAUD-AMOUNT', '500000.00', '1000000.00'),
    limitations: ['Amount alone cannot establish fraud or intent.', 'This preview evaluator does not reproduce the frozen Fraud index in Assessments.'],
  },
  {
    code: 'DEMO-FRAUD-VELOCITY', reasonCode: 'DEMO_VELOCITY_SIGNAL', family: 'fraud',
    name: { en: 'Short-window activity', lo: 'ກິດຈະກຳໃນຊ່ວງເວລາສັ້ນ' },
    description: { en: 'Illustrate a bounded activity count with corrected, point-in-time event history.', lo: 'ຕົວຢ່າງການນັບກິດຈະກຳ ໂດຍໃຊ້ປະຫວັດເຫດການຕາມເວລາ.' },
    inputs: [
      { name: 'Transaction timestamp', available: true, detail: 'Occurred, observed and recorded timestamps are separate fixture fields.' },
      { name: 'Verified account identity', available: false, detail: 'Display references are not stable account keys.' },
      { name: 'Corrected event history', available: false, detail: 'Bounded point-in-time history and reversals have not been supplied.' },
    ], featureVersion: 'Not supplied',
    versions: [{ version: 1, state: 'example', reference: 'DEMO-FRAUD-VELOCITY:v1', parentVersion: null, condition: { kind: 'velocity_reference', window: '5 minutes', parameter: 'Illustrative count ≥ 5' }, rationale: 'Definition preview only; no velocity feature calculation is connected.' }],
    limitations: ['Unavailable history is never treated as zero activity.', 'Attempted and executed activity need separate windows and currency scope.'],
  },
  {
    code: 'DEMO-MULE-PASS-THROUGH', reasonCode: 'DEMO_IDENTITY_UNRESOLVED', family: 'mule',
    name: { en: 'Rapid pass-through pattern', lo: 'ຮູບແບບຮັບ ແລະ ສົ່ງຕໍ່ຢ່າງໄວ' },
    description: { en: 'Describe a time-bounded forwarding proxy with explicit identity and ledger prerequisites.', lo: 'ຕົວຢ່າງການສົ່ງເງິນຕໍ່ ທີ່ຕ້ອງມີຂໍ້ມູນຕົວຕົນ ແລະ ບັນຊີຄົບຖ້ວນ.' },
    inputs: [
      { name: 'Verified account identity', available: false, detail: 'Unresolved in the supplied fixtures.' },
      { name: 'Corrected incoming / outgoing history', available: false, detail: 'A synthetic graph binding is not verified account history.' },
      { name: 'Ledger / balance context', available: false, detail: 'No full ledger or balance snapshot supplied.' },
    ], featureVersion: 'Not supplied',
    versions: [{ version: 1, state: 'example', reference: 'DEMO-MULE-PASS-THROUGH:v1', parentVersion: null, condition: { kind: 'pass_through_reference', window: '1 hour', parameter: 'Illustrative forwarding ratio ≥ 0.8' }, rationale: 'Definition preview only; identity and ledger prerequisites are missing.' }],
    limitations: ['A forwarding ratio cannot prove that the same funds were passed through.', 'A pattern is an investigation lead, not a finding that an account is a mule.'],
  },
  {
    code: 'DEMO-AML-AMOUNT', reasonCode: 'DEMO_AMOUNT_SIGNAL', family: 'aml',
    name: { en: 'Amount review indicator', lo: 'ຕົວຊີ້ວັດການກວດສອບຈຳນວນເງິນ' },
    description: { en: 'An independent amount-based AML review example, separate from the Fraud signal.', lo: 'ຕົວຢ່າງການກວດສອບ AML ຕາມຈຳນວນເງິນ ແຍກຈາກສັນຍານ Fraud.' },
    inputs: amountInputs(), featureVersion: 'DEMO-AMOUNT-01', versions: amountVersions('DEMO-AML-AMOUNT', '100000.00', '200000.00'),
    limitations: ['A threshold match is not a money-laundering determination.', 'No reporting obligation, production threshold or regulatory conclusion is inferred.'],
  },
]

export type DetectorFilters = { search: string; family: string; availability: string; version: string; status: string }
export const DEFAULT_DETECTOR_FILTERS: DetectorFilters = { search: '', family: 'all', availability: 'all', version: 'all', status: 'all' }
export function detectorReady(detector: DetectorDefinition) { return detector.inputs.every((input) => input.available) }
export function filterDetectors(detectors: DetectorDefinition[], filters: DetectorFilters) {
  const search = filters.search.trim().toLocaleLowerCase()
  return detectors.filter((detector) => {
    const ready = detectorReady(detector)
    return (!search || [detector.code, detector.reasonCode, detector.name.en, detector.name.lo, detector.description.en, detector.description.lo].join(' ').toLocaleLowerCase().includes(search)) &&
      (filters.family === 'all' || detector.family === filters.family) &&
      (filters.availability === 'all' || (filters.availability === 'ready' ? ready : !ready)) &&
      (filters.version === 'all' || detector.versions.some((version) => String(version.version) === filters.version)) &&
      (filters.status === 'all' || (filters.status === 'demo' ? ready : !ready))
  })
}

/** Exact two-decimal demo units; no conversion through floating-point numbers. */
export function decimalUnits(value: string): bigint {
  if (!/^(0|[1-9]\d{0,29})(\.\d{1,2})?$/.test(value)) throw new Error('Use a non-negative decimal amount, up to 30 digits and 2 decimal places. No commas or exponent notation.')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}
export function validateAmountCondition(condition: AmountCondition) {
  if (condition.kind !== 'amount_gte') throw new Error('Only the typed amount_gte condition can be authored in this preview.')
  if (decimalUnits(condition.threshold) === 0n) throw new Error('Threshold must be greater than zero.')
  if (!['SYN', 'USD', 'THB'].includes(condition.currency)) throw new Error('Select SYN, USD or THB. Currency codes are compared literally.')
  if (!['completed', 'attempted'].includes(condition.lifecycle)) throw new Error('Select completed or attempted lifecycle.')
}
export function draftDetectorVersion(detector: DetectorDefinition, baseVersion: number, condition: AmountCondition, rationale: string): DetectorDefinition {
  const base = detector.versions.find((version) => version.version === baseVersion)
  if (!base || base.condition.kind !== 'amount_gte') throw new Error('Select an amount-rule version as the draft source.')
  validateAmountCondition(condition)
  if (rationale.trim().length < 8 || rationale.trim().length > 1000) throw new Error('Explain the change in 8–1000 characters.')
  const version = Math.max(...detector.versions.map((item) => item.version)) + 1
  return { ...detector, versions: [...detector.versions, {
    version, state: 'local_draft', reference: `${detector.code}:v${version}`, parentVersion: baseVersion,
    condition: { ...condition }, rationale: rationale.trim(),
  }] }
}
export function conditionFields(condition: DetectorCondition): Record<string, string> {
  return condition.kind === 'amount_gte'
    ? { Operator: 'amount_gte', Threshold: condition.threshold, Currency: condition.currency, Lifecycle: condition.lifecycle }
    : { Operator: condition.kind, Window: condition.window, Parameter: condition.parameter }
}
export type DetectorTransaction = { id: string; revision: number; institution_id: string; amount: string; currency: string; lifecycle: string; occurred_at: string }
export type BacktestScope = { institution: string; range: string; asOf: string }
export function scopedDetectorTransactions(transactions: DetectorTransaction[], scope: BacktestScope) {
  if (!['INST-DEMO-A', 'INST-DEMO-B', 'ALL'].includes(scope.institution)) throw new Error('Institution is outside the authorized demo scope.')
  if (!['24h', '7d', '30d'].includes(scope.range)) throw new Error('Unsupported time range.')
  const until = Date.parse(scope.asOf)
  if (!Number.isFinite(until)) throw new Error('A valid snapshot time is required.')
  const since = until - (scope.range === '24h' ? 1 : scope.range === '7d' ? 7 : 30) * 86400000
  return transactions.filter((tx) => (scope.institution === 'ALL' || tx.institution_id === scope.institution) && Date.parse(tx.occurred_at) >= since && Date.parse(tx.occurred_at) <= until)
}
export type BacktestRow = { transaction: Readonly<DetectorTransaction>; result: 'triggered' | 'not_triggered' | 'unavailable' | 'out_of_scope'; reason: string }
export type DetectorBacktest = {
  id: string; detectorCode: string; rule: Readonly<DetectorVersion>; scope: Readonly<BacktestScope>
  dataset: string; at: string; rows: readonly BacktestRow[]
  counts: Readonly<Record<BacktestRow['result'], number>>
}
export function runDetectorBacktest(detector: DetectorDefinition, version: number, transactions: DetectorTransaction[], selected: string[], scope: BacktestScope, id: string, at: string): DetectorBacktest {
  if (!selected.length || selected.length > 20 || new Set(selected).size !== selected.length) throw new Error('Select 1–20 distinct frozen transaction revisions.')
  const rule = detector.versions.find((item) => item.version === version)
  if (!rule) throw new Error('The selected rule version is unavailable.')
  if (rule.condition.kind === 'amount_gte') validateAmountCondition(rule.condition)
  const scoped = scopedDetectorTransactions(transactions, scope)
  const rows = selected.map((key): BacktestRow => {
    const source = scoped.find((tx) => `${tx.id}:r${tx.revision}` === key)
    if (!source) throw new Error('A selected revision is unavailable in the current institution and time scope. Refresh the selection.')
    const transaction = Object.freeze({ ...source })
    const condition = rule.condition
    if (condition.kind !== 'amount_gte') return Object.freeze({ transaction, result: 'unavailable', reason: detector.inputs.filter((input) => !input.available).map((input) => input.name).join('; ') || 'Reference feature evaluator is not connected.' })
    if (transaction.currency !== condition.currency || transaction.lifecycle !== condition.lifecycle) return Object.freeze({ transaction, result: 'out_of_scope', reason: 'Currency or lifecycle differs from the frozen rule scope.' })
    try {
      const match = decimalUnits(transaction.amount) >= decimalUnits(condition.threshold)
      return Object.freeze({ transaction, result: match ? 'triggered' : 'not_triggered', reason: `Exact amount ${match ? 'meets' : 'is below'} the ${condition.threshold} ${condition.currency} threshold.` })
    } catch {
      return Object.freeze({ transaction, result: 'unavailable', reason: 'Exact amount is missing or not a supported decimal string.' })
    }
  })
  const counts = { triggered: 0, not_triggered: 0, unavailable: 0, out_of_scope: 0 }
  for (const row of rows) counts[row.result]++
  return Object.freeze({ id, detectorCode: detector.code, rule: Object.freeze({ ...rule, condition: Object.freeze({ ...rule.condition }) }), scope: Object.freeze({ ...scope }), dataset: 'Portal synthetic transaction fixtures · explicit revisions', at, rows: Object.freeze(rows), counts: Object.freeze(counts) })
}
