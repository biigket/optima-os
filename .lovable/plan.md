

## Plan: ทำให้ Pin, Delete, Comment ใช้งานได้จริง

### ปัญหาปัจจุบัน

1. **Pin** — แค่แสดง toast ไม่ได้ทำอะไรจริง
2. **Delete** — `onDeleteNote` แสดง toast แต่ไม่ลบ note ออกจาก `globalNotes`
3. **Comment** — ปุ่ม Post แค่ clear state ไม่ได้บันทึก comment

### แก้ไข

#### 1. `OpportunitiesPage.tsx` — เพิ่ม helper functions
- เพิ่ม `deleteNoteGlobal(id)` — filter note ออกจาก `globalNotes` array
- เพิ่ม `updateNoteGlobal(id, content)` — แก้ content ใน `globalNotes`
- Export ทั้ง 2 functions

#### 2. `OpportunityDetailPage.tsx` — wire up callbacks จริง
- **Pin**: เพิ่ม `pinnedNoteIds` state (Set), toggle pin on/off, ส่ง pinned status ไป HistoryTimeline เพื่อแสดง pinned notes ด้านบนสุด
- **Delete Note**: เรียก `deleteNoteGlobal(id)` แล้ว re-derive notes จาก `getNotesForOpportunity`
- **Delete Activity**: เรียก `supabase.from('activities').delete()` + RLS policy ต้องเพิ่ม DELETE permission
- **Comment**: เรียก `addNoteGlobal()` สร้าง note ใหม่ที่มี content เป็น `"↳ {comment}"` (reply format)
- **Update Note**: เรียก `updateNoteGlobal(id, content)`

#### 3. `HistoryTimeline.tsx` — เพิ่ม props และ logic
- เพิ่ม `onDeleteActivity` prop สำหรับลบ activity
- เพิ่ม `onAddComment` prop สำหรับ comment
- เพิ่ม `pinnedIds` prop → pinned items แสดง icon สีเข้ม + เรียงขึ้นบนสุด
- ActivityItem: ใช้ `onDeleteActivity` แทน `onDeleteNote` สำหรับ delete
- NoteItem: ปุ่ม Post เรียก `onAddComment(data.id, comment)`

#### 4. Database — เพิ่ม DELETE RLS policy สำหรับ activities
- Migration: `CREATE POLICY "Allow delete activities" ON activities FOR DELETE USING (true);`

### ไฟล์ที่แก้ไข
1. `src/pages/OpportunitiesPage.tsx` — เพิ่ม `deleteNoteGlobal`, `updateNoteGlobal`
2. `src/pages/OpportunityDetailPage.tsx` — ทำ Pin/Delete/Comment ให้ทำงานจริง
3. `src/components/opportunity-detail/HistoryTimeline.tsx` — เพิ่ม props + pinned logic
4. DB migration — เพิ่ม DELETE policy บน activities table

