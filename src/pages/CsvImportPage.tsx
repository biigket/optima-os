import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ── Table definitions ────────────────────────────────────────────
interface TableDef {
  label: string;
  table: string;
  columns: { key: string; label: string; required?: boolean; example?: string }[];
}

const TABLE_DEFS: TableDef[] = [
  {
    label: 'ลูกค้า (Accounts)',
    table: 'accounts',
    columns: [
      { key: 'clinic_name', label: 'ชื่อคลินิก', required: true, example: 'Beauty Plus Clinic' },
      { key: 'company_name', label: 'ชื่อบริษัท', example: 'บจก. บิวตี้พลัส' },
      { key: 'phone', label: 'เบอร์โทร', example: '0812345678' },
      { key: 'email', label: 'อีเมล', example: 'info@clinic.com' },
      { key: 'address', label: 'ที่อยู่', example: '123 ถ.สุขุมวิท' },
      { key: 'tax_id', label: 'เลขประจำตัวผู้เสียภาษี', example: '0105563012345' },
      { key: 'entity_type', label: 'ประเภทกิจการ', example: 'บุคคลธรรมดา' },
      { key: 'branch_type', label: 'สาขา', example: 'สำนักงานใหญ่' },
      { key: 'customer_status', label: 'สถานะ', example: 'NEW_LEAD' },
      { key: 'grade', label: 'เกรด', example: 'A' },
      { key: 'assigned_sale', label: 'เซลล์ดูแล', example: 'สมชาย' },
      { key: 'lead_source', label: 'แหล่งที่มา', example: 'FACEBOOK' },
      { key: 'current_devices', label: 'เครื่องที่มี', example: 'ND2, Trica3D' },
      { key: 'single_or_chain', label: 'สาขาเดียว/เชน', example: 'SINGLE' },
      { key: 'notes', label: 'หมายเหตุ', example: '' },
    ],
  },
  {
    label: 'ผู้ติดต่อ (Contacts)',
    table: 'contacts',
    columns: [
      { key: 'account_id', label: 'Account ID (UUID)', required: true, example: 'uuid-of-account' },
      { key: 'name', label: 'ชื่อ', required: true, example: 'คุณสมศรี' },
      { key: 'role', label: 'ตำแหน่ง', example: 'ผู้จัดการ' },
      { key: 'phone', label: 'เบอร์โทร', example: '0891234567' },
      { key: 'email', label: 'อีเมล', example: 'somsri@clinic.com' },
      { key: 'line_id', label: 'LINE ID', example: '@somsri' },
      { key: 'is_decision_maker', label: 'ผู้ตัดสินใจ (true/false)', example: 'true' },
    ],
  },
  {
    label: 'สินค้า (Products)',
    table: 'products',
    columns: [
      { key: 'product_name', label: 'ชื่อสินค้า', required: true, example: 'ND2 Pro' },
      { key: 'product_code', label: 'รหัสสินค้า', example: 'ND2-PRO-001' },
      { key: 'category', label: 'หมวดหมู่ (DEVICE/CONSUMABLE/PART)', example: 'DEVICE' },
      { key: 'description', label: 'คำอธิบาย', example: 'เครื่อง Laser ND:YAG' },
      { key: 'base_price', label: 'ราคาฐาน', example: '1500000' },
    ],
  },
  {
    label: 'เครื่องติดตั้ง (Installations)',
    table: 'installations',
    columns: [
      { key: 'account_id', label: 'Account ID (UUID)', example: 'uuid-of-account' },
      { key: 'product_id', label: 'Product ID (UUID)', example: 'uuid-of-product' },
      { key: 'serial_number', label: 'Serial Number', example: 'SN-2024-001' },
      { key: 'province', label: 'จังหวัด', example: 'กรุงเทพ' },
      { key: 'region', label: 'ภาค', example: 'กลาง' },
      { key: 'district', label: 'เขต/อำเภอ', example: 'วัฒนา' },
      { key: 'status', label: 'สถานะ', example: 'ACTIVE' },
      { key: 'install_date', label: 'วันติดตั้ง (YYYY-MM-DD)', example: '2024-06-01' },
      { key: 'warranty_days', label: 'วันรับประกัน', example: '365' },
      { key: 'warranty_expiry', label: 'วันหมดประกัน (YYYY-MM-DD)', example: '2025-06-01' },
      { key: 'has_rm_handpiece', label: 'มี RM Handpiece (true/false)', example: 'false' },
      { key: 'cartridges_installed', label: 'Cartridge ที่ติดตั้ง', example: 'FL45, SD30' },
    ],
  },
  {
    label: 'เดโม (Demos)',
    table: 'demos',
    columns: [
      { key: 'account_id', label: 'Account ID (UUID)', example: 'uuid-of-account' },
      { key: 'opportunity_id', label: 'Opportunity ID (UUID)', example: 'uuid-of-opp' },
      { key: 'demo_date', label: 'วันเดโม (YYYY-MM-DD)', example: '2024-07-15' },
      { key: 'location', label: 'สถานที่', example: 'คลินิกสุขุมวิท' },
      { key: 'products_demo', label: 'สินค้าเดโม (คั่น ,)', example: 'ND2,Trica3D' },
      { key: 'demo_note', label: 'หมายเหตุ', example: 'ลูกค้าสนใจมาก' },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────
function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(current.trim()); current = ''; }
        else { current += ch; }
      }
    }
    row.push(current.trim());
    return row;
  });
}

