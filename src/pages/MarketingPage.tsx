import { Megaphone } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-sm text-muted-foreground">Campaigns and marketing tasks</p>
      </div>
      <div className="flex items-center justify-center rounded-lg border bg-card p-16">
        <div className="text-center space-y-2">
          <Megaphone size={40} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Marketing module coming soon</p>
        </div>
      </div>
    </div>
  );
}
