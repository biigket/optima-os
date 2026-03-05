import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, MapPin, Phone, Mail, Globe, ChevronDown, Users, StickyNote, MessageCircle } from 'lucide-react';
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

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg">
        <span className="flex items-center gap-2">
          <Icon size={15} className="text-muted-foreground" />
          {title}
        </span>
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

export default function CustomerLeftSidebar({ account, contacts }: Props) {
  const [notes, setNotes] = useState(
    'ลูกค้า VIP สนใจเครื่องใหม่ทุกครั้งที่ออก\nStrategy: เสนอ bundle cartridge + PM package\nPreference: ชอบนัดวัน พุธ-ศุกร์'
  );

  return (
    <div className="space-y-1">
      <Card className="shadow-sm">
        <CollapsibleSection title="ข้อมูลคลินิก" icon={Building2}>
          <InfoRow icon={Building2} label="ชื่อคลินิก" value={account.clinic_name} />
          {account.company_name && <InfoRow label="บริษัท" value={account.company_name} />}
          <InfoRow icon={MapPin} label="ที่อยู่" value={account.address} />
          <InfoRow icon={Phone} label="โทรศัพท์" value={account.phone} />
          <InfoRow icon={Mail} label="อีเมล" value={account.email} />
          <InfoRow icon={Globe} label="เว็บไซต์" value="-" />
        </CollapsibleSection>
      </Card>

      <Card className="shadow-sm">
        <CollapsibleSection title={`ผู้ติดต่อ (${contacts.length})`} icon={Users}>
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูลผู้ติดต่อ</p>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="p-2.5 rounded-md bg-muted/50 space-y-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={11} /> {c.email}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CollapsibleSection>
      </Card>

      <Card className="shadow-sm">
        <CollapsibleSection title="บันทึกภายใน" icon={StickyNote}>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-xs min-h-[100px] resize-none"
            placeholder="เพิ่มบันทึก..."
          />
        </CollapsibleSection>
      </Card>
    </div>
  );
}
