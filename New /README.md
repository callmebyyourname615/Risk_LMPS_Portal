# LMPS Risk Portal — ชุดวิเคราะห์และ Prompt สำหรับ Figma Make

จัดทำ23 ตุลาคม2026 จากเอกสาร `LMPS_Risk/plan` ทั้ง11ไฟล์ และภาพอ้างอิงที่ผู้ใช้ให้ เป้าหมายคือถอดโมดูล/เมนู/logic และเตรียม prompt สร้าง portal ตามโทนภาพ ไม่ได้แก้ backend หรือสร้างโปรเจกต์ Figma จริงในรอบนี้

## เริ่มใช้งาน

1. เปิด `04-FIGMA-MAKE-MASTER-PROMPT.md` แล้วคัดลอกเฉพาะระหว่าง START PROMPT / END PROMPT ไป Figma Make
2. แนบ `reference-admin-panel.jpg` เพื่อให้เห็นภาพต้นแบบจริง ไม่ใช้แค่คำบรรยาย
3. หากรองรับการแนบเอกสารเพิ่มเติม ให้แนบ `06-prototype-fixtures.json` และ `03-design-tokens.json` ด้วย; master prompt มีค่าหลักครบโดยไม่ต้องอ่าน local path
4. ใช้ `05-FIGMA-MAKE-STAGED-PROMPTS.md` ต่อทีละรอบในโปรเจกต์เดิม แล้วตรวจตาม `07-coverage-and-acceptance.md`

Master prompt เป็นภาษาอังกฤษเพื่อระบุชื่อ state/route/contract ได้ตรงกัน รายงานการ trace และเหตุผลเป็นภาษาไทย UI ที่เสนอรองรับ English/ລາວ ตามทิศทางในแผน คำแปลลาวต้องผ่านการตรวจอีกครั้ง

## ไฟล์และหน้าที่

| ไฟล์ | เนื้อหา |
|---|---|
| `01-module-menu-trace.md` | โมดูลทั้งหมด,15หน้าหลัก,เมนูย่อย,ข้อมูล/การกระทำ/สถานะ/phase และ source references |
| `01-menu-contract.json` | โครง navigation/routes ที่เสนอ สำหรับนำไปใช้ต่อ |
| `02-business-logic-and-workflows.md` | Data paths, state machines, scoring/policy/alert/case/import/replay, API/CLI และข้อจำกัด |
| `03-visual-design-tokens.md` | ถอดภาพ:สี/สัดส่วน/typography/spacing/components/states/responsive พร้อมระดับความมั่นใจ |
| `03-design-tokens.json` | Design tokens แบบ machine-readable |
| `03-design-tokens.css` | CSS variables และ styling primitives สำหรับ reconstruction |
| `04-FIGMA-MAKE-MASTER-PROMPT.md` | Prompt หลักแบบครบในตัว พร้อม15หน้าจอและ interaction contracts |
| `05-FIGMA-MAKE-STAGED-PROMPTS.md` | Prompt ต่อ8รอบและ promptแก้โทนภาพ |
| `06-prototype-fixtures.json` | ข้อมูลสมมติที่เชื่อม transaction→assessment→alert→case พร้อม policy/job/audit และ offline batch แยกต่างหาก |
| `07-coverage-and-acceptance.md` | Checklist ขอบเขต/สิ่งที่ยังไม่พิสูจน์ และเกณฑ์ตรวจผลจาก Figma Make |
| `08-source-manifest.json` | ชื่อไฟล์/จำนวนบรรทัด/SHA-256 ของต้นฉบับ11เอกสารและ1ภาพ |
| `09-validation-results.json` | ผลตรวจความสอดคล้องของเอกสาร/routes/tokens/fixtures และขอบเขตที่ไม่ได้ทดสอบ |
| `reference-admin-panel.jpg` | สำเนาภาพเดิมแบบ byte-for-byte ไม่ได้แก้ภาพ |

## สิ่งสำคัญที่พบ

- ใช้บันทึกล่าสุด No.36–38.1 เป็นหลัก: มี local synthetic Policy→Job→Assessment→Alert→Case แล้ว แต่ไม่ถือว่าผ่าน production/source/identity/online/model gates
- ตารางสถานะและบันทึกเก่าบางส่วนยังตามอัปเดตท้ายไฟล์ไม่ทัน เช่น P06 NOT_STARTED และnative acceptance pending อ่านเป็นประวัติ ไม่ใช้ทับอัปเดตล่าสุด
- Case backend มีแล้วใน local scope; Case UI/attachments/label adjudication/maturity/sampling ยังไม่ครบ Portal browser acceptance ยังไม่ถูกพิสูจน์จาก scopeนี้
- Offline raw staging/replay เป็นอีกเส้นทางหนึ่ง ไม่สร้าง canonical transaction/risk/alert/account graph ไม่ใช่การเปิด real-time sync
- ปัจจุบันกำหนด64MiB/100,000 recordsต่อไฟล์ ยังไม่รองรับข้อมูลประมาณ2GBตามที่ผู้ใช้วางแผน โดยไม่มีชุดงานเพิ่ม
- ค่า score แยก Fraud/Mule/AML เป็น index ไม่ใช่ probability; missing = unavailable ไม่ใช่0; unknown opinion ไม่ใช่ legitimate และ training_eligible=false
- Screenshot เป็น JPEG736×1408: สีวัดได้โดยประมาณ แต่ฟอนต์/CSSเดิม/hover/animation/responsive/RBAC ไม่สามารถยืนยันจากภาพเดียวได้

## วิธีแยกหลักฐาน

**Observed document:** ข้อความ/contractที่พบในplan; ไม่ใช่การรันทดสอบbackendซ้ำในงานนี้  
**Observed image:** รูปทรง/สี/ตำแหน่งที่เห็นหรือsampleจากJPEG  
**Inferred:** ค่าที่ประมาณจากหลักฐาน เช่นสัดส่วน/น้ำหนักฟอนต์  
**Proposed:** ชื่อเมนู15หน้า/routes/personas/UX/fixture/token adaptation สำหรับFigma Make

ใช้ skill `reverse-engineer-anything` ตามที่ผู้ใช้เรียก โดยเลือก ordinary document/source analysis ตามคำแนะนำของ skill ไม่ต้องติดตั้งหรือเชื่อมREA engineสำหรับเอกสารและภาพ ไม่มีการdecompile/รันbinaryหรือเก็บruntime

## ตำแหน่งโฟลเดอร์

โฟลเดอร์ปลายทางชื่อ **`New ` มีช่องว่างท้ายชื่อ1ตัว** ตามที่ผู้ใช้ระบุ ลิงก์จากแชทจึงมี `%20` หรือเว้นวรรคในpathได้ อย่าเผลอสร้างโฟลเดอร์`New`อีกอันเมื่อคัดลอกไฟล์
