

## Plan: 2-Way Sync ระหว่าง Activity Form ↔ Calendar Panel

### สรุป
ทำให้ Calendar Panel และ Activity Form sync กันแบบ 2-way: คลิก activity ใน calendar → ฟอร์มโหลดข้อมูลมาแก้, แก้ฟอร์ม → calendar อัปเดตทันที ไม่มีการเปลี่ยน schema หรือ redesign หน้าเดิม

### ไฟล์ที่แก้ไข

#### 1. `OpportunityDetailPage.tsx` — เพิ่ม shared state + wiring
- เพิ่ม state: `selectedDate`, `activeActivityId`
- ส่ง `selectedDate` + `onDateChange` ไป CalendarPanel (controlled)
- ส่ง `activeActivityId` + `editingActivity` ไป ActivityForm
- เมื่อ CalendarPanel คลิก activity → set `activeActivityId` + switch tab เป็น "activity"
- เมื่อ ActivityForm save/update → อัปเดต `activities` state ทันที (ทั้ง create + update)
- CalendarPanel ย้ายขึ้นมาอยู่ข้าง ActivityForm (หรือ sticky ด้านบนของ right column)

#### 2. `ActivityForm.tsx` — รองรับ Edit mode + 2-way sync
- เพิ่ม optional prop `editingActivity?: Activity` + `onActivityUpdated?: (activity: Activity) => void` + `onCancelEdit?: () => void`
- เมื่อ `editingActivity` เปลี่ยน → populate form fields ทั้งหมด (type, title, date, time, priority, etc.)
- Save logic: ถ้ามี `editingActivity` → `supabase.update()` แทน `insert()`
- เพิ่ม `onChange` callback (optional) ที่ fire ทุกครั้งที่ user แก้ start_time/end_time/type → CalendarPanel อัปเดต preview ทันที (optimistic)
- ปุ่มยกเลิก: ถ้า edit mode → เรียก `onCancelEdit` แล้ว reset

#### 3. `CalendarPanel.tsx` — Controlled date + active highlight + overdue
- Props เปลี่ยนเป็น controlled: `selectedDate`, `onDateChange`, `activeActivityId`
- Activity list + blocks: highlight active item (ring/border เข้ม)
- Done items: แสดงจางลง (opacity-50) + ✅
- Overdue items: แสดง badge OVERDUE (start_time < now && !is_done)
- Auto-scroll time grid ไปยัง current time เมื่อเลือกวันนี้
- Sticky positioning ใน right column

#### 4. Layout ใน `OpportunityDetailPage.tsx`
- CalendarPanel ย้ายขึ้นมาอยู่ถัดจาก Tab UI (Activity/Notes) แทนที่จะอยู่ล่างสุด
- ใช้ `sticky top-4` เพื่อให้ CalendarPanel ติดหน้าจอขณะ scroll

### Sync Rules (ตรงตามที่กำหนด)
1. **แก้ time ในฟอร์ม** → block ใน calendar ย้าย/ยืด/หดทันที (ผ่าน optimistic preview state)
2. **เปลี่ยน type** → icon/label บน block เปลี่ยนทันที
3. **กด Save** → insert/update activity record → activities state อัปเดต → calendar + list อัปเดต
4. **Mark as done** → is_done = true → item จางลง + ✅
5. **Overdue** → start_time < now && !is_done → badge OVERDUE

### ไม่เปลี่ยน
- Schema เดิม (ใช้ activities table ตามเดิม)
- Timeline logic เดิม
- ไม่ redesign layout เดิม

