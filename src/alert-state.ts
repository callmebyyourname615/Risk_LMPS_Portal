import { createCaseRecord, invalidateCaseOutcomes } from './case-state.ts'
export type { CaseRecord } from './case-state.ts'
import type { CaseRecord } from './case-state.ts'
export type AlertStatus = 'open' | 'acknowledged' | 'reviewed'
export type ReviewOpinion = 'suspicious' | 'legitimate' | 'unknown'

type Seed = typeof import('./data/fixtures.json')

export type AlertRecord = Omit<Seed['alerts'][number], 'state'> & {
  state: AlertStatus
  version: number
  review?: { opinion: ReviewOpinion; rationale: string; actor: string; at: string; review_status: 'analyst_reviewed'; verification: 'unverified'; training_eligible: false }
}

export type AlertEvent = {
  id: string
  alert_id: string
  institution_id: string
  action: string
  actor: string
  at: string
  detail: string
  version: number
  request_id: string
}

export type AlertWorkspace = {
  alerts: AlertRecord[]
  cases: CaseRecord[]
  events: AlertEvent[]
  requests: { id: string; signature: string }[]
}

export type AlertCommand = {
  alertId: string
  expectedVersion: number
  institution: string
  actor: string
  requestId: string
  at: string
} & (
  | { kind: 'acknowledge' }
  | { kind: 'review'; opinion: ReviewOpinion; rationale: string }
  | { kind: 'link_case'; caseId: string }
  | { kind: 'create_case'; caseId: string; title: string }
)

export class AlertActionError extends Error {
  code: 'conflict' | 'permission' | 'validation'

  constructor(code: 'conflict' | 'permission' | 'validation', message: string) {
    super(message)
    this.code = code
    this.name = 'AlertActionError'
  }
}

export function createAlertWorkspace(seed: Seed): AlertWorkspace {
  return {
    alerts: seed.alerts.map((alert) => ({ ...alert, state: alert.state as AlertStatus, version: 1 })),
    cases: seed.cases.map((item) => createCaseRecord(item, seed.alerts.filter((alert) => alert.case_id === item.id).map((alert) => alert.id))),
    events: [],
    requests: [],
  }
}

// shortcut: session-only mock; replace with authenticated APIs before sharing or persisting analyst work.
export function applyAlertCommand(workspace: AlertWorkspace, command: AlertCommand): AlertWorkspace {
  const alert = workspace.alerts.find((item) => item.id === command.alertId)
  if (!alert || (command.institution !== 'ALL' && alert.institution_id !== command.institution)) {
    throw new AlertActionError('permission', 'This alert is outside the selected institution scope.')
  }
  if (!command.actor.trim() || !command.requestId || !Number.isFinite(Date.parse(command.at))) {
    throw new AlertActionError('validation', 'An actor, request reference and valid timestamp are required.')
  }
  const { requestId, ...payload } = command
  const signature = JSON.stringify(payload)
  const prior = workspace.requests.find((request) => request.id === requestId)
  if (prior) {
    if (prior.signature !== signature) throw new AlertActionError('conflict', 'This request reference was already used with different data.')
    return workspace
  }
  if (alert.version !== command.expectedVersion) {
    throw new AlertActionError('conflict', 'This alert has changed. Reload the latest version before saving.')
  }

  const nextAlert: AlertRecord = { ...alert, version: alert.version + 1, updated_at: command.at }
  let cases = workspace.cases
  let detail = ''

  switch (command.kind) {
    case 'acknowledge':
      if (alert.state !== 'open') throw new AlertActionError('conflict', 'Only open alerts can be acknowledged.')
      nextAlert.state = 'acknowledged'
      detail = 'Alert explicitly acknowledged. Case and payment states are unchanged.'
      break
    case 'review': {
      if (alert.state !== 'acknowledged') throw new AlertActionError('conflict', 'Acknowledge this alert before recording a review.')
      const rationale = command.rationale.trim()
      if (!['suspicious', 'legitimate', 'unknown'].includes(command.opinion) || !rationale || rationale.length > 2000) {
        throw new AlertActionError('validation', 'Select an opinion and enter a rationale of 1–2,000 characters.')
      }
      nextAlert.state = 'reviewed'
      nextAlert.review = { opinion: command.opinion, rationale, actor: command.actor, at: command.at, review_status: 'analyst_reviewed', verification: 'unverified', training_eligible: false }
      detail = `Analyst opinion: ${command.opinion}. Unverified; training eligible: false.`
      break
    }
    case 'create_case':
    case 'link_case': {
      if (alert.case_id) throw new AlertActionError('conflict', `This alert already belongs to ${alert.case_id}.`)
      if (command.kind === 'create_case') {
        const title = command.title.trim()
        if (!title || title.length > 120 || !/^CASE-DEMO-[a-zA-Z0-9-]{1,64}$/.test(command.caseId)) {
          throw new AlertActionError('validation', 'Enter a case title of 1–120 characters and a valid demo reference.')
        }
        if (cases.some((item) => item.id === command.caseId)) throw new AlertActionError('conflict', 'This case reference already exists.')
        cases = [...cases, { ...createCaseRecord({ id: command.caseId, institution_id: alert.institution_id, state: 'open', updated_at: command.at }, [alert.id]), title, history: [{ id: `CASE-AUD-${requestId}`, action: 'create', actor: command.actor, at: command.at, version: 1, detail: 'Created from the alert workspace. Assignment is a separate action.', request_id: requestId }] }]
      } else {
        const target = cases.find((item) => item.id === command.caseId)
        if (!target || target.institution_id !== alert.institution_id) {
          throw new AlertActionError('permission', 'Choose a case in the same institution as this alert.')
        }
        if (target.state === 'closed') throw new AlertActionError('conflict', 'Closed cases cannot receive new alert evidence in this demo.')
        if (target.alert_ids.length >= 20) throw new AlertActionError('validation', 'A case can contain at most 20 alerts.')
        cases = cases.map((item) => item.id === target.id ? {
          ...invalidateCaseOutcomes(item), version: item.version + 1, alert_ids: [...item.alert_ids, alert.id], updated_at: command.at,
          history: [...item.history, { id: `CASE-AUD-${requestId}`, action: 'link_alert', actor: command.actor, at: command.at, version: item.version + 1, detail: `Linked ${alert.id} from the alert workspace. Prior outcomes require reassessment.`, request_id: requestId }],
        } : item)
      }
      nextAlert.case_id = command.caseId
      detail = `${command.kind === 'create_case' ? 'Created' : 'Linked to'} ${command.caseId}. Alert review state is unchanged.`
      break
    }
    default:
      throw new AlertActionError('validation', 'Unsupported alert action.')
  }

  return {
    alerts: workspace.alerts.map((item) => item.id === alert.id ? nextAlert : item),
    cases,
    events: [...workspace.events, {
      id: `AUD-${command.requestId}`, alert_id: alert.id, institution_id: alert.institution_id,
      action: command.kind, actor: command.actor, at: command.at, detail,
      version: nextAlert.version, request_id: command.requestId,
    }],
    requests: [...workspace.requests, { id: requestId, signature }],
  }
}
