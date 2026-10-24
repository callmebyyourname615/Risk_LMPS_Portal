# Prompt แบบแบ่งรอบสำหรับ Figma Make

เริ่มด้วย `04-FIGMA-MAKE-MASTER-PROMPT.md` และแนบ `reference-admin-panel.jpg` ก่อน หากผลสร้างยังไม่ครบ ให้ใช้ prompt ด้านล่างทีละรอบใน **โปรเจกต์เดิม** ไม่เริ่ม shell ใหม่ทุกครั้ง แนบ `06-prototype-fixtures.json` และ tokens ได้หาก UI รองรับ มิฉะนั้น master มีค่าหลักครบแล้ว

Prompt ด้านล่างเป็นภาษาอังกฤษเพื่อคงชื่อ contract/state ให้สม่ำเสมอ คำอธิบายไทยใช้ช่วยตรวจงาน ไม่ใช่ข้อกำหนด backend เพิ่มเติม

## รอบ 1 — โครงและความเหมือนภาพ

```text
Continue the existing LMPS Risk Portal. Implement or refine the shared shell and Overview first. Keep every route from the master prompt. At 1440px use sidebar264, topbar64, outer24, card gaps16 and section gaps24. Canvas #0c0c14, sidebar #131521, topbar #0d1017, panels #14141e, quiet border #252636. Amber active nav, primary text #f4f4f7, secondary #b5b6c7, muted #8d90a6. Match the reference's contained colored glows, dense table, small section headers and anchored user footer. Use four KPI cards, a three-column analytics row and one purple spotlight card. Preserve readable14px body type, not the JPEG's tiny text. Avoid an oversized marketing hero. Make every navigation item open a page. Derive counts from scoped fixtures and show Synthetic workspace/data-as-of. Provide responsive sidebar rail/drawer. This round is complete when the first desktop viewport and390px navigation are usable and visually coherent.
```

ตรวจ: ภาพรวมมีลำดับใกล้ภาพต้นแบบ แต่เนื้อหาเป็น monitoring, ไม่ติด label Live/Production ที่ไม่มีหลักฐาน

## รอบ 2 — Transactions / Assessments / Evidence

```text
Implement Transactions and Assessments with connected fixtures. Add bounded date/institution/currency/lifecycle filters and local pagination, preserve exact amount strings and identifiers, and keep account identity unresolved. Transaction detail shows selected revision, separate occurred/observed/recorded times and source lineage. Assessment detail links the frozen revision/policy/catalog/engine/input fingerprint. Display Fraud/Mule/AML separately as0–1 indices, never probabilities. Mule=null must show unavailable plus reason, never0. Build an evidence drawer with stable example codes explicitly labeled illustrative, prerequisites and limitations. Unsupported pre-transfer decisions stay Planned. Every evidence link resolves to a real client screen. Do not invent backend endpoints.
```

ตรวจ: เปลี่ยนภาษาไม่เปลี่ยนคะแนน/code/hash; revision ใหม่ไม่แก้ผลประเมินเก่า

## รอบ 3 — Alert → Case → Opinion → Audit

```text
Implement connected Alert and Case workflows on local deterministic state. Alerts: open→acknowledged→reviewed, explicit acknowledgement, analyst suspicious/legitimate/unknown review. Cases: open→in_review→closed and permission-gated reopen; exact backend reopen target remains unverified, so label the prototype choice. Support scoped assignment, append-only notes, up to20 unique-owned alerts, separate dimension outcomes and revision checks. Case linking does not acknowledge/review the alert. Preserve history and mark prior outcomes stale after assignment/evidence/reopen. Current opinions are analyst_reviewed/unverified/training_eligible=false. Closing never makes unknown legitimate. Use atomic local updates and an audit event for every successful mutation. Duplicate request returns the existing result; failed audit rolls back; stale revision shows409/reload. Test the unlinked alert fixture for Create/Link and the already-owned alert for conflict. Attachments and label export stay Planned.
```

ตรวจ: เปิด alert1001 ไป case1001 ได้; alert1002/1007 ใช้ทดสอบสร้าง/เชื่อม Case ใหม่, case1003 ปิดด้วย unknown ได้โดยไม่ถูกนับปลอดภัย

## รอบ 4 — Policy governance

```text
Complete Detector Catalog and Risk Policies. Do not invent authoritative definitions for all15 detectors; show clearly illustrative examples and preserve the reported catalog size separately. Use a typed threshold/currency form, not an arbitrary code editor. Immutable versions move draft→submitted→approved/rejected. Creator or submitter cannot approve their own version; demonstrate separate Maker/Checker personas. Comparison accepts1–20 frozen synthetic runs, preserves unavailable values, and creates no operational assessments/alerts. It is advisory. Activation/rollback binds explicit namespace/currency with expected generation and conflict refresh. Frozen jobs retain their approved policy/hash/receipt after activation changes. Effective-date scheduling and production approval remain pending. Every successful action creates audit history.
```

