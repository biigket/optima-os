

## Plan: Comment แสดงใต้ parent item แทนที่จะเป็น NoteItem แยก

### ปัญหาปัจจุบัน
เมื่อกด Comment บน Activity หรือ Note แล้วพิมพ์ข้อความ ระบบจะสร้าง `OpportunityNote` ใหม่ที่มี `↳` prefix → แสดงเป็น NoteItem แยกใน timeline แทนที่จะอยู่ใต้ item ที่ comment

### การแก้ไข

**1. เพิ่ม `parent_id` ให้ OpportunityNote** (`OpportunitiesPage.tsx`)
- เพิ่ม optional field `parent_id?: string` ใน `OpportunityNote` interface

**2. แก้ `onAddComment` callback** (`OpportunityDetailPage.tsx`)
- ตอนสร้าง comment note ให้ใส่ `parent_id: parentId` เพื่อ link กลับไปหา parent
- ลบ `↳` prefix ออกจาก content (ไม่จำเป็นแล้ว)

**3. แก้ HistoryTimeline** (`HistoryTimeline.tsx`)
- กรอง notes ที่มี `parent_id` ออกจาก timeline items หลัก (ไม่แสดงเป็น item แยก)
- สร้าง map: `parentId → comments[]` เพื่อ lookup
- ส่ง `comments` array เข้า `ActivityItem` และ `NoteItem`
- ใน ActivityItem/NoteItem: render comments list ใต้ item (หลัง notes/content, ก่อน timestamp) เป็นข้อความเล็กๆ indent เข้ามา พร้อม `↳` icon และ ชื่อผู้เขียน+เวลา

**4. UI ของ comment ที่แสดงใต้ parent**
```
↳ ความคิดเห็น...
   ชื่อ · วัน เวลา
```
- text-[10px], indent ด้วย ml-3, สี muted
- แสดงทุก comment ที่มี parent_id ตรงกับ item.id

ไฟล์ที่แก้: `OpportunitiesPage.tsx`, `OpportunityDetailPage.tsx`, `HistoryTimeline.tsx`

