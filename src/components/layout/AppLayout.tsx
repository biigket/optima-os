import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Target, MapPin, FileText, Presentation,
  ListTodo, Calendar, Cpu, Package, Wrench, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'CRM',
    items: [
      { to: '/leads', icon: Users, label: 'ลีด' },
      { to: '/opportunities', icon: Target, label: 'โอกาสขาย' },
    ],
  },
  {
    label: 'SALES OPERATION',
    items: [
      { to: '/visit-checkin', icon: MapPin, label: 'เช็คอินเยี่ยมลูกค้า' },
      { to: '/visit-reports', icon: FileText, label: 'รายงานเยี่ยมลูกค้า' },
      { to: '/demos', icon: Presentation, label: 'สาธิตสินค้า' },
    ],
  },
  {
    label: 'OPERATION',
    items: [
      { to: '/tasks', icon: ListTodo, label: 'งาน' },
      { to: '/calendar', icon: Calendar, label: 'ปฏิทิน' },
    ],
  },
  {
    label: 'INSTALLED BASE',
    items: [
      { to: '/devices', icon: Cpu, label: 'เครื่องมือ' },
      { to: '/consumables', icon: Package, label: 'วัสดุสิ้นเปลือง' },
    ],
  },
  {
    label: 'SERVICE',
    items: [
      { to: '/maintenance', icon: Wrench, label: 'ซ่อมบำรุง' },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'แดชบอร์ด' },
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
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-sidebar-muted uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
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
                    >
                      <item.icon size={18} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
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
