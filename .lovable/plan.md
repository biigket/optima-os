## Plan: ปรับปรุงฟอร์มสร้างโอกาสขายให้เหมาะกับเครื่องมือแพทย์

### สิ่งที่จะเปลี่ยน  
  
เพิ่มสินค้าตามจริงให้หน่อยมี Doublo neo 2 Doublo full 3 / Doublo full 5 / Quattro / Trica3D / Picohi drop down แบบ multiple choice

และวัสดุสิ้นเปลือง มี A2.0/A3.0/A4.5/A6.0/L1.5/L3.0/L4.5/L9.0/I49/N49/I25/N25 drop down แบบ multiple choice

#### 1. สินค้าเลือกได้หลายรายการ (Multi-select)

- เปลี่ยนจาก single Select เป็น checkbox list ที่เลือกสินค้าได้หลายตัว
- เก็บเป็น `selectedProductIds: string[]` แทน `product_id: string`
- แสดง chip/tag ของสินค้าที่เลือกแล้ว พร้อมปุ่มลบ

#### 2. Probability เป็น Slider 0-100% ทีละ 5

- เปลี่ยนจาก read-only input เป็น `Slider` component (มีอยู่แล้วใน project)
- step=5, min=0, max=100
- ยังคงมี auto-suggest ตาม stage แต่ผู้ใช้สามารถเลื่อนปรับเองได้
- เก็บค่าใน form state เป็น `probability: number`

#### 3. เพิ่มฟิลด์ที่เหมาะกับเครื่องมือแพทย์

เพิ่มฟิลด์ใหม่ในฟอร์ม (แสดงเฉพาะเมื่อเลือกประเภท DEVICE):

- **งบประมาณลูกค้า** (budget_range): Select — ต่ำกว่า 1M / 1-3M / 3-5M / 5M+
- **ช่องทางชำระ** (payment_method): Select — เงินสด / บัตรเครดิต / ลีสซิ่ง ถ้าเลือกบัตรเครดิตให้เลือกเงื่อนไขเพิ่ม ดังนี้ รูดเต็ม / ผ่อน 3 เดือน / ผ่อน 6 เดือน / ผ่อน 10 เดือน
- **คู่แข่งที่เทียบ** (competitors): text input และทำ quick note แบบเพิ่มเองได้ภายหลังให้ด้วย
- **เครื่องที่ใช้อยู่ปัจจุบัน** (current_devices): text input และทำ quick note แบบเพิ่มเองได้ภายหลังให้ด้วย

เมื่อเลือก CONSUMABLE:

- **จำนวน** ยังคงอยู่
- เพิ่ม **ความถี่สั่งซื้อ** (order_frequency): Select — รายสัปดาห์ / รายเดือน / รายไตรมาส

#### 4. บันทึกลง DB จริงและแสดงใน Kanban

- `handleSave` ใน `CreateOpportunityForm` จะส่ง `interested_products` เป็น array ชื่อสินค้าที่เลือกทั้งหมด
- บันทึก probability ลง DB (ต้องเพิ่ม column `probability` ใน opportunities table)
- ฟิลด์เพิ่มเติมบันทึกรวมใน `notes` field เป็น structured text (ไม่ต้องเพิ่ม column ใหม่มาก)

### Database Migration

เพิ่ม columns ใน `opportunities` table:

```sql
ALTER TABLE opportunities ADD COLUMN probability integer DEFAULT 10;
ALTER TABLE opportunities ADD COLUMN budget_range text;
ALTER TABLE opportunities ADD COLUMN payment_method text;
ALTER TABLE opportunities ADD COLUMN competitors text;
ALTER TABLE opportunities ADD COLUMN current_devices text;
ALTER TABLE opportunities ADD COLUMN order_frequency text;
```

### ไฟล์ที่แก้ไข

1. `**src/components/opportunities/CreateOpportunityForm.tsx**` — ปรับ form ทั้งหมด: multi-select สินค้า, slider probability, ฟิลด์เพิ่มเติมสำหรับ DEVICE/CONSUMABLE
2. `**src/pages/OpportunitiesPage.tsx**` — อัปเดต `handleSave` ให้ส่ง probability + ฟิลด์ใหม่ไป DB
3. `**src/types/index.ts**` — เพิ่ม fields ใหม่ใน Opportunity interface
4. **Database migration** — เพิ่ม columns ใหม่