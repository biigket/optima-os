import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Users, Target, MapPin, FileText, Presentation, CalendarDays,
  ListTodo, Calendar, Cpu, Package, Wrench, FileSpreadsheet, Warehouse, CreditCard,
  TrendingUp, BarChart3, MessageCircle, Fingerprint, BarChart, Settings,
  Download, ChevronRight, ClipboardCheck, Receipt, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const guideModules = [
  {
    group: 'ANALYTICS',
    icon: LayoutDashboard,
    modules: [
      {
        title: 'แดชบอร์ด (Dashboard)',
        icon: LayoutDashboard,
        path: '/',
        description: 'หน้าแรกของระบบแสดงภาพรวมธุรกิจ',
        features: [
          'ดู KPI สำคัญ: ยอดขาย, โอกาสขาย, จำนวนสาธิต, ใบเสนอราคา',
          'กราฟ Pipeline แสดงมูลค่าโอกาสขายแต่ละ Stage',
          'บอร์ดประกาศ: ดูข่าวสาร ปักหมุดประกาศสำคัญ แนบไฟล์ได้',
        ],
        steps: [
          'เข้าสู่ระบบด้วยบัญชีของคุณ',
          'หน้าแดชบอร์ดจะแสดงอัตโนมัติเป็นหน้าแรก',
          'ดู KPI Cards ด้านบนสำหรับตัวเลขสำคัญ',
          'เลื่อนลงดูกราฟ Pipeline และบอร์ดประกาศ',
        ],
      },
      {
        title: 'Optima AI (แชทบอท)',
        icon: MessageCircle,
        path: '/chatbot',
        description: 'ผู้ช่วย AI ที่ดึงข้อมูลจริงจากทั้งระบบมาตอบ',
        features: [
          'ถามข้อมูลสต็อกสินค้า, โอกาสขาย, เดโม, ใบเสนอราคา',
          'ถามข้อมูลลูกค้า, สัญญา, การชำระเงิน, ใบแจ้งซ่อม',
          'ตอบแบบ Streaming real-time พร้อม Suggestion buttons',
        ],
        steps: [
          'คลิกเมนู "Optima AI" ใน sidebar',
          'พิมพ์คำถามในช่องแชท เช่น "สต็อก Trica มีกี่เครื่อง?"',
          'หรือกดปุ่ม Suggestion ด้านล่างเพื่อถามคำถามสำเร็จรูป',
          'AI จะดึงข้อมูลจริงจากฐานข้อมูลมาตอบทันที',
        ],
      },
    ],
  },
  {
    group: 'CRM',
    icon: Users,
    modules: [
      {
        title: 'ลูกค้า (Leads/Accounts)',
        icon: Users,
        path: '/leads',
        description: 'จัดการข้อมูลลูกค้าทั้งหมด',
        features: [
          'ค้นหาและกรองลูกค้าตามชื่อ, สถานะ, เกรด, เซลล์',
          'ดูบัตรลูกค้า (Customer Card) พร้อมข้อมูลครบถ้วน',
          'เพิ่ม/แก้ไขผู้ติดต่อ, อัปโหลดเอกสาร, บันทึกหมายเหตุ',
          'ดูโอกาสขายและใบเสนอราคาที่เชื่อมกับลูกค้า',
        ],
        steps: [
          'คลิก "ลูกค้า" ใน sidebar',
          'ใช้ช่องค้นหาหรือตัวกรองเพื่อหาลูกค้า',
          'คลิกชื่อลูกค้าเพื่อเปิดบัตรลูกค้า',
          'ในบัตรลูกค้า: แก้ไขข้อมูล, เพิ่มผู้ติดต่อ, ดูประวัติทั้งหมด',
        ],
      },
      {
        title: 'โอกาสขาย (Opportunities)',
        icon: Target,
        path: '/opportunities',
        description: 'จัดการ Pipeline การขายแบบ Kanban',
        features: [
          'ดู Kanban Board แบ่งตาม Stage: Lead → Qualified → Proposal → Negotiation → Won/Lost',
          'ลากย้าย Card เพื่อเปลี่ยน Stage',
          'สร้างโอกาสขายใหม่ พร้อมเลือกลูกค้าและสินค้า',
          'บันทึกกิจกรรม, หมายเหตุ, ไฟล์แนบ ในแต่ละโอกาสขาย',
        ],
        steps: [
          'คลิก "โอกาสขาย" ใน sidebar',
          'ดู Kanban Board ภาพรวม Pipeline',
          'กดปุ่ม "+" เพื่อสร้างโอกาสขายใหม่',
          'คลิกที่ Card เพื่อดูรายละเอียดและบันทึกกิจกรรม',
          'ลากย้าย Card ไปยัง Stage ที่ต้องการ',
        ],
      },
    ],
  },
  {
    group: 'PRE-CRM',
    icon: MapPin,
    modules: [
      {
        title: 'แผนเยี่ยมรายสัปดาห์',
        icon: CalendarDays,
        path: '/weekly-plan',
        description: 'วางแผนการเยี่ยมลูกค้าล่วงหน้า',
        features: [
          'สร้างแผนเยี่ยมลูกค้ารายวัน/สัปดาห์',
          'ระบุวัตถุประสงค์, สินค้าที่จะนำเสนอ, เวลา',
          'ดูสถานะ: วางแผน / เสร็จสิ้น / ยกเลิก',
          'เชื่อมกับรายงานเยี่ยมลูกค้าอัตโนมัติ',
        ],
        steps: [
          'คลิก "แผนเยี่ยมรายสัปดาห์" ใน sidebar',
          'เลือกวันที่ในปฏิทิน',
          'กดปุ่ม "เพิ่มแผนเยี่ยม" → เลือกลูกค้า, ใส่รายละเอียด',
          'บันทึกแผนและติดตามสถานะ',
        ],
      },
      {
        title: 'เช็คอินเยี่ยมลูกค้า',
        icon: MapPin,
        path: '/visit-checkin',
        description: 'เช็คอิน GPS เมื่อถึงสถานที่ลูกค้า',
        features: [
          'เช็คอินพร้อมพิกัด GPS อัตโนมัติ',
          'ถ่ายรูปหน้าร้าน',
          'เลือกลูกค้าจากรายชื่อ',
          'เช็คเอาท์เมื่อเสร็จสิ้นการเยี่ยม',
        ],
        steps: [
          'คลิก "เช็คอินเยี่ยมลูกค้า"',
          'เลือกลูกค้าที่ต้องการเยี่ยม',
          'กดปุ่ม "เช็คอิน" (ระบบจะดึงพิกัด GPS อัตโนมัติ)',
          'เมื่อเสร็จ กดปุ่ม "เช็คเอาท์" พร้อมกรอกรายงาน',
        ],
      },
      {
        title: 'รายงานเยี่ยมลูกค้า',
        icon: FileText,
        path: '/visit-reports',
        description: 'ดูรายงานการเยี่ยมลูกค้าทั้งหมด',
        features: [
          'ดูประวัติการเยี่ยมย้อนหลัง',
          'กรองตามวัน, เซลล์, ลูกค้า',
          'ดูรายละเอียด: เวลาเข้า-ออก, รูปภาพ, หมายเหตุ',
        ],
        steps: [
          'คลิก "รายงานเยี่ยมลูกค้า"',
          'ใช้ตัวกรองเพื่อค้นหารายงานที่ต้องการ',
          'คลิกที่รายการเพื่อดูรายละเอียด',
        ],
      },
    ],
  },
  {
    group: 'SALES OPERATION',
    icon: Presentation,
    modules: [
      {
        title: 'สาธิตสินค้า (Demos)',
        icon: Presentation,
        path: '/demos',
        description: 'จัดการนัดสาธิตสินค้า',
        features: [
          'สร้างนัดสาธิตพร้อมเลือกสินค้าและลูกค้า',
          'ยืนยันนัดหมาย / เตือนความจำ',
          'ส่งรายงานสาธิต: บันทึกจำนวน Shot, ผลลัพธ์',
          'เชื่อมกับโอกาสขายอัตโนมัติ',
        ],
        steps: [
          'คลิก "สาธิตสินค้า"',
          'กดปุ่ม "สร้างนัดสาธิต" → เลือกลูกค้า, สินค้า, วันที่',
          'กดปุ่ม "ยืนยัน" เมื่อลูกค้าตอบรับ',
          'หลังสาธิต กดปุ่ม "ส่งรายงาน" เพื่อบันทึกผล',
        ],
      },
    ],
  },
  {
    group: 'ATTENDANCE',
    icon: Fingerprint,
    modules: [
      {
        title: 'เช็คอินทำงาน',
        icon: Fingerprint,
        path: '/work-checkin',
        description: 'บันทึกเวลาเข้า-ออกงานประจำวัน',
        features: [
          'เช็คอินพร้อม GPS และรูปถ่าย',
          'เลือกประเภทการทำงาน: Office / นอกสถานที่',
          'เช็คเอาท์พร้อมบันทึกหมายเหตุ',
        ],
        steps: [
          'คลิก "เช็คอินทำงาน"',
          'เลือกประเภทงาน แล้วกด "เช็คอิน"',
          'ตอนเลิกงาน กด "เช็คเอาท์"',
        ],
      },
      {
        title: 'สรุปการเข้างาน',
        icon: BarChart,
        path: '/attendance',
        description: 'ดูสถิติการเข้างานรายเดือน',
        features: [
          'ดูสรุปจำนวนวันทำงาน, มาสาย, ขาดงาน',
          'กรองตามชื่อพนักงานและเดือน',
          'Export ข้อมูลได้',
        ],
        steps: [
          'คลิก "สรุปการเข้างาน"',
          'เลือกเดือนที่ต้องการดู',
          'ดูตารางสรุปของแต่ละคน',
        ],
      },
    ],
  },
  {
    group: 'OPERATION',
    icon: ListTodo,
    modules: [
      {
        title: 'งาน (Tasks)',
        icon: ListTodo,
        path: '/tasks',
        description: 'จัดการงานและ To-do List',
        features: [
          'สร้าง, แก้ไข, ลบงาน',
          'กำหนดลำดับความสำคัญ, วันครบกำหนด',
          'ทำเครื่องหมายเสร็จสิ้น',
        ],
        steps: [
          'คลิก "งาน" ใน sidebar',
          'กดปุ่ม "เพิ่มงาน" → กรอกรายละเอียด',
          'คลิกที่งานเพื่อแก้ไขหรือทำเครื่องหมายเสร็จ',
        ],
      },
      {
        title: 'ปฏิทิน (Calendar)',
        icon: Calendar,
        path: '/calendar',
        description: 'ดูปฏิทินกิจกรรมทั้งหมด',
        features: [
          'แสดงกิจกรรม, นัดหมาย, เดโม ในรูปแบบปฏิทิน',
          'มุมมองรายเดือน / รายสัปดาห์ / รายวัน',
          'สร้างกิจกรรมใหม่จากปฏิทินได้',
        ],
        steps: [
          'คลิก "ปฏิทิน"',
          'เลือกมุมมอง: เดือน / สัปดาห์ / วัน',
          'คลิกวันที่เพื่อสร้างกิจกรรม หรือคลิกกิจกรรมเพื่อดูรายละเอียด',
        ],
      },
    ],
  },
  {
    group: 'INSTALLED BASE',
    icon: Cpu,
    modules: [
      {
        title: 'Install Base',
        icon: Cpu,
        path: '/install-base',
        description: 'จัดการเครื่องที่ติดตั้งให้ลูกค้า',
        features: [
          'ดูรายการเครื่องที่ติดตั้งทั้งหมด พร้อม Serial Number',
          'ดูสถานะเครื่อง: Active / Under Warranty / Expired',
          'บันทึกรายงาน PM (Preventive Maintenance) ตามรุ่นสินค้า',
          'ดูกำหนดการ PM ครั้งถัดไป',
        ],
        steps: [
          'คลิก "Install Base"',
          'ค้นหาเครื่องด้วย Serial Number หรือชื่อลูกค้า',
          'คลิกที่เครื่องเพื่อดูรายละเอียดและ PM Schedule',
          'กดปุ่ม "บันทึก PM" เพื่อกรอกรายงาน PM ตามรุ่น',
        ],
      },
      {
        title: 'วัสดุสิ้นเปลือง (Consumables)',
        icon: Package,
        path: '/consumables',
        description: 'ติดตามวัสดุสิ้นเปลืองของลูกค้า',
        features: [
          'บันทึกการใช้วัสดุสิ้นเปลือง',
          'ดูปริมาณคงเหลือ',
          'แจ้งเตือนเมื่อใกล้หมด',
        ],
        steps: [
          'คลิก "วัสดุสิ้นเปลือง"',
          'ดูรายการสินค้าทั้งหมด',
          'เพิ่มรายการใหม่หรือแก้ไขจำนวน',
        ],
      },
    ],
  },
  {
    group: 'SERVICE',
    icon: Wrench,
    modules: [
      {
        title: 'ซ่อมบำรุง (Maintenance)',
        icon: Wrench,
        path: '/maintenance',
        description: 'จัดการใบแจ้งซ่อมและติดตามงานซ่อม',
        features: [
          'สร้างใบแจ้งซ่อมพร้อมบันทึกอาการ, ถ่ายรูปประกอบ',
          'ติดตามสถานะ: เปิด / กำลังดำเนินการ / เสร็จสิ้น',
          'อัปเดตความคืบหน้าพร้อมรูปภาพ',
          'ค้นหาตาม Serial Number / ลูกค้า',
        ],
        steps: [
          'คลิก "ซ่อมบำรุง"',
          'กดปุ่ม "สร้างใบแจ้งซ่อม" → เลือกเครื่อง, กรอกอาการ',
          'ติดตามสถานะในรายการ',
          'คลิกที่ใบแจ้งซ่อมเพื่ออัปเดตความคืบหน้า',
        ],
      },
      {
        title: 'QC สินค้า / สถานะสินค้า',
        icon: ClipboardCheck,
        path: '/qc-stock',
        description: 'ตรวจสอบคุณภาพสินค้าก่อนส่งมอบ',
        features: [
          'รับเครื่องเข้าสต็อกพร้อมตรวจ QC',
          'แบบฟอร์มตรวจรับเฉพาะรุ่น: Trica 3D, Quattro, Picohi, Freezero, ND2, Cartridge',
          'จัดการสถานะ: In Stock / Reserved / Installed / Borrowed',
          'ดูรายละเอียดและประวัติของแต่ละเครื่อง',
        ],
        steps: [
          'คลิก "QC สินค้า"',
          'กดปุ่ม "รับเครื่องเข้า" → เลือกรุ่นสินค้า',
          'กรอกแบบฟอร์ม QC ตามรุ่น',
          'จัดการสถานะสินค้าในรายการ',
        ],
      },
    ],
  },
  {
    group: 'ERP',
    icon: FileSpreadsheet,
    modules: [
      {
        title: 'ใบเสนอราคา (Quotations)',
        icon: FileSpreadsheet,
        path: '/quotations',
        description: 'สร้างและจัดการใบเสนอราคา',
        features: [
          'สร้างใบเสนอราคาพร้อมเลขรัน QT อัตโนมัติ',
          'เลือกสินค้า, ราคา, เงื่อนไขการชำระเงิน',
          'ส่งอนุมัติ → ผู้จัดการอนุมัติ/ปฏิเสธ',
          'ส่งให้ลูกค้าเซ็นผ่านลิงก์ออนไลน์',
          'ดูและพิมพ์ใบเสนอราคา PDF',
        ],
        steps: [
          'คลิก "ใบเสนอราคา"',
          'กดปุ่ม "สร้างใบเสนอราคา" → กรอกข้อมูล',
          'กดปุ่ม "ส่งอนุมัติ" เพื่อส่งให้ผู้จัดการ',
          'หลังอนุมัติ → ส่งลิงก์ให้ลูกค้าเซ็น',
          'ดูสถานะ: ร่าง / รออนุมัติ / อนุมัติ / ลูกค้าเซ็น / ปฏิเสธ',
        ],
      },
      {
        title: 'หนังสือสัญญาซื้อขาย (Contracts)',
        icon: Receipt,
        path: '/contracts',
        description: 'สร้างสัญญาซื้อขายจากใบเสนอราคา',
        features: [
          'สร้างสัญญาอัตโนมัติจากใบเสนอราคาที่ลูกค้าเซ็นแล้ว',
          'กรอกข้อมูลผู้ซื้อ-ผู้ขาย, เงื่อนไข, การรับประกัน',
          'ลงลายเซ็นดิจิทัล',
          'พิมพ์ PDF สัญญา',
        ],
        steps: [
          'คลิก "หนังสือสัญญาซื้อขาย"',
          'กดปุ่ม "สร้างสัญญา" → เลือกใบเสนอราคาเป็นฐาน',
          'กรอกรายละเอียดสัญญา',
          'ลงลายเซ็นและบันทึก',
        ],
      },
      {
        title: 'การชำระเงิน (Payments)',
        icon: CreditCard,
        path: '/payments',
        description: 'ติดตามและจัดการการชำระเงิน',
        features: [
          'ดู KPI การชำระเงิน: ยอดรวม, ค้างชำระ, เกินกำหนด',
          'จัดการงวดการชำระ (Installments)',
          'อัปโหลดสลิปโอนเงิน → ตรวจสอบ → อนุมัติ',
          'สร้างลิงก์ชำระเงินออนไลน์',
        ],
        steps: [
          'คลิก "การชำระเงิน"',
          'ค้นหาใบเสนอราคาที่ต้องการจัดการ',
          'คลิกเพื่อดูรายละเอียดการชำระ',
          'อัปโหลดสลิปหรือสร้างลิงก์ชำระเงิน',
        ],
      },
      {
        title: 'คลังสินค้า (Inventory)',
        icon: Warehouse,
        path: '/inventory',
        description: 'ดูสต็อกสินค้าคงเหลือ',
        features: [
          'ดูจำนวนสินค้าคงเหลือแยกตามรุ่น',
          'ดูสถานะ: พร้อมขาย / จอง / ติดตั้งแล้ว',
          'ดูราคาและข้อมูลสินค้า',
        ],
        steps: [
          'คลิก "คลังสินค้า"',
          'ดูตารางสรุปสินค้าทั้งหมด',
          'ใช้ตัวกรองเพื่อค้นหาสินค้าที่ต้องการ',
        ],
      },
    ],
  },
  {
    group: 'INTELLIGENCE',
    icon: TrendingUp,
    modules: [
      {
        title: 'พยากรณ์ (Forecast)',
        icon: TrendingUp,
        path: '/forecast',
        description: 'พยากรณ์ยอดขายล่วงหน้า',
        features: [
          'ดูกราฟพยากรณ์ยอดขายรายเดือน',
          'ดูแนวโน้มและเปรียบเทียบกับเป้าหมาย',
        ],
        steps: [
          'คลิก "พยากรณ์"',
          'ดูกราฟและตารางพยากรณ์',
        ],
      },
      {
        title: 'วิเคราะห์ (Analytics)',
        icon: BarChart3,
        path: '/analytics',
        description: 'วิเคราะห์ข้อมูลเชิงลึก',
        features: [
          'วิเคราะห์ประสิทธิภาพการขาย',
          'ดูแนวโน้ม, อัตราการปิดดีล',
          'เปรียบเทียบผลงานรายบุคคล',
        ],
        steps: [
          'คลิก "วิเคราะห์"',
          'เลือกรายงานที่ต้องการดู',
          'ใช้ตัวกรองเพื่อปรับช่วงเวลาและข้อมูล',
        ],
      },
    ],
  },
  {
    group: 'SYSTEM',
    icon: Settings,
    modules: [
      {
        title: 'ตั้งค่า (Settings)',
        icon: Settings,
        path: '/settings',
        description: 'ตั้งค่าระบบและจัดการสิทธิ์',
        features: [
          'ตั้งค่าข้อมูลบริษัท',
          'จัดการสิทธิ์การเข้าถึงโมดูลตาม Role',
          'ตั้งค่าทั่วไปของระบบ',
        ],
        steps: [
          'คลิก "ตั้งค่า"',
          'เลือกหมวดที่ต้องการตั้งค่า',
          'บันทึกเมื่อเสร็จสิ้น',
        ],
      },
      {
        title: 'นำเข้า CSV',
        icon: FileSpreadsheet,
        path: '/csv-import',
        description: 'นำเข้าข้อมูลจากไฟล์ CSV',
        features: [
          'นำเข้าข้อมูลลูกค้า, สินค้า, ผู้ติดต่อ จากไฟล์ CSV',
          'ตรวจสอบข้อมูลก่อนนำเข้า',
          'รายงานผลการนำเข้า',
        ],
        steps: [
          'คลิก "นำเข้า CSV"',
          'เลือกประเภทข้อมูลที่ต้องการนำเข้า',
          'อัปโหลดไฟล์ CSV',
          'ตรวจสอบข้อมูลและกดนำเข้า',
        ],
      },
    ],
  },
];

