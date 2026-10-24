# Figma Make — LMPS Risk Portal / Master Prompt

Copy everything between START PROMPT and END PROMPT into Figma Make. Attach `reference-admin-panel.jpg`. This prompt is self-contained: Figma Make cannot read the local project folder. The other reports provide the source trace and refinement context. All routes and prototype fixtures below are design proposals; do not treat them as verified backend API contracts.

--- START PROMPT ---

Build a polished, interactive desktop-first web portal called **LMPS Risk Portal** for a multi-institution payment network monitoring Fraud, Mule activity and AML signals. Use React + TypeScript with reusable components, CSS custom properties/Tailwind and local deterministic mock services. Implement working navigation, filters, detail views and investigation/governance interactions. Create an operational analyst tool with dense tables and explainable evidence.

The attached screenshot is the visual reference. Reconstruct its dark charcoal/navy surfaces, quiet borders, amber active navigation, compact headers, inset dark buttons, localized colored glows, analytical charts, dense full-width history table and anchored user panel. Translate its visual grammar into financial monitoring. Replace quest/coin/game content with risk work queues, assessments, policy governance, ingestion and case review. Keep decorative glow inside cards and behind content; use a single purple spotlight panel for case workload or data quality rather than making every surface purple.

## Product facts and boundaries

The documented state as of 23 October 2026 is a **local synthetic backend MVP**, including independent policy approval, frozen risk jobs, assessments, alerts and cases. The browser portal is an implementation target. A local TCP demo is documented; this design task does not connect to it. Do not present the full future platform as deployed or production ready. The 27.2% engineering progress reported in planning is not a system-health score and should not become a KPI. The five-million-payments/day figure is a capacity target, not observed throughput.

Display a compact persistent **Synthetic workspace** chip and a data-as-of timestamp. Data-source badges must distinguish Synthetic, Offline staging and Planned. Prototype service success means local demo state only. Use a dismissible concise environment information panel when needed; keep normal screens focused on analyst work.

Account identity and masking boundaries are unresolved for real source data. Any account/network demo is explicitly invented and unresolved. Do not infer a verified account from a masked string, routing member, QR value or raw account field. No controls execute a payment, block an account, send a real notification or enable real data connections.

Fraud/Mule/AML scores are separate 0–1 indices, not probabilities, legal findings or calibrated accuracy. Format values as `0.84 / 1.00`, with a visible “Index” label and tooltip. Unknown/unavailable is `—` plus a reason, never zero. Coverage is a separate field. A threshold belongs to a versioned synthetic policy and is not a legal reporting threshold. Severity is separate from risk dimension.

## Visual system

Reference image: 736 × 1408 pixels, sidebar approximately 140 image pixels, topbar approximately 32, main starts x156 and ends x720. It is a compressed illustration; use a readable 1440 × 1000 desktop reconstruction rather than copying its tiny type.

Implement these CSS variables consistently:

```
--color-bg-canvas: #0c0c14;
--color-bg-sidebar: #131521;
--color-bg-topbar: #0d1017;
--color-bg-panel: #14141e;
--color-bg-elevated: #1b1c2a;
--color-border-subtle: #252636;
--color-border-strong: #6c7292;
--color-text-primary: #f4f4f7;
--color-text-secondary: #b5b6c7;
--color-text-muted: #8d90a6;
--color-accent-amber: #f6b73c;
--color-accent-cyan: #24c7df;
--color-accent-violet: #ad6cff;
--color-accent-pink: #ef5aa6;
```

Use critical #fb7185, high #fb923c, medium #f6c453 and low #34d399 as status accents, each with icon + text and a muted translucent background. Keep semantic mappings stable. Use Fraud amber, Mule violet, AML cyan for categorical dimension markers; a violet Mule label does not mean high severity. Normal surface borders are subtle; required control boundaries use --color-border-strong (#6c7292). Focus rings must be brighter and satisfy visible keyboard focus; do not use a subtle border as the only focus indicator.

At 1440 width: sidebar 264, topbar 64, page inset 24; usable content width 1128. Use a 12-column grid with 16px gutters (four KPI cards of 270px, three chart panels of about 365px), section gaps 24 and panel padding 16–20. Shell sidebar and topbar remain anchored while main content scrolls. Expand the reference's vertical dashboard rhythm into a useful first viewport. Page title 28/36 weight600, section title16/24 weight600, body14/22, table13/20 and metadata12/18. Use a practical sans stack supporting Lao and English: IBM Plex Sans / Noto Sans Lao / system fallback; tabular numbers and monospace for opaque IDs. Original font identity is unknown.

