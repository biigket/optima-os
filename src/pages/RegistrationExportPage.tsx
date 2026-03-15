import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface RegistrationRow {
  id: string;
  clinic_name: string;
  phone: string | null;
  email: string | null;
  current_devices: string | null;
  created_at: string;
  contact_name?: string;
}

export default function RegistrationExportPage() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, clinic_name, phone, email, current_devices, created_at')
        .eq('lead_source', 'REGISTER_FORM')
        .order('created_at', { ascending: false });

      if (!accounts || accounts.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const ids = accounts.map(a => a.id);
      const { data: contacts } = await supabase
        .from('contacts')
        .select('account_id, name')
        .in('account_id', ids)
        .eq('is_decision_maker', true);

      const contactMap = new Map(contacts?.map(c => [c.account_id, c.name]) || []);

      setRows(accounts.map(a => ({
        ...a,
        contact_name: contactMap.get(a.id) || '-',
      })));
      setLoading(false);
    })();
  }, []);

  const downloadCsv = () => {
    const header = ['ชื่อคลินิก', 'ผู้ติดต่อ', 'เบอร์โทร', 'อีเมล', 'เครื่องที่มี', 'วันที่ลงทะเบียน'];
    const csvRows = rows.map(r => [
      r.clinic_name,
      r.contact_name || '',
      r.phone || '',
      r.email || '',
      r.current_devices || '',
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const bom = '\uFEFF';
    const csv = bom + [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>รายชื่อลูกค้าจากฟอร์มลงทะเบียน ({rows.length} ราย)</CardTitle>
          <Button onClick={downloadCsv} disabled={rows.length === 0} className="gap-2">
            <Download size={16} /> ดาวน์โหลด CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">ยังไม่มีข้อมูลลงทะเบียน</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อคลินิก</TableHead>
                  <TableHead>ผู้ติดต่อ</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>เครื่องที่มี</TableHead>
                  <TableHead>วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.clinic_name}</TableCell>
                    <TableCell>{r.contact_name}</TableCell>
                    <TableCell>{r.phone || '-'}</TableCell>
                    <TableCell>{r.email || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.current_devices || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(r.created_at), 'd MMM yy', { locale: th })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
