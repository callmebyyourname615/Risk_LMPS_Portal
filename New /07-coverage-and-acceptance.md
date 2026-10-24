# ขอบเขตการส่งมอบและเกณฑ์ตรวจ Figma Make

วันที่23 ตุลาคม2026 • ไฟล์นี้แยก **ตรวจเอกสารแล้ว** ออกจาก **ต้องตรวจเมื่อสร้าง UI จริง** ห้ามใช้ checklist หลังนี้เป็นผลทดสอบที่ผ่านแล้ว

## 1. คำขอของผู้ใช้กับสิ่งที่ส่งมอบ

| คำขอ | ผลงาน | สถานะ |
|---|---|---|
| Trace modules/logic จาก `LMPS_Risk/plan` | 01/02 พร้อมเอกสารอ้างอิงและfinding ledger | เสร็จในขอบเขต11เอกสาร; ไม่ได้ตรวจruntime/sourcecodebackendเพิ่มเติม |
| บอกว่ามีเมนูไหนบ้าง | 15primaryroutes + tabs/fields/actions/permissions ใน01 + menuJSON | เสร็จเป็นข้อเสนอUXจากdomainsที่พบ ไม่อ้างเป็นrouterเดิม |
| ถอดdesign tokensจากภาพ | 03รายงาน + JSON/CSS; sampled surfaces/geometry + inferred/proposed tokens | เสร็จสำหรับreconstruction; originalCSS/font/interactionไม่อาจยืนยันจากJPEG |
| เขียนpromptสร้างwebportalด้วยFigmaMake | 04master + 05แยก8รอบ พร้อมreferenceและconnectedfixtures | เสร็จพร้อมคัดลอก/แนบ; ยังไม่ได้ส่งเข้าหรือรันFigmaMake |
| เขียนลงโฟลเดอร์ที่กำหนด | `Inspiration_AdminPanel/New ` | ใช้ชื่อเดิมที่มีช่องว่างท้าย1ตัว; ไม่เขียนทับplan/backend |

## 2. Navigation coverage

| Routeเสนอ | สิ่งที่promptต้องสร้าง | ขอบเขตความพร้อม |
|---|---|---|
| `/overview` | KPI/analytics/queue/workflowlinks | Aggregatesในprototypeคำนวณจากscopedfixtures;ไม่มีproductionmetrics |
| `/transactions` | List/detail/revisions/lineage | Local synthetic revisions/readsตามรายงาน;real-sourcecanonicalmappingpending |
| `/assessments` | Threeindices/evidence/frozenversions | Local synthetic scoring;pre-transferdecisionsเป็นplannedtab |
| `/alerts` | Inbox/ack/review/caselink | Local synthetic state/review;ไม่auto-reviewเมื่อlinkcase |
| `/network` | Bounded invented graph | Verifiedidentity/realtemporalgraphยังgated |
| `/cases` | Assignment/notes/outcomes/history/CAS | Local backendMVP;UI/attachments/productionSOPยังpending |
| `/outcomes` | Opinions/eligibility/adjudicationtabs | Analystopinionsปัจจุบันunverified;labels/adjudicationplanned |
| `/detectors` | Catalog/prerequisites/conditions/limitations | Planระบุ15detectorsแต่ไม่แจกIDครบ;ตัวอย่างต้องติดillustrative |
| `/policies` | Versions/makerchecker/comparison/activation | Local syntheticgovernance;effectivedates/productionpolicygated |
| `/models` | Evaluation/registry/servingreadiness | Eligiblelabels/training/evaluation/modeldeploymentยังpending |
| `/datasets` | Profile/import/reconcile/simulation | CurrentprivateCLI;browseradapterเป็นข้อเสนอ;64MiB/100kไม่ใช่2GB |
| `/health` | Readiness/DQ/features/jobs/platform | Localjobs/readcapabilities;realCDC/features/telemetryไม่ยืนยัน |
| `/notifications` | Inbox/attempt/escalation/subscriptions | Durableinboxกับprovider/device/ackแยกกัน;deliveryplanned/sandbox |
| `/audit` | Scopedappend-onlyaudit/history | Localprotected auditตามรายงาน;exportUIเสนอเฉพาะboundedmock |
| `/access` | Proposedpersonas/capabilitymatrix/scope | Exactproductionroles/IdPdirectoryยังไม่ยืนยัน |

## 3. เกณฑ์ตรวจfunctionalprototypeเมื่อสร้างแล้ว

ทุกข้อด้านล่างยังเป็น **Not run — รอผลจากFigmaMake**

