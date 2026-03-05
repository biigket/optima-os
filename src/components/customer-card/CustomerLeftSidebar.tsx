import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, MapPin, Phone, Mail, Globe, ChevronDown, Users, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  clinic_name: string;
  company_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Contact {
  id: string;
  account_id: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Props {
  account: Account;
  contacts: Contact[];
}

function Section({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
          <span className="flex items-center gap-2">
            <Icon size={14} className="text-muted-foreground" />
            {title}
          </span>
          <ChevronDown size={14} className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function CustomerLeftSidebar({ account, contacts }: Props) {
  const [notes, setNotes] = useState(
    'ลูกค้า VIP สนใจเครื่องใหม่ทุกครั้งที่ออก\nStrategy: เสนอ bundle cartridge + PM package\nPreference: ชอบนัดวัน พุธ-ศุกร์'
  );

  return (
    <div className="space-y-3">
      {/* Clinic Info */}
      <Section title="ข้อมูลคลินิก" icon={Building2}>
        <div className="space-y-2.5">
          <InfoItem icon={Building2} value={account.clinic_name} />
          {account.company_name && <InfoItem value={account.company_name} sub="บริษัท" />}
          <InfoItem icon={MapPin} value={account.address} />
          <InfoItem icon={Phone} value={account.phone} />
          <InfoItem icon={Mail} value={account.email} />
          <InfoItem icon={Globe} value="-" />
        </div>
      </Section>

      {/* Contacts */}
      <Section title={`ผู้ติดต่อ (${contacts.length})`} icon={Users}>
        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูลผู้ติดต่อ</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="p-3 rounded-md bg-muted/40 space-y-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Notes */}
      <Section title="บันทึกภายใน" icon={StickyNote}>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="text-xs min-h-[90px] resize-none bg-muted/30 border-muted"
          placeholder="เพิ่มบันทึก..."
        />
      </Section>
    </div>
  );
}

function InfoItem({ icon: Icon, value, sub }: { icon?: React.ElementType; value?: string | null; sub?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        <p className="text-foreground text-sm truncate">{value || '-'}</p>
      </div>
    </div>
  );
}
