

## แผน: Set up module ลูกค้า (Leads → ลูกค้า) เชื่อมฐานข้อมูลจริง

### สิ่งที่ต้องทำ

#### 1. เปลี่ยนชื่อ "ลีด" → "ลูกค้า" ทั่วทั้งระบบ
- Sidebar: เปลี่ยน label จาก "ลีด" เป็น "ลูกค้า" ใน `AppLayout.tsx`
- หน้า LeadsPage: เปลี่ยนหัวข้อ, placeholder, ปุ่มทั้งหมดเป็น "ลูกค้า"

#### 2. เชื่อมข้อมูลจากฐานข้อมูลจริง (114 accounts)
- เลิกใช้ `mockAccounts` / `mockContacts` → ใช้ Supabase query แทน
- ใช้ `@tanstack/react-query` + `supabase` client ดึง accounts + contacts
- แสดง loading state และ error state

#### 3. เพิ่มฟิลเตอร์สถานะ
- เพิ่ม filter tabs/buttons สำหรับ `customer_status`: ทั้งหมด, NEW_LEAD, PURCHASED, DEMO_DONE, NEGOTIATION, DORMANT, CLOSED
- ค้นหาได้ตาม clinic_name, company_name, address, assigned_sale

#### 4. ทำปุ่ม "เพิ่มลูกค้าใหม่" ใช้งานได้
- สร้าง Dialog/Sheet form สำหรับเพิ่มลูกค้าใหม่
- ฟิลด์: clinic_name (จำเป็น), company_name, address, tax_id, entity_type, branch_type, phone, email, customer_status, assigned_sale, notes
- Insert เข้า Supabase ผ่าน mutation → refresh list

#### 5. ทำ Card ลูกค้าคลิกดู/แก้ไขได้
- คลิก Card → เปิด Dialog แสดงรายละเอียดลูกค้าครบทุกฟิลด์
- สามารถแก้ไขข้อมูลได้ (inline edit) → Update ผ่าน Supabase

#### 6. แก้ RLS ให้ anon users เข้าถึงได้ (เนื่องจากเอา Auth ออก)
- ปัจจุบัน RLS policies ใช้ `authenticated` role → ต้องเพิ่ม policy สำหรับ `anon` หรือเปลี่ยนเป็น `public` เพื่อให้ใช้งานได้โดยไม่ต้อง login

### ไฟล์ที่แก้ไข
| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `src/pages/LeadsPage.tsx` | Rewrite ทั้งหน้า: ดึง DB, ฟิลเตอร์, เพิ่ม/แก้ไขลูกค้า |
| `src/components/layout/AppLayout.tsx` | เปลี่ยน "ลีด" → "ลูกค้า" |
| `supabase/migrations/` | เพิ่ม RLS policy สำหรับ anon access |

### หมายเหตุทางเทคนิค
- ข้อมูลในฐานข้อมูลมี 114 accounts จริง มีสถานะ NEW_LEAD และ PURCHASED
- ใช้ `useQuery` สำหรับ fetch, `useMutation` สำหรับ insert/update พร้อม `invalidateQueries`
- Form validation ใช้ required fields ตรง `clinic_name` เป็นหลัก