| ID | Scenario | Expected result |
|---|---|---|
| UI01 | เปิด15เมนูและdetaillinks | ทุกrouteมีcontent/stateจริง;ไม่มีdeadbutton/deadnav |
| UI02 | เปลี่ยนinstitution/date | Lists/KPI/chartsใช้scopeเดียวกัน;ไม่เผยข้อมูลนอกสิทธิ์ |
| UI03 | เปิดTX→ASM→ALT→CASE | อ้างtransactionrevision/policy/evidenceชุดเดียวกัน |
| UI04 | Muleinputไม่พร้อม | แสดงunavailable/reason;ไม่เติม0หรือsafe |
| UI05 | Ack/reviewAlert | ทำexplicitตามstate;unknownไม่ใช่legitimate |
| UI06 | LinkAlertเข้Case | ตรวจuniqueownership/20limit;ไม่autoack/review |
| UI07 | Notes/outcomes/closeCase | แยก3dimension;history/auditครบ;training_eligible=false |
| UI08 | Reassign/addevidence/reopen | Prioroutcomesกลายเป็นstale;เก็บhistoryเดิม |
| UI09 | Concurrentrevisionเก่า | 409/reload/compare;ไม่silentoverwrite |
| UI10 | Retryrequestเดิม/auditfailure | ไม่สร้างduplicate;failedatomicmutationไม่เหลือpartialstate |
| UI11 | Makerอนุมัติpolicyตัวเอง | ถูกปฏิเสธ;Checkerแยกactorทำได้ |
| UI12 | Compare1–20runs/activate | Comparisonadvisory/noalerts;generationCAS;frozenjobsไม่เปลี่ยน |
| UI13 | File2GB /เกิน64MiBหรือ100k | แสดงunsupported/limitก่อนทำsimulation;ไม่อ้างรองรับchunkingแล้ว |
| UI14 | OfflineReplay | Matched/not_matched/unavailable;ไม่มีoperationalassessment/alert/graph/pushเพิ่ม |
| UI15 | Model/decision/notificationfuture | แสดงspecificprerequisites;ไม่fakeaccuracy/live/enforcement |
| UI16 | Lao/English | IDs/indices/codes/hash/moneyไม่เปลี่ยน;fallbackอ่านได้ |
| UI17 | Scopeเปลี่ยนหรือpermissiondenied | Directroute/actionตรวจใหม่;ไม่ใช้hiddenbuttonเป็นauthorizationทั้งหมด |
| UI18 | Loading/empty/noresults/error/stale/partial | Statesแยกความหมาย;errorretryได้;staleมีas-of |
| UI19 | Keyboard/dialog/drawer | Focusvisible/taborder/Escape/focusreturn/labelsครบ |
| UI20 |1440/1024/768/390px | Navrail/drawer/gridsอ่านได้;ไม่มีglobalhorizontaloverflow |

## 4. เกณฑ์visualfidelity

เทียบภาพต้นแบบกับผลrenderจริง ไม่ใช้ชื่อธีมอย่างเดียว

- Darkcanvas/sidebar/topbar/panelแยกชั้น: `#0C0C14 / #131521 / #0D1017 / #14141E`
- Amberactiveitemและprimaryaction;bodytextอ่านง่าย;quietborderใช้ตกแต่ง ส่วนrequiredcontrolborderใช้`#6C7292`
- Cardglowเล็กที่corner ไม่ทับเนื้อหา;purpledeepgradientเป็นspotlightหนึ่งจุด;ไม่ย้อมทุกcard
- Dashboardมีcompactstatushero,4summarycards,3analyticscolumns,fullwidthhistorytableและworkflowcards
- Sidebarfooterprofileยึดด้านล่าง;topbarคงที่;bodyเป็นพื้นที่scroll
- ขนาดตัวอักษร14/22และmeta12/18เป็นadaptationให้อ่านได้ ไม่ย่อviewportตามJPEG
- Statesใช้icon/textประกอบสี;dimensionpaletteแยกจากseveritypalette
- อัตราส่วนcontrastที่คำนวณเป็นopaquehexpairเท่านั้น;ต้องตรวจrenderบนgradient/transparencyอีกครั้ง

## 5. Unknowns ที่ยังตั้งใจรักษาไว้

| Unknown | เหตุผล/ขั้นต่อไปหากจะเชื่อมระบบจริง |
|---|---|
| ExactcurrentAPImethod/path/DTO/scopeทุกตัว | PlanระบุcurrentcapabilitiesและtargetAPIsคนละระดับ;ตรวจactualrouter/OpenAPI/ADRก่อนต่อadapter |
| Names/IDs/conditionรายละเอียดของ15detectors | Planยืนยันจำนวน/familiesแต่ไม่ได้แจกครบ;ต้องอ่านcatalogนอกplanหากต้องการexactdefinitions |
| Case reopen destination/validationfieldsทั้งหมด | Planบอกมีreopenแต่ไม่แจกexactwirecontract;prototypeเลือกและติดproposed |
| Approvedroles/entitlements/owners/SOP | Personasในpackเป็นข้อเสนอ;ตรวจIdPclaims/institutionauthorityและpolicyจริง |
| Accountmask/stableidentity/sourcecodes/timezones | ยังunverifiedและผู้ใช้เลื่อนการยืนยัน;อย่าสร้างverifiedentity/enforcementจากข้อสมมติ |
| Realfile/sourceaccessและ~2GBmanualexport | ยังไม่มีไฟล์/path/config;currentlimitsไม่ครอบคลุม |
| Onlinefeature/model/push/decision/productioncapacity | ต้องผ่านphasegates/actualintegration/evaluation/DR/loadevidence |
| Originalfont/CSS/hover/breakpointsจากภาพ | Rasterหนึ่งภาพให้ยืนยันไม่ได้;tokensระบุobserved/estimated/proposed |
| FigmaMakerender/runtime | งานนี้เตรียมprompt;ยังไม่มีUIrender/browseracceptanceจึงไม่ติ๊กUItestsว่าผ่าน |

## 6. การตรวจความถูกต้องของชุดส่งมอบ

รายละเอียดผลตรวจเครื่องอ่านอยู่ใน `09-validation-results.json` ตรวจJSONparse,routecoverage,sourcehashes/unchanged,evidencelinktargets/linebounds,Markdownfences,CSSvariables/braces,tokencontrastpairingsและfixturecross-references/statehistory ไม่ใช่การรันbusinessbackendหรือbrowser

อ่านสถานะล่าสุดจากNo.38.1/READMEหัวไฟล์ก่อนhistoricaltablesเสมอ ผล839testsเป็นสิ่งที่planรายงาน ไม่ใช่ผลทดสอบที่ผู้วิเคราะห์รันในงานนี้