export default function UserGuidePage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const el = contentRef.current;
    if (!el) return;

    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: 'Optima-OS-User-Guide.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(el)
      .save();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">คู่มือการใช้งาน Optima OS</h1>
            <p className="text-sm text-muted-foreground">คำแนะนำการใช้งานทุกโมดูลในระบบ</p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download size={16} />
          ดาวน์โหลด PDF
        </Button>
      </div>

      {/* Quick Nav */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">สารบัญ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {guideModules.map((g) => (
              <Badge
                key={g.group}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => {
                  document.getElementById(`section-${g.group}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <g.icon className="h-3 w-3 mr-1" />
                {g.group}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guide Content */}
      <div ref={contentRef} className="space-y-8">
        {/* PDF Header (hidden in web, visible in print) */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-3xl font-bold">คู่มือการใช้งาน Optima OS</h1>
          <p className="text-muted-foreground">ระบบจัดการธุรกิจครบวงจร</p>
        </div>

        {guideModules.map((group) => (
          <div key={group.group} id={`section-${group.group}`}>
            <div className="flex items-center gap-2 mb-4">
              <group.icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{group.group}</h2>
            </div>

            <div className="grid gap-4">
              {group.modules.map((mod) => {
                const isOpen = activeModule === mod.path;
                return (
                  <Card
                    key={mod.path}
                    className={cn(
                      'transition-all cursor-pointer',
                      isOpen && 'ring-1 ring-primary/30'
                    )}
                  >
                    <CardHeader
                      className="pb-2 cursor-pointer"
                      onClick={() => setActiveModule(isOpen ? null : mod.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <mod.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{mod.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className={cn(
                            'text-muted-foreground transition-transform',
                            isOpen && 'rotate-90'
                          )}
                        />
                      </div>
                    </CardHeader>

                    {/* Always visible in print */}
                    <CardContent className={cn('space-y-4', !isOpen && 'hidden print:block')}>
                      {/* Features */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">ฟีเจอร์หลัก</h4>
                        <ul className="space-y-1.5">
                          {mod.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Steps */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">ขั้นตอนการใช้งาน</h4>
                        <ol className="space-y-1.5">
                          {mod.steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                {i + 1}
                              </span>
                              {s}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
