import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Target, MapPin, FileText, Presentation, CalendarDays,
  ListTodo, Calendar, Cpu, Package, Wrench, ChevronLeft, ChevronRight, Bell,
  FileSpreadsheet, ShoppingCart, Warehouse, Receipt, CreditCard,
  Megaphone, Gift, Star,
  GraduationCap, BookOpen,
  TrendingUp, BarChart3,
  Lock, Bot, Brain, Zap, LogOut, Menu, X, ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/hooks/useMockAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navGroups = [
  {
    label: 'CRM',
    phase: 1,
    items: [
      { to: '/leads', icon: Users, label: 'ลูกค้า' },
      { to: '/opportunities', icon: Target, label: 'โอกาสขาย' },
    ],
  },
  {
    label: 'PRE-CRM',
    phase: 1,
    items: [
      { to: '/weekly-plan', icon: CalendarDays, label: 'แผนเยี่ยมรายสัปดาห์' },
      { to: '/visit-checkin', icon: MapPin, label: 'เช็คอินเยี่ยมลูกค้า' },
      { to: '/visit-reports', icon: FileText, label: 'รายงานเยี่ยมลูกค้า' },
    ],
  },
  {
    label: 'SALES OPERATION',
    phase: 1,
    items: [
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
    phase: 1,
    items: [
      { to: '/quotations', icon: FileSpreadsheet, label: 'ใบเสนอราคา' },
      { to: '/payments', icon: CreditCard, label: 'การชำระเงิน' },
      { to: '/sales-orders', icon: ShoppingCart, label: 'ใบสั่งขาย' },
      { to: '/inventory', icon: Warehouse, label: 'คลังสินค้า' },
      { to: '/invoices', icon: Receipt, label: 'ใบแจ้งหนี้' },
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
    phase: 1,
    items: [
      { to: '/forecast', icon: TrendingUp, label: 'พยากรณ์' },
      { to: '/analytics', icon: BarChart3, label: 'วิเคราะห์' },
    ],
  },
  {
    label: 'AI AUTOMATION',
    phase: 3,
    items: [
      { to: '/ai-pipeline', icon: Brain, label: 'AI วิเคราะห์ Pipeline', locked: true },
      { to: '/ai-reorder', icon: Zap, label: 'AI ทำนาย Reorder', locked: true },
      { to: '/ai-marketing', icon: Bot, label: 'AI แนะนำ Marketing', locked: true },
    ],
  },
];

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
      {navGroups.map((group, gi) => {
        const prevGroup = navGroups[gi - 1];
        const showDivider = prevGroup && group.phase !== prevGroup.phase;
        const dividerLabel = group.phase === 2 ? 'Phase 2' : group.phase === 3 ? 'Phase 3' : '';
        const isLockedGroup = group.phase === 2 || group.phase === 3;

        return (
          <div key={group.label}>
            {showDivider && !collapsed && (
              <div className="flex items-center gap-2 px-2 mb-3 mt-2">
                <div className="flex-1 border-t border-sidebar-border" />
                <span className="text-[9px] font-semibold tracking-widest text-sidebar-muted/60 uppercase">{dividerLabel}</span>
                <div className="flex-1 border-t border-sidebar-border" />
              </div>
            )}
            {showDivider && collapsed && (
              <div className="border-t border-sidebar-border mx-2 mb-3 mt-2" />
            )}
            {!collapsed && (
              <p className={cn(
                'px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase',
                isLockedGroup ? 'text-sidebar-muted/50' : 'text-sidebar-muted'
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
                    onClick={(e) => {
                      if (isLocked) { e.preventDefault(); return; }
                      onNavigate?.();
                    }}
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
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout } = useMockAuth();
  const displayName = currentUser?.name || 'Guest';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sidebar-gradient hidden md:flex flex-col border-r border-sidebar-border transition-all duration-200',
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

        <SidebarNav collapsed={collapsed} />

        <div className="border-t border-sidebar-border p-2">
          <div className={cn('flex items-center gap-3 rounded-md px-2.5 py-2', collapsed && 'justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                </div>
                <button onClick={logout} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-muted" title="ออกจากระบบ">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="sidebar-gradient p-0 w-72 border-sidebar-border [&>button]:hidden flex flex-col h-full overflow-hidden">
          <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
            <span className="text-sm font-semibold tracking-wide text-sidebar-primary-foreground">
              OPTIMA<span className="text-sidebar-primary"> OS</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded hover:bg-sidebar-accent text-sidebar-muted"
            >
              <X size={16} />
            </button>
          </div>

          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />

          <div className="border-t border-sidebar-border p-2">
            <div className="flex items-center gap-3 rounded-md px-2.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
              </div>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-muted" title="ออกจากระบบ">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-muted text-muted-foreground">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}