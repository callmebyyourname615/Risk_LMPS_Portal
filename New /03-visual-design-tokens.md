# Reverse engineering design tokens — LMPS Risk Portal

วันที่ตรวจ: 23 ตุลาคม 2026 · ขอบเขต: Image #1 เท่านั้น

เอกสารนี้ถอด visual language จากภาพ แล้วปรับสเกลให้ใช้กับ Financial Crime Monitoring Portal ได้จริง ไม่ได้ดึง CSS หรือ Figma ต้นฉบับ จึงไม่อ้างว่าฟอนต์ ระยะห่าง หรือค่า gradient ที่ระบุเป็นค่าต้นฉบับทั้งหมด

## 1. หลักฐานและระดับความเชื่อมั่น

- **VIS-01 — observed:** `/Users/macbookpro/Downloads/Inspiration_AdminPanel/2d3c2fd012bed58b5cc941bcc5ad45a6.jpg`, JPEG, 736 × 1408 px, SHA-256 `1c7ef1b2ec05e03983e912c59985f4ed3ad1aadb3d1a3d005c2a8aecce4646d5`.
- **VIS-02 — measured approximation:** ใช้ Pillow อ่านพิกเซลและหาสีที่พบมากที่สุดใน crop ที่เลือก สี JPEG ได้รับผลจาก compression จึงเป็น reconstruction ไม่ใช่ original color declaration.
- **VIS-03 — visual estimate:** ตำแหน่งองค์ประกอบ สัดส่วน border/radius/glow และชนิดฟอนต์จากภาพ คลาดเคลื่อนได้ประมาณ 1–4 px ในภาพนี้; ไม่ทราบ viewport เดิม, browser zoom, devicePixelRatio หรือว่าภาพถูก resize มาก่อนหรือไม่.
- **DES-01 — proposed adaptation:** desktop 1440 px, typography/readability, responsive behavior, semantic risk colors, interaction และ accessibility เป็นข้อเสนอสำหรับ Portal ใหม่ ไม่ใช่พฤติกรรมที่พิสูจน์จากภาพนิ่ง.

ไม่จำเป็นต้องเปิด REA binary/runtime session เพราะ target เป็นภาพ JPEG และเอกสาร source plan ไม่ใช่ shipped executable. IDs ข้างต้นเป็นรหัสหลักฐานของรายงานนี้ ไม่ใช่ Evidence IDs ที่ REA สร้าง.

## 2. DNA ที่ควรรักษา

1. พื้นเกือบดำอมม่วง/น้ำเงิน มี sidebar แยกด้วยโทนสว่างกว่าเล็กน้อย.
2. ผิว card เป็นชั้น charcoal ใช้ border บาง และเงาสั้นทำให้แยกพื้นผิวได้โดยไม่ลอยสูง.
3. ลำดับข้อมูลหนาแน่นแต่เป็นแถวชัดเจน: compact header → banner → cards → charts → table → supporting cards.
4. Active navigation ใช้ amber wash/amber text; ไม่ทำแถบสีเต็มความกว้างให้เด่นแย่ง content.
5. Glow สีเขียว ม่วง เหลือง ฟ้า ชมพู อยู่เฉพาะมุมขวาบนของ card; main content ส่วนใหญ่ยังมืดและอ่านง่าย.
6. Chart มีเส้นบาง จุดข้อมูลเล็ก เส้น grid จาง และตัวเลขเด่นกว่าตกแต่ง.
7. มี purple spotlight card เพียงจุดเดียวใน chart grid ใช้ดึงสายตา ไม่ทำทุก card เป็น gradient สีจัด.
8. Table อยู่ใน panel กว้าง ใช้ separators บางและ status pills ขนาดเล็ก.

