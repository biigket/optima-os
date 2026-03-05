

## Plan: ปรับ UX/UI ให้เหมือน Pipedrive — Tab-based Activity/Notes + Focus checkbox + History actions

### 1. ปรับ Activity/Notes Input เป็น Tab UI (แบบรูป)

แทนที่ปุ่ม "เพิ่มกิจกรรม" + Quick Note Input แยก → รวมเป็น **Tab strip** ด้านบนคอลัมน์ขวา:
- **Activity** tab → เปิด Activity Form (เหมือนเดิม)
- **Notes** tab → Textarea พื้นหลังสีเหลือง (yellow bg) พร้อมปุ่ม Cancel / Save

### 2. ปรับ Focus Panel — Pipedrive-style checkbox

- เปลี่ยนจากปุ่ม "Done" → **วงกลม checkbox** ด้านซ้ายของแต่ละ item (คลิกเพื่อ mark done)
- แสดง **OVERDUE** badge สีแดง ถ้าเลยกำหนด
- แสดง contact name + organization name (account clinic_name)
- เพิ่มปุ่ม "..." (more menu) ด้านขวาของแต่ละ item
- Header: "Focus ▾" + toggle "Expand all items"

### 3. ปรับ History Timeline — เพิ่ม actions

**Notes ใน History:**
- เพิ่มปุ่ม "Add a comment" ด้านขวาบน
- เพิ่มปุ่ม 📌 Pin + "..." menu (Edit / Pin this note / Delete)
- Edit → inline editing ของ note content
- Delete → ลบ note ออก

**Activities ใน History:**
- แสดง priority badge (HIGH สีแดง)
- แสดง contact + organization
- แสดง notes content ถ้ามี (yellow bg)

**Stage changes:**
- แสดงจำนวน changes + "Show all" link (ถ้ามีหลายรายการ)

### ไฟล์ที่แก้ไข
1. **`src/pages/OpportunityDetailPage.tsx`** — แทนที่ ActivityForm + QuickNote → Tab UI component
2. **`src/components/opportunity-detail/FocusPanel.tsx`** — Pipedrive checkbox style + contact/org info
3. **`src/components/opportunity-detail/HistoryTimeline.tsx`** — เพิ่ม edit/pin/delete/comment actions
4. **`src/components/opportunity-detail/ActivityForm.tsx`** — ปรับให้ embed ใน tab แทน standalone

