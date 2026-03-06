

## Plan: ปรับปรุง Kanban Card — 4 จุด

### 1. Mark as Done — วงกลม + จัดตำแหน่งกลาง row
- เปลี่ยน `rounded-full` (มีแล้ว) ให้ปุ่ม mark as done อยู่ตรงกลาง vertical ของ activity row ด้วย `items-center` (ตรวจสอบแล้วใช้อยู่) — ปรับ layout ให้ชัดเจนขึ้นโดยใช้ `self-center` บน button

### 2. ปุ่มปากกาแก้ไข — แสดงตลอดเวลา
- ลบ `opacity-0 group-hover:opacity-100` ออกจากปุ่ม Pencil (บรรทัด 327) ให้แสดงตลอดเวลาสำหรับ mobile/tablet

### 3. ถ้าไม่มี pending activities → แสดง "ไม่มี Next Activity" สีส้ม
- เพิ่ม condition: ถ้า `pendingActivities.length === 0` และ `!isTerminal` → แสดงข้อความ `"ไม่มี Next Activity"` ด้วย `text-warning` (สีส้ม)

### 4. ROW 4 — Pinned Notes + Quick Add Note
- เพิ่ม ROW ใหม่ใต้ pending activities
- **Fetch pinned notes**: ดึง notes จาก `globalNotes` (via `getNotesForOpportunity`) ที่ถูก pin — ต้องเพิ่ม `pinned` flag เข้า `OpportunityNote` interface หรือจัดเก็บ pinned state
- **ปัญหา**: ปัจจุบัน pinnedIds เก็บใน `OpportunityDetailPage` เป็น local state (`useState<Set<string>>`) → ไม่สามารถ share กับ Kanban ได้
- **แก้ไข**: ย้าย pinnedIds เป็น global store คล้าย globalNotes (export functions จาก `OpportunitiesPage.tsx`) เพื่อให้ Kanban card เข้าถึงได้
- **แสดง pinned notes**: แสดง note content ย่อๆ (truncate 1 บรรทัด) พร้อมไอคอน Pin
- **Quick Add Note**: เพิ่ม inline input ขนาดเล็กสำหรับพิมพ์โน้ตสั้นๆ → auto-pin เมื่อบันทึก
- **Inline Edit**: ปุ่มปากกาข้าง pinned note → Popover แก้ไข content

### ไฟล์ที่แก้ไข

1. **`src/pages/OpportunitiesPage.tsx`**
   - เพิ่ม global pinnedIds store: `globalPinnedIds: Set<string>`, `togglePinGlobal()`, `getPinnedIdsGlobal()`
   
2. **`src/components/opportunities/OpportunityKanban.tsx`**
   - ปุ่ม mark as done: ยืนยัน `rounded-full` + `self-center`
   - ปุ่มปากกา: ลบ `opacity-0 group-hover:opacity-100`
   - เพิ่ม empty state "ไม่มี Next Activity" สีส้ม
   - เพิ่ม ROW 4: Pinned notes display + quick add note + inline edit
   - Import `getNotesForOpportunity`, `addNoteGlobal`, `getPinnedIdsGlobal`, `togglePinGlobal`

3. **`src/pages/OpportunityDetailPage.tsx`**
   - เปลี่ยน pinnedIds จาก local state → ใช้ global store แทน เพื่อ sync กับ Kanban

