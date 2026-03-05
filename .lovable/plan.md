

## Plan: ปรับ Action Buttons ใน History Timeline

### สรุปการเปลี่ยนแปลง

แก้ไขไฟล์ `src/components/opportunity-detail/HistoryTimeline.tsx` เท่านั้น

### ActivityItem
1. **ลบ** `<CheckCircle2>` (เครื่องหมายถูกเขียว) ออก
2. **Pin button** + **Comment button** (ถ้าต้องการเพิ่ม) อยู่ข้างนอกกดได้เลย ไม่ต้อง hover — เหมือนเดิมที่เป็นอยู่
3. **DropdownMenu (สามจุด)** เก็บเฉพาะ Edit และ Delete — ลบ Pin ออกจาก dropdown (เพราะ Pin อยู่ข้างนอกแล้ว)

### NoteItem
1. **Pin** + **Comment** อยู่ข้างนอกกดได้เลย — เหมือนเดิม
2. **DropdownMenu (สามจุด)** เก็บเฉพาะ **Edit** และ **Delete** — ลบ Pin ออกจาก dropdown

### รายละเอียดโค้ด

**ActivityItem:**
- ลบบรรทัด `<CheckCircle2 size={11} className="text-emerald-500 shrink-0" />`
- ลบ `Pin` DropdownMenuItem ออกจาก dropdown (เหลือแค่ Delete)
- เพิ่ม `onAddComment` prop + comment button ข้างนอกเหมือน NoteItem (ถ้าต้องการ — ดูจากรูปไม่มี comment button บน activity ก็ข้ามได้)

**NoteItem:**
- ลบ `Pin this note` DropdownMenuItem ออกจาก dropdown (เหลือ Edit + Delete)

