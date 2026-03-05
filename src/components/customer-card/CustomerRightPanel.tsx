import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Monitor, ShoppingCart, Wrench, Receipt, FolderOpen, Megaphone, FileText
} from 'lucide-react';
import {
  getDevicesForAccount, getConsumablesForAccount, getServiceForAccount,
  getPurchasesForAccount, getDocumentsForAccount, getMarketingForAccount,
  getLifetimeRevenue
} from '@/data/customerCardMockData';

interface Props {
  accountId: string;
}

function formatCurrency(val?: number) {
  if (!val) return '฿0';
  return `฿${val.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-muted text-muted-foreground',
  UNDER_REPAIR: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  JOINED: 'bg-blue-100 text-blue-700',
  INVITED: 'bg-amber-100 text-amber-700',
};

const DOC_ICONS: Record<string, string> = {
  CONTRACT: '📄', QUOTATION: '📋', INVOICE: '🧾', PM_REPORT: '🔧', CERTIFICATE: '🏆',
};

export default function CustomerRightPanel({ accountId }: Props) {
  const devices = getDevicesForAccount(accountId);
  const consumables = getConsumablesForAccount(accountId);
  const services = getServiceForAccount(accountId);
  const purchases = getPurchasesForAccount(accountId);
  const documents = getDocumentsForAccount(accountId);
  const marketing = getMarketingForAccount(accountId);
  const lifetimeRevenue = getLifetimeRevenue(accountId);

  return (
    <Tabs defaultValue="devices" className="h-full">
      <TabsList className="w-full justify-start bg-muted/50 rounded-lg h-auto flex-wrap">
        <TabsTrigger value="devices" className="text-xs gap-1"><Monitor size={13} /> เครื่อง</TabsTrigger>
        <TabsTrigger value="consumables" className="text-xs gap-1"><ShoppingCart size={13} /> สิ้นเปลือง</TabsTrigger>
        <TabsTrigger value="service" className="text-xs gap-1"><Wrench size={13} /> เซอร์วิส</TabsTrigger>
        <TabsTrigger value="purchases" className="text-xs gap-1"><Receipt size={13} /> ซื้อ</TabsTrigger>
        <TabsTrigger value="documents" className="text-xs gap-1"><FolderOpen size={13} /> เอกสาร</TabsTrigger>
        <TabsTrigger value="marketing" className="text-xs gap-1"><Megaphone size={13} /> การตลาด</TabsTrigger>
      </TabsList>

      {/* Devices */}
      <TabsContent value="devices" className="mt-4">
        <div className="space-y-3">
          {devices.map(d => (
            <Card key={d.id} className="shadow-sm">
              <CardContent className="p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-foreground">{d.deviceName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status] || ''}`}>
                    {d.status === 'ACTIVE' ? 'ใช้งาน' : d.status === 'UNDER_REPAIR' ? 'ซ่อม' : 'ไม่ใช้'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">SN: {d.serialNumber}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>ติดตั้ง: {d.installDate}</span>
                  <span>รับประกัน: {d.warrantyExpiry}</span>
                </div>
                <p className="text-xs text-muted-foreground">ช่าง: {d.engineer}</p>
              </CardContent>
            </Card>
          ))}
          {devices.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีเครื่องที่ติดตั้ง</p>}
        </div>
      </TabsContent>

      {/* Consumables */}
      <TabsContent value="consumables" className="mt-4">
        <div className="space-y-3">
          {consumables.map(c => (
            <Card key={c.id} className="shadow-sm">
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{c.cartridgeType}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>ใช้ไปแล้ว: {c.totalUsed} ชิ้น</span>
                  <span>ราคา/ชิ้น: {formatCurrency(c.unitPrice)}</span>
                  <span>สั่งล่าสุด: {c.lastOrderDate}</span>
                  <span>คาดว่าสั่งใหม่: {c.estimatedReorderDate}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {consumables.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูลสิ้นเปลือง</p>}
        </div>
      </TabsContent>

      {/* Service */}
      <TabsContent value="service" className="mt-4">
        <div className="space-y-3">
          {services.map(s => (
            <Card key={s.id} className="shadow-sm">
              <CardContent className="p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">{s.type}</Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || ''}`}>{s.status}</span>
                </div>
                <p className="text-sm text-foreground">{s.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{s.date}</span>
                  <span>{s.engineer}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีประวัติเซอร์วิส</p>}
        </div>
      </TabsContent>

      {/* Purchases */}
      <TabsContent value="purchases" className="mt-4">
        <Card className="shadow-sm mb-3">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">รายได้ตลอดอายุลูกค้า</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(lifetimeRevenue)}</p>
          </CardContent>
        </Card>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>ราคา</TableHead>
                <TableHead>วันที่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{p.product}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(p.price)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.invoiceDate}</TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ยังไม่มีประวัติซื้อ</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* Documents */}
      <TabsContent value="documents" className="mt-4">
        <div className="space-y-2">
          {documents.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-lg">{DOC_ICONS[d.docType] || '📄'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{d.fileName}</p>
                <p className="text-xs text-muted-foreground">{d.docType} • {d.uploadDate}</p>
              </div>
            </div>
          ))}
          {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีเอกสาร</p>}
        </div>
      </TabsContent>

      {/* Marketing */}
      <TabsContent value="marketing" className="mt-4">
        <div className="space-y-3">
          {marketing.map(m => (
            <Card key={m.id} className="shadow-sm">
              <CardContent className="p-3 space-y-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-foreground">{m.campaignName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] || ''}`}>{m.status}</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">{m.type}</Badge>
                  <span>{m.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {marketing.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูลการตลาด</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
