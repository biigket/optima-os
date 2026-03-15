import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, ChevronLeft, ChevronRight, FileText, CheckCircle2, Edit3, Plus, Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMockAuth } from '@/hooks/useMockAuth';

const STEPS = [
  { label: 'เลือกใบเสนอราคา', icon: FileText },
  { label: 'ข้อมูลสัญญา', icon: Edit3 },
  { label: 'ยืนยัน', icon: CheckCircle2 },
];

const DEFAULT_ACCESSORIES = [
  { name: 'FL HANDPIECE', quantity: 2, unit: 'อัน' },
  { name: 'SD HANDPIECE', quantity: 2, unit: 'อัน' },
];

const DEFAULT_WARRANTY = [
  { item: 'Cartridge FL 2.0 mm', warranty: 'รับประกัน 24,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Cartridge FL 3.0 mm', warranty: 'รับประกัน 24,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Cartridge FL 4.5 mm', warranty: 'รับประกัน 24,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Cartridge FL 6.0 mm', warranty: 'รับประกัน 24,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Cartridge SD 1.5 mm', warranty: 'รับประกัน 240,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Cartridge SD 3.0 mm', warranty: 'รับประกัน 240,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Cartridge SD 4.5 mm', warranty: 'รับประกัน 240,000 นัดหรือ 1 ปี', note: 'ขึ้นกับระยะใดถึงก่อน' },
  { item: 'Handpiece Focused Linear Ultrasound', warranty: 'รับประกัน 1 ปี', note: '' },
  { item: 'Handpiece Synergy Dotting', warranty: 'รับประกัน 1 ปี', note: '' },
  { item: '[ACC] Foot Switch', warranty: 'รับประกัน 1 ปี', note: '' },
];