function downloadTemplate(def: TableDef) {
  const headers = def.columns.map(c => c.key);
  const examples = def.columns.map(c => c.example || '');
  const csv = '\uFEFF' + [headers.join(','), examples.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-${def.table}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function coerceValue(key: string, value: string): any {
  if (value === '' || value === undefined || value === null) return null;
  if (key === 'is_decision_maker' || key === 'has_rm_handpiece') return value.toLowerCase() === 'true';
  if (key === 'base_price' || key === 'warranty_days' || key === 'fl45_shots' || key === 'fl30_shots' || key === 'fl20_shots' || key === 'sd45_shots' || key === 'sd30_shots' || key === 'sd15_shots' || key === 'rm_i49_tips' || key === 'rm_n49_tips') {
    const n = Number(value);
    return isNaN(n) ? null : n;
  }
  if (key === 'products_demo') return value.split(',').map(s => s.trim()).filter(Boolean);
  return value;
}

// ── Component ────────────────────────────────────────────────────
export default function CsvImportPage() {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tableDef = useMemo(() => TABLE_DEFS.find(t => t.table === selectedTable), [selectedTable]);
  const validColumns = useMemo(() => tableDef?.columns.map(c => c.key) || [], [tableDef]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast.error('ไฟล์ CSV ต้องมีอย่างน้อย header + 1 แถวข้อมูล');
        return;
      }
      setHeaders(rows[0]);
      setRawRows(rows.slice(1));
    };
    reader.readAsText(file, 'UTF-8');
  };

  const clearFile = () => {
    setRawRows([]);
    setHeaders([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImport = async () => {
    if (!tableDef || rawRows.length === 0) return;

    setImporting(true);
    setResult(null);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Map headers to indices
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => { if (validColumns.includes(h)) headerMap[h] = i; });

    // Check required columns
    const missingRequired = tableDef.columns.filter(c => c.required && !(c.key in headerMap));
    if (missingRequired.length > 0) {
      toast.error(`ขาดคอลัมน์ที่จำเป็น: ${missingRequired.map(c => c.key).join(', ')}`);
      setImporting(false);
      return;
    }

    // Batch insert in chunks of 50
    const BATCH = 50;
    for (let i = 0; i < rawRows.length; i += BATCH) {
      const batch = rawRows.slice(i, i + BATCH);
      const records = batch.map((row, rowIdx) => {
        const obj: Record<string, any> = {};
        for (const [key, idx] of Object.entries(headerMap)) {
          obj[key] = coerceValue(key, row[idx]);
        }
        return { obj, rowNum: i + rowIdx + 2 }; // +2 for header + 0-index
      });

      // Filter out empty rows
      const validRecords = records.filter(r => Object.values(r.obj).some(v => v !== null));
      if (validRecords.length === 0) continue;

      const { error } = await supabase
        .from(tableDef.table as any)
        .insert(validRecords.map(r => r.obj) as any);

      if (error) {
        failed += validRecords.length;
        errors.push(`แถว ${validRecords[0].rowNum}-${validRecords[validRecords.length - 1].rowNum}: ${error.message}`);
      } else {
        success += validRecords.length;
      }
    }

    setResult({ success, failed, errors });
    setImporting(false);
    if (success > 0) toast.success(`นำเข้าสำเร็จ ${success} รายการ`);
    if (failed > 0) toast.error(`นำเข้าล้มเหลว ${failed} รายการ`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={28} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">นำเข้าข้อมูล CSV</h1>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={() => navigate('/qt-ar-import')}>
          <FileSpreadsheet size={14} /> นำเข้า QT/AR จาก Excel
        </Button>
      </div>

      {/* Step 1: Select table */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">1. เลือกตารางเป้าหมาย</h2>
        <Select value={selectedTable} onValueChange={(v) => { setSelectedTable(v); clearFile(); }}>
          <SelectTrigger className="w-72"><SelectValue placeholder="เลือกตาราง..." /></SelectTrigger>
          <SelectContent>
            {TABLE_DEFS.map(t => <SelectItem key={t.table} value={t.table}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {tableDef && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadTemplate(tableDef)}>
              <Download size={14} /> ดาวน์โหลด Template
            </Button>
            <p className="text-xs text-muted-foreground">
              คอลัมน์ที่จำเป็น: {tableDef.columns.filter(c => c.required).map(c => <Badge key={c.key} variant="destructive" className="mr-1 text-[10px]">{c.key}</Badge>)}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Upload file */}
      {tableDef && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">2. อัปโหลดไฟล์ CSV</h2>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="block text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-80 cursor-pointer"
            />
            {rawRows.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFile} className="gap-1 text-destructive">
                <Trash2 size={14} /> ล้าง
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {rawRows.length > 0 && tableDef && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">3. ตรวจสอบข้อมูล ({rawRows.length} แถว)</h2>
            <Button onClick={handleImport} disabled={importing} className="gap-1.5">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
            </Button>
          </div>

          {/* Column mapping status */}
          <div className="flex flex-wrap gap-1.5">
            {headers.map(h => (
              <Badge key={h} variant={validColumns.includes(h) ? 'default' : 'secondary'} className="text-[10px]">
                {validColumns.includes(h) ? '✓' : '✗'} {h}
              </Badge>
            ))}
          </div>
          {headers.some(h => !validColumns.includes(h)) && (
            <p className="text-xs text-amber-600">⚠ คอลัมน์ที่ไม่ตรงกับตาราง (สีเทา) จะถูกข้าม</p>
          )}

          <div className="overflow-auto max-h-[400px] rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  {headers.filter(h => validColumns.includes(h)).map(h => (
                    <TableHead key={h} className="text-xs whitespace-nowrap">{tableDef.columns.find(c => c.key === h)?.label || h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawRows.slice(0, 50).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                    {headers.map((h, hi) => validColumns.includes(h) ? (
                      <TableCell key={hi} className="text-xs max-w-[200px] truncate">{row[hi] || <span className="text-muted-foreground">—</span>}</TableCell>
                    ) : null)}
                  </TableRow>
                ))}
                {rawRows.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={headers.filter(h => validColumns.includes(h)).length + 1} className="text-center text-xs text-muted-foreground py-3">
                      ...และอีก {rawRows.length - 50} แถว (แสดงเฉพาะ 50 แถวแรก)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {result && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">ผลลัพธ์</h2>
          <div className="flex items-center gap-4">
            {result.success > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={16} /> สำเร็จ {result.success} รายการ
              </div>
            )}
            {result.failed > 0 && (
              <div className="flex items-center gap-1.5 text-destructive">
                <XCircle size={16} /> ล้มเหลว {result.failed} รายการ
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-destructive/10 rounded p-3 text-xs space-y-1">
              {result.errors.map((err, i) => <p key={i} className="text-destructive">{err}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Column reference */}
      {tableDef && (
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">คอลัมน์ที่รองรับ — {tableDef.label}</h2>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Key (ใช้เป็น Header)</TableHead>
                  <TableHead className="text-xs">คำอธิบาย</TableHead>
                  <TableHead className="text-xs">จำเป็น</TableHead>
                  <TableHead className="text-xs">ตัวอย่าง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableDef.columns.map(c => (
                  <TableRow key={c.key}>
                    <TableCell className="text-xs font-mono">{c.key}</TableCell>
                    <TableCell className="text-xs">{c.label}</TableCell>
                    <TableCell className="text-xs">{c.required ? <Badge variant="destructive" className="text-[10px]">จำเป็น</Badge> : '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.example || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
