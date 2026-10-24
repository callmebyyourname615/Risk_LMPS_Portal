type Seed = typeof import('./data/fixtures.json')
type Bindings = typeof import('./data/network.json')
export type NetworkNode = Bindings['nodes'][number]
export type NetworkDimension = 'fraud' | 'mule' | 'aml'
export type NetworkEdge = Bindings['edges'][number] & {
  id: string
  institution_id: string
  amount: string
  currency: string
  occurred_at: string
  lifecycle: string
  assessment_id: string | null
  indices: Record<NetworkDimension, number | null>
}
export type NetworkModel = { nodes: NetworkNode[]; edges: NetworkEdge[] }
export type NetworkQuery = {
  institution: string
  root: string
  days: number
  asOf: string
  currency: string
  dimension: 'ALL' | NetworkDimension
  direction: 'both' | 'outbound' | 'inbound'
  maxHops: number
  maxNodes: number
}
export type NetworkView = NetworkModel & {
  eligibleEdges: number
  reachableNodes: number
  truncated: boolean
  nodeLimited: boolean
  hopLimited: boolean
}

// shortcut: node bindings are deliberately invented; replace only after real identity resolution is verified.
export function createNetworkModel(seed: Seed, bindings: Bindings): NetworkModel {
  const nodes = bindings.nodes.map((node) => ({ ...node }))
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  if (nodeMap.size !== nodes.length) throw new Error('Duplicate network reference.')
  const seen = new Set<string>()
  const edges = bindings.edges.map((edge) => {
    const tx = seed.transactions.find((item) => item.id === edge.transaction_id)
    const from = nodeMap.get(edge.source)
    const to = nodeMap.get(edge.target)
    if (!tx || !from || !to || from.institution_id !== tx.institution_id || to.institution_id !== tx.institution_id || seen.has(tx.id)) {
      throw new Error('Invalid or duplicate synthetic network binding.')
    }
    seen.add(tx.id)
    const assessment = seed.assessments.find((item) => item.id === tx.assessment_id)
    return {
      ...edge, id: tx.id, institution_id: tx.institution_id, amount: tx.amount,
      currency: tx.currency, occurred_at: tx.occurred_at, lifecycle: tx.lifecycle,
      assessment_id: tx.assessment_id,
      indices: { fraud: assessment?.dimensions.fraud.index ?? null, mule: assessment?.dimensions.mule.index ?? null, aml: assessment?.dimensions.aml.index ?? null },
    }
  })
  return { nodes, edges }
}

function neighbor(edge: NetworkEdge, node: string, direction: NetworkQuery['direction']) {
  if (edge.source === node && direction !== 'inbound') return edge.target
  if (edge.target === node && direction !== 'outbound') return edge.source
  return null
}

export function selectNetwork(model: NetworkModel, query: NetworkQuery): NetworkView {
  if (!Number.isInteger(query.maxHops) || query.maxHops < 1 || query.maxHops > 3 ||
      !Number.isInteger(query.maxNodes) || query.maxNodes < 1 || query.maxNodes > 12 ||
      ![1, 7, 30].includes(query.days) || !Number.isFinite(Date.parse(query.asOf)) ||
      !['both', 'outbound', 'inbound'].includes(query.direction) || !['ALL', 'fraud', 'mule', 'aml'].includes(query.dimension)) {
    throw new Error('Invalid bounded network query.')
  }
  const empty = { nodes: [], edges: [], eligibleEdges: 0, reachableNodes: 0, truncated: false, nodeLimited: false, hopLimited: false }
  const allowedNodes = model.nodes.filter((node) => query.institution === 'ALL' || node.institution_id === query.institution)
  if (!allowedNodes.some((node) => node.id === query.root)) return empty
  const allowed = new Set(allowedNodes.map((node) => node.id))
  const until = Date.parse(query.asOf)
  const since = until - query.days * 86400000
  const eligible = model.edges.filter((edge) => allowed.has(edge.source) && allowed.has(edge.target) &&
    (query.institution === 'ALL' || edge.institution_id === query.institution) &&
    Date.parse(edge.occurred_at) >= since && Date.parse(edge.occurred_at) <= until &&
    (query.currency === 'ALL' || edge.currency === query.currency) &&
    (query.dimension === 'ALL' || edge.indices[query.dimension] !== null),
  ).sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at) || a.id.localeCompare(b.id))

  const distances = new Map([[query.root, 0]])
  const queue = [query.root]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]
    if (distances.get(current)! >= query.maxHops) continue
    for (const edge of eligible) {
      const next = neighbor(edge, current, query.direction)
      if (next && !distances.has(next)) { distances.set(next, distances.get(current)! + 1); queue.push(next) }
    }
  }
  const visibleIds = new Set(queue.slice(0, query.maxNodes))
  const hopLimited = eligible.some((edge) => [...distances].some(([node, distance]) => {
    const next = neighbor(edge, node, query.direction)
    return distance === query.maxHops && !!next && !distances.has(next)
  }))
  const edges = eligible.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target) && [...distances].some(([node, distance]) => distance < query.maxHops && !!neighbor(edge, node, query.direction)))
  return {
    nodes: queue.slice(0, query.maxNodes).map((id) => model.nodes.find((node) => node.id === id)!),
    edges, eligibleEdges: eligible.length, reachableNodes: distances.size,
    nodeLimited: queue.length > query.maxNodes, hopLimited,
    truncated: queue.length > query.maxNodes || hopLimited,
  }
}

export function findTemporalPath(view: NetworkModel, start: string, target: string, maxHops: number, currency: string): NetworkEdge[] | null {
  if (!Number.isInteger(maxHops) || maxHops < 1 || maxHops > 3 || currency === 'ALL' || !currency || start === target) return null
  if (![start, target].every((id) => view.nodes.some((node) => node.id === id))) return null
  const queue: { node: string; after: number; path: NetworkEdge[]; visited: Set<string> }[] = [
    { node: start, after: -Infinity, path: [], visited: new Set([start]) },
  ]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]
    if (current.path.length >= maxHops) continue
    const nextEdges = view.edges.filter((edge) => edge.source === current.node && edge.currency === currency && Date.parse(edge.occurred_at) >= current.after && !current.visited.has(edge.target))
      .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at) || a.id.localeCompare(b.id))
    for (const edge of nextEdges) {
      const path = [...current.path, edge]
      if (edge.target === target) return path
      queue.push({ node: edge.target, after: Date.parse(edge.occurred_at), path, visited: new Set([...current.visited, edge.target]) })
    }
  }
  return null
}
