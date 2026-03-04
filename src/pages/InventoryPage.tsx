import StatusBadge from '@/components/ui/StatusBadge';
import { mockInventory } from '@/data/mockData';
import { Package } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground">{mockInventory.length} items</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Serial #</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockInventory.map(item => (
              <tr key={item.inventoryId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 flex items-center gap-2 font-medium text-foreground">
                  <Package size={16} className="text-muted-foreground" />
                  {item.productName}
                </td>
                <td className="px-4 py-3"><StatusBadge status={item.category} /></td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.serialNumber || '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{item.quantity}</td>
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
