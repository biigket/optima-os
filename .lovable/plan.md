

## Plan: ปรับปรุงฟอร์มสร้างดีลและหน้า Detail

### สรุปสิ่งที่เปลี่ยน

#### 1. เพิ่ม Authority (คนมีอำนาจตัดสินใจ) ในฟอร์ม
- เพิ่ม Select dropdown เลือกจาก contacts ที่มีอยู่ (แสดงชื่อ + เบอร์โทร)
- เก็บ `authority_contact_id` ใน form state
- เพิ่ม column `authority_contact_id` (uuid) ใน opportunities table

#### 2. เพิ่ม Need (ความต้องการ) แบบ tag chips
- UI แบบรูปที่ 2 (Chief Complaint style): แถวปุ่ม chip ที่กดเลือก/เพิ่มเองได้
- Preset tags: ลดริ้วรอย, หน้าเรียว, ผิวกระจ่างใส, รักษาสิว, ลดรอยดำ, กระชับผิว + ปุ่ม "+" เพิ่มเอง
- เก็บเป็น `needs: string[]` ใน form state
- เพิ่ม column `needs` (text[]) ใน opportunities table

#### 3. คู่แข่ง + เครื่องปัจจุบัน → เปลี่ยนเป็น tag chips style (รูปที่ 2)
- เปลี่ยนจาก text input เป็น chip-based input: พิมพ์แล้ว Enter เพื่อเพิ่ม tag, กด X ลบ
- `competitors` และ `current_devices` เก็บเป็น comma-separated string (ไม่ต้องเปลี่ยน DB type)

#### 4. วันปิดคาดการณ์ → เพิ่มแสดงระยะเวลา
- คำนวณจำนวนวันจากวันนี้ถึงวันปิด แล้วแสดงข้อความ เช่น "อีก 26 วัน" หรือ "เลยกำหนด 3 วัน"

#### 5. ลบกิจกรรมถัดไปออกจากฟอร์ม
- เอา section "กิจกรรมถัดไป" ออก
- เอาเงื่อนไข `next_activity_type && next_activity_date` ออกจาก `canSave`

#### 6. ลบแถบสิ้นเปลืองออก
- เอาปุ่มเลือก CONSUMABLE ออก ให้เป็น DEVICE only (ไม่ต้องเลือกประเภท)
- เอา section consumable fields ออก (order_frequency, quantity)
- แสดงสินค้าทุกประเภทใน product list (DEVICE only)

#### 7. ปรับงบประมาณ
- เปลี่ยน BUDGET_RANGES เป็น: `<500K`, `500K-1M`, `1-2M`, `>2-3M`, `>3M`

#### 8. หน้า Detail (รูปที่ 3) แสดงข้อมูลใหม่
- Deal Info: เพิ่มแสดง Authority (ชื่อ+เบอร์), Need (tags), คู่แข่ง (tags), เครื่องปัจจุบัน (tags), งบประมาณ, ช่องทางชำระ
- Probability ใช้ค่าจาก `opp.probability` แทน stage-based lookup

### Database Migration
```sql
ALTER TABLE opportunities ADD COLUMN authority_contact_id uuid;
ALTER TABLE opportunities ADD COLUMN needs text[];
```

### ไฟล์ที่แก้ไข
1. **`src/components/opportunities/CreateOpportunityForm.tsx`** — ปรับฟอร์มทั้งหมดตามข้างบน
2. **`src/pages/OpportunityDetailPage.tsx`** — แสดงฟิลด์ใหม่ใน Deal Info
3. **`src/types/index.ts`** — เพิ่ม `authority_contact_id`, `needs` ใน Opportunity interface
4. **Database migration** — เพิ่ม 2 columns