ตรวจ: ลอง self approval ต้องไม่สำเร็จ; comparison ไม่ทำให้ Alert count เพิ่ม

## รอบ 5 — Offline data / Jobs / Health

```text
Build Datasets & Imports tabs for profile, import/reconciliation and offline replay. This is a proposed UI wrapper over private CLI, not a verified browser upload API. Enforce64MiB/100000 rows and reject2GB. Show500-row checkpoints and complete/reconciled status. Replay uses explicit literal-currency raw-amount simulation only, with matched/not_matched/unavailable results. Member and unconfigured currencies are unavailable; not_matched is not safe. Keep offline staging separate from synthetic operational transactions/jobs/alerts/graph. No replay side effects. Show Risk Jobs read-only with frozen inputs, attempts and retry/lease/checkpoint detail; status vocabulary is a proposed view model where not specified in the plan. Health tabs show source identity/semantics unverified and online features/models unavailable, not fake green telemetry. Do not add live CDC or external connections.
```

ตรวจ: Offline Replay ไม่เพิ่ม Risk Assessment/Alert/Case, ไม่มีอ้างว่ารองรับไฟล์2GB แล้ว

## รอบ 6 — Future modules and honest availability

```text
Complete Network Explorer, Outcomes & Label Review, Evaluation & Models and Notifications. Network is an explicitly invented bounded graph with time/currency context, max hops/nodes and partial/truncated markers; no verified account identity. Separate analyst opinions from future adjudication/sampling/mature training labels. Model metrics remain unavailable without labels/evaluation; do not show invented accuracy/calibration/loss prevented. Notifications distinguish provider accepted, optional receipt, opened and acknowledged and keep delivery/subscription integration Planned or sandbox-only. Lock-screen preview contains only generic text/opaque reference. Add to Home Screen is a chosen direction, not proof of service-worker/offline/push support. Planned pages should explain the next prerequisite while remaining useful and navigable.
```

## รอบ 7 — Permissions / Audit / Language

```text
Finish Access & Scope and Audit. Proposed demo personas map to centralized capabilities and allowed institutions; check again when executing actions and when resolving direct routes. Persona switching is demo-only. Institution changes clear incompatible selections and update counts/lists/charts together. Auditor can inspect/export only bounded scoped synthetic rows; audit records cannot be edited/deleted. No tokens/raw account payloads/private paths in detail. Add shared English/Lao navigation/action translations with a visible fallback for untranslated copy and a draft-translation note in settings. Locale cannot change IDs/codes/hashes/money/indices. Persist safe preferences only and include Reset demo. Do not imply UI-only authorization protects a future backend.
```

## รอบ 8 — ตรวจครบและเก็บรายละเอียด

```text
Audit the existing prototype against the master acceptance walkthrough; fix gaps without replacing its design. Verify15 routes, overview derived counts, linked transaction/assessment/alert/case evidence, frozen policy identity, unavailable scores and permission scope. Exercise alert ownership conflict, stale case revision, outcome invalidation, self-approval rejection, activation generation conflict, replay no-side-effects and2GB rejection. Use one QA scenario menu for loading/empty/no results/error/retry/stale/partial/403/409 states. Check keyboard focus, Escape, dialog focus return, labels, table headers, chart text equivalents, contrast and reduced motion. At1440,1024,768,390 ensure no clipped controls or global horizontal overflow. Keep the reference's dark dense navy/amber/glow identity. Report remaining prototype-only and Planned areas honestly; do not claim backend connection or production readiness.
```

## เมื่อ Figma Make ทำหน้าจอผิดโทน

```text
Keep the current functionality and content. Refine styling toward the attached reference: darker #0c0c14 canvas, #131521 sidebar, #14141e cards, thin #252636 borders, amber selected navigation and small contained card glows. Reduce oversized headings/hero height, restore the dense analytical table and compact section rhythm. Use violet as one spotlight, cyan/pink/amber as restrained chart accents. Keep text readable and controls accessible. Do not replace the entire interface with generic white cards or a neon full-page gradient.
```

## การต่อ API ภายหลัง

อย่านำ route จาก menu ไปถือเป็น API route โดยตรง เอกสาร `02-architecture-data-and-api.md` §7 ระบุ Proposed API Surface ขณะที่งาน No.30–38 มีขอบเขต local APIs/CLI ที่ต่างกัน ก่อนต่อ backend ต้องอ่าน contract จริงตาม source links ในรายงาน01/02 และ map ผ่าน adapter ตรวจ authentication, institution scope, immutable version, idempotency, CAS, bounded pagination และ error semantics แยกจาก mock