**การแปลงเนื้อหา:** Quest/reward cards เปลี่ยนเป็น investigation shortcuts หรือ risk summaries; coin/streak counters เปลี่ยนเป็น scope/data freshness/alert queue; storage card เปลี่ยนเป็น operational capacity หรือ review queue utilization ที่มีข้อมูลรองรับ. ไม่ย้ายเกม/coins/claim rewards เข้าสู่ LMPS.

## 3. Geometry ที่อ่านจากภาพ

| ส่วน | ตำแหน่ง/ขนาดโดยประมาณในภาพ 736 px | ความเชื่อมั่น | การใช้กับ Portal ใหม่ |
|---|---|---|---|
| Sidebar | x0–139, width140 | สูง | fixed264 px ที่ desktop1440 |
| Main boundary | x140 | สูง | content เริ่มหลัง sidebar |
| Topbar | y0–32, x140–736 | ปานกลาง | height64 px, sticky |
| Content | x156–720, width564 | สูง | padding24 px; fluid ไม่ล็อก width564 |
| Hero | x156 y43 w564 h100 | ปานกลาง | compact operational banner128–160 px |
| First cards | y175–279, 4 cols, w≈136, gap≈7 | ปานกลาง | 4cols gap16, min-width≈240 |
| Second cards | y310–414, 4 cols | ปานกลาง | optional quick actions row; ใช้เมื่อมีข้อมูลจริง |
| Chart row1 | y445–594, 3cols, w≈181 | ปานกลาง | 3cols, min-height260 |
| Chart row2 | y602–801, 3cols | ปานกลาง | 3cols, selected purple spotlight |
| Activity table | x156 y833 w564 h257 | ปานกลาง | full-width table, 44–48 px rows |
| Supporting cards | y1125–1340, 3cols×2rows | ปานกลาง | supporting operational modules; ไม่บังคับยาวเท่าภาพ |
| User block | x8 y1370 ใกล้ footer | ปานกลาง | pinned sidebar footer |

สัดส่วนหลักคือ sidebar ราว19% / workspace81%; main paddingราว16pxในภาพ. ที่1440 ไม่คูณทุกค่าด้วย2แบบตายตัว: ใช้sidebar264/padding24 และปรับ grid ตามพื้นที่จริง. รักษาจังหวะ 4-card summary + 3-chart row + full-width table แต่ไม่บีบรายละเอียด investigation ลงใน card ที่เล็กเกินไป.

## 4. Color tokens

### 4.1 พื้นผิวจากการวัด

| Token | HEX | ที่มา |
|---|---|---|
| `color.bg.canvas` | `#0C0C14` | modal pixel crop x141–155/y300–800, observed approximation |
| `color.bg.sidebar` | `#131521` | modal crop x0–139/y340–800 |
| `color.bg.topbar` | `#0D1017` | modal crop x150–735/y0–30 |
| `color.bg.panel` | `#14141E` | modal activity-table crop x170–715/y900–1080 |
| `color.bg.elevated` | `#1B1C2A` | proposed control/popover surface; visual fit |
| `color.bg.hover` | `#202233` | proposed hover surface |
| `color.border.subtle` | `#252636` | estimated card separators; decorative boundary |
| `color.border.strong` | `#6C7292` | proposed required control boundary; verify with adjacent surface |

### 4.2 Text และ accents ที่ปรับให้อ่านง่าย

| Token | HEX | หน้าที่ |
|---|---|---|
| `color.text.primary` | `#F4F4F7` | heading, primary value, cell value |
| `color.text.secondary` | `#B5B6C7` | description, secondary cells |
| `color.text.muted` | `#8D90A6` | meta/time/axis labels; ไม่ลด opacity ซ้ำ |
| `color.text.inverse` | `#151019` | text บน amber solid button |
| `color.accent.amber` | `#F6B73C` | brand, current nav, primary action, Fraud category |
| `color.accent.cyan` | `#24C7DF` | freshness/informational series, AML category |
| `color.accent.violet` | `#AD6CFF` | graph/analysis/spotlight, Mule category |
| `color.accent.pink` | `#EF5AA6` | supporting chart series |
| `color.accent.green` | `#34D399` | operational success/supporting chart series |
| `color.accent.blue` | `#5B9AFF` | supporting chart series |

