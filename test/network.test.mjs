import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createNetworkModel, findTemporalPath, selectNetwork } from '../src/network.ts'

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const fixtures = load('../src/data/fixtures.json')
const bindings = load('../src/data/network.json')
const model = createNetworkModel(fixtures, bindings)
const query = (overrides = {}) => ({
  institution: 'INST-DEMO-A', root: 'NODE-DEMO-01', days: 7,
  asOf: fixtures._meta.data_as_of, currency: 'SYN', dimension: 'ALL',
  direction: 'both', maxHops: 2, maxNodes: 8, ...overrides,
})

test('bindings are explicit inventions, preserve exact amounts and never infer account identity', () => {
  assert.equal(bindings.identity_verified, false)
  assert.equal(model.nodes.length, 7)
  assert.equal(model.edges.find((edge) => edge.id === 'TX-SYN-1001').amount, '1250000.00')
  assert.equal(model.edges.find((edge) => edge.id === 'TX-SYN-1001').indices.mule, null)
  const invalid = structuredClone(bindings)
  invalid.edges[0].target = 'NODE-DEMO-B1'
  assert.throws(() => createNetworkModel(fixtures, invalid), /Invalid/)
  const duplicate = structuredClone(bindings)
  duplicate.edges.push(duplicate.edges[0])
  assert.throws(() => createNetworkModel(fixtures, duplicate), /duplicate/)
})

test('institution scope applies to roots, endpoints, edges and returned counts', () => {
  const view = selectNetwork(model, query())
  assert.equal(view.edges.length, 4)
  assert.equal(view.nodes.length, 4)
  assert.equal(view.eligibleEdges, 4)
  assert.ok(view.nodes.every((node) => node.institution_id === 'INST-DEMO-A'))
  assert.ok(view.edges.every((edge) => edge.institution_id === 'INST-DEMO-A'))
  const denied = selectNetwork(model, query({ institution: 'INST-DEMO-B' }))
  assert.equal(denied.nodes.length, 0)
  assert.equal(denied.edges.length, 0)
  assert.equal(denied.eligibleEdges, 0)
  const bankB = selectNetwork(model, query({ institution: 'INST-DEMO-B', root: 'NODE-DEMO-B1' }))
  assert.deepEqual(bankB.edges.map((edge) => edge.id), ['TX-SYN-1004'])
})

test('node and hop bounds actually truncate the neighborhood and preserve valid endpoints', () => {
  const nodeBound = selectNetwork(model, query({ maxNodes: 3 }))
  assert.equal(nodeBound.nodes.length, 3)
  assert.equal(nodeBound.nodeLimited, true)
  assert.equal(nodeBound.truncated, true)
  const visibleIds = new Set(nodeBound.nodes.map((node) => node.id))
  assert.ok(nodeBound.edges.every((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)))
  const hopBound = selectNetwork(model, query({ maxHops: 1 }))
  assert.equal(hopBound.nodes.length, 3)
  assert.equal(hopBound.hopLimited, true)
  assert.ok(!hopBound.nodes.some((node) => node.id === 'NODE-DEMO-03'))
  const full = selectNetwork(model, query({ maxHops: 3 }))
  assert.equal(full.truncated, false)
  assert.throws(() => selectNetwork(model, query({ maxHops: 100 })), /Invalid/)
  assert.throws(() => selectNetwork(model, query({ maxNodes: 100 })), /Invalid/)
})

test('time filters exclude old and future events; literal currencies stay separate', () => {
  const today = selectNetwork(model, query({ days: 1 }))
  assert.equal(today.edges.length, 3)
  assert.ok(!today.edges.some((edge) => edge.id === 'TX-SYN-1003'))
  const allCurrency = selectNetwork(model, query({ currency: 'ALL' }))
  assert.equal(allCurrency.edges.length, 5)
  assert.deepEqual([...new Set(allCurrency.edges.map((edge) => edge.currency))].sort(), ['SYN', 'USD'])
  const future = structuredClone(model)
  future.edges[0].occurred_at = '2026-10-24T09:00:00+07:00'
  assert.ok(!selectNetwork(future, query()).edges.some((edge) => edge.id === 'TX-SYN-1001'))
  assert.throws(() => selectNetwork(model, query({ asOf: 'invalid' })), /Invalid/)
})

test('direction filters change traversal and unavailable dimensions do not become zero', () => {
  const outbound = selectNetwork(model, query({ direction: 'outbound', maxHops: 1 }))
  assert.deepEqual(outbound.edges.map((edge) => edge.id), ['TX-SYN-1001'])
  const inbound = selectNetwork(model, query({ direction: 'inbound', maxHops: 1 }))
  assert.deepEqual(inbound.edges.map((edge) => edge.id), ['TX-SYN-1003'])
  const mule = selectNetwork(model, query({ dimension: 'mule' }))
  assert.equal(mule.edges.length, 0)
  assert.equal(mule.eligibleEdges, 0)
  assert.equal(model.edges[0].indices.mule, null)
  assert.equal(selectNetwork(model, query({ dimension: 'fraud' })).edges.length, 4)
})

test('temporal path is directed, bounded, same-currency and ordered by event time', () => {
  const view = selectNetwork(model, query())
  const path = findTemporalPath(view, 'NODE-DEMO-01', 'NODE-DEMO-03', 2, 'SYN')
  assert.deepEqual(path.map((edge) => edge.id), ['TX-SYN-1001', 'TX-SYN-1002'])
  assert.equal(findTemporalPath(view, 'NODE-DEMO-01', 'NODE-DEMO-03', 1, 'SYN'), null)
  assert.equal(findTemporalPath(view, 'NODE-DEMO-03', 'NODE-DEMO-01', 3, 'SYN'), null)
  assert.equal(findTemporalPath(view, 'NODE-DEMO-01', 'NODE-DEMO-03', 2, 'ALL'), null)
  assert.equal(findTemporalPath(view, 'NODE-DEMO-01', 'NODE-DEMO-01', 2, 'SYN'), null)
  const reversedTime = structuredClone(view)
  reversedTime.edges.find((edge) => edge.id === 'TX-SYN-1002').occurred_at = '2026-10-23T08:00:00+07:00'
  assert.equal(findTemporalPath(reversedTime, 'NODE-DEMO-01', 'NODE-DEMO-03', 2, 'SYN'), null)
  const mixedCurrency = structuredClone(view)
  mixedCurrency.edges.find((edge) => edge.id === 'TX-SYN-1002').currency = 'USD'
  assert.equal(findTemporalPath(mixedCurrency, 'NODE-DEMO-01', 'NODE-DEMO-03', 2, 'SYN'), null)
  const capped = selectNetwork(model, query({ maxNodes: 3 }))
  assert.equal(findTemporalPath(capped, 'NODE-DEMO-01', 'NODE-DEMO-03', 2, 'SYN'), null)
})

test('queries and path tracing leave source transactions, alerts and model unchanged', () => {
  const seedBefore = JSON.stringify(fixtures)
  const modelBefore = JSON.stringify(model)
  const view = selectNetwork(model, query({ currency: 'ALL' }))
  findTemporalPath(view, 'NODE-DEMO-01', 'NODE-DEMO-03', 3, 'SYN')
  assert.equal(JSON.stringify(model), modelBefore)
  assert.equal(JSON.stringify(fixtures), seedBefore)
})
