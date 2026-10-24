import { CASE_DIMENSIONS, freshCaseOutcomes, type CaseOutcome, type CaseRecord } from './case-state.ts'

export type OpinionFreshness = 'current' | 'stale' | 'superseded'
export type OutcomeRow = CaseOutcome & {
  id: string; case_id: string; case_title: string; institution_id: string
  case_state: CaseRecord['state']; case_version: number; case_updated_at: string
  opinion_version: number; freshness: OpinionFreshness
}
export type OutcomeFilters = {
  search: string; dimension: string; opinion: string; freshness: string
  reviewer: string; caseId: string; reviewStatus: string; maturity: string; eligibility: string
}
export const DEFAULT_OUTCOME_FILTERS: OutcomeFilters = {
  search: '', dimension: 'all', opinion: 'all', freshness: 'latest', reviewer: 'all',
  caseId: 'all', reviewStatus: 'all', maturity: 'all', eligibility: 'all',
}

/** Read-only projection of recorded case opinions. Unreviewed dimensions never become rows or labels. */
export function buildOutcomeView(cases: CaseRecord[], scope: { institution: string; range: string; asOf: string }) {
  const days = scope.range === '24h' ? 1 : scope.range === '7d' ? 7 : 30
  const since = Date.parse(scope.asOf) - days * 86400000
  // The fixture anchors the lower bound; include subsequent in-session case updates.
  const scoped = cases.filter((item) => (scope.institution === 'ALL' || item.institution_id === scope.institution) && Date.parse(item.updated_at) >= since)
  const rows = scoped.flatMap((item): OutcomeRow[] => {
    const fresh = freshCaseOutcomes(item)
    return CASE_DIMENSIONS.flatMap((dimension) => {
      const versions = item.outcomes.filter((outcome) => outcome.dimension === dimension)
      return versions.map((outcome, index): OutcomeRow => ({
        ...outcome, evidence: outcome.evidence.map((evidence) => ({ ...evidence })),
        id: `${item.id}:${dimension}:${index + 1}`, case_id: item.id, case_title: item.title,
        institution_id: item.institution_id, case_state: item.state, case_version: item.version,
        case_updated_at: item.updated_at, opinion_version: index + 1,
        freshness: fresh[dimension] === outcome ? 'current' : index === versions.length - 1 ? 'stale' : 'superseded',
      }))
    })
  }).sort((a, b) => {
    const aTime = a.at ? Date.parse(a.at) : -Infinity, bTime = b.at ? Date.parse(b.at) : -Infinity
    return (aTime === bTime ? 0 : bTime - aTime) || a.case_id.localeCompare(b.case_id) || CASE_DIMENSIONS.indexOf(a.dimension) - CASE_DIMENSIONS.indexOf(b.dimension) || b.opinion_version - a.opinion_version
  })
  const readiness = scoped.map((item) => {
    const current = freshCaseOutcomes(item)
    const missing = CASE_DIMENSIONS.filter((dim) => !item.outcomes.some((outcome) => outcome.dimension === dim))
    const stale = CASE_DIMENSIONS.filter((dim) => !current[dim] && !missing.includes(dim))
    const unknown = CASE_DIMENSIONS.filter((dim) => current[dim]?.opinion === 'unknown')
    return { case: item, missing, stale, unknown, currentCount: CASE_DIMENSIONS.filter((dim) => current[dim]).length }
  })
  const latest = rows.filter((row) => row.freshness !== 'superseded')
  return {
    cases: scoped, rows, readiness,
    summary: {
      recorded: latest.length, unknown: latest.filter((row) => row.opinion === 'unknown').length,
      needsReview: readiness.reduce((count, item) => count + item.missing.length + item.stale.length, 0),
      trainingEligible: 0,
    },
  }
}

export function filterOutcomeRows(rows: OutcomeRow[], filters: OutcomeFilters) {
  const search = filters.search.trim().toLowerCase()
  return rows.filter((row) =>
    (!search || `${row.case_id} ${row.case_title} ${row.actor} ${row.rationale} ${row.evidence.map((item) => `${item.alert_id} ${item.assessment_id} ${item.transaction_id}`).join(' ')}`.toLowerCase().includes(search)) &&
    (filters.dimension === 'all' || row.dimension === filters.dimension) &&
    (filters.opinion === 'all' || row.opinion === filters.opinion) &&
    (filters.freshness === 'all' || (filters.freshness === 'latest' ? row.freshness !== 'superseded' : row.freshness === filters.freshness)) &&
    (filters.reviewer === 'all' || row.actor === filters.reviewer) &&
    (filters.caseId === 'all' || row.case_id === filters.caseId) &&
    (filters.reviewStatus === 'all' || row.review_status === filters.reviewStatus) &&
    (filters.maturity === 'all' || filters.maturity === 'unavailable') &&
    (filters.eligibility === 'all' || filters.eligibility === 'ineligible'),
  )
}

export function outcomeEligibilityReasons(row: OutcomeRow) {
  return [
    'Analyst opinion remains unverified.',
    ...(row.opinion === 'unknown' ? ['Unknown is unresolved; it cannot become a negative training example.'] : []),
    ...(row.freshness !== 'current' ? ['This opinion is historical and requires a fresh case review.'] : []),
    ...(!row.evidence.length ? ['The historical frozen evidence snapshot was not supplied.'] : []),
    'Independent adjudication and maturity policy are not available.',
    'Sampling, QA and governed dataset provenance are not available.',
    'Synthetic demo opinions are not production training labels.',
  ]
}