Accent HEX เป็น proposed reconstruction ของสีในภาพ ไม่ได้สุ่มเลือก pixel ที่อาจเป็น antialiasing มายืนยันว่าเป็น original token.

### 4.3 Semantic colors: แยก risk dimension ออกจาก severity

| ประเภท | Token/value | การแสดง |
|---|---|---|
| Dimension | Fraud=`#F6B73C`, Mule=`#AD6CFF`, AML=`#24C7DF` | category chip + text, คงสีเดียวทั้งเว็บ |
| Critical | `#FB7185` | icon + label Critical, optional soft rose background |
| High | `#FB923C` | icon + label High |
| Medium | `#F6C453` | label Medium |
| Low | `#34D399` | label Low |
| Unavailable/Unknown | `#8D90A6` | dash + explanatory label, ไม่แทนด้วย0 |
| Success | `#34D399` | action/result state ผ่านจริง |
| Warning | `#F6C453` | stale/partial/degraded มีคำอธิบาย |
| Error | `#FB7185` | failure/blocking input |
| Info | `#24C7DF` | informational notice |

Fraud/Mule/AML เป็น **ชนิดความเสี่ยง**; critical/high/medium/low เป็น **ระดับตาม policy**. ไม่ใช้สี dimension ไปสรุป severity โดยอัตโนมัติ. ห้ามตั้ง high threshold80หรือ0.8จากงานออกแบบ. คะแนนไม่แสดง `% probability`, `confirmed crime`, หรือ average ของ raw dimension scores. แสดง score semantics/version และ missing/coverage ให้เห็น.

## 5. Glow, gradient, shadow และ borders

### Corner glow

```css
background:
  radial-gradient(ellipse at 100% 0%, rgb(173 108 255 / .18), transparent 58%),
  #14141e;
```

เปลี่ยนสี glow ตามบริบท แต่ยังคง opaque panel base. Glow อยู่หลัง content และ `overflow:hidden`; ไม่ใช้ blur ที่ทำตัวอักษรจาง. จำกัด opacityประมาณ.12–.20 และพื้นที่ไม่เกินครึ่งหนึ่งของ card. Severity ไม่ส่งผ่าน glow เพียงอย่างเดียว.

### Hero

`linear-gradient(105deg,#14141e 20%,#201732 100%)` + border1px `#252636`, radius12px. ใช้ headline1–2บรรทัด, description1–2บรรทัด และ compact environment/data-status chips. พื้นที่ hero ไม่ควรกินเกิน160px ที่ desktop.

### Purple spotlight

`linear-gradient(145deg,#61229a 0%,#3b096c 60%,#270b4c 100%)`, subtle violet border, primary textขาว. ใช้1 cardต่อoverview. ใช้กับ capacity/review backlog พร้อม denominator/period/source. ห้ามแสดงเปอร์เซ็นต์ที่ไม่มีฐานข้อมูล. Ring chartมี labelตัวเลขและaccessible text.

### Surface depth

- Panel shadow: `0 8px 20px rgb(0 0 0 / .22)`.
- Popover shadow: `0 16px 40px rgb(0 0 0 / .40)`.
- Button: `linear-gradient(180deg,#242638,#191b28)` + inset highlight บาง.
- Border width1px; decorative low contrast borderใช้ได้เมื่อ panel แยกด้วย spacing/headingอยู่แล้ว. Input boundary/selected indicator ที่จำเป็นต้องใช้สีcontrastสูงขึ้น.
- ไม่มี glass transparency บน table, ไม่มี neon glow รอบข้อความ, ไม่มีสีสว่างเต็มหน้าจอ.

## 6. Typography

