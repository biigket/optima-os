import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Target, MapPin, FileText, Presentation, CalendarDays,
  ListTodo, Calendar, Cpu, Package, Wrench, ChevronLeft, ChevronRight, Bell,
  FileSpreadsheet, ShoppingCart, Warehouse, Receipt, CreditCard,
  TrendingUp, BarChart3, MessageCircle,
  Lock, LogOut, Menu, X, ClipboardCheck, Fingerprint, BarChart, Settings, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/hooks/useMockAuth';
import { useRolePermissions, ROLE_LABELS } from '@/hooks/useRolePermissions';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const navGroups = [
  {
    label: 'ANALYTICS',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'แดชบอร์ด', moduleKey: 'dashboard' },
      { to: '/chatbot', icon: MessageCircle, label: 'Optima AI', moduleKey: 'dashboard' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { to: '/leads', icon: Users, label: 'ลูกค้า', moduleKey: 'leads' },
      { to: '/opportunities', icon: Target, label: 'โอกาสขาย', moduleKey: 'opportunities' },
    ],
  },
  {
    label: 'PRE-CRM',
    items: [
      { to: '/weekly-plan', icon: CalendarDays, label: 'แผนเยี่ยมรายสัปดาห์', moduleKey: 'weekly-plan' },
      { to: '/visit-checkin', icon: MapPin, label: 'เช็คอินเยี่ยมลูกค้า', moduleKey: 'visit-checkin' },
      { to: '/visit-reports', icon: FileText, label: 'รายงานเยี่ยมลูกค้า', moduleKey: 'visit-reports' },
    ],
  },
  {
    label: 'SALES OPERATION',
    items: [
      { to: '/demos', icon: Presentation, label: 'สาธิตสินค้า', moduleKey: 'demos' },
    ],
  },
  {
    label: 'ATTENDANCE',
    items: [
      { to: '/work-checkin', icon: Fingerprint, label: 'เช็คอินทำงาน', moduleKey: 'work-checkin' },
      { to: '/attendance', icon: BarChart, label: 'สรุปการเข้างาน', moduleKey: 'attendance' },
    ],
  },
  {
    label: 'OPERATION',
    items: [
      { to: '/tasks', icon: ListTodo, label: 'งาน', moduleKey: 'tasks' },
      { to: '/calendar', icon: Calendar, label: 'ปฏิทิน', moduleKey: 'calendar' },
    ],
  },
  {
    label: 'INSTALLED BASE',
    items: [
      { to: '/install-base', icon: Cpu, label: 'Install Base', moduleKey: 'install-base' },
      { to: '/consumables', icon: Package, label: 'วัสดุสิ้นเปลือง', moduleKey: 'consumables' },
    ],
  },
  {
    label: 'SERVICE',
    items: [
      { to: '/maintenance', icon: Wrench, label: 'ซ่อมบำรุง', moduleKey: 'maintenance' },
      { to: '/qc-stock', icon: ClipboardCheck, label: 'QC สินค้า/สถานะสินค้า', moduleKey: 'qc-stock' },
    ],
  },
  {
    label: 'ERP',
    items: [
      { to: '/quotations', icon: FileSpreadsheet, label: 'ใบเสนอราคา', moduleKey: 'quotations' },
      { to: '/contracts', icon: Receipt, label: 'หนังสือสัญญาซื้อขาย', moduleKey: 'contracts' },
      { to: '/payments', icon: CreditCard, label: 'การชำระเงิน', moduleKey: 'payments' },
      { to: '/inventory', icon: Warehouse, label: 'คลังสินค้า', moduleKey: 'inventory' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/forecast', icon: TrendingUp, label: 'พยากรณ์', moduleKey: 'forecast' },
      { to: '/analytics', icon: BarChart3, label: 'วิเคราะห์', moduleKey: 'analytics' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', icon: Settings, label: 'ตั้งค่า', moduleKey: 'settings' },
      { to: '/csv-import', icon: FileSpreadsheet, label: 'นำเข้า CSV', moduleKey: 'csv-import' },
    ],
  },
];

function SidebarNav({ collapsed, onNavigate, canView }: { collapsed: boolean; onNavigate?: () => void; canView: (key: string) => boolean }) {
  const location = useLocation();

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
      {navGroups.map((group) => {
        const visibleItems = group.items.filter((item) => canView(item.moduleKey));
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase text-sidebar-muted">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                    onClick={() => onNavigate?.()}
                  >
                    <item.icon size={18} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
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
  const { canView, loading: permLoading } = useRolePermissions();
  const displayName = currentUser?.name || 'Guest';
  const initials = displayName.slice(0, 2).toUpperCase();
  const positionLabel = currentUser?.position ? ROLE_LABELS[currentUser.position] || currentUser.position : '';

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

        <SidebarNav collapsed={collapsed} canView={canView} />

        <div className="border-t border-sidebar-border p-2">
          <div className={cn('flex items-center gap-3 rounded-md px-2.5 py-2', collapsed && 'justify-center')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                  {positionLabel && (
                    <p className="text-[10px] text-sidebar-muted truncate">{positionLabel}</p>
                  )}
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

          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} canView={canView} />

          <div className="border-t border-sidebar-border p-2">
            <div className="flex items-center gap-3 rounded-md px-2.5 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                {positionLabel && (
                  <p className="text-[10px] text-sidebar-muted truncate">{positionLabel}</p>
                )}
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
