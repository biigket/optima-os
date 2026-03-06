

## Plan: เพิ่ม Tab "ไฟล์" สำหรับอัพโหลดเอกสาร + แสดงใน History Timeline

### สิ่งที่ต้องทำ

**1. สร้าง Storage Bucket** (SQL migration)
- สร้าง bucket `opportunity-files` (public) สำหรับเก็บไฟล์
- สร้าง RLS policies ให้ authenticated users upload/read/delete ได้

**2. สร้างตาราง `opportunity_files`** (SQL migration)
- `id` (uuid PK), `opportunity_id` (FK), `account_id`, `file_name`, `file_url`, `file_size`, `file_type`, `uploaded_by`, `created_at`
- RLS: authenticated users สามารถ CRUD ได้

**3. เพิ่ม Tab "ไฟล์" ใน OpportunityDetailPage**
- เพิ่ม TabsTrigger ที่สามใน Tabs component (ข้าง เพิ่มกิจกรรม / เพิ่มบันทึก)
- TabsContent แสดง drag-and-drop zone + ปุ่ม "Upload files" (ตามภาพ reference)
- อัพโหลดไฟล์ไปเก็บใน Storage bucket แล้วบันทึก metadata ลง `opportunity_files` table
- หลังอัพโหลดสำเร็จ → สร้าง note (OpportunityNote) อัตโนมัติพร้อม content `📎 [filename]` และ metadata (file URL, size) เพื่อแสดงใน History Timeline

**4. แสดงไฟล์ใน History Timeline**
- เพิ่ม type `file` ใน TimelineItem หรือใช้ NoteItem ที่มี file metadata แนบ
- เพิ่ม field `file_url?: string`, `file_name?: string` ใน OpportunityNote interface
- ใน NoteItem: ถ้ามี `file_url` แสดงเป็น file card (icon + ชื่อไฟล์ + ลิงก์ดาวน์โหลด) แทน text ธรรมดา
- รองรับ pin, inline edit (แก้ชื่อ/หมายเหตุ), delete, comment เหมือน note ปกติ

**5. ไฟล์ที่แก้ไข**
- `supabase/migrations/` — สร้าง bucket + table + RLS
- `src/pages/OpportunitiesPage.tsx` — เพิ่ม `file_url?`, `file_name?` ใน `OpportunityNote`
- `src/pages/OpportunityDetailPage.tsx` — เพิ่ม Tab ไฟล์ + upload logic + สร้าง note หลัง upload
- `src/components/opportunity-detail/HistoryTimeline.tsx` — NoteItem รองรับแสดง file card

