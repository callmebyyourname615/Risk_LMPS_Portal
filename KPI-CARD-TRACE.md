# Summary card trace — LMPS Risk Portal

Checked by source review and server rendering with browser media-query state stubbed. Browser visual review remains with the user; no Playwright or pixel-match claim. This trace did not change card styles.

## Main routes

All 15 primary routes render four summary cards in their default authorized demo view. Detail, loading and permission-denied compositions may differ.

| Route | Page | Cards rendered | Component |
|---|---|---:|---|
| `/overview` | Overview | 4 | Shared `KpiCard` |
| `/transactions` | Transactions | 4 | Shared `KpiCard` |
| `/assessments` | Assessments | 4 | Shared `KpiCard` |
| `/alerts` | Alerts | 4 | Shared `KpiCard` |
| `/network` | Network Explorer | 4 | Shared `KpiCard` |
| `/cases` | Cases | 4 | Shared `KpiCard` |
| `/outcomes` | Outcomes | 4 | Shared `KpiCard` |
| `/detectors` | Detector Catalog | 4 | Shared `KpiCard` |
| `/policies` | Risk Policies | 4 | Shared `KpiCard` |
| `/models` | Evaluation & Models | 4 | Shared `KpiCard` |
| `/datasets` | Datasets & Imports | 4 | Shared `KpiCard` |
| `/health` | System Health | 4 | Shared `KpiCard` |
| `/notifications` | Notifications | 4 | Shared `KpiCard` |
| `/audit` | Audit | 4 | Shared `KpiCard` |
| `/access` | Access & Scope | 4 | Shared `KpiCard` |

## Shared implementation

- Shared component: src/App.tsx:210. Icon, label, value, detail, tone and optional navigation action.
- Summary adapter: src/App.tsx:402. Maps scoped metrics into the same KpiCard.
- Base surface, icon, tone, contained glow and layout: src/index.css:95–96.
- Records overrides: src/monitoring-polish.css:23–28.
- Alerts overrides: src/alerts.css:3–4. Network overrides: src/network.css:17–21.

## Remaining sizing differences

| Group | Desktop minimum height | Value size | Label / detail |
|---|---:|---:|---|
| Overview base | 134px | 28px | 11px / 10px |
| Records summary pages | 124px | 30px | 12px / 11px |
| Alerts | 124px | 30px | Base 11px / 10px |
| Network | 124px | 30px | 12px / 11px |

The component, token family, icon treatment and corner glow are shared. Sizing overrides mean the cards are not identical in every CSS dimension. Metric titles, counts and tones remain specific to the page; unavailable telemetry is not replaced with fabricated zero.

## Detail examples

| Detail route | KPI cards rendered |
|---|---:|
| `/transactions/TX-SYN-1001` | 0 |
| `/assessments/ASM-SYN-1001` | 0 |
| `/alerts/ALT-SYN-1001` | 0 |
| `/cases/CASE-SYN-1001` | 0 |
| `/detectors/DEMO-FRAUD-AMOUNT` | 4 |
| `/policies/POL-SYN-03` | 4 |

Transaction, Assessment, Alert and Case detail prioritize record/evidence panels and dimension indices. Detector and Policy detail retain their catalog summaries. Summary cards should represent useful page-level counts; detail screens should prioritize the selected record.
