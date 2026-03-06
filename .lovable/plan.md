

## Plan: เพิ่ม Pending Activities + Quick Activity Shortcuts บน Kanban Card

### สิ่งที่จะทำ

**1. แสดงกิจกรรมที่ยังไม่เสร็จ (Pending Activities) บนการ์ด**
- ดึง activities จาก Supabase ที่ `is_done = false` สำหรับแต่ละ opportunity
- แสดงรายการ pending activities (ไอคอน + ชื่อ + วันที่) ใต้ ROW 3 (Next Activity) ด้วยขนาดเล็ก compact
- Fetch ครั้งเดียวใน `OpportunityKanban` แล้วส่ง activities เข้า `KanbanCard` ผ่าน props (ไม่ fetch ทีละการ์ด)

**2. Quick Activity Shortcuts (มุมซ้ายล่าง)**
- เพิ่มปุ่มไอคอนเล็กๆ 3 ปุ่ม: Call (โทร), Visit (นัดพบ), Demo (นัดเดโม) ตรงข้ามกับ dropdown จุดสามจุด
- เมื่อกดปุ่มใดปุ่มหนึ่ง → เปิด Popover inline form ประกอบด้วย:
  - ชื่อกิจกรรม (auto-fill ภาษาไทยตามประเภท)
  - วันที่ (DatePicker)
  - เวลาเริ่ม-สิ้นสุด (Select dropdown 15 นาที)
  - ความสำคัญ (Select: Low/Normal/High)
  - ปุ่มบันทึก
- บันทึกลง `activities` table ใน Supabase โดยตรง แล้ว refresh pending list

### ไฟล์ที่แก้ไข

**`src/components/opportunities/OpportunityKanban.tsx`**
- เพิ่ม `useEffect` fetch activities ทั้งหมดของ opportunities ที่แสดง (`is_done = false`)
- จัดกลุ่ม activities ตาม `opportunity_id` แล้วส่งเข้า `KanbanCard`
- ใน `KanbanCard`:
  - แสดง pending activities list (compact, max 3 รายการ + "+N more")
  - เพิ่ม 3 ปุ่ม shortcut (Phone, Users, Presentation icons) ที่ footer ด้านซ้าย
  - เมื่อกด → เปิด Popover พร้อม mini form
  - Insert activity ผ่าน supabase แล้ว refetch

### Technical Details

- ใช้ `Popover` + `PopoverContent` สำหรับ inline form (ไม่ใช้ Dialog เพื่อไม่บัง Kanban)
- Form fields: title (Input, auto-filled), date (Calendar Popover), start/end time (Select), priority (Select)
- Insert ผ่าน `supabase.from('activities').insert(...)` 
- หลัง insert → refetch activities + update `next_activity_date/type` ของ opportunity ถ้าจำเป็น
- ป้องกัน card click navigation เมื่อกด shortcut buttons ด้วย `e.stopPropagation()`

