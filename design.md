# Design — LMPS Risk Portal

The existing application system is locked by the user request to match the other portal pages. This records the current system; it introduces no new palette or app-wide restyle.

## Scope and structure

Transactions and Assessments list/detail routes, Network summary cards and the Cases workspace. App genre: modern-minimal with the existing dark operational theme. Workbench family: concise page header, scoped factual summary, labeled filters, primary data table, then evidence details. Keep the existing side rail and inline page footer. No marketing hero, decorative imagery, or new navigation.

## Locked tokens and typography

Canonical values remain in `src/index.css:5–47` and the existing `New /03-design-tokens.json`. Keep the navy canvas/panels, amber actions, cyan button/graph focus, neutral gray field focus, muted borders, 4px spacing scale, 12px panels and 8px controls. Body/display: IBM Plex Sans with Noto Sans Lao fallback; opaque IDs and exact amounts: the existing mono stack. `tokens.css` exports aliases referencing these variables, not a competing palette. Preserve the existing hexadecimal color definitions exactly as the user requested.

## Interaction and motion

Use existing controls and routes. Visible field labels, immediate keyboard focus, quiet hover states and one-line action text. GSAP motion is scoped to `.records-page`: one short entrance and an opacity transition when results or detail tabs change. Respect reduced motion with a maximum 100ms content fade and no translation. Clean up contexts on updates and unmount. Other routes retain their existing motion.

## Data integrity

Summary counts derive from scoped fixtures. Keep exact money strings and currencies separate. Missing risk indices remain unavailable; indices are not probabilities. Preserve immutable revision/policy/engine references and institution restrictions. No backend or schema changes.

## Responsive contract

Summary cards reuse the existing Alerts KpiCard component: icon block, large number and restrained colored corner glow. Four summary columns on desktop, two below 1280px, one below 768px. Read-only summaries use articles; actionable cards retain their buttons and arrows. Filters adapt from a desktop grid to two columns and then one at 767px. Tables scroll inside their own container. Detail grids stack on narrow screens, IDs wrap in read-only fields and action labels stay on one line. Avoid root clipping changes that could affect other routes.

## Verification boundary

TypeScript, existing logic tests, production build, token/reference checks and CSS breakpoint review. The user explicitly handles browser monitoring and requested no Playwright. Visual verification at320/375/414/768px is pending the user's browser review; no screenshot or58/58 visual-pass claim is made.

## Exports

`tokens.css` is the alias layer for the records pages and Cases, and requires the canonical application variables from `src/index.css`. `src/monitoring-polish.css` imports it. This task does not regenerate the app's existing JSON token catalog, Tailwind theme or integration-specific exports.

## Global fields

User-requested update: all inputs, search wrappers, selects and textareas use the Alerts field surface, border and radius through `src/fields.css`. Pointer focus has no cyan highlight; keyboard focus uses the neutral strong-border token. Checkbox/radio sizing is preserved.

## Detector Catalog

`/detectors` and `/detectors/:code` retain the Overview system and the shared KpiCard, table, badges and global field treatment. The catalog uses a primary library table with a narrow explanation rail; detail, immutable version comparison and bounded backtest workspaces use existing record panels. Scoped GSAP motion reuses `useMonitoringMotion`, including reduced-motion handling and context cleanup. Mobile grids stack, and wide tables and tabs scroll within their own containers.

Four explicitly illustrative bilingual detector definitions demonstrate Fraud/Mule/AML. Fifteen is the plan-reported catalog size, not a claim of fifteen supplied definitions. Typed amount drafts and 1–20-revision backtests are local previews; reference-only detectors keep missing inputs unavailable. Amounts compare as exact decimal integers within literal currency/lifecycle scope. Reports freeze the selected rule and transaction revisions. Approval, production activation, backend catalog integration and real alerts are outside this page's implementation. Local drafts and reports reset on leaving the Detectors component or reloading. Browser visual review remains with the user; no Playwright is used.

## Risk Policies

