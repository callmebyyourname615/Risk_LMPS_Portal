import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import fixtures from './data/fixtures.json'
import { AlertActionError, applyAlertCommand, createAlertWorkspace, type AlertCommand, type AlertRecord, type AlertWorkspace, type CaseRecord, type ReviewOpinion } from './alert-state'
import './alerts.css'
import networkBindings from './data/network.json'
import { createNetworkModel, findTemporalPath, selectNetwork, type NetworkDimension, type NetworkEdge, type NetworkQuery, type NetworkView } from './network'
import './network.css'
import { useNetworkCanvasMotion, useNetworkInspectorMotion, useNetworkPageMotion } from './network-motion'
import { useMonitoringMotion } from './monitoring-motion'
import './monitoring-polish.css'
import { applyCaseCommand, canCase, caseEvidence, CaseActionError, CASE_ACTORS, CASE_DIMENSIONS, freshCaseOutcomes, type CaseCommand, type CaseDimension, type CaseOpinion } from './case-state'
import './cases.css'
import { buildOutcomeView, DEFAULT_OUTCOME_FILTERS, filterOutcomeRows, outcomeEligibilityReasons, type OutcomeFilters } from './outcomes'
import './outcomes.css'
import { DETECTOR_EXAMPLES, DEFAULT_DETECTOR_FILTERS, conditionFields, detectorReady, draftDetectorVersion, filterDetectors, runDetectorBacktest, scopedDetectorTransactions, type AmountCondition, type DetectorBacktest, type DetectorDefinition, type DetectorFilters, type DetectorVersion } from './detectors'
import './detectors.css'
import { POLICY_ACTORS, DEFAULT_POLICY_FILTERS, PolicyError, applyPolicyCommand, canPolicy, comparePolicyVersions, createPolicyWorkspace, filterPolicies, findPolicyBinding, policyActorName, type PolicyAction, type PolicyCommand, type PolicyComparison, type PolicyCondition, type PolicyFilters, type PolicyJob, type PolicyWorkspace, type RiskPolicy } from './policies'
import './policies.css'
import { DEFAULT_MODEL_REGISTRY_FILTERS, DEFAULT_TEMPORAL_SPLIT, MODEL_DIMENSIONS, MODEL_SERVING_CHECKS, MODEL_TEMPLATES, buildModelContext, createModelReadinessSnapshot, filterModelTemplates, inspectTemporalSplit, modelReadinessGates, unavailableModelMetrics, type ModelReadinessSnapshot, type ModelRegistryFilters, type ModelScope, type TemporalSplit } from './models'
import './models.css'
import { ACCESS_CAPABILITIES, ACCESS_PERSONAS, ACCESS_PREREQUISITES, ACCESS_ROUTES, AccessError, allowsInstitution, assertAccessCapability, assertDemoMutation, capabilityState, createAccessSession, decideAccess, decideRouteAccess, getAccessPersona, resetAccessSession, setDemoSessionStatus, switchAccessInstitution, switchAccessPersona, type AccessCapability, type AccessSession, type DemoSessionStatus } from './access'
import './access.css'
import { DEFAULT_DATASET_FILTERS, OFFLINE_CHECKPOINT_SIZE, OFFLINE_FILE_LIMIT, OFFLINE_ROW_LIMIT, OFFLINE_TABLES, DatasetError, applyDatasetCommand, createDatasetWorkspace, offlineBatchCounts, selectOfflineBatches, validateOfflineMetadata, type DatasetCommand, type DatasetFilters, type DatasetWorkspace, type OfflineTable } from './datasets'
import './datasets.css'
import { DEFAULT_AUDIT_FILTERS, HEALTH_DEPENDENCIES, RECOVERY_READINESS, SOURCE_READINESS, buildAuditEvents, buildHealthView, buildNotificationIntents, filterAuditEvents, prepareAuditCsv, type AuditExportRecord, type AuditFilters } from './operations'
import './operations.css'

type IconName =
  | 'overview'
  | 'transactions'
  | 'assessments'
  | 'alerts'
  | 'network'
  | 'cases'
  | 'outcomes'
  | 'detectors'
  | 'policies'
  | 'models'
  | 'datasets'
  | 'health'
  | 'notifications'
  | 'audit'
  | 'access'
  | 'search'
  | 'bell'
  | 'chevron'
  | 'menu'
  | 'arrow'
  | 'check'
  | 'clock'

const iconPaths: Record<IconName, ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  transactions: <><path d="M7 7h12l-3-3" /><path d="m19 7-3 3" /><path d="M17 17H5l3 3" /><path d="m5 17 3-3" /></>,
  assessments: <><path d="M9 3h6l1 3h3v15H5V6h3l1-3Z" /><path d="m9 14 2 2 4-5" /></>,
  alerts: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  network: <><circle cx="5" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m7.3 10.8 8.4-3.6M7.3 13.2l8.4 3.6" /></>,
  cases: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4h8v2M3 11h18M10 14h4" /></>,
  outcomes: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  detectors: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  policies: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
  models: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  datasets: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  health: <><path d="M3 12h4l2-5 4 10 2-5h6" /></>,
  notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  audit: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  access: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

const navGroups = [
  { label: 'Overview', items: [{ label: 'Overview', lo: 'ພາບລວມ', path: '/overview', icon: 'overview' as IconName }] },
  { label: 'Monitoring', items: [
    { label: 'Transactions', lo: 'ທຸລະກຳ', path: '/transactions', icon: 'transactions' as IconName },
    { label: 'Assessments', lo: 'ການປະເມີນ', path: '/assessments', icon: 'assessments' as IconName },
    { label: 'Alerts', lo: 'ແຈ້ງເຕືອນ', path: '/alerts', icon: 'alerts' as IconName },
    { label: 'Network Explorer', lo: 'ເຄືອຂ່າຍ', path: '/network', icon: 'network' as IconName },
  ]},
  { label: 'Investigations', items: [
    { label: 'Cases', lo: 'ຄະດີ', path: '/cases', icon: 'cases' as IconName },
    { label: 'Outcomes & Label Review', lo: 'ຜົນການກວດສອບ', path: '/outcomes', icon: 'outcomes' as IconName },
  ]},
  { label: 'Detection', items: [
    { label: 'Detector Catalog', lo: 'ລາຍການຕົວກວດ', path: '/detectors', icon: 'detectors' as IconName },
    { label: 'Risk Policies', lo: 'ນະໂຍບາຍຄວາມສ່ຽງ', path: '/policies', icon: 'policies' as IconName },
    { label: 'Evaluation & Models', lo: 'ການປະເມີນໂມເດວ', path: '/models', icon: 'models' as IconName },
  ]},
  { label: 'Data & Operations', items: [
    { label: 'Datasets & Imports', lo: 'ຊຸດຂໍ້ມູນ', path: '/datasets', icon: 'datasets' as IconName },
    { label: 'Data & System Health', lo: 'ສຸຂະພາບລະບົບ', path: '/health', icon: 'health' as IconName },
    { label: 'Notifications', lo: 'ການແຈ້ງເຕືອນ', path: '/notifications', icon: 'notifications' as IconName },
    { label: 'Audit', lo: 'ກວດສອບ', path: '/audit', icon: 'audit' as IconName },
  ]},
  { label: 'Administration', items: [{ label: 'Access & Scope', lo: 'ສິດ ແລະ ຂອບເຂດ', path: '/access', icon: 'access' as IconName }] },
]

const allNav = navGroups.flatMap((group) => group.items)
const routeDetails: Record<string, { eyebrow: string; title: string; description: string; status: string }> = {
  '/transactions': { eyebrow: 'Monitoring', title: 'Transactions', description: 'Explore scoped synthetic transactions, immutable revisions and source lineage.', status: 'Workflow scheduled for the next iteration' },
  '/assessments': { eyebrow: 'Monitoring', title: 'Assessments', description: 'Review frozen three-dimension indices, coverage and detector evidence.', status: 'Read-only workspace coming next' },
  '/alerts': { eyebrow: 'Monitoring', title: 'Alerts', description: 'Triage open, acknowledged and reviewed synthetic risk alerts.', status: 'Alert workflow coming next' },
  '/network': { eyebrow: 'Monitoring', title: 'Network Explorer', description: 'Inspect bounded invented transaction paths with unresolved identity.', status: 'Synthetic graph workspace coming next' },
  '/cases': { eyebrow: 'Investigations', title: 'Cases', description: 'Investigate linked evidence and record unverified analyst outcomes.', status: 'Case workflow coming next' },
  '/outcomes': { eyebrow: 'Investigations', title: 'Outcomes & Label Review', description: 'Separate analyst opinions from future governed label adjudication.', status: 'Governed review workspace is planned' },
  '/detectors': { eyebrow: 'Detection', title: 'Detector Catalog', description: 'Browse stable synthetic detector contracts, prerequisites and limitations.', status: 'Catalog detail coming next' },
  '/policies': { eyebrow: 'Detection', title: 'Risk Policies', description: 'Review immutable policy versions and independent maker-checker approval.', status: 'Governance workflow coming next' },
  '/models': { eyebrow: 'Detection', title: 'Evaluation & Models', description: 'A planned workspace for reproducible evaluation and governed model artifacts.', status: 'Metrics unavailable until eligible labels exist' },
  '/datasets': { eyebrow: 'Data & Operations', title: 'Datasets & Imports', description: 'Inspect local offline staging, profiling and reconciliation fixtures.', status: 'Guided offline workflow coming next' },
  '/health': { eyebrow: 'Data & Operations', title: 'Data & System Health', description: 'Review mock data readiness, risk jobs and platform evidence.', status: 'Operational detail coming next' },
  '/notifications': { eyebrow: 'Data & Operations', title: 'Notifications', description: 'Preview durable inbox intents without implying delivery or receipt.', status: 'Delivery connections are not configured' },
  '/audit': { eyebrow: 'Data & Operations', title: 'Audit', description: 'Inspect append-only synthetic actions and safe structural metadata.', status: 'Scoped audit explorer coming next' },
  '/access': { eyebrow: 'Administration', title: 'Access & Scope', description: 'Review the current demo persona, institutions and capability boundaries.', status: 'Read-only access matrix coming next' },
}

function Button({ children, primary, compact, onClick, ariaLabel, disabled }: { children: ReactNode; primary?: boolean; compact?: boolean; onClick?: () => void; ariaLabel?: string; disabled?: boolean }) {
  return <button type="button" className={`button${primary ? ' primary' : ''}${compact ? ' compact' : ''}`} onClick={onClick} aria-label={ariaLabel} disabled={disabled}>{children}</button>
}

function Select({ value, onChange, label, children, compact }: { value: string; onChange: (value: string) => void; label: string; children: ReactNode; compact?: boolean }) {
  return <label className={`select-wrap${compact ? ' compact' : ''}`}><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>{children}</select><Icon name="chevron" size={14} /></label>
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}><span className="badge-dot" />{children}</span>
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function Shell({ children, route, institution, setInstitution, range, setRange, locale, setLocale, openAlertCount, accessSession, accessNotice, onDismissNotice }: {
  children: ReactNode; route: string; institution: string; setInstitution: (v: string) => void; range: string; setRange: (v: string) => void; locale: string; setLocale: (v: string) => void; openAlertCount: number | null
  accessSession: AccessSession; accessNotice: string; onDismissNotice: () => void
}) {
  const [navOpen, setNavOpen] = useState(false)
  const persona = getAccessPersona(accessSession)!
  const current = allNav.find((item) => route === item.path || route.startsWith(`${item.path}/`)) ?? allNav[0]
  const text = (item: { label: string; lo: string }) => locale === 'lo' ? item.lo : item.label

  return <div className={`app-shell${navOpen ? ' nav-open' : ''}`} lang={locale}>
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><span /><span /><span /></div>
        <div><strong>LMPS Risk</strong><small>Monitoring & Investigations</small></div>
      </div>
      <nav className="nav" aria-label="Primary navigation">
        {navGroups.map((group) => <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map((item) => <button type="button" key={item.path} className={`nav-item${route === item.path || route.startsWith(`${item.path}/`) ? ' active' : ''}`} onClick={() => { navigate(item.path); setNavOpen(false) }}>
            <Icon name={item.icon} /><span>{text(item)}</span>{!decideRouteAccess(accessSession, item.path).allowed ? <Icon name="access" size={12} /> : item.path === '/alerts' && openAlertCount !== null && <b>{openAlertCount}</b>}
          </button>)}
        </div>)}
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="profile-card" onClick={() => { navigate('/access'); setNavOpen(false) }} aria-label="Inspect demo persona and access">
          <span className="avatar">{persona.initials}</span>
          <span><strong>{persona.name}</strong><small>{persona.role} · Demo</small></span>
          <Icon name="chevron" size={14} />
        </button>
      </div>
    </aside>
    {navOpen && <button type="button" className="scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation" />}
    <div className="workspace">
      <header className="topbar">
        <div className="topbar-title">
          <Button compact onClick={() => setNavOpen(!navOpen)} ariaLabel="Open navigation"><span className="mobile-menu"><Icon name="menu" /></span></Button>
          <span><small>{routeDetails[current.path]?.eyebrow ?? 'Workspace'}</small><strong>{text(current)}</strong></span>
        </div>
        <div className="topbar-actions">
          <div className="search-box"><Icon name="search" size={16} /><input aria-label="Search fixture IDs" placeholder="Search fixture IDs" /></div>
          <Select compact label="Institution" value={institution} onChange={setInstitution}>
            {persona.institutions.map((value) => <option value={value} key={value}>{value.replace('INST-DEMO-', 'Demo Institution ')}</option>)}
            {allowsInstitution(accessSession, 'ALL') && <option value="ALL">All authorized institutions</option>}
          </Select>
          <Select compact label="Time range" value={range} onChange={setRange}>
            <option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
          </Select>
          <Select compact label="Language" value={locale} onChange={setLocale}>
            <option value="en">English</option><option value="lo">ລາວ</option>
          </Select>
          <Badge tone="synthetic">Synthetic</Badge>
          <Button compact ariaLabel="Open alert inbox" onClick={() => navigate('/alerts')}><Icon name="bell" size={17} /><span className="notification-dot" /></Button>
          <button type="button" className="avatar small access-avatar" onClick={() => navigate('/access')} aria-label={`Inspect access for ${persona.name}`}>{persona.initials}</button>
        </div>
      </header>
      <main>{accessNotice && <div className="access-shell-notice" role="status"><Icon name="access" size={15} /><span>{accessNotice}</span><Button compact onClick={onDismissNotice} ariaLabel="Dismiss access message">Dismiss</Button></div>}{children}</main>
    </div>
  </div>
}

type Transaction = (typeof fixtures.transactions)[number]
type Alert = AlertRecord
type Assessment = (typeof fixtures.assessments)[number]

function KpiCard({ label, value, detail, icon, tone, onClick }: { label: string; value: string; detail: string; icon: IconName; tone: string; onClick?: () => void }) {
  const content = <>
    <span className="kpi-icon"><Icon name={icon} /></span>
    <span className="kpi-content"><small>{label}</small><strong>{value}</strong><span>{detail}</span></span>
  </>
  return onClick ? <button type="button" className={`kpi-card ${tone}`} onClick={onClick}>{content}<span className="kpi-arrow"><Icon name="arrow" size={16} /></span></button> : <article className={`kpi-card kpi-static ${tone}`}>{content}</article>
}

function PanelHeader({ title, subtitle, aside }: { title: string; subtitle: string; aside?: ReactNode }) {
  return <div className="panel-header"><div><h3>{title}</h3><p>{subtitle}</p></div>{aside}</div>
}

function LineChart({ values, color = 'amber', area = false }: { values: number[]; color?: string; area?: boolean }) {
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${10 + index * (280 / Math.max(values.length - 1, 1))},${125 - value / max * 95}`).join(' ')
  const areaPoints = `10,130 ${points} 290,130`
  return <div className={`chart line-chart ${color}`}>
    <svg viewBox="0 0 300 145" role="img" aria-label={`Chart values ${values.join(', ')}`}>
      <g className="gridlines"><path d="M10 30H290M10 62H290M10 94H290M10 126H290" /></g>
      {area && <polygon points={areaPoints} className="chart-area" />}
      <polyline points={points} className="chart-line" />
      {values.map((value, index) => <circle key={index} cx={10 + index * (280 / Math.max(values.length - 1, 1))} cy={125 - value / max * 95} r="3" tabIndex={0}><title>{value}</title></circle>)}
    </svg>
  </div>
}

function BarChart({ values }: { values: { label: string; value: number; tone: string }[] }) {
  const max = Math.max(...values.map((item) => item.value), 1)
  return <div className="bar-chart" role="img" aria-label={values.map((v) => `${v.label}: ${v.value}`).join(', ')}>
    {values.map((item) => <div className="bar-column" key={item.label}><span className="bar-value">{item.value}</span><div className={`bar ${item.tone}`} style={{ height: `${Math.max(8, item.value / max * 112)}px` }} /><small>{item.label}</small></div>)}
  </div>
}

function Heatmap({ transactions }: { transactions: Transaction[] }) {
  const days = ['21 Oct', '22 Oct', '23 Oct']
  const institutions = ['INST-DEMO-A', 'INST-DEMO-B']
  return <div className="heatmap" role="grid" aria-label="Institution by day transaction activity">
    <span />{days.map((d) => <small key={d}>{d}</small>)}
    {institutions.map((inst) => <div className="heat-row" key={inst}><b>{inst.replace('INST-DEMO-', 'Demo ')}</b>{days.map((day) => {
      const count = transactions.filter((tx) => tx.institution_id === inst && new Date(tx.occurred_at).getUTCDate() === Number(day.slice(0, 2))).length
      return <span key={day} className={`heat-cell l${count}`} tabIndex={0} title={`${inst}, ${day}: ${count} transactions`}>{count}</span>
    })}</div>)}
  </div>
}

function Donut({ reviewed, total }: { reviewed: number; total: number }) {
  const percent = total ? Math.round(reviewed / total * 100) : 0
  return <div className="donut-wrap">
    <div className="donut" style={{ '--percent': `${percent * 3.6}deg` } as React.CSSProperties}><span><strong>{percent}%</strong><small>reviewed</small></span></div>
    <div className="donut-legend"><span><i className="reviewed" />Reviewed <b>{reviewed}</b></span><span><i />Needs review <b>{total - reviewed}</b></span></div>
  </div>
}

function Overview({ institution, range, alerts: allAlerts, cases: allCases, policies }: { institution: string; range: string; alerts: AlertRecord[]; cases: CaseRecord[]; policies: RiskPolicy[] }) {
  const now = new Date(fixtures._meta.data_as_of).getTime()
  const days = range === '24h' ? 1 : range === '7d' ? 7 : 30
  const since = now - days * 86400000
  const scoped = <T extends { institution_id: string }>(items: T[], date: (item: T) => string) =>
    items.filter((item) => (institution === 'ALL' || item.institution_id === institution) && new Date(date(item)).getTime() >= since)

  const transactions = scoped(fixtures.transactions, (tx) => tx.occurred_at)
  const alerts = scoped(allAlerts, (alert) => alert.created_at)
  const cases = scoped(allCases, (item) => item.updated_at)
  const assessmentIds = new Set(transactions.map((tx) => tx.assessment_id).filter(Boolean))
  const assessments = fixtures.assessments.filter((item) => assessmentIds.has(item.id))
  const openAlerts = alerts.filter((alert) => alert.state === 'open')
  const activeCases = cases.filter((item) => item.state === 'open' || item.state === 'in_review')
  const coverage = transactions.length ? Math.round(assessments.length / transactions.length * 100) : null
  const dimensions = ['fraud', 'mule', 'aml'].map((dimension) => ({ label: dimension[0].toUpperCase() + dimension.slice(1), value: alerts.filter((alert) => alert.dimensions.includes(dimension)).length, tone: dimension }))
  const severity = ['high', 'medium', 'low'].map((level) => ({ label: level[0].toUpperCase() + level.slice(1), value: alerts.filter((alert) => alert.severity === level).length, tone: level }))
  const trend = ['21', '22', '23'].map((day) => transactions.filter((tx) => new Date(tx.occurred_at).getUTCDate() === Number(day)).length)
  const workload = ['21', '22', '23'].map((day) => alerts.filter((item) => new Date(item.created_at).getUTCDate() === Number(day)).length + cases.filter((item) => new Date(item.updated_at).getUTCDate() === Number(day)).length)
  const reviewed = alerts.filter((alert) => alert.state === 'reviewed').length
  const orderedAlerts = [...alerts].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">SYNTHETIC MONITORING</p><h1>Network risk overview</h1><p>Scoped signals, investigation workload and data coverage across the authorized workspace.</p></div>
      <div className="heading-meta"><Badge tone="success"><Icon name="clock" size={12} />Data as of 23 Oct 2026, 14:00 ICT</Badge><Button onClick={() => window.location.reload()}>Refresh</Button></div>
    </div>

    <Panel className="hero">
      <div className="hero-copy"><Badge tone="synthetic">Synthetic workspace</Badge><h2>Review signals. Trace evidence. Resolve cases.</h2><p>Indices are separate risk signals, not probabilities or legal findings. Account identity remains unverified.</p></div>
      <div className="hero-side"><span><small>AUTHORIZED SCOPE</small><strong>{institution === 'ALL' ? 'Network supervisor scope' : institution.replace('INST-', '')}</strong></span><Button primary onClick={() => navigate('/alerts')}>Open alert queue <Icon name="arrow" size={16} /></Button></div>
    </Panel>

    <section>
      <div className="section-heading"><h2>Workspace summary</h2><span>{range === '24h' ? 'Last 24 hours' : `Last ${days} days`} · fixture-derived</span></div>
      <div className="kpi-grid">
        <KpiCard label="Transactions" value={String(transactions.length)} detail={`${assessments.length} assessed in scope`} icon="transactions" tone="amber" onClick={() => navigate('/transactions')} />
        <KpiCard label="Open alerts" value={String(openAlerts.length)} detail={`${alerts.length} total alerts`} icon="alerts" tone="pink" onClick={() => navigate('/alerts')} />
        <KpiCard label="Active cases" value={String(activeCases.length)} detail={`${cases.length} scoped cases`} icon="cases" tone="violet" onClick={() => navigate('/cases')} />
        <KpiCard label="Assessment coverage" value={coverage === null ? '—' : `${coverage}%`} detail={`${assessments.length} / ${transactions.length} transactions`} icon="assessments" tone="cyan" onClick={() => navigate('/assessments')} />
      </div>
    </section>

    <section>
      <div className="section-heading"><h2>Risk activity</h2><span>Connected synthetic fixture chain</span></div>
      <div className="chart-grid">
        <Panel className="chart-panel"><PanelHeader title="Assessed transactions" subtitle="Count by day · assessments available" aside={<Badge tone="amber">{assessments.length} total</Badge>} /><LineChart values={trend} /><div className="axis-labels"><span>21 Oct</span><span>22 Oct</span><span>23 Oct</span></div></Panel>
        <Panel className="chart-panel"><PanelHeader title="Alerts by risk dimension" subtitle="Membership count · dimensions may overlap" /><BarChart values={dimensions} /></Panel>
        <Panel className="chart-panel"><PanelHeader title="Severity distribution" subtitle="Alert count by independent severity" /><BarChart values={severity} /></Panel>
      </div>
      <div className="chart-grid secondary">
        <Panel className="chart-panel"><PanelHeader title="Institution activity" subtitle="Transaction count by institution and day" /><Heatmap transactions={transactions} /></Panel>
        <Panel className="chart-panel"><PanelHeader title="Investigation workload" subtitle="Alerts created + cases updated" aside={<Badge tone="pink">Events</Badge>} /><LineChart values={workload} color="pink" area /><div className="axis-labels"><span>21 Oct</span><span>22 Oct</span><span>23 Oct</span></div></Panel>
        <Panel className="chart-panel spotlight"><PanelHeader title="Alert review coverage" subtitle="Reviewed versus unreviewed scoped alerts" /><Donut reviewed={reviewed} total={alerts.length} /></Panel>
      </div>
    </section>

    <Panel className="table-panel">
      <PanelHeader title="Recent high-priority alerts" subtitle="Latest scoped synthetic signals requiring analyst attention" aside={<Button compact onClick={() => navigate('/alerts')}>View all <Icon name="arrow" size={14} /></Button>} />
      <div className="table-scroll">
        <table>
          <thead><tr><th>Alert</th><th>Transaction</th><th>Institution</th><th>Dimensions</th><th>Highest index</th><th>Severity</th><th>State</th><th>Assignee / case</th><th>Updated</th><th /></tr></thead>
          <tbody>{orderedAlerts.length ? orderedAlerts.map((alert) => {
            const assessment = fixtures.assessments.find((item) => item.id === alert.assessment_id) as Assessment | undefined
            const available = assessment ? [assessment.dimensions.fraud.index, assessment.dimensions.mule.index, assessment.dimensions.aml.index].filter((v): v is number => v !== null) : []
            const highest = available.length ? Math.max(...available).toFixed(2) : '—'
            return <tr key={alert.id}>
              <td><strong className="data-id">{alert.id}</strong><small>{alert.policy_id} · v3</small></td>
              <td className="data-id">{alert.transaction_id}</td>
              <td>{alert.institution_id.replace('INST-DEMO-', 'Demo ')}</td>
              <td><div className="dimension-list">{alert.dimensions.map((d) => <Badge key={d} tone={d}>{d.toUpperCase()}</Badge>)}</div></td>
              <td><strong>{highest} / 1.00</strong><small>Index</small></td>
              <td><Badge tone={alert.severity}>{alert.severity}</Badge></td>
              <td><Badge tone={alert.state}>{alert.state}</Badge></td>
              <td>{alert.case_id ? <span className="data-id">{alert.case_id}</span> : <span className="muted">Unassigned</span>}</td>
              <td>23 Oct<br /><small>{alert.updated_at.slice(11, 16)} ICT</small></td>
              <td><Button compact onClick={() => navigate(`/alerts/${alert.id}`)}>View</Button></td>
            </tr>
          }) : <tr><td colSpan={10}><div className="empty-state">No alerts match the selected scope.</div></td></tr>}</tbody>
        </table>
      </div>
    </Panel>

    <section>
      <div className="section-heading"><h2>Workflow attention</h2><span>Operational follow-ups</span></div>
      <div className="workflow-grid">
        <WorkflowCard icon="policies" tone="amber" value={String(policies.filter((p) => p.state === 'submitted').length)} title="Pending policy approval" description="Independent checker review required" action="Review policies" path="/policies" />
        <WorkflowCard icon="datasets" tone="cyan" value="1" title="Dataset quality exception" description="Offline staging remains non-canonical" action="Inspect datasets" path="/datasets" />
        <WorkflowCard icon="health" tone="pink" value="—" title="Live worker freshness" description="Production telemetry is not connected" action="View system health" path="/health" />
      </div>
    </section>
    <footer className="page-footer"><span>LMPS Risk Portal · Synthetic prototype</span><span>No real payment, account or notification actions</span></footer>
  </div>
}

function WorkflowCard({ icon, tone, value, title, description, action, path }: { icon: IconName; tone: string; value: string; title: string; description: string; action: string; path: string }) {
  return <Panel className={`workflow-card ${tone}`}><span className="workflow-icon"><Icon name={icon} /></span><div><small>SYNTHETIC</small><h3>{title}</h3><p>{description}</p><button type="button" onClick={() => navigate(path)}>{action} <Icon name="arrow" size={14} /></button></div><strong>{value}</strong></Panel>
}

type DemoState = 'ready' | 'loading' | 'empty' | 'error' | 'permission'

function StatePreview({ value, onChange }: { value: DemoState; onChange: (value: DemoState) => void }) {
  return <Select compact label="Preview screen state" value={value} onChange={(next) => onChange(next as DemoState)}>
    <option value="ready">Fixture data</option>
    <option value="loading">Loading state</option>
    <option value="empty">Empty scope</option>
    <option value="error">Recoverable error</option>
    <option value="permission">Permission denied</option>
  </Select>
}

function AsyncState({ state, onRetry }: { state: DemoState; onRetry?: () => void }) {
  if (state === 'loading') return <Panel className="async-state loading-state"><div className="skeleton wide" /><div className="skeleton" /><div className="skeleton short" /><div className="skeleton wide" /></Panel>
  const copy = state === 'permission'
    ? { title: 'Permission denied', body: 'Your current demo persona cannot read records in this institution scope.', tone: 'error' }
    : state === 'error'
      ? { title: 'Unable to load synthetic records', body: 'The local mock service returned a recoverable error. No data was changed.', tone: 'error' }
      : { title: 'No records in this scope', body: 'There are no synthetic records for the selected institution and time range.', tone: 'neutral' }
  return <Panel className={`async-state ${copy.tone}`}><span className="async-icon"><Icon name={state === 'permission' ? 'access' : state === 'error' ? 'alerts' : 'search'} /></span><h2>{copy.title}</h2><p>{copy.body}</p>{state === 'error' && <Button onClick={onRetry}>Try again</Button>}</Panel>
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="heading-meta"><Badge tone="synthetic">Synthetic</Badge>{children}</div></div>
}

function FilterSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="filter-search"><span className="sr-only">{placeholder}</span><Icon name="search" size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

function formatTime(value: string) {
  return `${value.slice(0, 10)} · ${value.slice(11, 16)} ICT`
}

function scopedByRange<T extends { institution_id: string }>(items: T[], institution: string, range: string, date: (item: T) => string) {
  const days = range === '24h' ? 1 : range === '7d' ? 7 : 30
  const since = new Date(fixtures._meta.data_as_of).getTime() - days * 86400000
  return items.filter((item) => (institution === 'ALL' || item.institution_id === institution) && Date.parse(date(item)) >= since)
}

function RecordsSummary({ items }: { items: { label: string; value: number; detail: string; tone: string; icon: IconName }[] }) {
  return <section className="kpi-grid records-summary" aria-label="Scoped record summary">{items.map((item) => <KpiCard key={item.label} label={item.label} value={String(item.value)} detail={item.detail} icon={item.icon} tone={item.tone} />)}</section>
}

function TransactionsPage({ institution, setInstitution, range, setRange }: { institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void }) {
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('ALL')
  const [lifecycle, setLifecycle] = useState('ALL')
  const [page, setPage] = useState(1)
  const [state, setState] = useState<DemoState>('ready')
  const pageRef = useMonitoringMotion(`transactions:${institution}:${range}:${search}:${currency}:${lifecycle}:${page}:${state}`)
  useEffect(() => setPage(1), [institution, range])
  const pageSize = 5
  const scoped = scopedByRange(fixtures.transactions, institution, range, (item) => item.occurred_at)
  const filtered = scoped.filter((item) =>
    item.id.toLowerCase().includes(search.trim().toLowerCase()) &&
    (currency === 'ALL' || item.currency === currency) &&
    (lifecycle === 'ALL' || item.lifecycle === lifecycle),
  )
  const results = state === 'empty' ? [] : filtered
  const pages = Math.max(1, Math.ceil(results.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = results.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = Boolean(search || currency !== 'ALL' || lifecycle !== 'ALL')
  const assessedCount = scoped.filter((item) => item.assessment_id).length
  const clear = () => { setSearch(''); setCurrency('ALL'); setLifecycle('ALL'); setPage(1) }

  return <div ref={pageRef} className="page monitoring-page records-page records-transactions">
    <PageHeader eyebrow="MONITORING / TRANSACTIONS" title="Transactions" description="Explore transaction records, frozen revisions and the evidence behind each assessment."><StatePreview value={state} onChange={setState} /></PageHeader>
    <div className="scope-strip records-scope"><span><Icon name="access" size={15} /><strong>{institution === 'ALL' ? 'All authorized institutions' : institution.replace('INST-DEMO-', 'Demo Institution ')}</strong></span><span><Icon name="clock" size={13} />Data as of 23 Oct 2026, 14:00 ICT</span><Badge tone="synthetic">Fixture data</Badge></div>
    <RecordsSummary items={[
      { label: 'Transactions in scope', value: scoped.length, detail: 'Selected institution and time range', tone: 'amber', icon: 'transactions' },
      { label: 'Assessment available', value: assessedCount, detail: 'Linked frozen assessment', tone: 'cyan', icon: 'check' },
      { label: 'Assessment unavailable', value: scoped.length - assessedCount, detail: 'No assessment supplied', tone: 'pink', icon: 'assessments' },
      { label: 'Literal currencies', value: new Set(scoped.map((item) => item.currency)).size, detail: 'Amounts kept separate', tone: 'violet', icon: 'transactions' },
    ]} />
    <Panel className="filter-panel records-filters">
      <div className="filter-bar records-transaction-filters">
        <div className="records-field"><span>Search</span><FilterSearch value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Transaction ID" /></div>
        <div className="records-field"><span>Time range</span><Select label="Date range" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div>
        <div className="records-field"><span>Institution</span><Select label="Institution scope" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select></div>
        <div className="records-field"><span>Currency</span><Select label="Currency" value={currency} onChange={(value) => { setCurrency(value); setPage(1) }}><option value="ALL">All currencies</option><option value="SYN">SYN</option><option value="USD">USD</option><option value="THB">THB</option></Select></div>
        <div className="records-field"><span>Lifecycle</span><Select label="Lifecycle" value={lifecycle} onChange={(value) => { setLifecycle(value); setPage(1) }}><option value="ALL">All lifecycle states</option><option value="completed">Completed</option></Select></div>
        <Button compact onClick={clear} disabled={!hasFilters}>Clear filters</Button>
      </div>
    </Panel>
    {state !== 'ready' && state !== 'empty' ? <AsyncState state={state} onRetry={() => setState('ready')} /> : <Panel className="table-panel data-list-panel records-content">
      <PanelHeader title="Transaction records" subtitle={`${results.length} results · exact amounts by literal currency`} aside={<Badge tone={results.some((item) => !item.assessment_id) ? 'medium' : 'neutral'}>{results.filter((item) => item.assessment_id).length} assessed</Badge>} />
      <div className="table-scroll"><table className="clickable-table records-table"><thead><tr><th>Transaction / source</th><th>Revision</th><th>Institution</th><th>Occurred</th><th className="amount-cell">Exact amount</th><th>Currency</th><th>Lifecycle</th><th>Assessment</th><th><span className="sr-only">Open transaction</span></th></tr></thead><tbody>{visible.length ? visible.map((tx) => <tr key={tx.id} tabIndex={0} onClick={() => navigate(`/transactions/${tx.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/transactions/${tx.id}`) } }}>
        <td><strong className="data-id">{tx.id}</strong><small>{tx.source_ref}</small></td><td><span className="records-revision">r{tx.revision}</span></td><td>{tx.institution_id.replace('INST-DEMO-', 'Demo ')}</td><td>{formatTime(tx.occurred_at)}</td><td className="amount-cell exact-amount">{tx.amount}</td><td><Badge>{tx.currency}</Badge></td><td><Badge tone="success">{tx.lifecycle}</Badge></td><td>{tx.assessment_id ? <Badge tone="cyan">Available</Badge> : <Badge>Unavailable</Badge>}</td><td><Icon name="arrow" size={15} /></td>
      </tr>) : <tr><td colSpan={9}><div className="empty-state"><Icon name="search" size={26} /><strong>{!scoped.length || state === 'empty' ? 'No transactions in this scope' : 'No matching transactions'}</strong><span>Adjust the institution, time range or active filters.</span>{hasFilters && <Button compact onClick={clear}>Clear filters</Button>}</div></td></tr>}</tbody></table></div>
      <div className="pagination"><span>Showing{visible.length ? ` ${(currentPage - 1) * pageSize + 1}–${(currentPage - 1) * pageSize + visible.length}` : ' 0–0'} of{` ${results.length}`}</span><div><Button compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page{` ${currentPage} of ${pages}`}</span><Button compact disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
    </Panel>}
    <footer className="page-footer"><span>Exact amounts · currencies kept separate</span><span>Synthetic records · account identity unresolved</span></footer>
  </div>
}

function DetailTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return <div className="detail-tabs" role="tablist">{tabs.map((tab) => <button type="button" role="tab" aria-selected={active === tab} key={tab} onClick={() => onChange(tab)}>{tab}</button>)}</div>
}

function KeyValue({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: ReactNode }) {
  return <div className="key-value"><span>{label}</span>{children ?? <strong className={mono ? 'data-id' : ''}>{value ?? '—'}</strong>}</div>
}

function TransactionDetail({ id, institution }: { id: string; institution: string }) {
  const [tab, setTab] = useState('Summary')
  const pageRef = useMonitoringMotion(`transaction:${id}:${tab}`)
  const tx = fixtures.transactions.find((item) => item.id === id)
  if (!tx) return <div ref={pageRef} className="page records-page"><AsyncState state="empty" /></div>
  if (institution !== 'ALL' && tx.institution_id !== institution) return <div ref={pageRef} className="page records-page"><AsyncState state="permission" /></div>
  const assessment = fixtures.assessments.find((item) => item.id === tx.assessment_id)
  const alert = fixtures.alerts.find((item) => item.transaction_id === tx.id)
  return <div ref={pageRef} className="page detail-page records-page records-transaction-detail">
    <div className="detail-breadcrumb"><button type="button" onClick={() => navigate('/transactions')}>Transactions</button><Icon name="chevron" size={13} /><span className="data-id">{tx.id}</span></div>
    <PageHeader eyebrow="TRANSACTION DETAIL" title={tx.id} description={`Immutable synthetic transaction revision ${tx.revision}.`}>
      <Badge tone="success">{tx.lifecycle}</Badge>
    </PageHeader>
    <Panel className="detail-summary">
      <div><span className="detail-icon amber"><Icon name="transactions" /></span><div><small>EXACT AMOUNT</small><strong>{tx.amount} <em>{tx.currency}</em></strong><span>No cross-currency conversion applied</span></div></div>
      <KeyValue label="Institution" value={tx.institution_id} mono /><KeyValue label="Frozen revision" value={`Revision ${tx.revision}`} /><KeyValue label="Assessment">{tx.assessment_id ? <button type="button" className="text-link data-id" onClick={() => navigate(`/assessments/${tx.assessment_id}`)}>{tx.assessment_id} <Icon name="arrow" size={13} /></button> : <Badge>Unavailable</Badge>}</KeyValue>
    </Panel>
    <DetailTabs tabs={['Summary', 'Risk evidence', 'Revision history', 'Source lineage']} active={tab} onChange={setTab} />
    {tab === 'Summary' && <div className="detail-grid records-content">
      <Panel><PanelHeader title="Transaction attributes" subtitle="Synthetic canonical view" /><div className="key-grid"><KeyValue label="Transaction ID" value={tx.id} mono /><KeyValue label="Revision" value={String(tx.revision)} /><KeyValue label="Amount" value={tx.amount} mono /><KeyValue label="Literal currency" value={tx.currency} /><KeyValue label="Lifecycle" value={tx.lifecycle} /><KeyValue label="Timezone confidence" value="Known for fixture only" /></div></Panel>
      <Panel><PanelHeader title="Event timestamps" subtitle="Preserved as separate evidence fields" /><div className="timeline-list"><TimeRow label="Occurred" value={tx.occurred_at} /><TimeRow label="Observed" value={tx.observed_at} /><TimeRow label="Recorded" value={tx.recorded_at} /></div></Panel>
      <Panel className="identity-panel"><PanelHeader title="Account references" subtitle="Display references are not verified identities" /><div className="key-grid"><KeyValue label="Sender display" value={tx.sender_display} /><KeyValue label="Receiver display" value={tx.receiver_display} /><KeyValue label="Identity status"><Badge tone="medium">Unresolved</Badge></KeyValue></div><div className="notice warning">Account ownership and stable identity are unresolved. These invented references must not be used as verified graph entities.</div></Panel>
      <Panel><PanelHeader title="Connected records" subtitle="Frozen operational synthetic chain" /><div className="connected-chain"><button type="button" className="chain-node active"><small>TRANSACTION</small><strong>{tx.id}</strong></button><Icon name="arrow" /><button type="button" className="chain-node" disabled={!assessment} onClick={() => assessment && navigate(`/assessments/${assessment.id}`)}><small>ASSESSMENT</small><strong>{assessment?.id ?? 'Unavailable'}</strong></button><Icon name="arrow" /><button type="button" className="chain-node" disabled={!alert} onClick={() => alert && navigate(`/alerts/${alert.id}`)}><small>ALERT</small><strong>{alert?.id ?? 'Not created'}</strong></button></div></Panel>
    </div>}
    {tab === 'Risk evidence' && <Panel className="records-content"><PanelHeader title="Frozen risk evidence" subtitle={`Evidence is bound to revision ${tx.revision}; a later revision would not relabel this assessment.`} />{assessment ? <><div className="index-grid compact-indices"><DimensionIndex name="Fraud" dimension="fraud" data={assessment.dimensions.fraud} /><DimensionIndex name="Mule" dimension="mule" data={assessment.dimensions.mule} /><DimensionIndex name="AML" dimension="aml" data={assessment.dimensions.aml} /></div><Button onClick={() => navigate(`/assessments/${assessment.id}`)}>Open full assessment <Icon name="arrow" size={14} /></Button></> : <AsyncState state="empty" />}</Panel>}
    {tab === 'Revision history' && <Panel className="table-panel records-content"><PanelHeader title="Revision history" subtitle="Immutable observations · latest projection does not overwrite prior evidence" /><div className="table-scroll"><table><thead><tr><th>Revision</th><th>Observed</th><th>Lifecycle</th><th>Assessment</th><th>Status</th></tr></thead><tbody>{tx.revision === 2 && <tr><td>r1</td><td>23 Oct 2026 · 08:58 ICT</td><td>Observed</td><td>—</td><td><Badge>Superseded projection</Badge></td></tr>}<tr><td>r{tx.revision}</td><td>{formatTime(tx.observed_at)}</td><td>{tx.lifecycle}</td><td className="data-id">{tx.assessment_id ?? '—'}</td><td><Badge tone="success">Selected frozen revision</Badge></td></tr></tbody></table></div></Panel>}
    {tab === 'Source lineage' && <div className="detail-grid records-content"><Panel><PanelHeader title="Source reference" subtitle="Synthetic snapshot provenance" /><div className="key-grid"><KeyValue label="Source reference" value={tx.source_ref} mono /><KeyValue label="Source mode" value={tx.source} /><KeyValue label="Publication" value="Synthetic canonical fixture" /><KeyValue label="Identity resolution" value="Unresolved" /></div></Panel><Panel><PanelHeader title="Lineage boundary" subtitle="Safe interpretation" /><div className="notice warning">A source row reference is not a payment, account, or globally stable business identity. Offline staging is not connected to this chain.</div></Panel></div>}
  </div>
}

function TimeRow({ label, value }: { label: string; value: string }) {
  return <div><span className="timeline-dot" /><p><small>{label}</small><strong>{value}</strong><em>Timezone known for synthetic fixture only</em></p></div>
}

type DimensionData = { index: number | null; status: string; coverage: { available: number; required: number }; reason?: string }
function DimensionIndex({ name, dimension, data }: { name: string; dimension: string; data: DimensionData }) {
  const available = data.index !== null
  return <div className={`dimension-index ${dimension}${available ? '' : ' unavailable'}`}><div><span>{name}</span><Badge tone={available ? dimension : 'neutral'}>{available ? 'Available' : 'Unavailable'}</Badge></div><strong>{data.index !== null ? `${data.index.toFixed(2)} / 1.00` : '—'}</strong><small>{available ? 'Risk index · not a probability' : 'Missing required inputs · unresolved identity'}</small><div className="coverage-track"><span style={{ width: `${data.coverage.available / data.coverage.required * 100}%` }} /></div><em>{data.coverage.available} of {data.coverage.required} required inputs available</em></div>
}

function AssessmentsPage({ institution, setInstitution, range, setRange }: { institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void }) {
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('ALL')
  const [state, setState] = useState<DemoState>('ready')
  const pageRef = useMonitoringMotion(`assessments:${institution}:${range}:${search}:${availability}:${state}`)
  const assessments = scopedByRange(fixtures.assessments, institution, range, (item) => item.created_at)
  const filtered = assessments.filter((item) => {
    const matches = `${item.id} ${item.transaction_id}`.toLowerCase().includes(search.trim().toLowerCase())
    const partial = Object.values(item.dimensions).some((dimension) => dimension.index === null)
    return matches && (availability === 'ALL' || (availability === 'partial' ? partial : !partial))
  })
  const visible = state === 'empty' ? [] : filtered
  const hasFilters = Boolean(search || availability !== 'ALL')
  const clear = () => { setSearch(''); setAvailability('ALL') }
  return <div ref={pageRef} className="page monitoring-page records-page records-assessments">
    <PageHeader eyebrow="MONITORING / ASSESSMENTS" title="Assessments" description="Inspect separate risk indices, input coverage and the frozen evidence used by each run."><StatePreview value={state} onChange={setState} /></PageHeader>
    <div className="scope-strip records-scope"><span><Icon name="access" size={15} /><strong>{institution === 'ALL' ? 'All authorized institutions' : institution.replace('INST-DEMO-', 'Demo Institution ')}</strong></span><span><Icon name="clock" size={13} />Data as of 23 Oct 2026, 14:00 ICT</span><Badge tone="synthetic">Fixture data</Badge></div>
    <RecordsSummary items={[
      { label: 'Assessment runs', value: assessments.length, detail: 'Frozen inputs and policy versions', tone: 'pink', icon: 'assessments' },
      ...(['fraud', 'mule', 'aml'] as const).map((dimension) => ({ label: `${dimension === 'aml' ? 'AML' : dimension[0].toUpperCase() + dimension.slice(1)} inputs available`, value: assessments.filter((item) => item.dimensions[dimension].index !== null).length, detail: `Of ${assessments.length} runs · availability, not score`, tone: dimension === 'fraud' ? 'amber' : dimension === 'mule' ? 'violet' : 'cyan', icon: (dimension === 'fraud' ? 'detectors' : dimension === 'mule' ? 'network' : 'assessments') as IconName })),
    ]} />
    <Panel className="filter-panel records-filters"><div className="filter-bar records-assessment-filters">
      <div className="records-field"><span>Search</span><FilterSearch value={search} onChange={setSearch} placeholder="Assessment or transaction ID" /></div>
      <div className="records-field"><span>Institution</span><Select label="Institution scope" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select></div>
      <div className="records-field"><span>Time range</span><Select label="Assessment date range" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div>
      <div className="records-field"><span>Input coverage</span><Select label="Availability" value={availability} onChange={setAvailability}><option value="ALL">All availability</option><option value="partial">Partial coverage</option><option value="complete">Complete coverage</option></Select></div>
      <Button compact onClick={clear} disabled={!hasFilters}>Clear filters</Button>
    </div></Panel>
    {state !== 'ready' && state !== 'empty' ? <AsyncState state={state} onRetry={() => setState('ready')} /> : <Panel className="table-panel data-list-panel records-content">
      <PanelHeader title="Assessment runs" subtitle={`${visible.length} results · immutable policy and input references`} aside={<Badge tone="medium">Indices, not probabilities</Badge>} />
      <div className="table-scroll"><table className="clickable-table assessment-table records-table"><thead><tr><th>Assessment / engine</th><th>Institution</th><th>Transaction / revision</th><th>Policy</th><th>Assessed</th><th>Fraud index</th><th>Mule index</th><th>AML index</th><th>Coverage</th><th><span className="sr-only">Open assessment</span></th></tr></thead><tbody>{visible.length ? visible.map((item) => {
        const partial = Object.values(item.dimensions).some((dimension) => dimension.index === null)
        const version = fixtures.policies.find((policy) => policy.id === item.policy_id)?.version
        return <tr key={item.id} tabIndex={0} onClick={() => navigate(`/assessments/${item.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/assessments/${item.id}`) } }}>
          <td><strong className="data-id">{item.id}</strong><small>{item.engine_version}</small></td><td>{item.institution_id.replace('INST-DEMO-', 'Demo ')}</td><td><strong className="data-id">{item.transaction_id}</strong><small>Revision{` ${item.revision}`}</small></td><td><strong className="data-id">{item.policy_id}</strong><small>Version{` ${version ?? '—'}`}</small></td><td>{formatTime(item.created_at)}</td><td><IndexValue value={item.dimensions.fraud.index} dimension="fraud" /></td><td><IndexValue value={item.dimensions.mule.index} dimension="mule" /></td><td><IndexValue value={item.dimensions.aml.index} dimension="aml" /></td><td><Badge tone={partial ? 'medium' : 'success'}>{partial ? 'Partial' : 'Complete'}</Badge></td><td><Icon name="arrow" size={15} /></td>
        </tr>
      }) : <tr><td colSpan={10}><div className="empty-state"><Icon name="search" size={26} /><strong>{!assessments.length || state === 'empty' ? 'No assessments in this scope' : 'No matching assessments'}</strong><span>Adjust your search, scope or input coverage filter.</span>{hasFilters && <Button compact onClick={clear}>Clear filters</Button>}</div></td></tr>}</tbody></table></div>
      <div className="records-table-note"><Icon name="assessments" size={14} /><span>Unavailable means required inputs are missing. It is never treated as a zero-risk score.</span></div>
    </Panel>}
    <footer className="page-footer"><span>Frozen synthetic assessment evidence</span><span>Fraud / Mule / AML remain separate indices</span></footer>
  </div>
}

function IndexValue({ value, dimension }: { value: number | null; dimension: string }) {
  return value === null ? <span className="index-unavailable">—<small>Unavailable</small></span> : <span className={`index-value ${dimension}`}>{value.toFixed(2)}<small>/ 1.00 Index</small></span>
}

function AssessmentDetail({ id, institution }: { id: string; institution: string }) {
  const [tab, setTab] = useState('Evidence')
  const pageRef = useMonitoringMotion(`assessment:${id}:${tab}`)
  const assessment = fixtures.assessments.find((item) => item.id === id)
  if (!assessment) return <div ref={pageRef} className="page records-page"><AsyncState state="empty" /></div>
  if (institution !== 'ALL' && assessment.institution_id !== institution) return <div ref={pageRef} className="page records-page"><AsyncState state="permission" /></div>
  const tx = fixtures.transactions.find((item) => item.id === assessment.transaction_id)
  const alert = fixtures.alerts.find((item) => item.assessment_id === id)
  const evidence = [
    { code: 'DEMO_AMOUNT_SIGNAL', input: tx ? `${tx.amount} ${tx.currency}` : '—', condition: 'Illustrative typed amount signal', result: 'Triggered', tone: 'medium', limitation: 'Synthetic threshold; not a legal or production rule.' },
    { code: 'DEMO_IDENTITY_UNRESOLVED', input: 'Account identity: unresolved', condition: 'Verified stable entity required', result: 'Unavailable', tone: 'neutral', limitation: 'Masked or display references cannot establish identity.' },
    { code: 'DEMO_ACTIVITY_WINDOW', input: '3 bounded events / 24h', condition: 'Illustrative bounded activity context', result: 'Observed', tone: 'cyan', limitation: 'Synthetic reference window; partial network visibility.' },
  ]
  return <div ref={pageRef} className="page detail-page records-page records-assessment-detail">
    <div className="detail-breadcrumb"><button type="button" onClick={() => navigate('/assessments')}>Assessments</button><Icon name="chevron" size={13} /><span className="data-id">{assessment.id}</span></div>
    <PageHeader eyebrow="ASSESSMENT DETAIL" title={assessment.id} description="Frozen synthetic risk evidence for one immutable transaction revision."><Badge tone="medium">Partial coverage</Badge></PageHeader>
    <div className="notice info"><Icon name="assessments" /><span><strong>Risk indices, not probabilities</strong>Fraud, Mule and AML are separate 0–1 synthetic indices. They are not legal findings, calibrated likelihoods, or payment decisions.</span></div>
    <div className="index-grid"><DimensionIndex name="Fraud" dimension="fraud" data={assessment.dimensions.fraud} /><DimensionIndex name="Mule" dimension="mule" data={assessment.dimensions.mule} /><DimensionIndex name="AML" dimension="aml" data={assessment.dimensions.aml} /></div>
    <DetailTabs tabs={['Evidence', 'Versions & input', 'Connected records']} active={tab} onChange={setTab} />
    {tab === 'Evidence' && <Panel className="table-panel records-content"><PanelHeader title="Detector evidence" subtitle="Illustrative examples, not authoritative detector catalog definitions" aside={<Badge tone="synthetic">Synthetic evidence</Badge>} /><div className="table-scroll"><table><thead><tr><th>Detector code</th><th>Input value</th><th>Configured condition</th><th>Result</th><th>Limitation</th></tr></thead><tbody>{evidence.map((row) => <tr key={row.code}><td><strong className="data-id">{row.code}</strong></td><td>{row.input}</td><td>{row.condition}</td><td><Badge tone={row.tone}>{row.result}</Badge></td><td className="limitation-cell">{row.limitation}</td></tr>)}</tbody></table></div></Panel>}
    {tab === 'Versions & input' && <div className="detail-grid records-content"><Panel><PanelHeader title="Frozen versions" subtitle="Immutable references used by this run" /><div className="key-grid"><KeyValue label="Transaction" value={assessment.transaction_id} mono /><KeyValue label="Frozen revision" value={String(assessment.revision)} /><KeyValue label="Policy" value={assessment.policy_id} mono /><KeyValue label="Catalog" value={assessment.catalog_version} mono /><KeyValue label="Engine" value={assessment.engine_version} mono /><KeyValue label="Mode" value={assessment.mode} /></div></Panel><Panel><PanelHeader title="Input integrity" subtitle="Deterministic synthetic fingerprint" /><KeyValue label="Input fingerprint" value={assessment.input_fingerprint} mono /><div className="notice success">This assessment remains bound to its recorded input and versions. Rescoring would create a new assessment, not overwrite this one.</div></Panel></div>}
    {tab === 'Connected records' && <Panel className="records-content"><PanelHeader title="Connected synthetic chain" subtitle="Follow frozen evidence without changing state" /><div className="connected-chain large"><button type="button" className="chain-node" onClick={() => navigate(`/transactions/${assessment.transaction_id}`)}><small>TRANSACTION · r{assessment.revision}</small><strong>{assessment.transaction_id}</strong></button><Icon name="arrow" /><button type="button" className="chain-node active"><small>ASSESSMENT</small><strong>{assessment.id}</strong></button><Icon name="arrow" /><button type="button" className="chain-node" disabled={!alert} onClick={() => alert && navigate(`/alerts/${alert.id}`)}><small>ALERT</small><strong>{alert?.id ?? 'Not created'}</strong></button></div></Panel>}
    <footer className="detail-footer"><Button onClick={() => navigate(`/transactions/${assessment.transaction_id}`)}>View transaction <Icon name="arrow" size={14} /></Button>{alert && <Button primary ariaLabel={`Open linked alert ${alert.id}`} onClick={() => navigate(`/alerts/${alert.id}`)}>View linked alert <Icon name="arrow" size={14} /></Button>}</footer>
  </div>
}


type AlertForm = {
  kind: 'review' | 'case' | 'reset'
  expectedVersion: number
  requestId: string
}

function AlertModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const dialog = ref.current
    dialog?.showModal()
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return <dialog ref={ref} className="alert-modal" aria-labelledby={titleId} onCancel={onClose}>
    <div className="alert-modal-heading"><div><p className="eyebrow">SYNTHETIC WORKSPACE</p><h2 id={titleId}>{title}</h2></div><button type="button" className="alert-close" onClick={onClose} aria-label="Close dialog">×</button></div>
    {children}
  </dialog>
}

function AlertsPage({ id, institution, setInstitution, range, setRange, workspace, onCommand, onReset, actor, permissions }: {
  id?: string
  institution: string
  setInstitution: (value: string) => void
  range: string
  setRange: (value: string) => void
  workspace: AlertWorkspace
  onCommand: (command: AlertCommand) => void
  onReset: () => void
  actor: string
  permissions: { acknowledge: boolean; review: boolean; linkCase: boolean; reset: boolean }
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [severity, setSeverity] = useState('ALL')
  const [dimension, setDimension] = useState('ALL')
  const [caseFilter, setCaseFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<DemoState>('ready')
  const [detailTab, setDetailTab] = useState('Evidence')
  const [form, setForm] = useState<AlertForm | null>(null)
  const [opinion, setOpinion] = useState<ReviewOpinion>('unknown')
  const [rationale, setRationale] = useState('')
  const [caseMode, setCaseMode] = useState('existing')
  const [caseId, setCaseId] = useState('')
  const [caseTitle, setCaseTitle] = useState('')
  const [formError, setFormError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { setForm(null); setMessage(''); setDetailTab('Evidence') }, [id, institution])
  useEffect(() => { setPage(1) }, [search, status, severity, dimension, caseFilter, institution, range])

  const scoped = scopedByRange(workspace.alerts, institution, range, (item) => item.created_at)
  const counts = {
    all: scoped.length,
    open: scoped.filter((item) => item.state === 'open').length,
    acknowledged: scoped.filter((item) => item.state === 'acknowledged').length,
    reviewed: scoped.filter((item) => item.state === 'reviewed').length,
  }
  const matches = scoped.filter((item) =>
    (status === 'all' || item.state === status) &&
    (severity === 'ALL' || item.severity === severity) &&
    (dimension === 'ALL' || item.dimensions.includes(dimension)) &&
    (caseFilter === 'ALL' || (caseFilter === 'linked' ? !!item.case_id : !item.case_id)) &&
    `${item.id} ${item.transaction_id} ${item.case_id ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  ).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  const pageSize = 5
  const pages = Math.max(1, Math.ceil(matches.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = preview === 'empty' ? [] : matches.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selected = workspace.alerts.find((item) => item.id === id)
  const assessment = fixtures.assessments.find((item) => item.id === selected?.assessment_id)
  const transaction = fixtures.transactions.find((item) => item.id === selected?.transaction_id)
  const linkedCase = workspace.cases.find((item) => item.id === selected?.case_id)
  const eligibleCases = workspace.cases.filter((item) => item.institution_id === selected?.institution_id && item.state !== 'closed' && item.alert_ids.length < 20)
  const events = workspace.events.filter((event) => event.alert_id === id).slice().reverse()
  const clear = () => { setSearch(''); setSeverity('ALL'); setDimension('ALL'); setCaseFilter('ALL'); setStatus('all'); setPage(1) }

  function openForm(kind: AlertForm['kind']) {
    setFormError(''); setConflict(false); setOpinion('unknown'); setRationale('')
    setCaseMode(eligibleCases.length ? 'existing' : 'create')
    setCaseId(eligibleCases[0]?.id ?? '')
    setCaseTitle('')
    setForm({ kind, expectedVersion: selected?.version ?? 0, requestId: crypto.randomUUID() })
  }

  function acknowledge() {
    if (!selected) return
    try {
      onCommand({ kind: 'acknowledge', alertId: selected.id, expectedVersion: selected.version, institution, actor, requestId: crypto.randomUUID(), at: new Date().toISOString() })
      setMessage('Alert acknowledged. This does not confirm notification delivery or change its case.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to acknowledge this alert.') }
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) return
    if (form.kind === 'reset') { onReset(); setForm(null); setMessage('Demo restored to its original fixture state.'); return }
    if (!selected) return
    const common = { alertId: selected.id, expectedVersion: form.expectedVersion, institution, actor, requestId: form.requestId, at: new Date().toISOString() }
    try {
      if (form.kind === 'review') onCommand({ ...common, kind: 'review', opinion, rationale })
      else if (caseMode === 'existing') onCommand({ ...common, kind: 'link_case', caseId })
      else onCommand({ ...common, kind: 'create_case', caseId: `CASE-DEMO-${form.requestId}`, title: caseTitle })
      setMessage(form.kind === 'review' ? 'Analyst opinion recorded · unverified · training eligible: false.' : 'Case evidence linked. Alert acknowledgement and review states are unchanged.')
      setForm(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save this action.')
      setConflict(error instanceof AlertActionError && error.code === 'conflict')
    }
  }

  if (id && (!selected || (institution !== 'ALL' && selected.institution_id !== institution))) {
    return <div className="page alerts-page"><Button onClick={() => navigate('/alerts')}>Back to alert inbox</Button><AsyncState state={selected ? 'permission' : 'empty'} /></div>
  }

  const dialogs = form && <AlertModal title={form.kind === 'review' ? 'Record analyst review' : form.kind === 'case' ? 'Connect case evidence' : 'Reset synthetic demo?'} onClose={() => setForm(null)}>
    <form onSubmit={submitForm} className="alert-form">
      {form.kind === 'review' && <>
        <div className="alert-form-context"><span className="data-id">{selected?.id}</span><Badge tone="acknowledged">Acknowledged</Badge></div>
        <p>Record your opinion about this alert. The review remains unverified and is not a training label.</p>
        <label>Analyst opinion<select autoFocus value={opinion} onChange={(event) => setOpinion(event.target.value as ReviewOpinion)}><option value="unknown">Unknown — insufficient evidence</option><option value="suspicious">Suspicious</option><option value="legitimate">Legitimate</option></select></label>
        <label>Review rationale<textarea required minLength={1} maxLength={2000} rows={4} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Explain the evidence and limitations behind your opinion." /></label>
        <span className="alert-field-help">{rationale.length} / 2,000 characters · unknown is not legitimate</span>
      </>}
      {form.kind === 'case' && <>
        <div className="alert-form-context"><span className="data-id">{selected?.id}</span><Badge>{selected?.institution_id.replace('INST-DEMO-', 'Demo ')}</Badge></div>
        <p>One owning case per alert. Linking does not acknowledge or review the alert.</p>
        <div className="detail-tabs"><button type="button" aria-pressed={caseMode === 'existing'} className={caseMode === 'existing' ? 'selected' : ''} onClick={() => setCaseMode('existing')}>Existing case</button><button type="button" aria-pressed={caseMode === 'create'} className={caseMode === 'create' ? 'selected' : ''} onClick={() => setCaseMode('create')}>Create case</button></div>
        {caseMode === 'existing' ? <label>Case in the same institution<select autoFocus required value={caseId} onChange={(event) => setCaseId(event.target.value)}><option value="">Select an eligible case</option>{eligibleCases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.alert_ids.length}/ 20 alerts</option>)}</select><span className="alert-field-help">Closed cases and cases at the 20-alert limit are unavailable.</span></label> : <label>Case title<input autoFocus required maxLength={120} value={caseTitle} onChange={(event) => setCaseTitle(event.target.value)} placeholder="Describe the investigation" /><span className="alert-field-help">Creates a local demo case with the selected alert as evidence.</span></label>}
      </>}
      {form.kind === 'reset' && <p>This resets alert actions, newly created cases and action history in this browser session to the original synthetic fixtures.</p>}
      {formError && <div role="alert" className="alert-form-error">{formError}{conflict && selected && <button type="button" className="text-link" onClick={() => { setForm({ ...form, expectedVersion: selected.version, requestId: crypto.randomUUID() }); setFormError(''); setConflict(false) }}>Reload latest version</button>}</div>}
      <div className="alert-modal-footer"><Button onClick={() => setForm(null)}>Cancel</Button><button type="submit" className="button primary" disabled={form.kind === 'review' ? !rationale.trim() : form.kind === 'case' ? caseMode === 'existing' ? !caseId : !caseTitle.trim() : false}>{form.kind === 'review' ? 'Save review' : form.kind === 'case' ? caseMode === 'existing' ? 'Link case' : 'Create & link case' : 'Reset demo'}</button></div>
    </form>
  </AlertModal>

  if (selected) return <div className="page alerts-page alert-detail-page">
    <div className="detail-breadcrumb"><button type="button" onClick={() => navigate('/alerts')}>Alert inbox</button><Icon name="chevron" size={13} /><span className="data-id">{selected.id}</span></div>
    <PageHeader eyebrow="MONITORING / ALERT DETAIL" title={selected.id} description="Review the frozen evidence and record an explicit analyst action."><Badge tone={selected.severity}>{selected.severity} severity</Badge><Badge tone={selected.state}>{selected.state}</Badge></PageHeader>
    {message && <div className="alert-feedback" role="status"><Icon name="check" size={16} /><span>{message}</span><button type="button" className="alert-close" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></div>}
    <div className="alert-progress" aria-label="Alert workflow progress">{(['open', 'acknowledged', 'reviewed'] as const).map((step, index) => {
      const currentStep = ['open', 'acknowledged', 'reviewed'].indexOf(selected.state)
      return <div key={step} className={index <= currentStep ? 'complete' : ''} aria-current={index === currentStep ? 'step' : undefined}><span>{index < currentStep ? <Icon name="check" size={13} /> : index + 1}</span><strong>{step}</strong>{index === currentStep && <small>Current state</small>}</div>
    })}<span className="alert-progress-version">Version {selected.version} · synthetic</span></div>
    {assessment && <div className="index-grid"><DimensionIndex name="Fraud" dimension="fraud" data={assessment.dimensions.fraud} /><DimensionIndex name="Mule" dimension="mule" data={assessment.dimensions.mule} /><DimensionIndex name="AML" dimension="aml" data={assessment.dimensions.aml} /></div>}
    <div className="alert-detail-layout">
      <div className="alert-main-column">
        <DetailTabs tabs={['Evidence', 'Activity']} active={detailTab} onChange={setDetailTab} />
        {detailTab === 'Evidence' ? <>
          <Panel><PanelHeader title="Frozen evidence" subtitle="These references remain tied to the original assessment." aside={<Badge tone="medium">Partial coverage</Badge>} />
            <div className="key-grid"><KeyValue label="Transaction"><button type="button" className="text-link data-id" onClick={() => navigate(`/transactions/${selected.transaction_id}`)}>{selected.transaction_id}<Icon name="arrow" size={13} /></button></KeyValue><KeyValue label="Assessment"><button type="button" className="text-link data-id" onClick={() => navigate(`/assessments/${selected.assessment_id}`)}>{selected.assessment_id}<Icon name="arrow" size={13} /></button></KeyValue><KeyValue label="Transaction revision" value={assessment ? `Revision ${assessment.revision}` : 'Unavailable'} /><KeyValue label="Frozen policy" value={selected.policy_id} mono /><KeyValue label="Amount / currency" value={transaction ? `${transaction.amount} ${transaction.currency}` : 'Unavailable'} /><KeyValue label="Institution" value={selected.institution_id} mono /><KeyValue label="Input fingerprint" value={assessment?.input_fingerprint} mono /><KeyValue label="Engine / catalog" value={assessment ? `${assessment.engine_version} / ${assessment.catalog_version}` : 'Unavailable'} /></div>
            <div className="notice warning">Account identity is unresolved. These indices are synthetic signals, not probabilities or verified crime findings.</div>
          </Panel>
          <Panel className="table-panel alert-reasons"><PanelHeader title="Reason codes" subtitle="Illustrative synthetic codes recorded by the frozen assessment" /><div className="table-scroll"><table><thead><tr><th>Reason code</th><th>Evidence / limitation</th></tr></thead><tbody>{assessment?.reason_codes.length ? assessment.reason_codes.map((code) => <tr key={code}><td className="data-id">{code}</td><td>{code === 'DEMO_IDENTITY_UNRESOLVED' ? 'Mule index unavailable: a verified stable identity is required.' : 'Synthetic amount signal recorded. No production or legal threshold is implied.'}</td></tr>) : <tr><td colSpan={2}>Reason evidence unavailable for this fixture.</td></tr>}</tbody></table></div></Panel>
        </> : <Panel><PanelHeader title="Alert action history" subtitle="Session-only mock audit · actor, request and version recorded together" /><ol className="alert-event-list">{events.map((event) => <li key={event.id}><span className="alert-event-dot"><Icon name={event.action.includes('case') ? 'cases' : 'check'} size={13} /></span><div><strong>{event.action.replace(/_/g, ' ')}</strong><p>{event.detail}</p><small>{new Date(event.at).toLocaleString('en-GB', { timeZone: 'Asia/Vientiane' })} ICT · {caseActorName(event.actor)} · v{event.version}</small><code>{event.request_id}</code></div></li>)}<li><span className="alert-event-dot"><Icon name="clock" size={13} /></span><div><strong>Synthetic fixture baseline</strong><p>Original record supplied for this demo. Earlier acknowledgement or review details are not supplied.</p><small>{formatTime(selected.created_at)} · {selected.id}</small></div></li></ol></Panel>}
      </div>
      <aside className="alert-side-column" aria-label="Alert actions and case context">
        <Panel className="alert-action-panel"><PanelHeader title="Analyst actions" subtitle={`${caseActorName(actor)} · demo context`} /><div className="alert-action-stack"><Button primary disabled={!permissions.acknowledge || selected.state !== 'open'} onClick={acknowledge}><Icon name="check" size={15} />{selected.state === 'open' ? 'Acknowledge alert' : 'Acknowledged'}</Button><Button disabled={!permissions.review || selected.state !== 'acknowledged'} onClick={() => openForm('review')}><Icon name="outcomes" size={15} />{selected.state === 'reviewed' ? 'Review recorded' : 'Record review'}</Button></div><p className="alert-supporting-copy">{selected.state === 'open' ? 'Acknowledge the alert before recording your review.' : selected.state === 'reviewed' ? 'This review is recorded. Alert reopening is outside this demo workflow.' : 'Choose suspicious, legitimate or unknown, and explain your evidence.'}</p></Panel>
        <Panel className="alert-case-panel"><PanelHeader title="Investigation case" subtitle="One owning case per alert" aside={<Icon name="cases" size={17} />} />{linkedCase ? <><strong className="alert-case-id data-id">{linkedCase.id}</strong><p className="alert-case-title">{linkedCase.title}</p><div className="alert-case-meta"><Badge tone={linkedCase.state === 'closed' ? 'neutral' : 'violet'}>{linkedCase.state.replace('_', ' ')}</Badge><span>{linkedCase.alert_ids.length} / 20 alerts</span></div><details className="alert-case-evidence"><summary>View linked evidence</summary><div>{linkedCase.alert_ids.map((alertId) => <button type="button" className="text-link data-id" key={alertId} onClick={() => navigate(`/alerts/${alertId}`)}>{alertId}<Icon name="arrow" size={12} /></button>)}</div></details><Button onClick={() => navigate(`/cases/${linkedCase.id}`)}>Open case workspace<Icon name="arrow" size={13} /></Button></> : <><div className="alert-case-empty"><Icon name="cases" size={24} /><strong>No case linked</strong><p>Connect this alert to an investigation while keeping its review state separate.</p></div><Button disabled={!permissions.linkCase} onClick={() => openForm('case')}>Create or link case<Icon name="arrow" size={14} /></Button></>}</Panel>
        {selected.state === 'reviewed' && <Panel className="alert-review-panel"><PanelHeader title="Analyst opinion" subtitle="Unverified · training eligible: false" /><Badge tone={selected.review?.opinion === 'suspicious' ? 'high' : 'neutral'}>{selected.review?.opinion ?? 'Opinion not supplied'}</Badge><p className="alert-review-rationale">{selected.review?.rationale ?? 'This fixture was already reviewed. Its reviewer and rationale are not available in the supplied data.'}</p>{selected.review && <small>Recorded by {caseActorName(selected.review.actor)} · {new Date(selected.review.at).toLocaleString('en-GB', { timeZone: 'Asia/Vientiane' })} ICT</small>}</Panel>}
      </aside>
    </div>
    <footer className="page-footer"><span>Session-only demo · reloading resets actions</span><span>No payment or notification actions</span></footer>
    {dialogs}
  </div>

  const tabKeys = ['all', 'open', 'acknowledged', 'reviewed'] as const
  const tabNames = ['All alerts', 'Open', 'Acknowledged', 'Reviewed']
  const tabs = tabKeys.map((key, index) => `${tabNames[index]} (${counts[key]})`)
  return <div className="page alerts-page">
    <PageHeader eyebrow="MONITORING / TRIAGE WORKSPACE" title="Alert inbox" description="Prioritize risk signals, trace the evidence and record your review."><Button compact disabled={!permissions.reset} onClick={() => openForm('reset')}>Reset demo</Button><StatePreview value={preview} onChange={setPreview} /></PageHeader>
    {message && <div className="alert-feedback" role="status"><Icon name="check" size={16} /><span>{message}</span><button type="button" className="alert-close" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></div>}
    <div className="kpi-grid alert-kpis"><KpiCard label="Open alerts" value={String(counts.open)} detail="Awaiting acknowledgement" icon="alerts" tone="pink" onClick={() => setStatus('open')} /><KpiCard label="Acknowledged" value={String(counts.acknowledged)} detail="Ready for analyst review" icon="check" tone="cyan" onClick={() => setStatus('acknowledged')} /><KpiCard label="Reviewed" value={String(counts.reviewed)} detail="Analyst opinions · unverified" icon="outcomes" tone="violet" onClick={() => setStatus('reviewed')} /><KpiCard label="Linked to a case" value={String(scoped.filter((item) => item.case_id).length)} detail={`${counts.all} alerts in selected scope`} icon="cases" tone="amber" onClick={() => { setStatus('all'); setCaseFilter('linked') }} /></div>
    <div className="alert-queue-toolbar"><DetailTabs tabs={tabs} active={tabs[tabKeys.indexOf(status as typeof tabKeys[number])]} onChange={(tab) => setStatus(tabKeys[tabs.indexOf(tab)])} /><span><Icon name="clock" size={13} />Data as of 23 Oct 2026, 14:00 ICT</span></div>
    <Panel className="filter-panel"><div className="filter-bar"><FilterSearch value={search} onChange={setSearch} placeholder="Search alert, transaction or case ID" /><Select label="Alert severity" value={severity} onChange={setSeverity}><option value="ALL">All severities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="critical">Critical</option></Select><Select label="Risk dimension" value={dimension} onChange={setDimension}><option value="ALL">All dimensions</option><option value="fraud">Fraud</option><option value="mule">Mule</option><option value="aml">AML</option></Select><Select label="Case linkage" value={caseFilter} onChange={setCaseFilter}><option value="ALL">Any case linkage</option><option value="linked">Linked to case</option><option value="unlinked">Not linked</option></Select><Button compact onClick={clear}>Clear filters</Button></div><div className="alert-mobile-filters"><Select label="Alert institution" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select><Select label="Alert time range" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div></Panel>
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <Panel className="table-panel alert-inbox-table"><PanelHeader title="Risk alert queue" subtitle={`${visible.length ? (currentPage - 1) * pageSize + 1 : 0}–${visible.length ? (currentPage - 1) * pageSize + visible.length : 0} of ${preview === 'empty' ? 0 : matches.length} results · newest first`} aside={<Badge tone="medium">Indices are not probabilities</Badge>} /><div className="table-scroll"><table><thead><tr><th>Alert / transaction</th><th>Severity</th><th>Dimensions</th><th>Highest index</th><th>State</th><th>Case</th><th>Created / institution</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{visible.length ? visible.map((item) => {
      const risk = fixtures.assessments.find((row) => row.id === item.assessment_id)
      const values = risk ? Object.values(risk.dimensions).map((value) => value.index).filter((value): value is number => value !== null) : []
      return <tr key={item.id}><td><button type="button" className="alert-id-link data-id" onClick={() => navigate(`/alerts/${item.id}`)}>{item.id}<Icon name="arrow" size={12} /></button><small>{item.transaction_id}</small></td><td><Badge tone={item.severity}>{item.severity}</Badge></td><td><div className="dimension-list">{item.dimensions.map((dim) => <Badge key={dim} tone={dim}>{dim.toUpperCase()}</Badge>)}</div></td><td><strong className="alert-index">{values.length ? Math.max(...values).toFixed(2) : '—'}<small>{values.length ? '/ 1.00 · index' : 'Unavailable'}</small></strong></td><td><Badge tone={item.state}>{item.state}</Badge></td><td>{item.case_id ? <button type="button" className="alert-case-link data-id" onClick={() => navigate(`/alerts/${item.id}`)}>{item.case_id}</button> : <span className="muted">Not linked</span>}</td><td>{formatTime(item.created_at)}<small>{item.institution_id.replace('INST-DEMO-', 'Demo Institution ')}</small></td><td><Button compact ariaLabel={`View ${item.id}`} onClick={() => navigate(`/alerts/${item.id}`)}>View<Icon name="arrow" size={13} /></Button></td></tr>
    }) : <tr><td colSpan={8}><div className="empty-state"><Icon name="search" size={26} /><strong>{preview === 'empty' || !scoped.length ? 'No alerts in this scope' : 'No alerts match these filters'}</strong><span>{preview === 'empty' ? 'This is the empty-state preview.' : 'Adjust the institution, time range or filters to continue.'}</span><Button compact onClick={() => { clear(); setPreview('ready') }}>Clear filters</Button></div></td></tr>}</tbody></table></div><div className="pagination"><span>{institution === 'ALL' ? 'All authorized institutions' : institution.replace('INST-DEMO-', 'Demo Institution ')} · bounded fixture data</span><div><Button compact disabled={currentPage <= 1 || preview === 'empty'} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage} of {pages}</span><Button compact disabled={currentPage >= pages || preview === 'empty'} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div></Panel>}
    <div className="alert-bottom-note"><span><Icon name="access" size={14} />Frozen evidence · unresolved identity · analyst opinions are unverified</span><span>Session-only demo · reloading resets actions</span></div>
    {dialogs}
  </div>
}


const networkModel = createNetworkModel(fixtures, networkBindings)
type NetworkSelection = { kind: 'node' | 'edge'; id: string } | null

function NetworkCanvas({ view, root, selection, path, onSelect, zoom, setZoom, pan, setPan, reducedMotion }: {
  view: NetworkView; root: string; selection: NetworkSelection; path: NetworkEdge[] | null
  onSelect: (selection: NetworkSelection) => void
  zoom: number; setZoom: (zoom: number) => void
  pan: { x: number; y: number }; setPan: (pan: { x: number; y: number }) => void; reducedMotion: boolean
}) {
  const arrowId = `network-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const graphKey = `${root}:${view.nodes.map((node) => node.id).join(',')}:${view.edges.map((edge) => edge.id).join(',')}`
  const { canvasRef, viewportRef } = useNetworkCanvasMotion({ graphKey, selectionKey: `${selection?.kind}:${selection?.id}`, zoom, pan, dragging, reducedMotion })
  const nodeMap = new Map(view.nodes.map((node) => [node.id, node]))
  const pathIds = new Set(path?.map((edge) => edge.id) ?? [])
  const selectWithKey = (event: KeyboardEvent<SVGGElement>, item: NonNullable<NetworkSelection>) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item) }
  }
  return <div ref={canvasRef} className="network-canvas-wrap">
    <div className="network-canvas-tools"><span><i />Invented reference map</span><div><Button compact ariaLabel="Zoom out" disabled={zoom <= .6} onClick={() => setZoom(Math.max(.6, Math.round((zoom - .2) * 10) / 10))}>−</Button><span aria-live="polite">{Math.round(zoom * 100)}%</span><Button compact ariaLabel="Zoom in" disabled={zoom >= 2} onClick={() => setZoom(Math.min(2, Math.round((zoom + .2) * 10) / 10))}>+</Button><Button compact onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>Fit view</Button></div></div>
    <svg className={`network-canvas${dragging ? ' dragging' : ''}`} viewBox="0 0 1000 620" role="group" aria-label="Interactive synthetic network. Use Tab to select references and transfer evidence."
      onPointerDown={(event) => {
        if (event.button !== 0 || (event.target as Element).closest('[data-network-item]')) return
        drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
        event.currentTarget.setPointerCapture(event.pointerId); setDragging(true)
      }}
      onPointerMove={(event) => {
        if (!drag.current) return
        const rect = event.currentTarget.getBoundingClientRect()
        const scale = Math.min(rect.width / 1000, rect.height / 620)
        setPan({ x: drag.current.panX + (event.clientX - drag.current.x) / scale, y: drag.current.panY + (event.clientY - drag.current.y) / scale })
      }}
      onPointerUp={(event) => { drag.current = null; setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
      onPointerCancel={() => { drag.current = null; setDragging(false) }}>
      <defs><pattern id={`${arrowId}-dots`} width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--color-border-subtle)" /></pattern><marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="context-stroke" /></marker></defs>
      <rect width="1000" height="620" fill={`url(#${arrowId}-dots)`} aria-hidden="true" />
      <g ref={viewportRef}>
        {view.edges.map((edge) => {
          const from = nodeMap.get(edge.source)!, to = nodeMap.get(edge.target)!
          const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy)
          const x1 = from.x + dx / length * 37, y1 = from.y + dy / length * 37
          const x2 = to.x - dx / length * 40, y2 = to.y - dy / length * 40
          const cx = (x1 + x2) / 2 - dy / length * edge.bend, cy = (y1 + y2) / 2 + dx / length * edge.bend
          const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`
          const labelX = (x1 + 2 * cx + x2) / 4, labelY = (y1 + 2 * cy + y2) / 4 - 15
          const active = selection?.kind === 'edge' && selection.id === edge.id
          return <g key={edge.id} data-network-item="edge" className={`network-edge${active ? ' selected' : ''}${pathIds.has(edge.id) ? ' traced' : ''}${edge.currency !== 'SYN' ? ' alternate-currency' : ''}`} role="button" tabIndex={0} aria-pressed={active} aria-label={`${edge.id}: ${edge.amount} ${edge.currency}, ${edge.source} to ${edge.target}`} onClick={() => onSelect({ kind: 'edge', id: edge.id })} onKeyDown={(event) => selectWithKey(event, { kind: 'edge', id: edge.id })}>
            <title>{`${edge.id} · ${edge.amount} ${edge.currency} · ${formatTime(edge.occurred_at)} · invented connection`}</title><path className="network-edge-hit" d={d} /><path className="network-edge-line" d={d} markerEnd={`url(#${arrowId})`} /><text className="network-edge-label" x={labelX} y={labelY} textAnchor="middle">{edge.amount} {edge.currency}</text><text className="network-edge-time" x={labelX} y={labelY + 18} textAnchor="middle">{edge.occurred_at.slice(8, 10)} Oct · {edge.occurred_at.slice(11, 16)} ICT</text>
          </g>
        })}
        {view.nodes.map((node) => {
          const active = selection?.kind === 'node' && selection.id === node.id
          const isRoot = node.id === root
          const connected = view.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length
          return <g key={node.id} data-network-item="node" className={`network-node${active ? ' selected' : ''}${isRoot ? ' root' : ''}`} transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={0} aria-pressed={active} aria-label={`${node.label}, ${node.id}, unresolved identity, ${connected} visible transfers${isRoot ? ', starting reference' : ''}`} onClick={() => onSelect({ kind: 'node', id: node.id })} onKeyDown={(event) => selectWithKey(event, { kind: 'node', id: node.id })}>
            <title>{`${node.label} · ${node.institution_id} · invented reference, not a verified account`}</title><g className="network-node-art"><circle className="network-node-halo" r="43" /><circle className="network-node-body" r="32" /><g className="network-node-symbol" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="0" cy="-5" r="6" /><path d="M-10 10c0-10 20-10 20 0" /></g><circle className="network-node-status" cx="25" cy="-23" r="7" /></g><text className="network-node-name" y="61" textAnchor="middle">{node.label}</text><text className="network-node-ref" y="83" textAnchor="middle">{node.id}</text>{isRoot && <text className="network-root-label" y="-58" textAnchor="middle">STARTING REFERENCE</text>}
          </g>
        })}
      </g>
    </svg>
    <div className="network-canvas-legend"><span><i className="amber" />Starting reference</span><span><i className="violet" />Unresolved reference</span><span><i className="cyan" />Transfer / traced path</span><small>Drag to pan · select a reference or transfer</small></div>
  </div>
}

function NetworkPage({ institution, setInstitution, range, setRange, alerts }: {
  institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void; alerts: AlertRecord[]
}) {
  const { pageRef, reducedMotion } = useNetworkPageMotion()
  const inspectorRef = useRef<HTMLElement>(null)
  const [rootId, setRootId] = useState('NODE-DEMO-01')
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('SYN')
  const [dimension, setDimension] = useState<'ALL' | NetworkDimension>('ALL')
  const [direction, setDirection] = useState<NetworkQuery['direction']>('both')
  const [hops, setHops] = useState(2)
  const [nodeLimit, setNodeLimit] = useState(8)
  const [tab, setTab] = useState('Bounded network')
  const [selection, setSelection] = useState<NetworkSelection>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [preview, setPreview] = useState<DemoState>('ready')
  const [pathStart, setPathStart] = useState('NODE-DEMO-01')
  const [pathEnd, setPathEnd] = useState('NODE-DEMO-03')
  const [pathCurrency, setPathCurrency] = useState('SYN')
  const allowedNodes = networkModel.nodes.filter((node) => institution === 'ALL' || node.institution_id === institution)
  const roots = allowedNodes.filter((node) => `${node.id} ${node.label}`.toLowerCase().includes(search.trim().toLowerCase()))
  const root = roots.find((node) => node.id === rootId)?.id ?? roots[0]?.id ?? ''
  const view = selectNetwork(networkModel, { institution, root, days: range === '24h' ? 1 : range === '7d' ? 7 : 30, asOf: fixtures._meta.data_as_of, currency, dimension, direction, maxHops: hops, maxNodes: nodeLimit })
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); setSelection(null) }, [institution, range, currency, dimension, direction, hops, nodeLimit, root])
  const selectedEdge = selection?.kind === 'edge' ? view.edges.find((edge) => edge.id === selection.id) : undefined
  const selectedNode = selectedEdge ? undefined : view.nodes.find((node) => selection?.kind === 'node' && node.id === selection.id) ?? view.nodes.find((node) => node.id === root)
  const safeSelection: NetworkSelection = selectedEdge ? { kind: 'edge', id: selectedEdge.id } : selectedNode ? { kind: 'node', id: selectedNode.id } : null
  useNetworkInspectorMotion(inspectorRef, `${safeSelection?.kind}:${safeSelection?.id}:${tab}:${preview}`, reducedMotion)
  const from = view.nodes.some((node) => node.id === pathStart) ? pathStart : root
  const to = view.nodes.some((node) => node.id === pathEnd) ? pathEnd : view.nodes.find((node) => node.id !== from)?.id ?? ''
  const traceCurrency = currency === 'ALL' ? pathCurrency : currency
  const path = findTemporalPath(view, from, to, hops, traceCurrency)
  const selectedTx = fixtures.transactions.find((tx) => tx.id === selectedEdge?.transaction_id)
  const selectedAssessment = fixtures.assessments.find((assessment) => assessment.id === selectedEdge?.assessment_id)
  const linkedAlert = alerts.find((alert) => alert.transaction_id === selectedEdge?.transaction_id)
  const connections = selectedNode ? view.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id) : []
  const evidence = tab === 'Path evidence' ? path ?? [] : view.edges
  const visibleDimensions = (['fraud', 'mule', 'aml'] as const).filter((dim) => view.edges.some((edge) => edge.indices[dim] !== null))
  const reset = () => { setSearch(''); setRootId(allowedNodes[0]?.id ?? ''); setCurrency('SYN'); setDimension('ALL'); setDirection('both'); setHops(2); setNodeLimit(8); setSelection(null); setZoom(1); setPan({ x: 0, y: 0 }); setTab('Bounded network'); setPreview('ready'); setPathStart('NODE-DEMO-01'); setPathEnd('NODE-DEMO-03'); setPathCurrency('SYN') }
  const exploreFrom = (id: string) => { setSearch(''); setRootId(id); setSelection({ kind: 'node', id }); setZoom(1); setPan({ x: 0, y: 0 }) }

  return <div ref={pageRef} className="page network-page">
    <PageHeader eyebrow="MONITORING / NETWORK INTELLIGENCE" title="Network Explorer" description="Explore bounded connections and trace time-ordered transfer evidence."><Button compact onClick={reset}>Reset view</Button><StatePreview value={preview} onChange={setPreview} /></PageHeader>
    <div className="network-identity-banner"><span className="network-banner-icon"><Icon name="network" size={22} /></span><div><strong>Synthetic network <Badge tone="medium">Identity unverified</Badge></strong><p>Reference connections are explicitly invented. Routing context does not establish account ownership.</p></div><Badge tone="planned">Partial coverage</Badge></div>
    <Panel className="filter-panel network-filter-panel"><div className="filter-bar"><FilterSearch value={search} onChange={setSearch} placeholder="Find reference ID or label" /><Select label="Starting reference" value={root} onChange={(id) => { setRootId(id); setSelection({ kind: 'node', id }); setPan({ x: 0, y: 0 }) }}>{roots.length ? roots.map((node) => <option key={node.id} value={node.id}>{node.label}</option>) : <option value="">No matching references</option>}</Select><Select label="Network currency" value={currency} onChange={setCurrency}><option value="ALL">All currencies · separate</option><option value="SYN">SYN · demo currency</option><option value="USD">USD</option><option value="THB">THB</option></Select><Select label="Dimension availability" value={dimension} onChange={(value) => setDimension(value as typeof dimension)}><option value="ALL">All dimension inputs</option><option value="fraud">Fraud input available</option><option value="mule">Mule input available</option><option value="aml">AML input available</option></Select></div><div className="network-bound-controls"><Select label="Connection direction" value={direction} onChange={(value) => setDirection(value as typeof direction)}><option value="both">Incoming & outgoing</option><option value="outbound">Outgoing only</option><option value="inbound">Incoming only</option></Select><Select label="Maximum hops" value={String(hops)} onChange={(value) => setHops(Number(value))}><option value="1">1 hop</option><option value="2">2 hops</option><option value="3">3 hops</option></Select><Select label="Maximum nodes" value={String(nodeLimit)} onChange={(value) => setNodeLimit(Number(value))}><option value="3">3 reference limit</option><option value="5">5 reference limit</option><option value="8">8 reference limit</option><option value="12">12 reference limit</option></Select><span className="network-filter-scope"><Icon name="access" size={13} />{institution === 'ALL' ? 'Authorized demo institutions' : institution.replace('INST-DEMO-', 'Demo Institution ')} · {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}</span></div><div className="network-mobile-scope"><Select label="Network institution" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select><Select label="Network time range" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div></Panel>
    <section className="kpi-grid network-summary" aria-label="Network view summary">
      <KpiCard label="Visible references" value={String(view.nodes.length)} detail={`Up to ${nodeLimit} references in this view`} icon="network" tone="violet" />
      <KpiCard label="Transfer evidence" value={String(view.edges.length)} detail="Visible transaction observations" icon="transactions" tone="cyan" />
      <KpiCard label="Exploration bound" value={String(hops)} detail={`${hops === 1 ? 'Hop' : 'Hops'} maximum from the starting reference`} icon="network" tone="amber" />
      <KpiCard label="Input availability" value={`${visibleDimensions.length} / 3`} detail="Risk dimensions with available inputs" icon="assessments" tone="pink" />
    </section>
    <div className="network-tabs-row"><DetailTabs tabs={['Bounded network', 'Path evidence', 'Coverage']} active={tab} onChange={setTab} /><Badge tone={view.truncated ? 'medium' : 'cyan'}>{view.truncated ? 'View truncated' : 'Within selected bounds'}</Badge></div>
    {preview !== 'ready' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : !view.edges.length ? <Panel className="network-empty"><Icon name="network" size={32} /><h2>{dimension === 'mule' ? 'Mule inputs are unavailable' : 'No connected evidence in this view'}</h2><p>{dimension === 'mule' ? 'Verified stable identity is not supplied, so Mule input availability remains unknown. This is not a zero-risk result.' : 'Change the starting reference, currency, time range or direction. An empty view does not establish that a reference is safe.'}</p><Button onClick={reset}>Reset view</Button></Panel> : tab === 'Coverage' ? <div className="network-coverage-grid">
      <Panel><PanelHeader title="View boundary" subtitle="Current filters and traversal limits" /><div className="key-grid"><KeyValue label="Starting reference" value={root} mono /><KeyValue label="Institution context" value={institution === 'ALL' ? 'Authorized demo institutions' : institution} /><KeyValue label="Time window" value={`${range === '24h' ? '1 day' : range === '7d' ? '7 days' : '30 days'} through 23 Oct 2026, 14:00 ICT`} /><KeyValue label="Currency" value={currency === 'ALL' ? 'Separate literal currencies; no aggregation' : currency} /><KeyValue label="Eligible transfer observations" value={String(view.eligibleEdges)} /><KeyValue label="Visible transfer observations" value={String(view.edges.length)} /><KeyValue label="Hop bound reached" value={view.hopLimited ? 'Yes · additional references omitted' : 'No further reachable references at the hop boundary'} /><KeyValue label="Node cap reached" value={view.nodeLimited ? 'Yes · some reachable references omitted' : 'No'} /></div></Panel>
      <Panel><PanelHeader title="Identity & interpretation" subtitle="Limits of this synthetic example" /><ul className="network-coverage-notes"><li><Badge tone="medium">Unverified</Badge> All nodes are invented reference bindings, not resolved accounts.</li><li><Badge tone="planned">Partial</Badge> Transfers outside this fixture and network boundary are not visible.</li><li><Badge>Unavailable</Badge> Stable account identity, live graph analytics and account-level enforcement.</li><li><Badge tone="synthetic">Simulation</Badge> Time-ordered paths preserve currency and observed ordering; they do not prove that the same funds moved.</li></ul></Panel>
    </div> : <>
      <div className="network-workspace">
        <Panel className="network-map-panel"><PanelHeader title={tab === 'Path evidence' ? 'Time-ordered path' : 'Reference neighborhood'} subtitle={tab === 'Path evidence' ? 'Directed simple path · same currency · within the visible graph' : 'Click a reference or transfer to inspect its evidence'} aside={<Badge tone="synthetic">Invented bindings</Badge>} />
          {tab === 'Path evidence' && <div className="network-path-controls"><Select label="Path start" value={from} onChange={setPathStart}>{view.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</Select><Icon name="arrow" size={15} /><Select label="Path destination" value={to} onChange={setPathEnd}>{view.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</Select>{currency === 'ALL' && <Select label="Path currency" value={pathCurrency} onChange={setPathCurrency}><option value="SYN">SYN</option><option value="USD">USD</option><option value="THB">THB</option></Select>}<p role="status">{path ? `${path.length} directed ${path.length === 1 ? 'transfer' : 'transfers'} · ${traceCurrency} · nondecreasing event time` : 'No time-ordered path within these filters and bounds.'}</p></div>}
          <NetworkCanvas view={view} root={root} selection={safeSelection} path={tab === 'Path evidence' ? path : null} onSelect={setSelection} zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan} reducedMotion={reducedMotion} />
          {view.truncated && <div className="network-boundary-note" role="status"><Icon name="network" size={15} />{view.nodeLimited ? 'Some reachable references are hidden by the node limit. ' : ''}{view.hopLimited ? 'Additional references exist beyond the hop bound.' : ''} Increase the selected limits to expand this demo view.</div>}
        </Panel>
        <aside ref={inspectorRef} className="network-inspector" aria-label="Selected network evidence"><Panel><PanelHeader title={selectedEdge ? 'Transfer evidence' : 'Reference detail'} subtitle="Selected item in the current view" aside={<Icon name={selectedEdge ? 'transactions' : 'network'} size={18} />} /><div className="network-inspector-content" key={`${safeSelection?.kind}:${safeSelection?.id}`}>{selectedEdge ? <>
          <div className="network-inspector-heading"><span className="data-id">{selectedEdge.id}</span><strong>{selectedEdge.amount}<small>{selectedEdge.currency}</small></strong><Badge tone="success">{selectedEdge.lifecycle}</Badge></div><div className="network-inspector-fields"><KeyValue label="From reference" value={selectedEdge.source} mono /><KeyValue label="To reference" value={selectedEdge.target} mono /><KeyValue label="Occurred at" value={formatTime(selectedEdge.occurred_at)} /><KeyValue label="Transaction revision" value={String(selectedTx?.revision ?? 'Unavailable')} /><KeyValue label="Frozen policy" value={selectedAssessment?.policy_id ?? 'Unavailable'} mono /></div><div className="network-mini-indices">{(['fraud', 'mule', 'aml'] as const).map((dim) => <div key={dim}><span>{dim.toUpperCase()}</span><IndexValue value={selectedEdge.indices[dim]} dimension={dim} /></div>)}</div><div className="network-inspector-actions"><Button primary onClick={() => navigate(`/transactions/${selectedEdge.transaction_id}`)}>View transaction<Icon name="arrow" size={13} /></Button><Button disabled={!selectedEdge.assessment_id} onClick={() => selectedEdge.assessment_id && navigate(`/assessments/${selectedEdge.assessment_id}`)}>View assessment<Icon name="arrow" size={13} /></Button>{linkedAlert ? <Button onClick={() => navigate(`/alerts/${linkedAlert.id}`)}>View alert · {linkedAlert.state}<Icon name="arrow" size={13} /></Button> : <p>No alert supplied for this transfer.</p>}</div>
        </> : selectedNode ? <>
          <div className="network-reference-heading"><span className="network-reference-avatar"><Icon name="network" size={22} /></span><div className="network-reference-meta"><span className="network-overline">REFERENCE</span><h2>{selectedNode.label}</h2><code>{selectedNode.id}</code></div><div className="network-reference-status"><Badge tone="medium">Identity unresolved</Badge><small>Unverified demo reference</small></div></div><div className="network-inspector-fields"><KeyValue label="Reference type" value="Invented demo reference" /><KeyValue label="Institution context" value={selectedNode.institution_id} mono /><KeyValue label="Account ownership" value="Not established" /><KeyValue label="Visible connections" value={String(connections.length)} /></div><Button onClick={() => exploreFrom(selectedNode.id)}>Explore from reference<Icon name="arrow" size={13} /></Button><div className="network-reference-transfers"><h3>Connected transfer evidence</h3>{connections.length ? connections.map((edge) => <button type="button" key={edge.id} onClick={() => setSelection({ kind: 'edge', id: edge.id })}><span className="network-transfer-reference"><strong className="data-id">{edge.id}</strong><small>{edge.source === selectedNode.id ? 'Outgoing' : 'Incoming'} · {edge.occurred_at.slice(8, 10)} Oct</small></span><span className="network-transfer-amount"><strong>{edge.amount}</strong><small>{edge.currency}<Icon name="chevron" size={12} /></small></span></button>) : <p>No connections under the selected filters.</p>}</div>
        </> : <p>Select a visible reference or transfer.</p>}<div className="network-inspector-note"><Icon name="access" size={13} /><span>Invented connections · account ownership is not established.</span></div></div></Panel></aside>
      </div>
      <Panel className="table-panel network-evidence-table"><PanelHeader title={tab === 'Path evidence' ? 'Path evidence in order' : 'Visible transfer evidence'} subtitle={tab === 'Path evidence' ? 'Same currency, ordered event times; a path is not proof of funds tracing' : 'Chronological observations in the bounded neighborhood'} aside={<Badge>{evidence.length} transfers</Badge>} /><div className="table-scroll"><table><thead><tr><th>Transaction</th><th>From → to reference</th><th>Exact amount</th><th>Occurred</th><th>Assessment / coverage</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{evidence.length ? evidence.map((edge, index) => <tr key={edge.id} className={selectedEdge?.id === edge.id ? 'selected' : ''}><td><button type="button" className="text-link data-id" onClick={() => setSelection({ kind: 'edge', id: edge.id })}>{tab === 'Path evidence' ? `${index + 1}. ` : ''}{edge.id}</button></td><td><span className="data-id">{edge.source}</span><small>→ {edge.target}</small></td><td className="exact-amount">{edge.amount} {edge.currency}</td><td>{formatTime(edge.occurred_at)}</td><td>{edge.assessment_id ? <><span className="data-id">{edge.assessment_id}</span><small>{Object.values(edge.indices).filter((value) => value !== null).length}/3 dimensions available</small></> : <Badge>Unavailable</Badge>}</td><td><Button compact onClick={() => navigate(`/transactions/${edge.transaction_id}`)}>Open<Icon name="arrow" size={13} /></Button></td></tr>) : <tr><td colSpan={6}><div className="empty-state"><strong>No eligible time-ordered path</strong><span>Try another destination, increase the bounds, or choose a single currency.</span></div></td></tr>}</tbody></table></div></Panel>
    </>}
    <footer className="page-footer"><span>Synthetic network · account identity unverified · partial visibility</span><span>Exact amounts stay separated by currency</span></footer>
  </div>
}


type CaseDialog = { kind: CaseCommand['kind']; caseId: string; expectedVersion: number; requestId: string; at: string }
const caseActorName = (id: string | null) => CASE_ACTORS.find((actor) => actor.id === id)?.name ?? (id ?? 'Unassigned')
const caseTime = (value: string | null) => value ? `${new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Vientiane', dateStyle: 'medium', timeStyle: 'short' })} ICT` : 'Time not supplied in fixture'

function CasesPage({ id, institution, setInstitution, range, setRange, workspace, onCommand, accessSession, onAccessPersona }: {
  id?: string; institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void
  workspace: AlertWorkspace; onCommand: (command: CaseCommand) => void
  accessSession: AccessSession; onAccessPersona: (value: string) => void
}) {
  const persona = getAccessPersona(accessSession)!
  const actor = persona.caseActor ?? 'actor-auditor'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [dimension, setDimension] = useState('all')
  const [tab, setTab] = useState('Evidence')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [scenario, setScenario] = useState('normal')
  const [form, setForm] = useState<CaseDialog | null>(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [assignee, setAssignee] = useState('')
  const [alertIds, setAlertIds] = useState<string[]>([])
  const [opinions, setOpinions] = useState<Record<CaseDimension, { opinion: CaseOpinion; rationale: string }>>({ fraud: { opinion: 'unknown', rationale: '' }, mule: { opinion: 'unknown', rationale: '' }, aml: { opinion: 'unknown', rationale: '' } })
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [auditFailure, setAuditFailure] = useState(false)
  const [message, setMessage] = useState('')
  const pageRef = useMonitoringMotion(`cases:${id}:${tab}:${institution}:${range}:${search}:${status}:${assigneeFilter}:${dimension}:${preview}`)
  useEffect(() => { setForm(null); setTab('Evidence'); setMessage('') }, [id, institution])
  const selected = workspace.cases.find((item) => item.id === id)
  const scoped = scopedByRange(workspace.cases, institution, range, (item) => item.updated_at)
  const caseDimensions = (item: CaseRecord) => [...new Set(item.alert_ids.flatMap((alertId) => workspace.alerts.find((alert) => alert.id === alertId)?.dimensions ?? []))]
  const filtered = scoped.filter((item) => (status === 'all' || item.state === status) &&
    (assigneeFilter === 'all' || (assigneeFilter === 'mine' ? item.assigned_to === actor : assigneeFilter === 'unassigned' ? item.assigned_to === null : item.assigned_to === assigneeFilter)) &&
    (dimension === 'all' || caseDimensions(item).includes(dimension)) &&
    `${item.id} ${item.title} ${item.alert_ids.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()),
  ).sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  const visible = preview === 'empty' ? [] : filtered
  const fresh = selected ? freshCaseOutcomes(selected) : {}
  const freshCount = CASE_DIMENSIONS.filter((dim) => fresh[dim]).length
  const canWork = !!selected && selected.state !== 'closed' && selected.assigned_to === actor && canCase(actor, 'work')
  const eligibleAlerts = workspace.alerts.filter((alert) => !alert.case_id && (institution === 'ALL' || alert.institution_id === institution) && (!selected || alert.institution_id === selected.institution_id))
  const selectedCreateInstitution = workspace.alerts.find((alert) => alert.id === alertIds[0])?.institution_id
  const clear = () => { setSearch(''); setStatus('all'); setAssigneeFilter('all'); setDimension('all') }
  let evidence: ReturnType<typeof caseEvidence> = []
  let evidenceError = ''
  if (selected && (institution === 'ALL' || selected.institution_id === institution)) {
    try { evidence = caseEvidence(workspace, selected, fixtures) } catch (failure) { evidenceError = failure instanceof Error ? failure.message : 'Evidence unavailable.' }
  }

  function openForm(kind: CaseCommand['kind']) {
    const requestId = crypto.randomUUID()
    setError(''); setConflict(false); setAuditFailure(false); setTitle(''); setText(''); setAssignee(selected?.assigned_to ?? ''); setAlertIds([])
    setOpinions(Object.fromEntries(CASE_DIMENSIONS.map((dim) => [dim, { opinion: fresh[dim]?.opinion ?? 'unknown', rationale: fresh[dim]?.rationale ?? '' }])) as typeof opinions)
    setForm({ kind, caseId: kind === 'create' ? `CASE-DEMO-${requestId}` : selected!.id, expectedVersion: kind === 'create' ? 0 : selected!.version - (scenario === 'conflict' ? 1 : 0), requestId, at: new Date().toISOString() })
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) return
    const common = { caseId: form.caseId, expectedVersion: form.expectedVersion, requestId: form.requestId, at: form.at, actor, institution, auditUnavailable: scenario === 'audit' }
    let command: CaseCommand
    switch (form.kind) {
      case 'create': command = { ...common, kind: 'create', title, alertIds }; break
      case 'assign': command = { ...common, kind: 'assign', assignee: assignee || null }; break
      case 'add_note': command = { ...common, kind: 'add_note', text }; break
      case 'outcomes': command = { ...common, kind: 'outcomes', opinions: CASE_DIMENSIONS.map((dim) => ({ dimension: dim, ...opinions[dim] })) }; break
      case 'reopen': command = { ...common, kind: 'reopen', reason: text }; break
      case 'link_alert': command = { ...common, kind: 'link_alert', alertId: alertIds[0] ?? '' }; break
      default: command = { ...common, kind: form.kind }; break
    }
    try {
      onCommand(command); setForm(null)
      setMessage('Case updated. Versioned history and audit were recorded together.')
      if (form.kind === 'create') navigate(`/cases/${form.caseId}`)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save this case.'); setConflict(failure instanceof CaseActionError && failure.code === 'conflict'); setAuditFailure(failure instanceof CaseActionError && failure.code === 'unavailable') }
  }
  function startReview() {
    if (!selected) return
    try { onCommand({ kind: 'start_review', caseId: selected.id, expectedVersion: selected.version, institution, actor, requestId: crypto.randomUUID(), at: new Date().toISOString(), auditUnavailable: scenario === 'audit' }); setMessage('Review started. Alert acknowledgement states are unchanged.') }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Unable to start review.') }
  }
  const actorSelector = <Select compact label="Demo case persona" value={accessSession.personaId} onChange={onAccessPersona}>{!persona.caseActor && <option value={persona.id}>{persona.name} · read-only</option>}{ACCESS_PERSONAS.filter((item) => item.caseActor).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</Select>
  const dialogTitles: Record<CaseCommand['kind'], string> = { create: 'Create investigation case', assign: 'Assign reviewer', start_review: 'Start review', add_note: 'Add analyst note', outcomes: 'Record dimension outcomes', close: 'Close reviewed case', reopen: 'Reopen investigation', link_alert: 'Link alert evidence' }
  const dialog = form && <AlertModal title={dialogTitles[form.kind]} onClose={() => setForm(null)}><form className="alert-form cases-form" onSubmit={submit}>
    <div className="alert-form-context"><span className="data-id">{form.kind === 'create' ? 'New synthetic case' : form.caseId}</span><Badge tone="synthetic">Session only</Badge></div>
    {form.kind === 'create' && <label>Case title<input autoFocus required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Describe the investigation" /></label>}
    {(form.kind === 'create' || form.kind === 'link_alert') && <fieldset className="case-alert-picker"><legend>{form.kind === 'create' ? 'Choose 1–20 unowned alerts from one institution' : 'Choose one unowned alert'}</legend>{eligibleAlerts.length ? eligibleAlerts.map((alert) => <label key={alert.id}><input type="checkbox" checked={alertIds.includes(alert.id)} disabled={form.kind === 'create' && ((!!selectedCreateInstitution && alert.institution_id !== selectedCreateInstitution) || (alertIds.length >= 20 && !alertIds.includes(alert.id)))} onChange={(event) => setAlertIds(form.kind === 'link_alert' ? event.target.checked ? [alert.id] : [] : event.target.checked ? [...alertIds, alert.id] : alertIds.filter((id) => id !== alert.id))} /><span><strong className="data-id">{alert.id}</strong><small>{alert.institution_id} · {alert.state} · {alert.severity}</small></span></label>) : <p>No unowned alerts are available in this scope.</p>}<small>Linking leaves alert acknowledgement/review unchanged.</small></fieldset>}
    {form.kind === 'assign' && <><label>Assigned reviewer<select autoFocus value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">Unassigned</option>{CASE_ACTORS.filter((item) => item.capabilities.includes('work')).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p>Changing assignment retains history and requires fresh outcomes.</p></>}
    {(form.kind === 'add_note' || form.kind === 'reopen') && <label>{form.kind === 'add_note' ? 'Append-only note' : 'Reason for reopening'}<textarea autoFocus required rows={5} maxLength={form.kind === 'reopen' ? 1000 : 2000} value={text} onChange={(event) => setText(event.target.value)} /><span className="alert-field-help">{text.length} / {form.kind === 'reopen' ? 1000 : 2000} characters · demo limit{form.kind === 'reopen' ? ' · returns to in_review as a proposed UI flow' : ''}</span></label>}
    {form.kind === 'outcomes' && <><p>Record one opinion for each risk dimension with evidence rationale. All outcomes remain unverified and training ineligible.</p>{CASE_DIMENSIONS.map((dim) => <fieldset className="case-opinion-field" key={dim}><legend>{dim.toUpperCase()}</legend><label>Analyst opinion<select value={opinions[dim].opinion} onChange={(event) => setOpinions({ ...opinions, [dim]: { ...opinions[dim], opinion: event.target.value as CaseOpinion } })}><option value="unknown">Unknown</option><option value="suspicious">Suspicious</option><option value="legitimate">Legitimate</option></select></label><label>Evidence and rationale<textarea required rows={3} maxLength={2000} value={opinions[dim].rationale} onChange={(event) => setOpinions({ ...opinions, [dim]: { ...opinions[dim], rationale: event.target.value } })} /></label></fieldset>)}</>}
    {form.kind === 'close' && <p>All three dimensions have fresh analyst opinions. Closing this case preserves those opinions, including unknown, and does not review its alerts or create training labels.</p>}
    {error && <div className="alert-form-error" role="alert">{error}{conflict && selected && <button type="button" className="text-link" onClick={() => { setForm({ ...form, expectedVersion: selected.version, requestId: crypto.randomUUID(), at: new Date().toISOString() }); setConflict(false); setError('') }}>Reload latest version</button>}{auditFailure && <button type="button" className="text-link" onClick={() => { setScenario('normal'); setAuditFailure(false); setError('') }}>Restore demo audit</button>}</div>}
    <div className="alert-modal-footer"><Button onClick={() => setForm(null)}>Cancel</Button><button type="submit" className="button primary" disabled={(form.kind === 'create' && (!title.trim() || !alertIds.length)) || (form.kind === 'link_alert' && alertIds.length !== 1) || (form.kind === 'assign' && (assignee || null) === selected?.assigned_to) || ((form.kind === 'add_note' || form.kind === 'reopen') && !text.trim()) || (form.kind === 'outcomes' && CASE_DIMENSIONS.some((dim) => !opinions[dim].rationale.trim()))}>{form.kind === 'close' ? 'Close case' : form.kind === 'create' ? 'Create case' : 'Save'}</button></div>
  </form></AlertModal>

  if (id && (!selected || (institution !== 'ALL' && selected.institution_id !== institution))) return <div ref={pageRef} className="page records-page cases-page"><Button onClick={() => navigate('/cases')}>Back to cases</Button><AsyncState state={selected ? 'permission' : 'empty'} /></div>
  if (selected && evidenceError) return <div ref={pageRef} className="page records-page cases-page"><PageHeader eyebrow="INVESTIGATIONS" title="Evidence unavailable" description={evidenceError} /><Button onClick={() => navigate('/cases')}>Back to cases</Button></div>
  if (selected) return <div ref={pageRef} className="page records-page cases-page case-detail-page">
    <div className="detail-breadcrumb"><button type="button" onClick={() => navigate('/cases')}>Cases</button><Icon name="chevron" size={13} /><span className="data-id">{selected.id}</span></div>
    <PageHeader eyebrow="INVESTIGATIONS / CASE WORKSPACE" title={selected.title} description={selected.id}><Badge tone={selected.state === 'closed' ? 'success' : 'violet'}>{selected.state.replace('_', ' ')}</Badge>{actorSelector}</PageHeader>
    {message && <div role="status" className="alert-feedback"><Icon name="check" size={16} /><span>{message}</span><button type="button" className="alert-close" onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}
    <div className="case-facts"><KeyValue label="Case version" value={`v${selected.version}`} /><KeyValue label="Institution" value={selected.institution_id} mono /><KeyValue label="Assigned reviewer" value={caseActorName(selected.assigned_to)} /><KeyValue label="Fresh dimension opinions" value={`${freshCount} / 3`} /></div>
    <div className="case-workspace-layout"><div className="case-main">
      <DetailTabs tabs={['Evidence', 'Notes', 'Outcomes', 'Timeline']} active={tab} onChange={setTab} />
      {tab === 'Evidence' && <Panel className="table-panel records-content"><PanelHeader title="Linked alert evidence" subtitle={`${evidence.length} / 20 alerts · frozen references validated`} aside={<Button compact disabled={!canCase(actor, 'create_link') || selected.state === 'closed' || selected.alert_ids.length >= 20 || !eligibleAlerts.length} onClick={() => openForm('link_alert')}>Link alert</Button>} /><div className="table-scroll"><table className="case-evidence-table"><thead><tr><th>Alert</th><th>Transaction / revision</th><th>Assessment</th><th>Frozen policy</th><th>State</th></tr></thead><tbody>{evidence.map((entry) => <tr key={entry.alert_id}><td><button type="button" className="text-link data-id" onClick={() => navigate(`/alerts/${entry.alert_id}`)}>{entry.alert_id}</button></td><td><button type="button" className="text-link data-id" onClick={() => navigate(`/transactions/${entry.transaction_id}`)}>{entry.transaction_id}</button><small>Revision{` ${entry.revision}`}</small></td><td><button type="button" className="text-link data-id" onClick={() => navigate(`/assessments/${entry.assessment_id}`)}>{entry.assessment_id}</button></td><td className="data-id">{entry.policy_id}</td><td><Badge tone={workspace.alerts.find((alert) => alert.id === entry.alert_id)?.state}>{workspace.alerts.find((alert) => alert.id === entry.alert_id)?.state}</Badge></td></tr>)}</tbody></table></div><div className="records-table-note"><Icon name="access" size={14} /><span>Alert state is independent of case state. Account identity remains unresolved.</span></div></Panel>}
      {tab === 'Notes' && <Panel className="records-content"><PanelHeader title="Analyst notes" subtitle="Append-only notes with actor and time" aside={<Button compact disabled={!canWork} onClick={() => openForm('add_note')}>Add note</Button>} />{selected.notes.length ? <div className="case-notes">{selected.notes.slice().reverse().map((note) => <article key={note.id}><div><strong>{caseActorName(note.actor)}</strong><small>{caseTime(note.at)}</small></div><p>{note.text}</p></article>)}</div> : <div className="empty-state"><Icon name="audit" size={26} /><strong>No analyst notes yet</strong><span>Record observations and evidence limitations.</span></div>}<div className="notice">Attachments are planned. This demo supports text notes only.</div></Panel>}
      {tab === 'Outcomes' && <div className="records-content case-outcomes"><div className="notice info"><Icon name="outcomes" /><span><strong>Analyst reviewed · unverified</strong>Training eligible: false. Unknown opinions remain unknown.</span></div><div className="case-opinion-grid">{CASE_DIMENSIONS.map((dim) => { const latest = selected.outcomes.slice().reverse().find((outcome) => outcome.dimension === dim); const current = fresh[dim]; return <article className={`case-opinion-card ${dim}`} key={dim}><h3>{dim.toUpperCase()}</h3><Badge tone={current ? dim : 'neutral'}>{current ? current.opinion : latest ? 'Needs reassessment' : 'Not reviewed'}</Badge><p>{current?.rationale ?? (latest ? 'Assignment, linked evidence or reopening changed the review context. Prior opinions are retained below.' : 'Record an opinion and evidence rationale for this dimension.')}</p><small>{current ? caseActorName(current.actor) : 'No fresh opinion'} · unverified</small></article> })}</div><Button primary disabled={!canWork || selected.state !== 'in_review'} onClick={() => openForm('outcomes')}>Record dimension outcomes</Button>{selected.outcomes.length > 0 && <details className="case-outcome-history"><summary>Review history ({selected.outcomes.length} dimension opinions)</summary>{selected.outcomes.slice().reverse().map((outcome, index) => <article key={`${outcome.dimension}-${index}`}><strong>{outcome.dimension.toUpperCase()} · {outcome.opinion}</strong><p>{outcome.rationale}</p><small>Review context{` ${outcome.epoch}`} · {caseActorName(outcome.actor)} · {caseTime(outcome.at)} · training ineligible</small></article>)}</details>}</div>}
      {tab === 'Timeline' && <Panel className="records-content"><PanelHeader title="Case history & audit" subtitle="Append-only versioned events · session and fixture history" /><ol className="alert-event-list">{selected.history.slice().reverse().map((event) => <li key={event.id}><span className="alert-event-dot"><Icon name="audit" size={13} /></span><div><strong>{event.action.replace(/[._]/g, ' ')}</strong><p>{event.detail}</p><small>v{event.version} · {caseActorName(event.actor)} · {caseTime(event.at)}</small>{event.request_id && <code>{event.request_id}</code>}</div></li>)}</ol></Panel>}
    </div><aside className="case-sidebar"><Panel><PanelHeader title="Investigation workflow" subtitle="Changes are local to this session" /><div className="case-action-stack">{selected.state === 'open' && <Button primary disabled={!canWork} onClick={startReview}>Start review</Button>}{selected.state !== 'closed' && <><Button disabled={!canCase(actor, 'assign')} onClick={() => openForm('assign')}>Assign reviewer</Button><Button disabled={!canWork} onClick={() => openForm('add_note')}>Add note</Button><Button disabled={!canWork || selected.state !== 'in_review'} onClick={() => { setTab('Outcomes'); openForm('outcomes') }}>Record outcomes</Button><Button primary disabled={!canWork || selected.state !== 'in_review' || freshCount !== 3} onClick={() => openForm('close')}>Close case</Button></>}{selected.state === 'closed' && <Button primary disabled={!canCase(actor, 'reopen')} onClick={() => openForm('reopen')}>Reopen with reason</Button>}</div><p className="case-help">{selected.state === 'closed' ? 'Closed does not mean legitimate. A supervisor can reopen with a reason; previous opinions then require reassessment.' : selected.assigned_to !== actor ? 'Work actions require the assigned reviewer. Use the demo supervisor to change assignment.' : 'Close requires fresh opinions for Fraud, Mule and AML. Unknown is a valid reviewed opinion.'}</p><div className="case-review-policy"><Badge>Unverified</Badge><span>Training eligible: false</span></div></Panel><Panel><PanelHeader title="Demo controls" subtitle="Proposed personas and failure scenarios" /><Select label="Case failure preview" value={scenario} onChange={setScenario}><option value="normal">Normal operation</option><option value="conflict">Stale version conflict</option><option value="audit">Audit unavailable</option></Select><p className="case-help">Conflicts preserve the draft. Reload the latest version to retry. Audit failure rolls back the entire action.</p><p className="case-help">Persona capabilities are demo policy, not a production identity directory.</p></Panel></aside></div>
    <footer className="page-footer"><span>Session-only demo · reload resets changes</span><span>Case closure does not change alert reviews</span></footer>{dialog}
  </div>

  return <div ref={pageRef} className="page records-page cases-page">
    <PageHeader eyebrow="INVESTIGATIONS / CASE MANAGEMENT" title="Cases" description="Connect evidence, assign reviewers and record a traceable investigation outcome.">{actorSelector}<Button primary disabled={!canCase(actor, 'create_link')} onClick={() => openForm('create')}>Create case</Button></PageHeader>
    <div className="kpi-grid records-summary"><KpiCard label="Open cases" value={String(scoped.filter((item) => item.state === 'open').length)} detail="Awaiting investigation" icon="cases" tone="amber" onClick={() => setStatus('open')} /><KpiCard label="In review" value={String(scoped.filter((item) => item.state === 'in_review').length)} detail="Active investigation work" icon="assessments" tone="violet" onClick={() => setStatus('in_review')} /><KpiCard label="Closed cases" value={String(scoped.filter((item) => item.state === 'closed').length)} detail="Reviewed · not a crime verdict" icon="outcomes" tone="cyan" onClick={() => setStatus('closed')} /><KpiCard label="Assigned to me" value={String(scoped.filter((item) => item.assigned_to === actor).length)} detail={caseActorName(actor)} icon="access" tone="pink" onClick={() => { setStatus('all'); setAssigneeFilter('mine') }} /></div>
    <Panel className="filter-panel records-filters"><div className="filter-bar case-filters"><FilterSearch value={search} onChange={setSearch} placeholder="Search case, title or linked alert" /><Select label="Case status" value={status} onChange={setStatus}><option value="all">All states</option><option value="open">Open</option><option value="in_review">In review</option><option value="closed">Closed</option></Select><Select label="Case assignee" value={assigneeFilter} onChange={setAssigneeFilter}><option value="all">All reviewers</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option>{CASE_ACTORS.filter((item) => item.capabilities.includes('work')).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select label="Case risk dimension" value={dimension} onChange={setDimension}><option value="all">All dimensions</option><option value="fraud">Fraud</option><option value="mule">Mule</option><option value="aml">AML</option></Select><Button compact onClick={clear}>Clear filters</Button></div><div className="case-filter-context"><Select label="Case institution" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select><Select label="Case updated time range" value={range} onChange={setRange}><option value="24h">Updated in 24 hours</option><option value="7d">Updated in 7 days</option><option value="30d">Updated in 30 days</option></Select><StatePreview value={preview} onChange={setPreview} /></div></Panel>
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <Panel className="table-panel records-content"><PanelHeader title="Investigation queue" subtitle={`${visible.length} cases · latest updated first`} aside={<Badge tone="synthetic">Synthetic workspace</Badge>} /><div className="table-scroll"><table className="clickable-table case-list-table"><thead><tr><th>Case / investigation</th><th>State</th><th>Assigned reviewer</th><th>Alerts</th><th>Dimensions</th><th>Fresh opinions</th><th>Updated</th><th><span className="sr-only">Open case</span></th></tr></thead><tbody>{visible.length ? visible.map((item) => <tr key={item.id} tabIndex={0} onClick={() => navigate(`/cases/${item.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/cases/${item.id}`) } }}><td><strong className="data-id">{item.id}</strong><small>{item.title}</small></td><td><Badge tone={item.state === 'closed' ? 'success' : item.state === 'in_review' ? 'violet' : 'amber'}>{item.state.replace('_', ' ')}</Badge></td><td>{caseActorName(item.assigned_to)}</td><td>{item.alert_ids.length} / 20</td><td><div className="dimension-list">{caseDimensions(item).map((dim) => <Badge key={dim} tone={dim}>{dim.toUpperCase()}</Badge>)}</div></td><td>{Object.values(freshCaseOutcomes(item)).filter(Boolean).length} / 3<small>Unverified</small></td><td>{caseTime(item.updated_at)}</td><td><Icon name="arrow" size={14} /></td></tr>) : <tr><td colSpan={8}><div className="empty-state"><Icon name="cases" size={28} /><strong>No cases match this scope</strong><span>Adjust the filters or create a case from unowned alert evidence.</span><Button compact onClick={clear}>Clear filters</Button></div></td></tr>}</tbody></table></div></Panel>}
    <footer className="page-footer"><span>Per-dimension opinions · immutable evidence references</span><span>Local demo · no production API connection</span></footer>{dialog}
  </div>
}

const OUTCOME_TABS = [
  { id: 'opinions', label: 'Case outcomes', planned: false },
  { id: 'queue', label: 'Review queue', planned: true },
  { id: 'adjudication', label: 'Adjudication', planned: true },
  { id: 'sampling', label: 'Sampling & maturity', planned: true },
]

function OutcomesPage({ institution, setInstitution, range, setRange, workspace }: {
  institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void; workspace: AlertWorkspace
}) {
  const [tab, setTab] = useState('opinions')
  const [filters, setFilters] = useState<OutcomeFilters>({ ...DEFAULT_OUTCOME_FILTERS })
  const [moreFilters, setMoreFilters] = useState(false)
  const [preview, setPreview] = useState<DemoState>('ready')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const tabsId = useId()
  const view = useMemo(() => buildOutcomeView(workspace.cases, { institution, range, asOf: fixtures._meta.data_as_of }), [workspace.cases, institution, range])
  const results = preview === 'empty' ? [] : filterOutcomeRows(view.rows, filters)
  const pageCount = Math.max(1, Math.ceil(results.length / 5))
  const currentPage = Math.min(page, pageCount)
  const visible = results.slice((currentPage - 1) * 5, currentPage * 5)
  const summary = preview === 'empty' ? { recorded: 0, unknown: 0, needsReview: 0, trainingEligible: 0 } : view.summary
  const readiness = preview === 'empty' ? [] : view.readiness
  const selected = view.rows.find((row) => row.id === selectedId)
  const history = selected ? view.rows.filter((row) => row.case_id === selected.case_id && row.dimension === selected.dimension).sort((a, b) => b.opinion_version - a.opinion_version) : []
  const advancedCount = (['reviewer', 'caseId', 'reviewStatus', 'maturity', 'eligibility'] as const).filter((key) => filters[key] !== 'all').length
  const pageRef = useMonitoringMotion(`outcomes:${tab}:${institution}:${range}:${JSON.stringify(filters)}:${currentPage}:${preview}`)
  useEffect(() => { setSelectedId(null); setFilters({ ...DEFAULT_OUTCOME_FILTERS }); setPage(1) }, [institution])
  useEffect(() => setPage(1), [range])
  const changeFilter = (key: keyof OutcomeFilters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1) }
  const clear = () => { setFilters({ ...DEFAULT_OUTCOME_FILTERS }); setPage(1) }
  const caseLabel = institution === 'ALL' ? 'All authorized institutions' : fixtures.institutions.find((item) => item.id === institution)?.label ?? institution
  const governanceSteps = [
    { title: 'Label definitions', detail: 'Approved dimension-specific definitions and permitted uses must be established.', status: 'Not configured' },
    { title: 'Independent adjudication', detail: 'Authorized reviewers, disagreement handling and correction versions are required.', status: 'Planned' },
    { title: 'Evidence & maturity', detail: 'Recorded, effective and evidence-availability times need an approved maturity policy.', status: 'Unavailable' },
    { title: 'Sampling & QA', detail: 'Selection history, quality checks and dataset provenance must be recorded.', status: 'Planned' },
    { title: 'Controlled dataset export', detail: 'Only eligible, governed labels could reach a future export workflow.', status: 'Blocked' },
  ]

  return <div ref={pageRef} className="page monitoring-page records-page outcomes-page">
    <PageHeader eyebrow="INVESTIGATIONS / OUTCOMES" title="Outcomes & Label Review" description="Read analyst opinions, trace their evidence and understand what remains before a governed label can be used."><StatePreview value={preview} onChange={setPreview} /></PageHeader>
    <div className="scope-strip"><span><Icon name="access" size={15} /><strong>{caseLabel}</strong></span><span>Case updated in {range === '24h' ? '24 hours' : range === '7d' ? '7 days' : '30 days'}</span><span>Fixture window · session updates included</span><Badge tone="synthetic">Read-only ledger</Badge></div>
    {(preview === 'ready' || preview === 'empty') && <RecordsSummary items={[
      { label: 'Recorded opinions', value: summary.recorded, detail: 'Latest opinion per case and dimension', tone: 'violet', icon: 'outcomes' },
      { label: 'Unknown opinions', value: summary.unknown, detail: 'Unresolved evidence · never a negative label', tone: 'amber', icon: 'search' },
      { label: 'Needs fresh review', value: summary.needsReview, detail: 'Missing or stale case dimensions', tone: 'pink', icon: 'assessments' },
      { label: 'Training eligible', value: summary.trainingEligible, detail: 'All current opinions remain unverified', tone: 'cyan', icon: 'access' },
    ]} />}
    <div className="detail-tabs outcome-tabs" role="tablist" aria-label="Outcome workspaces">{OUTCOME_TABS.map((item, index) => <button type="button" id={`${tabsId}-${item.id}`} key={item.id} role="tab" aria-controls={`${tabsId}-panel`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => { setTab(item.id); setSelectedId(null) }} onKeyDown={(event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? OUTCOME_TABS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + OUTCOME_TABS.length) % OUTCOME_TABS.length
      const next = OUTCOME_TABS[nextIndex]; setTab(next.id); setSelectedId(null); document.getElementById(`${tabsId}-${next.id}`)?.focus()
    }}><span>{item.label}</span>{item.planned && <span className="outcome-planned-label">Planned</span>}</button>)}</div>
    <Panel className="records-filters outcome-filters">
      <div className="outcome-scope-controls"><div className="records-field"><span>Institution</span><Select label="Outcome institution" value={institution} onChange={setInstitution}>{fixtures.institutions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}<option value="ALL">All authorized institutions</option></Select></div><div className="records-field"><span>Case updated</span><Select label="Outcome case updated window" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div><p>Scope follows case updates. Missing opinion timestamps stay unavailable.</p></div>
      {tab === 'opinions' && <>
        <div className="filter-bar outcome-primary-filters">
          <div className="records-field"><span>Search opinions</span><FilterSearch value={filters.search} onChange={(value) => changeFilter('search', value)} placeholder="Case, rationale or evidence ID" /></div>
          <div className="records-field"><span>Dimension</span><Select label="Opinion dimension" value={filters.dimension} onChange={(value) => changeFilter('dimension', value)}><option value="all">All dimensions</option>{CASE_DIMENSIONS.map((dim) => <option value={dim} key={dim}>{dim.toUpperCase()}</option>)}</Select></div>
          <div className="records-field"><span>Analyst opinion</span><Select label="Analyst opinion filter" value={filters.opinion} onChange={(value) => changeFilter('opinion', value)}><option value="all">All opinions</option><option value="unknown">Unknown</option><option value="suspicious">Suspicious</option><option value="legitimate">Legitimate</option></Select></div>
          <div className="records-field"><span>Opinion version</span><Select label="Opinion freshness" value={filters.freshness} onChange={(value) => changeFilter('freshness', value)}><option value="latest">Latest per dimension</option><option value="current">Current review round</option><option value="stale">Stale · needs review</option><option value="superseded">Superseded versions</option><option value="all">All versions</option></Select></div>
        </div>
        <div className="outcome-filter-actions"><button type="button" className="button compact" aria-expanded={moreFilters} aria-controls={`${tabsId}-filters`} onClick={() => setMoreFilters(!moreFilters)}>More filters{advancedCount > 0 && <span className="outcome-filter-count">{advancedCount}</span>}<Icon name="chevron" size={13} /></button><Button compact onClick={clear}>Clear filters</Button><span role="status">{results.length} opinion versions match</span></div>
        {moreFilters && <div className="outcome-advanced-filters" id={`${tabsId}-filters`}>
          <div className="records-field"><span>Reviewer</span><Select label="Opinion reviewer" value={filters.reviewer} onChange={(value) => changeFilter('reviewer', value)}><option value="all">All reviewers</option>{[...new Set(view.rows.map((row) => row.actor))].map((actor) => <option value={actor} key={actor}>{caseActorName(actor)}</option>)}</Select></div>
          <div className="records-field"><span>Case</span><Select label="Opinion case" value={filters.caseId} onChange={(value) => changeFilter('caseId', value)}><option value="all">All scoped cases</option>{view.cases.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</Select></div>
          <div className="records-field"><span>Review status</span><Select label="Opinion review status" value={filters.reviewStatus} onChange={(value) => changeFilter('reviewStatus', value)}><option value="all">All review states</option><option value="analyst_reviewed">Analyst reviewed</option></Select></div>
          <div className="records-field"><span>Maturity</span><Select label="Opinion maturity" value={filters.maturity} onChange={(value) => changeFilter('maturity', value)}><option value="all">All maturity states</option><option value="unavailable">Unavailable</option><option value="mature">Mature</option></Select></div>
          <div className="records-field"><span>Training eligibility</span><Select label="Opinion training eligibility" value={filters.eligibility} onChange={(value) => changeFilter('eligibility', value)}><option value="all">All eligibility states</option><option value="ineligible">Ineligible</option><option value="eligible">Eligible</option></Select></div>
        </div>}
      </>}
    </Panel>
    <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`} className="records-content outcome-tab-content" tabIndex={0}>
      {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <>
        {tab === 'opinions' && <>
          <Panel className="table-panel"><PanelHeader title="Case opinion ledger" subtitle="Opinions retain their recorded values. A closed case does not create a verified label." aside={<Badge tone="violet">Analyst reviewed · unverified</Badge>} />
            <div className="table-scroll"><table className="outcome-table"><thead><tr><th>Case / dimension</th><th>Opinion</th><th>Reviewer</th><th>Version / freshness</th><th>Frozen evidence</th><th>Recorded</th><th>Training eligibility</th><th><span className="sr-only">Inspect opinion</span></th></tr></thead><tbody>{visible.length ? visible.map((row) => <tr key={row.id}>
              <td><strong className="data-id">{row.case_id}</strong><small><Badge tone={row.dimension}>{row.dimension.toUpperCase()}</Badge><span className="outcome-case-state">{row.case_state.replace('_', ' ')}</span></small></td>
              <td><Badge tone={row.opinion === 'unknown' ? 'amber' : row.opinion === 'suspicious' ? 'pink' : 'neutral'}>{row.opinion}</Badge><small>Analyst opinion</small></td>
              <td>{caseActorName(row.actor)}<small>Unverified</small></td>
              <td>Opinion #{row.opinion_version} · round {row.epoch}<small><Badge tone={row.freshness === 'current' ? 'violet' : 'neutral'}>{row.freshness}</Badge></small></td>
              <td>{row.evidence.length ? <>{row.evidence.length} linked alerts<small>{[...new Set(row.evidence.map((item) => `r${item.revision}`))].join(' · ')} · snapshot retained</small></> : <>Not supplied<small>Historical fixture snapshot</small></>}</td>
              <td>{row.at ? caseTime(row.at) : 'Not supplied'}<small>Opinion recorded time</small></td>
              <td><Badge tone="neutral">Ineligible</Badge><small>Maturity unavailable</small></td>
              <td><Button compact onClick={() => setSelectedId(row.id)}>Inspect<Icon name="arrow" size={13} /></Button></td>
            </tr>) : <tr><td colSpan={8}><div className="empty-state"><Icon name="outcomes" size={28} /><strong>No recorded opinions match</strong><span>Try another filter or record dimension opinions in a scoped case. Unknown opinions remain valid unresolved outcomes.</span><Button compact onClick={clear}>Clear filters</Button></div></td></tr>}</tbody></table></div>
            <div className="pagination"><span>{results.length ? `${(currentPage - 1) * 5 + 1}–${Math.min(currentPage * 5, results.length)} of ${results.length}` : '0 opinions'} · five per page</span><div><Button compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>{currentPage} / {pageCount}</span><Button compact disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
          </Panel>
          <Panel className="outcome-readiness"><PanelHeader title="Cases awaiting fresh opinions" subtitle="Missing and stale dimensions are kept separate from recorded opinions." aside={<Badge>{readiness.filter((item) => item.missing.length + item.stale.length > 0).length} cases</Badge>} />
            {readiness.some((item) => item.missing.length + item.stale.length > 0) ? <div className="outcome-case-list">{readiness.filter((item) => item.missing.length + item.stale.length > 0).map((item) => <div key={item.case.id}><div><strong className="data-id">{item.case.id}</strong><p>{item.missing.length > 0 && `${item.missing.map((dim) => dim.toUpperCase()).join(', ')} not reviewed`}{item.missing.length > 0 && item.stale.length > 0 && ' · '}{item.stale.length > 0 && `${item.stale.map((dim) => dim.toUpperCase()).join(', ')} stale`}</p></div><Button compact onClick={() => navigate(`/cases/${item.case.id}`)}>Open case<Icon name="arrow" size={13} /></Button></div>)}</div> : <p className="outcome-inline-help">No missing or stale opinions in this scope. Label governance and training eligibility remain separate.</p>}
          </Panel>
        </>}
        {tab === 'queue' && <Panel className="table-panel"><PanelHeader title="Review readiness" subtitle="A read-only view of case prerequisites. Governed review queues and assignment are planned." aside={<Badge tone="planned">Planned queue</Badge>} /><div className="table-scroll"><table className="outcome-readiness-table"><thead><tr><th>Case</th><th>Case state</th><th>Current opinions</th><th>Needs fresh review</th><th>Unknown opinions</th><th>Next step</th></tr></thead><tbody>{readiness.length ? readiness.map((item) => <tr key={item.case.id}><td><strong className="data-id">{item.case.id}</strong><small>{item.case.title}</small></td><td><Badge>{item.case.state.replace('_', ' ')}</Badge></td><td>{item.currentCount} / 3<small>Unverified</small></td><td>{item.missing.length} missing · {item.stale.length} stale</td><td>{item.unknown.length}<small>Not negative labels</small></td><td><Button compact onClick={() => navigate(`/cases/${item.case.id}`)}>Open case<Icon name="arrow" size={13} /></Button></td></tr>) : <tr><td colSpan={6}><div className="empty-state"><strong>No cases in this scope</strong><span>Choose another institution or update window.</span></div></td></tr>}</tbody></table></div><div className="records-table-note"><Icon name="clock" size={14} /><span>Awaiting adjudication, disputed and immature queue memberships are unavailable. No review jobs are created by this preview.</span></div></Panel>}
        {tab === 'adjudication' && <div className="outcome-governance-layout">
          <Panel className="outcome-governance"><PanelHeader title="From opinion to governed label" subtitle="Independent review must exist before analyst opinions can become adjudicated outcomes." aside={<Badge tone="planned">Planned</Badge>} /><ol className="outcome-gates">{governanceSteps.map((step) => <li key={step.title}><div><h3>{step.title}</h3><p>{step.detail}</p></div><Badge tone="neutral">{step.status}</Badge></li>)}</ol></Panel>
          <Panel className="outcome-policy-panel"><span className="outcome-policy-icon"><Icon name="access" size={24} /></span><h2>Opinions stay unverified</h2><p>Suspicious and legitimate remain analyst opinions. Future confirmed outcomes need their own definitions, evidence and review process.</p><div className="notice warning">Unknown, an unreviewed dimension or a closed case never becomes an automatic negative label.</div><button type="button" className="button" disabled>Adjudicate · planned</button><Button onClick={() => setTab('opinions')}>Read case opinions<Icon name="arrow" size={13} /></Button></Panel>
        </div>}
        {tab === 'sampling' && <div className="outcome-governance-layout">
          <Panel className="outcome-governance"><PanelHeader title="Sampling & maturity requirements" subtitle="No maturity dates or sampling records have been supplied for these opinions." aside={<Badge tone="planned">Planned</Badge>} /><div className="key-grid outcome-maturity-grid"><KeyValue label="Maturity policy" value="Not configured" /><KeyValue label="Mature-at time" value="Unavailable" /><KeyValue label="Sampling record" value="Not available" /><KeyValue label="QA / disagreement review" value="Not available" /><KeyValue label="Eligible production labels" value="0" /><KeyValue label="Dataset export" value="Blocked" /></div><div className="notice info">Eligibility needs evidence availability, effective time, correction history, independent review and recorded sample selection. No maturity or confidence value is inferred from the age of a case.</div></Panel>
          <Panel className="outcome-policy-panel"><span className="outcome-policy-icon"><Icon name="datasets" size={24} /></span><h2>Export prerequisites incomplete</h2><p>Every current opinion has training eligibility set to false. Synthetic records support this demo workflow; they do not establish model accuracy.</p><button type="button" className="button primary" disabled aria-describedby={`${tabsId}-export-reason`}>Export training labels<Icon name="arrow" size={13} /></button><small id={`${tabsId}-export-reason`}>Requires approved label definitions, adjudication, maturity, QA and dataset provenance.</small><Button onClick={() => setTab('opinions')}>Inspect opinion provenance<Icon name="arrow" size={13} /></Button></Panel>
        </div>}
      </>}
    </div>
    <footer className="page-footer"><span>Analyst opinions ≠ adjudicated labels · training eligible: false</span><span>Synthetic session · case changes appear here immediately</span></footer>
    {selected && <AlertModal title={`${selected.dimension.toUpperCase()} · opinion #${selected.opinion_version}`} onClose={() => setSelectedId(null)}><div className="outcome-inspector">
      <div className="outcome-inspector-context"><span className="data-id">{selected.case_id}</span><Badge tone="synthetic">Unverified opinion</Badge></div>
      <div className="outcome-inspector-badges"><Badge tone={selected.opinion === 'unknown' ? 'amber' : selected.opinion === 'suspicious' ? 'pink' : 'neutral'}>{selected.opinion}</Badge><Badge tone={selected.freshness === 'current' ? 'violet' : 'neutral'}>{selected.freshness}</Badge><Badge>Training eligible: false</Badge></div>
      <div className="key-grid"><KeyValue label="Reviewer" value={caseActorName(selected.actor)} /><KeyValue label="Recorded at" value={selected.at ? caseTime(selected.at) : 'Not supplied'} /><KeyValue label="Review status" value={selected.review_status} /><KeyValue label="Review round" value={String(selected.epoch)} /><KeyValue label="Current case version" value={`v${selected.case_version} · ${selected.case_state.replace('_', ' ')}`} /><KeyValue label="Confidence / uncertainty" value="Not supplied" /><KeyValue label="Effective time" value="Not supplied" /><KeyValue label="Mature-at" value="Unavailable · policy not configured" /></div>
      <section className="outcome-inspector-section"><h3>Analyst rationale</h3><p className="outcome-rationale">{selected.rationale}</p></section>
      <section className="outcome-inspector-section"><h3>Frozen review evidence</h3>{selected.evidence.length ? <div className="outcome-snapshots">{selected.evidence.map((item) => <article key={item.alert_id}><div><strong className="data-id">{item.alert_id}</strong><Badge>r{item.revision}</Badge></div><dl><div><dt>Policy</dt><dd>{item.policy_id}</dd></div><div><dt>Fingerprint</dt><dd>{item.fingerprint}</dd></div></dl><div className="outcome-evidence-links"><Button compact onClick={() => navigate(`/alerts/${item.alert_id}`)}>Alert<Icon name="arrow" size={12} /></Button><Button compact onClick={() => navigate(`/assessments/${item.assessment_id}`)}>Assessment<Icon name="arrow" size={12} /></Button><Button compact onClick={() => navigate(`/transactions/${item.transaction_id}`)}>Transaction<Icon name="arrow" size={12} /></Button></div></article>)}</div> : <div className="notice warning">The historical review snapshot was not supplied. Current case links may differ from the evidence used for this opinion.</div>}</section>
      <section className="outcome-inspector-section"><h3>Why training eligibility is false</h3><ul className="outcome-reasons">{outcomeEligibilityReasons(selected).map((reason) => <li key={reason}>{reason}</li>)}</ul></section>
      <section className="outcome-inspector-section"><h3>Opinion versions · {selected.dimension.toUpperCase()}</h3><p className="outcome-version-help">Numbers show recorded order for this case and dimension. Older opinions remain in history.</p><div className="outcome-versions">{history.map((row) => <button type="button" key={row.id} aria-pressed={row.id === selected.id} onClick={() => setSelectedId(row.id)}><span><strong>Opinion #{row.opinion_version}</strong><small>{row.opinion} · round {row.epoch} · {caseActorName(row.actor)}</small></span><Badge tone={row.freshness === 'current' ? 'violet' : 'neutral'}>{row.freshness}</Badge></button>)}</div></section>
      <div className="alert-modal-footer"><Button onClick={() => setSelectedId(null)}>Close</Button><Button primary onClick={() => navigate(`/cases/${selected.case_id}`)}>Open case workspace<Icon name="arrow" size={13} /></Button></div>
    </div></AlertModal>}
  </div>
}

type DetectorTab = 'catalog' | 'detail' | 'versions' | 'backtests'
const DETECTOR_TABS: { id: DetectorTab; label: string }[] = [
  { id: 'catalog', label: 'Detector catalog' }, { id: 'detail', label: 'Detector detail' },
  { id: 'versions', label: 'Rule versions' }, { id: 'backtests', label: 'Backtests' },
]

function DetectorConditionView({ version }: { version: DetectorVersion }) {
  return <dl className="detector-condition">{Object.entries(conditionFields(version.condition)).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

function DetectorDraftForm({ detector, version, onSave, onCancel }: { detector: DetectorDefinition; version: DetectorVersion; onSave: (condition: AmountCondition, rationale: string) => void; onCancel: () => void }) {
  const source = version.condition.kind === 'amount_gte' ? version.condition : { kind: 'amount_gte' as const, threshold: '', currency: 'SYN', lifecycle: 'completed' }
  const [condition, setCondition] = useState<AmountCondition>({ ...source })
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState('')
  const formId = useId()
  const submit = (event: FormEvent) => {
    event.preventDefault()
    try { onSave(condition, rationale) } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to create the local draft.') }
  }
  return <form className="detector-draft" onSubmit={submit} aria-label="Typed rule draft">
    <div className="detector-section-heading"><div><h3>Draft a typed amount rule</h3><p>Copy {detector.code} · v{version.version} into a new local version.</p></div><Badge tone="planned">Local preview</Badge></div>
    <div className="detector-form-grid">
      <label className="records-field"><span>Operator</span><input value="amount_gte" readOnly /></label>
      <label className="records-field"><span>Threshold · exact decimal</span><input autoFocus inputMode="decimal" required value={condition.threshold} onChange={(event) => { setCondition({ ...condition, threshold: event.target.value }); setError('') }} aria-describedby={`${formId}-help`} /></label>
      <div className="records-field"><span>Currency</span><Select label="Draft currency" value={condition.currency} onChange={(currency) => { setCondition({ ...condition, currency }); setError('') }}><option>SYN</option><option>USD</option><option>THB</option></Select></div>
      <div className="records-field"><span>Lifecycle</span><Select label="Draft lifecycle" value={condition.lifecycle} onChange={(lifecycle) => { setCondition({ ...condition, lifecycle }); setError('') }}><option value="completed">Completed</option><option value="attempted">Attempted</option></Select></div>
    </div>
    <small id={`${formId}-help`}>Positive decimal, up to 2 decimal places. Compared exactly within one currency.</small>
    <label className="records-field"><span>Reason for this version</span><textarea required minLength={8} maxLength={1000} rows={3} value={rationale} onChange={(event) => { setRationale(event.target.value); setError('') }} placeholder="Explain the proposed threshold or scope change" /></label>
    {error && <div className="notice warning" role="alert">{error}</div>}
    <div className="detector-actions"><Button onClick={onCancel}>Cancel</Button><button type="submit" className="button primary">Save local draft<Icon name="arrow" size={14} /></button></div>
    <small>Local preview only. Rule approval and production activation are planned separately.</small>
  </form>
}

function DetectorsPage({ id, institution, range, locale, setLocale, canAuthor, authorizeDraft }: { id?: string; institution: string; range: string; locale: string; setLocale: (value: string) => void; canAuthor: boolean; authorizeDraft: () => void }) {
  const [catalog, setCatalog] = useState<DetectorDefinition[]>(() => structuredClone(DETECTOR_EXAMPLES))
  const [tab, setTab] = useState<DetectorTab>(id ? 'detail' : 'catalog')
  const [selectedCode, setSelectedCode] = useState(id ?? DETECTOR_EXAMPLES[0].code)
  const [versionNumber, setVersionNumber] = useState(2)
  const [compareNumber, setCompareNumber] = useState(1)
  const [filters, setFilters] = useState<DetectorFilters>({ ...DEFAULT_DETECTOR_FILTERS })
  const [preview, setPreview] = useState<DemoState>('ready')
  const [showDraft, setShowDraft] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedInputs, setSelectedInputs] = useState<string[]>([])
  const [report, setReport] = useState<DetectorBacktest | null>(null)
  const [runError, setRunError] = useState('')
  const tabsId = useId()
  const lang = locale === 'lo' ? 'lo' : 'en'
  const selected = catalog.find((item) => item.code === selectedCode) ?? catalog[0]
  const version = selected.versions.find((item) => item.version === versionNumber) ?? selected.versions[selected.versions.length - 1]
  const comparison = selected.versions.find((item) => item.version === compareNumber) ?? selected.versions[0]
  const scope = { institution, range, asOf: fixtures._meta.data_as_of }
  const transactions = scopedDetectorTransactions(fixtures.transactions, scope)
  const inputKeys = transactions.map((tx) => `${tx.id}:r${tx.revision}`)
  const eligibleSelection = selectedInputs.filter((key) => inputKeys.includes(key))
  const results = preview === 'empty' ? [] : filterDetectors(catalog, filters)
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== DEFAULT_DETECTOR_FILTERS[key as keyof DetectorFilters])
  const ready = catalog.filter(detectorReady).length
  const pageRef = useMonitoringMotion(`detectors:${tab}:${id}:${selectedCode}:${version.version}:${comparison.version}:${locale}:${JSON.stringify(filters)}:${institution}:${range}:${preview}:${report?.id}:${showDraft}`)
  useEffect(() => {
    if (!id) { setTab('catalog'); return }
    const detector = catalog.find((item) => item.code === id)
    if (detector) { setSelectedCode(id); setVersionNumber(detector.versions[detector.versions.length - 1].version); setCompareNumber(detector.versions[0].version) }
    setTab('detail'); setShowDraft(false); setMessage(''); setReport(null); setRunError('')
    // Route changes select a detector; creating a local draft must not reset the active tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  useEffect(() => { setSelectedInputs([]); setRunError('') }, [institution, range])
  const chooseDetector = (code: string) => {
    const detector = catalog.find((item) => item.code === code)!
    setSelectedCode(code); setVersionNumber(detector.versions[detector.versions.length - 1].version); setCompareNumber(detector.versions[0].version)
    setShowDraft(false); setMessage(''); setReport(null); setRunError('')
  }
  const changeTab = (next: DetectorTab) => {
    setTab(next); setShowDraft(false); setMessage('')
    if (next === 'catalog' && id) navigate('/detectors')
    if (next === 'detail' && id !== selectedCode) navigate(`/detectors/${selectedCode}`)
  }
  const setFilter = (key: keyof DetectorFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const saveDraft = (condition: AmountCondition, rationale: string) => {
    authorizeDraft()
    const next = draftDetectorVersion(selected, version.version, condition, rationale)
    setCatalog((current) => current.map((item) => item.code === selected.code ? next : item))
    setCompareNumber(version.version); setVersionNumber(next.versions[next.versions.length - 1].version); setShowDraft(false)
    setMessage(`Local draft v${next.versions[next.versions.length - 1].version} saved. Earlier versions remain unchanged.`)
  }
  const runBacktest = () => {
    try {
      const next = runDetectorBacktest(selected, version.version, fixtures.transactions, selectedInputs, scope, `DEMO-BT-${crypto.randomUUID()}`, new Date().toISOString())
      setReport(next); setRunError('')
    } catch (failure) { setRunError(failure instanceof Error ? failure.message : 'Unable to run the local backtest.') }
  }
  const versionSelector = <Select label="Selected rule version" value={String(version.version)} onChange={(value) => { setVersionNumber(Number(value)); setShowDraft(false); setMessage('') }}>{[...selected.versions].reverse().map((item) => <option value={item.version} key={item.version}>v{item.version} · {item.state === 'local_draft' ? 'Local draft' : 'Illustrative'}</option>)}</Select>
  if (id && !catalog.some((item) => item.code === id)) return <div ref={pageRef} className="page records-page detectors-page"><PageHeader eyebrow="DETECTION" title="Detector not found" description="This detector code is not in the illustrative portal catalog." /><Button onClick={() => navigate('/detectors')}>Return to catalog</Button></div>
  return <div ref={pageRef} className="page records-page detectors-page">
    <PageHeader eyebrow="DETECTION / RULE INTELLIGENCE" title="Detector Catalog" description="Read the logic behind a signal. Inspect its inputs, compare rule versions and test frozen synthetic revisions.">
      <StatePreview value={preview} onChange={setPreview} />
    </PageHeader>
    <div className="scope-strip detector-scope"><span><Icon name="detectors" size={14} />Catalog <strong>Illustrative examples</strong></span><span>Evidence <strong>{institution === 'ALL' ? 'All authorized institutions' : institution.replace('INST-DEMO-', 'Demo ')} · {range}</strong></span><span>Snapshot <strong>23 Oct 2026 · 14:00 ICT</strong></span></div>
    <RecordsSummary items={[
      { label: 'Illustrative detectors', value: catalog.length, detail: 'Examples supplied by this portal', icon: 'detectors', tone: 'amber' },
      { label: 'Demo evaluable', value: ready, detail: 'Exact amount inputs supplied', icon: 'check', tone: 'cyan' },
      { label: 'Need additional inputs', value: catalog.length - ready, detail: 'Unavailable stays unavailable', icon: 'health', tone: 'pink' },
      { label: 'Plan-reported catalog', value: 15, detail: 'Full definitions are not supplied', icon: 'policies', tone: 'violet' },
    ]} />
    <div className="detail-tabs detector-tabs" role="tablist" aria-label="Detector workspaces">{DETECTOR_TABS.map((item, index) => <button key={item.id} type="button" role="tab" id={`${tabsId}-${item.id}`} aria-selected={tab === item.id} aria-controls={`${tabsId}-panel`} tabIndex={tab === item.id ? 0 : -1} onClick={() => changeTab(item.id)} onKeyDown={(event) => {
      const nextIndex = event.key === 'ArrowRight' ? (index + 1) % DETECTOR_TABS.length : event.key === 'ArrowLeft' ? (index + DETECTOR_TABS.length - 1) % DETECTOR_TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? DETECTOR_TABS.length - 1 : -1
      if (nextIndex < 0) return
      event.preventDefault(); changeTab(DETECTOR_TABS[nextIndex].id); event.currentTarget.parentElement?.querySelectorAll('button')[nextIndex]?.focus()
    }}><Icon name={item.id === 'catalog' ? 'detectors' : item.id === 'detail' ? 'assessments' : item.id === 'versions' ? 'policies' : 'models'} size={14} />{item.label}</button>)}</div>
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content detector-content" id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
      {tab === 'catalog' ? <>
        <Panel className="records-filters"><div className="filter-bar detector-filters">
          <div className="records-field detector-search"><span>Search catalog</span><FilterSearch value={filters.search} onChange={(value) => setFilter('search', value)} placeholder="Detector name, stable code or reason" /></div>
          <div className="records-field"><span>Family</span><Select label="Detector family" value={filters.family} onChange={(value) => setFilter('family', value)}><option value="all">All families</option><option value="fraud">Fraud</option><option value="mule">Mule</option><option value="aml">AML</option></Select></div>
          <div className="records-field"><span>Prerequisites</span><Select label="Prerequisite availability" value={filters.availability} onChange={(value) => setFilter('availability', value)}><option value="all">All prerequisites</option><option value="ready">Inputs supplied</option><option value="missing">Missing inputs</option></Select></div>
          <div className="records-field"><span>Version</span><Select label="Catalog rule version" value={filters.version} onChange={(value) => setFilter('version', value)}><option value="all">All versions</option>{[...new Set(catalog.flatMap((item) => item.versions.map((entry) => entry.version)))].sort((a, b) => a - b).map((value) => <option key={value} value={value}>v{value}</option>)}</Select></div>
          <div className="records-field"><span>Status</span><Select label="Detector status" value={filters.status} onChange={(value) => setFilter('status', value)}><option value="all">All statuses</option><option value="demo">Demo evaluable</option><option value="reference">Definition only</option></Select></div>
          <div className="records-field"><span>Definition language</span><Select label="Definition language" value={locale} onChange={setLocale}><option value="en">English</option><option value="lo">ລາວ</option></Select></div>
        </div><div className="detector-filter-footer"><span aria-live="polite">{results.length} of {catalog.length} illustrative detectors</span><Button compact disabled={!hasFilters} onClick={() => setFilters({ ...DEFAULT_DETECTOR_FILTERS })}>Clear filters</Button></div></Panel>
        <div className="detector-catalog-layout">
          <Panel className="table-panel"><PanelHeader title="Detection library" subtitle="Stable example codes · definitions are independent of display language" aside={<Badge tone="synthetic">Illustrative</Badge>} />
            <div className="detector-family-bar" aria-label="Quick family filters">{['all', 'fraud', 'mule', 'aml'].map((family) => <button type="button" key={family} aria-pressed={filters.family === family} onClick={() => setFilter('family', family)}>{family === 'all' ? 'All detectors' : family.toUpperCase()}<span>{family === 'all' ? catalog.length : catalog.filter((item) => item.family === family).length}</span></button>)}</div>
            <div className="table-scroll"><table className="detector-table"><thead><tr><th>Detector / reason code</th><th>Family</th><th>Latest version</th><th>Prerequisites</th><th>Status</th><th><span className="sr-only">Open detector</span></th></tr></thead><tbody>{results.length ? results.map((detector) => { const latest = detector.versions[detector.versions.length - 1]; const available = detector.inputs.filter((input) => input.available).length; return <tr key={detector.code}>
              <td><button type="button" className="detector-name" onClick={() => navigate(`/detectors/${detector.code}`)} lang={lang}>{detector.name[lang]}</button><small className="data-id">{detector.code}</small><small className="detector-reason">{detector.reasonCode}</small></td><td><Badge tone={detector.family}>{detector.family.toUpperCase()}</Badge></td><td><strong>v{latest.version}</strong><small>{latest.state === 'local_draft' ? 'Local draft' : 'Illustrative'}</small></td><td><span>{available} / {detector.inputs.length} supplied</span><div className="detector-input-track" aria-hidden="true">{detector.inputs.map((input) => <i key={input.name} className={input.available ? 'available' : ''} />)}</div></td><td><Badge tone={detectorReady(detector) ? 'cyan' : 'neutral'}>{detectorReady(detector) ? 'Demo evaluable' : 'Definition only'}</Badge></td><td><Button compact ariaLabel={`Inspect ${detector.name.en}`} onClick={() => navigate(`/detectors/${detector.code}`)}><Icon name="arrow" size={14} /></Button></td>
            </tr> }) : <tr><td colSpan={6}><div className="empty-state"><Icon name="search" size={26} /><strong>{preview === 'empty' ? 'No catalog examples supplied' : 'No matching detectors'}</strong><span>Adjust the search, family, prerequisite or version filters.</span>{hasFilters && <Button compact onClick={() => setFilters({ ...DEFAULT_DETECTOR_FILTERS })}>Clear filters</Button>}</div></td></tr>}</tbody></table></div>
            <div className="records-table-note"><Icon name="clock" size={14} /><span>Catalog definitions are shared. Institution and time scope apply to linked evidence and backtest inputs.</span></div>
          </Panel>
          <aside className="detector-sidebar"><Panel className="detector-boundary"><span className="detector-feature-icon"><Icon name="detectors" size={24} /></span><h2>Understand every signal</h2><p>Start with the definition, check the available inputs, then follow the frozen evidence.</p><ol><li><strong>Read the condition</strong><span>Typed parameters and literal currency scope.</span></li><li><strong>Check the prerequisites</strong><span>Missing inputs are never negative results.</span></li><li><strong>Compare before changing</strong><span>New versions preserve earlier evidence.</span></li></ol></Panel><Panel className="detector-catalog-note"><Badge tone="planned">Catalog boundary</Badge><h3>4 examples. 15 reported.</h3><p>The plan reports fifteen synthetic detectors. These four portal examples demonstrate the workflow; the full authoritative definitions have not been supplied.</p></Panel></aside>
        </div>
      </> : preview === 'empty' ? <AsyncState state="empty" /> : <>
        <Panel className="detector-context"><div className="records-field"><span>Illustrative detector</span><Select label="Select detector" value={selectedCode} onChange={(code) => { chooseDetector(code); if (tab === 'detail') navigate(`/detectors/${code}`) }}>{catalog.map((detector) => <option key={detector.code} value={detector.code}>{detector.name[lang]} · {detector.family.toUpperCase()}</option>)}</Select></div><div className="records-field"><span>Rule version</span>{versionSelector}</div><Badge tone={selected.family}>{selected.family.toUpperCase()}</Badge><Badge tone="synthetic">Illustrative</Badge></Panel>
        {message && <div className="notice success" role="status">{message}</div>}
        {tab === 'detail' && <>
          <div className="detector-detail-layout"><Panel className="detector-definition"><PanelHeader title={selected.name[lang]} subtitle={selected.code} aside={<Badge tone={detectorReady(selected) ? 'cyan' : 'neutral'}>{detectorReady(selected) ? 'Demo evaluable' : 'Definition only'}</Badge>} /><p className="detector-description" lang={lang}>{selected.description[lang]}</p><div className="key-grid"><KeyValue label="Stable reason code" value={selected.reasonCode} mono /><KeyValue label="Feature version" value={selected.featureVersion} mono /><KeyValue label="Owner" value="Demo risk author · illustrative" /><KeyValue label="Catalog / rule hash" value="Not supplied" /></div><div className="detector-divider"><h3>Typed condition · v{version.version}</h3><DetectorConditionView version={version} /><p>{version.rationale}</p></div><div className="detector-actions"><Button onClick={() => changeTab('versions')}>Compare versions<Icon name="arrow" size={14} /></Button><Button primary onClick={() => changeTab('backtests')}>Test frozen inputs<Icon name="arrow" size={14} /></Button></div></Panel>
            <Panel><PanelHeader title="Prerequisites & available inputs" subtitle="Availability in the supplied portal fixtures" /><div className="detector-prerequisites">{selected.inputs.map((input) => <article key={input.name}><span className={`detector-input-icon ${input.available ? 'available' : ''}`}><Icon name={input.available ? 'check' : 'clock'} size={15} /></span><div><strong>{input.name}</strong><p>{input.detail}</p></div><Badge tone={input.available ? 'cyan' : 'neutral'}>{input.available ? 'Supplied' : 'Missing'}</Badge></article>)}</div><div className="notice warning">{detectorReady(selected) ? 'Inputs support this demo amount comparison. A match is a signal for review.' : 'Required features are missing. Test results stay Unavailable; no value of zero is substituted.'}</div></Panel>
          </div>
          <Panel><PanelHeader title="Interpretation & limitations" subtitle="Keep the signal, coverage and investigation conclusion separate" /><ul className="detector-limitations">{selected.limitations.map((item) => <li key={item}>{item}</li>)}<li>Examples do not establish production effectiveness, model accuracy or calibrated probability.</li></ul></Panel>
          <Panel className="table-panel"><PanelHeader title="Linked assessment context" subtitle="Scoped references sharing the reason code; not proof this illustrative condition produced the frozen index" /><div className="table-scroll"><table className="detector-evidence-table"><thead><tr><th>Assessment</th><th>Transaction revision</th><th>Policy / catalog</th><th>Frozen input</th><th>Related record</th></tr></thead><tbody>{fixtures.assessments.filter((assessment) => transactions.some((tx) => tx.id === assessment.transaction_id && tx.revision === assessment.revision) && assessment.reason_codes.includes(selected.reasonCode)).map((assessment) => <tr key={assessment.id}><td><button type="button" className="text-link data-id" onClick={() => navigate(`/assessments/${assessment.id}`)}>{assessment.id}</button></td><td><strong className="data-id">{assessment.transaction_id}</strong><small>Revision {assessment.revision}</small></td><td><strong className="data-id">{assessment.policy_id}</strong><small>{assessment.catalog_version}</small></td><td className="data-id">{assessment.input_fingerprint}</td><td><Button compact onClick={() => navigate(`/transactions/${assessment.transaction_id}`)}>Transaction<Icon name="arrow" size={12} /></Button></td></tr>)}{!fixtures.assessments.some((assessment) => transactions.some((tx) => tx.id === assessment.transaction_id && tx.revision === assessment.revision) && assessment.reason_codes.includes(selected.reasonCode)) && <tr><td colSpan={5}><div className="empty-state"><strong>No supplied evidence for this code in scope</strong><span>This does not mean the detector returned a negative result.</span></div></td></tr>}</tbody></table></div></Panel>
        </>}
        {tab === 'versions' && <>
          <Panel><PanelHeader title="Rule version comparison" subtitle="Compare typed fields without changing existing versions or assessments" aside={<Badge tone="planned">Local preview</Badge>} /><div className="detector-comparison-selectors"><div className="records-field"><span>Compare from</span><Select label="Compare from version" value={String(comparison.version)} onChange={(value) => setCompareNumber(Number(value))}>{selected.versions.map((item) => <option key={item.version} value={item.version}>v{item.version} · {item.state === 'local_draft' ? 'Local draft' : 'Illustrative'}</option>)}</Select></div><Icon name="arrow" size={18} /><div><span className="detector-caption">Compare to</span><strong>v{version.version} · {version.state === 'local_draft' ? 'Local draft' : 'Illustrative'}</strong></div></div><div className="table-scroll"><table className="detector-comparison-table"><thead><tr><th>Typed field</th><th>v{comparison.version}</th><th>v{version.version}</th><th>Change</th></tr></thead><tbody>{Object.entries(conditionFields(version.condition)).map(([field, value]) => { const before = conditionFields(comparison.condition)[field]; return <tr key={field}><td>{field}</td><td className="data-id">{before ?? '—'}</td><td className="data-id">{value}</td><td><Badge tone={before === value ? 'neutral' : 'amber'}>{before === value ? 'Unchanged' : 'Changed'}</Badge></td></tr> })}</tbody></table></div><div className="detector-version-footer"><p>Rule hashes and production approval are not supplied. Local drafts do not activate a rule.</p>{version.condition.kind === 'amount_gte' ? <Button primary disabled={!canAuthor} onClick={() => setShowDraft(!showDraft)}>{showDraft ? 'Close draft form' : 'Draft local version'}<Icon name="policies" size={14} /></Button> : <Badge>Authoring unavailable · missing feature contract</Badge>}</div></Panel>
          {showDraft && <Panel><DetectorDraftForm key={`${selected.code}:${version.version}`} detector={selected} version={version} onSave={saveDraft} onCancel={() => setShowDraft(false)} /></Panel>}
          <Panel><PanelHeader title="Immutable version history" subtitle="Example lineage and local drafts · no production effective date is inferred" /><div className="detector-version-list">{[...selected.versions].reverse().map((item) => <article key={item.version}><span className="detector-version-mark">v{item.version}</span><div><strong className="data-id">{item.reference}</strong><p>{item.rationale}</p><small>{item.parentVersion ? `Copied from v${item.parentVersion}` : 'Initial illustrative version'} · Hash not supplied</small></div><Badge tone={item.state === 'local_draft' ? 'planned' : 'synthetic'}>{item.state === 'local_draft' ? 'Local draft' : 'Illustrative'}</Badge><Button compact disabled={item.version === version.version} onClick={() => { setVersionNumber(item.version); setShowDraft(false) }}>Inspect</Button></article>)}</div></Panel>
        </>}
        {tab === 'backtests' && <>
          <Panel><PanelHeader title="Bounded offline backtest" subtitle="Select 1–20 frozen transaction revisions; run one illustrative detector version" aside={<Badge tone="planned">Local simulation</Badge>} /><div className="detector-backtest-intro"><DetectorConditionView version={version} /><p>Dataset: portal synthetic fixtures. Amount rules use exact decimal comparison. Reference-only definitions return Unavailable when required features are missing.</p></div><div className="detector-selection-toolbar"><span>{eligibleSelection.length} / 20 selected · {transactions.length} available in scope</span><div><Button compact disabled={!transactions.length} onClick={() => setSelectedInputs(inputKeys.slice(0, 20))}>Select scoped inputs</Button><Button compact disabled={!selectedInputs.length} onClick={() => setSelectedInputs([])}>Clear selection</Button></div></div><div className="table-scroll"><table className="detector-input-table"><thead><tr><th><span className="sr-only">Select revision</span></th><th>Frozen transaction</th><th>Institution</th><th>Exact amount</th><th>Lifecycle</th><th>Occurred</th></tr></thead><tbody>{transactions.length ? transactions.map((tx) => { const key = `${tx.id}:r${tx.revision}`; return <tr key={key}><td><input type="checkbox" aria-label={`Select ${tx.id} revision ${tx.revision}`} checked={eligibleSelection.includes(key)} disabled={!eligibleSelection.includes(key) && eligibleSelection.length >= 20} onChange={(event) => { setSelectedInputs((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key)); setRunError('') }} /></td><td><strong className="data-id">{tx.id}</strong><small>Revision {tx.revision}</small></td><td>{tx.institution_id.replace('INST-DEMO-', 'Demo ')}</td><td className="exact-amount">{tx.amount} {tx.currency}</td><td>{tx.lifecycle}</td><td>{formatTime(tx.occurred_at)}</td></tr> }) : <tr><td colSpan={6}><div className="empty-state"><strong>No revisions in this scope</strong><span>Change institution or time range in the top bar.</span></div></td></tr>}</tbody></table></div>{runError && <div className="notice warning" role="alert">{runError}</div>}<div className="detector-run-footer"><p>Read-only simulation · creates no assessments, live alerts, notifications or money effects.</p><Button primary disabled={!eligibleSelection.length} onClick={runBacktest}>Run local backtest<Icon name="arrow" size={14} /></Button></div></Panel>
          {report && report.scope.institution === institution && report.scope.range === range ? <Panel className="table-panel detector-report"><PanelHeader title="Frozen backtest report" subtitle={`${report.detectorCode} · v${report.rule.version} · ${report.at}`} aside={<Badge tone="synthetic">Simulation</Badge>} /><div className="detector-report-meta"><KeyValue label="Run reference" value={report.id} mono /><KeyValue label="Input snapshot" value={`${report.rows.length} explicit revisions · ${report.scope.institution} · ${report.scope.range}`} /><KeyValue label="Rule snapshot" value={Object.values(conditionFields(report.rule.condition)).join(' · ')} /><KeyValue label="Dataset / feature" value={`${report.dataset} · ${catalog.find((item) => item.code === report.detectorCode)?.featureVersion ?? 'Not supplied'}`} /></div><div className="detector-result-summary" aria-live="polite"><span><b>{report.counts.triggered}</b>Triggered</span><span><b>{report.counts.not_triggered}</b>Not triggered</span><span><b>{report.counts.unavailable}</b>Unavailable</span><span><b>{report.counts.out_of_scope}</b>Outside rule scope</span><span><b>{report.counts.triggered + report.counts.not_triggered} / {report.rows.length}</b>Evaluated coverage</span></div><div className="table-scroll"><table className="detector-result-table"><thead><tr><th>Transaction / revision</th><th>Exact amount</th><th>Result</th><th>Reason / limitation</th></tr></thead><tbody>{report.rows.map((row) => <tr key={`${row.transaction.id}:${row.transaction.revision}`}><td><button type="button" className="text-link data-id" onClick={() => navigate(`/transactions/${row.transaction.id}`)}>{row.transaction.id}</button><small>Revision {row.transaction.revision}</small></td><td className="exact-amount">{row.transaction.amount} {row.transaction.currency}</td><td><Badge tone={row.result === 'triggered' ? 'amber' : row.result === 'unavailable' ? 'pink' : 'neutral'}>{row.result.replace(/_/g, ' ')}</Badge></td><td>{row.reason}</td></tr>)}</tbody></table></div><div className="records-table-note"><Icon name="clock" size={14} /><span>This report keeps its original rule and inputs when you change the selected version. Results are not accuracy, probability or adjudicated outcomes.</span></div></Panel> : <Panel className="detector-report-empty"><Icon name="models" size={28} /><h3>No backtest report in this scope</h3><p>Select frozen revisions above and run a local simulation to inspect evaluated coverage and unavailable results.</p></Panel>}
        </>}
      </>}
    </div>}
    <footer className="page-footer"><span>Illustrative catalog · exact codes remain unchanged across languages</span><span>Local drafts and reports reset when leaving this page or reloading</span></footer>
  </div>
}

type PolicyTab = 'versions' | 'drafts' | 'conditions' | 'approvals' | 'comparison' | 'activation'
type PolicyForm = { kind: 'create' | 'submit' | 'approve' | 'reject' | 'activate' | 'rollback'; policyId: string; expectedVersion: number; binding?: { institution: string; namespace: string; currency: string; generation: number } }

function PolicyConditionView({ policy }: { policy: RiskPolicy }) {
  return <dl className="policy-condition"><div><dt>Operator</dt><dd>amount_gte · illustrative</dd></div><div><dt>Fraud threshold</dt><dd>{policy.condition.fraudThreshold} {policy.currency}</dd></div><div><dt>AML threshold</dt><dd>{policy.condition.amlThreshold} {policy.currency}</dd></div><div><dt>Lifecycle</dt><dd>{policy.condition.lifecycle}</dd></div><div><dt>Mule inputs</dt><dd>Unavailable · identity unresolved</dd></div><div><dt>Namespace</dt><dd>{policy.namespace}</dd></div></dl>
}

function PoliciesPage({ id, institution, setInstitution, range, setRange, workspace, onCommand, accessSession, onAccessPersona }: {
  id?: string; institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void
  workspace: PolicyWorkspace; onCommand: (command: PolicyCommand) => Promise<PolicyWorkspace>
  accessSession: AccessSession; onAccessPersona: (value: string) => void
}) {
  const [tab, setTab] = useState<PolicyTab>(id ? 'conditions' : 'versions')
  const persona = getAccessPersona(accessSession)!
  const actor = persona.policyActor ?? 'demo-auditor'
  const [selectedId, setSelectedId] = useState(id ?? 'POL-SYN-04')
  const [baselineId, setBaselineId] = useState('POL-SYN-03')
  const nextPolicyTab = useRef<PolicyTab | null>(null)
  const [filters, setFilters] = useState<PolicyFilters>({ ...DEFAULT_POLICY_FILTERS })
  const [advanced, setAdvanced] = useState(false)
  const [preview, setPreview] = useState<DemoState>('ready')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<PolicyForm | null>(null)
  const [draftCondition, setDraftCondition] = useState<PolicyCondition>({ operator: 'amount_gte', fraudThreshold: '1000000.00', amlThreshold: '200000.00', lifecycle: 'completed' })
  const [draftCurrency, setDraftCurrency] = useState('SYN')
  const [draftNamespace, setDraftNamespace] = useState('risk-demo')
  const [rationale, setRationale] = useState('')
  const [actionError, setActionError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [runIds, setRunIds] = useState<string[]>([])
  const [comparison, setComparison] = useState<PolicyComparison | null>(null)
  const [comparisonError, setComparisonError] = useState('')
  const [bindingInstitution, setBindingInstitution] = useState('INST-DEMO-A')
  const [bindingNamespace, setBindingNamespace] = useState('risk-demo')
  const [bindingCurrency, setBindingCurrency] = useState('SYN')
  const [activationTarget, setActivationTarget] = useState('POL-SYN-03')
  const [expectedGeneration, setExpectedGeneration] = useState(1)
  const [inspectedJob, setInspectedJob] = useState<PolicyJob | null>(null)
  const tabsId = useId()
  const selected = workspace.policies.find((policy) => policy.id === selectedId) ?? workspace.policies[0]
  const baseline = workspace.policies.find((policy) => policy.id === baselineId) ?? workspace.policies[0]
  const concreteInstitution = institution === 'ALL' ? bindingInstitution : institution
  const binding = findPolicyBinding(workspace, concreteInstitution, bindingNamespace, bindingCurrency)
  const generation = binding?.generation ?? 0
  const staleGeneration = generation !== expectedGeneration
  const approved = workspace.policies.filter((policy) => policy.state === 'approved' && policy.namespace === bindingNamespace && policy.currency === bindingCurrency)
  const target = approved.find((policy) => policy.id === activationTarget)
  const namespaces = [...new Set(workspace.policies.map((policy) => policy.namespace))]
  const scope = { institution, range, asOf: fixtures._meta.data_as_of }
  const transactions = scopedDetectorTransactions(fixtures.transactions, scope)
  const assessmentRuns = fixtures.assessments.filter((assessment) => transactions.some((tx) => tx.id === assessment.transaction_id && tx.revision === assessment.revision && tx.institution_id === assessment.institution_id))
  const selectedRuns = runIds.filter((runId) => assessmentRuns.some((run) => run.id === runId))
  const tabs: { id: PolicyTab; label: string }[] = id ? [{ id: 'conditions', label: 'Conditions' }, { id: 'versions', label: 'Versions' }, { id: 'comparison', label: 'Comparison' }, { id: 'approvals', label: 'Approvals' }, { id: 'activation', label: 'Activation history' }] : [{ id: 'versions', label: 'Policy versions' }, { id: 'drafts', label: 'Draft / submitted' }, { id: 'approvals', label: 'Approvals' }, { id: 'comparison', label: 'Comparison' }, { id: 'activation', label: 'Activation history' }]
  const filtered = preview === 'empty' ? [] : filterPolicies(workspace.policies, filters).filter((policy) => tab !== 'drafts' || ['draft', 'submitted'].includes(policy.state)).sort((a, b) => b.version - a.version)
  const pages = Math.max(1, Math.ceil(filtered.length / 5)), currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * 5, currentPage * 5)
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== DEFAULT_POLICY_FILTERS[key as keyof PolicyFilters])
  const independent = selected.creator !== actor && selected.submitter !== actor
  const pageRef = useMonitoringMotion(`policies:${tab}:${id}:${institution}:${range}:${actor}:${workspace.version}:${JSON.stringify(filters)}:${selectedId}:${page}:${preview}:${comparison?.id}:${advanced}`)
  useEffect(() => { if (id) setSelectedId(id); setTab(nextPolicyTab.current ?? (id ? 'conditions' : 'versions')); nextPolicyTab.current = null; setForm(null); setActionError(''); setMessage('') }, [id])
  useEffect(() => { setForm(null); setActionError(''); setConflict(false); setRunIds([]); setInspectedJob(null) }, [institution, range, actor])
  useEffect(() => { setExpectedGeneration(generation); setActionError(''); setConflict(false) }, [concreteInstitution, bindingNamespace, bindingCurrency])
  useEffect(() => { setPage(1) }, [JSON.stringify(filters), tab])
  const setFilter = (key: keyof PolicyFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const choosePolicy = (value: string) => {
    setSelectedId(value)
    if (id && id !== value) { nextPolicyTab.current = tab; navigate(`/policies/${value}`) }
  }
  const openForm = (kind: PolicyForm['kind'], policy = selected) => {
    setForm({ kind, policyId: policy.id, expectedVersion: workspace.version, binding: { institution: concreteInstitution, namespace: bindingNamespace, currency: bindingCurrency, generation: expectedGeneration } })
    setDraftCondition({ ...policy.condition }); setDraftCurrency(policy.currency); setDraftNamespace(policy.namespace)
    setRationale(''); setActionError(''); setConflict(false); setMessage('')
  }
  const execute = async (action: PolicyAction, expectedVersion = workspace.version) => {
    if (busyRef.current) throw new Error('Wait for the current local action to complete.')
    busyRef.current = true; setBusy(true)
    try { return await onCommand({ ...action, actor, expectedVersion, at: new Date().toISOString(), requestId: `DEMO-PA-${crypto.randomUUID()}` } as PolicyCommand) }
    finally { busyRef.current = false; setBusy(false) }
  }
  const submitForm = async (event: FormEvent) => {
    event.preventDefault(); if (!form || busyRef.current) return
    try {
      const action: PolicyAction = form.kind === 'create' ? { kind: 'create', parentId: form.policyId, namespace: draftNamespace, currency: draftCurrency, condition: draftCondition, rationale }
        : form.kind === 'approve' || form.kind === 'reject' ? { kind: 'review', policyId: form.policyId, decision: form.kind === 'approve' ? 'approved' : 'rejected', rationale }
          : form.kind === 'submit' ? { kind: 'submit', policyId: form.policyId, rationale }
            : { kind: form.kind, policyId: form.policyId, institution: form.binding!.institution, namespace: form.binding!.namespace, currency: form.binding!.currency, expectedGeneration: form.binding!.generation, rationale }
      const next = await execute(action, form.expectedVersion)
      setForm(null); setActionError(''); setConflict(false)
      setMessage(`${form.kind === 'create' ? 'New immutable draft created' : form.kind === 'approve' ? 'Policy approved by the independent checker' : form.kind === 'reject' ? 'Policy rejected with review rationale' : form.kind === 'submit' ? 'Policy submitted for independent review' : 'Local binding updated'}. Synthetic session only.`)
      if (form.kind === 'create') { const created = next.policies[next.policies.length - 1]; setSelectedId(created.id); navigate(`/policies/${created.id}`) }
      if (form.kind === 'activate' || form.kind === 'rollback') setExpectedGeneration(findPolicyBinding(next, concreteInstitution, bindingNamespace, bindingCurrency)?.generation ?? 0)
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'The local action failed.'); setConflict(failure instanceof PolicyError && failure.code === 'conflict') }
  }
  const simulateConflict = async () => {
    try { await execute({ kind: 'simulate_conflict', institution: concreteInstitution, namespace: bindingNamespace, currency: bindingCurrency }); setMessage('A competing update was simulated. The generation you reviewed is now stale; refresh the binding before changing its selection.'); setActionError('') }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Unable to simulate the conflict.') }
  }
  const captureJob = async () => {
    try { await execute({ kind: 'enqueue_preview', institution: concreteInstitution, namespace: bindingNamespace, currency: bindingCurrency, expectedGeneration }); setMessage('Demo job snapshot captured. Its approved policy and selection receipt stay frozen after binding changes.'); setActionError('') }
    catch (failure) { setActionError(failure instanceof Error ? failure.message : 'Unable to capture the demo job.'); setConflict(failure instanceof PolicyError && failure.code === 'conflict') }
  }
  const runComparison = () => {
    try { setComparison(comparePolicyVersions(baseline, selected, fixtures.assessments, fixtures.transactions, runIds, scope, `DEMO-CMP-${crypto.randomUUID()}`, new Date().toISOString())); setComparisonError('') }
    catch (failure) { setComparisonError(failure instanceof Error ? failure.message : 'Unable to compare the selected versions.') }
  }
  const policyOptions = workspace.policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.id} · v{policy.version} · {policy.state}</option>)
  if (id && !workspace.policies.some((policy) => policy.id === id)) return <div ref={pageRef} className="page records-page policies-page"><PageHeader eyebrow="DETECTION" title="Policy not found" description="The requested version is not available in this synthetic session." /><Button onClick={() => navigate('/policies')}>Return to policies</Button></div>
  return <div ref={pageRef} className="page records-page policies-page">
    {id && <div className="detail-breadcrumb"><button type="button" onClick={() => navigate('/policies')}>Risk Policies</button><Icon name="chevron" size={13} /><span className="data-id">{id}</span></div>}
    <PageHeader eyebrow="DETECTION / POLICY GOVERNANCE" title={id ? selected.id : 'Risk Policies'} description="Version the decision logic. Review it independently. Bind approved versions to an explicit local scope."><StatePreview value={preview} onChange={setPreview} /><Button primary disabled={!canPolicy(actor, 'create') || busy} onClick={() => openForm('create')}>Create draft<Icon name="policies" size={15} /></Button></PageHeader>
    <div className="scope-strip policy-scope"><span><Icon name="policies" size={14} />Mode <strong>Local simulation</strong></span><span>Workspace <strong>v{workspace.version}</strong></span><span>Definitions <strong>Shared synthetic catalog</strong></span><Badge tone="planned">Production rollout planned</Badge></div>
    <RecordsSummary items={[
      { label: 'Policy versions', value: workspace.policies.length, detail: 'Immutable condition snapshots', icon: 'policies', tone: 'amber' },
      { label: 'Awaiting review', value: workspace.policies.filter((policy) => policy.state === 'submitted').length, detail: 'Independent checker required', icon: 'clock', tone: 'pink' },
      { label: 'Approved versions', value: workspace.policies.filter((policy) => policy.state === 'approved').length, detail: 'Approval is separate from binding', icon: 'check', tone: 'cyan' },
      { label: 'Selected bindings', value: workspace.bindings.filter((item) => institution === 'ALL' || item.institution === institution).length, detail: 'Authorized institution / currency scope', icon: 'network', tone: 'violet' },
    ]} />
    <Panel className="records-filters"><div className="policy-session-controls"><div className="records-field"><span>Demo persona</span><Select label="Policy demo persona" value={accessSession.personaId} onChange={onAccessPersona}>{!persona.policyActor && <option value={persona.id}>{persona.name} · read-only</option>}{ACCESS_PERSONAS.filter((item) => item.policyActor).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</Select></div><div className="records-field"><span>Institution scope</span><Select label="Policy institution scope" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select></div><div className="records-field"><span>Comparison input window</span><Select label="Policy input time range" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div><p>Persona switching demonstrates proposed capabilities. Policies are shared; evidence, bindings and receipts respect institution scope.</p></div></Panel>
    {id && <Panel className="policy-detail-summary"><div className="policy-identity"><span className="policy-symbol"><Icon name="policies" size={25} /></span><div><strong>Version {selected.version}</strong><small>{selected.namespace} · {selected.currency}</small></div><Badge tone={selected.state === 'approved' ? 'success' : selected.state === 'submitted' ? 'amber' : selected.state === 'rejected' ? 'pink' : 'neutral'}>{selected.state}</Badge></div><div className="key-grid"><KeyValue label="Immutable configuration SHA-256" value={selected.hash} mono /><KeyValue label="Creator / submitter" value={`${policyActorName(selected.creator)} / ${policyActorName(selected.submitter)}`} /><KeyValue label="Independent reviewer" value={policyActorName(selected.approver)} /><KeyValue label="Parent policy" value={selected.parentId ?? 'Initial example'} mono /></div></Panel>}
    <div className="detail-tabs policy-tabs" role="tablist" aria-label="Policy workspaces">{tabs.map((item, index) => <button type="button" role="tab" id={`${tabsId}-${item.id}`} key={item.id} tabIndex={tab === item.id ? 0 : -1} aria-selected={tab === item.id} aria-controls={`${tabsId}-panel`} onClick={() => setTab(item.id)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1; if (next < 0) return; event.preventDefault(); setTab(tabs[next].id); event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus() }}>{item.label}</button>)}</div>
    {message && <div className="notice success" role="status">{message}</div>}
    {actionError && !form && <div className="notice warning" role="alert">{actionError}{conflict && <Button compact onClick={() => { setExpectedGeneration(generation); setActionError(''); setConflict(false) }}>Refresh binding</Button>}</div>}
    {preview !== 'ready' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content policy-content" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
      {(tab === 'versions' || tab === 'drafts') && <>
        <Panel className="records-filters"><div className="filter-bar policy-filters"><div className="records-field policy-search"><span>Search versions</span><FilterSearch value={filters.search} onChange={(value) => setFilter('search', value)} placeholder="Policy ID, namespace or SHA-256" /></div><div className="records-field"><span>Status</span><Select label="Policy status" value={filters.status} onChange={(value) => setFilter('status', value)}><option value="all">All statuses</option>{['draft', 'submitted', 'approved', 'rejected'].map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Namespace</span><Select label="Filter namespace" value={filters.namespace} onChange={(value) => setFilter('namespace', value)}><option value="all">All namespaces</option>{namespaces.map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Currency</span><Select label="Filter policy currency" value={filters.currency} onChange={(value) => setFilter('currency', value)}><option value="all">All currencies</option><option>SYN</option><option>USD</option><option>THB</option></Select></div></div><div className="policy-filter-footer"><button type="button" className="button compact" aria-expanded={advanced} aria-controls={`${tabsId}-advanced`} onClick={() => setAdvanced(!advanced)}><Icon name="chevron" size={13} />More filters</button><Button compact disabled={!hasFilters} onClick={() => setFilters({ ...DEFAULT_POLICY_FILTERS })}>Clear filters</Button><span aria-live="polite">{filtered.length} matching versions</span></div>{advanced && <div className="policy-advanced-filters" id={`${tabsId}-advanced`}><div className="records-field"><span>Creator</span><Select label="Policy creator" value={filters.creator} onChange={(value) => setFilter('creator', value)}><option value="all">All creators</option>{POLICY_ACTORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div><div className="records-field"><span>Reviewer</span><Select label="Policy reviewer" value={filters.approver} onChange={(value) => setFilter('approver', value)}><option value="all">All reviewers</option><option value="none">Not reviewed</option>{POLICY_ACTORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div><div className="records-field"><span>Version</span><Select label="Policy version number" value={filters.version} onChange={(value) => setFilter('version', value)}><option value="all">All versions</option>{workspace.policies.map((policy) => <option key={policy.id} value={policy.version}>v{policy.version}</option>)}</Select></div><label className="records-field"><span>Updated from · UTC</span><input type="date" aria-label="Updated from UTC" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} /></label><label className="records-field"><span>Updated to · UTC</span><input type="date" aria-label="Updated to UTC" min={filters.from || undefined} value={filters.to} onChange={(event) => setFilter('to', event.target.value)} /></label></div>}</Panel>
        <Panel className="table-panel"><PanelHeader title={tab === 'drafts' ? 'Proposals in progress' : 'Immutable policy library'} subtitle="Illustrative typed conditions extend the supplied policy IDs; approval and selection are separate" aside={<Badge tone="synthetic">Session state</Badge>} /><div className="table-scroll"><table className="policy-table"><thead><tr><th>Policy version</th><th>Namespace / currency</th><th>Review state</th><th>Creator / reviewer</th><th>Updated</th><th>Selection in scope</th><th>Inspect</th></tr></thead><tbody>{visible.length ? visible.map((policy) => <tr key={policy.id}><td><button type="button" className="policy-name data-id" onClick={() => navigate(`/policies/${policy.id}`)}>{policy.id}</button><small>v{policy.version} · {policy.hash.slice(0, 20)}…</small></td><td><strong>{policy.namespace}</strong><small>{policy.currency}</small></td><td><Badge tone={policy.state === 'approved' ? 'success' : policy.state === 'submitted' ? 'amber' : policy.state === 'rejected' ? 'pink' : 'neutral'}>{policy.state}</Badge></td><td>{policyActorName(policy.creator)}<small>{policyActorName(policy.approver)}</small></td><td>{policy.updatedAt.slice(0, 10)}<small>{policy.updatedAt.slice(11, 16)} UTC</small></td><td>{workspace.bindings.some((item) => item.policyId === policy.id && (institution === 'ALL' || item.institution === institution)) ? <Badge tone="violet">Locally selected</Badge> : <span className="muted">Not selected</span>}</td><td><Button compact ariaLabel={`Inspect ${policy.id}`} onClick={() => navigate(`/policies/${policy.id}`)}><Icon name="arrow" size={14} /></Button></td></tr>) : <tr><td colSpan={7}><div className="empty-state"><strong>No matching policy versions</strong><span>Adjust the status, namespace or author filters.</span><Button compact onClick={() => setFilters({ ...DEFAULT_POLICY_FILTERS })}>Clear filters</Button></div></td></tr>}</tbody></table></div><div className="pagination"><span>{filtered.length} versions · page {currentPage} of {pages}</span><div><Button compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button compact disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div></Panel>
      </>}
      {tab === 'conditions' && <div className="policy-detail-layout"><Panel><PanelHeader title="Frozen typed conditions" subtitle="Changing a condition creates a new draft; existing versions stay intact" aside={<Badge tone="synthetic">Illustrative</Badge>} /><PolicyConditionView policy={selected} /><div className="key-grid"><KeyValue label="Catalog version" value={selected.catalogVersion} mono /><KeyValue label="Preview evaluator" value={selected.engineVersion} mono /></div><p className="policy-body-copy">{selected.rationale}</p><div className="policy-actions"><Button disabled={!canPolicy(actor, 'create')} onClick={() => openForm('create')}>Create new version<Icon name="policies" size={14} /></Button><Button onClick={() => setTab('comparison')}>Compare frozen inputs<Icon name="arrow" size={14} /></Button></div></Panel><Panel><PanelHeader title="Review before selection" subtitle="Immutable configuration, independent review, explicit binding" /><ol className="policy-gates"><li><strong>Draft</strong><p>Typed thresholds and literal currency/lifecycle scope.</p></li><li><strong>Independent review</strong><p>The creator and submitter cannot approve their own version.</p></li><li><strong>Local selection</strong><p>Bind an approved version using its namespace, currency and reviewed generation.</p></li></ol><div className="notice warning">These configurations and hashes are generated for the portal demo. The authoritative backend policy payload is not connected.</div><Button onClick={() => setTab('approvals')}>Open review workspace<Icon name="arrow" size={14} /></Button></Panel></div>}
      {tab === 'approvals' && <>
        <Panel className="policy-selection"><div className="records-field"><span>Policy to review</span><Select label="Policy for approval" value={selectedId} onChange={choosePolicy}>{policyOptions}</Select></div><Badge tone={selected.state === 'approved' ? 'success' : selected.state === 'submitted' ? 'amber' : 'neutral'}>{selected.state}</Badge><span>Reviewer: <strong>{policyActorName(actor)}</strong></span></Panel>
        <div className="policy-detail-layout"><Panel><PanelHeader title="Maker–checker review" subtitle={`${selected.id} · v${selected.version} · ${selected.namespace} / ${selected.currency}`} /><div className="key-grid"><KeyValue label="Creator" value={policyActorName(selected.creator)} /><KeyValue label="Submitter" value={policyActorName(selected.submitter)} /><KeyValue label="Independent reviewer" value={policyActorName(selected.approver)} /><KeyValue label="Review rationale" value={selected.reviewRationale ?? 'Not recorded'} /></div><PolicyConditionView policy={selected} /><KeyValue label="Configuration SHA-256" value={selected.hash} mono />
          {selected.state === 'draft' ? <div className="policy-review-callout"><p>A draft must be submitted before an independent checker can review it.</p><Button primary disabled={!canPolicy(actor, 'submit') || busy} onClick={() => openForm('submit')}>Submit for review<Icon name="arrow" size={14} /></Button></div> : selected.state === 'submitted' ? <div className="policy-review-callout"><p>{!independent ? 'You created or submitted this policy. Switch to the independent checker persona to review it.' : !canPolicy(actor, 'review') ? 'Switch to the independent checker persona to approve or reject this submitted version.' : 'Review the frozen configuration and record an independent decision with rationale.'}</p><div className="policy-actions"><Button disabled={!independent || !canPolicy(actor, 'review') || busy} onClick={() => openForm('reject')}>Reject version</Button><Button primary disabled={!independent || !canPolicy(actor, 'review') || busy} onClick={() => openForm('approve')}>Approve version<Icon name="check" size={14} /></Button></div></div> : <div className="notice info">This version is {selected.state}. Create a new draft to propose changes; review does not rewrite its frozen conditions.</div>}</Panel>
          <Panel><PanelHeader title="Recorded policy activity" subtitle="Synthetic actor, rationale and timestamp history" /><div className="policy-events">{workspace.history.filter((item) => item.policyId === selected.id).slice().reverse().map((item) => <article key={item.id}><span className="policy-event-symbol"><Icon name={['approved', 'rejected'].includes(item.kind) ? 'check' : 'clock'} size={14} /></span><div><strong>{item.kind.replace(/_/g, ' ')}</strong><p>{item.rationale}</p><small>{policyActorName(item.actor)} · {item.at}</small></div></article>)}{!workspace.history.some((item) => item.policyId === selected.id) && <p className="policy-body-copy">No session action recorded for this fixture version. Creator, state and supplied demo metadata are shown separately.</p>}</div></Panel></div>
        <div className="notice info">Comparison is advisory. A comparison result does not approve a policy, certify model accuracy or authorize a production rollout.</div>
      </>}
      {tab === 'comparison' && <>
        <Panel><PanelHeader title="Compare frozen synthetic runs" subtitle="One bounded input set, two immutable policy versions, three separate dimensions" aside={<Badge tone="planned">Illustrative evaluator</Badge>} /><div className="policy-comparison-controls"><div className="records-field"><span>Baseline version</span><Select label="Baseline policy" value={baselineId} onChange={setBaselineId}>{policyOptions}</Select></div><Icon name="arrow" size={18} /><div className="records-field"><span>Candidate version</span><Select label="Candidate policy" value={selectedId} onChange={choosePolicy}>{policyOptions}</Select></div></div><div className="notice warning">This preview evaluates two typed amount conditions for Fraud and AML. Mule stays unavailable. It does not reproduce the backend’s fifteen-detector evaluator or overwrite frozen assessment indices.</div><div className="policy-input-toolbar"><span>{selectedRuns.length} / 20 selected · {assessmentRuns.length} frozen runs in scope</span><div><Button compact disabled={!assessmentRuns.length} onClick={() => { setRunIds(assessmentRuns.slice(0, 20).map((item) => item.id)); setComparisonError('') }}>Select scoped runs</Button><Button compact disabled={!runIds.length} onClick={() => setRunIds([])}>Clear selection</Button></div></div><div className="table-scroll"><table className="policy-input-table"><thead><tr><th><span className="sr-only">Select run</span></th><th>Frozen assessment run</th><th>Transaction / revision</th><th>Input fingerprint</th><th>Original policy</th></tr></thead><tbody>{assessmentRuns.length ? assessmentRuns.map((run) => <tr key={run.id}><td><input type="checkbox" checked={selectedRuns.includes(run.id)} disabled={!selectedRuns.includes(run.id) && selectedRuns.length >= 20} aria-label={`Select frozen run ${run.id}`} onChange={(event) => { const checked = event.target.checked; setRunIds((current) => checked ? [...current, run.id] : current.filter((value) => value !== run.id)); setComparisonError('') }} /></td><td className="data-id">{run.id}</td><td><strong className="data-id">{run.transaction_id}</strong><small>Revision {run.revision}</small></td><td className="data-id">{run.input_fingerprint}</td><td className="data-id">{run.policy_id}</td></tr>) : <tr><td colSpan={5}><div className="empty-state"><strong>No frozen assessment runs in scope</strong><span>Choose another institution or input window.</span></div></td></tr>}</tbody></table></div>{comparisonError && <div className="notice warning" role="alert">{comparisonError}</div>}<div className="policy-run-footer"><p>No operational assessment, alert or notification is created by comparison.</p><Button primary disabled={!selectedRuns.length || baselineId === selectedId} onClick={runComparison}>Compare selected runs<Icon name="arrow" size={14} /></Button></div></Panel>
        {comparison && comparison.institution === institution && comparison.range === range && <Panel className="table-panel"><PanelHeader title="Frozen comparison report" subtitle={`${comparison.id} · ${comparison.at}`} aside={<Badge tone="synthetic">Advisory</Badge>} /><div className="policy-report-meta"><KeyValue label={`Baseline · ${comparison.baseline.id}`} value={comparison.baseline.hash} mono /><KeyValue label={`Candidate · ${comparison.candidate.id}`} value={comparison.candidate.hash} mono /></div><div className="policy-comparison-summary" aria-live="polite"><span><b>{comparison.rows.length}</b>Frozen runs</span><span><b>{comparison.baselineMatches}</b>Baseline matched runs</span><span><b>{comparison.candidateMatches}</b>Candidate matched runs</span><span><b>{comparison.candidateMatches - comparison.baselineMatches >= 0 ? '+' : ''}{comparison.candidateMatches - comparison.baselineMatches}</b>Match count change</span></div><div className="table-scroll"><table className="policy-comparison-table"><thead><tr><th>Frozen run / revision</th><th>Dimension</th><th>Baseline index</th><th>Candidate index</th><th>Delta</th><th>Coverage</th><th>Reason / limitation</th></tr></thead><tbody>{comparison.rows.flatMap((row) => (['fraud', 'mule', 'aml'] as const).map((dimension) => { const before = row.baseline[dimension], after = row.candidate[dimension]; return <tr key={`${row.assessment.id}:${dimension}`}><td><button type="button" className="text-link data-id" onClick={() => navigate(`/assessments/${row.assessment.id}`)}>{row.assessment.id}</button><small>{row.transaction.id} · r{row.transaction.revision}</small></td><td><Badge tone={dimension}>{dimension.toUpperCase()}</Badge></td><td>{before.index === null ? 'Unavailable' : before.index.toFixed(2)}</td><td>{after.index === null ? 'Unavailable' : after.index.toFixed(2)}</td><td>{before.index === null || after.index === null ? 'Unavailable' : `${after.index - before.index >= 0 ? '+' : ''}${(after.index - before.index).toFixed(2)}`}</td><td>{before.available}/{before.required} → {after.available}/{after.required}</td><td>{after.reason}</td></tr> }))}</tbody></table></div><div className="records-table-note"><Icon name="clock" size={14} /><span>0 and 1 are illustrative amount-rule indices, not probabilities or original assessment scores. Match counts are advisory; input, policy and hash snapshots remain fixed.</span></div></Panel>}
      </>}
      {tab === 'activation' && <>
        <Panel><PanelHeader title="Local selection binding" subtitle="An approved policy selected for one institution, namespace and literal currency" aside={<Badge tone={staleGeneration ? 'pink' : 'violet'}>{staleGeneration ? 'Stale generation' : `Generation ${generation}`}</Badge>} /><div className="policy-binding-controls"><div className="records-field"><span>Binding institution</span><Select label="Binding institution" value={concreteInstitution} onChange={setBindingInstitution}>{(institution === 'ALL' ? ['INST-DEMO-A', 'INST-DEMO-B'] : [institution]).map((value) => <option key={value} value={value}>{value.replace('INST-DEMO-', 'Demo ')}</option>)}</Select></div><div className="records-field"><span>Namespace</span><Select label="Binding namespace" value={bindingNamespace} onChange={setBindingNamespace}>{namespaces.map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Currency</span><Select label="Binding currency" value={bindingCurrency} onChange={setBindingCurrency}><option>SYN</option><option>USD</option><option>THB</option></Select></div><div className="records-field"><span>Approved target version</span><Select label="Approved binding target" value={target?.id ?? ''} onChange={setActivationTarget}><option value="" disabled>Choose approved version</option>{approved.map((policy) => <option key={policy.id} value={policy.id}>{policy.id} · v{policy.version}</option>)}</Select></div></div><div className="key-grid"><KeyValue label="Current selection" value={binding?.policyId ?? 'No binding'} mono /><KeyValue label="Generation you reviewed" value={String(expectedGeneration)} /><KeyValue label="Current generation" value={String(generation)} /><KeyValue label="Activation mode" value="Local binding · no effective-date rollout" /></div>{staleGeneration && <div className="notice warning">The binding changed after you reviewed it. Refresh its generation before activating or rolling back.</div>}<div className="policy-binding-actions"><Button disabled={busy} onClick={() => { setExpectedGeneration(generation); setActionError(''); setConflict(false); setMessage('Binding refreshed. Review the current selection before changing it.') }}>Refresh binding</Button><Button disabled={!binding || !canPolicy(actor, 'activate') || busy} onClick={simulateConflict}>Simulate competing update</Button><Button disabled={!target || !canPolicy(actor, 'activate') || busy || (binding?.policyId === target.id && !staleGeneration)} onClick={() => target && openForm('rollback', target)}>Rollback to selected</Button><Button primary disabled={!target || !canPolicy(actor, 'activate') || busy || (binding?.policyId === target.id && !staleGeneration)} onClick={() => target && openForm('activate', target)}>Activate local binding<Icon name="arrow" size={14} /></Button></div><p className="policy-body-copy">Use the Demo policy activator persona for binding changes. Rollback requires a previously selected approved version in this exact scope.</p></Panel>
        <Panel className="table-panel"><PanelHeader title="Binding history" subtitle="Generation changes and immutable selection receipts in the explicit scope" /><div className="table-scroll"><table className="policy-history-table"><thead><tr><th>Action / time</th><th>Selection</th><th>Generation</th><th>Actor</th><th>Rationale</th></tr></thead><tbody>{workspace.history.filter((item) => item.binding?.institution === concreteInstitution && item.binding.namespace === bindingNamespace && item.binding.currency === bindingCurrency).slice().reverse().map((item) => <tr key={item.id}><td><strong>{item.kind.replace(/_/g, ' ')}</strong><small>{item.at}</small></td><td><strong className="data-id">{item.policyId}</strong><small>{item.previousPolicyId ? `Previous: ${item.previousPolicyId}` : 'Initial binding'}</small></td><td>g{item.binding?.generation}</td><td>{policyActorName(item.actor)}</td><td>{item.rationale}</td></tr>)}{!workspace.history.some((item) => item.binding?.institution === concreteInstitution && item.binding.namespace === bindingNamespace && item.binding.currency === bindingCurrency) && <tr><td colSpan={5}><div className="empty-state"><strong>No binding history in this scope</strong><span>Choose a namespace/currency or bind an approved version.</span></div></td></tr>}</tbody></table></div></Panel>
        <Panel className="table-panel"><PanelHeader title="Frozen job selection receipts" subtitle="Accepted demo jobs keep their approved policy and hash after binding changes" aside={<Button compact disabled={!binding || !canPolicy(actor, 'enqueue') || staleGeneration || busy} onClick={captureJob}>Capture demo job</Button>} /><div className="table-scroll"><table className="policy-jobs-table"><thead><tr><th>Demo job</th><th>Accepted policy</th><th>Receipt scope</th><th>Accepted generation</th><th>Inspect</th></tr></thead><tbody>{workspace.jobs.filter((job) => job.receipt.institution === concreteInstitution && job.receipt.namespace === bindingNamespace && job.receipt.currency === bindingCurrency).map((job) => <tr key={job.id}><td><strong className="data-id">{job.id}</strong><small>{job.acceptedAt}</small></td><td><strong className="data-id">{job.policy.id}</strong><small>{job.policy.hash.slice(0, 24)}…</small></td><td>{job.receipt.institution}<small>{job.receipt.namespace} / {job.receipt.currency}</small></td><td>g{job.receipt.generation}</td><td><Button compact onClick={() => setInspectedJob(job)}>Receipt<Icon name="arrow" size={13} /></Button></td></tr>)}{!workspace.jobs.some((job) => job.receipt.institution === concreteInstitution && job.receipt.namespace === bindingNamespace && job.receipt.currency === bindingCurrency) && <tr><td colSpan={5}><div className="empty-state"><strong>No demo job snapshots in this scope</strong><span>Capture one from an approved local binding to inspect its frozen receipt.</span></div></td></tr>}</tbody></table></div></Panel>
      </>}
    </div>}
    <footer className="page-footer"><span>Local simulation · approval ≠ activation · comparison is advisory</span><span>Session state survives navigation · reload resets the demo</span></footer>
    {form && <AlertModal title={form.kind === 'create' ? 'Create immutable draft' : form.kind === 'submit' ? 'Submit policy for review' : form.kind === 'approve' ? 'Approve policy version' : form.kind === 'reject' ? 'Reject policy version' : form.kind === 'rollback' ? 'Roll back local binding' : 'Activate local binding'} onClose={() => { if (!busyRef.current) setForm(null) }}><form className="alert-form policy-action-form" onSubmit={submitForm}><div className="alert-form-context"><strong className="data-id">{form.policyId}</strong><Badge tone="synthetic">Local simulation</Badge></div><p>Actor: {policyActorName(actor)}. {form.kind === 'create' ? 'A new version receives its own configuration hash. The source remains unchanged.' : 'Record a rationale for this exact immutable version.'}</p>
      {form.kind === 'create' && <><label><span>Namespace</span><input required value={draftNamespace} onChange={(event) => setDraftNamespace(event.target.value)} maxLength={40} /></label><div className="policy-form-grid"><label><span>Currency</span><select value={draftCurrency} onChange={(event) => setDraftCurrency(event.target.value)}><option>SYN</option><option>USD</option><option>THB</option></select></label><label><span>Lifecycle</span><select value={draftCondition.lifecycle} onChange={(event) => setDraftCondition({ ...draftCondition, lifecycle: event.target.value as PolicyCondition['lifecycle'] })}><option value="completed">Completed</option><option value="attempted">Attempted</option></select></label><label><span>Fraud threshold · exact decimal</span><input required inputMode="decimal" value={draftCondition.fraudThreshold} onChange={(event) => setDraftCondition({ ...draftCondition, fraudThreshold: event.target.value })} /></label><label><span>AML threshold · exact decimal</span><input required inputMode="decimal" value={draftCondition.amlThreshold} onChange={(event) => setDraftCondition({ ...draftCondition, amlThreshold: event.target.value })} /></label></div><small>Restricted amount_gte parameters only. Positive amounts with up to two decimal places; no exchange-rate conversion.</small></>}
      {(form.kind === 'activate' || form.kind === 'rollback') && <div className="notice warning"><span><strong>{form.binding?.institution} · {form.binding?.namespace} / {form.binding?.currency}</strong><span>Expected generation {form.binding?.generation}. This changes only the local selection binding; accepted demo jobs keep their original policy.</span></span></div>}
      <label><span>Rationale · required</span><textarea autoFocus={form.kind !== 'create'} required minLength={8} maxLength={1000} rows={3} value={rationale} onChange={(event) => { setRationale(event.target.value); if (!conflict) setActionError('') }} aria-invalid={!!actionError} aria-describedby={actionError ? `${tabsId}-action-error` : undefined} placeholder="Explain this policy or binding decision" /></label>{actionError && <div className="alert-form-error" id={`${tabsId}-action-error`} role="alert">{actionError}{conflict && <Button compact onClick={() => { setExpectedGeneration(generation); setForm(null); setActionError(''); setConflict(false); setMessage('Workspace refreshed. Review the latest version and binding before trying again.') }}>Refresh workspace</Button>}</div>}<div className="alert-modal-footer"><Button disabled={busy} onClick={() => setForm(null)}>Cancel</Button><button type="submit" className="button primary" disabled={busy || conflict}>{busy ? 'Saving local action…' : form.kind === 'create' ? 'Create draft' : 'Confirm local action'}</button></div></form></AlertModal>}
    {inspectedJob && <AlertModal title="Frozen selection receipt" onClose={() => setInspectedJob(null)}><div className="policy-job-inspector"><Badge tone="planned">Accepted demo snapshot</Badge><div className="key-grid"><KeyValue label="Job reference" value={inspectedJob.id} mono /><KeyValue label="Accepted at" value={inspectedJob.acceptedAt} /><KeyValue label="Approved policy" value={`${inspectedJob.policy.id} · v${inspectedJob.policy.version}`} /><KeyValue label="Receipt generation" value={`g${inspectedJob.receipt.generation}`} /><KeyValue label="Namespace / currency" value={`${inspectedJob.receipt.namespace} / ${inspectedJob.receipt.currency}`} /><KeyValue label="Institution" value={inspectedJob.receipt.institution} /></div><KeyValue label="Frozen configuration SHA-256" value={inspectedJob.receipt.policyHash} mono /><PolicyConditionView policy={inspectedJob.policy} /><div className="notice info">This snapshot was captured when the demo job was accepted. Later activation or rollback never changes its policy, hash or selection receipt.</div><div className="alert-modal-footer"><Button onClick={() => setInspectedJob(null)}>Close</Button><Button onClick={() => { const policyId = inspectedJob.policy.id; setInspectedJob(null); navigate(`/policies/${policyId}`) }}>Open frozen policy<Icon name="arrow" size={14} /></Button></div></div></AlertModal>}
  </div>
}

const MODEL_TABS = [
  { id: 'comparison', label: 'Baseline comparison', icon: 'models' },
  { id: 'datasets', label: 'Evaluation datasets', icon: 'datasets' },
  { id: 'registry', label: 'Registry', icon: 'policies' },
  { id: 'serving', label: 'Serving health', icon: 'health' },
] as const
type ModelTab = typeof MODEL_TABS[number]['id']
type ModelInspector = { kind: 'template'; id: string } | { kind: 'snapshot'; id: string } | { kind: 'dataset' }

function ModelsPage({ institution, setInstitution, range, setRange, workspace, policies }: {
  institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void
  workspace: AlertWorkspace; policies: RiskPolicy[]
}) {
  const [tab, setTab] = useState<ModelTab>('comparison')
  const [currency, setCurrency] = useState('all')
  const [cohort, setCohort] = useState<ModelScope['cohort']>('all')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [candidateId, setCandidateId] = useState(MODEL_TEMPLATES[0].id)
  const [baselineId, setBaselineId] = useState('POL-SYN-03')
  const [datasetId, setDatasetId] = useState('current')
  const [split, setSplit] = useState<TemporalSplit>({ ...DEFAULT_TEMPORAL_SPLIT })
  const [splitOpen, setSplitOpen] = useState(false)
  const [name, setName] = useState('Synthetic evaluation readiness')
  const [snapshots, setSnapshots] = useState<ModelReadinessSnapshot[]>([])
  const [registryFilters, setRegistryFilters] = useState<ModelRegistryFilters>({ ...DEFAULT_MODEL_REGISTRY_FILTERS })
  const [inspector, setInspector] = useState<ModelInspector | null>(null)
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [inspectedAt, setInspectedAt] = useState<string | null>(null)
  const tabsId = useId()
  const scope = { institution, range, asOf: fixtures._meta.data_as_of, currency, cohort }
  const currentContext = useMemo(() => buildModelContext(preview === 'empty' ? { ...fixtures, transactions: [], assessments: [] } : fixtures, preview === 'empty' ? [] : workspace.cases, preview === 'empty' ? [] : workspace.alerts, scope), [workspace.cases, workspace.alerts, institution, range, currency, cohort, preview])
  const visibleSnapshots = preview === 'empty' ? [] : snapshots.filter((snapshot) => snapshot.scope.institution === institution && snapshot.scope.range === range && snapshot.scope.currency === currency && snapshot.scope.cohort === cohort)
  const savedDataset = visibleSnapshots.find((snapshot) => snapshot.id === datasetId)
  const context = savedDataset?.manifest ?? currentContext
  const runs = preview === 'empty' ? [] : context.runs
  const candidate = MODEL_TEMPLATES.find((template) => template.id === candidateId) ?? MODEL_TEMPLATES[0]
  const approvedPolicies = policies.filter((policy) => policy.state === 'approved')
  const baseline = approvedPolicies.find((policy) => policy.id === baselineId) ?? approvedPolicies[0]
  const temporal = inspectTemporalSplit(context, split)
  const gates = modelReadinessGates(context, split)
  const metrics = unavailableModelMetrics(candidate.dimension)
  const templates = preview === 'empty' ? [] : filterModelTemplates(registryFilters)
  const hasRegistryFilters = Object.entries(registryFilters).some(([key, value]) => value !== DEFAULT_MODEL_REGISTRY_FILTERS[key as keyof ModelRegistryFilters])
  const pages = Math.max(1, Math.ceil(runs.length / 5)), currentPage = Math.min(page, pages)
  const visibleRuns = runs.slice((currentPage - 1) * 5, currentPage * 5)
  const inspectedTemplate = inspector?.kind === 'template' ? MODEL_TEMPLATES.find((template) => template.id === inspector.id) : undefined
  const inspectedSnapshot = inspector?.kind === 'snapshot' ? visibleSnapshots.find((snapshot) => snapshot.id === inspector.id) : undefined
  const pageRef = useMonitoringMotion(`models:${tab}:${institution}:${range}:${currency}:${cohort}:${preview}:${candidateId}:${baselineId}:${datasetId}:${JSON.stringify(registryFilters)}:${page}:${snapshots.length}:${splitOpen}`)
  useEffect(() => { setDatasetId('current'); setInspector(null); setPage(1); setError(''); setMessage(''); setInspectedAt(null) }, [institution, range, currency, cohort])
  useEffect(() => setPage(1), [datasetId])
  const captureSnapshot = async (event: FormEvent) => {
    event.preventDefault()
    if (busyRef.current || !baseline) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const snapshot = await createModelReadinessSnapshot(context, candidate.id, baseline, split, name, `DEMO-READY-${crypto.randomUUID()}`, new Date().toISOString())
      setSnapshots((current) => [snapshot, ...current]); setMessage('Readiness snapshot saved with frozen inputs and a manifest hash. Evaluation remains blocked; no metrics or labels were created.')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to capture the readiness snapshot.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const downloadSnapshot = (snapshot: ModelReadinessSnapshot) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${snapshot.id}.json`; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const changeSplit = (key: keyof TemporalSplit, value: string) => { setSplit((current) => ({ ...current, [key]: key === 'horizonDays' ? value === '' ? NaN : Number(value) : value })); setError('') }
  const manifestFields = <div className="key-grid"><KeyValue label="Dataset provenance" value="Synthetic portal fixtures · readiness only" /><KeyValue label="Frozen assessment runs" value={String(runs.length)} /><KeyValue label="Eligible mature labels" value="0 · all opinions remain unverified" /><KeyValue label="Availability grade" value={context.availabilityGrade} mono /><KeyValue label="Source watermark" value="Not supplied · snapshot time is not an ingestion watermark" /><KeyValue label="Feature snapshot / code version" value="Not supplied" /></div>
  const servingInspected = inspectedAt ? `Local inspection: ${inspectedAt}` : 'No local inspection recorded'
  return <div ref={pageRef} className="page records-page models-page">
    <PageHeader eyebrow="DETECTION / EVALUATION READINESS" title="Evaluation & Models" description="Trace the cohort, inspect label readiness and pin the evidence required before a model can be evaluated or served."><StatePreview value={preview} onChange={setPreview} /><Badge tone="planned">Planned capability</Badge></PageHeader>
    <div className="scope-strip model-scope"><span><Icon name="models" size={14} />Mode <strong>Readiness preview</strong></span><span>Source <strong>Synthetic fixture snapshot</strong></span><span>Evaluation <strong>Not executed</strong></span></div>
    <div className="kpi-grid records-summary" aria-label="Model readiness summary"><KpiCard label="Eligible mature labels" value="0" detail="Adjudication and maturity not supplied" icon="outcomes" tone="amber" onClick={() => navigate('/outcomes')} /><KpiCard label="Frozen assessment runs" value={String(preview === 'empty' ? 0 : currentContext.runs.length)} detail="Current institution, window and cohort" icon="assessments" tone="cyan" onClick={() => setTab('datasets')} /><KpiCard label="Verified artifacts supplied" value="0" detail="Templates are not registered models" icon="policies" tone="violet" onClick={() => setTab('registry')} /><KpiCard label="Serving readiness" value="—" detail="No loaded-model or deployment evidence" icon="health" tone="pink" onClick={() => setTab('serving')} /></div>
    <Panel className="records-filters"><div className="filter-bar model-scope-filters"><div className="records-field"><span>Institution</span><Select label="Model institution scope" value={institution} onChange={setInstitution}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All authorized institutions</option></Select></div><div className="records-field"><span>Fixture input window</span><Select label="Model input window" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div><div className="records-field"><span>Literal currency</span><Select label="Model currency filter" value={currency} onChange={setCurrency}><option value="all">All currencies · kept separate</option><option>SYN</option><option>USD</option><option>THB</option></Select></div><div className="records-field"><span>Assessed cohort</span><Select label="Evaluation cohort" value={cohort} onChange={(value) => setCohort(value as ModelScope['cohort'])}><option value="all">All assessed fixtures</option><option value="alert_linked">Linked to an alert</option><option value="without_alert">No linked alert</option></Select></div></div><div className="model-scope-note"><Icon name="clock" size={13} /><span>Fixture cutoff: 23 Oct 2026, 14:00 ICT. Product and production evaluation-mode metadata have not been supplied.</span></div></Panel>
    <div className="detail-tabs model-tabs" role="tablist" aria-label="Evaluation and model workspaces">{MODEL_TABS.map((item, index) => <button type="button" role="tab" id={`${tabsId}-${item.id}`} key={item.id} aria-controls={`${tabsId}-panel`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % MODEL_TABS.length : event.key === 'ArrowLeft' ? (index + MODEL_TABS.length - 1) % MODEL_TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? MODEL_TABS.length - 1 : -1; if (next < 0) return; event.preventDefault(); setTab(MODEL_TABS[next].id); event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus() }}><Icon name={item.icon} size={14} />{item.label}</button>)}</div>
    {message && <div className="notice success" role="status">{message}</div>}
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content model-content" id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
      {tab === 'comparison' && <>
        <div className="model-comparison-layout"><Panel><PanelHeader title="Prepare a reproducible comparison" subtitle="One frozen cohort for the baseline and candidate · no evaluation is dispatched" aside={<Badge tone="planned">Blocked</Badge>} /><form className="model-plan-form" onSubmit={captureSnapshot}>
          <div className="model-plan-selectors"><div className="records-field"><span>Baseline policy reference</span><Select label="Evaluation baseline policy" value={baseline?.id ?? ''} onChange={setBaselineId}>{!baseline && <option value="">No approved baseline supplied</option>}{approvedPolicies.map((policy) => <option key={policy.id} value={policy.id}>{policy.id} · v{policy.version} · {policy.currency}</option>)}</Select></div><div className="records-field"><span>Candidate template</span><Select label="Evaluation candidate template" value={candidateId} onChange={setCandidateId}>{MODEL_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</Select></div><div className="records-field model-wide-field"><span>Evaluation dataset</span><Select label="Evaluation dataset manifest" value={savedDataset?.id ?? 'current'} onChange={setDatasetId}><option value="current">Current scoped fixture cohort · {currentContext.runs.length} runs</option>{visibleSnapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.name} · {snapshot.manifest.runs.length} frozen runs</option>)}</Select></div></div>
          <div className="model-cohort-binding"><span className="model-link-symbol"><Icon name="network" size={20} /></span><div><strong>Same cohort, two references</strong><p>{runs.length} frozen runs · {context.scope.currency === 'all' ? 'literal currencies kept separate' : context.scope.currency} · {savedDataset ? 'saved manifest' : 'current scope'}</p></div><Badge>Readiness only</Badge></div>
          <button type="button" className="model-disclosure" aria-expanded={splitOpen} aria-controls={`${tabsId}-split`} onClick={() => setSplitOpen(!splitOpen)}><span><Icon name="clock" size={15} />Temporal split & label horizon</span><Badge tone={temporal.valid ? 'neutral' : 'pink'}>{temporal.valid ? 'Preview dates valid' : 'Fix dates'}</Badge><Icon name="chevron" size={14} /></button>
          {splitOpen && <div className="model-split-editor" id={`${tabsId}-split`}><p>Dates use UTC; end dates are inclusive. Gaps must cover the proposed label horizon. Local date validity does not establish governance approval or historical data availability.</p>{([{ label: 'Train', start: 'trainStart', end: 'trainEnd' }, { label: 'Validation', start: 'validationStart', end: 'validationEnd' }, { label: 'Test', start: 'testStart', end: 'testEnd' }] as const).map((window) => <div className="model-split-row" key={window.label}><strong>{window.label}</strong><label className="records-field"><span>Start · UTC</span><input type="date" required aria-label={`${window.label} start UTC`} value={split[window.start]} onChange={(event) => changeSplit(window.start, event.target.value)} /></label><label className="records-field"><span>End · UTC</span><input type="date" required aria-label={`${window.label} end UTC`} value={split[window.end]} onChange={(event) => changeSplit(window.end, event.target.value)} /></label></div>)}<label className="records-field"><span>Proposed label horizon · days</span><input type="number" min={0} max={365} step={1} required value={Number.isNaN(split.horizonDays) ? '' : split.horizonDays} onChange={(event) => changeSplit('horizonDays', event.target.value)} /></label></div>}
          <div className="model-split-counts"><span><b>{temporal.counts.train}</b>Train</span><span><b>{temporal.counts.validation}</b>Validation</span><span><b>{temporal.counts.test}</b>Test</span><span><b>{temporal.counts.excluded}</b>Outside split</span></div>
          {!temporal.valid && <div className="notice warning" role="alert">{temporal.errors.join(' ')}</div>}
          <label className="records-field"><span>Readiness snapshot name</span><input required minLength={3} maxLength={100} value={name} onChange={(event) => { setName(event.target.value); setError('') }} aria-invalid={!!error} aria-describedby={error ? `${tabsId}-save-error` : `${tabsId}-save-help`} /></label><small id={`${tabsId}-save-help`}>Save the current cohort, policy hash, split draft and blockers. This does not create labels, metrics or a trained model.</small>{error && <div className="notice warning" id={`${tabsId}-save-error`} role="alert">{error}</div>}
          <div className="model-plan-actions"><Button onClick={() => setInspector({ kind: 'template', id: candidate.id })}>Read model card<Icon name="arrow" size={13} /></Button><button type="submit" className="button primary" disabled={busy || !runs.length || !baseline}>{busy ? 'Saving snapshot…' : 'Save readiness snapshot'}<Icon name="assessments" size={14} /></button></div>
        </form></Panel><Panel className="model-gates-panel"><PanelHeader title="Evaluation prerequisites" subtitle="Specific missing evidence before a measured comparison" aside={<Badge tone="planned">Not ready</Badge>} /><ol className="model-gates">{gates.map((gate) => <li key={gate.id}><span className="model-gate-symbol"><Icon name={gate.status === 'preview_valid' ? 'check' : 'clock'} size={14} /></span><div><div className="model-gate-heading"><h3>{gate.title}</h3><Badge tone={gate.status === 'preview_valid' ? 'amber' : 'neutral'}>{gate.status.replace(/_/g, ' ')}</Badge></div><p>{gate.reason}</p>{gate.route && <button type="button" className="text-link" onClick={() => navigate(gate.route!)}>Inspect source workspace<Icon name="arrow" size={12} /></button>}</div></li>)}</ol><button type="button" className="button" disabled aria-describedby={`${tabsId}-run-reason`}>Run evaluation · planned</button><small id={`${tabsId}-run-reason`}>Requires eligible labels, approved split, historical features and pinned artifacts.</small></Panel></div>
        <Panel className="table-panel"><PanelHeader title="Evaluation metrics" subtitle="Unavailable values stay unavailable; neither indices nor fixture counts establish model accuracy" aside={<Badge tone={candidate.dimension}>{candidate.dimension.toUpperCase()}</Badge>} /><div className="model-dimension-tabs" aria-label="Metric dimension">{MODEL_DIMENSIONS.map((dimension) => <button type="button" key={dimension} aria-pressed={candidate.dimension === dimension} onClick={() => setCandidateId(MODEL_TEMPLATES.find((template) => template.dimension === dimension)!.id)}>{dimension.toUpperCase()}</button>)}</div><div className="table-scroll"><table className="model-metrics-table"><thead><tr><th>Metric</th><th>Baseline</th><th>Candidate</th><th>Measured denominator</th><th>Why unavailable</th></tr></thead><tbody>{metrics.map((metric) => <tr key={metric.id}><td><strong>{metric.label}</strong><small>{metric.dimension.toUpperCase()} · confidence interval unavailable</small></td><td><span className="model-unavailable" aria-label="Baseline unavailable">—</span></td><td><span className="model-unavailable" aria-label="Candidate unavailable">—</span></td><td><strong>—</strong><small>{metric.denominator}</small></td><td>{metric.reason}</td></tr>)}</tbody></table></div><div className="records-table-note"><Icon name="access" size={14} /><span>0 eligible mature labels. Unknown opinions, successful transactions and records without an alert do not become negative labels.</span></div></Panel>
        <Panel className="table-panel"><PanelHeader title="Readiness snapshots" subtitle="Frozen planning records · these are not completed evaluation runs" aside={<Badge>{visibleSnapshots.length} in scope</Badge>} /><div className="table-scroll"><table className="model-snapshot-table"><thead><tr><th>Snapshot</th><th>Candidate / baseline</th><th>Frozen cohort</th><th>Status</th><th>Inspect</th></tr></thead><tbody>{visibleSnapshots.length ? visibleSnapshots.map((snapshot) => <tr key={snapshot.id}><td><strong>{snapshot.name}</strong><small>{snapshot.at}</small></td><td><strong>{snapshot.candidate.name}</strong><small>{snapshot.baseline.id} · v{snapshot.baseline.version}</small></td><td>{snapshot.manifest.runs.length} runs<small>Same cohort for both references</small></td><td><Badge tone="planned">Blocked · readiness only</Badge></td><td><Button compact onClick={() => setInspector({ kind: 'snapshot', id: snapshot.id })}>Inspect<Icon name="arrow" size={13} /></Button></td></tr>) : <tr><td colSpan={5}><div className="empty-state"><Icon name="models" size={26} /><strong>No readiness snapshots in this scope</strong><span>Save a planning snapshot above to pin its manifest and prerequisites.</span></div></td></tr>}</tbody></table></div></Panel>
      </>}
      {tab === 'datasets' && <>
        <div className="model-dataset-layout"><Panel><PanelHeader title="Scoped fixture manifest" subtitle="Version references, coverage and label provenance" aside={<Badge tone="synthetic">Not training eligible</Badge>} />{manifestFields}<div className="model-actions"><Button onClick={() => setInspector({ kind: 'dataset' })}>Inspect manifest<Icon name="arrow" size={13} /></Button><Button onClick={() => setTab('comparison')}>Prepare split<Icon name="arrow" size={13} /></Button></div></Panel><Panel className="model-label-panel"><span className="model-feature-symbol"><Icon name="outcomes" size={25} /></span><h2>Opinions need governance</h2><p>{currentContext.recordedOpinions} related case opinions · {currentContext.unknownOpinions} unknown. These counts update from Cases; none is a production training label.</p><div className="key-grid"><KeyValue label="Adjudication" value="Not supplied" /><KeyValue label="Maturity policy" value="Not configured" /><KeyValue label="Sampling / QA" value="Not supplied" /><KeyValue label="Eligible export" value="Blocked" /></div><Button onClick={() => navigate('/outcomes')}>Inspect label readiness<Icon name="arrow" size={13} /></Button></Panel></div>
        <Panel className="table-panel"><PanelHeader title="Frozen input references" subtitle={`${runs.length} assessment runs · exact transaction revisions and original version lineage`} aside={<Badge>{currency === 'all' ? 'Currencies separate' : currency}</Badge>} /><div className="table-scroll"><table className="model-input-table"><thead><tr><th>Frozen assessment</th><th>Transaction / revision</th><th>Amount / currency</th><th>Policy / catalog / engine</th><th>Input fingerprint</th><th>Alert link</th></tr></thead><tbody>{visibleRuns.length ? visibleRuns.map((run) => <tr key={run.assessment.id}><td><button type="button" className="text-link data-id" onClick={() => navigate(`/assessments/${run.assessment.id}`)}>{run.assessment.id}</button><small>{run.assessment.institution_id}</small></td><td><strong className="data-id">{run.transaction.id}</strong><small>Revision {run.transaction.revision}</small></td><td className="exact-amount">{run.transaction.amount} {run.transaction.currency}</td><td><strong className="data-id">{run.assessment.policy_id}</strong><small>{run.assessment.catalog_version} · {run.assessment.engine_version}</small></td><td className="data-id">{run.assessment.input_fingerprint}</td><td>{run.alertIds.length ? run.alertIds.map((alertId) => <button type="button" className="text-link data-id" key={alertId} onClick={() => navigate(`/alerts/${alertId}`)}>{alertId}</button>) : <span className="muted">No linked alert · label unknown</span>}</td></tr>) : <tr><td colSpan={6}><div className="empty-state"><strong>No assessed fixtures match this cohort</strong><span>Change the institution, time window, currency or alert-link filter.</span></div></td></tr>}</tbody></table></div><div className="pagination"><span>{runs.length} frozen runs · page {currentPage} of {pages}</span><div><Button compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button compact disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div></Panel>
        <Panel className="table-panel"><PanelHeader title="Input coverage by dimension" subtitle="Availability of supplied frozen indices; this is not label coverage or measured model quality" /><div className="table-scroll"><table className="model-coverage-table"><thead><tr><th>Dimension</th><th>Frozen index available</th><th>Unavailable</th><th>Eligible labels</th><th>Evaluation readiness</th></tr></thead><tbody>{context.coverage.map((item) => <tr key={item.dimension}><td><Badge tone={item.dimension}>{item.dimension.toUpperCase()}</Badge></td><td>{preview === 'empty' ? 0 : item.available} / {runs.length}</td><td>{preview === 'empty' ? 0 : item.total - item.available}</td><td>0</td><td><Badge tone="planned">Blocked</Badge></td></tr>)}</tbody></table></div><div className="records-table-note"><Icon name="clock" size={14} /><span>Snapshot-only or unknown historical availability. Source row snapshots do not reconstruct when a feature was actually available.</span></div></Panel>
      </>}
      {tab === 'registry' && <>
        <Panel className="records-filters"><div className="filter-bar model-registry-filters"><div className="records-field"><span>Search templates</span><FilterSearch value={registryFilters.search} onChange={(search) => setRegistryFilters((current) => ({ ...current, search }))} placeholder="Model card name or template code" /></div><div className="records-field"><span>Dimension</span><Select label="Registry dimension" value={registryFilters.dimension} onChange={(dimension) => setRegistryFilters((current) => ({ ...current, dimension }))}><option value="all">All dimensions</option>{MODEL_DIMENSIONS.map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</Select></div><div className="records-field"><span>Registry status</span><Select label="Registry status" value={registryFilters.status} onChange={(status) => setRegistryFilters((current) => ({ ...current, status }))}><option value="all">All supplied entries</option><option value="template">Illustrative templates</option><option value="registered">Verified registered artifacts</option></Select></div><div className="records-field"><span>Model version</span><Select label="Registry model version" value={registryFilters.version} onChange={(version) => setRegistryFilters((current) => ({ ...current, version }))}><option value="all">All versions</option><option value="not_supplied">Not supplied</option><option value="pinned">Pinned artifact only</option></Select></div></div><div className="model-filter-footer"><span aria-live="polite">{templates.length} illustrative templates · 0 verified artifacts supplied</span><Button compact disabled={!hasRegistryFilters} onClick={() => setRegistryFilters({ ...DEFAULT_MODEL_REGISTRY_FILTERS })}>Clear filters</Button></div></Panel>
        {templates.length ? <div className="model-template-grid">{templates.map((template) => <Panel key={template.id} className={`model-template ${template.dimension}`}><div className="model-card-heading"><span className="model-template-symbol"><Icon name="models" size={22} /></span><Badge tone={template.dimension}>{template.dimension.toUpperCase()}</Badge></div><Badge tone="synthetic">Illustrative · not trained</Badge><h2>{template.name}</h2><p>{template.purpose}</p><div className="model-card-facts"><KeyValue label="Model version" value="Not supplied" /><KeyValue label="Artifact / signature hash" value="Not supplied" /><KeyValue label="Measured evaluation" value="Unavailable" /></div><div className="model-card-actions"><Button onClick={() => setInspector({ kind: 'template', id: template.id })}>Read model card<Icon name="arrow" size={13} /></Button><Button onClick={() => { setCandidateId(template.id); setTab('comparison') }}>Inspect prerequisites</Button></div></Panel>)}</div> : <Panel className="model-empty"><Icon name="models" size={28} /><h2>No supplied artifacts match these filters</h2><p>The portal contains illustrative model-card templates. No trained registry artifact or pinned model version has been supplied.</p><Button onClick={() => setRegistryFilters({ ...DEFAULT_MODEL_REGISTRY_FILTERS })}>Show illustrative templates</Button></Panel>}
        <div className="notice warning">Fifteen synthetic detectors are not a supervised model registry. Rules, anomaly and graph research can be developed separately; measured claims still require the appropriate evidence.</div>
      </>}
      {tab === 'serving' && <>
        <div className="model-serving-layout"><Panel><PanelHeader title="Model serving readiness" subtitle="Evidence status, independent from service process health" aside={<Badge tone="planned">Not verified</Badge>} /><div className="model-serving-status"><span className="model-serving-symbol"><Icon name="health" size={28} /></span><div><h2>No loaded-model evidence</h2><p>FastAPI diagnostics do not establish a loaded model, compatible input signature or measured inference readiness.</p></div></div><div className="key-grid"><KeyValue label="Pinned deployment" value="Not supplied" /><KeyValue label="Model version" value="Not supplied" /><KeyValue label="Feature availability" value="Unavailable" /><KeyValue label="Live observations" value="Not connected" /></div><div className="model-actions"><Button onClick={() => { setInspectedAt(new Date().toISOString()); setMessage('Local readiness evidence inspected. No live health request, deployment or inference was performed.') }}>Inspect local readiness<Icon name="clock" size={13} /></Button><Button onClick={() => navigate('/health')}>Open system health<Icon name="arrow" size={13} /></Button></div><p className="model-caption">{servingInspected} · this is not a successful serving probe.</p></Panel><Panel className="model-deployment-panel"><Badge tone="planned">Deployment · planned</Badge><h2>Pin, evaluate, approve, then serve</h2><ol><li>Approved artifact, input signature and code versions</li><li>Availability-aware features and evaluated label cohort</li><li>Governed champion / challenger or shadow review</li><li>Measured capacity, monitoring and rollback evidence</li></ol><div className="model-deployment-actions"><button type="button" className="button" disabled aria-describedby={`${tabsId}-deploy-reason`}>Approve model</button><button type="button" className="button primary" disabled aria-describedby={`${tabsId}-deploy-reason`}>Deploy model</button><button type="button" className="button" disabled aria-describedby={`${tabsId}-deploy-reason`}>Rollback model</button></div><small id={`${tabsId}-deploy-reason`}>Unavailable until pinned artifacts, evaluation evidence and deployment governance exist.</small></Panel></div>
        <Panel className="table-panel"><PanelHeader title="Serving evidence checklist" subtitle="Unavailable is not a healthy or zero-valued measurement" /><div className="table-scroll"><table className="model-serving-table"><thead><tr><th>Readiness check</th><th>Observed value</th><th>Status</th><th>Missing evidence</th></tr></thead><tbody>{MODEL_SERVING_CHECKS.map((check) => <tr key={check.id}><td><strong>{check.label}</strong></td><td><span className="model-unavailable" aria-label="Unavailable">—</span></td><td><Badge>Unavailable</Badge></td><td>{check.reason}</td></tr>)}</tbody></table></div></Panel><Panel className="model-empty"><Icon name="policies" size={28} /><h2>No pinned deployment history supplied</h2><p>There is no deployment, promotion, signature or rollback record to display. Local policy selection bindings do not deploy a trained model.</p><Button onClick={() => navigate('/policies')}>Inspect policy bindings<Icon name="arrow" size={13} /></Button></Panel>
      </>}
    </div>}
    <footer className="page-footer"><span>Readiness workspace · no measured model performance supplied</span><span>Planning snapshots reset on leaving this page or reloading</span></footer>
    {inspectedTemplate && <AlertModal title={inspectedTemplate.name} onClose={() => setInspector(null)}><div className="model-inspector"><div className="model-inspector-badges"><Badge tone="synthetic">Illustrative · not trained</Badge><Badge tone={inspectedTemplate.dimension}>{inspectedTemplate.dimension.toUpperCase()}</Badge></div><p>{inspectedTemplate.purpose}</p><div className="key-grid"><KeyValue label="Template code" value={inspectedTemplate.id} mono /><KeyValue label="Model / code version" value="Not supplied" /><KeyValue label="Artifact / signature hash" value="Not supplied" /><KeyValue label="Training dataset / split" value="Not supplied" /><KeyValue label="Calibration" value="Unavailable" /><KeyValue label="Approval / deployment" value="Not available" /></div><h3>Required inputs</h3><ul>{inspectedTemplate.inputs.map((input) => <li key={input}>{input}</li>)}</ul><div className="notice warning">{inspectedTemplate.limitation}</div><div className="alert-modal-footer"><Button onClick={() => setInspector(null)}>Close</Button><Button primary onClick={() => { setCandidateId(inspectedTemplate.id); setInspector(null); setTab('comparison') }}>Inspect prerequisites<Icon name="arrow" size={13} /></Button></div></div></AlertModal>}
    {inspector?.kind === 'dataset' && <AlertModal title="Evaluation dataset manifest" onClose={() => setInspector(null)}><div className="model-inspector"><Badge tone="synthetic">Synthetic · not training eligible</Badge>{manifestFields}<div className="key-grid"><KeyValue label="Fixture snapshot cutoff" value={context.scope.asOf} /><KeyValue label="Cohort / currency" value={`${context.scope.cohort} / ${context.scope.currency}`} /><KeyValue label="Baseline and candidate inputs" value="The same explicit frozen assessment revisions" /><KeyValue label="Saved manifest hash" value={savedDataset?.manifestHash ?? 'Not captured · save a readiness snapshot'} mono /></div><div className="notice warning">The snapshot cutoff is not proof of historical feature availability. No mature labels, approved sampling record or governed training export has been supplied.</div><div className="alert-modal-footer"><Button onClick={() => setInspector(null)}>Close</Button><Button onClick={() => { setInspector(null); setTab('comparison'); setSplitOpen(true) }}>Review temporal split<Icon name="arrow" size={13} /></Button></div></div></AlertModal>}
    {inspectedSnapshot && <AlertModal title="Frozen readiness snapshot" onClose={() => setInspector(null)}><div className="model-inspector"><div className="model-inspector-badges"><Badge tone="planned">Blocked · no evaluation executed</Badge><Badge tone="synthetic">Synthetic</Badge></div><p>{inspectedSnapshot.name}</p><div className="key-grid"><KeyValue label="Snapshot reference" value={inspectedSnapshot.id} mono /><KeyValue label="Recorded at" value={inspectedSnapshot.at} /><KeyValue label="Candidate template" value={inspectedSnapshot.candidate.id} mono /><KeyValue label="Baseline reference" value={`${inspectedSnapshot.baseline.id} · v${inspectedSnapshot.baseline.version}`} /><KeyValue label="Frozen runs" value={String(inspectedSnapshot.manifest.runs.length)} /><KeyValue label="Evaluation / production eligibility" value="Not executed / false" /><KeyValue label="Manifest SHA-256" value={inspectedSnapshot.manifestHash} mono /><KeyValue label="Frozen policy SHA-256" value={inspectedSnapshot.baseline.hash} mono /></div><div className="model-split-counts"><span><b>{inspectedSnapshot.temporal.counts.train}</b>Train</span><span><b>{inspectedSnapshot.temporal.counts.validation}</b>Validation</span><span><b>{inspectedSnapshot.temporal.counts.test}</b>Test</span><span><b>{inspectedSnapshot.temporal.counts.excluded}</b>Excluded</span></div><h3>Recorded prerequisites</h3><ul>{inspectedSnapshot.gates.map((gate) => <li key={gate.id}><strong>{gate.title}</strong> · {gate.reason}</li>)}</ul><div className="notice info">The downloaded JSON is a planning and provenance record. It contains synthetic inputs and blocked metrics; it is not a training-label or measured evaluation export.</div><div className="alert-modal-footer"><Button onClick={() => setInspector(null)}>Close</Button><Button primary onClick={() => downloadSnapshot(inspectedSnapshot)}>Download readiness JSON<Icon name="arrow" size={13} /></Button></div></div></AlertModal>}
  </div>
}

const ACCESS_TABS = [
  { id: 'mine', label: 'My access', icon: 'access' },
  { id: 'matrix', label: 'Role / scope matrix', icon: 'overview' },
  { id: 'institutions', label: 'Institution mapping', icon: 'network' },
  { id: 'readiness', label: 'Readiness prerequisites', icon: 'assessments' },
] as const
type AccessTab = typeof ACCESS_TABS[number]['id']

function AccessDeniedPage({ session, reason }: { session: AccessSession; reason: string }) {
  const persona = getAccessPersona(session)
  return <div className="page records-page access-page"><PageHeader eyebrow="WORKSPACE / ACCESS" title="Permission denied" description="The current demo context cannot open this workspace. No record details are shown."><Badge tone="synthetic">Demo authorization</Badge></PageHeader><Panel className="access-denied-panel"><span className="access-feature-icon"><Icon name="access" size={28} /></span><h2>Review your persona and scope</h2><p>{reason}</p><div className="key-grid"><KeyValue label="Demo persona" value={persona?.name ?? 'Unavailable'} /><KeyValue label="Selected institution" value={session.institution} /><KeyValue label="Demo session" value={session.status} /><KeyValue label="Access context" value={`v${session.version}`} /></div><Button primary onClick={() => navigate('/access')}>Open My access<Icon name="arrow" size={14} /></Button></Panel></div>
}

function AccessPage({ session, onPersonaChange, onInstitutionChange, onSessionStatusChange, onReset }: {
  session: AccessSession; onPersonaChange: (value: string) => void; onInstitutionChange: (value: string) => void
  onSessionStatusChange: (value: DemoSessionStatus) => void; onReset: () => void
}) {
  const [tab, setTab] = useState<AccessTab>('mine')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [matrixPersona, setMatrixPersona] = useState('all')
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('all')
  const [permissionState, setPermissionState] = useState('all')
  const [page, setPage] = useState(1)
  const [mappingFilter, setMappingFilter] = useState('all')
  const [prerequisiteGroup, setPrerequisiteGroup] = useState('all')
  const [probeCapability, setProbeCapability] = useState<AccessCapability>('case_assign')
  const [probeInstitution, setProbeInstitution] = useState(session.institution)
  const [probeResult, setProbeResult] = useState<{ allowed: boolean; reason: string } | null>(null)
  const [inspected, setInspected] = useState<{ personaId: string; capability: AccessCapability } | null>(null)
  const tabsId = useId()
  const persona = getAccessPersona(session)!
  const permitted = ACCESS_CAPABILITIES.filter((capability) => decideAccess(session, capability.id).allowed)
  const networkWide = decideAccess(session, 'network_wide', 'ALL').allowed
  const matrixPersonas = matrixPersona === 'all' ? ACCESS_PERSONAS : ACCESS_PERSONAS.filter((item) => item.id === matrixPersona)
  const capabilities = preview === 'empty' ? [] : ACCESS_CAPABILITIES.filter((capability) => `${capability.label} ${capability.id} ${capability.detail}`.toLowerCase().includes(search.trim().toLowerCase()) && (group === 'all' || capability.group === group) && (permissionState === 'all' || matrixPersonas.some((item) => capabilityState(item, capability.id) === permissionState)))
  const pageCount = Math.max(1, Math.ceil(capabilities.length / 8)), currentPage = Math.min(page, pageCount)
  const visibleCapabilities = capabilities.slice((currentPage - 1) * 8, currentPage * 8)
  const mappings = preview === 'empty' ? [] : fixtures.institutions.filter((item) => mappingFilter === 'all' || (mappingFilter === 'allowed' ? persona.institutions.includes(item.id) : !persona.institutions.includes(item.id)))
  const prerequisites = preview === 'empty' ? [] : ACCESS_PREREQUISITES.filter((item) => prerequisiteGroup === 'all' || item.group === prerequisiteGroup)
  const inspectedPersona = inspected ? ACCESS_PERSONAS.find((item) => item.id === inspected.personaId) : undefined
  const inspectedCapability = inspected ? ACCESS_CAPABILITIES.find((item) => item.id === inspected.capability) : undefined
  const pageRef = useMonitoringMotion(`access:${tab}:${session.version}:${preview}:${matrixPersona}:${search}:${group}:${permissionState}:${page}:${mappingFilter}:${prerequisiteGroup}`)
  useEffect(() => { setPage(1) }, [matrixPersona, search, group, permissionState])
  useEffect(() => { setProbeResult(null); setProbeInstitution(session.institution); setInspected(null) }, [session.version])
  const groups = [...new Set(ACCESS_CAPABILITIES.map((item) => item.group))]
  const clearMatrix = () => { setSearch(''); setGroup('all'); setPermissionState('all'); setMatrixPersona('all'); setPage(1) }
  const hasMatrixFilters = !!search || group !== 'all' || permissionState !== 'all' || matrixPersona !== 'all'
  return <div ref={pageRef} className="page records-page access-page">
    <PageHeader eyebrow="ADMINISTRATION / ACCESS CONTEXT" title="Access & Scope" description="Understand the current demo identity, inspect capability boundaries and see which institutions this persona may select."><StatePreview value={preview} onChange={setPreview} /><Badge tone="synthetic">Proposed demo contract</Badge></PageHeader>
    <div className="scope-strip access-scope"><span><Icon name="access" size={14} />Persona <strong>{persona.role}</strong></span><span>Institution <strong>{session.institution === 'ALL' ? 'All explicitly authorized institutions' : session.institution.replace('INST-DEMO-', 'Demo ')}</strong></span><span>Context <strong>v{session.version}</strong></span><Badge tone={session.status === 'active' ? 'success' : 'pink'}>Demo {session.status}</Badge></div>
    <div className="kpi-grid records-summary"><KpiCard label="Allowed demo institutions" value={String(persona.institutions.length)} detail="Explicit persona contract membership" icon="network" tone="amber" onClick={() => setTab('institutions')} /><KpiCard label="Available capabilities" value={String(permitted.length)} detail="Current demo session and scope" icon="check" tone="cyan" onClick={() => setTab('matrix')} /><KpiCard label="Network-wide scope" value={networkWide ? 'Available' : 'Restricted'} detail="Separate multi-institution capability" icon="access" tone="violet" onClick={() => setTab('institutions')} /><KpiCard label="Readiness prerequisites" value={String(ACCESS_PREREQUISITES.length)} detail="Production identity and scope evidence" icon="clock" tone="pink" onClick={() => setTab('readiness')} /></div>
    <Panel className="records-filters"><div className="access-demo-controls"><div className="records-field"><span>Demo persona</span><Select label="Workspace demo persona" value={session.personaId} onChange={onPersonaChange}>{ACCESS_PERSONAS.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</Select></div><div className="records-field"><span>Selected institution</span><Select label="Authorized institution filter" value={session.institution} onChange={onInstitutionChange}>{persona.institutions.map((value) => <option key={value} value={value}>{value.replace('INST-DEMO-', 'Demo Institution ')}</option>)}{allowsInstitution(session, 'ALL') && <option value="ALL">All authorized institutions</option>}</Select></div><div className="records-field"><span>Demo session scenario</span><Select label="Demo session scenario" value={session.status} onChange={(value) => onSessionStatusChange(value as DemoSessionStatus)}><option value="active">Active demo</option><option value="expired">Simulate expired session</option><option value="revoked">Simulate revoked session</option></Select></div><Button onClick={onReset}>Reset demo access</Button></div><p className="access-control-help">These controls change only the browser demo context. Persona switching updates route and action capabilities; it does not create users, roles or real grants.</p></Panel>
    <div className="detail-tabs access-tabs" role="tablist" aria-label="Access workspaces">{ACCESS_TABS.map((item, index) => <button type="button" role="tab" id={`${tabsId}-${item.id}`} key={item.id} aria-controls={`${tabsId}-panel`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % ACCESS_TABS.length : event.key === 'ArrowLeft' ? (index + ACCESS_TABS.length - 1) % ACCESS_TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? ACCESS_TABS.length - 1 : -1; if (next < 0) return; event.preventDefault(); setTab(ACCESS_TABS[next].id); event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus() }}><Icon name={item.icon} size={14} />{item.label}</button>)}</div>
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content access-content" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
      {tab === 'mine' && <>
        <div className="access-identity-layout"><Panel><PanelHeader title="My demo identity" subtitle="Root-owned mock context · no production authentication claims" aside={<Badge tone="synthetic">Demo identity</Badge>} /><div className="access-identity"><span className="access-persona-avatar">{persona.initials}</span><div><h2>{persona.name}</h2><p>{persona.role} · proposed persona</p></div><Badge tone={session.status === 'active' ? 'success' : 'pink'}>{session.status}</Badge></div><div className="key-grid"><KeyValue label="Demo subject" value={persona.subject} mono /><KeyValue label="Identity authority" value="Not connected · no IdP claims loaded" /><KeyValue label="Selected institution filter" value={session.institution} mono /><KeyValue label="Case action scope" value={persona.capabilities.includes('case_work') ? 'Assigned reviewer + institution + case state' : 'No case work capability'} /><KeyValue label="Network scope" value={networkWide ? 'Explicit A + B · bounded synthetic graph' : persona.capabilities.includes('read_network') ? 'One allowed institution · bounded graph' : 'No graph capability'} /><KeyValue label="Session expiry authority" value="Not configured · scenario is simulated" /></div><div className="access-membership"><span>Institutions in this demo contract</span><div>{persona.institutions.map((value) => <Badge key={value} tone="amber">{value.replace('INST-DEMO-', 'Demo ')}</Badge>)}</div></div></Panel><Panel className="access-boundary-panel"><span className="access-feature-icon"><Icon name="access" size={25} /></span><h2>Scope follows authority</h2><p>Navigation describes the product. The selected persona and its explicit institution permissions decide what this demo can open or change.</p><ol><li>Reads recheck the selected route and institution.</li><li>Mutations recheck the current actor and stored record ownership.</li><li>Case assignment, policy independence and version checks still apply.</li></ol><div className="notice warning">Browser guards demonstrate the contract. Production authorization must come from authenticated server context on every request.</div></Panel></div>
        <div className="access-probe-layout"><Panel><PanelHeader title="Inspect a capability decision" subtitle="Checks the proposed persona contract without executing a record action" /><div className="access-probe-controls"><div className="records-field"><span>Capability to inspect</span><Select label="Capability to inspect" value={probeCapability} onChange={(value) => { setProbeCapability(value as AccessCapability); setProbeResult(null) }}>{ACCESS_CAPABILITIES.map((capability) => <option key={capability.id} value={capability.id}>{capability.label}</option>)}</Select></div><div className="records-field"><span>Requested institution</span><Select label="Requested institution preview" value={probeInstitution} onChange={(value) => { setProbeInstitution(value); setProbeResult(null) }}><option value="INST-DEMO-A">Demo Institution A</option><option value="INST-DEMO-B">Demo Institution B</option><option value="ALL">All institutions</option></Select></div><Button primary onClick={() => setProbeResult(decideAccess(session, probeCapability, probeInstitution))}>Inspect decision<Icon name="arrow" size={13} /></Button></div>{probeResult && <div className={`notice ${probeResult.allowed ? 'info' : 'warning'}`} role="status"><span><strong>{probeResult.allowed ? 'Demo capability available' : 'Not permitted in this demo context'}</strong><span>{probeResult.reason}</span></span></div>}<p className="access-control-help">This preview asks whether the persona may select the requested scope. It does not change the current scope or bypass record state, ownership, assignment or version checks.</p></Panel><Panel><PanelHeader title="Session & directory evidence" subtitle="Availability of the identity integration, separate from demo state" /><div className="access-evidence-list"><div><span>Authenticated IdP subject</span><Badge>Not connected</Badge></div><div><span>Verified role claims</span><Badge>Not supplied</Badge></div><div><span>Entitlement directory</span><Badge>Unavailable</Badge></div><div><span>Server expiry / revocation</span><Badge tone="planned">Integration pending</Badge></div></div><Button onClick={() => setTab('readiness')}>Inspect prerequisites<Icon name="arrow" size={13} /></Button></Panel></div>
        <Panel><PanelHeader title="Demo context activity" subtitle="Local scenario changes only; this is not a protected IdP audit archive" /><div className="access-session-events">{session.events.length ? session.events.slice(-5).reverse().map((event) => <article key={event.id}><span className="access-event-icon"><Icon name="clock" size={14} /></span><div><strong>{event.action.replace(/_/g, ' ')}</strong><p>{event.detail}</p><small>{event.at} · {event.id}</small></div></article>) : <div className="empty-state"><strong>No demo access changes yet</strong><span>Persona, scope and session-scenario changes appear here.</span></div>}</div></Panel>
      </>}
      {tab === 'matrix' && <>
        <Panel className="records-filters"><div className="filter-bar access-matrix-filters"><div className="records-field"><span>Search capability</span><FilterSearch value={search} onChange={setSearch} placeholder="Action, capability or requirement" /></div><div className="records-field"><span>Role / persona</span><Select label="Matrix persona filter" value={matrixPersona} onChange={setMatrixPersona}><option value="all">Compare all demo personas</option>{ACCESS_PERSONAS.map((item) => <option key={item.id} value={item.id}>{item.role}</option>)}</Select></div><div className="records-field"><span>Capability group</span><Select label="Matrix capability group" value={group} onChange={setGroup}><option value="all">All groups</option>{groups.map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Contract state</span><Select label="Matrix permission state" value={permissionState} onChange={setPermissionState}><option value="all">All contract states</option><option value="granted">Granted in demo</option><option value="conditional">Conditional in demo</option><option value="denied">Denied in demo</option><option value="planned">Planned</option></Select></div></div><div className="access-filter-footer"><Button compact onClick={() => setMatrixPersona(persona.id)}>My persona</Button><Button compact disabled={!hasMatrixFilters} onClick={clearMatrix}>Clear filters</Button><span aria-live="polite">{capabilities.length} matching capability contracts</span></div></Panel>
        <Panel className="table-panel"><PanelHeader title="Proposed role / scope matrix" subtitle="Demo capability IDs are not production entitlement literals · select a decision to read its constraints" aside={<Badge tone="planned">Proposed</Badge>} /><div className="access-matrix-legend"><span><i className="granted" />Granted</span><span><i className="conditional" />Conditional</span><span><i className="denied" />Denied</span><span><i className="planned" />Planned</span></div><div className="table-scroll"><table className={`access-matrix-table ${matrixPersonas.length === 1 ? 'single-persona' : ''}`}><thead><tr><th>Capability contract</th>{matrixPersonas.map((item) => <th key={item.id}>{item.role}<small>{item.institutions.length} demo institution{item.institutions.length === 1 ? '' : 's'}</small></th>)}</tr></thead><tbody>{visibleCapabilities.length ? visibleCapabilities.map((capability) => <tr key={capability.id}><td><strong>{capability.label}</strong><small className="data-id">demo:{capability.id}</small><small>{capability.group}</small></td>{matrixPersonas.map((item) => { const state = capabilityState(item, capability.id); return <td key={item.id}><button type="button" className={`access-matrix-decision ${state}`} aria-label={`${item.role}: ${capability.label}, ${state}`} onClick={() => setInspected({ personaId: item.id, capability: capability.id })}><Icon name={state === 'granted' ? 'check' : state === 'conditional' || state === 'planned' ? 'clock' : 'access'} size={13} />{state}</button></td> })}</tr>) : <tr><td colSpan={matrixPersonas.length + 1}><div className="empty-state"><strong>No capabilities match these filters</strong><span>Change the persona, group, state or search.</span><Button compact onClick={clearMatrix}>Clear filters</Button></div></td></tr>}</tbody></table></div><div className="pagination"><span>{capabilities.length} contracts · page {currentPage} of {pageCount}</span><div><Button compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button compact disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div></Panel><div className="notice info">The matrix describes demo role capabilities. An expired or revoked session, a different institution, case assignment, self-approval or a stale version can still deny an action.</div>
      </>}
      {tab === 'institutions' && <>
        <Panel className="records-filters"><div className="access-mapping-controls"><div className="records-field"><span>Institution membership</span><Select label="Institution mapping filter" value={mappingFilter} onChange={setMappingFilter}><option value="all">All synthetic directory entries</option><option value="allowed">In my demo contract</option><option value="restricted">Outside my demo contract</option></Select></div><p>These synthetic entries describe the fixture directory. They do not expose transaction or account data from a restricted institution.</p></div></Panel><div className="access-mapping-layout"><Panel className="table-panel"><PanelHeader title="Institution mapping · proposed" subtitle="Allowed read scope, routing membership and account ownership are separate concepts" /><div className="table-scroll"><table className="access-institution-table"><thead><tr><th>Synthetic institution</th><th>Persona membership</th><th>Routing membership</th><th>Account-owner mapping</th><th>Selected filter</th></tr></thead><tbody>{mappings.length ? mappings.map((item) => { const allowed = persona.institutions.includes(item.id); return <tr key={item.id}><td><strong>{item.label}</strong><small className="data-id">{item.id}</small></td><td><Badge tone={allowed ? 'amber' : 'neutral'}>{allowed ? 'In demo contract' : 'Restricted'}</Badge></td><td><Badge>Unverified</Badge></td><td><Badge>Unresolved</Badge></td><td>{session.institution === item.id || session.institution === 'ALL' && allowed ? <Badge tone="violet">Selected</Badge> : <Button compact disabled={!allowed || session.status !== 'active'} onClick={() => onInstitutionChange(item.id)}>Use scope<Icon name="arrow" size={12} /></Button>}</td></tr> }) : <tr><td colSpan={5}><div className="empty-state"><strong>No synthetic mappings match</strong><span>Choose another membership filter.</span><Button compact onClick={() => setMappingFilter('all')}>Show all entries</Button></div></td></tr>}</tbody></table></div></Panel><Panel className="access-network-panel"><span className="access-feature-icon"><Icon name="network" size={25} /></span><h2>Network-wide scope is explicit</h2><p>{networkWide ? 'This demo Network Supervisor has explicit A + B membership and the separate network-wide capability.' : 'The current persona has no network-wide permission. Seeing both directory entries or all menu destinations does not grant it.'}</p><div className="key-grid"><KeyValue label="Owning institution" value="Verified ownership mapping not supplied" /><KeyValue label="Routing participant" value="Not an account ownership guarantee" /><KeyValue label="Stable account identity" value="Unresolved in the fixture source" /></div>{networkWide && <Button onClick={() => onInstitutionChange('ALL')}>Use authorized network scope<Icon name="arrow" size={13} /></Button>}</Panel></div>
      </>}
      {tab === 'readiness' && <>
        <Panel className="records-filters"><div className="access-mapping-controls"><div className="records-field"><span>Pending prerequisite</span><Select label="Access prerequisite group" value={prerequisiteGroup} onChange={setPrerequisiteGroup}><option value="all">All pending prerequisites</option>{[...new Set(ACCESS_PREREQUISITES.map((item) => item.group))].map((value) => <option key={value}>{value}</option>)}</Select></div><p>Local browser checks demonstrate expected behavior. Production identity and access acceptance requires evidence from the actual server and directory.</p></div></Panel><div className="access-readiness-layout"><Panel><PanelHeader title="Identity & authorization prerequisites" subtitle="No prerequisite is marked complete from prototype UI behavior" aside={<Badge tone="planned">Integration pending</Badge>} /><ol className="access-prerequisites">{prerequisites.map((item) => <li key={item.id}><span className="access-event-icon"><Icon name="clock" size={14} /></span><div><div className="access-prerequisite-title"><h3>{item.title}</h3><Badge>{item.status}</Badge></div><p>{item.reason}</p><small>{item.group}</small></div></li>)}{!prerequisites.length && <li><div className="empty-state"><strong>No prerequisite records in this preview</strong><span>Return to fixture data to inspect pending evidence.</span></div></li>}</ol></Panel><Panel className="access-provisioning-panel"><Badge tone="planned">IdP-managed changes · future</Badge><h2>Directory changes need an approved integration</h2><p>Real account provisioning, credentials and entitlement changes are not supplied by this prototype.</p><div className="access-planned-actions"><button type="button" className="button" disabled aria-describedby={`${tabsId}-directory-reason`}>Create user</button><button type="button" className="button" disabled aria-describedby={`${tabsId}-directory-reason`}>Reset password</button><button type="button" className="button primary" disabled aria-describedby={`${tabsId}-directory-reason`}>Change entitlements</button></div><small id={`${tabsId}-directory-reason`}>Requires approved IdP, entitlement directory, change governance and protected access audit.</small><Button onClick={() => navigate('/audit')}>Open authorized history<Icon name="arrow" size={13} /></Button></Panel></div>
      </>}
    </div>}
    <footer className="page-footer"><span>Proposed demo personas · production IdP and directory not connected</span><span>Demo access survives navigation · reload restores Analyst / Demo A</span></footer>
    {inspectedPersona && inspectedCapability && <AlertModal title="Demo capability contract" onClose={() => setInspected(null)}><div className="access-inspector"><div className="access-inspector-badges"><Badge tone="synthetic">Proposed demo contract</Badge><Badge>{capabilityState(inspectedPersona, inspectedCapability.id)}</Badge></div><div className="key-grid"><KeyValue label="Proposed persona" value={`${inspectedPersona.name} · ${inspectedPersona.role}`} /><KeyValue label="Demo capability" value={`demo:${inspectedCapability.id}`} mono /><KeyValue label="Institutions in contract" value={inspectedPersona.institutions.join(', ')} /><KeyValue label="Production entitlement mapping" value="Not supplied" /></div><h3>{inspectedCapability.label}</h3><p>{inspectedCapability.detail}</p><div className="notice warning">This is a capability contract, not an authorization decision for a specific record. The current session, stored ownership, assignment, independence and expected version must still be checked.</div><div className="alert-modal-footer"><Button onClick={() => setInspected(null)}>Close</Button></div></div></AlertModal>}
  </div>
}

const DATASET_TABS = [
  { id: 'batches', label: 'Batches' }, { id: 'profile', label: 'Profile & mapping' },
  { id: 'checkpoints', label: 'Import checkpoints' }, { id: 'reconciliation', label: 'Reconciliation' }, { id: 'replay', label: 'Offline replay' },
] as const
type DatasetTab = typeof DATASET_TABS[number]['id']

function DatasetsPage({ institution, setInstitution, range, setRange, workspace, accessSession, onAccessPersona, onCommand }: {
  institution: string; setInstitution: (value: string) => void; range: string; setRange: (value: string) => void
  workspace: DatasetWorkspace; accessSession: AccessSession; onAccessPersona: (value: string) => void; onCommand: (command: DatasetCommand) => void
}) {
  const [tab, setTab] = useState<DatasetTab>('batches')
  const [filters, setFilters] = useState<DatasetFilters>({ ...DEFAULT_DATASET_FILTERS })
  const [selectedId, setSelectedId] = useState('BATCH-OFF-001')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [fileBytes, setFileBytes] = useState('18000')
  const [declaredRows, setDeclaredRows] = useState('12')
  const [table, setTable] = useState<OfflineTable>('transfer')
  const [csv, setCsv] = useState(true)
  const [metadataSource, setMetadataSource] = useState('Invented file metadata')
  const [metadataResult, setMetadataResult] = useState<ReturnType<typeof validateOfflineMetadata> | null>(null)
  const [primaryCurrency, setPrimaryCurrency] = useState('LAK')
  const [threshold, setThreshold] = useState('1000000.00')
  const [usdThreshold, setUsdThreshold] = useState('')
  const [reportId, setReportId] = useState('REPLAY-OFF-001')
  const [reportPage, setReportPage] = useState(1)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [manifestOpen, setManifestOpen] = useState(false)
  const busyRef = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const tabsId = useId()
  const persona = getAccessPersona(accessSession)!
  const scope = { institution, range, asOf: fixtures._meta.data_as_of }
  const scoped = preview === 'empty' ? [] : selectOfflineBatches(workspace, scope)
  const batches = preview === 'empty' ? [] : selectOfflineBatches(workspace, scope, filters)
  const selected = scoped.find((batch) => batch.id === selectedId) ?? scoped[0]
  const counts = selected ? offlineBatchCounts(selected) : null
  const reports = selected ? workspace.replays.filter((report) => report.batchId === selected.id && report.institution === selected.institution) : []
  const report = reports.find((item) => item.id === reportId) ?? reports[reports.length - 1]
  const reportPages = Math.max(1, Math.ceil((report?.rows.length ?? 0) / 20)), currentReportPage = Math.min(reportPage, reportPages)
  const reportRows = report?.rows.slice((currentReportPage - 1) * 20, currentReportPage * 20) ?? []
  const canIntake = decideAccess(accessSession, 'simulate_intake').allowed
  const canImport = decideAccess(accessSession, 'simulate_import').allowed
  const canReplay = decideAccess(accessSession, 'simulate_replay').allowed
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== DEFAULT_DATASET_FILTERS[key as keyof DatasetFilters])
  const pageRef = useMonitoringMotion(`datasets:${tab}:${institution}:${range}:${workspace.version}:${selected?.id}:${JSON.stringify(filters)}:${preview}:${report?.id}:${reportPage}`)
  useEffect(() => { setSelectedId(''); setManifestOpen(false); setError(''); setMessage(''); setReportPage(1) }, [institution, range])
  useEffect(() => { setReportPage(1); setError(''); setConflict(false) }, [selected?.id, reportId])
  const chooseBatch = (value: string) => { setSelectedId(value); setReportId(''); setManifestOpen(false); setMessage(''); setError('') }
  const execute = (action: { kind: 'add_demo_batch'; table: OfflineTable } | { kind: 'advance_import'; batchId: string; expectedProcessed: number } | { kind: 'reconcile'; batchId: string } | { kind: 'replay'; batchId: string; thresholds: { currency: string; amount: string }[] }) => {
    if (busyRef.current) return
    busyRef.current = true; setError(''); setConflict(false)
    const requestId = crypto.randomUUID()
    try {
      onCommand({ ...action, actor: persona.subject, institution, expectedVersion: workspace.version, requestId, at: new Date().toISOString() })
      setMessage(action.kind === 'add_demo_batch' ? 'Invented 12-row sample metadata added. No selected file was read or imported.' : action.kind === 'advance_import' ? 'One local demo checkpoint committed. Resume continues after the committed ordinal.' : action.kind === 'reconcile' ? 'Demo count reconciliation inspected. Check the recorded counts and conflict status below.' : 'Raw-amount simulation recorded using invented fixtures. No operational record or alert was created.')
      if (action.kind === 'add_demo_batch') { setSelectedId(`BATCH-DEMO-${workspace.version + 1}`); setTab('checkpoints') }
      if (action.kind === 'replay') { setReportId(`REPLAY-${requestId}`); setReportPage(1) }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to apply the local demo action.'); setConflict(failure instanceof DatasetError && failure.code === 'conflict') }
    finally { busyRef.current = false }
  }
  const checkMetadata = () => setMetadataResult(validateOfflineMetadata({ bytes: Number(fileBytes), rows: Number(declaredRows), table, csv }))
  const formatBytes = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MiB` : `${bytes.toLocaleString('en-US')} bytes`
  const sourceFields = selected?.table === 'member' ? [
    { source: 'code / iin', target: 'Routing participant candidate', state: 'Unverified', detail: 'Not proof of account ownership.' },
    { source: 'member metadata', target: 'Reference lookup only', state: 'Not a payment', detail: 'No amount replay or verified account entity is inferred.' },
  ] : [
    { source: 'id + requesttime', target: 'Composite source-row candidate', state: 'Draft', detail: 'Not a global transaction or account identity.' },
    { source: 'reference', target: 'Business reference candidate', state: 'Unverified', detail: 'Retry, reuse and institution semantics require confirmation.' },
    { source: 'amount / ccy', target: 'Literal decimal / currency', state: 'Draft', detail: 'Exact recorded values; no FX, lifecycle or reversal interpretation.' },
    { source: 'fromaccount / toaccount', target: 'Unresolved display references', state: 'Unresolved', detail: 'Masking, stability and verified identity are not established.' },
    { source: 'frommember / tomember', target: 'Routing participants', state: 'Unverified', detail: 'Routing membership is separate from the account-owning institution.' },
    { source: 'result / reversal / time fields', target: 'Semantics withheld', state: 'Not approved', detail: 'No lifecycle, reversal or timezone inference from raw codes.' },
  ]
  return <div ref={pageRef} className="page records-page datasets-page">
    <PageHeader eyebrow="DATA & OPERATIONS / OFFLINE STAGING" title="Datasets & Imports" description="Inspect private-intake metadata, committed checkpoints and reconciliation before a bounded offline simulation."><StatePreview value={preview} onChange={setPreview} /><Badge tone="synthetic">Invented fixtures</Badge></PageHeader>
    <div className="scope-strip dataset-scope"><span><Icon name="datasets" size={14} />Boundary <strong>Offline staging</strong></span><span>Access partition <strong>{institution === 'ALL' ? 'Authorized A + B' : institution.replace('INST-DEMO-', 'Demo ')}</strong></span><span>API <strong>Browser writes not connected</strong></span></div>
    <RecordsSummary items={[
      { label: 'Offline batches', value: scoped.length, detail: 'Synthetic metadata in the selected scope', tone: 'amber', icon: 'datasets' },
      { label: 'Need checkpoint work', value: scoped.filter((batch) => batch.state !== 'complete').length, detail: 'Resume from committed row ordinals', tone: 'pink', icon: 'clock' },
      { label: 'Demo counts reconciled', value: scoped.filter((batch) => batch.reconciled).length, detail: 'Separate from source semantics approval', tone: 'cyan', icon: 'check' },
      { label: 'Canonical publications', value: 0, detail: 'Staging never becomes a live transaction here', tone: 'violet', icon: 'access' },
    ]} />
    <Panel className="records-filters"><div className="dataset-session-controls"><div className="records-field"><span>Demo persona</span><Select label="Offline workflow persona" value={accessSession.personaId} onChange={onAccessPersona}>{!['operator', 'auditor'].includes(persona.id) && <option value={persona.id}>{persona.name} · read-only</option>}{ACCESS_PERSONAS.filter((item) => ['operator', 'auditor'].includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</Select></div><div className="records-field"><span>Authorized access partition</span><Select label="Dataset institution scope" value={institution} onChange={setInstitution}>{persona.institutions.map((value) => <option key={value} value={value}>{value.replace('INST-DEMO-', 'Demo Institution ')}</option>)}{allowsInstitution(accessSession, 'ALL') && <option value="ALL">All authorized institutions</option>}</Select></div><div className="records-field"><span>Batch update window</span><Select label="Dataset update window" value={range} onChange={setRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div><p>Use the Demo data operator for local simulations. Access partitions are invented metadata, not verified routing or account ownership.</p></div></Panel>
    <div className="detail-tabs dataset-tabs" role="tablist" aria-label="Dataset workspaces">{DATASET_TABS.map((item, index) => <button type="button" role="tab" id={`${tabsId}-${item.id}`} key={item.id} aria-selected={tab === item.id} aria-controls={`${tabsId}-panel`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % DATASET_TABS.length : event.key === 'ArrowLeft' ? (index + DATASET_TABS.length - 1) % DATASET_TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? DATASET_TABS.length - 1 : -1; if (next < 0) return; event.preventDefault(); setTab(DATASET_TABS[next].id); event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus() }}>{item.label}</button>)}</div>
    {message && <div className="notice success" role="status">{message}</div>}{error && <div className="notice warning" role="alert">{error}{conflict && <Button compact onClick={() => { setError(''); setConflict(false); setMessage('Latest demo workspace is shown. Review the checkpoint and retry explicitly.') }}>Refresh latest state</Button>}</div>}
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content dataset-content" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
      {tab === 'batches' ? <>
        <Panel className="dataset-workflow"><div><Badge tone="planned">Guided CLI workflow · demo UI</Badge><h2>Profile. Stage. Reconcile. Simulate.</h2><p>Manual export and offline handoff remain the documented intake path. A real export location, source connection and browser import adapter have not been supplied.</p></div><div className="dataset-workflow-limits"><strong>64 MiB<span>per file</span></strong><strong>100,000<span>records per file</span></strong><Button onClick={() => setTab('profile')}>Inspect intake limits<Icon name="arrow" size={13} /></Button></div></Panel>
        <Panel className="records-filters"><div className="filter-bar dataset-batch-filters"><div className="records-field"><span>Search batch</span><FilterSearch value={filters.search} onChange={(search) => setFilters((current) => ({ ...current, search }))} placeholder="Batch, fingerprint or mapping reference" /></div><div className="records-field"><span>Source table</span><Select label="Batch table filter" value={filters.table} onChange={(table) => setFilters((current) => ({ ...current, table }))}><option value="all">All source tables</option>{OFFLINE_TABLES.map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Stage / status</span><Select label="Batch status filter" value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))}><option value="all">All stages</option><option value="profiled">Profiled</option><option value="paused">Paused at checkpoint</option><option value="complete">Import complete</option><option value="reconciled">Demo counts reconciled</option></Select></div><div className="records-field"><span>Literal currency fixture</span><Select label="Offline currency filter" value={filters.currency} onChange={(currency) => setFilters((current) => ({ ...current, currency }))}><option value="all">All fixture kinds</option><option>LAK</option><option>USD</option><option>THB</option></Select></div><Button compact disabled={!hasFilters} onClick={() => setFilters({ ...DEFAULT_DATASET_FILTERS })}>Clear filters</Button></div></Panel>
        <Panel className="table-panel"><PanelHeader title="Offline batch metadata" subtitle="Opaque references and aggregate counts only · no original paths or account payloads" aside={<Badge>{batches.length} batches</Badge>} /><div className="table-scroll"><table className="dataset-batch-table"><thead><tr><th>Batch / fingerprint</th><th>Source table</th><th>Declared rows / bytes</th><th>Import stage</th><th>Reconciliation</th><th>Privacy</th><th>Inspect</th></tr></thead><tbody>{batches.length ? batches.map((batch) => <tr key={batch.id}><td><button type="button" className="dataset-name data-id" onClick={() => { chooseBatch(batch.id); setTab('profile') }}>{batch.id}</button><small>{batch.fingerprint}</small></td><td>{batch.table}<small>{batch.institution}</small></td><td>{batch.rows.toLocaleString('en-US')} rows<small>{formatBytes(batch.bytes)}</small></td><td><Badge tone={batch.state === 'paused' ? 'amber' : batch.state === 'complete' ? 'cyan' : 'neutral'}>{batch.state}</Badge><small>{batch.processed} / {batch.rows} processed</small></td><td><Badge tone={batch.reconciled ? 'cyan' : 'neutral'}>{batch.reconciled ? 'Demo counts matched' : 'Pending / attention'}</Badge></td><td><Badge>Metadata only</Badge></td><td><Button compact onClick={() => { chooseBatch(batch.id); setTab('checkpoints') }}>Inspect<Icon name="arrow" size={13} /></Button></td></tr>) : <tr><td colSpan={7}><div className="empty-state"><strong>No offline batches match this scope</strong><span>Adjust the table, status, currency or access partition.</span><Button compact onClick={() => setFilters({ ...DEFAULT_DATASET_FILTERS })}>Clear filters</Button></div></td></tr>}</tbody></table></div></Panel>
      </> : <>
        <Panel className="dataset-context"><div className="records-field"><span>Scoped offline batch</span><Select label="Selected offline batch" value={selected?.id ?? ''} onChange={chooseBatch}>{!selected && <option value="">No batch in scope</option>}{scoped.map((batch) => <option key={batch.id} value={batch.id}>{batch.id} · {batch.table} · {batch.state}</option>)}</Select></div>{selected && <><Badge tone={selected.reconciled ? 'cyan' : 'neutral'}>{selected.reconciled ? 'Demo counts reconciled' : selected.state}</Badge><Button compact onClick={() => setManifestOpen(true)}>Inspect manifest<Icon name="arrow" size={13} /></Button></>}</Panel>
        {tab === 'profile' && <>
          <div className="dataset-profile-layout"><Panel><PanelHeader title="Intake metadata & limits" subtitle="The picker reads size and extension only; file contents and original names are not retained" aside={<Badge>Not uploaded</Badge>} /><div className="dataset-metadata-form"><input ref={fileInput} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Select local CSV metadata only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileBytes(String(file.size)); setCsv(file.name.toLowerCase().endsWith('.csv')); setMetadataSource('Selected local file · metadata only'); setMetadataResult(null) } event.target.value = '' }} /><div className="dataset-picker"><span className="dataset-feature-icon"><Icon name="datasets" size={24} /></span><div><strong>{metadataSource}</strong><p>No private CSV content is read, uploaded or staged by this page.</p></div><Button onClick={() => fileInput.current?.click()}>Choose metadata</Button></div><div className="dataset-form-grid"><div className="records-field"><span>Candidate source table</span><Select label="Intake source table" value={table} onChange={(value) => { setTable(value as OfflineTable); setMetadataResult(null) }}>{OFFLINE_TABLES.map((value) => <option key={value}>{value}</option>)}</Select></div><label className="records-field"><span>Declared record count · unverified</span><input type="number" min={1} step={1} value={declaredRows} onChange={(event) => { setDeclaredRows(event.target.value); setMetadataResult(null) }} /></label><label className="records-field"><span>Metadata size · bytes</span><input type="number" min={1} step={1} value={fileBytes} readOnly={metadataSource.startsWith('Selected')} onChange={(event) => { setFileBytes(event.target.value); setMetadataResult(null) }} /></label><KeyValue label="Current documented bounds" value={`${formatBytes(OFFLINE_FILE_LIMIT)} / ${OFFLINE_ROW_LIMIT.toLocaleString('en-US')} records`} /></div><div className="dataset-actions"><Button onClick={checkMetadata}>Validate metadata</Button><Button onClick={() => { setMetadataSource('Invented 2 GB oversize scenario'); setFileBytes(String(2 * 1024 * 1024 * 1024)); setDeclaredRows('150000'); setCsv(true); setMetadataResult(validateOfflineMetadata({ bytes: 2 * 1024 * 1024 * 1024, rows: 150000, table, csv: true })) }}>Try 2 GB rejection</Button><Button onClick={() => { setMetadataSource('Invented file metadata'); setFileBytes('18000'); setDeclaredRows('12'); setCsv(true); setMetadataResult(null) }}>Reset metadata</Button></div>{metadataResult && <div className={`notice ${metadataResult.valid ? 'info' : 'warning'}`} role="status">{metadataResult.valid ? 'Declared metadata is within the documented bounds. Content, row count and schema have not been verified or imported.' : metadataResult.errors.join(' ')}</div>}<div className="dataset-actions"><Button primary disabled={!canIntake || metadataSource !== 'Invented file metadata' || Number(fileBytes) !== 18000 || Number(declaredRows) !== 12 || !csv} onClick={() => execute({ kind: 'add_demo_batch', table })}>Add invented 12-row sample<Icon name="arrow" size={13} /></Button><button type="button" className="button" disabled aria-describedby={`${tabsId}-real-import`}>Import selected file · planned</button></div><small id={`${tabsId}-real-import`}>Reset metadata to the known 18,000-byte / 12-row invented sample before adding it. Real upload/import needs an approved API adapter.</small></div></Panel><Panel className="dataset-privacy-panel"><span className="dataset-feature-icon"><Icon name="access" size={25} /></span><h2>Staging stays private</h2><p>Only invented metadata, aggregate counts and opaque simulation references are shown. Raw staging is not available to transactions, reviewers, outbox or graph views.</p><div className="key-grid"><KeyValue label="Real source / export path" value="Not supplied" /><KeyValue label="Browser write API" value="Not verified" /><KeyValue label="Account identity / semantics" value="Unresolved" /><KeyValue label="Canonical publication" value="Not performed" /></div></Panel></div>
          {selected && <Panel className="table-panel"><PanelHeader title="Draft source mapping" subtitle={`${selected.mappingVersion} · illustrative mapping contract, not approved source semantics`} aside={<Badge tone="planned">Draft</Badge>} /><div className="table-scroll"><table className="dataset-mapping-table"><thead><tr><th>Source candidates</th><th>Proposed interpretation</th><th>Readiness</th><th>Limitation</th></tr></thead><tbody>{sourceFields.map((field) => <tr key={field.source}><td className="data-id">{field.source}</td><td>{field.target}</td><td><Badge>{field.state}</Badge></td><td>{field.detail}</td></tr>)}</tbody></table></div><div className="records-table-note"><Icon name="access" size={14} /><span>No account values or original source records are shown. A successful staging import does not approve this mapping or publish payments.</span></div></Panel>}
        </>}
        {tab === 'checkpoints' && selected && <>
          <Panel><PanelHeader title="Committed import checkpoints" subtitle="Local demo of documented 500-row checkpoint behavior · no browser import API is called" aside={<Badge tone="synthetic">Simulation</Badge>} /><div className="dataset-progress"><div><strong>{selected.processed.toLocaleString('en-US')} / {selected.rows.toLocaleString('en-US')} rows</strong><span>{selected.attempts} demo attempts · checkpoint bound {OFFLINE_CHECKPOINT_SIZE}</span></div><progress value={selected.processed} max={selected.rows} aria-label="Demo processed row count" /></div><div className="key-grid"><KeyValue label="Next row ordinal" value={selected.processed === selected.rows ? 'All rows processed' : String(selected.processed + 1)} /><KeyValue label="Unique inserted rows" value={String(selected.inserted)} /><KeyValue label="Known duplicate rows" value={String(selected.duplicates)} /><KeyValue label="Conflicting rows" value={String(selected.conflicts)} /></div><div className="dataset-actions"><Button primary disabled={!canImport || selected.state === 'complete'} onClick={() => execute({ kind: 'advance_import', batchId: selected.id, expectedProcessed: selected.processed })}>{selected.processed ? 'Resume next demo checkpoint' : 'Start demo checkpoint'}<Icon name="arrow" size={13} /></Button><Button onClick={() => setTab('reconciliation')}>Inspect reconciliation<Icon name="arrow" size={13} /></Button></div><p className="dataset-help">Resume starts after the last committed ordinal. Retrying a stale ordinal is rejected; it never silently reuploads or inserts a committed checkpoint again.</p></Panel><Panel className="table-panel"><PanelHeader title="Attempt & checkpoint history" subtitle="Opaque manifest binding and aggregate row counts" /><div className="table-scroll"><table className="dataset-checkpoint-table"><thead><tr><th>Attempt</th><th>Source ordinals</th><th>Processed in checkpoint</th><th>Inserted unique rows</th><th>Commit time</th><th>State</th></tr></thead><tbody>{selected.checkpoints.length ? selected.checkpoints.map((checkpoint) => <tr key={`${checkpoint.attempt}:${checkpoint.from}`}><td>#{checkpoint.attempt}</td><td>{checkpoint.from}–{checkpoint.to}</td><td>{checkpoint.to - checkpoint.from + 1}</td><td>{checkpoint.inserted}</td><td>{checkpoint.at}</td><td><Badge tone="cyan">Demo committed</Badge></td></tr>) : <tr><td colSpan={6}><div className="empty-state"><strong>No committed checkpoint yet</strong><span>The Data Operator can advance this invented sample locally.</span></div></td></tr>}</tbody></table></div></Panel>
        </>}
        {tab === 'reconciliation' && selected && counts && <>
          <Panel><PanelHeader title="Count reconciliation" subtitle="Expected source rows versus inserted, duplicate and conflicting metadata counts" aside={<Badge tone={selected.reconciled ? 'cyan' : 'amber'}>{selected.reconciled ? 'Demo counts matched' : 'Pending / attention'}</Badge>} /><div className="dataset-reconciliation-grid"><KeyValue label="Expected source rows" value={String(counts.expected)} /><KeyValue label="Processed ordinals" value={String(counts.processed)} /><KeyValue label="Unique inserted rows" value={String(counts.inserted)} /><KeyValue label="Duplicates accounted" value={String(counts.duplicates)} /><KeyValue label="Conflicts requiring review" value={String(counts.conflicts)} /><KeyValue label="Unaccounted source rows" value={String(counts.expected - counts.accounted)} /></div><div className={`notice ${selected.reconciled ? 'info' : 'warning'}`}>{!counts.complete ? 'Checkpoint processing is incomplete. Resume from the last committed ordinal before reconciliation.' : counts.conflicts ? 'Conflicts remain. Matching the source row count does not resolve conflicting records.' : selected.reconciled ? 'Demo counts are reconciled. Monetary totals, source semantics and publication eligibility remain separate checks.' : 'Checkpoint counts are complete. The Data Operator can record a local reconciliation result.'}</div><div className="dataset-actions"><Button primary disabled={!canImport || selected.state !== 'complete'} onClick={() => execute({ kind: 'reconcile', batchId: selected.id })}>Inspect demo reconciliation</Button><Button onClick={() => setTab('checkpoints')}>Open checkpoints<Icon name="arrow" size={13} /></Button><Button disabled={!selected.reconciled} onClick={() => setTab('replay')}>Open offline replay<Icon name="arrow" size={13} /></Button></div><div className="key-grid"><KeyValue label="Reconciliation recorded" value={selected.reconciliationAt ?? 'Not recorded'} /><KeyValue label="File content hash / money reconciliation" value="Not supplied · opaque demo fingerprint only" /></div></Panel><Panel><PanelHeader title="Publication boundary" subtitle="A reconciled staging batch is not a canonical risk transaction" /><div className="dataset-publication-boundary"><Badge>Offline staging</Badge><span>Separate workflow</span><Badge>Canonical transactions / risk jobs / alerts</Badge></div><p className="dataset-help">No source lifecycle, reversal, account ownership or event timezone is inferred. There is no live risk job or operational alert side effect.</p></Panel>
        </>}
        {tab === 'replay' && selected && <>
          <Panel><PanelHeader title="Offline raw-amount replay" subtitle="Invented amount fixtures only · explicit literal-currency thresholds" aside={<Badge tone="synthetic">Simulation</Badge>} /><form className="dataset-replay-form" onSubmit={(event) => { event.preventDefault(); execute({ kind: 'replay', batchId: selected.id, thresholds: [{ currency: primaryCurrency, amount: threshold }, ...(usdThreshold.trim() ? [{ currency: 'USD', amount: usdThreshold }] : [])] }) }}><div className="dataset-replay-controls"><div className="records-field"><span>Primary literal currency</span><Select label="Offline simulation currency" value={primaryCurrency} onChange={setPrimaryCurrency}><option>LAK</option><option>USD</option><option>THB</option></Select></div><label className="records-field"><span>Exact raw-amount threshold</span><input required inputMode="decimal" value={threshold} onChange={(event) => setThreshold(event.target.value)} /></label><label className="records-field"><span>Optional USD threshold</span><input inputMode="decimal" value={usdThreshold} onChange={(event) => setUsdThreshold(event.target.value)} placeholder="Unconfigured when blank" /></label><button type="submit" className="button primary" disabled={!canReplay || !selected.reconciled}>Run demo replay<Icon name="arrow" size={13} /></button></div><p className="dataset-help">Requires complete reconciled demo staging. Member data and unconfigured currencies return Unavailable. This preview neither loads real raw staging nor calls a private CLI/API.</p></form>{!selected.reconciled && <div className="notice warning">Finish checkpoints and reconciliation before replay. No simulation is run on partial staging.</div>}<div className="notice info">Matched is a raw-amount threshold result. Not matched does not mean safe. No Fraud/Mule/AML score, verified account graph, notification or payment action is created.</div></Panel>
          {report ? <Panel className="table-panel"><PanelHeader title={report.sample ? 'Supplied report excerpt' : 'Frozen demo replay report'} subtitle={`${report.id} · ${report.at}`} aside={<Badge tone={report.sample ? 'planned' : 'synthetic'}>{report.sample ? '3 example rows supplied' : 'Invented simulation'}</Badge>} /><div className="dataset-report-meta"><KeyValue label="Frozen manifest / mapping" value={`${report.fingerprint} / ${report.mappingVersion}`} /><KeyValue label="Simulation thresholds" value={report.thresholds.map((item) => `${item.currency} ≥ ${item.amount}`).join(' · ')} /><KeyValue label="Result coverage" value={`${report.rows.length} supplied result rows / ${report.batchRows} source rows${report.sample ? ' · excerpt only' : report.excludedRows ? ` · ${report.excludedRows} duplicates excluded` : ''}`} /><KeyValue label="Operational effects" value="0 canonical transactions · 0 alerts" /></div><div className="dataset-result-counts"><span><b>{report.counts.matched}</b>Matched</span><span><b>{report.counts.not_matched}</b>Not matched</span><span><b>{report.counts.unavailable}</b>Unavailable</span><span><b>{report.rows.length}</b>Supplied results</span></div><div className="dataset-report-selector"><span>Read a report</span><Select label="Offline replay report" value={report.id} onChange={setReportId}>{reports.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.sample ? 'Fixture excerpt' : 'Local demo'}</option>)}</Select></div><div className="table-scroll"><table className="dataset-result-table"><thead><tr><th>Opaque staging row</th><th>Simulation result</th><th>Reason / limitation</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.rowRef}><td className="data-id">{row.rowRef}</td><td><Badge tone={row.result === 'matched' ? 'amber' : row.result === 'unavailable' ? 'neutral' : 'violet'}>{row.result.replace(/_/g, ' ')}</Badge></td><td>{row.reason}</td></tr>)}</tbody></table></div><div className="pagination"><span>{report.rows.length} opaque results · page {currentReportPage} of {reportPages}</span><div><Button compact disabled={currentReportPage <= 1} onClick={() => setReportPage(currentReportPage - 1)}>Previous</Button><Button compact disabled={currentReportPage >= reportPages} onClick={() => setReportPage(currentReportPage + 1)}>Next</Button></div></div>{report.totals.length > 0 && <div className="dataset-exact-totals"><h3>Invented recorded totals · kept separate by currency</h3>{report.totals.map((total) => <div key={total.currency}><span>{total.currency} · {total.rows} valid amount rows</span><strong className="data-id">{total.amount}</strong></div>)}<small>Aggregate invented inputs only; not matched totals, balances, recovered money or verified lifecycle amounts.</small></div>}</Panel> : <Panel className="dataset-empty"><Icon name="models" size={28} /><h2>No replay report supplied for this batch</h2><p>The Demo data operator can run a bounded local simulation after count reconciliation. Member rows remain unavailable.</p></Panel>}
        </>}
        {!selected && tab !== 'profile' && <AsyncState state="empty" />}
      </>}
    </div>}
    <footer className="page-footer"><span>Offline staging ≠ canonical risk data · raw source payloads unavailable</span><span>Local demo metadata survives navigation · reload resets fixtures</span></footer>
    {manifestOpen && selected && <AlertModal title="Offline batch manifest metadata" onClose={() => setManifestOpen(false)}><div className="dataset-manifest-inspector"><Badge tone="synthetic">Invented metadata · no raw rows</Badge><div className="key-grid"><KeyValue label="Batch reference" value={selected.id} mono /><KeyValue label="Access partition" value={selected.institution} /><KeyValue label="Candidate table" value={selected.table} /><KeyValue label="Declared rows / size" value={`${selected.rows} / ${formatBytes(selected.bytes)}`} /><KeyValue label="Opaque demo fingerprint" value={selected.fingerprint} mono /><KeyValue label="Draft mapping version" value={selected.mappingVersion} mono /><KeyValue label="Source file hash / actual path" value="Not supplied" /><KeyValue label="Privacy / provenance" value={`${selected.privacy} / ${selected.provenance}`} /></div><div className="notice warning">The original plan supplies BATCH-OFF-001 metadata and a three-row replay excerpt. Additional profiles, access partitions, checkpoints and replay amounts are invented extensions for this demo.</div><div className="alert-modal-footer"><Button onClick={() => setManifestOpen(false)}>Close</Button></div></div></AlertModal>}
  </div>
}

function OperationsScope({ session, range, onInstitution, onRange, onPersona }: { session: AccessSession; range: string; onInstitution: (value: string) => void; onRange: (value: string) => void; onPersona: (value: string) => void }) {
  const persona = getAccessPersona(session)!
  return <Panel className="records-filters"><div className="ops-scope-controls"><div className="records-field"><span>Authorized institution</span><Select label="Operations institution" value={session.institution} onChange={onInstitution}>{persona.institutions.map((value) => <option key={value} value={value}>{value.replace('INST-DEMO-', 'Demo Institution ')}</option>)}{allowsInstitution(session, 'ALL') && <option value="ALL">All authorized institutions</option>}</Select></div><div className="records-field"><span>Evidence window</span><Select label="Operations time window" value={range} onChange={onRange}><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></Select></div><div className="records-field"><span>Demo persona</span><Select label="Operations demo persona" value={session.personaId} onChange={onPersona}>{ACCESS_PERSONAS.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</Select></div><p>Evidence is synthetic or unavailable. Changing the view does not configure a live service or expand access permissions.</p></div></Panel>
}
function DownloadPreview({ contents, name, type }: { contents: string; name: string; type: string }) {
  return <Button onClick={() => { const url = URL.createObjectURL(new Blob([contents], { type })); const link = document.createElement('a'); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }}>Download prepared CSV<Icon name="arrow" size={13} /></Button>
}

function HealthPage({ session, range, setInstitution, setRange, onPersona, alerts, policies, datasets }: {
  session: AccessSession; range: string; setInstitution: (value: string) => void; setRange: (value: string) => void; onPersona: (value: string) => void
  alerts: AlertWorkspace; policies: PolicyWorkspace; datasets: DatasetWorkspace
}) {
  const [tab, setTab] = useState('source')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [mode, setMode] = useState('synthetic')
  const [service, setService] = useState('all')
  const [stage, setStage] = useState('all')
  const [jobSearch, setJobSearch] = useState('')
  const [jobKind, setJobKind] = useState('all')
  const [inspector, setInspector] = useState<{ kind: 'service' | 'job' | 'recovery'; id: string } | null>(null)
  const [inspectedAt, setInspectedAt] = useState<string | null>(null)
  const tabsId = useId()
  const scope = { institution: session.institution, range, asOf: fixtures._meta.data_as_of }
  const health = buildHealthView(fixtures, alerts, datasets, policies, scope)
  const dataAvailable = mode === 'synthetic' && preview !== 'empty'
  const dependencies = preview === 'empty' ? [] : HEALTH_DEPENDENCIES.filter((item) => (service === 'all' || item.id === service) && (stage === 'all' || item.stage === stage))
  const jobs = dataAvailable ? health.jobs.filter((job) => (jobKind === 'all' || job.kind === jobKind) && `${job.id} ${job.policyId} ${job.transactionId ?? ''}`.toLowerCase().includes(jobSearch.trim().toLowerCase())) : []
  const job = inspector?.kind === 'job' ? jobs.find((item) => item.id === inspector.id) : undefined
  const dependency = inspector?.kind === 'service' ? HEALTH_DEPENDENCIES.find((item) => item.id === inspector.id) : undefined
  const tabs = [{ id: 'source', label: 'Source readiness' }, { id: 'quality', label: 'Data quality & coverage' }, { id: 'features', label: 'Features' }, { id: 'jobs', label: 'Risk jobs' }, { id: 'platform', label: 'Platform & recovery' }]
  const pageRef = useMonitoringMotion(`health:${tab}:${session.version}:${range}:${mode}:${service}:${stage}:${jobSearch}:${jobKind}:${preview}:${datasets.version}:${policies.version}`)
  useEffect(() => { setInspector(null); setInspectedAt(null) }, [session.version, range])
  return <div ref={pageRef} className="page records-page ops-page health-page"><PageHeader eyebrow="DATA & OPERATIONS / EVIDENCE READINESS" title="Data & System Health" description="Separate supplied fixture coverage from unobserved source, worker, model and recovery readiness."><StatePreview value={preview} onChange={setPreview} /><Button onClick={() => setInspectedAt(new Date().toISOString())}>Refresh local evidence<Icon name="clock" size={14} /></Button></PageHeader><div className="scope-strip ops-scope"><span><Icon name="health" size={14} />Mode <strong>{mode === 'synthetic' ? 'Synthetic evidence' : 'Production evidence unavailable'}</strong></span><span>Live telemetry <strong>Not connected</strong></span><span>Last local inspection <strong>{inspectedAt ?? 'Not recorded'}</strong></span></div>
    <div className="kpi-grid records-summary"><KpiCard label="Assessment coverage" value={dataAvailable ? `${health.assessed} / ${health.transactions}` : '—'} detail="Frozen fixtures, not production throughput" icon="assessments" tone="amber" onClick={() => setTab('quality')} /><KpiCard label="Unresolved identity" value={dataAvailable ? String(health.unresolved) : '—'} detail="No verified account identity inferred" icon="access" tone="pink" onClick={() => setTab('quality')} /><KpiCard label="Offline count attention" value={dataAvailable ? String(health.pendingBatches) : '—'} detail="Scoped demo batches awaiting reconciliation" icon="datasets" tone="violet" onClick={() => navigate('/datasets')} /><KpiCard label="Live model readiness" value="—" detail="Loaded-model evidence not supplied" icon="models" tone="cyan" onClick={() => navigate('/models')} /></div>
    <OperationsScope session={session} range={range} onInstitution={setInstitution} onRange={setRange} onPersona={onPersona} />
    <OperationsTabs items={tabs} active={tab} onChange={setTab} tabsId={tabsId} label="Health workspaces" />
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content ops-content" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
      {tab === 'source' && <><Panel className="records-filters"><div className="ops-filter-grid"><div className="records-field"><span>Evidence mode</span><Select label="Health evidence mode" value={mode} onChange={setMode}><option value="synthetic">Synthetic fixture evidence</option><option value="production">Production · unavailable</option></Select></div><div className="records-field"><span>Dependency</span><Select label="Health dependency" value={service} onChange={setService}><option value="all">All dependencies</option>{HEALTH_DEPENDENCIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div><div className="records-field"><span>Pipeline stage</span><Select label="Health pipeline stage" value={stage} onChange={setStage}><option value="all">All stages</option>{[...new Set(HEALTH_DEPENDENCIES.map((item) => item.stage))].map((value) => <option key={value}>{value}</option>)}</Select></div></div></Panel><Panel className="table-panel"><PanelHeader title="Dependency evidence" subtitle="No live liveness or readiness probe is connected; inspection never implies a service is up" aside={<Badge>Unobserved</Badge>} /><div className="table-scroll"><table className="ops-wide-table"><thead><tr><th>Dependency / stage</th><th>Liveness</th><th>Readiness</th><th>Missing evidence</th><th>Inspect</th></tr></thead><tbody>{dependencies.length ? dependencies.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.stage}</small></td><td>—<small>Not observed</small></td><td><Badge>Unavailable</Badge></td><td>{item.reason}</td><td><Button compact onClick={() => setInspector({ kind: 'service', id: item.id })}>Evidence<Icon name="arrow" size={12} /></Button></td></tr>) : <tr><td colSpan={5}><div className="empty-state"><strong>No dependencies match these filters</strong><Button compact onClick={() => { setService('all'); setStage('all') }}>Clear filters</Button></div></td></tr>}</tbody></table></div></Panel><Panel className="table-panel"><PanelHeader title="Source readiness checklist" subtitle="Real source semantics, identity and watermarks remain prerequisites" /><div className="table-scroll"><table className="ops-checklist-table"><thead><tr><th>Evidence</th><th>Observed value</th><th>Reason</th></tr></thead><tbody>{SOURCE_READINESS.map((item) => <tr key={item.name}><td><strong>{item.name}</strong></td><td>—</td><td>{item.reason}</td></tr>)}</tbody></table></div><div className="records-table-note"><Icon name="clock" size={14} /><span>Refreshing this page only rereads local fixture state. It does not test source connectivity, advance CDC or accept production readiness.</span></div></Panel></>}
      {tab === 'quality' && <><div className="ops-two-column"><Panel><PanelHeader title="Scoped fixture quality" subtitle="Counts describe supplied synthetic records only" /><div className="key-grid"><KeyValue label="Transactions / assessments" value={dataAvailable ? `${health.transactions} / ${health.assessed}` : 'Unavailable'} /><KeyValue label="Unresolved account identity" value={dataAvailable ? String(health.unresolved) : 'Unavailable'} /><KeyValue label="Invalid / late / quarantined" value="Unavailable · counters not supplied" /><KeyValue label="Replica lag / source watermark" value="Unavailable · not measured" /></div><div className="notice warning">A missing measurement is not zero. Offline staging conflicts are separate from canonical payment quality.</div><div className="ops-actions"><Button disabled={!decideRouteAccess(session, '/transactions').allowed} onClick={() => navigate('/transactions')}>Open authorized transactions<Icon name="arrow" size={13} /></Button><Button onClick={() => navigate('/datasets')}>Inspect offline metadata<Icon name="arrow" size={13} /></Button></div></Panel><Panel><PanelHeader title="Offline staging attention" subtitle="Metadata-only local simulation, not source publication" /><div className="key-grid"><KeyValue label="Scoped batches" value={dataAvailable ? String(health.batches.length) : 'Unavailable'} /><KeyValue label="Pending count reconciliation" value={dataAvailable ? String(health.pendingBatches) : 'Unavailable'} /><KeyValue label="Invented offline conflicts" value={dataAvailable ? String(health.offlineConflicts) : 'Unavailable'} /><KeyValue label="Canonical publications" value="0 · staging stays separate" /></div></Panel></div><Panel className="table-panel"><PanelHeader title="Frozen dimension coverage" subtitle="Available indices are not calibrated probabilities, measured accuracy or eligible labels" /><div className="table-scroll"><table className="ops-checklist-table"><thead><tr><th>Dimension</th><th>Index availability</th><th>Unavailable</th><th>Production interpretation</th></tr></thead><tbody>{health.dimensions.map((item) => <tr key={item.dimension}><td><Badge tone={item.dimension}>{item.dimension.toUpperCase()}</Badge></td><td>{dataAvailable ? `${item.available} / ${item.total}` : '—'}</td><td>{dataAvailable ? item.total - item.available : '—'}</td><td>Not established from synthetic fixtures</td></tr>)}</tbody></table></div></Panel></>}
      {tab === 'features' && <><Panel className="table-panel"><PanelHeader title="Feature availability evidence" subtitle="Frozen assessment coverage and live feature freshness are separate" /><div className="table-scroll"><table className="ops-wide-table"><thead><tr><th>Feature family</th><th>Fixture evidence</th><th>Live freshness / watermark</th><th>Limitation</th></tr></thead><tbody>{health.dimensions.map((item) => <tr key={item.dimension}><td><Badge tone={item.dimension}>{item.dimension.toUpperCase()}</Badge></td><td>{dataAvailable ? `${item.available}/${item.total} frozen indices available` : 'Unavailable'}</td><td>—<small>Not connected</small></td><td>Index availability does not prove complete features or point-in-time reconstruction.</td></tr>)}<tr><td>Verified account / graph identity</td><td>Unresolved</td><td>—</td><td>Invented graph bindings are not stable account ownership.</td></tr><tr><td>Historical availability</td><td>Snapshot only or unknown</td><td>—</td><td>Current snapshots do not reconstruct when features became available.</td></tr></tbody></table></div></Panel><div className="notice info">No cache age, online feature watermark or loaded-model score fallback is inferred. Missing inputs remain unavailable.</div></>}
      {tab === 'jobs' && <><Panel className="records-filters"><div className="ops-filter-grid"><div className="records-field"><span>Search frozen job</span><FilterSearch value={jobSearch} onChange={setJobSearch} placeholder="Job, transaction or frozen policy" /></div><div className="records-field"><span>Evidence kind</span><Select label="Job evidence kind" value={jobKind} onChange={setJobKind}><option value="all">All demo references</option><option value="fixture_result">Supplied fixture results</option><option value="selection_snapshot">Frozen selection previews</option></Select></div></div></Panel><Panel className="table-panel"><PanelHeader title="Read-only risk job evidence" subtitle="Fixture result vocabulary is proposed UI state; selection previews do not dispatch an operational worker" /><div className="table-scroll"><table className="ops-wide-table"><thead><tr><th>Job / kind</th><th>Transaction revision</th><th>Frozen policy</th><th>State</th><th>Attempt / lease</th><th>Inspect</th></tr></thead><tbody>{jobs.length ? jobs.map((item) => <tr key={item.id}><td><strong className="data-id">{item.id}</strong><small>{item.kind.replace(/_/g, ' ')}</small></td><td>{item.transactionId ?? 'Not supplied'}<small>{item.revision === null ? 'Selection snapshot only' : `Revision ${item.revision}`}</small></td><td><strong className="data-id">{item.policyId}</strong><small>{item.policyHash.slice(0, 25)}…</small></td><td><Badge tone="synthetic">{item.state.replace(/_/g, ' ')}</Badge></td><td>{item.attempt ?? '—'}<small>Live lease unavailable</small></td><td><Button compact onClick={() => setInspector({ kind: 'job', id: item.id })}>Inspect<Icon name="arrow" size={12} /></Button></td></tr>) : <tr><td colSpan={6}><div className="empty-state"><strong>No supplied job evidence in this view</strong><span>Adjust the institution, mode or job filters.</span></div></td></tr>}</tbody></table></div><div className="records-table-note"><Icon name="access" size={14} /><span>Retry, enqueue and worker controls are CLI-only in the documented implementation; no browser job mutations are connected.</span></div></Panel></>}
      {tab === 'platform' && <><div className="ops-two-column"><Panel><PanelHeader title="Recovery & production prerequisites" subtitle="Readiness is not established by local prototype checks" /><div className="ops-requirement-list">{RECOVERY_READINESS.map((item) => <article key={item.name}><h3>{item.name}</h3><p>{item.reason}</p><Badge tone="planned">Evidence pending</Badge></article>)}</div><Button onClick={() => setInspector({ kind: 'recovery', id: 'recovery' })}>Inspect recovery requirements<Icon name="arrow" size={13} /></Button></Panel><Panel><PanelHeader title="Platform boundaries" subtitle="No fabricated service or capacity telemetry" /><div className="key-grid"><KeyValue label="Observed production TPS" value="Unavailable" /><KeyValue label="p95 / p99 / replica lag" value="Unavailable" /><KeyValue label="Backup / restore evidence" value="Not supplied to this portal" /><KeyValue label="Owners / SLO / RPO / RTO" value="Not supplied" /></div><div className="ops-actions"><Button onClick={() => navigate('/notifications')}>Inspect outbox readiness<Icon name="arrow" size={13} /></Button><Button disabled={!decideRouteAccess(session, '/models').allowed} onClick={() => navigate('/models')}>Model readiness<Icon name="arrow" size={13} /></Button></div><div className="notice warning">A process being up would not prove source correctness, model readiness, notification delivery or production capacity.</div></Panel></div></>}
    </div>}
    <footer className="page-footer"><span>Local fixture evidence · no live probes or operational controls</span><span>Unknown telemetry stays unavailable</span></footer>
    {inspector && (job || dependency || inspector.kind === 'recovery') && <AlertModal title={job ? 'Frozen job evidence' : dependency ? dependency.name : 'Recovery readiness requirements'} onClose={() => setInspector(null)}><div className="ops-inspector"><Badge tone="synthetic">Read-only evidence</Badge>{job ? <><div className="key-grid"><KeyValue label="Job reference" value={job.id} mono /><KeyValue label="Evidence kind" value={job.kind} /><KeyValue label="Frozen policy / hash or ref" value={`${job.policyId} / ${job.policyHash}`} mono /><KeyValue label="Frozen selection receipt" value={job.receipt} mono /><KeyValue label="Transaction / revision" value={job.transactionId ? `${job.transactionId} / r${job.revision}` : 'Not supplied in a selection preview'} /><KeyValue label="Input fingerprint / engine" value={`${job.fingerprint ?? 'Not supplied'} / ${job.engine ?? 'Not supplied'}`} /><KeyValue label="Attempt / live lease / retry time" value={`${job.attempt ?? 'Not supplied'} / unavailable / unavailable`} /><KeyValue label="Evidence time" value={job.at ?? 'Not supplied'} /></div><div className="notice info">Supplied result timestamps refer to their frozen assessment evidence. Selection snapshots retain the accepted policy after later binding changes; they do not establish worker execution.</div><div className="ops-actions">{job.assessmentId && <Button disabled={!decideRouteAccess(session, '/assessments').allowed} onClick={() => navigate(`/assessments/${job.assessmentId}`)}>Open authorized assessment<Icon name="arrow" size={13} /></Button>}</div></> : dependency ? <><h3>{dependency.stage} evidence</h3><p>{dependency.reason}</p><div className="key-grid"><KeyValue label="Liveness / readiness observation" value="Not supplied" /><KeyValue label="Probe / endpoint configuration" value="Not connected" /><KeyValue label="Measured latency / lag" value="Unavailable" /><KeyValue label="Accountable owner / acceptance" value="Not supplied" /></div></> : <><p>Review environment-specific restore evidence, approved recovery objectives, responsible owners, release gates and tested rollback conditions before declaring readiness.</p><ul>{RECOVERY_READINESS.map((item) => <li key={item.name}>{item.name}: {item.reason}</li>)}</ul></>}<div className="alert-modal-footer"><Button onClick={() => setInspector(null)}>Close</Button></div></div></AlertModal>}
  </div>
}

function OperationsTabs({ items, active, onChange, tabsId, label }: { items: { id: string; label: string }[]; active: string; onChange: (value: string) => void; tabsId: string; label: string }) {
  return <div className="detail-tabs ops-tabs" role="tablist" aria-label={label}>{items.map((item, index) => <button type="button" role="tab" key={item.id} id={`${tabsId}-${item.id}`} aria-controls={`${tabsId}-panel`} aria-selected={active === item.id} tabIndex={active === item.id ? 0 : -1} onClick={() => onChange(item.id)} onKeyDown={(event) => { const next = event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : -1; if (next < 0) return; event.preventDefault(); onChange(items[next].id); event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus() }}>{item.label}</button>)}</div>
}

function NotificationsPage({ session, range, setInstitution, setRange, onPersona, workspace }: { session: AccessSession; range: string; setInstitution: (value: string) => void; setRange: (value: string) => void; onPersona: (value: string) => void; workspace: AlertWorkspace }) {
  const [tab, setTab] = useState('intents')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [search, setSearch] = useState('')
  const [state, setState] = useState('all')
  const [channel, setChannel] = useState('all')
  const [mode, setMode] = useState('sandbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const tabsId = useId()
  const scoped = preview === 'empty' ? [] : buildNotificationIntents(workspace, { institution: session.institution, range, asOf: fixtures._meta.data_as_of })
  const intents = mode === 'production' ? [] : scoped.filter((intent) => (!search.trim() || `${intent.id} ${intent.reference} ${intent.alertId}`.toLowerCase().includes(search.trim().toLowerCase())) && (state === 'all' || intent.state === state) && (channel === 'all' || intent.channel === channel))
  const selected = intents.find((intent) => intent.id === selectedId)
  const attempts = intents.flatMap((intent) => intent.attempts.map((attempt) => ({ ...attempt, intent })))
  const tabs = [{ id: 'intents', label: 'Outbox intents' }, { id: 'attempts', label: 'Delivery attempts' }, { id: 'acknowledgements', label: 'Acknowledgements' }, { id: 'escalation', label: 'Escalation' }, { id: 'subscriptions', label: 'Subscriptions' }]
  const canOpenAlert = decideRouteAccess(session, '/alerts').allowed
  const pageRef = useMonitoringMotion(`notifications:${tab}:${session.version}:${range}:${search}:${state}:${channel}:${mode}:${preview}`)
  useEffect(() => setSelectedId(null), [session.version, range, search, state, channel, mode])
  const emptyRow = (columns: number) => <tr><td colSpan={columns}><div className="empty-state"><strong>{mode === 'production' ? 'No production delivery evidence connected' : 'No sandbox intents match this view'}</strong><span>Delivery and subscription views do not establish real push connectivity.</span><Button compact onClick={() => { setSearch(''); setState('all'); setChannel('all'); setMode('sandbox') }}>Show sandbox examples</Button></div></td></tr>
  return <div ref={pageRef} className="page records-page ops-page notifications-page"><PageHeader eyebrow="DATA & OPERATIONS / DELIVERY EVIDENCE" title="Notifications" description="Inspect sandbox intent and attempt metadata while keeping provider acceptance, device receipt, opening and acknowledgement separate."><StatePreview value={preview} onChange={setPreview} /><Badge tone="planned">Delivery not connected</Badge></PageHeader><div className="scope-strip ops-scope"><span><Icon name="notifications" size={14} />Examples <strong>Invented sandbox intents</strong></span><span>Provider <strong>Not connected</strong></span><span>App direction <strong>Web App / Add to Home Screen</strong></span></div>
    <div className="kpi-grid records-summary"><KpiCard label="Scoped sandbox intents" value={mode === 'production' ? '—' : String(scoped.length)} detail="Invented delivery examples, not live sends" icon="notifications" tone="amber" onClick={() => { setTab('intents'); setState('all') }} /><KpiCard label="Queued / retry examples" value={mode === 'production' ? '—' : String(scoped.filter((intent) => ['queued', 'retry_scheduled'].includes(intent.state)).length)} detail="No worker is dispatched by this portal" icon="clock" tone="pink" onClick={() => setTab('attempts')} /><KpiCard label="Provider accepted examples" value={mode === 'production' ? '—' : String(scoped.filter((intent) => intent.providerAcceptedAt).length)} detail="Does not establish delivery or a user read" icon="check" tone="violet" onClick={() => { setTab('intents'); setState('provider_accepted') }} /><KpiCard label="Device receipt evidence" value="—" detail="Receipt, opened and notify-ack not supplied" icon="access" tone="cyan" onClick={() => setTab('acknowledgements')} /></div>
    <OperationsScope session={session} range={range} onInstitution={setInstitution} onRange={setRange} onPersona={onPersona} />
    <OperationsTabs items={tabs} active={tab} onChange={setTab} tabsId={tabsId} label="Notification workspaces" />
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content ops-content" id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${tab}`}>
      {!['escalation', 'subscriptions'].includes(tab) && <Panel className="records-filters"><div className="ops-notification-filters"><div className="records-field"><span>Search opaque references</span><FilterSearch value={search} onChange={setSearch} placeholder="Intent, alert or preview reference" /></div><div className="records-field"><span>Delivery state</span><Select label="Delivery state" value={state} onChange={setState}><option value="all">All states</option>{['queued', 'processing', 'provider_accepted', 'retry_scheduled', 'failed', 'expired', 'cancelled'].map((value) => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}</Select></div><div className="records-field"><span>Channel</span><Select label="Notification channel" value={channel} onChange={setChannel}><option value="all">All channels</option><option value="web_app_preview">Web App preview</option><option value="push_planned">Push · not connected</option></Select></div><div className="records-field"><span>Mode</span><Select label="Notification evidence mode" value={mode} onChange={setMode}><option value="sandbox">Sandbox examples</option><option value="production">Production · unavailable</option></Select></div></div></Panel>}
      {tab === 'intents' && <><div className="ops-two-column"><Panel className="ops-payload-preview"><Badge tone="synthetic">Lock-screen payload preview</Badge><h2>A risk alert requires your review</h2><p className="data-id">{intents[0]?.reference ?? 'DEMO-REF-0001'}</p><small>Opaque reference only. No account, staff name, amount, risk evidence or credentials are included.</small></Panel><Panel><PanelHeader title="A durable inbox is separate from delivery" subtitle="Sandbox metadata does not send a notification" /><p className="ops-body">An alert remains in the authenticated inbox when a device is offline, permission is denied or the notification expires. Opening the linked alert rechecks authorization.</p><div className="ops-actions"><Button disabled={!canOpenAlert} onClick={() => navigate('/alerts')}>Open authorized alert inbox<Icon name="arrow" size={13} /></Button><button type="button" className="button" disabled aria-describedby={`${tabsId}-send-reason`}>Send / test push · planned</button></div><small className="ops-caption" id={`${tabsId}-send-reason`}>Provider, subscription, recipient authority and delivery acceptance are not configured.</small></Panel></div><Panel className="table-panel"><PanelHeader title="Sandbox outbox intents" subtitle="View-model examples for delivery states; no real provider request was made" /><div className="table-scroll"><table className="ops-intent-table"><thead><tr><th>Intent / alert reference</th><th>Recipient scope</th><th>Channel / mode</th><th>State</th><th>Attempt / retry</th><th>Inspect</th></tr></thead><tbody>{intents.length ? intents.map((intent) => <tr key={intent.id}><td><strong className="data-id">{intent.id}</strong><small>{intent.alertId} · {intent.reference}</small></td><td>{intent.institution}<small>{intent.recipientRef} · candidate staff recipient</small></td><td>Web App preview<small>Sandbox</small></td><td><Badge tone={intent.state === 'provider_accepted' ? 'violet' : intent.state === 'retry_scheduled' ? 'amber' : 'neutral'}>{intent.state.replace(/_/g, ' ')}</Badge></td><td>{intent.attempts.length} attempts<small>{intent.retryAt ?? 'No retry supplied'}</small></td><td><Button compact onClick={() => setSelectedId(intent.id)}>Inspect<Icon name="arrow" size={12} /></Button></td></tr>) : emptyRow(6)}</tbody></table></div></Panel></>}
      {tab === 'attempts' && <Panel className="table-panel"><PanelHeader title="Sandbox attempt history" subtitle="Attempt lease, retry and provider acceptance are example metadata, not proof of device delivery" /><div className="table-scroll"><table className="ops-wide-table"><thead><tr><th>Intent / attempt</th><th>Sandbox outcome</th><th>Lease reference</th><th>Evidence time</th><th>Reason</th><th>Inspect</th></tr></thead><tbody>{attempts.length ? attempts.map((attempt) => <tr key={`${attempt.intent.id}:${attempt.number}`}><td><strong>{attempt.intent.id}</strong><small>Attempt {attempt.number}</small></td><td><Badge>{attempt.state.replace(/_/g, ' ')}</Badge></td><td className="data-id">{attempt.leaseRef}</td><td>{attempt.at}</td><td>{attempt.reason}</td><td><Button compact onClick={() => setSelectedId(attempt.intent.id)}>Inspect</Button></td></tr>) : emptyRow(6)}</tbody></table></div><div className="records-table-note"><Icon name="clock" size={14} /><span>Retry and cancellation controls require a verified write contract. This portal does not invoke a delivery worker.</span></div></Panel>}
      {tab === 'acknowledgements' && <Panel className="table-panel"><PanelHeader title="Delivery and acknowledgement evidence" subtitle="These stages are independent; an alert workflow change does not prove a push was delivered" /><div className="table-scroll"><table className="ops-ack-table"><thead><tr><th>Intent</th><th>Provider accepted</th><th>Device receipt</th><th>Opened</th><th>Notification ack</th><th>Alert workflow</th><th>Open alert</th></tr></thead><tbody>{intents.length ? intents.map((intent) => <tr key={intent.id}><td className="data-id">{intent.id}</td><td>{intent.providerAcceptedAt ? <Badge tone="violet">Sandbox example</Badge> : '—'}</td><td>—<small>Not supplied</small></td><td>—<small>Not supplied</small></td><td>—<small>Not supplied</small></td><td><Badge tone={intent.alertState}>{intent.alertState}</Badge><small>Independent inbox state</small></td><td><Button compact disabled={!canOpenAlert} onClick={() => navigate(`/alerts/${intent.alertId}`)}>Alert<Icon name="arrow" size={12} /></Button></td></tr>) : emptyRow(7)}</tbody></table></div></Panel>}
      {tab === 'escalation' && <div className="ops-two-column"><Panel><PanelHeader title="Escalation readiness" subtitle="No approved escalation policy or recipient schedule is supplied" aside={<Badge tone="planned">Planned</Badge>} /><div className="key-grid"><KeyValue label="Escalation policy / owner" value="Not configured" /><KeyValue label="Due time / target" value="Not supplied" /><KeyValue label="Acknowledgement deadline" value="Not supplied" /><KeyValue label="Production escalations" value="Unavailable" /></div><div className="notice warning">An expired notification does not remove an alert from its inbox or imply that it has been reviewed. Escalation requires its own policy and authorized recipient scope.</div></Panel><Panel><PanelHeader title="What must be established" subtitle="Delivery governance before real escalation" /><ul className="ops-list"><li>Authenticated staff recipient and institution authority</li><li>Versioned deadlines and acknowledgement semantics</li><li>Expiry, retry, deduplication and escalation rules</li><li>Approved provider, privacy boundary and delivery evidence</li></ul><Button disabled={!canOpenAlert} onClick={() => navigate('/alerts')}>Review authorized inbox<Icon name="arrow" size={13} /></Button></Panel></div>}
      {tab === 'subscriptions' && <><div className="ops-two-column"><Panel><PanelHeader title="Devices & subscriptions" subtitle="Web App / Add to Home Screen is the selected direction, not proof of implemented push or offline support" aside={<Badge tone="planned">Not connected</Badge>} /><div className="key-grid"><KeyValue label="Verified owned subscriptions" value="Not supplied" /><KeyValue label="Service worker / offline acceptance" value="Not established" /><KeyValue label="Provider configuration" value="Not connected" /><KeyValue label="Recipient directory" value="Not configured" /></div><div className="ops-actions"><button type="button" className="button" disabled aria-describedby={`${tabsId}-subscription-reason`}>Revoke owned subscription · planned</button></div><small className="ops-caption" id={`${tabsId}-subscription-reason`}>Requires authenticated ownership, a subscription adapter and approved revocation semantics.</small></Panel><Panel className="ops-payload-preview"><span className="ops-feature-icon"><Icon name="access" size={25} /></span><h2>Permission does not replace the inbox</h2><p>Denied device permission, an offline browser or an expired token must not hide a durable risk alert. No notification permission request is made by this page.</p></Panel></div><Panel className="ops-empty"><Icon name="notifications" size={28} /><h2>No verified device subscriptions supplied</h2><p>No live subscription or device token is displayed, created, revoked or transmitted.</p></Panel></>}
    </div>}
    <footer className="page-footer"><span>Sandbox metadata only · provider accepted ≠ device delivered ≠ opened ≠ acknowledged</span><span>No real send or subscription mutation</span></footer>
    {selected && <AlertModal title="Sandbox intent evidence" onClose={() => setSelectedId(null)}><div className="ops-inspector"><div className="ops-badge-row"><Badge tone="synthetic">Invented sandbox</Badge><Badge>{selected.state.replace(/_/g, ' ')}</Badge></div><div className="key-grid"><KeyValue label="Intent / opaque reference" value={`${selected.id} / ${selected.reference}`} mono /><KeyValue label="Recipient / institution" value={`${selected.recipientRef} / ${selected.institution}`} /><KeyValue label="Policy / mode" value={`${selected.policyRef} / sandbox`} /><KeyValue label="Example TTL expiry" value={selected.expiresAt} /><KeyValue label="Example retry time" value={selected.retryAt ?? 'Not supplied'} /><KeyValue label="Provider accepted" value={selected.providerAcceptedAt ?? 'Not supplied'} /><KeyValue label="Device receipt / opened / notification ack" value="Not supplied / not supplied / not supplied" /><KeyValue label="Independent alert state" value={selected.alertState} /></div><h3>Safe payload preview</h3><p>{selected.payload.title} · <span className="data-id">{selected.payload.reference}</span></p><h3>Attempt evidence</h3><ul className="ops-list">{selected.attempts.length ? selected.attempts.map((attempt) => <li key={attempt.number}>#{attempt.number} · {attempt.state} · {attempt.leaseRef}<br />{attempt.reason}</li>) : <li>No attempt supplied for this queued example.</li>}</ul><div className="notice warning">Examples demonstrate the state contract. No provider or device observation is acquired, and alert acknowledgement never fills missing notification receipt evidence.</div><div className="alert-modal-footer"><Button onClick={() => setSelectedId(null)}>Close</Button><Button primary disabled={!canOpenAlert} onClick={() => navigate(`/alerts/${selected.alertId}`)}>Open authorized alert<Icon name="arrow" size={13} /></Button></div></div></AlertModal>}
  </div>
}

function AuditPage({ session, range, setInstitution, setRange, onPersona, workspace, policies, datasets, exports, onExport }: {
  session: AccessSession; range: string; setInstitution: (value: string) => void; setRange: (value: string) => void; onPersona: (value: string) => void
  workspace: AlertWorkspace; policies: PolicyWorkspace; datasets: DatasetWorkspace; exports: AuditExportRecord[]
  onExport: (ids: string[], expectedAccessVersion: number) => ReturnType<typeof prepareAuditCsv>
}) {
  const [tab, setTab] = useState('events')
  const [preview, setPreview] = useState<DemoState>('ready')
  const [filters, setFilters] = useState<AuditFilters>({ ...DEFAULT_AUDIT_FILTERS })
  const [advanced, setAdvanced] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [prepared, setPrepared] = useState<ReturnType<typeof prepareAuditCsv> | null>(null)
  const [error, setError] = useState('')
  const tabsId = useId()
  const scope = { institution: session.institution, range, asOf: fixtures._meta.data_as_of }
  const events = preview === 'empty' ? [] : buildAuditEvents(session, workspace, policies, datasets, exports, scope)
  const results = filterAuditEvents(events, filters).filter((event) => tab !== 'access' || ['access', 'export'].includes(event.domain))
  const pages = Math.max(1, Math.ceil(results.length / 10)), currentPage = Math.min(page, pages)
  const visible = results.slice((currentPage - 1) * 10, currentPage * 10)
  const selected = events.find((event) => event.id === selectedId)
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== DEFAULT_AUDIT_FILTERS[key as keyof AuditFilters])
  const canExport = decideAccess(session, 'export_audit_preview').allowed
  const tabs = [{ id: 'events', label: 'Audit events' }, { id: 'access', label: 'Access & export history' }, { id: 'archive', label: 'Archive readiness' }]
  const pageRef = useMonitoringMotion(`audit:${tab}:${session.version}:${range}:${JSON.stringify(filters)}:${page}:${preview}:${exports.length}:${workspace.events.length}:${policies.version}:${datasets.version}:${advanced}`)
  useEffect(() => { setPage(1); setSelectedId(null); setPrepared(null); setError('') }, [session.version, range])
  useEffect(() => { setPage(1); setSelectedId(null) }, [JSON.stringify(filters), tab])
  const setFilter = (key: keyof AuditFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const exportVisible = () => { try { setPrepared(onExport(visible.map((event) => event.id), session.version)); setError('') } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to prepare the redacted CSV preview.') } }
  return <div ref={pageRef} className="page records-page ops-page audit-page"><PageHeader eyebrow="DATA & OPERATIONS / TRACEABLE HISTORY" title="Audit" description="Inspect authorized structural history and follow its frozen references without exposing notes, credentials or raw source payloads."><StatePreview value={preview} onChange={setPreview} /><Badge tone="synthetic">Local demo history</Badge></PageHeader><div className="scope-strip ops-scope"><span><Icon name="audit" size={14} />Source <strong>Session + fixture histories</strong></span><span>Archive <strong>Protected/WORM evidence not supplied</strong></span><span>Unknown event times <strong>Preserved, never inferred</strong></span></div>
    <RecordsSummary items={[
      { label: 'Authorized history rows', value: events.length, detail: 'Source capability and institution checked', tone: 'amber', icon: 'audit' },
      { label: 'Session action records', value: events.filter((event) => event.actorType === 'demo_persona').length, detail: 'Local workflow and access changes', tone: 'violet', icon: 'check' },
      { label: 'Unknown event times', value: events.filter((event) => event.at === null).length, detail: 'Fixture history did not supply a time', tone: 'pink', icon: 'clock' },
      { label: 'CSV previews prepared', value: events.filter((event) => event.domain === 'export').length, detail: 'Scoped redacted preview preparation only', tone: 'cyan', icon: 'datasets' },
    ]} />
    <OperationsScope session={session} range={range} onInstitution={setInstitution} onRange={setRange} onPersona={onPersona} />
    <OperationsTabs items={tabs} active={tab} onChange={setTab} tabsId={tabsId} label="Audit workspaces" />
    {preview !== 'ready' && preview !== 'empty' ? <AsyncState state={preview} onRetry={() => setPreview('ready')} /> : <div className="records-content ops-content" role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${tab}`}>
      {tab !== 'archive' ? <>
        <Panel className="records-filters"><div className="ops-audit-filters"><div className="records-field"><span>Search target / action</span><FilterSearch value={filters.search} onChange={(value) => setFilter('search', value)} placeholder="Case, policy, batch, alert or event reference" /></div><div className="records-field"><span>Event source</span><Select label="Audit event source" value={filters.domain} onChange={(value) => setFilter('domain', value)}><option value="all">All authorized sources</option>{['alert', 'case', 'policy', 'dataset', 'access', 'export'].map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Actor reference</span><Select label="Audit actor reference" value={filters.actor} onChange={(value) => setFilter('actor', value)}><option value="all">All supplied actors</option>{[...new Set(events.map((event) => event.actor))].map((value) => <option key={value}>{value}</option>)}</Select></div><div className="records-field"><span>Action</span><Select label="Audit action" value={filters.action} onChange={(value) => setFilter('action', value)}><option value="all">All actions</option>{[...new Set(events.map((event) => event.action))].map((value) => <option key={value}>{value}</option>)}</Select></div></div><div className="ops-filter-footer"><button type="button" className="button compact" aria-expanded={advanced} aria-controls={`${tabsId}-advanced`} onClick={() => setAdvanced(!advanced)}>More filters<Icon name="chevron" size={12} /></button><Button compact disabled={!hasFilters} onClick={() => setFilters({ ...DEFAULT_AUDIT_FILTERS })}>Clear filters</Button><span aria-live="polite">{results.length} matching events</span></div>{advanced && <div className="ops-audit-advanced" id={`${tabsId}-advanced`}><div className="records-field"><span>Actor type</span><Select label="Audit actor type" value={filters.actorType} onChange={(value) => setFilter('actorType', value)}><option value="all">All actor evidence</option><option value="demo_persona">Demo persona / context</option><option value="fixture_reference">Supplied fixture actor reference</option></Select></div><label className="records-field"><span>Correlation / request reference</span><input value={filters.correlation} onChange={(event) => setFilter('correlation', event.target.value)} /></label><label className="records-field"><span>Recorded from · UTC</span><input type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} /></label><label className="records-field"><span>Recorded to · UTC</span><input type="date" min={filters.from || undefined} value={filters.to} onChange={(event) => setFilter('to', event.target.value)} /></label></div>}</Panel>
        {error && <div className="notice warning" role="alert">{error}</div>}
        <Panel className="table-panel"><PanelHeader title={tab === 'access' ? 'Demo access & export history' : 'Authorized audit events'} subtitle="Structural allowlist only · expected revisions not stored in source history stay unavailable" aside={<Button compact disabled={!canExport || !visible.length} onClick={exportVisible}>Prepare visible CSV ({visible.length})<Icon name="arrow" size={12} /></Button>} /><div className="table-scroll"><table className="ops-audit-table"><thead><tr><th>Recorded time</th><th>Action / source</th><th>Actor evidence</th><th>Target / institution</th><th>Actual / expected revision</th><th>Correlation</th><th>Inspect</th></tr></thead><tbody>{visible.length ? visible.map((event) => <tr key={event.id}><td>{event.at ?? 'Not supplied'}{event.at === null && <small>Unknown fixture event time</small>}</td><td><strong>{event.action}</strong><small>{event.domain}</small></td><td><span className="data-id">{event.actor}</span><small>{event.actorType.replace(/_/g, ' ')}</small></td><td><strong className="data-id">{event.target}</strong><small>{event.institution ?? 'Shared demo metadata'}</small></td><td>{event.revision ?? '—'} / —<small>Expected revision not supplied</small></td><td className="data-id">{event.correlation ?? 'Not supplied'}</td><td><Button compact onClick={() => setSelectedId(event.id)}>Inspect<Icon name="arrow" size={12} /></Button></td></tr>) : <tr><td colSpan={7}><div className="empty-state"><strong>No authorized events match this view</strong><span>Adjust filters or perform an allowed local workflow action. Restricted event sources remain excluded.</span><Button compact onClick={() => setFilters({ ...DEFAULT_AUDIT_FILTERS })}>Clear filters</Button></div></td></tr>}</tbody></table></div><div className="pagination"><span>{results.length} events · page {currentPage} of {pages}</span><div><Button compact disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button compact disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div><div className="records-table-note"><Icon name="access" size={14} /><span>Use the Auditor persona for bounded synthetic CSV previews. Date filters exclude records whose event time was not supplied; the default fixture view labels them explicitly.</span></div></Panel>
        {prepared && <Panel className="ops-export-preview"><div><Badge tone="synthetic">Synthetic CSV prepared</Badge><h3>{prepared.record.rowCount} authorized redacted rows</h3><p>Preparation is recorded in local history. It does not establish browser receipt, a protected archive or production export authorization.</p></div><DownloadPreview contents={prepared.csv} name={`synthetic-audit-${prepared.record.id}.csv`} type="text/csv;charset=utf-8" /></Panel>}
      </> : <div className="ops-two-column"><Panel><PanelHeader title="Archive & actor evidence" subtitle="Application history is not proof of an administrator-resistant archive" aside={<Badge tone="planned">Not established</Badge>} /><div className="key-grid"><KeyValue label="Database trigger / service audit evidence" value="Not connected to this portal" /><KeyValue label="Protected archive / WORM" value="Not supplied" /><KeyValue label="Retention / access sign-off" value="Not supplied" /><KeyValue label="Verified employee identity mapping" value="Not established from demo actor references" /></div><div className="notice warning">A database session role is not automatically an employee identity. Local append-only application behavior does not establish immutability against a database administrator.</div></Panel><Panel><PanelHeader title="Safe inspection boundary" subtitle="History can be read and followed, never edited from this workspace" /><ul className="ops-list"><li>Source capability and institution restrictions apply before filtering and export.</li><li>Notes, opinion rationale, credentials and raw source payloads are excluded.</li><li>Unknown timestamps and expected revisions remain unavailable.</li><li>Each bounded CSV preparation creates a separate local export record.</li></ul><Button onClick={() => navigate('/access')}>Inspect access prerequisites<Icon name="arrow" size={13} /></Button></Panel></div>}
    </div>}
    <footer className="page-footer"><span>Read-only structural history · source authorization rechecked</span><span>No edit/delete controls · no protected archive claim</span></footer>
    {selected && <AlertModal title="Audit event evidence" onClose={() => setSelectedId(null)}><div className="ops-inspector"><div className="ops-badge-row"><Badge tone="synthetic">Local demo history</Badge><Badge>{selected.domain}</Badge></div><div className="key-grid"><KeyValue label="Event reference" value={selected.id} mono /><KeyValue label="Action / target" value={`${selected.action} / ${selected.target}`} /><KeyValue label="Actor reference / evidence type" value={`${selected.actor} / ${selected.actorType}`} /><KeyValue label="Institution scope" value={selected.institution ?? 'Shared demo metadata'} /><KeyValue label="Recorded time" value={selected.at ?? 'Not supplied; not inferred from object update time'} /><KeyValue label="Actual / expected revision" value={`${selected.revision ?? 'Not supplied'} / not supplied`} /><KeyValue label="Correlation / request" value={selected.correlation ?? 'Not supplied'} mono /><KeyValue label="Archive protection" value="Not supplied by local demo state" /></div><h3>Safe structural summary</h3><p>{selected.summary}</p><div className="notice info">Source free-text detail is intentionally excluded. No token, note content, original account payload or debugging dump is included.</div><div className="alert-modal-footer"><Button onClick={() => setSelectedId(null)}>Close</Button>{selected.route && <Button primary disabled={!decideRouteAccess(session, selected.route).allowed} onClick={() => navigate(selected.route!)}>Open authorized source<Icon name="arrow" size={13} /></Button>}</div></div></AlertModal>}
  </div>
}

function Placeholder({ route }: { route: string }) {
  const detail = routeDetails[route] ?? routeDetails['/transactions']
  return <div className="page placeholder-page">
    <div className="page-heading"><div><p className="eyebrow">{detail.eyebrow}</p><h1>{detail.title}</h1><p>{detail.description}</p></div><Badge tone="synthetic">Synthetic workspace</Badge></div>
    <Panel className="placeholder-panel">
      <div className="placeholder-icon"><Icon name={(allNav.find((item) => item.path === route)?.icon ?? 'overview')} size={28} /></div>
      <Badge tone="planned">PLANNED WORKSPACE</Badge>
      <h2>{detail.status}</h2>
      <p>This route is registered and uses the shared LMPS shell. Its end-to-end workflow will be completed in a subsequent iteration with the same deterministic fixture chain and governance boundaries.</p>
      <div className="placeholder-notice"><Icon name="check" /><span><strong>Route ready</strong><small>Navigation, institution scope, locale and environment context are preserved.</small></span></div>
      <Button primary onClick={() => navigate('/overview')}>Return to overview <Icon name="arrow" size={16} /></Button>
    </Panel>
  </div>
}

export default function App() {
  const [route, setRoute] = useState(window.location.pathname === '/' ? '/overview' : window.location.pathname)
  const [accessSession, setAccessSession] = useState(createAccessSession)
  const accessRef = useRef(accessSession)
  const [accessNotice, setAccessNotice] = useState('')
  const institution = accessSession.institution
  const persona = getAccessPersona(accessSession)!
  const updateAccess = (prepare: (current: AccessSession) => AccessSession) => {
    try {
      const next = prepare(accessRef.current)
      accessRef.current = next; setAccessSession(next); setAccessNotice('')
    } catch (failure) { setAccessNotice(failure instanceof Error ? failure.message : 'Unable to update the demo access context.') }
  }
  const setInstitution = (value: string) => updateAccess((current) => switchAccessInstitution(current, value, current.version, new Date().toISOString()))
  const changePersona = (value: string) => updateAccess((current) => switchAccessPersona(current, value, current.version, new Date().toISOString()))
  const changeSessionStatus = (value: DemoSessionStatus) => updateAccess((current) => setDemoSessionStatus(current, value, current.version, new Date().toISOString()))
  const resetDemoAccess = () => updateAccess((current) => resetAccessSession(current, current.version, new Date().toISOString()))
  const can = (capability: AccessCapability) => decideAccess(accessSession, capability).allowed
  const [range, setRange] = useState('7d')
  const [locale, setLocale] = useState('en')
  const [workspace, setWorkspace] = useState(() => createAlertWorkspace(fixtures))
  const workspaceRef = useRef(workspace)
  const [policyWorkspace, setPolicyWorkspace] = useState(createPolicyWorkspace)
  const policyWorkspaceRef = useRef(policyWorkspace)
  const [datasetWorkspace, setDatasetWorkspace] = useState(createDatasetWorkspace)
  const datasetWorkspaceRef = useRef(datasetWorkspace)
  const [auditExports, setAuditExports] = useState<AuditExportRecord[]>([])
  const auditExportsRef = useRef(auditExports)
  const exportAudit = (ids: string[], expectedAccessVersion: number) => {
    const session = accessRef.current
    assertDemoMutation(session, 'audit', { kind: 'export', actor: getAccessPersona(session)?.subject, institution: session.institution }, [], expectedAccessVersion)
    const events = buildAuditEvents(session, workspaceRef.current, policyWorkspaceRef.current, datasetWorkspaceRef.current, auditExportsRef.current, { institution: session.institution, range, asOf: fixtures._meta.data_as_of })
    const prepared = prepareAuditCsv(events, ids, session, `DEMO-EXPORT-${crypto.randomUUID()}`, new Date().toISOString())
    auditExportsRef.current = [...auditExportsRef.current, prepared.record]
    setAuditExports(auditExportsRef.current)
    return prepared
  }
  const commitDataset = (command: DatasetCommand) => {
    const batch = 'batchId' in command ? datasetWorkspaceRef.current.batches.find((item) => item.id === command.batchId) : undefined
    assertDemoMutation(accessRef.current, 'dataset', command, 'batchId' in command ? [batch?.institution ?? ''] : [], accessSession.version)
    const next = applyDatasetCommand(datasetWorkspaceRef.current, command)
    datasetWorkspaceRef.current = next; setDatasetWorkspace(next)
  }
  const commitPolicy = async (command: PolicyCommand) => {
    const before = policyWorkspaceRef.current
    assertDemoMutation(accessRef.current, 'policy', command, [], accessSession.version)
    const contextVersion = accessRef.current.version
    const next = await applyPolicyCommand(before, command)
    assertDemoMutation(accessRef.current, 'policy', command, [], contextVersion)
    if (policyWorkspaceRef.current !== before) throw new PolicyError('conflict', 'The policy workspace changed while this action was being prepared. Refresh before retrying.')
    policyWorkspaceRef.current = next
    setPolicyWorkspace(next)
    return next
  }
  const commitAlert = (command: AlertCommand) => {
    const alert = workspaceRef.current.alerts.find((item) => item.id === command.alertId)
    const targetCase = command.kind === 'link_case' ? workspaceRef.current.cases.find((item) => item.id === command.caseId) : undefined
    assertDemoMutation(accessRef.current, 'alert', command, [alert?.institution_id ?? '', ...(targetCase ? [targetCase.institution_id] : [])], accessSession.version)
    const next = applyAlertCommand(workspaceRef.current, command)
    workspaceRef.current = next
    setWorkspace(next)
  }
  const commitCase = (command: CaseCommand) => {
    const record = workspaceRef.current.cases.find((item) => item.id === command.caseId)
    const alertIds = command.kind === 'create' ? command.alertIds : command.kind === 'link_alert' ? [command.alertId] : []
    const owners = alertIds.map((id) => workspaceRef.current.alerts.find((item) => item.id === id)?.institution_id ?? '')
    if (command.kind !== 'create') owners.push(record?.institution_id ?? '')
    assertDemoMutation(accessRef.current, 'case', command, owners, accessSession.version)
    const next = applyCaseCommand(workspaceRef.current, command, fixtures)
    workspaceRef.current = next
    setWorkspace(next)
  }
  const resetAlerts = () => {
    assertDemoMutation(accessRef.current, 'alert', { kind: 'reset', actor: persona.caseActor ?? '', institution }, [], accessSession.version)
    const next = createAlertWorkspace(fixtures)
    workspaceRef.current = next
    setWorkspace(next)
  }
  useEffect(() => {
    if (window.location.pathname === '/') window.history.replaceState({}, '', '/overview')
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const content = useMemo(() => {
    const routeAccess = decideRouteAccess(accessSession, route)
    if (!routeAccess.allowed) return <AccessDeniedPage session={accessSession} reason={routeAccess.reason} />
    if (route === '/access') return <AccessPage session={accessSession} onPersonaChange={changePersona} onInstitutionChange={setInstitution} onSessionStatusChange={changeSessionStatus} onReset={resetDemoAccess} />
    if (route === '/overview') return <Overview institution={institution} range={range} alerts={workspace.alerts} cases={workspace.cases} policies={policyWorkspace.policies} />
    if (route === '/alerts' || route.startsWith('/alerts/')) return <AlertsPage key={`alerts:${accessSession.personaId}:${accessSession.status}`} actor={persona.caseActor ?? ''} permissions={{ acknowledge: can('alert_acknowledge'), review: can('alert_review'), linkCase: can('case_create_link'), reset: can('reset_demo_data') && institution === 'ALL' }} id={route === '/alerts' ? undefined : route.slice('/alerts/'.length)} institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} workspace={workspace} onCommand={commitAlert} onReset={resetAlerts} />
    if (route === '/cases' || route.startsWith('/cases/')) return <CasesPage key={`cases:${accessSession.personaId}:${accessSession.status}`} accessSession={accessSession} onAccessPersona={changePersona} id={route === '/cases' ? undefined : route.slice('/cases/'.length)} institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} workspace={workspace} onCommand={commitCase} />
    if (route === '/outcomes') return <OutcomesPage institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} workspace={workspace} />
    if (route === '/detectors' || route.startsWith('/detectors/')) return <DetectorsPage key={`detectors:${accessSession.personaId}:${accessSession.status}`} canAuthor={can('rule_author')} authorizeDraft={() => assertDemoMutation(accessRef.current, 'detector', { kind: 'draft', actor: persona.subject }, [], accessSession.version)} id={route === '/detectors' ? undefined : decodeURIComponent(route.slice('/detectors/'.length))} institution={institution} range={range} locale={locale} setLocale={setLocale} />
    if (route === '/policies' || route.startsWith('/policies/')) return <PoliciesPage key={`policies:${accessSession.personaId}:${accessSession.status}`} accessSession={accessSession} onAccessPersona={changePersona} id={route === '/policies' ? undefined : decodeURIComponent(route.slice('/policies/'.length))} institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} workspace={policyWorkspace} onCommand={commitPolicy} />
    if (route === '/models') return <ModelsPage institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} workspace={workspace} policies={policyWorkspace.policies} />
    if (route === '/datasets') return <DatasetsPage key={`datasets:${accessSession.personaId}:${accessSession.status}`} institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} workspace={datasetWorkspace} accessSession={accessSession} onAccessPersona={changePersona} onCommand={commitDataset} />
    if (route === '/health') return <HealthPage key={`health:${accessSession.personaId}:${accessSession.status}`} session={accessSession} range={range} setInstitution={setInstitution} setRange={setRange} onPersona={changePersona} alerts={workspace} policies={policyWorkspace} datasets={datasetWorkspace} />
    if (route === '/notifications') return <NotificationsPage key={`notifications:${accessSession.personaId}:${accessSession.status}`} session={accessSession} range={range} setInstitution={setInstitution} setRange={setRange} onPersona={changePersona} workspace={workspace} />
    if (route === '/audit') return <AuditPage key={`audit:${accessSession.personaId}:${accessSession.status}`} session={accessSession} range={range} setInstitution={setInstitution} setRange={setRange} onPersona={changePersona} workspace={workspace} policies={policyWorkspace} datasets={datasetWorkspace} exports={auditExports} onExport={exportAudit} />
    if (route === '/network') return <NetworkPage institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} alerts={workspace.alerts} />
    if (route === '/transactions') return <TransactionsPage institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} />
    if (route.startsWith('/transactions/')) return <TransactionDetail id={decodeURIComponent(route.slice('/transactions/'.length))} institution={institution} />
    if (route === '/assessments') return <AssessmentsPage institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} />
    if (route.startsWith('/assessments/')) return <AssessmentDetail id={decodeURIComponent(route.slice('/assessments/'.length))} institution={institution} />
    return <Placeholder route={route} />
  }, [route, institution, range, workspace, locale, policyWorkspace, accessSession, datasetWorkspace, auditExports])
  return <Shell accessSession={accessSession} accessNotice={accessNotice} onDismissNotice={() => setAccessNotice('')} route={route} institution={institution} setInstitution={setInstitution} range={range} setRange={setRange} locale={locale} setLocale={setLocale} openAlertCount={can('read_monitoring') ? scopedByRange(workspace.alerts, institution, range, (item) => item.created_at).filter((item) => item.state === 'open').length : null}>{content}</Shell>
}
