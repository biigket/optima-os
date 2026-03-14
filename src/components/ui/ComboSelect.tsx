import { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddOption?: (option: string) => void;
  onRemoveOption?: (option: string) => void;
  className?: string;
}

export default function ComboSelect({ value, onChange, options, onAddOption, placeholder = 'เลือก...', className }: ComboSelectProps) {
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = newValue
    ? options.filter(o => o.toLowerCase().includes(newValue.toLowerCase()))
    : options;

  function handleAdd() {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    onAddOption?.(trimmed);
    onChange(trimmed);
    setNewValue('');
    setOpen(false);
  }

  function handleSelect(opt: string) {
    onChange(opt);
    setOpen(false);
    setNewValue('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', !value && 'text-muted-foreground', className)}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <Input
          ref={inputRef}
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          placeholder="ค้นหาหรือพิมพ์ใหม่..."
          className="h-8 text-xs mb-2"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0) {
                handleSelect(filtered[0]);
              } else {
                handleAdd();
              }
            }
          }}
        />
        <div className="max-h-[150px] overflow-y-auto space-y-0.5">
          {filtered.map(opt => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={cn(
                'w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent flex items-center gap-2',
                value === opt && 'bg-accent'
              )}
            >
              {value === opt && <Check className="h-3 w-3 text-primary" />}
              <span className={value !== opt ? 'pl-5' : ''}>{opt}</span>
            </button>
          ))}
        </div>
        {newValue.trim() && !options.includes(newValue.trim()) && (
          <button
            onClick={handleAdd}
            className="w-full mt-1 px-2 py-1.5 text-xs rounded-sm border border-dashed border-primary/30 text-primary hover:bg-primary/5 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> เพิ่ม "{newValue.trim()}"
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