Panel radius12, control radius8, badges radius999, 1px borders. Cards have quiet black shadows and very faint top-right glows. Recommended glow: radial-gradient(circle at 100% 0%, rgba(173,108,255,.14), transparent 65%). Primary actions use amber background with dark text. Secondary actions use inset charcoal gradient, light border and white text. Danger uses rose styling only for appropriate destructive demo operations; no invented money enforcement actions.

At1024–1279 use an80px icon rail or user-expanded264px sidebar with accessible labels/tooltips, two KPI columns and two chart columns. At768–1023 use a navigation drawer and two KPI columns with stacked details. Below768 use a navigation drawer, one-column layout,16px page padding and a horizontally scrollable data table within its own container. Keep action targets at least40px desktop/44px touch. Avoid global horizontal page overflow. Charts need axis labels, units, legend, keyboard-accessible values or an equivalent data table, and explicit missing-data gaps. Respect reduced motion; use160ms control transitions and200ms drawer transitions, limited to opacity/transform where possible.

## Shared application shell

Top left: amber rounded mark and “LMPS Risk”, subtitle “Monitoring & Investigations”. Navigation groups use small uppercase muted labels. Active navigation has warm amber text/icon, tinted background and quiet amber border. Sidebar footer: invented user “Noy Analyst”, role switch for demo, institution scope and profile control.

Topbar: breadcrumb/title on left, authorized institution selector, time range, language selector `English / ລາວ`, environment chip, alert bell and profile menu. Search should search the current workspace's visible fixture IDs only. Institution selector lists only allowed demo institutions; changing it updates all visible datasets and counts. Viewing all institutions requires a separate Network Supervisor persona. Keep selection stable across navigation.

Language uses locales `en` and `lo` (`la` may normalize to `lo`). Language change affects labels only, never IDs, hashes, codes, amounts or indices. Supply a small shared translation dictionary for navigation, state labels and principal actions. Lao copy is draft until a human language review; allow a tooltip or settings note. English labels may remain where full translation is unavailable with a clear fallback.

Use this exact navigation and client route map (15 primary destinations):

- Overview: `/overview`.
- Monitoring: Transactions `/transactions`; Assessments `/assessments`; Alerts `/alerts`; Network Explorer `/network`.
- Investigations: Cases `/cases`; Outcomes & Label Review `/outcomes`.
- Detection: Detector Catalog `/detectors`; Risk Policies `/policies`; Evaluation & Models `/models`.
- Data & Operations: Datasets & Imports `/datasets`; Data & System Health `/health`; Notifications `/notifications`; Audit `/audit`.
- Administration: Access & Scope `/access`.

Primary nav items resolve to real screens. Detail routes such as `/alerts/:id`, `/cases/:id`, `/transactions/:id` and `/policies/:id` are client design choices, not backend endpoint claims. Use query parameters for filters and tabs where practical. Gated modules open an informative unavailable/planned screen with prerequisites; avoid dead links.

## 1. Overview

Create a concise header “Network risk overview”, subtitle with environment/data coverage and last refresh. Below it, a shallow dark hero/status banner with subtle purple glow: “Review signals. Trace evidence. Resolve cases.” Include authorized institution scope, data-as-of and an “Open alert queue” action. Avoid a giant marketing hero.

Four KPI cards: Transactions in selected range, Open alerts, Active cases, Assessment coverage. Each has label, current value, unit or denominator, brief scope note and a small optional trend. Derive values from the filtered mock dataset. Never fabricate percentages or trend comparisons when there is no previous cohort. Clicking a KPI opens its filtered list.

Three chart panels in row one: assessed transactions over time (amber line), alerts by risk dimension (separate bars with note that multi-dimension alerts may overlap), and severity distribution (labeled bars). Row two: institution × day activity heatmap using invented codes, investigation workload trend (pink area) and one purple-glow donut card showing reviewed vs unreviewed alerts with numerator/denominator. Every panel has a useful empty/partial state. Do not reproduce fake CPU/storage/coins as business KPIs.

A full-width “Recent high-priority alerts” table follows: alert ID, transaction, institution, dimensions, highest index or unavailable, severity, state, assignee/case link if any, updated time and View action. Show the policy version used. Bottom three compact workflow cards: Pending policy approvals, Dataset quality exceptions and Stale jobs. Each links to the actual filtered destination.

## 2. Transactions

