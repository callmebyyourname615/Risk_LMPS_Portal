import { decimalUnits } from './detectors.ts'

export const OFFLINE_FILE_LIMIT = 64 * 1024 * 1024
export const OFFLINE_ROW_LIMIT = 100000
export const OFFLINE_CHECKPOINT_SIZE = 500
export const OFFLINE_TABLES = ['transfer', 'transfer_hist', 'transfer_old', 'member'] as const
export type OfflineTable = typeof OFFLINE_TABLES[number]
export type OfflineBatch = {
  id: string; institution: string; table: OfflineTable; bytes: number; rows: number; processed: number; inserted: number
  duplicates: number; conflicts: number; state: 'profiled' | 'paused' | 'complete'; reconciled: boolean
  fingerprint: string; mappingVersion: string; at: string; attempts: number
  checkpoints: { attempt: number; from: number; to: number; inserted: number; at: string }[]
  provenance: 'invented_offline_fixture'; privacy: 'metadata_only'; reconciliationAt: string | null
}
export type OfflineReplayRow = { rowRef: string; result: 'matched' | 'not_matched' | 'unavailable'; reason: string }
export type OfflineReplay = {
  id: string; batchId: string; institution: string; at: string; sample: boolean; batchRows: number; excludedRows: number
  fingerprint: string; mappingVersion: string; thresholds: { currency: string; amount: string }[]
  rows: OfflineReplayRow[]; counts: Record<OfflineReplayRow['result'], number>
  totals: { currency: string; amount: string; rows: number }[]
  canonicalTransactionsCreated: 0; operationalAlertsCreated: 0; mode: 'raw_amount_simulation'
}
export type DatasetWorkspace = { version: number; batches: OfflineBatch[]; replays: OfflineReplay[]; actions: { id: string; actor: string; at: string; kind: string; batchId: string }[] }
export class DatasetError extends Error {
  code: 'validation' | 'conflict' | 'permission'
  constructor(code: DatasetError['code'], message: string) { super(message); this.name = 'DatasetError'; this.code = code }
}
const fail = (message: string): never => { throw new DatasetError('validation', message) }
export function validateOfflineMetadata(input: { bytes: number; rows: number; table: string; csv: boolean }) {
  const errors: string[] = []
  if (!input.csv) errors.push('Select CSV metadata. No file contents are read or uploaded.')
  if (!(OFFLINE_TABLES as readonly string[]).includes(input.table)) errors.push('Choose transfer, transfer_hist, transfer_old or member.')
  if (!Number.isSafeInteger(input.bytes) || input.bytes <= 0) errors.push('File size must be a positive whole number of bytes.')
  else if (input.bytes > OFFLINE_FILE_LIMIT) errors.push('File exceeds 64 MiB. Split/import support not yet implemented; a 2 GB export cannot be imported as one file.')
  if (!Number.isSafeInteger(input.rows) || input.rows <= 0) errors.push('Declare a positive whole-number record count. The count is not verified from file contents.')
  else if (input.rows > OFFLINE_ROW_LIMIT) errors.push('File exceeds 100,000 records. Prepare a bounded export; browser chunking does not establish backend support.')
  return { valid: !errors.length, errors, contentRead: false as const, uploaded: false as const }
}
export function createDatasetWorkspace(): DatasetWorkspace {
  const base = { fingerprint: 'DEMO-BATCH-FINGERPRINT-001', mappingVersion: 'DEMO-MAPPING-01', at: '2026-10-23T04:00:00Z', provenance: 'invented_offline_fixture' as const, privacy: 'metadata_only' as const }
  const batches: OfflineBatch[] = [
    { ...base, id: 'BATCH-OFF-001', institution: 'INST-DEMO-A', table: 'transfer', bytes: 18000, rows: 12, processed: 12, inserted: 12, duplicates: 0, conflicts: 0, state: 'complete', reconciled: true, attempts: 1, checkpoints: [{ attempt: 1, from: 1, to: 12, inserted: 12, at: base.at }], reconciliationAt: base.at },
    { ...base, id: 'BATCH-OFF-002', institution: 'INST-DEMO-A', table: 'transfer_hist', bytes: 64000, rows: 1200, processed: 500, inserted: 497, duplicates: 3, conflicts: 0, state: 'paused', reconciled: false, fingerprint: 'DEMO-BATCH-FINGERPRINT-002', attempts: 1, checkpoints: [{ attempt: 1, from: 1, to: 500, inserted: 497, at: base.at }], reconciliationAt: null },
    { ...base, id: 'BATCH-OFF-003', institution: 'INST-DEMO-A', table: 'member', bytes: 6000, rows: 6, processed: 6, inserted: 6, duplicates: 0, conflicts: 0, state: 'complete', reconciled: true, fingerprint: 'DEMO-BATCH-FINGERPRINT-003', attempts: 1, checkpoints: [{ attempt: 1, from: 1, to: 6, inserted: 6, at: base.at }], reconciliationAt: base.at },
    { ...base, id: 'BATCH-OFF-B01', institution: 'INST-DEMO-B', table: 'transfer_old', bytes: 12000, rows: 8, processed: 8, inserted: 7, duplicates: 0, conflicts: 1, state: 'complete', reconciled: false, fingerprint: 'DEMO-BATCH-FINGERPRINT-B01', attempts: 1, checkpoints: [{ attempt: 1, from: 1, to: 8, inserted: 7, at: base.at }], reconciliationAt: null },
  ]
  return { version: 1, batches, actions: [], replays: [{ id: 'REPLAY-OFF-001', batchId: 'BATCH-OFF-001', institution: 'INST-DEMO-A', at: base.at, sample: true, batchRows: 12, excludedRows: 0, fingerprint: base.fingerprint, mappingVersion: base.mappingVersion, thresholds: [{ currency: 'LAK', amount: '1000000.00' }], rows: [{ rowRef: 'opaque-row-01', result: 'matched', reason: 'Illustrative excerpt supplied in the prototype fixtures.' }, { rowRef: 'opaque-row-02', result: 'not_matched', reason: 'Illustrative excerpt; not matched does not mean safe.' }, { rowRef: 'opaque-row-03', result: 'unavailable', reason: 'unconfigured_currency' }], counts: { matched: 1, not_matched: 1, unavailable: 1 }, totals: [], canonicalTransactionsCreated: 0, operationalAlertsCreated: 0, mode: 'raw_amount_simulation' }] }
}
export type DatasetFilters = { search: string; table: string; status: string; currency: string }
export const DEFAULT_DATASET_FILTERS: DatasetFilters = { search: '', table: 'all', status: 'all', currency: 'all' }
export function selectOfflineBatches(workspace: DatasetWorkspace, scope: { institution: string; range: string; asOf: string }, filters = DEFAULT_DATASET_FILTERS) {
  if (!['INST-DEMO-A', 'INST-DEMO-B', 'ALL'].includes(scope.institution)) throw new DatasetError('permission', 'Unknown demo institution scope.')
  const days = scope.range === '24h' ? 1 : scope.range === '7d' ? 7 : scope.range === '30d' ? 30 : 0
  if (!days || !Number.isFinite(Date.parse(scope.asOf))) fail('Choose a valid fixture time window.')
  const since = Date.parse(scope.asOf) - days * 86400000
  return workspace.batches.filter((batch) => (scope.institution === 'ALL' || batch.institution === scope.institution) && Date.parse(batch.at) >= since &&
    (!filters.search.trim() || `${batch.id} ${batch.fingerprint} ${batch.mappingVersion}`.toLowerCase().includes(filters.search.trim().toLowerCase())) &&
    (filters.table === 'all' || batch.table === filters.table) && (filters.status === 'all' || (filters.status === 'reconciled' ? batch.reconciled : batch.state === filters.status)) &&
    (filters.currency === 'all' || (batch.table !== 'member' && ['LAK', 'USD'].includes(filters.currency))))
}
export function offlineBatchCounts(batch: OfflineBatch) {
  const accounted = batch.inserted + batch.duplicates + batch.conflicts
  return { expected: batch.rows, processed: batch.processed, inserted: batch.inserted, duplicates: batch.duplicates, conflicts: batch.conflicts, accounted, complete: batch.processed === batch.rows, countsMatch: batch.processed === batch.rows && accounted === batch.rows && batch.conflicts === 0 }
}
// Deliberately invented amount fixtures only. No private CSV, source path, account field or raw staging API is read.
const DEMO_AMOUNTS = ['1250000.00', '100000.00', '120.00', '500000.00', '2000000.00', '40000.00', '900000.00', '1000000.00', '250000.00', '750000.00', 'bad_amount', '50000.00']
function amountString(units: bigint) { return `${units / 100n}.${String(units % 100n).padStart(2, '0')}` }
export function buildOfflineReplay(batch: OfflineBatch, thresholds: { currency: string; amount: string }[], id: string, at: string): OfflineReplay {
  const metadata = validateOfflineMetadata({ bytes: batch.bytes, rows: batch.rows, table: batch.table, csv: true })
  if (!metadata.valid) fail(metadata.errors.join(' '))
  if (!Number.isSafeInteger(batch.inserted) || batch.inserted < 0 || batch.inserted > batch.rows) fail('Invalid unique staging row count.')
  if (!batch.reconciled || !offlineBatchCounts(batch).countsMatch) fail('Complete and reconcile this demo batch before offline replay.')
  if (!thresholds.length || thresholds.length > 3 || new Set(thresholds.map((item) => item.currency)).size !== thresholds.length) fail('Configure 1–3 distinct literal currency thresholds.')
  for (const threshold of thresholds) {
    if (!['LAK', 'USD', 'THB'].includes(threshold.currency)) fail('Configure LAK, USD or THB literally; no FX conversion is applied.')
    try { if (decimalUnits(threshold.amount) <= 0n) fail('Thresholds must be greater than zero.') } catch (error) { fail(error instanceof Error ? error.message : 'Invalid exact amount.') }
  }
  const totals = new Map<string, { units: bigint; rows: number }>()
  const rows: OfflineReplayRow[] = Array.from({ length: batch.inserted }, (_, index) => {
    const rowRef = `opaque-row-${String(index + 1).padStart(2, '0')}`
    if (batch.table === 'member') return { rowRef, result: 'unavailable', reason: 'Member datasets are not payment amounts.' }
    const currency = index % 12 === 2 ? 'USD' : 'LAK', amount = DEMO_AMOUNTS[index % DEMO_AMOUNTS.length]
    let units: bigint
    try { units = decimalUnits(amount) } catch { return { rowRef, result: 'unavailable', reason: 'Exact amount unavailable in this invented fixture.' } }
    const prior = totals.get(currency) ?? { units: 0n, rows: 0 }; totals.set(currency, { units: prior.units + units, rows: prior.rows + 1 })
    const threshold = thresholds.find((item) => item.currency === currency)
    if (!threshold) return { rowRef, result: 'unavailable', reason: 'No threshold configured for this literal currency.' }
    const matched = units >= decimalUnits(threshold.amount)
    return { rowRef, result: matched ? 'matched' : 'not_matched', reason: matched ? 'Invented recorded amount meets the explicit simulation threshold.' : 'Below the explicit raw-amount threshold; this is not a safety finding.' }
  })
  const counts = { matched: 0, not_matched: 0, unavailable: 0 }
  for (const row of rows) counts[row.result]++
  return { id, batchId: batch.id, institution: batch.institution, at, sample: false, batchRows: batch.rows, excludedRows: batch.rows - batch.inserted, fingerprint: batch.fingerprint, mappingVersion: batch.mappingVersion, thresholds: thresholds.map((item) => ({ ...item })), rows, counts, totals: [...totals].map(([currency, value]) => ({ currency, amount: amountString(value.units), rows: value.rows })), canonicalTransactionsCreated: 0, operationalAlertsCreated: 0, mode: 'raw_amount_simulation' }
}
export type DatasetCommand = { actor: string; institution: string; expectedVersion: number; requestId: string; at: string } & (
  | { kind: 'add_demo_batch'; table: OfflineTable }
  | { kind: 'advance_import'; batchId: string; expectedProcessed: number }
  | { kind: 'reconcile'; batchId: string }
  | { kind: 'replay'; batchId: string; thresholds: { currency: string; amount: string }[] }
)
export function applyDatasetCommand(workspace: DatasetWorkspace, command: DatasetCommand): DatasetWorkspace {
  if (workspace.version !== command.expectedVersion) throw new DatasetError('conflict', 'The demo import workspace changed. Refresh before retrying.')
  if (!command.actor || !command.requestId || !Number.isFinite(Date.parse(command.at))) fail('A demo actor, action reference and valid time are required.')
  if (workspace.actions.some((action) => action.id === command.requestId)) throw new DatasetError('conflict', 'This action reference was already used. Inspect the checkpoint before retrying.')
  const next = structuredClone(workspace)
  let batch: OfflineBatch
  if (command.kind === 'add_demo_batch') {
    if (!['INST-DEMO-A', 'INST-DEMO-B'].includes(command.institution)) fail('Choose one institution access partition for the invented intake sample.')
    if (!(OFFLINE_TABLES as readonly string[]).includes(command.table)) fail('Choose a supplied source table.')
    const id = `BATCH-DEMO-${workspace.version + 1}`
    batch = { ...structuredClone(workspace.batches[0]), id, institution: command.institution, table: command.table, bytes: 18000, rows: 12, processed: 0, inserted: 0, duplicates: 0, conflicts: 0, state: 'profiled', reconciled: false, attempts: 0, at: command.at, checkpoints: [], reconciliationAt: null, fingerprint: `DEMO-METADATA-${command.requestId}` }
    next.batches.push(batch)
  } else {
    batch = next.batches.find((item) => item.id === command.batchId) ?? fail('Demo batch is unavailable.')
    if (command.institution !== 'ALL' && batch.institution !== command.institution) throw new DatasetError('permission', 'This batch is outside the selected institution access partition.')
    if (command.kind === 'advance_import') {
      if (batch.processed !== command.expectedProcessed) throw new DatasetError('conflict', 'The committed checkpoint changed. Reload it before resuming; do not reupload.')
      if (batch.state === 'complete') fail('All demo rows are already processed. Inspect reconciliation.')
      const from = batch.processed + 1, oldInserted = batch.inserted
      batch.processed = Math.min(batch.rows, batch.processed + OFFLINE_CHECKPOINT_SIZE)
      batch.inserted = Math.max(0, batch.processed - Math.min(batch.processed, batch.duplicates + batch.conflicts))
      batch.attempts++; batch.state = batch.processed === batch.rows ? 'complete' : 'paused'; batch.reconciled = false
      batch.checkpoints.push({ attempt: batch.attempts, from, to: batch.processed, inserted: batch.inserted - oldInserted, at: command.at })
    } else if (command.kind === 'reconcile') {
      if (batch.state !== 'complete') fail('Finish all demo checkpoints before reconciliation.')
      batch.reconciled = offlineBatchCounts(batch).countsMatch; batch.reconciliationAt = command.at
    } else if (command.kind === 'replay') next.replays.push(buildOfflineReplay(batch, command.thresholds, `REPLAY-${command.requestId}`, command.at))
  }
  batch.at = command.at
  next.actions.push({ id: command.requestId, actor: command.actor, at: command.at, kind: command.kind, batchId: batch.id }); next.version++
  return next
}
