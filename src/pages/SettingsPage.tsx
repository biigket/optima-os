import { useAllRolePermissions, ALL_ROLES, ALL_MODULES, ROLE_LABELS, MODULE_LABELS } from '@/hooks/useRolePermissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Loader2, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useMockAuth } from '@/hooks/useMockAuth';
import UserManagement from '@/components/settings/UserManagement';
const MODULE_GROUPS = [
  { label: 'ANALYTICS', modules: ['dashboard'] },
  { label: 'CRM', modules: ['leads', 'opportunities'] },
  { label: 'PRE-CRM', modules: ['weekly-plan', 'visit-checkin', 'visit-reports'] },
  { label: 'SALES OPERATION', modules: ['demos'] },
  { label: 'ATTENDANCE', modules: ['work-checkin', 'attendance'] },
  { label: 'OPERATION', modules: ['tasks', 'calendar'] },
  { label: 'INSTALLED BASE', modules: ['install-base', 'consumables'] },
  { label: 'SERVICE', modules: ['maintenance', 'qc-stock'] },
  { label: 'ERP', modules: ['quotations', 'approve-qt', 'contracts', 'payments', 'inventory'] },
  { label: 'INTELLIGENCE', modules: ['forecast', 'analytics'] },
  { label: 'SYSTEM', modules: ['settings', 'csv-import'] },
];

export default function SettingsPage() {
  const { loading, togglePermission, getPermission } = useAllRolePermissions();
  const navigate = useNavigate();

  const handleToggle = async (roleKey: string, moduleKey: string) => {
    const current = getPermission(roleKey, moduleKey);
    await togglePermission(roleKey, moduleKey, current);
    toast.success(`อัปเดตสิทธิ์ ${ROLE_LABELS[roleKey]} - ${MODULE_LABELS[moduleKey]}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">ตั้งค่าสิทธิ์การเข้าถึง</h1>
          <p className="text-sm text-muted-foreground">กำหนดว่าแต่ละตำแหน่งจะเห็น module ไหนบ้าง</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} />
            Permission Matrix
          </CardTitle>
          <CardDescription>ติ๊กเครื่องหมายเพื่อเปิด/ปิดการเข้าถึงแต่ละ module</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/50 min-w-[180px]">
                    Module
                  </th>
                  {ALL_ROLES.map((role) => (
                    <th key={role} className="p-3 text-center font-medium text-muted-foreground min-w-[100px]">
                      <div className="text-[10px] uppercase tracking-wider">{ROLE_LABELS[role]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_GROUPS.map((group) => (
                  <>
                    <tr key={`group-${group.label}`} className="bg-muted/30">
                      <td colSpan={ALL_ROLES.length + 1} className="px-3 py-1.5">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                          {group.label}
                        </span>
                      </td>
                    </tr>
                    {group.modules.map((moduleKey) => (
                      <tr key={moduleKey} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium sticky left-0 bg-card">
                          {MODULE_LABELS[moduleKey]}
                        </td>
                        {ALL_ROLES.map((role) => {
                          const checked = getPermission(role, moduleKey);
                          const isOwnerSettings = role === 'OWNER' && moduleKey === 'settings';
                          return (
                            <td key={role} className="p-3 text-center">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleToggle(role, moduleKey)}
                                disabled={isOwnerSettings}
                                className="mx-auto"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet size={16} />
            เครื่องมือนำเข้าข้อมูล
          </CardTitle>
          <CardDescription>นำเข้าข้อมูลเข้าระบบโดยใช้ไฟล์ CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/csv-import')}>
            <span className="flex items-center gap-2">
              <FileSpreadsheet size={16} />
              ไปที่หน้านำเข้า CSV
            </span>
            <ArrowRight size={16} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
