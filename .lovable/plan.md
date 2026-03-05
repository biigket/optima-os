

## แผนสร้างตารางฐานข้อมูลจาก CRM Data จริง

### สรุปข้อมูลที่วิเคราะห์จากไฟล์ทั้ง 8 ไฟล์

| ไฟล์ | เนื้อหา | จำนวนแถว |
|------|---------|----------|
| คลินิกลูกค้า_เพิ่มใหม่ | ทะเบียนลูกค้า (บริษัท, คลินิก, ที่อยู่, เลขภาษี, Sale) | ~163 |
| 🔥เคส DEMO แล้ว | ประวัติ Demo + Stage ลูกค้า + Sale + เครื่องที่สนใจ | ~118 |
| DEMO_FORM | รายละเอียด Demo (shots ที่ใช้, เครื่อง, วันที่, ทีม) | ~14 |
| CRM_BKK1_ยังไม่ซื้อ | Leads ยังไม่ซื้อ (Stage, Grade, งบ, KOL/VIP) | ~1 (template) |
| CRM_BKK1_ซื้อแล้ว | Leads ซื้อแล้ว | header only |
| ND2_INSTALL_BASE | เครื่องที่ติดตั้งแล้ว (S/N, Warranty, PM schedule) | ~125 |
| QT_AR_list | ใบเสนอราคา + การชำระเงินรายงวด | ~221 |
| Plan_Report_BKK1 | Visit report (เข้าเยี่ยม, location, action) | ~5 |

---

### ตารางที่จะสร้าง (10 ตาราง)

#### 1. `accounts` — ทะเบียนลูกค้า/คลินิก
จาก: คลินิกลูกค้า_เพิ่มใหม่ + CRM_BKK1
```text
id, company_name, clinic_name, address, tax_id, entity_type (นิติบุคคล/บุคคลธรรมดา),
branch_type, phone, email, google_map_link, lead_source, 
customer_status (NEW_LEAD/DEMO_DONE/NEGOTIATION/PURCHASED/DORMANT),
grade, has_budget, is_kol, is_vip, single_or_chain,
assigned_sale, registered_at, notes, created_at
```

#### 2. `contacts` — ผู้ติดต่อ/ผู้มีอำนาจ
```text
id, account_id (FK), name, role, phone, email, line_id, 
is_decision_maker, created_at
```

#### 3. `products` — สินค้า/เครื่อง (ใหม่)
จาก: เครื่องที่ Demo (ND2, Trica3D, Quattro, New Doublo 2.0)
```text
id, product_name, product_code, category (DEVICE/CONSUMABLE/PART),
description, base_price, created_at
```

#### 4. `opportunities` — โอกาสขาย
จาก: 🔥เคส DEMO + CRM_BKK1
```text
id, account_id (FK), stage (ต้องตามอีก/รออนุมัติ/พิจารณาค่าใช้จ่าย/เปรียบเทียบคู่แข่ง/ซื้อแล้ว/จบเคส),
interested_products (text[]), expected_value, assigned_sale,
customer_grade, notes, close_date, created_at
```

#### 5. `demos` — ประวัติ Demo (ใหม่)
จาก: DEMO_FORM + 🔥เคส DEMO
```text
id, account_id (FK), opportunity_id (FK), demo_date, location,
products_demo (text[]), fl45_shots, fl30_shots, fl20_shots,
sd45_shots, sd30_shots, sd15_shots, rm_i49_tips, rm_n49_tips,
demo_note, visited_by (text[]), reminded, created_at
```

#### 6. `installations` — เครื่องที่ติดตั้งแล้ว (ใหม่)
จาก: ND2_INSTALL_BASE
```text
id, account_id (FK), product_id (FK), serial_number, province, region,
district, status (เพิ่งติดตั้ง/1st MT/2nd MT/etc), 
has_rm_handpiece, cartridges_installed (text),
install_date, warranty_days, warranty_expiry,
created_at
```

#### 7. `maintenance_records` — ประวัติ PM (ใหม่)
จาก: ND2_INSTALL_BASE (PM1-PM3 columns)
```text
id, installation_id (FK), maintenance_number (1/2/3/4),
scheduled_date, actual_date, report_file, photos (text[]),
status, created_at
```

#### 8. `quotations` — ใบเสนอราคา
จาก: QT_AR_list (ปรับจากตารางเดิม)
```text
id, qt_number, account_id (FK), sale_assigned, product, price,
qt_date, qt_attachment, invoice_sent, payment_status,
payment_condition (Cash/Installment), leasing_doc,
approval_status, created_at
```

#### 9. `payment_installments` — งวดชำระเงิน (ใหม่)
จาก: QT_AR_list (งวดที่ 1-14)
```text
id, quotation_id (FK), installment_number, due_date,
amount, paid_date, slip_file, payment_channel, receipt_sent,
created_at
```

#### 10. `visit_reports` — รายงานเข้าเยี่ยม (ใหม่)
จาก: Plan_Report_BKK1
```text
id, account_id (FK), clinic_name, location, photo,
customer_type (ใหม่/เก่า), status (VISIT_FORM/REPORT/WEEKLY_PLAN/จบเคส),
check_in_at, check_out_at, action, devices_in_use,
issues, next_plan, met_who, new_contact_name, new_contact_phone,
created_at
```

---

### สิ่งที่ต้องปรับจาก Schema เดิม

| เดิม | ปรับ |
|------|------|
| `Account.customerStatus` มี 3 ค่า | เพิ่มเป็น 6 ค่า: NEW_LEAD, DEMO_DONE, NEGOTIATION, PURCHASED, DORMANT, CLOSED |
| `OpportunityStage` 7 ค่าภาษาอังกฤษ | เพิ่ม/map stage ภาษาไทยจริง: ต้องตามอีก, รออนุมัติ, พิจารณาค่าใช้จ่าย, เปรียบเทียบคู่แข่ง, ซื้อแล้ว |
| ไม่มีตาราง Demo | สร้างใหม่ — เก็บ shots, tips, notes |
| ไม่มีตาราง Installation/PM | สร้างใหม่ — เก็บ S/N, warranty, PM history |
| Quotation เก็บ items[] เป็น JSON | ปรับเป็น product + price ต่อใบ (ตามข้อมูลจริงที่ 1 QT = 1 product) |
| ไม่มีงวดชำระ | สร้าง payment_installments แยก (รองรับ 1-14 งวด) |
| ไม่มี Visit Report | สร้างใหม่ |

### ขั้นตอนดำเนินการ

1. **สร้าง Migration** — 10 ตารางพร้อม RLS policies (ให้ authenticated users อ่านได้, insert/update ตาม role)
2. **อัปเดต TypeScript types** — ให้ตรงกับ schema ใหม่
3. **สร้าง Auth + Profiles** — ต้องมีระบบ login ก่อนจึงจะ CRUD ผ่าน RLS ได้
4. **Import ข้อมูลจริง** — insert data จาก CSV ทั้ง 8 ไฟล์เข้าตาราง
5. **อัปเดตหน้า UI** — Leads, Opportunities, Quotations, Inventory ให้ดึงจาก database จริง

### หมายเหตุทางเทคนิค
- ใช้ `uuid` เป็น primary key ทุกตาราง
- ทุกตารางมี `created_at` default `now()`
- Foreign key ชี้ไปที่ `accounts.id` เป็นหลัก
- RLS: authenticated users SELECT ได้ทั้งหมด, INSERT/UPDATE จำกัดตาม sale owner
- ต้องสร้าง Auth + profiles ก่อนจึงจะใช้ RLS ได้จริง