ฟอนต์ต้นฉบับยืนยันไม่ได้จาก JPEG; รูปแบบที่เห็นคือ neutral sans, headingน้ำหนัก600–700, metaตัวเล็ก. **ข้อเสนอ:** English `IBM Plex Sans`; Lao `Noto Sans Lao`; fallback `system-ui,sans-serif`. ใช้font fallbackให้ครบ; ห้ามอ้างว่าฟอนต์เหล่านี้ถูก extractจากภาพ.

| Role | Size/line-height | Weight | ใช้ |
|---|---|---|---|
| Page title | 28/36 | 650 หรือ600เมื่อfontไม่มี650 | page heading |
| Hero title | 28/36 | 700 | compact headline |
| Section title | 16/24 | 600 | row heading |
| Panel title | 14/22 | 600 | card/chart heading |
| Body/cells | 14/22 | 400–500 | readable detail |
| Meta/axis | 12/18 | 400–500 | timestamps/labels |
| KPI | 30/38 | 600 | `tabular-nums` |
| Data ID | 12/20 | 400 | monospace only IDs/hashes |

สำหรับ Lao ใช้line-height1.65เมื่อเป็นย่อหน้าหรือlabelหลายบรรทัด ไม่บีบสระ/วรรณยุกต์ด้วยheightตายตัว. ไม่ใช้letter-spacingเพิ่มกับข้อความLao. English uppercase group labelsใช้tracking.08emได้; labelภาษาLaoให้ใช้caseปกติ. ตัวเลขเงินและscoreใช้tabular numerals; amountต้องแสดงcurrencyและรักษาexact string ไม่parseผ่านfloatแบบเงียบๆ.

## 7. Spacing, sizing และ density

- Base scale:4,8,12,16,20,24,32,40,48,64.
- Desktop shell: sidebar264px, collapsed80px, topbar64px, page padding24px.
- Page section spacing24px; major groups32px; card grid gap16px; card inner20px.
- Summary card min-height144px; chart min-height260px; workflow panel padding24px.
- Radius: chip999px, small6px, control8px, panel12px, dialog16px.
- Controls: default40px; dense32px เฉพาะpointer desktop; mobile44px minimum touch region.
- Table header40px; row48px; compactrow40pxเมื่อผู้ใช้เลือกdensity; checkbox/toggle target44pxเมื่อใช้touch.
- Dialog width560px typical /800px for complex policy comparison; max-height calc(100dvh - 48px), scrollcontent, visiblefooter.
- Detail drawer560px desktop, full screenบนmobile; sticky action footerที่ไม่บังcontent.
- Icon16px inline/18px nav/20px action; consistent outline family, stroke1.75–2; icon-only actionsมีtooltipและaccessible name.

## 8. Component recipes

### App shell / sidebar

Logo amber square32px + `LMPS Risk`, small `Financial Crime Monitoring`. Group names12px muted. Nav item40px height/gap4px/radius8px; icon18px; active amber text + background`rgba(246,183,60,.10)` + border`rgba(246,183,60,.18)` และaria-current. Alert countเป็นsmallchip; user/footerแสดงroleและinstitution scope. Collapsed sidebarเก็บtooltip/focus visibility. แสดงenvironment (`Synthetic demo`/`Offline simulation`) และscopeเสมอ.

### Topbar

Breadcrumb/page titleด้านซ้าย. ขวาเป็นinstitution/workspace selector, globaldate rangeตามหน้าที่ใช้, `EN / ລາວ`, notifications และprofile. ห้ามscope changeโดยเป็นแค่decoration: clear incompatible selection, re-fetch/recompute mockdataและบอกfilterใหม่. Freshness chipแสดงเวลาupdateจริงของdataset/fixture ไม่ใช้pulsing live dotตลอดเวลา.

### Metric card

