

## Plan: ลบ Quick Actions เหลือแค่ Dropdown จุดสามจุด

ลบปุ่ม Quick Action (โทร, นัดกิจกรรม, บันทึก) และ Quick Note input ออกจาก Kanban card เหลือเฉพาะ dropdown จุดสามจุด (`...`) สำหรับเลื่อน pipeline

### ไฟล์ที่แก้ไข: `src/components/opportunities/OpportunityKanban.tsx`

1. **ลบ Quick Note input** (บรรทัด 341-361) — ลบทั้ง block `showNoteInput`
2. **ลบปุ่ม Phone, Calendar, MessageSquare** (บรรทัด 365-385) — เหลือแค่ dropdown `MoreHorizontal`
3. **ลบ state ที่ไม่ใช้แล้ว** — `quickNote`, `showNoteInput` ใน KanbanCard
4. **ลบ unused imports** — `MessageSquare` (ถ้าไม่ได้ใช้ที่อื่น)
5. **ปรับ layout** ของ quick actions row: dropdown อยู่ชิดขวา (`ml-auto`) เหมือนเดิม