Filter by bounded date range, institution, lifecycle state, currency, assessment availability and source provenance. Use exact amount strings with currency; do not sum different currencies. Preserve leading zeros in identifiers. Table shows ID, revision, source reference, time with timezone confidence, amount/currency, sender/receiver display reference, lifecycle, Fraud/Mule/AML indices and coverage. Keep unresolved account identity visibly unresolved.

Detail tabs: Summary, Risk evidence, Revision history and Source lineage. Display occurred/observed/recorded times separately when known; unknown timezone is a warning state, not silently converted. An assessment always links to the particular frozen revision/policy and must not be relabeled as current merely because another revision appears. Separate raw staging rows from canonical synthetic transactions.

## 3. Assessments

Read-only assessment list/detail with revision, mode, policy/catalog/engine version, input fingerprint, three dimension indices, reasons, coverage and availability state. Evidence table: detector code, feature/window, observed value, configured condition, result and limitation. Features not supplied remain unavailable. Do not invent all fifteen real detector definitions: use a few explicitly labeled demo examples and a catalog contract for fifteen detectors reported in the plan.

“Compare assessments” selects compatible synthetic runs and shows side-by-side dimensions/reasons. A “Decision integration” tab opens a Planned state explaining that pre-transfer binding, expiry, authority and LMPS staging integration are unresolved. Do not show approved payment execution or an actionable Hold/Block switch.

## 4. Alerts

Inbox tabs Open, Acknowledged and Reviewed, plus All. Filters severity, dimension, institution, date and case linkage. Selecting a row opens a substantial evidence drawer or detail page. Include frozen assessment/policy/revision links, stable reason codes, source confidence and review history. Acknowledge is a durable explicit demo action. Review requires selecting suspicious / legitimate / unknown and rationale. Use exact states `open → acknowledged → reviewed`. Do not add an unverified Alert reopen flow.

Show “Analyst opinion · unverified” after review, never “crime confirmed”. Unknown remains unknown. Create case / Link to existing case opens a scoped selector. Linking to a case does not acknowledge or review the alert automatically. One alert has at most one owning case in this local model; surface an existing case link and reject duplicate ownership.

## 5. Network Explorer

A bounded invented graph illustrating a money-path investigation. Controls: selected time window, dimension, max hops/nodes and institution scope; highlight time order and currency on edges. Display “Synthetic network · account identity unverified” and visible coverage/truncation indicators. Clicking a node opens a panel of invented reference metadata and linked transactions. Distinguish routing institution from verified account ownership. No graphs from real account digits, no unbounded traversal and no claim to observe funds outside the network.

## 6. Cases

Queue filters state, assignee, institution, dimension and updated time. Detail includes summary/header with revision, linked alert evidence, assignment, notes, chronological timeline and separate Fraud/Mule/AML outcomes. Exact state machine: `open → in_review → closed`, with an explicit permitted Reopen action returning to review workflow. The exact backend target for reopening is to be confirmed; the prototype may return to `in_review` and label this a proposed interaction.

Model a maximum of20 linked alerts, unique alert ownership, required permissions and optimistic version checking. Notes append to history. Save uses the current expected revision; simulate a409 conflict with Reload latest and review changes, never silent overwrite. Link/assignment/outcome/close/timeline changes should be atomic in local mock state. A failed audit demonstration rolls back the action. A double click with the same request key returns the prior result rather than creating two events.

Outcomes per dimension are analyst opinions suspicious / legitimate / unknown; required rationale and frozen evidence references. Show review status `analyst_reviewed`, verification `unverified` and `training_eligible=false`. Changing assignee, adding evidence or reopening requires fresh outcomes; retain prior opinions as historical, visibly stale. Close requires fresh outcomes according to the prototype's explicit validation. Closing does not mark all dimensions legitimate. Attachments are a Planned capability, not a working backend upload.

## 7. Outcomes & Label Review

Separate **Analyst opinions** (local backend scope) from **Label adjudication** and **Sampling/QA** (planned). Table includes case/dimension/opinion, reviewer, evidence version, review status, maturity and training eligibility. Present `training_eligible=false` on current fixtures. Future `confirmed_suspicious` / `confirmed_legitimate` vocabulary belongs to a separately governed target label workflow; do not map current analyst opinions to these automatically. Explain that unreviewed or unknown cannot be a negative training example. Dataset export is gated; no pretend downloaded production labels.

## 8. Detector Catalog

