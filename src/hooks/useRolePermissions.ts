import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from './useMockAuth';

export interface RolePermission {
  id: string;
  role_key: string;
  module_key: string;
  can_view: boolean;
}

export const ROLE_LABELS: Record<string, string> = {
  OWNER: 'เจ้าของบริษัท',
  SALES_MANAGER: 'หัวหน้าเซลล์',
  SALES: 'เซลล์',
  PRODUCT: 'โปรดัก',
  SERVICE: 'เซอร์วิส',
  FINANCE: 'บัญชี',
};

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'แดชบอร์ด',
  leads: 'ลูกค้า',
  opportunities: 'โอกาสขาย',
  'weekly-plan': 'แผนเยี่ยมรายสัปดาห์',
  'visit-checkin': 'เช็คอินเยี่ยมลูกค้า',
  'visit-reports': 'รายงานเยี่ยมลูกค้า',
  demos: 'สาธิตสินค้า',
  'work-checkin': 'เช็คอินทำงาน',
  attendance: 'สรุปการเข้างาน',
  tasks: 'งาน',
  calendar: 'ปฏิทิน',
  'install-base': 'Install Base',
  consumables: 'วัสดุสิ้นเปลือง',
  maintenance: 'ซ่อมบำรุง',
  'qc-stock': 'QC สินค้า',
  quotations: 'ใบเสนอราคา',
  payments: 'การชำระเงิน',
  inventory: 'คลังสินค้า',
  forecast: 'พยากรณ์',
  analytics: 'วิเคราะห์',
  settings: 'ตั้งค่า',
  'approve-qt': 'อนุมัติใบเสนอราคา',
};

export const ALL_ROLES = ['OWNER', 'SALES_MANAGER', 'SALES', 'PRODUCT', 'SERVICE', 'FINANCE'];
export const ALL_MODULES = Object.keys(MODULE_LABELS);

export function useRolePermissions() {
  const { currentUser } = useMockAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const roleKey = currentUser.position || 'OWNER';

    supabase
      .from('role_permissions')
      .select('*')
      .eq('role_key', roleKey)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        (data || []).forEach((r: any) => {
          map[r.module_key] = r.can_view;
        });
        setPermissions(map);
        setLoading(false);
      });
  }, [currentUser]);

  const canView = useCallback(
    (moduleKey: string) => {
      // OWNER always sees everything
      if (currentUser?.position === 'OWNER' || currentUser?.role === 'ADMIN') return true;
      return permissions[moduleKey] ?? false;
    },
    [permissions, currentUser]
  );

  return { permissions, canView, loading };
}

export function useAllRolePermissions() {
  const [allPermissions, setAllPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role_key')
      .order('module_key');
    setAllPermissions((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const togglePermission = async (roleKey: string, moduleKey: string, currentValue: boolean) => {
    // Optimistic update
    setAllPermissions((prev) =>
      prev.map((p) =>
        p.role_key === roleKey && p.module_key === moduleKey
          ? { ...p, can_view: !currentValue }
          : p
      )
    );

    const existing = allPermissions.find(
      (p) => p.role_key === roleKey && p.module_key === moduleKey
    );

    if (existing) {
      await supabase
        .from('role_permissions')
        .update({ can_view: !currentValue })
        .eq('id', existing.id);
    } else {
      await supabase.from('role_permissions').insert({
        role_key: roleKey,
        module_key: moduleKey,
        can_view: !currentValue,
      });
      fetchAll();
    }
  };

  const getPermission = (roleKey: string, moduleKey: string): boolean => {
    const found = allPermissions.find(
      (p) => p.role_key === roleKey && p.module_key === moduleKey
    );
    return found?.can_view ?? false;
  };

  return { allPermissions, loading, togglePermission, getPermission, refetch: fetchAll };
}
