import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Building2, Package, CreditCard, User, Calendar, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: qt, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, accounts!quotations_account_id_fkey(clinic_name, address, phone, email)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!qt) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        ไม่พบใบเสนอราคา
        <div className="mt-4"><Button variant="outline" onClick={() => navigate('/quotations')}>กลับ</Button></div>
      </div>
    );
  }

  const account = qt.accounts as any;
  const paymentLabel: Record<string, string> = { CASH: 'เงินสด', INSTALLMENT: 'ผ่อนชำระ', LEASING: 'ลีสซิ่ง' };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={22} className="text-primary" />
            {qt.qt_number || 'ใบเสนอราคา'}
          </h1>
          <p className="text-sm text-muted-foreground">สร้างเมื่อ {qt.created_at ? new Date(qt.created_at).toLocaleDateString('th-TH') : '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={qt.approval_status || 'DRAFT'} />
          <StatusBadge status={qt.payment_status || 'UNPAID'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={16} className="text-primary" /> ข้อมูลลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="ชื่อคลินิก" value={account?.clinic_name} />
            <InfoRow label="ที่อยู่" value={account?.address} />
            <InfoRow label="โทรศัพท์" value={account?.phone} />
            <InfoRow label="อีเมล" value={account?.email} />
          </CardContent>
        </Card>

        {/* Quotation Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" /> รายละเอียดใบเสนอราคา
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="เลขที่" value={qt.qt_number} />
            <InfoRow label="วันที่ออก" value={qt.qt_date} />
            <InfoRow label="เซลล์" value={qt.sale_assigned} />
          </CardContent>
        </Card>

        {/* Product & Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={16} className="text-primary" /> สินค้าและราคา
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="สินค้า" value={qt.product} />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ราคา</span>
              <span className="text-lg font-bold text-foreground">฿{(qt.price || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} className="text-primary" /> การชำระเงิน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="เงื่อนไข" value={paymentLabel[qt.payment_condition || ''] || qt.payment_condition} />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">สถานะชำระ</span>
              <StatusBadge status={qt.payment_status || 'UNPAID'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ส่งใบแจ้งหนี้</span>
              <span className="text-sm">{qt.invoice_sent ? '✅ ส่งแล้ว' : '❌ ยังไม่ส่ง'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '-'}</span>
    </div>
  );
}
