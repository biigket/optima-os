

## Plan: เพิ่มตัวกรองตามชื่อคนที่ถูก assign

### สิ่งที่จะทำ

เพิ่ม dropdown filter ข้างๆ TabsList (รายการ/ปฏิทิน) ให้ ADMIN สามารถเลือกดูงานของคนใดคนหนึ่ง หรือดูทั้งหมดได้ โดย filter จะมีผลทั้ง List view และ Calendar view

### การเปลี่ยนแปลง

**ไฟล์: `src/pages/TasksPage.tsx`**

1. เพิ่ม state `assigneeFilter` (default = `'ALL'`)
2. ดึงรายชื่อ unique assignees จาก `rows` ทั้งหมด เพื่อสร้างตัวเลือกใน dropdown
3. เพิ่ม `<Select>` component ข้างๆ TabsList — แสดงเฉพาะเมื่อ `isAdmin` เป็น true
   - ตัวเลือก: "ทั้งหมด" + รายชื่อพนักงานที่มีงาน assign (FORD, VARN, NOT, GAME ฯลฯ)
4. ปรับ logic `myRows`:
   - ADMIN + filter = ALL → แสดงทั้งหมด
   - ADMIN + filter = ชื่อ → กรองตาม `assigned_to` includes ชื่อนั้น
   - Non-ADMIN → กรองตามชื่อตัวเอง (เหมือนเดิม)

### UI Layout

```text
[ค้นหางาน...] [▼ ทั้งหมด] [รายการ | ปฏิทิน]
```

ใช้ `<Select>` จาก `@radix-ui/react-select` ที่มีอยู่แล้วในโปรเจค

