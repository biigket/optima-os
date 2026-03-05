## Plan: เปลี่ยน Time Input เป็น Select Dropdown

### ปัญหา

`<input type="time">` ทำงานไม่ดีกับ browser automation และ UX ไม่สม่ำเสมอข้าม browser

### แก้ไข

เปลี่ยน time input ทั้ง "เริ่ม" และ "สิ้นสุด" เป็น **Select dropdown** แสดงเวลาทุก 15 นาที (00:00, 00:15, 00:30, ... 23:45) — ใช้ Radix Select ที่มีอยู่แล้ว

เปลี่ยน date input เป็น **Popover + Calendar** (Shadcn DatePicker) เพื่อความสม่ำเสมอของ UX  
เพิ่ม drag to reschedule 

### ไฟล์ที่แก้

`**src/components/opportunity-detail/ActivityForm.tsx**` เท่านั้น:

- สร้าง array `TIME_OPTIONS` = 96 ค่า (00:00–23:45 ทุก 15 นาที)
- แทน `<Input type="time">` ด้วย `<Select>` + `<SelectItem>` สำหรับทั้ง startTime และ endTime
- แทน `<Input type="date">` ด้วย Popover + Calendar (DatePicker) พร้อม format วันที่เป็น yyyy-MM-dd สำหรับ state

### ผลลัพธ์

- UX สม่ำเสมอทุก browser
- Browser automation ทำงานได้ (Select เป็น standard clickable element)
- ค่าเวลายังเก็บเป็น string format "HH:mm" เหมือนเดิม — ไม่กระทบ logic อื่น