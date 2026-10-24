import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { OFFLINE_FILE_LIMIT, OFFLINE_ROW_LIMIT, DatasetError, applyDatasetCommand, buildOfflineReplay, createDatasetWorkspace, offlineBatchCounts, selectOfflineBatches, validateOfflineMetadata } from '../src/datasets.ts'
import { assertDemoMutation, createAccessSession, switchAccessPersona } from '../src/access.ts'
const at = '2026-10-23T07:00:00Z'
const seed = JSON.parse(readFileSync(new URL('../src/data/fixtures.json', import.meta.url), 'utf8'))
const scope = { institution: 'INST-DEMO-A', range: '7d', asOf: seed._meta.data_as_of }
let sequence = 0
const apply = (workspace, extra) => applyDatasetCommand(workspace, { actor: 'DEMO-SUBJECT-OPERATOR', institution: scope.institution, expectedVersion: workspace.version, requestId: `DATASET-TEST-${++sequence}`, at, ...extra })
const rejects = (callback, code = 'validation') => assert.throws(callback, (error) => error instanceof DatasetError && error.code === code)
const thresholds = [{ currency: 'LAK', amount: '1000000.00' }]

test('intake metadata enforces exact 64MiB/100000-record bounds and rejects a 2GB export without reading or uploading content', () => {
  const check = (extra = {}) => validateOfflineMetadata({ bytes: OFFLINE_FILE_LIMIT, rows: OFFLINE_ROW_LIMIT, table: 'transfer', csv: true, ...extra })
  assert.equal(check().valid, true)
  assert.equal(check().contentRead, false)
  assert.equal(check().uploaded, false)
  assert.match(check({ bytes: 2 * 1024 * 1024 * 1024 }).errors.join(' '), /Split\/import support not yet implemented/)
  for (const extra of [{ bytes: OFFLINE_FILE_LIMIT + 1 }, { rows: 100001 }, { rows: 1.2 }, { rows: 0 }, { bytes: NaN }, { table: 'raw_accounts' }, { csv: false }]) assert.equal(check(extra).valid, false)
})

test('offline batch selection respects access partitions, time, table, state and literal currency fixtures', () => {
  const workspace = createDatasetWorkspace()
  assert.equal(selectOfflineBatches(workspace, scope).length, 3)
  assert.ok(selectOfflineBatches(workspace, { ...scope, institution: 'INST-DEMO-B' }).every((batch) => batch.institution === 'INST-DEMO-B'))
  assert.equal(selectOfflineBatches(workspace, scope, { search: '', table: 'member', status: 'reconciled', currency: 'all' }).length, 1)
  assert.equal(selectOfflineBatches(workspace, scope, { search: '', table: 'all', status: 'all', currency: 'THB' }).length, 0)
  rejects(() => selectOfflineBatches(workspace, { ...scope, institution: 'FORGED' }), 'permission')
})

test('resume commits at most 500 source ordinals, preserves dedup counts and rejects stale checkpoint retries', () => {
  const before = createDatasetWorkspace(), original = structuredClone(before)
  const next = apply(before, { kind: 'advance_import', batchId: 'BATCH-OFF-002', expectedProcessed: 500 })
  const batch = next.batches.find((item) => item.id === 'BATCH-OFF-002')
  assert.equal(batch.processed, 1000); assert.equal(batch.inserted, 997)
  assert.equal(batch.checkpoints.at(-1).from, 501); assert.equal(batch.checkpoints.at(-1).to, 1000)
  rejects(() => apply(next, { kind: 'advance_import', batchId: batch.id, expectedProcessed: 500 }), 'conflict')
  const complete = apply(next, { kind: 'advance_import', batchId: batch.id, expectedProcessed: 1000 })
  const final = complete.batches.find((item) => item.id === batch.id)
  assert.equal(final.processed, 1200); assert.equal(final.inserted, 1197)
  assert.equal(final.checkpoints.at(-1).to - final.checkpoints.at(-1).from + 1, 200)
  assert.deepEqual(before, original)
})

test('reconciliation requires complete checkpoints and never treats conflicting rows as resolved', () => {
  const before = createDatasetWorkspace()
  rejects(() => apply(before, { kind: 'reconcile', batchId: 'BATCH-OFF-002' }))
  const conflict = apply(before, { kind: 'reconcile', batchId: 'BATCH-OFF-B01', institution: 'ALL' })
  assert.equal(conflict.batches.find((item) => item.id === 'BATCH-OFF-B01').reconciled, false)
  const counts = offlineBatchCounts(conflict.batches.find((item) => item.id === 'BATCH-OFF-B01'))
  assert.equal(counts.accounted, counts.expected)
  assert.equal(counts.countsMatch, false)
})