Catalog groups Fraud/Mule/AML. Card/table shows stable code, short name, version, prerequisites, conditions, available inputs and limitations. Use bilingual labels independently of stable codes. Search and dimension filters work. Detector detail shows an explicit restricted condition builder example, not arbitrary JavaScript/Python evaluation. Catalog has fifteen reported executable synthetic detectors; mark illustrative content clearly rather than inventing authoritative names.

## 9. Risk Policies

List immutable versions and lifecycle state. Detail tabs Conditions, Versions, Comparison, Approvals and Activation history. Build a bounded typed condition form with numeric threshold + currency validation; exact backend authoring fields remain adapter-specific. Editing a frozen version creates a new draft, never changes prior assessments.

Model `draft → submitted → approved / rejected`. A creator or submitter cannot approve their own policy. Role switch lets a separate checker approve and records actor/rationale/time. Comparison accepts1–20 frozen synthetic assessment runs, shows separate dimension deltas, unavailable values and volume implications, and creates no operational assessment/alert. Comparison is advisory, not an automatic approval guarantee.

Activation and rollback require approved policy, explicit namespace/currency binding and expected generation. Simulate a generation conflict and require refresh. A new activation does not change an already enqueued job: detail shows its frozen approved policy/hash and selection receipt. Do not silently imply approved effective-date scheduling or a production policy.

## 10. Evaluation & Models

Create a useful planned workspace with tabs Baseline comparison, Evaluation datasets, Registry and Serving health. Show prerequisite checklist: eligible mature labels, temporal split, historical availability evidence and pinned model artifacts. Unavailable precision/recall/PR-AUC/FPR/calibration values show `—` with reason. Do not invent95% accuracy, prevented losses or a trained model. FastAPI diagnostics do not mean deployed inference. A labeled illustrative model card may show the structure without fake measured metrics.

## 11. Datasets & Imports

Tabs Intake & profile, Imports & reconciliation and Offline replay. Source table choices: `transfer`, `transfer_hist`, `transfer_old`, `member`. UI is a proposed guided wrapper around private CLI workflows: there is no verified browser upload/import/replay write API. Use a file-picker with invented local fixture metadata for demo only. Never display local secret paths or original account payloads.

Intake shows schema/value/key quality, counts, opaque code references, manifest/fingerprint and draft mapping readiness. Current file bound64MiB and100,000 records. Validate before continuing and reject a2GB file with “Split/import support not yet implemented”; do not pretend browser chunking proves backend support. Imports display500-row checkpoints, replay/dedup, attempt history, complete/reconciled state and resumability as reported backend characteristics.

Offline replay requires complete reconciled staging plus explicit simulation thresholds per literal currency. It compares raw recorded amount only and writes a private simulation report. Results are matched / not_matched / unavailable. Member datasets and unconfigured currencies are unavailable. No lifecycle/reversal/timezone inference, no canonical transactions, no operational risk job, no alerts, no verified account graph and no push/payment effects. `not_matched` does not mean safe. Keep a visual divider between Offline replay and Synthetic risk jobs.

## 12. Data & System Health

Tabs Source readiness, Data quality, Features, Risk jobs and Platform status. Show only actual mock telemetry as mock; source connections and CDC adapters are not live. Risk jobs list frozen revision/context/policy, attempt, lease/retry timing, checkpoints and status; a detail panel shows immutable input and attempts. Job mutation controls are CLI-only in the documented local implementation: prototype enqueue/retry actions, if supplied, must say “Demo simulation · future UI adapter” and not imply an existing HTTP endpoint. Prefer read-only jobs for the initial build.

Show source semantic/identity gates as unverified, not healthy. Online feature freshness/model serving are unavailable. An infrastructure issue links to its evidence/status, without a huge navigation tree for every framework. Capacity displays a target label only; no fabricated production throughput or “all systems operational”.

## 13. Notifications

Tabs Durable inbox, Delivery attempts, Escalation and Device/subscriptions. Current alert inbox can be previewed; delivery/subscription views are Planned or sandbox examples. Provider accepted, optional device receipt, opened and acknowledged are distinct concepts. An acknowledged alert does not prove a push was delivered. No real send action. Preview lock-screen content as “A risk alert requires your review” plus opaque reference only, without account/name/amount/evidence. Explain Add to Home Screen is the selected application direction; do not claim service-worker/offline/push support is already implemented.

## 14. Audit

