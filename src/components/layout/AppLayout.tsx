import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Target, MapPin, FileText, Presentation,
  ListTodo, Calendar, Cpu, Package, Wrench, ChevronLeft, ChevronRight, Bell,
  FileSpreadsheet, ShoppingCart, Warehouse, Receipt,
  Megaphone, Gift, Star,
  GraduationCap, BookOpen,
  TrendingUp, BarChart3,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'CRM',
    phase: 1,
    items: [
      { to: '/leads', icon: Users, label: 'ลีด' },
      { to: '/opportunities', icon: Target, label: 'โอกาสขาย' },
    ],
  },
  {
    label: 'SALES OPERATION',
    phase: 1,
    items: [
      { to: '/visit-checkin', icon: MapPin, label: 'เช็คอินเยี่ยมลูกค้า' },
      { to: '/visit-reports', icon: FileText, label: 'รายงานเยี่ยมลูกค้า' },
      { to: '/demos', icon: Presentation, label: 'สาธิตสินค้า' },
    ],
  },
  {
    label: 'OPERATION',
    phase: 1,
    items: [
      { to: '/tasks', icon: ListTodo, label: 'งาน' },
      { to: '/calendar', icon: Calendar, label: 'ปฏิทิน' },
    ],
  },
  {
    label: 'INSTALLED BASE',
    phase: 1,
    items: [
      { to: '/devices', icon: Cpu, label: 'เครื่องมือ' },
      { to: '/consumables', icon: Package, label: 'วัสดุสิ้นเปลือง' },
    ],
  },
  {
    label: 'SERVICE',
    phase: 1,
    items: [
      { to: '/maintenance', icon: Wrench, label: 'ซ่อมบำรุง' },
    ],
  },
  {
    label: 'ANALYTICS',
    phase: 1,
    items: [
      { to: '/', icon: LayoutDashboard, label: 'แดชบอร์ด' },
    ],
  },
  {
    label: 'ERP',
    phase: 2,
    items: [
      { to: '/quotations', icon: FileSpreadsheet, label: 'ใบเสนอราคา', locked: true },
      { to: '/sales-orders', icon: ShoppingCart, label: 'ใบสั่งขาย', locked: true },
      { to: '/inventory', icon: Warehouse, label: 'คลังสินค้า', locked: true },
      { to: '/invoices', icon: Receipt, label: 'ใบแจ้งหนี้', locked: true },
    ],
  },
  {
    label: 'MARKETING',
    phase: 2,
    items: [
      { to: '/campaigns', icon: Megaphone, label: 'แคมเปญ', locked: true },
      { to: '/promotions', icon: Gift, label: 'โปรโมชัน', locked: true },
      { to: '/kol', icon: Star, label: 'KOL', locked: true },
    ],
  },
  {
    label: 'EDUCATION',
    phase: 2,
    items: [
      { to: '/training', icon: GraduationCap, label: 'อบรม', locked: true },
      { to: '/lms', icon: BookOpen, label: 'LMS', locked: true },
    ],
  },
  {
    label: 'INTELLIGENCE',
    phase: 2,
    items: [
      { to: '/forecast', icon: TrendingUp, label: 'พยากรณ์', locked: true },
      { to: '/analytics', icon: BarChart3, label: 'วิเคราะห์', locked: true },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'sidebar-gradient flex flex-col border-r border-sidebar-border transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide text-sidebar-primary-foreground">
              OPTIMA<span className="text-sidebar-primary"> OS</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-sidebar-accent text-sidebar-muted"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group, gi) => {
            const isPhase2 = group.phase === 2;
            const prevGroup = navGroups[gi - 1];
            const showDivider = isPhase2 && prevGroup && prevGroup.phase === 1;

            return (
              <div key={group.label}>
                {showDivider && !collapsed && (
                  <div className="flex items-center gap-2 px-2 mb-3 mt-2">
                    <div className="flex-1 border-t border-sidebar-border" />
                    <span className="text-[9px] font-semibold tracking-widest text-sidebar-muted/60 uppercase">Phase 2</span>
                    <div className="flex-1 border-t border-sidebar-border" />
                  </div>
                )}
                {showDivider && collapsed && (
                  <div className="border-t border-sidebar-border mx-2 mb-3 mt-2" />
                )}
                {!collapsed && (
                  <p className={cn(
                    'px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase',
                    isPhase2 ? 'text-sidebar-muted/50' : 'text-sidebar-muted'
                  )}>
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.to;
                    const isLocked = 'locked' in item && item.locked;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                          isLocked
                            ? 'text-sidebar-muted/40 cursor-default'
                            : isActive
                              ? 'bg-sidebar-accent text-sidebar-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                        onClick={isLocked ? (e) => e.preventDefault() : undefined}
                      >
                        <item.icon size={18} />
                        {!collapsed && (
                          <span className="flex-1">{item.label}</span>
                        )}
                        {!collapsed && isLocked && <Lock size={12} className="text-sidebar-muted/40" />}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <div className={cn('flex items-center gap-3 rounded-md px-2.5 py-2', collapsed && 'justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              SP
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">สมชาย พาเทล</p>
                <p className="text-[10px] text-sidebar-muted">ผู้ดูแลระบบ</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
