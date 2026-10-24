import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DETECTOR_EXAMPLES, DEFAULT_DETECTOR_FILTERS, decimalUnits, detectorReady, draftDetectorVersion, filterDetectors, runDetectorBacktest, scopedDetectorTransactions } from '../src/detectors.ts'

const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const amount = () => structuredClone(DETECTOR_EXAMPLES[0])
const scope = { institution: 'INST-DEMO-A', range: '7d', asOf: seed._meta.data_as_of }
const key = (tx) => `${tx.id}:r${tx.revision}`
const run = (detector, transactions, selected, extra = {}) => runDetectorBacktest(detector, 2, transactions, selected, { ...scope, ...extra }, 'DEMO-TEST-1', '2026-10-23T07:00:00Z')

test('catalog filters combine bilingual search, family, inputs, version and status without fabricating the reported fifteen', () => {
  assert.equal(DETECTOR_EXAMPLES.length, 4)
  assert.equal(DETECTOR_EXAMPLES.filter(detectorReady).length, 2)
  const filter = (extra) => filterDetectors(DETECTOR_EXAMPLES, { ...DEFAULT_DETECTOR_FILTERS, ...extra })
  assert.deepEqual(filter({ family: 'mule', availability: 'missing', status: 'reference', version: '1' }).map((x) => x.code), ['DEMO-MULE-PASS-THROUGH'])
  assert.equal(filter({ search: amount().name.lo, availability: 'ready', version: '2' })[0].code, amount().code)
  assert.equal(filter({ search: '  demo_amount_signal  ', family: 'aml' }).length, 1)
  assert.equal(filter({ family: 'mule', availability: 'ready' }).length, 0)
})

test('amount comparisons preserve exact decimals above Number.MAX_SAFE_INTEGER and reject invalid syntax', () => {
  assert.equal(decimalUnits('9007199254740993.01'), 900719925474099301n)
  assert.equal(decimalUnits('0.1'), 10n)
  assert.equal(decimalUnits('0'), 0n)
  for (const value of ['NaN', '-1', '1e6', '1,000', '01.00', '1.001', '1.', ' 1', '9'.repeat(31)]) assert.throws(() => decimalUnits(value))
  const d = amount()
  d.versions[1].condition.threshold = '9007199254740993.01'
  const tx = { ...seed.transactions[0], amount: '9007199254740993.00' }
  assert.equal(run(d, [tx], [key(tx)]).rows[0].result, 'not_triggered')
  tx.amount = '9007199254740993.01'
  assert.equal(run(d, [tx], [key(tx)]).rows[0].result, 'triggered')
})

test('new typed drafts preserve every previous version and require valid scope, source and rationale', () => {
  const d = amount(), before = structuredClone(d)
  const changed = draftDetectorVersion(d, 2, { kind: 'amount_gte', threshold: '800000.00', currency: 'SYN', lifecycle: 'completed' }, 'Review the proposed threshold against frozen inputs.')
  assert.deepEqual(d, before)
  assert.deepEqual(changed.versions.slice(0, 2), d.versions)
  assert.equal(changed.versions[2].version, 3)
  assert.equal(changed.versions[2].parentVersion, 2)
  assert.equal(changed.versions[2].state, 'local_draft')
  const base = changed.versions[2].condition
  for (const extra of [{ threshold: '0' }, { currency: 'EUR' }, { lifecycle: 'deleted' }, { kind: 'eval' }]) assert.throws(() => draftDetectorVersion(d, 2, { ...base, ...extra }, 'A valid example rationale.'))
  assert.throws(() => draftDetectorVersion(d, 2, base, 'short'))
  assert.throws(() => draftDetectorVersion(DETECTOR_EXAMPLES[1], 1, base, 'A valid example rationale.'))
})

test('input selection respects institution, time bounds and explicit frozen revisions', () => {
  const inScope = scopedDetectorTransactions(seed.transactions, scope)
  assert.ok(inScope.every((tx) => tx.institution_id === scope.institution))
  assert.equal(scopedDetectorTransactions(seed.transactions, { ...scope, range: '24h' }).length, 3)
  const foreign = seed.transactions.find((tx) => tx.institution_id !== scope.institution)
  assert.throws(() => run(amount(), seed.transactions, [key(foreign)]), /scope/)
  assert.throws(() => run(amount(), seed.transactions, ['TX-SYN-1001:r1']), /scope/)
  assert.throws(() => scopedDetectorTransactions(seed.transactions, { ...scope, institution: 'UNAUTHORIZED' }))
  const future = { ...seed.transactions[0], occurred_at: '2099-01-01T00:00:00Z' }
  assert.equal(scopedDetectorTransactions([future], scope).length, 0)
})

test('bounded selection rejects empty, duplicate and excessive input sets instead of silently truncating', () => {
  assert.throws(() => run(amount(), seed.transactions, []), /1–20/)
  assert.throws(() => run(amount(), seed.transactions, [key(seed.transactions[0]), key(seed.transactions[0])]), /distinct/)
  assert.throws(() => run(amount(), seed.transactions, Array.from({ length: 21 }, (_, i) => `TX-${i}:r1`)), /1–20/)
})

test('offline backtests keep scope mismatches and unavailable inputs distinct from negative results', () => {
  const selected = scopedDetectorTransactions(seed.transactions, scope).map(key)
  const report = run(amount(), seed.transactions, selected)
  assert.deepEqual(report.counts, { triggered: 1, not_triggered: 3, unavailable: 0, out_of_scope: 1 })
  const missing = runDetectorBacktest(DETECTOR_EXAMPLES[2], 1, seed.transactions, selected, scope, 'DEMO-MISSING', '2026-10-23T07:00:00Z')
  assert.equal(missing.counts.unavailable, selected.length)
  assert.equal(missing.counts.not_triggered, 0)
  assert.match(missing.rows[0].reason, /Verified account identity/)
  const tx = { ...seed.transactions[0], amount: 'corrupted' }
  assert.equal(run(amount(), [tx], [key(tx)]).rows[0].result, 'unavailable')
  const attempted = { ...seed.transactions[0], lifecycle: 'attempted' }
  assert.equal(run(amount(), [attempted], [key(attempted)]).rows[0].result, 'out_of_scope')
})

test('reports freeze their original condition and exact revision input without mutating operational fixtures', () => {
  const d = amount(), data = structuredClone(seed.transactions), before = structuredClone(seed)
  const report = run(d, data, [key(data[0])])
  d.versions[1].condition.threshold = '1.00'
  data[0].amount = '0.00'
  assert.equal(report.rule.condition.threshold, '1000000.00')
  assert.equal(report.rows[0].transaction.amount, '1250000.00')
  assert.equal(report.rows[0].transaction.revision, 2)
  assert.throws(() => { report.rule.condition.threshold = '1.00' }, TypeError)
  assert.throws(() => { report.rows[0].transaction.amount = '1.00' }, TypeError)
  assert.deepEqual(seed, before)
})
