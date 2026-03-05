import { useState, useMemo, useRef } from "react";
import { mockData } from "@/lib/mock-data";
import { 
  Plus, 
  Search, 
  Camera, 
  FileUp, 
  Calculator, 
  ChevronRight, 
  X, 
  Trash2, 
  Save,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Layers,
  Weight,
  Building2,
  Receipt,
  FileText,
  CreditCard,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export default function JobWork() {
  const [activeTab, setActiveTab] = useState<'incoming' | 'labour'>('incoming');
  const [subTab, setSubTab] = useState<'vendors' | 'challans'>('vendors');
  const [labourFilter, setLabourFilter] = useState<'all' | 'pending' | 'needs_review'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState(mockData.jobWorkEntries);
  const [labourInvoices, setLabourInvoices] = useState(mockData.labourInvoices);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isEntryDrawerOpen, setIsEntryDrawerOpen] = useState(false);
  const [isLabourDrawerOpen, setIsLabourDrawerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Form States
  const [formHeader, setFormHeader] = useState({
    challan: "",
    date: format(new Date(), "yyyy-MM-dd"),
    lorryNo: "",
    vendor: mockData.vendors[0].name
  });
  const [formItems, setFormItems] = useState<any[]>([
    { material: "", thick: "", pcs: "", partyWt: "", ourWt: "", rate: "", zinc: 0 }
  ]);

  // Labour Form State
  const [labourForm, setLabourForm] = useState({
    vendor: mockData.vendors[0].name,
    invNo: "",
    date: format(new Date(), "yyyy-MM-dd"),
    vehicleNo: "",
    weight: "", // Material Received (kg)
    rate: "",   // Rate per kg
    gstPercent: "18",
    total: "",  // Total Invoice Amount (Inclusive)
    linkedJW: [] as string[]
  });

  const totals = useMemo(() => {
    return entries.reduce((acc, entry) => {
      entry.items.forEach((item: any) => {
        acc.ourWt += parseFloat(item.ourWt) || 0;
        if (item.zinc > 0) acc.consumed += item.zinc;
        else acc.received += Math.abs(item.zinc);
      });
      return acc;
    }, { ourWt: 0, consumed: 0, received: 0 });
  }, [entries]);

  const vendorBalances = useMemo(() => {
    const balances: Record<string, any> = {};
    entries.forEach(entry => {
      if (!balances[entry.vendor]) {
        balances[entry.vendor] = { name: entry.vendor, consumed: 0, received: 0, totalWt: 0, lastDate: entry.date };
      }
      entry.items.forEach((item: any) => {
        balances[entry.vendor].totalWt += parseFloat(item.ourWt) || 0;
        if (item.zinc > 0) balances[entry.vendor].consumed += item.zinc;
        else balances[entry.vendor].received += Math.abs(item.zinc);
      });
    });
    return Object.values(balances);
  }, [entries]);

  const filteredChallans = useMemo(() => {
    return entries.filter(e => 
      e.challan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.lorryNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  const filteredLabourInvoices = useMemo(() => {
    return labourInvoices.filter(inv => {
      const matchesSearch = inv.invNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           inv.vendor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = labourFilter === 'all' || inv.status === labourFilter;
      return matchesSearch && matchesFilter;
    });
  }, [labourInvoices, searchQuery, labourFilter]);

  // Labour Calculations - Follow PROMPT Logic word-for-word
  const labourCalculations = useMemo(() => {
    const total = parseFloat(labourForm.total) || 0;
    const gstRate = parseFloat(labourForm.gstPercent) || 18;
    
    // Step 2: Reverse-calculate Basic Amount
    // Basic = Total / (1 + GST%)
    const basic = total / (1 + gstRate / 100);
    
    // Step 3: Calculate TDS (2% of Basic Amount)
    const tds = basic * 0.02;
    
    // Step 4: Final Payable Amount
    // Payable = Total Invoice Amount – TDS
    const payable = total - tds;
    
    const gstAmount = total - basic;

    return { basic, gstAmount, tds, payable };
  }, [labourForm.total, labourForm.gstPercent]);

  const handleSave = () => {
    if (!formHeader.challan) {
      toast.error("Challan No is mandatory");
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...formHeader,
      items: formItems
    };
    setEntries([newEntry, ...entries]);
    setIsEntryDrawerOpen(false);
    toast.success("Job Work Entry Saved");
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setFormHeader({
        challan: "J/" + Math.floor(Math.random() * 500),
        date: format(new Date(), "yyyy-MM-dd"),
        lorryNo: "WB11C-" + Math.floor(Math.random() * 9999),
        vendor: "Acme India Pvt Ltd."
      });
      setFormItems([{ material: "Flat 50x6", thick: "6", pcs: "120", partyWt: "4500", ourWt: "4520", rate: "3.6", zinc: 162.72 }]);
      setIsScanning(false);
      toast.info("OCR Extraction Successful");
    }, 2000);
  };

  const handleLabourSave = () => {
    if (!labourForm.invNo || !labourForm.total) {
      toast.error("Invoice No and Total Amount are mandatory");
      return;
    }
    
    // Determine status based on some mock logic or default to pending
    const status = parseFloat(labourForm.total) > 15000 ? "needs_review" : "pending";
    
    const newInv = {
      id: "L-" + Date.now(),
      ...labourForm,
      ...labourCalculations,
      status: status
    };
    setLabourInvoices([newInv as any, ...labourInvoices]);
    setIsLabourDrawerOpen(false);
    toast.success(`Labour Invoice Saved (${status.replace('_', ' ')})`);
  };

  const handleLabourApprove = (id: string) => {
    setLabourInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'pending' } : inv
    ));
    toast.success("Labour invoice approved");
  };

  const handleLabourPay = (id: string) => {
    setLabourInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'processed' } : inv
    ));
    toast.success("Payment initiated");
  };

  const handleLabourScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const randomTotal = Math.floor(Math.random() * 20000) + 5000;
      setLabourForm({
        ...labourForm,
        invNo: "INV/LB/" + Math.floor(Math.random() * 999),
        vehicleNo: "WB11C-" + Math.floor(Math.random() * 9999),
        weight: "1250",
        rate: "12.40",
        total: randomTotal.toString(),
        vendor: mockData.vendors[0].name,
        date: format(new Date(), "yyyy-MM-dd"),
        gstPercent: "18"
      });
      setIsScanning(false);
      toast.info("Labour Invoice Extracted");
    }, 2000);
  };

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Job Work</h1>
          <button onClick={() => activeTab === 'incoming' ? setIsEntryDrawerOpen(true) : setIsLabourDrawerOpen(true)} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('incoming')} className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg transition-all", activeTab === 'incoming' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Incoming</button>
          <button onClick={() => setActiveTab('labour')} className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg transition-all", activeTab === 'labour' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Labour Cost</button>
        </div>

        {activeTab === 'incoming' && (
          <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
            <button onClick={() => setSubTab('vendors')} className={cn("flex-1 py-1 text-[10px] font-bold rounded-lg transition-all", subTab === 'vendors' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Vendor Balance</button>
            <button onClick={() => setSubTab('challans')} className={cn("flex-1 py-1 text-[10px] font-bold rounded-lg transition-all", subTab === 'challans' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Challan Register</button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
        {activeTab === 'incoming' ? (
          <>
            {/* Zinc Stats Card */}
            <div className="bg-gray-900 rounded-3xl p-5 text-white shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Net Zinc Balance</p>
                  <h2 className="text-3xl font-black">{(totals.consumed - totals.received).toFixed(2)} KG</h2>
                </div>
                <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", (totals.consumed - totals.received) > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300")}>
                  {(totals.consumed - totals.received) > 0 ? "Surplus Due" : "Excess Held"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[8px] font-bold uppercase opacity-40">Material Sent</p>
                  <p className="text-sm font-black">{(totals.consumed/1000).toFixed(3)} MT</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase opacity-40">Material Received</p>
                  <p className="text-sm font-black">{(totals.received/1000).toFixed(3)} MT</p>
                </div>
              </div>
            </div>

            {subTab === 'vendors' ? (
              vendorBalances.map((v, i) => (
                <div key={i} onClick={() => setSelectedVendor(v)} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Building2 size={20} /></div>
                    <div><h3 className="font-bold text-gray-900 text-sm">{v.name}</h3><p className="text-[10px] text-gray-400">Balance: {(v.consumed - v.received).toFixed(1)} KG</p></div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              ))
            ) : (
              filteredChallans.map((e) => (
                <div key={e.id} onClick={() => setSelectedEntry(e)} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase">{e.challan}</span>
                    <h4 className="text-xs font-bold text-gray-900 mt-1">{e.vendor}</h4>
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{e.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{e.items.reduce((s,i)=>s+i.zinc, 0).toFixed(1)} KG</p>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          /* Labour Cost Section */
          <div className="space-y-4">
            <div className="bg-emerald-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-100">
               <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Total Labour Outstanding</p>
                    <h2 className="text-3xl font-black">₹{mockData.stats.labourChargesPayable.toLocaleString('en-IN')}</h2>
                  </div>
                  <CreditCard size={24} className="opacity-40" />
               </div>
               <div className="flex gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex-1">
                    <p className="text-[8px] font-bold uppercase opacity-60">Total Paid</p>
                    <p className="text-xs font-black">₹45,000</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex-1 text-right">
                    <p className="text-[8px] font-bold uppercase opacity-60">TDS Deducted</p>
                    <p className="text-xs font-black">₹8,400</p>
                  </div>
               </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setIsLabourDrawerOpen(true)} className="flex-1 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-95 transition-all">
                <Plus size={16} className="text-emerald-600" /> New Entry
              </button>
              <button onClick={handleLabourScan} className="flex-1 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-95 transition-all">
                <Camera size={16} className="text-emerald-600" /> Scan
              </button>
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setLabourFilter('all')}
                className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all", labourFilter === 'all' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}
              >
                All
              </button>
              <button 
                onClick={() => setLabourFilter('pending')}
                className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all", labourFilter === 'pending' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}
              >
                Pending
              </button>
              <button 
                onClick={() => setLabourFilter('needs_review')}
                className={cn("flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all", labourFilter === 'needs_review' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}
              >
                Needs Review
              </button>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoices</h3>
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{filteredLabourInvoices.length} Found</span>
               </div>
               
               {filteredLabourInvoices.map((inv: any) => (
                 <div key={inv.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-bold text-gray-900 text-sm">{inv.vendor}</h4>
                           <div className="h-4 w-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5"><path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                           </div>
                         </div>
                         <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">GSTIN: {mockData.vendors.find(v => v.name === inv.vendor)?.gstin || "Pending"}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-lg font-black text-gray-900">₹{parseFloat(inv.total).toLocaleString('en-IN')}</p>
                         <p className={cn(
                           "text-[9px] font-bold flex items-center justify-end gap-1 uppercase",
                           inv.status === 'pending' ? "text-amber-500" : 
                           inv.status === 'needs_review' ? "text-rose-500" : "text-emerald-500"
                         )}>
                           <History size={10} /> {inv.status.replace('_', ' ')}
                         </p>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       {inv.status === 'needs_review' && (
                         <button onClick={() => handleLabourApprove(inv.id)} className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-200">
                            <Check size={14} /> Approve
                         </button>
                       )}
                       {inv.status === 'pending' && (
                         <>
                           <button onClick={() => handleLabourPay(inv.id)} className="flex-1 bg-primary text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20">
                              <CreditCard size={14} /> Pay
                           </button>
                           <button className="flex-1 bg-gray-50 text-gray-900 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                              <History size={14} /> Schedule
                           </button>
                         </>
                       )}
                       {inv.status === 'processed' && (
                         <div className="flex-1 py-2 text-center text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-xl">
                           Processed Successfully
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50 text-center">
                       <div className="text-center">
                          <p className="text-[7px] text-gray-400 font-bold uppercase">Total Invoiced</p>
                          <p className="text-[10px] font-black text-gray-700">₹{parseFloat(inv.total).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[7px] text-gray-400 font-bold uppercase">TDS (2%)</p>
                          <p className="text-[10px] font-black text-rose-500">₹{parseFloat(inv.tds).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[7px] text-gray-400 font-bold uppercase">Outstanding</p>
                          <p className="text-[10px] font-black text-emerald-600">₹{parseFloat(inv.payable).toLocaleString('en-IN', {maximumFractionDigits: 0})}</p>
                       </div>
                    </div>
                 </div>
               ))}

               {filteredLabourInvoices.length === 0 && (
                 <div className="py-20 text-center">
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search className="text-gray-300" size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-400">No invoices matching filters</p>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>


      {/* Labour Entry Drawer */}
      <Drawer open={isLabourDrawerOpen} onOpenChange={setIsLabourDrawerOpen}>
        <DrawerContent className="max-h-[92dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-10">
            <DrawerHeader className="p-0 text-left">
              <div className="flex justify-between items-center mb-4">
                <button onClick={handleLabourScan} className="h-10 px-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95">
                  <Camera size={16} /> OCR Scan
                </button>
                <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
              </div>
              <DrawerTitle className="text-xl font-bold text-gray-900">New Labour Invoice</DrawerTitle>
              <DrawerDescription className="text-xs">Reverse-calculate Basic & TDS from Total Amount</DrawerDescription>
            </DrawerHeader>

            <div className="space-y-4">
               {/* Header Section */}
               <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-gray-400">Vendor</Label>
                    <select 
                      value={labourForm.vendor} 
                      onChange={(e) => setLabourForm({...labourForm, vendor: e.target.value})}
                      className="h-11 w-full rounded-xl bg-gray-50 border-0 px-3 text-sm font-bold"
                    >
                      {mockData.vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Invoice Number</Label>
                      <Input value={labourForm.invNo} onChange={(e) => setLabourForm({...labourForm, invNo: e.target.value})} className="h-11 rounded-xl bg-gray-50 text-sm font-mono" placeholder="INV/2024/..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Invoice Date</Label>
                      <Input type="date" value={labourForm.date} onChange={(e) => setLabourForm({...labourForm, date: e.target.value})} className="h-11 rounded-xl bg-gray-50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Vehicle No (Optional)</Label>
                      <Input value={labourForm.vehicleNo} onChange={(e) => setLabourForm({...labourForm, vehicleNo: e.target.value})} className="h-11 rounded-xl bg-gray-50 text-sm font-mono" placeholder="WB..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Linked JW No(s)</Label>
                      <Input placeholder="Select Challans..." className="h-11 rounded-xl bg-gray-50 text-xs" readOnly />
                    </div>
                  </div>
               </div>

               {/* Calculation Section */}
               <div className="bg-gray-50 p-5 rounded-3xl space-y-4 border border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Material Received (kg)</Label>
                      <Input type="number" value={labourForm.weight} onChange={(e) => setLabourForm({...labourForm, weight: e.target.value})} className="h-11 rounded-xl bg-white text-sm font-black" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Rate per kg</Label>
                      <Input type="number" value={labourForm.rate} onChange={(e) => setLabourForm({...labourForm, rate: e.target.value})} className="h-11 rounded-xl bg-white text-sm font-black" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Total Invoice Amount (Inclusive)</Label>
                        <Input type="number" value={labourForm.total} onChange={(e) => setLabourForm({...labourForm, total: e.target.value})} className="h-11 rounded-xl bg-white text-lg font-black border-emerald-200" />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">GST %</Label>
                        <select value={labourForm.gstPercent} onChange={(e) => setLabourForm({...labourForm, gstPercent: e.target.value})} className="h-11 w-full rounded-xl bg-white border border-gray-200 px-3 text-sm font-bold">
                           <option value="12">12%</option>
                           <option value="18">18%</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">Computed Basic</span>
                        <span className="font-bold text-gray-900">₹{labourCalculations.basic.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">GST Amount</span>
                        <span className="font-bold text-gray-900">₹{labourCalculations.gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-rose-500 font-black uppercase">TDS (2%) Deducted</span>
                        <span className="font-black text-rose-500">-₹{labourCalculations.tds.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                     <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-300">
                        <span className="text-sm font-black uppercase text-emerald-600">Net Payable</span>
                        <span className="text-2xl font-black text-emerald-600">₹{labourCalculations.payable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                     </div>
                  </div>
               </div>

               <button onClick={handleLabourSave} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                  <Save size={20} /> Confirm & Save Labour Invoice
               </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Entry Drawer (unchanged structure but with Terminology updates) */}
      <Drawer open={isEntryDrawerOpen} onOpenChange={setIsEntryDrawerOpen}>
        <DrawerContent className="max-h-[92dvh] bg-white rounded-t-[2.5rem]">
           <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-10">
            <DrawerHeader className="p-0 text-left">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <button onClick={handleScan} className="h-10 px-3 bg-primary/5 text-primary rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95">
                    <Camera size={16} /> Scan Challan
                  </button>
                </div>
                <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
              </div>
              <DrawerTitle className="text-xl font-bold">New Incoming Entry</DrawerTitle>
            </DrawerHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Challan No</Label>
                  <Input placeholder="e.g. CH-2024-001" value={formHeader.challan} onChange={(e) => setFormHeader({...formHeader, challan: e.target.value})} className="h-11 rounded-xl bg-gray-50 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Lorry No</Label>
                  <Input placeholder="Vehicle No" value={formHeader.lorryNo} onChange={(e) => setFormHeader({...formHeader, lorryNo: e.target.value})} className="h-11 rounded-xl bg-gray-50 text-sm font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Date</Label>
                <Input type="date" value={formHeader.date} onChange={(e) => setFormHeader({...formHeader, date: e.target.value})} className="h-11 rounded-xl bg-gray-50" />
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-gray-400 ml-1">Vendor</Label>
                <select 
                  value={formHeader.vendor} 
                  onChange={(e) => setFormHeader({...formHeader, vendor: e.target.value})}
                  className="h-11 w-full rounded-xl bg-gray-50 border-0 px-3 text-sm font-bold"
                >
                  {mockData.vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-[9px] font-black uppercase text-gray-400">Items (Zinc Calc)</Label>
                  <button onClick={() => setFormItems([...formItems, { material: "", thick: "", pcs: "", partyWt: "", ourWt: "", rate: "", zinc: 0 }])} className="text-primary text-[10px] font-bold flex items-center gap-1">
                    <Plus size={12} /> Add Row
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-2xl space-y-3 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <Input placeholder="Material Description" value={item.material} onChange={(e) => {
                          const newItems = [...formItems];
                          newItems[idx].material = e.target.value;
                          setFormItems(newItems);
                        }} className="h-9 bg-white border-0 text-xs font-bold" />
                        <button onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))} className="p-2 text-rose-400"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input placeholder="Thick" value={item.thick} onChange={(e) => {
                          const newItems = [...formItems];
                          newItems[idx].thick = e.target.value;
                          setFormItems(newItems);
                        }} className="h-9 bg-white border-0 text-[10px]" />
                        <Input placeholder="Pcs" value={item.pcs} onChange={(e) => {
                          const newItems = [...formItems];
                          newItems[idx].pcs = e.target.value;
                          setFormItems(newItems);
                        }} className="h-9 bg-white border-0 text-[10px]" />
                        <Input placeholder="Rate %" value={item.rate} onChange={(e) => {
                          const newItems = [...formItems];
                          newItems[idx].rate = e.target.value;
                          // Recalc zinc
                          const wt = parseFloat(item.ourWt) || 0;
                          const r = parseFloat(e.target.value) || 0;
                          newItems[idx].zinc = (wt * r) / 100;
                          setFormItems(newItems);
                        }} className="h-9 bg-white border-0 text-[10px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                           <Label className="text-[8px] uppercase text-gray-400 ml-1">Our Wt (KG)</Label>
                           <Input placeholder="Our Wt" value={item.ourWt} onChange={(e) => {
                             const newItems = [...formItems];
                             newItems[idx].ourWt = e.target.value;
                             // Recalc zinc
                             const wt = parseFloat(e.target.value) || 0;
                             const r = parseFloat(item.rate) || 0;
                             newItems[idx].zinc = (wt * r) / 100;
                             setFormItems(newItems);
                           }} className="h-9 bg-white border-0 text-xs font-black" />
                         </div>
                         <div className="space-y-1 text-right">
                           <Label className="text-[8px] uppercase text-gray-400 mr-1">Zinc Consumed</Label>
                           <p className="text-xs font-black text-primary pt-2">{item.zinc.toFixed(2)} KG</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Save size={20} /> Save Entry
              </button>
            </div>
           </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}