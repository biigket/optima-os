import { Lock, Brain, Zap, Bot } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const phase2Modules: Record<string, { title: string; description: string; features: string[]; phase?: number }> = {
  '/campaigns': { title: 'แคมเปญ', description: 'วางแผนและจัดการแคมเปญการตลาด', features: ['สร้างแคมเปญ', 'กำหนดกลุ่มเป้าหมาย', 'ติดตามผลลัพธ์', 'วัด ROI'] },
  '/promotions': { title: 'โปรโมชัน', description: 'จัดการโปรโมชันและส่วนลด', features: ['สร้างโปรโมชัน', 'กำหนดเงื่อนไข', 'ติดตามการใช้งาน', 'วิเคราะห์ผล'] },
  '/kol': { title: 'KOL Management', description: 'จัดการ Key Opinion Leaders', features: ['ฐานข้อมูล KOL', 'ติดตามความร่วมมือ', 'วัดผลการทำงาน', 'จัดการสัญญา'] },
  '/training': { title: 'อบรม', description: 'จัดการการอบรมพนักงานและลูกค้า', features: ['ตารางการอบรม', 'ลงทะเบียนผู้เข้าร่วม', 'ใบรับรอง', 'ประเมินผล'] },
  '/lms': { title: 'LMS', description: 'ระบบจัดการการเรียนรู้', features: ['คอร์สออนไลน์', 'วิดีโอบทเรียน', 'แบบทดสอบ', 'ติดตามความคืบหน้า'] },
  '/ai-pipeline': { title: 'AI วิเคราะห์ Pipeline', description: 'AI วิเคราะห์โอกาสขายและคาดการณ์ผลลัพธ์', phase: 3, features: ['วิเคราะห์ความน่าจะเป็นในการปิดดีล', 'จัดลำดับความสำคัญโอกาสขาย', 'แนะนำ next best action', 'ตรวจจับดีลที่เสี่ยงหลุด'] },
  '/ai-reorder': { title: 'AI ทำนาย Reorder', description: 'AI ทำนายเวลาสั่งวัสดุสิ้นเปลืองที่เหมาะสม', phase: 3, features: ['ทำนายวันที่ cartridge จะหมด', 'แนะนำจำนวนสั่งซื้อที่เหมาะสม', 'แจ้งเตือนล่วงหน้าอัตโนมัติ', 'วิเคราะห์ consumption pattern'] },
  '/ai-marketing': { title: 'AI แนะนำ Marketing', description: 'AI แนะนำกลยุทธ์การตลาดเฉพาะคลินิก', phase: 3, features: ['วิเคราะห์ profiling ลูกค้าแต่ละราย', 'แนะนำแคมเปญที่เหมาะสม', 'คาดการณ์ ROI ของแคมเปญ', 'สร้างคอนเทนต์ด้วย AI'] },
};

export default function Phase2Placeholder() {
  const location = useLocation();
  const module = phase2Modules[location.pathname];

  if (!module) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">ไม่พบหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{module.title}</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Lock size={10} /> {module.phase === 3 ? 'Phase 3 · AI' : 'Phase 2'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
      </div>

      <div className="rounded-lg border bg-card p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto">
            <Lock size={28} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">กำลังพัฒนา</h2>
            <p className="text-sm text-muted-foreground mt-1">โมดูลนี้อยู่ใน Phase 2 และจะเปิดให้ใช้งานเร็ว ๆ นี้</p>
          </div>

          <div className="text-left rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ฟีเจอร์ที่จะมี</p>
            <ul className="space-y-1.5">
              {module.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent/50" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