Icon/label12–14pxด้านบน; value30px; unit/period/coverage12px; trendมีlabelฐานเปรียบเทียบ. ทุกcardที่clickได้ใช้link/button semantics. Nullเป็น`Unavailable`พร้อมreason ไม่ใช้0. Skeletonไม่เดาตัวเลข. ห้ามเลือกmetricเฉพาะเพราะมีcardสวยในภาพ.

### Chart panel

Panel heading + period + legend. Plotไม่น้อยกว่า180px high; axes12px; gridlowcontrast; tooltipแสดงvalue/time/currency/scope. Chart areafillopacity.08–.22. Donut/ringlabelกลางใช้24–30px. Hoverไม่ใช่ช่องทางเดียวในการอ่านข้อมูล: มีsummaryหรือtabletoggle. Missing intervalsเป็นgap ไม่join lineให้ดูเหมือนมีdata.

### Table

Sticky headers, horizontal scrollในtable container, column chooserเมื่อcolumnมาก. Leadingseverity + ID; money rightalign; timestampsระบุtimezone; actionsด้านขวา. Hoverpaneltone, selectedcheckboxstateชัดเจน. Showfilter chips/count/pagination. Activity auditเป็นtimeline/table;ไม่ใช้สีsuccessเพราะแค่logถูกบันทึก. EmptyresultมีClearfilters; trueemptyอธิบายว่าจะมีข้อมูลเมื่อใด.

### Badges

Text12px medium, padding3px8px,1pxsoftborder, foregroundsolidaccent/backgroundaccent10–14%. Labelทุกครั้งเช่น`High`, `Unknown`, `Synthetic`, `Stale`, `Draft`. ไม่อาศัยcolorอย่างเดียว. `Low`ไม่ใช้ข้อความ`Safe`.

### Buttons / fields

Primaryamber solid + inverse text; secondaryraisedcharcoal; dangerrose outline/solidในconfirmationที่เหมาะสม. Disabledลดcontrastได้แต่ต้องมีreasonใกล้ปุ่ม/tooltip;การซ่อนสิทธิ์ไม่ใช่backendauthorization. Fieldlabelpersistent, errorinline, focusring2pxcyan offset2px; placeholderไม่เป็นlabel. Boundedthresholdeditorเป็นstructuredform ไม่มีtextareaสำหรับarbitrarycode.

### Evidence / investigation

Master-detail arrangement: maintransaction/evidenceleft, summary/riskdimensioncardsright, immutableversions + audit timelinebelow. Displayunresolvedaccountอย่างตรงไปตรงมา. Graphnodecolorใช้dimension/categoryส่วนseverityเป็นbadge. Graphviewต้องมีcoveragelegend, bounds/timewindow, unresolvedmarkerและtabularalternative.

## 9. States และ interaction contract (proposed)

| State | Visual + content |
|---|---|
| Loading | shape-preserving skeleton + accessible loading message; freezeolddataเมื่อมีsoftrefresh |
| Empty | concise reason + supported next action; ไม่แสดงfakechart |
| Error | rose icon + plainlanguagecause + Retry; preservefilters |
| Stale | amber `Stale` + lastsuccessfultime + failedrefreshreason |
| Partial | amber/cyan coveragebanner + countassessed/total + missingdimensions |
| Permission denied | lockicon + requiredscopeexplanation; no privatevalues rendered |
| Unavailable | dash + dependencyreason; ไม่ใช้score0 |
| Conflict/CAS | retainform + `Updated by another user` + Refresh/reviewlatest;ไม่overwriteเงียบ |
| Readonly/gated | visible`Planned`/`Unavailable` + requirement; nofakeappliedsuccess |
| Success | toast≤5s + persistedupdatedstate + auditeventlink; simulateชัดเจนในprototype |

Animations140–180ms hover/focus,180–220ms drawer. Fade/transformเล็กน้อย; ไม่animatecounterจาก0จนriskดูเปลี่ยน. No auto-rotatingcards or distractingheartbeat. `prefers-reduced-motion:reduce`ตัดmotion/nonessentialtransition. Focusไม่ถูกstickyheader/footerบัง; Escclosedialog; returnfocustotrigger; keyboardtaborderสัมพันธ์กับlayout.