const DEFAULT_APPENDIX_ITEMS = [
  { name: 'Cartridge FL 2.0 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
  { name: 'Cartridge FL 3.0 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
  { name: 'Cartridge FL 4.5 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
  { name: 'Cartridge FL 6.0 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
  { name: 'Cartridge SD 1.5 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
  { name: 'Cartridge SD 3.0 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
  { name: 'Cartridge SD 4.5 mm', detail: 'จำนวน 1 (หนึ่ง) หัว โดยไม่คิดมูลค่า' },
];

interface QuotationOption {
  id: string;
  qt_number: string;
  product: string;
  price: number;
  account_id: string;
  clinic_name: string;
  company_name: string;
  payment_condition: string;
  sale_assigned: string;
  has_installments: boolean;
  installment_count: number;
  deposit_value: number;
  deposit_type: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  editContract?: any; // existing contract to edit
}

export default function CreateContractWizard({ open, onOpenChange, onCreated, editContract }: Props) {
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();
  const isEditMode = !!editContract;
  const [step, setStep] = useState(isEditMode ? 1 : 0);
  const [search, setSearch] = useState('');
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: Selected QT
  const [selectedQt, setSelectedQt] = useState<QuotationOption | null>(null);

  // Step 2: Editable contract fields
  const [contractDate, setContractDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerRepresentative, setBuyerRepresentative] = useState('');
  const [buyerIdNumber, setBuyerIdNumber] = useState('');
  const [buyerIdExpiry, setBuyerIdExpiry] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [sellerRepresentative, setSellerRepresentative] = useState('นายแพทย์ฐิติคมน์ ลิ้มรัตนเมฆา');
  const [productName, setProductName] = useState('NEW DOUBLO 2.0');
  const [productBrand, setProductBrand] = useState('HIRONIC');
  const [productOrigin, setProductOrigin] = useState('ประเทศเกาหลี');
  const [productQuantity, setProductQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentClause21, setPaymentClause21] = useState('ชำระค่าเครื่องมือแพทย์ตามข้อ 1. ให้ "ผู้ขาย" งวดที่ 1 เป็นจำนวนเงิน {deposit}.- บาท ({deposit_text})\nโดยชำระด้วยการโอนเงินเข้าบัญชีในนาม บริษัท ออปติม่าแอสเทติค จำกัด เลขที่บัญชี 411-0-748-56-8 (ธนาคารไทยพาณิชย์)');
  const [paymentClause22, setPaymentClause22] = useState('ผู้ซื้อจะดำเนินการชำระเงินค่าสินค้าประเภทเครื่องมือแพทย์ในส่วนที่เหลือเป็นจำนวนเงิน {remaining} บาท\n({remaining_text}) ผ่านบัตรเครดิต');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDays, setDeliveryDays] = useState(60);
  const [warrantyYears, setWarrantyYears] = useState(1);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [accessories, setAccessories] = useState(DEFAULT_ACCESSORIES);
  const [warrantyDetails, setWarrantyDetails] = useState(DEFAULT_WARRANTY);
  const [appendixItems, setAppendixItems] = useState(DEFAULT_APPENDIX_ITEMS);

  // Load existing contract data when editing
  useEffect(() => {
    if (!open || !editContract) return;
    setStep(1);
    setBuyerCompany(editContract.buyer_company_name || '');
    setBuyerRepresentative(editContract.buyer_representative_name || '');
    setBuyerIdNumber(editContract.buyer_id_number || '');
    setBuyerIdExpiry(editContract.buyer_id_expiry || '');
    setBuyerAddress(editContract.buyer_address || '');
    setBuyerPhone(editContract.buyer_phone || '');
    setSellerRepresentative(editContract.seller_representative_name || 'นายแพทย์ฐิติคมน์ ลิ้มรัตนเมฆา');
    setContractDate(editContract.contract_date || format(new Date(), 'yyyy-MM-dd'));
    setProductName(editContract.product_name || 'NEW DOUBLO 2.0');
    setProductBrand(editContract.product_brand || 'HIRONIC');
    setProductOrigin(editContract.product_origin || 'ประเทศเกาหลี');
    setProductQuantity(editContract.product_quantity || 1);
    setTotalPrice(editContract.total_price || 0);
    setDepositAmount(editContract.deposit_amount || 0);
    setRemainingAmount(editContract.remaining_amount || 0);
    setPaymentMethod(editContract.payment_method || '');
    setDeliveryAddress(editContract.delivery_address || '');
    setDeliveryDays(editContract.delivery_days || 60);
    setWarrantyYears(editContract.warranty_years || 1);
    setAdditionalNotes(editContract.additional_notes || '');
    if (editContract.product_accessories && Array.isArray(editContract.product_accessories)) {
      setAccessories(editContract.product_accessories as any[]);
    }
    if (editContract.warranty_details && Array.isArray(editContract.warranty_details)) {
      setWarrantyDetails(editContract.warranty_details as any[]);
    }
    if (editContract.appendix_items && Array.isArray(editContract.appendix_items)) {
      setAppendixItems(editContract.appendix_items as any[]);
    }
    // Set a virtual selectedQt for display
    setSelectedQt({
      id: editContract.quotation_id || '',
      qt_number: editContract.qt_number || '',
      product: editContract.product_name || '',
      price: editContract.total_price || 0,
      account_id: editContract.account_id || '',
      clinic_name: editContract.buyer_company_name || '',
      company_name: editContract.buyer_company_name || '',
      payment_condition: editContract.payment_method || '',
      sale_assigned: '',
      has_installments: (editContract.installment_count || 1) > 1,
      installment_count: editContract.installment_count || 1,
      deposit_value: editContract.deposit_amount || 0,
      deposit_type: 'NONE',
    });
  }, [open, editContract]);

  // Load signed quotations
  useEffect(() => {
    if (!open || editContract) return;
    loadQuotations();
  }, [open, editContract]);

  async function loadQuotations() {
    setLoading(true);
    const { data: qts } = await supabase
      .from('quotations')
      .select('id, qt_number, product, price, account_id, payment_condition, sale_assigned, has_installments, installment_count, deposit_value, deposit_type, approval_status')
      .eq('approval_status', 'CUSTOMER_SIGNED')
      .order('created_at', { ascending: false });

    if (!qts || qts.length === 0) {
      setQuotations([]);
      setLoading(false);
      return;
    }

    // Check which QTs already have contracts
    const { data: existingContracts } = await supabase
      .from('contracts')
      .select('quotation_id');

    const usedQtIds = new Set((existingContracts || []).map((c: any) => c.quotation_id));

    const accountIds = [...new Set(qts.map(q => q.account_id).filter(Boolean))];
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, clinic_name, company_name, address, phone')
      .in('id', accountIds);

    const accountMap = new Map((accounts || []).map(a => [a.id, a]));

    const options: QuotationOption[] = qts
      .filter(q => !usedQtIds.has(q.id))
      .map(q => {
        const acc = accountMap.get(q.account_id || '');
        return {
          id: q.id,
          qt_number: q.qt_number || '',
          product: q.product || '',
          price: q.price || 0,
          account_id: q.account_id || '',
          clinic_name: acc?.clinic_name || '',
          company_name: acc?.company_name || '',
          payment_condition: q.payment_condition || '',
          sale_assigned: q.sale_assigned || '',
          has_installments: q.has_installments || false,
          installment_count: q.installment_count || 1,
          deposit_value: q.deposit_value || 0,
          deposit_type: q.deposit_type || 'NONE',
        };
      });

    setQuotations(options);
    setLoading(false);
  }

  function selectQuotation(qt: QuotationOption) {
    setSelectedQt(qt);
    // Pre-fill from QT data
    setBuyerCompany(qt.company_name || qt.clinic_name);
    setTotalPrice(qt.price);
    setDepositAmount(qt.deposit_value);
    setRemainingAmount(qt.price - qt.deposit_value);
    setPaymentMethod(qt.payment_condition);

    // Load account details for address
    supabase.from('accounts').select('address, phone').eq('id', qt.account_id).single().then(({ data }) => {
      if (data) {
        setBuyerAddress(data.address || '');
        setBuyerPhone(data.phone || '');
        setDeliveryAddress(data.address || '');
      }
    });

    // Load contacts for buyer representative
    supabase.from('contacts').select('name, phone').eq('account_id', qt.account_id).eq('is_decision_maker', true).limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setBuyerRepresentative(data[0].name);
        if (!buyerPhone) setBuyerPhone(data[0].phone || '');
      }
    });

    setStep(1);
  }

  async function generateContractNumber() {
    const now = new Date();
    const yearMonth = format(now, 'yyyy-MM');
    // Use installment count for the number prefix: ND2-{installments}/{YYYY}-{NNN}
    const installments = selectedQt?.installment_count || 1;
    const { data: nextNum } = await supabase.rpc('get_next_doc_number', {
      p_doc_type: 'CONTRACT-ND2',
      p_year_month: yearMonth.replace('-', ''),
    });
    const num = String(nextNum || 1).padStart(3, '0');
    const year = format(now, 'yyyy');
    return `ND2-${installments}/${year}-${num}`;
  }

  async function handleCreate() {
    if (!selectedQt) return;
    setSaving(true);
    try {
      const contractPayload = {
        contract_date: contractDate,
        buyer_company_name: buyerCompany,
        buyer_representative_name: buyerRepresentative,
        buyer_id_number: buyerIdNumber,
        buyer_id_expiry: buyerIdExpiry || null,
        buyer_address: buyerAddress,
        buyer_phone: buyerPhone,
        seller_representative_name: sellerRepresentative,
        product_name: productName,
        product_brand: productBrand,
        product_origin: productOrigin,
        product_quantity: productQuantity,
        product_accessories: accessories,
        total_price: totalPrice,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        delivery_days: deliveryDays,
        warranty_years: warrantyYears,
        warranty_details: warrantyDetails,
        appendix_items: appendixItems,
        additional_notes: additionalNotes,
      } as any;

      let contractId: string;

      if (isEditMode && editContract?.id) {
        // UPDATE existing contract
        const { error } = await supabase.from('contracts').update(contractPayload).eq('id', editContract.id);
        if (error) throw error;
        contractId = editContract.id;
        toast.success(`แก้ไขสัญญา ${editContract.contract_number} สำเร็จ`);
      } else {
        // CREATE new contract
        const contractNumber = await generateContractNumber();
        const { data, error } = await supabase.from('contracts').insert({
          ...contractPayload,
          contract_number: contractNumber,
          quotation_id: selectedQt.id,
          account_id: selectedQt.account_id,
          product_type: 'ND2',
          deposit_date: null,
          installment_count: selectedQt.installment_count || 1,
          qt_number: selectedQt.qt_number,
          status: 'DRAFT',
          created_by: currentUser?.name || '',
        }).select();
        if (error) throw error;
        contractId = data?.[0]?.id;
        toast.success(`สร้างสัญญา ${contractNumber} สำเร็จ`);
      }

      onOpenChange(false);
      onCreated?.();
      
      // Open PDF in new tab
      if (contractId) {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/generate-contract-pdf`;
        const w = window.open('about:blank', '_blank');
        if (w) {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contract_id: contractId }),
          }).then(r => r.text()).then(html => {
            w.document.open();
            w.document.write(html);
            w.document.close();
          });
        }
      }
      
      resetForm();
    } catch (err: any) {
      toast.error('ไม่สามารถสร้างสัญญาได้: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setStep(0);
    setSelectedQt(null);
    setSearch('');
    setBuyerCompany('');
    setBuyerRepresentative('');
    setBuyerIdNumber('');
    setBuyerIdExpiry('');
    setBuyerAddress('');
    setBuyerPhone('');
    setProductName('NEW DOUBLO 2.0');
    setProductBrand('HIRONIC');
    setProductOrigin('ประเทศเกาหลี');
    setProductQuantity(1);
    setTotalPrice(0);
    setDepositAmount(0);
    setRemainingAmount(0);
    setPaymentMethod('');
    setDeliveryAddress('');
    setDeliveryDays(60);
    setWarrantyYears(1);
    setAdditionalNotes('');
    setAccessories(DEFAULT_ACCESSORIES);
    setWarrantyDetails(DEFAULT_WARRANTY);
    setAppendixItems(DEFAULT_APPENDIX_ITEMS);
  }

  const filteredQts = useMemo(() => {
    if (!search) return quotations;
    const s = search.toLowerCase();
    return quotations.filter(q =>
      q.qt_number.toLowerCase().includes(s) ||
      q.clinic_name.toLowerCase().includes(s) ||
      q.company_name.toLowerCase().includes(s) ||
      q.product.toLowerCase().includes(s)
    );
  }, [quotations, search]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'แก้ไขหนังสือสัญญาซื้อขาย' : 'สร้างหนังสือสัญญาซื้อขาย (ND2)'}</DialogTitle>
          <DialogDescription>{isEditMode ? `แก้ไขข้อมูลสัญญา ${editContract?.contract_number}` : 'เลือกใบเสนอราคาที่ลูกค้าเซ็นแล้วเพื่อออกสัญญา'}</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                <s.icon size={14} />
                {s.label}
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step 0: Select Quotation */}
        {step === 0 && (
          <div className="space-y-3 mt-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเลข QT, ชื่อคลินิก, สินค้า..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">กำลังโหลด...</div>
            ) : filteredQts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                ไม่พบใบเสนอราคาที่ลูกค้าเซ็นแล้ว (ที่ยังไม่ได้ออกสัญญา)
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredQts.map(qt => (
                  <Card
                    key={qt.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => selectQuotation(qt)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{qt.qt_number}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 size={12} />
                            {qt.company_name || qt.clinic_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {qt.price?.toLocaleString()} บาท
                          </div>
                          <div className="text-xs text-muted-foreground">{qt.product}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Contract Details */}
        {step === 1 && (
          <div className="space-y-4 mt-3">
            {/* Selected QT summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">ใบเสนอราคาอ้างอิง</div>
                <div className="font-medium text-sm">{selectedQt?.qt_number} — {selectedQt?.company_name || selectedQt?.clinic_name}</div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">วันที่ทำสัญญา</Label>
                <Input type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">ผู้แทนผู้ขาย</Label>
                <Input value={sellerRepresentative} onChange={e => setSellerRepresentative(e.target.value)} />
              </div>
            </div>

            <Separator />
            <div className="text-sm font-medium">ข้อมูลผู้ซื้อ</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ชื่อบริษัท/คลินิก</Label>
                <Input value={buyerCompany} onChange={e => setBuyerCompany(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">ผู้มีอำนาจลงนาม</Label>
                <Input value={buyerRepresentative} onChange={e => setBuyerRepresentative(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">เลขบัตรประชาชน</Label>
                <Input value={buyerIdNumber} onChange={e => setBuyerIdNumber(e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" />
              </div>
              <div>
                <Label className="text-xs">บัตรหมดอายุ</Label>
                <Input type="date" value={buyerIdExpiry} onChange={e => setBuyerIdExpiry(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">ที่อยู่ผู้ซื้อ</Label>
                <Textarea value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} rows={2} />
              </div>
              <div>
                <Label className="text-xs">โทรศัพท์</Label>
                <Input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />
              </div>
            </div>

            <Separator />
            <div className="text-sm font-medium">ข้อมูลสินค้า</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ชื่อเครื่องมือแพทย์</Label>
                <Input value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">ยี่ห้อ</Label>
                <Input value={productBrand} onChange={e => setProductBrand(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">ประเทศผู้ผลิต</Label>
                <Input value={productOrigin} onChange={e => setProductOrigin(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">จำนวน (เครื่อง)</Label>
                <Input type="number" value={productQuantity} onChange={e => setProductQuantity(Number(e.target.value))} min={1} />
              </div>
            </div>

            {/* Accessories */}
            <div className="text-xs font-medium text-muted-foreground">อุปกรณ์ประกอบ</div>
            {accessories.map((acc, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <Input className="text-xs" value={acc.name} onChange={e => {
                  const updated = [...accessories];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setAccessories(updated);
                }} />
                <Input className="text-xs" type="number" value={acc.quantity} onChange={e => {
                  const updated = [...accessories];
                  updated[i] = { ...updated[i], quantity: Number(e.target.value) };
                  setAccessories(updated);
                }} min={1} />
                <Input className="text-xs" value={acc.unit} onChange={e => {
                  const updated = [...accessories];
                  updated[i] = { ...updated[i], unit: e.target.value };
                  setAccessories(updated);
                }} />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAccessories([...accessories, { name: '', quantity: 1, unit: 'อัน' }])}
            >
              + เพิ่มอุปกรณ์
            </Button>

            <Separator />
            <div className="text-sm font-medium">รายการรับประกัน Cartridge</div>
            {warrantyDetails.map((w, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                <Input className="text-xs" placeholder="รายการ" value={w.item} onChange={e => {
                  const updated = [...warrantyDetails];
                  updated[i] = { ...updated[i], item: e.target.value };
                  setWarrantyDetails(updated);
                }} />
                <Input className="text-xs" placeholder="รับประกัน" value={w.warranty} onChange={e => {
                  const updated = [...warrantyDetails];
                  updated[i] = { ...updated[i], warranty: e.target.value };
                  setWarrantyDetails(updated);
                }} />
                <Input className="text-xs" placeholder="หมายเหตุ" value={w.note} onChange={e => {
                  const updated = [...warrantyDetails];
                  updated[i] = { ...updated[i], note: e.target.value };
                  setWarrantyDetails(updated);
                }} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                  setWarrantyDetails(warrantyDetails.filter((_, idx) => idx !== i));
                }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setWarrantyDetails([...warrantyDetails, { item: '', warranty: 'รับประกัน 1 ปี', note: '' }])}
            >
              <Plus size={12} className="mr-1" /> เพิ่มรายการรับประกัน
            </Button>

            <Separator />
            <div className="text-sm font-medium">รายการแนบท้ายสัญญา (ของแถม)</div>
            {appendixItems.map((a, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                <Input className="text-xs" placeholder="รายการ" value={a.name} onChange={e => {
                  const updated = [...appendixItems];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setAppendixItems(updated);
                }} />
                <Input className="text-xs" placeholder="รายละเอียด" value={a.detail} onChange={e => {
                  const updated = [...appendixItems];
                  updated[i] = { ...updated[i], detail: e.target.value };
                  setAppendixItems(updated);
                }} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                  setAppendixItems(appendixItems.filter((_, idx) => idx !== i));
                }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAppendixItems([...appendixItems, { name: '', detail: '' }])}
            >
              <Plus size={12} className="mr-1" /> เพิ่มรายการแนบท้าย
            </Button>

            <Separator />
            <div className="text-sm font-medium">ข้อตกลงการชำระเงิน</div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">ราคารวมทั้งสิ้น (บาท)</Label>
                <Input type="number" value={totalPrice} onChange={e => {
                  const v = Number(e.target.value);
                  setTotalPrice(v);
                  setRemainingAmount(v - depositAmount);
                }} />
              </div>
              <div>
                <Label className="text-xs">เงินมัดจำ (บาท)</Label>
                <Input type="number" value={depositAmount} onChange={e => {
                  const v = Number(e.target.value);
                  setDepositAmount(v);
                  setRemainingAmount(totalPrice - v);
                }} />
              </div>
              <div>
                <Label className="text-xs">ยอมคงเหลือ (บาท)</Label>
                <Input type="number" value={remainingAmount} readOnly className="bg-muted" />
              </div>
            </div>

            <div>
              <Label className="text-xs">วิธีชำระเงินส่วนที่เหลือ</Label>
              <Input value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} placeholder="เช่น ผ่านบัตรเครดิต, โอนเงิน" />
            </div>

            <Separator />
            <div className="text-sm font-medium">การส่งมอบและติดตั้ง</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">สถานที่ส่งมอบและติดตั้ง</Label>
                <Textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} />
              </div>
              <div>
                <Label className="text-xs">จำนวนวันส่งมอบ (วัน)</Label>
                <Input type="number" value={deliveryDays} onChange={e => setDeliveryDays(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">ระยะเวลารับประกัน (ปี)</Label>
                <Input type="number" value={warrantyYears} onChange={e => setWarrantyYears(Number(e.target.value))} min={1} />
              </div>
            </div>

            <Separator />
            <div className="text-sm font-medium">หมายเหตุเพิ่มเติม</div>
            <Textarea
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              rows={3}
              placeholder="หมายเหตุหรือเงื่อนไขเพิ่มเติม..."
            />

            <div className="flex justify-between pt-2">
              {!isEditMode && (
                <Button variant="outline" size="sm" onClick={() => setStep(0)}>
                  <ChevronLeft size={14} className="mr-1" /> กลับ
                </Button>
              )}
              {isEditMode && <div />}
              <Button size="sm" onClick={() => setStep(2)}>
                ถัดไป <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Confirm */}
        {step === 2 && (
          <div className="space-y-4 mt-3">
            <div className="text-sm font-medium">ตรวจสอบข้อมูลสัญญา</div>

            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs">อ้างอิง QT</span>
                    <div className="font-medium">{selectedQt?.qt_number}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">วันที่ทำสัญญา</span>
                    <div className="font-medium">{contractDate}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground text-xs">ผู้ซื้อ</span>
                  <div className="font-medium">{buyerCompany}</div>
                  <div className="text-xs text-muted-foreground">โดย {buyerRepresentative}</div>
                  <div className="text-xs text-muted-foreground">{buyerAddress}</div>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground text-xs">สินค้า</span>
                  <div className="font-medium">{productName} ยี่ห้อ {productBrand} จำนวน {productQuantity} เครื่อง</div>
                  <div className="text-xs text-muted-foreground">อุปกรณ์: {accessories.map(a => `${a.name} ${a.quantity} ${a.unit}`).join(', ')}</div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs">ราคารวม</span>
                    <div className="font-medium">{totalPrice.toLocaleString()} บาท</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">มัดจำ</span>
                    <div className="font-medium">{depositAmount.toLocaleString()} บาท</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">คงเหลือ</span>
                    <div className="font-medium">{remainingAmount.toLocaleString()} บาท</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs">สถานที่ส่งมอบ</span>
                    <div className="text-xs">{deliveryAddress}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">ส่งมอบภายใน</span>
                    <div className="font-medium">{deliveryDays} วัน</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft size={14} className="mr-1" /> แก้ไข
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? (isEditMode ? 'กำลังบันทึก...' : 'กำลังสร้าง...') : (isEditMode ? 'บันทึกการแก้ไข' : 'สร้างสัญญาซื้อขาย')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