`/policies` and `/policies/:id` share Overview KpiCards, existing panels and Alerts fields. Keep the navy/amber palette and record typography. Filters, conditions, independent review, comparison and binding history use scoped panels; selectors stack on mobile and wide tables scroll internally. `useMonitoringMotion` supplies the existing GSAP entrance/content transitions and reduced-motion cleanup.

The three fixture policy IDs have explicitly illustrative typed amount configurations and demo governance metadata. Configuration SHA-256 covers identity, version, namespace, currency, condition, catalog and evaluator references; workflow transitions preserve it. A new draft creates a new version. Root-owned session state keeps Overview's pending-policy count consistent across navigation. Persona switching demonstrates proposed author/checker/activator/auditor capabilities, not real authentication. Review prevents creator/submitter self-approval; binding changes require an approved matching namespace/currency and expected generation. Simulated concurrent updates require refresh. Accepted demo jobs retain full policy/hash/receipt snapshots across activation and rollback.

Comparison accepts 1–20 explicit frozen assessment revisions in the selected institution/time scope. The preview evaluates two amount conditions and keeps Mule unavailable; it does not reproduce the backend fifteen-detector evaluator. Report indices and match counts are advisory and do not rewrite original assessments or create alerts. No production scheduler, payment enforcement or backend integration is implied. TypeScript, logic tests, build and server rendering are used for verification; the user handles browser review without Playwright.

## Evaluation & Models

`/models` follows the same Overview KpiCards, record panels, Alerts fields and scoped GSAP motion. Its four workspaces are Baseline comparison, Evaluation datasets, Registry and Serving health. Comparison combines cohort/split planning with explicit prerequisite reasons; datasets expose immutable assessment revisions and original lineage; registry shows three labeled illustrative model-card templates; serving separates process diagnostics from evidence of loaded-model readiness. Tables scroll internally and grids stack on narrow viewports. Neutral field focus and reduced-motion behavior are inherited unchanged.

Institution, time, literal currency and alert-link cohort filters apply before preparing a manifest. Related case opinions update from Cases but remain ineligible, including unknown or closed-case opinions. A readiness snapshot captures the same assessment cohort for baseline/candidate, a full approved synthetic policy reference, proposed UTC temporal partitions, label horizon, blockers and unavailable metrics. Its SHA-256 covers the captured planning record, not a trained artifact. Date checks validate ordering, horizon gaps and partition coverage without treating a locally valid split as approved. Saved JSON is explicitly a readiness/provenance preview, never a training-label or measured evaluation export. Precision, recall, PR-AUC, FPR, calibration, confidence intervals and serving measurements remain null with specific reasons. There is no registry, serving, approval or deployment integration; production actions stay planned. Planning snapshots reset on leaving the Models component or reloading. Browser review remains with the user; no Playwright is used.

## Access & Scope

`/access` retains Overview KpiCards, records typography, Alerts fields and scoped GSAP motion. Four workspaces cover My access, a proposed role/capability matrix, synthetic institution mapping and production readiness prerequisites. Filters and inspectors read the demo contract; provisioning and real entitlement changes remain unavailable. Narrow grids stack, and the role matrix scrolls within its table container.

`src/access.ts` is the shared mock authorization adapter. The root-owned demo session supplies persona, institution, status and a monotonically increasing context version. Sidebar identity and institution options follow it. Default Analyst is limited to A; only the Network Supervisor has explicit A+B membership and network-wide scope. Switching to a narrower persona clamps the selection atomically. Denied routes show no record details and do not expose alert counts. Expired/revoked scenarios keep My access available for recovery while data reads and actions are denied. Case and policy persona selectors update this shared context; actions recheck capabilities, current actor, stored record ownership and selected scope before existing workflow guards run. Async policy publication rechecks context after hashing. Detector draft authoring is restricted to the demo Maker. Cross-institution fixture reset requires the Supervisor in explicit ALL scope.

