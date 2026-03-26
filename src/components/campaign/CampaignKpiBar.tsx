import { Card, CardContent } from '@/components/ui/card';

interface Stats {
  total: number;
  contacted: number;
  visited: number;
  interested: number;
  closed: number;
  notInterested: number;
  progress: number;
}

export default function CampaignKpiBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <Card><CardContent className="p-3 text-center">
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="text-xs text-muted-foreground">เป้าหมายทั้งหมด</div>
      </CardContent></Card>
      <Card><CardContent className="p-3 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
        <div className="text-xs text-muted-foreground">ติดต่อแล้ว</div>
      </CardContent></Card>
      <Card><CardContent className="p-3 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.visited}</div>
        <div className="text-xs text-muted-foreground">เยี่ยมแล้ว</div>
      </CardContent></Card>
      <Card><CardContent className="p-3 text-center">
        <div className="text-2xl font-bold text-emerald-600">{stats.interested}</div>
        <div className="text-xs text-muted-foreground">สนใจ</div>
      </CardContent></Card>
      <Card><CardContent className="p-3 text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.closed}</div>
        <div className="text-xs text-muted-foreground">ปิดดีลแล้ว</div>
      </CardContent></Card>
      <Card><CardContent className="p-3 text-center">
        <div className="text-2xl font-bold text-red-500">{stats.notInterested}</div>
        <div className="text-xs text-muted-foreground">ไม่สนใจ</div>
      </CardContent></Card>
    </div>
  );
}
