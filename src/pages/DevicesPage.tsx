import { Cpu, MapPin } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockInventory } from '@/data/mockData';

export default function DevicesPage() {
  const devices = mockInventory.filter(i => i.category === 'DEVICE');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">เครื่องมือ</h1>
        <p className="text-sm text-muted-foreground">เครื่องมือที่ติดตั้งแล้วทั้งหมด {devices.length} รายการ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map(device => (
          <div key={device.inventoryId} className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cpu size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{device.productName}</p>
                  <StatusBadge status={device.status} />
                </div>
              </div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {device.serialNumber && <p>S/N: {device.serialNumber}</p>}
              <p>จำนวน: {device.quantity}</p>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                <span>{device.warehouseLocation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
