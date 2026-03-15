import { FileText, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">หนังสือสัญญาซื้อขาย</h1>
            <p className="text-sm text-muted-foreground">จัดการหนังสือสัญญาซื้อขายทั้งหมด</p>
          </div>
        </div>
        <Button size="sm">
          <Plus size={16} className="mr-1" />
          สร้างสัญญาใหม่
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาสัญญา..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการสัญญาซื้อขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีหนังสือสัญญาซื้อขาย</p>
            <p className="text-xs mt-1">กดปุ่ม "สร้างสัญญาใหม่" เพื่อเริ่มต้น</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
