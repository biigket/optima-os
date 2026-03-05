## Plan: เพิ่มระบบ Activity + History Timeline + Calendar Panel

### 1. Database Migration — สร้างตาราง `activities`

```sql
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  account_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'CALL',
  title text NOT NULL,
  activity_date date NOT NULL,
  start_time text,
  end_time text,
  priority text DEFAULT 'NORMAL',
  location text,
  description text,
  notes text,
  assigned_to text,
  contact_id uuid,
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view activities" ON public.activities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert activities" ON public.activities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update activities" ON public.activities FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update activities" ON public.activities FOR UPDATE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
```

### 2. เพิ่ม `Activity` interface ใน `src/types/index.ts`

### 3. ปรับ `OpportunityDetailPage.tsx` — เปลี่ยนโครงสร้างใหม่ทั้งหมด

#### Layout ใหม่: 2 columns โดยซ้าย 30% ขวา 70% โดยลบ section nextactions ออกให้หมด

- **ซ้าย (col-span-1):** Deal Info + Stakeholders (collapsible) ใต้ Deal Info
- **ขวา (col-span-2):** Activity Form (Focus) + History Timeline + Calendar Panel  
  
Stakeholders เปลี่ยนชื่อเป็น ผู้มีอำนาจตัดสินใจ สามารถ edit เพิ่มลบได้  
นำเอาบันทึกภายในออก

#### A. Activity Creation Form (Focus panel)

- แถว icon เลือกประเภท: 📞 Call, 👥 Meeting, 🏢 Task, 🎯 Deadline
- ช่อง Title, วันที่ + เวลาเริ่ม-สิ้นสุด
- Priority dropdown (Low / Normal / High)
- Optional: Location, Description
- Notes (yellow bg box)
- ปุ่ม "Mark as done" checkbox + Cancel + Save
- บันทึกลง DB `activities` table

#### B. Focus Panel

- Activities ที่ยังไม่ done แสดงที่นี่ (เรียงตามวันที่)
- เมื่อ mark as done → ย้ายไป History Timeline

#### C. History Timeline ยังคงบันทึกหากมีการเปลี่ยน stage ด้วย

- Tab filters: All | Activities | Notes | Changelog
- Timeline แบบ dashed line + icon
  - Notes: 📝 + yellow bg
  - Stage changes: ○ + "Stage: X → Y" + timestamp
  - Activities (done): icon ตามประเภท + title + status
- เรียงจากใหม่ → เก่า
- รวม notes + stage history + done activities

#### D. Calendar Panel

- Header: แสดงวัน/วันที่ + ปุ่ม ◀ ▶ + ปุ่ม Today
- Daily Activity List: รายการกิจกรรมของวันที่เลือก
- Time Grid: 0:00–24:00 พร้อมเส้นเวลาแดง (ถ้าวันนี้)
- Activity Blocks: render ตาม start_time/end_time + สีตาม type
- คลิก block → เปิดแก้ไข

#### E. Stakeholders → ย้ายไปซ้ายใต้ Deal Info + Collapsible และมีปุ่มให้ edit

### ไฟล์ที่แก้ไข

1. **Database migration** — สร้างตาราง `activities` + RLS + realtime
2. `**src/types/index.ts**` — เพิ่ม `Activity` interface
3. `**src/pages/OpportunityDetailPage.tsx**` — ปรับโครงสร้างใหม่ทั้งหมดตาม layout ข้างบน