test('raw amount replay keeps currency thresholds literal, returns unavailable for missing inputs, and preserves exact aggregate totals', () => {
  const batch = createDatasetWorkspace().batches[0]
  const report = buildOfflineReplay(batch, thresholds, 'TEST-REPLAY', at)
  assert.deepEqual(report.counts, { matched: 3, not_matched: 7, unavailable: 2 })
  assert.deepEqual(report.totals, [{ currency: 'LAK', amount: '6840000.00', rows: 10 }, { currency: 'USD', amount: '120.00', rows: 1 }])
  assert.equal(report.rows[2].result, 'unavailable')
  const configured = buildOfflineReplay(batch, [...thresholds, { currency: 'USD', amount: '100.00' }], 'TEST-USD', at)
  assert.equal(configured.rows[2].result, 'matched')
  assert.equal(configured.counts.unavailable, 1)
  assert.ok(report.rows.every((row) => Object.keys(row).sort().join(',') === 'reason,result,rowRef'))
})

test('member batches are unavailable and incomplete staging cannot run replay', () => {
  const workspace = createDatasetWorkspace()
  const members = buildOfflineReplay(workspace.batches.find((item) => item.table === 'member'), thresholds, 'MEMBER', at)
  assert.equal(members.counts.unavailable, 6)
  assert.equal(members.counts.not_matched, 0)
  assert.deepEqual(members.totals, [])
  rejects(() => buildOfflineReplay(workspace.batches[1], thresholds, 'PARTIAL', at))
  rejects(() => buildOfflineReplay(workspace.batches[0], [{ currency: 'LAK', amount: '0' }], 'ZERO', at))
  rejects(() => buildOfflineReplay(workspace.batches[0], [...thresholds, ...thresholds], 'DUPLICATE', at))
})

test('reports freeze thresholds and manifest references, exclude deduplicated rows and leave operational fixtures untouched', () => {
  const original = structuredClone(seed), initial = createDatasetWorkspace()
  let workspace = apply(initial, { kind: 'advance_import', batchId: 'BATCH-OFF-002', expectedProcessed: 500 })
  workspace = apply(workspace, { kind: 'advance_import', batchId: 'BATCH-OFF-002', expectedProcessed: 1000 })
  workspace = apply(workspace, { kind: 'reconcile', batchId: 'BATCH-OFF-002' })
  const request = [{ currency: 'LAK', amount: '1000000.00' }]
  workspace = apply(workspace, { kind: 'replay', batchId: 'BATCH-OFF-002', thresholds: request })
  const report = workspace.replays.at(-1)
  assert.equal(report.rows.length, 1197)
  assert.equal(report.excludedRows, 3)
  assert.equal(report.canonicalTransactionsCreated, 0)
  assert.equal(report.operationalAlertsCreated, 0)
  request[0].amount = '1.00'
  workspace.batches[1].fingerprint = 'CHANGED'
  assert.equal(report.thresholds[0].amount, '1000000.00')
  assert.equal(report.fingerprint, 'DEMO-BATCH-FINGERPRINT-002')
  assert.deepEqual(seed, original)
})

test('invented intake starts empty, uses known metadata and never converts declared local-file data into a batch', () => {
  const before = createDatasetWorkspace()
  const next = apply(before, { kind: 'add_demo_batch', table: 'transfer_old' })
  const batch = next.batches.at(-1)
  assert.equal(batch.rows, 12); assert.equal(batch.bytes, 18000)
  assert.equal(batch.processed, 0); assert.equal(batch.reconciled, false)
  assert.equal(batch.privacy, 'metadata_only')
  assert.equal('fileName' in batch, false); assert.equal('rawRows' in batch, false)
})

test('the shared access adapter limits simulations to the operator and rechecks actor, owner and selected scope', () => {
  const analyst = createAccessSession(), operator = switchAccessPersona(analyst, 'operator', analyst.version, at)
  const command = { kind: 'replay', actor: 'DEMO-SUBJECT-OPERATOR', institution: 'INST-DEMO-A' }
  assert.throws(() => assertDemoMutation(analyst, 'dataset', command, ['INST-DEMO-A']))
  assertDemoMutation(operator, 'dataset', command, ['INST-DEMO-A'])
  assert.throws(() => assertDemoMutation(operator, 'dataset', command, ['INST-DEMO-B']))
  assert.throws(() => assertDemoMutation(operator, 'dataset', { ...command, actor: 'OTHER' }, ['INST-DEMO-A']))
  const revoked = { ...operator, status: 'revoked' }
  assert.throws(() => assertDemoMutation(revoked, 'dataset', command, ['INST-DEMO-A']))
})
