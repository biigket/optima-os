import { Package, MapPin } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockInventory } from '@/data/mockData';

export default function ConsumablesPage() {
  const consumables = mockInventory.filter(i => i.category === 'CONSUMABLE' || i.category === 'PART');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">วัสดุสิ้นเปลือง</h1>
        <p className="text-sm text-muted-foreground">วัสดุสิ้นเปลืองและอะไหล่ทั้งหมด {consumables.length} รายการ</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ชื่อสินค้า</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภท</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">จำนวน</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">คลัง</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {consumables.map(item => (
              <tr key={item.inventoryId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                  <Package size={16} className="text-muted-foreground" />
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{item.category === 'CONSUMABLE' ? 'วัสดุสิ้นเปลือง' : 'อะไหล่'}</td>
                <td className="px-4 py-3 text-foreground font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.warehouseLocation}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
