import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface CustomerSidePeekProps {
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CustomerData {
  clinic_name: string;
  assigned_sale: string | null;
  grade: string | null;
  customer_status: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface Quotation {
  id: string;
  qt_number: string | null;
  price: number | null;
  approval_status: string | null;
}

interface Installation {
  id: string;
  serial_number: string | null;
  status: string | null;
  product_name: string | null;
}

export default function CustomerSidePeek({ customerId, customerName, isOpen, onClose }: CustomerSidePeekProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);

  useEffect(() => {
    if (!isOpen || !customerId) return;
    setLoading(true);

    Promise.all([
      supabase.from('accounts').select('clinic_name, assigned_sale, grade, customer_status, phone, email, address').eq('id', customerId).single(),
      supabase.from('quotations').select('id, qt_number, price, approval_status').eq('account_id', customerId).order('created_at', { ascending: false }).limit(3),
      supabase.from('installations').select('id, serial_number, status, products(product_name)').eq('account_id', customerId),
    ]).then(([custRes, qtRes, instRes]) => {
      if (custRes.data) setCustomer(custRes.data as CustomerData);
      if (qtRes.data) setQuotations(qtRes.data as Quotation[]);
      if (instRes.data) {
        setInstallations(
          (instRes.data as any[]).map((row) => ({
            id: row.id,
            serial_number: row.serial_number,
            status: row.status,
            product_name: row.products?.product_name || null,
          }))
        );
      }
      setLoading(false);
    });
  }, [isOpen, customerId]);

  const statusColor = (s: string | null) => {
    if (!s) return 'secondary';
    const lower = s.toLowerCase();
    if (lower === 'approved' || lower === 'active') return 'default';
    if (lower === 'pending' || lower === 'draft') return 'secondary';
    if (lower === 'rejected' || lower === 'inactive') return 'destructive';
    return 'outline';
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm font-semibold">{customerName}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">ข้อมูลลูกค้าโดยย่อ</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <>
              {/* Customer Info */}
              <Card className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{customer?.clinic_name}</h3>
                  <Badge variant={statusColor(customer?.customer_status || null)}>
                    {customer?.customer_status || '-'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>โซน: <strong className="text-foreground">{customer?.assigned_sale || '-'}</strong></span>
                  <span>เกรด: <strong className="text-foreground">{customer?.grade || '-'}</strong></span>
                  {customer?.phone && <span>โทร: {customer.phone}</span>}
                  {customer?.email && <span>{customer.email}</span>}
                </div>
                {customer?.address && (
                  <p className="text-[11px] text-muted-foreground">{customer.address}</p>
                )}
              </Card>

              {/* Quotations */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">ใบเสนอราคาล่าสุด</h4>
                {quotations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ไม่มีใบเสนอราคา</p>
                ) : (
                  <div className="space-y-1.5">
                    {quotations.map((qt) => (
                      <div key={qt.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">{qt.qt_number || '-'}</p>
                          <p className="text-[11px] text-muted-foreground">฿{(qt.price || 0).toLocaleString()}</p>
                        </div>
                        <Badge variant={statusColor(qt.approval_status)}>
                          {qt.approval_status || 'draft'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Installed Devices */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">อุปกรณ์ที่ติดตั้ง</h4>
                {installations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ไม่มีอุปกรณ์ที่ติดตั้ง</p>
                ) : (
                  <div className="space-y-1.5">
                    {installations.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">{inst.serial_number || '-'}</p>
                          <p className="text-[11px] text-muted-foreground">{inst.product_name || '-'}</p>
                        </div>
                        <Badge variant={statusColor(inst.status)}>
                          {inst.status || '-'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t px-4 py-3">
          <Button
            variant="outline"
            className="w-full text-xs"
            onClick={() => { onClose(); navigate(`/leads/${customerId}`); }}
          >
            ดูโปรไฟล์เต็ม
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
