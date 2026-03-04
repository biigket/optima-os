import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">System configuration and user management</p>
      </div>
      <div className="flex items-center justify-center rounded-lg border bg-card p-16">
        <div className="text-center space-y-2">
          <Settings size={40} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Settings module coming soon</p>
        </div>
      </div>
    </div>
  );
}