## 10. Responsive adaptation (proposed)

| Width | Behavior |
|---|---|
| ≥1280 | sidebar264, overview4summarycols/3chartcols; case main+aside |
| 1024–1279 | rail80 or userexpanded264; summary2cols, charts2cols; noforced4cols |
| 768–1023 | sidebardrawer withtrigger; summary2cols/chart1–2cols; detailsstack |
| <768 | fullwidthshell, pagepadding16, 1col,44pxtouch; drawerfullscreen; tablesscrollwithincontainer |
| 390 target | readableLao/English; filterswrap; no globalhorizontalscroll |

Sticky topbarแสดงเฉพาะcontrolsสำคัญเมื่อพื้นที่น้อย. Date/institutionfiltersเข้าoverflowpanel. ไม่ซ่อนpolicyversion/uncertaintyที่จำเป็นเพราะเป็นmobile. Mainlandmarkมีskiplink.

## 11. Accessibility contrast verification

คำนวณด้วยrelative luminance/WCAG contrast formulaจากproposedopaqueHEXต่อpanel`#14141E`; นี่เป็นการตรวจpairingเฉพาะ ไม่ใช่รับรองทั้งproduct WCAG compliance.

| Foreground | Contrast vs panel |
|---|---:|
| Primary`#F4F4F7` |16.66:1|
| Secondary`#B5B6C7` |9.13:1|
| Muted`#8D90A6` |5.81:1|
| Amber`#F6B73C` |10.24:1|
| Cyan`#24C7DF` |8.98:1|
| Violet`#AD6CFF` |5.54:1|
| Pink`#EF5AA6` |5.82:1|
| Critical`#FB7185` |6.79:1|
| High`#FB923C` |8.08:1|
| Medium`#F6C453` |11.27:1|
| Success/Low`#34D399` |9.51:1|

Inverse`#151019`บนamber`#F6B73C`=10.50:1. Textบนgradient/glow/translucentbadgeต้องตรวจพื้นจริงอีกครั้ง;ไม่ใช้ratioของopaquepanelมาอ้างแทน. Requiredcontrolboundaryต้องมี3:1กับadjacentsurfaceหรือใช้shape/labelที่เพียงพอตามบริบท; decorativeborder`#252636`ไม่ได้ผ่าน3:1. Chartseriesต้องมีlabels/markers/patternหรือtablealternative. `color.border.strong` ถูกปรับเป็น `#6C7292` หลังตรวจ contrast: 3.88:1 ต่อ panel, 3.58:1 ต่อ elevated, 3.33:1 ต่อ hover และ 3.16:1 ต่อ button gradient endpoint `#242638` (ตัวเลขปัดเศษ).

## 12. ส่งต่อให้ Figma Make

ใช้`03-design-tokens.json`เป็นtokencontractและ`03-design-tokens.css`เป็นimplementationreference. สร้างFigmaVariables/Stylesตามdotnames;ไม่จำเป็นต้องมีpluginหรือimportschemaเฉพาะเพื่อใช้ค่าเหล่านี้. JSONเป็นmachine-readablehandoffschemaของงานนี้ ไม่ได้อ้างว่าเป็นFigmaimportformatหรือDTCGvalidatedschema.

ให้แนบImage #1เพื่อคุมvisualdirection. รักษาความมืด, density, ambernavigation, restrainedcornerglows,1purplespotlightและrhythmของtables/charts. ใช้screenrequirementsจากmodule/logictraceเป็นcontentauthority. ทุกsamplemetricและinteractionในprototypeต้องระบุSyntheticdemo; backendcapabilityและproductionapprovalไม่เกิดจากการออกแบบหน้าจอ.