Append-only event timeline/table with actor, action, scoped target, expected/actual revision, correlation/request ID, reason and timestamp. Filter by case/policy/alert ID, actor, action and bounded date. Detail shows safe structural metadata, avoiding tokens/raw account payloads. Mutating mock actions create linked audit events; do not offer Edit/Delete audit. Bounded export may create a clearly labeled synthetic CSV of currently scoped visible rows with an export audit event; no full dataset extraction.

## 15. Access & Scope

Read-only current persona, allowed institutions, capability matrix and authentication/session summary. Role names Analyst, Reviewer, Policy Maker, Policy Checker, Operator, Auditor and Network Supervisor are proposed demo personas, not a verified production RBAC directory. Map actions to capabilities in one mock authorization adapter, and check it again at action execution; hiding buttons alone is insufficient. Unauthorized routes show permission denied. Role switch is labeled “Demo persona” and changes mock capability scope; it never creates real users/roles/grants. Secrets/IdP configuration and real user provisioning are out of scope.

## Shared interaction and state requirements

Use shared DataTable, FilterBar, StateBadge, DimensionIndex, CoverageIndicator, EvidenceDrawer, Timeline, ConfirmDialog, ConflictBanner, ScopeSelector, EnvironmentBadge, ChartPanel and AsyncState components. Provide skeleton/loading, no data, no filter results, recoverable error/retry, stale with data-as-of, partial coverage, permission denied, immutable-version and conflict states. Empty charts do not show invented lines.

Create a small QA state menu for demo scenarios instead of scattering debugging controls through ordinary screens. Demonstrate stale data, missing Mule inputs, permission change, a409 conflict, policy self-approval rejection and oversize dataset rejection. Keep selection/filter/locale in local application state or local storage; reset demo restores deterministic fixtures. Never store secrets.

Use one connected deterministic fixture chain: synthetic `TX-SYN-1001` revision2 → `ASM-SYN-1001` using `POL-SYN-03` → `ALT-SYN-1001` → `CASE-SYN-1001`. Policy binding namespace `synthetic-demo`/currency `SYN`, generation3. Scores Fraud0.84, Mule unavailable due to unresolved identity, AML0.62; coverage and counts derive from the fixture's declared inputs. These are invented indices. Graph uses separate unverified invented nodes. Keep offline batch `BATCH-OFF-001` completely outside this chain.

Initialize one open and one acknowledged unlinked alert, a separate submitted policy owned by a Maker persona, a case in review and a distinct closed case with unknown outcomes. Use several dates/institutions/currencies for filters, but do not mix amounts across currencies. Keep IDs readable and reusable across screens. Prefer a small consistent dataset over thousands of disconnected decorative rows. Use the supplied fixture JSON if attached; it is a prototype view model, not a backend schema.

If time or context limits require incremental construction, fully implement the shell + Overview + Alerts + Case detail first, preserving the navigation, tokens, data model and gates above. Then add Policies, Transactions/Assessments, Data/Operations and the planned modules. Do not collapse the request into a single static dashboard.

## Acceptance walkthrough

1. Open Overview at1440px: reference-derived dark shell, four KPI cards, three charts, one restrained purple spotlight and recent-alert table; no clipped labels.
2. Change institution/date and see list/count/chart scope update consistently. Open the filtered alert queue from a KPI.
3. Inspect ALT-SYN-1001, read frozen revision/policy/reasons and unavailable Mule input; acknowledge explicitly and follow its existing CASE-SYN-1001 link, then add a note, record three dimension opinions and close after valid review. Use unlinked ALT-SYN-1002 or ALT-SYN-1007 to test Create/Link Case. Audit links trace every step.
4. Try to claim an already owned alert and see conflict; simulate stale case revision and refresh without silent overwrite. Add evidence or reassign a case and observe prior outcomes become stale.
5. Submit a draft policy as Maker; self-approval fails. Switch to separate Checker, approve, compare compatible frozen runs and activate in synthetic scope with generation validation. Existing jobs retain frozen policy.
6. Open Datasets: a2GB file is rejected, a bounded demo fixture can progress through profile/reconciliation, and Offline replay stays a simulation with no alert count change.
7. Switch locale to Lao, preserve IDs/numbers/codes and back. Test permission denied and unavailable model/notification/decision states.
8. At1024/768/390 widths navigation, drawers and tables remain usable. Keyboard can reach menus, row actions, tabs and dialogs; focus returns to the opener and Escape closes dialogs.

Finish with functional components, consistent tokens, no dead navigation and no claim of real backend connection or production accuracy.

--- END PROMPT ---
