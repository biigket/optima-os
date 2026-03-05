

## แผนเปิด ERP Module (Phase 2 → เปิดใช้งาน)

### สิ่งที่จะทำ

ปลดล็อก 4 โมดูล ERP ออกจาก placeholder และสร้างหน้าจริงพร้อม mock data — ใช้รูปแบบเดียวกับหน้า Phase 1 ที่มีอยู่ (ตาราง/การ์ด, search, status badge)

### 1. อัปเดต Navigation (AppLayout.tsx)
- เอา `locked: true` ออกจาก 4 items ใน ERP group
- เปลี่ยน phase ของ ERP group เป็น `1` (หรือเอา phase divider ออก)

### 2. เพิ่ม Mock Data (mockData.ts)
- เพิ่ม `mockQuotations` — ใบเสนอราคา (รหัส, ลูกค้า, รายการ, ยอดรวม, สถานะ: ร่าง/ส่งแล้ว/อนุมัติ/ปฏิเสธ)
- เพิ่ม `mockSalesOrders` — ใบสั่งขาย (รหัส, ลูกค้า, สถานะ: ร่าง/ยืนยัน/จัดส่งแล้ว, การชำระ)
- ขยาย `mockInventory` เพิ่มรายการสินค้าอีก 3-4 ชิ้น
- เพิ่ม `mockInvoices` — ใบแจ้งหนี้ (รหัส, ลูกค้า, ยอด, วันครบกำหนด, สถานะชำระ)

### 3. สร้าง 4 หน้าใหม่
แต่ละหน้าจะมี: header + คำอธิบาย, ช่องค้นหา, ตาราง/การ์ดแสดงข้อมูล, status badge

- **QuotationsPage.tsx** — ตารางใบเสนอราคา แสดง: เลขที่, ลูกค้า, ยอด, วันที่, สถานะอนุมัติ
- **SalesOrdersPage.tsx** — ตารางใบสั่งขาย แสดง: เลขที่, ลูกค้า, ประเภท, สถานะ order/payment/shipping
- **InventoryPage.tsx** — ตาราง/การ์ดคลังสินค้าทุกประเภท (device + consumable + part) พร้อม filter ตาม category
- **InvoicesPage.tsx** — ตารางใบแจ้งหนี้ แสดง: เลขที่, ลูกค้า, ยอด, วันครบกำหนด, สถานะชำระ

### 4. อัปเดต Routing (App.tsx)
- ย้าย `/quotations`, `/sales-orders`, `/inventory`, `/invoices` ออกจาก `phase2Routes`
- เพิ่ม Route ชี้ไปหน้าจริง

### 5. อัปเดต Types (types/index.ts)
- เพิ่ม `Quotation` interface (ถ้ายังไม่มี)
- เพิ่ม `Invoice` interface แยกจาก `FinanceDocument`

### 6. ลบ ERP entries จาก Phase2Placeholder
- เอา `/quotations`, `/sales-orders`, `/inventory`, `/invoices` ออกจาก `phase2Modules` map

---

ทุกหน้าจะใช้ mock data ก่อน — พร้อมย้ายไป Lovable Cloud database ได้ทันทีในขั้นถัดไป