The adapter demonstrates behavior, not real authentication. No IdP claims, tokens, secrets, production roles, account provisioning or protected access audit are connected. Routing membership and account ownership stay unverified. Demo context changes are local history only; they do not constitute entitlement changes. Session state survives navigation and resets on reload. Verification uses TypeScript, logic tests, production build and server rendering; the user handles visual review without Playwright.

## Datasets & Imports

`/datasets` uses Overview KpiCards, Alerts fields and existing scoped GSAP motion. Five workspaces cover batch metadata, profile/mapping, 500-row checkpoints, reconciliation and offline raw-amount replay. Institution, update-window, source-table, state and literal-currency fixture filters operate on metadata only. Tables scroll internally and layout grids stack on narrow screens.

The provided `BATCH-OFF-001` metadata and `REPLAY-OFF-001` three-row excerpt are preserved. Additional access partitions, batches, checkpoints and amount fixtures are explicitly invented demo extensions. Access partitions do not establish routing or account ownership. Native file selection reads size/extension only, retains no original name/path and never reads or uploads file contents. Declared row counts are unverified. Metadata validation enforces the documented 64 MiB / 100,000-record bounds and rejects 2 GB with no chunk/import-support claim. Adding a demo batch requires the known 18,000-byte / 12-row invented sample; selected real-file metadata cannot become staging data.

Root-owned dataset state survives navigation. Only the shared Data Operator persona can create invented intake metadata, advance simulated checkpoints, reconcile counts or run invented replay. The root rechecks capability, subject and stored access partition at execution. Resume validates the committed row ordinal and workspace version; duplicates are accounted without inserting them again. Replay requires complete reconciled counts, evaluates unique invented staging rows and keeps exact totals separate by literal currency. Member rows, invalid amounts and unconfigured currencies remain unavailable. Reports retain their manifest/mapping/threshold references; the supplied three-row excerpt is never represented as a complete twelve-row report. Monetary reconciliation and real source semantics remain unavailable. No canonical transaction, risk assessment, job, alert, account, graph, push or payment side effect occurs. Real browser writes and raw staging access are not connected. TypeScript, logic tests, build and server rendering verify the implementation; browser visual review stays with the user without Playwright.

## Health, Notifications and Audit

These three routes retain shared Overview KpiCards, record panels, Alerts fields and scoped GSAP transitions. Common scope controls follow the root demo context. Tab controls support arrow/Home/End navigation, grids stack on narrow screens and wide tables scroll internally. Browser visual review stays with the user; no Playwright is used.

Health separates synthetic coverage from live liveness/readiness. Source semantics, verified account identity, replica lag, online feature watermarks, model serving, capacity and recovery objectives remain unverified or null with reasons. Supplied risk-job result references retain their original opaque policy/receipt fingerprints; accepted policy-selection previews retain their frozen full policy hash and do not establish worker execution. Local refresh records inspection only. Overview's unobserved worker freshness now displays unavailable rather than a fabricated stale-job count.

Notifications builds explicitly invented sandbox intents and attempts from scoped alert references. Provider acceptance, device receipt, opened, notification acknowledgement and actual alert workflow are independent. Lock-screen preview contains generic text plus an opaque reference only. No provider send, browser permission request, subscription operation, escalation or external delivery worker is invoked. Subscription, push/offline acceptance and escalation policy evidence remain planned or unavailable.

Audit projects structural allowlisted metadata from alert, case, policy, offline dataset and local access histories. Source capability and institution checks run before filtering and export; operations-only users cannot inspect case/alert/policy audit sources merely because they can read operational history. Note text, rationale, credentials and raw source details are excluded. Missing event times and expected revisions are not invented. Auditor and Network Supervisor can prepare at most 100 distinct authorized visible rows as synthetic CSV; formula-like cells are escaped and a separate local preparation event is appended. Root state rechecks current authorization and source rows before export. Wide-scope export metadata stays hidden after scope narrows. Preparation does not prove browser receipt, production export authorization, protected archive or administrator-resistant/WORM immutability. No edit/delete audit action is offered.
