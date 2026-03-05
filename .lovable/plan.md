

## Plan: แสดง Action buttons ถาวร (ไม่ต้อง hover) + เพิ่ม Edit/Delete ผู้มีอำนาจตัดสินใจ

### 1. HistoryTimeline.tsx — ลบ hover-to-show ออก

**NoteItem**: เปลี่ยน `opacity-0 group-hover:opacity-100` → แสดงถาวร (ลบ opacity classes ออก) สำหรับปุ่ม Pin, Comment, More menu

**ActivityItem**: เพิ่ม action buttons เหมือน NoteItem (Pin, More menu with Edit/Delete) แสดงถาวรไม่ต้อง hover

### 2. OpportunityDetailPage.tsx — Stakeholders edit/delete

ปรับ section ผู้มีอำนาจตัดสินใจ ให้แต่ละ contact มี:
- ปุ่ม **Edit** (Pencil icon) → เปิด inline edit ชื่อ/role
- ปุ่ม **Delete** (Trash icon) → ลบ contact ออก (confirm ก่อนลบ)

### ไฟล์ที่แก้ไข
1. `src/components/opportunity-detail/HistoryTimeline.tsx` — ลบ hover logic, เพิ่ม actions ให้ ActivityItem
2. `src/pages/OpportunityDetailPage.tsx` — เพิ่ม edit/delete actions ใน stakeholders section

