import { useState, useMemo } from "react";
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
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Layers,
  Weight,
  Percent,
  Truck,
  Calendar,
  Building2,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export default function JobWork() {
  const [activeTab, setActiveTab] = useState<'vendors' | 'challans'>('vendors');
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState(mockData.jobWorkEntries);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isEntryDrawerOpen, setIsEntryDrawerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Form State
  const [formHeader, setFormHeader] = useState({
    challan: "",
    date: format(new Date(), "yyyy-MM-dd"),
    lorryNo: "",
    vendor: mockData.vendors[0].name
  });
  const [formItems, setFormItems] = useState<any[]>([
    { material: "", thick: "", pcs: "", partyWt: "", ourWt: "", rate: "", zinc: 0 }
  ]);

  const vendorBalances = useMemo(() => {
    const balances: Record<string, { name: string, consumed: number, received: number, totalWt: number, lastDate: string }> = {};
    
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

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Job Work</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Incoming Tracking</p>
          </div>
          <button onClick={() => setIsEntryDrawerOpen(true)} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('vendors')} className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg transition-all", activeTab === 'vendors' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Vendors</button>
          <button onClick={() => setActiveTab('challans')} className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg transition-all", activeTab === 'challans' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Challans</button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input 
            placeholder={`Search ${activeTab}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl"
          />
        </div>
      </header>

      {/* Stats Summary from Screenshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <ArrowUpRight size={14} />
            <span className="text-[9px] font-black uppercase tracking-wider">Consumed (MT)</span>
          </div>
          <p className="text-lg font-black text-gray-900">{(totals.consumed / 1000).toFixed(3)}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <ArrowDownLeft size={14} />
            <span className="text-[9px] font-black uppercase tracking-wider">Received (MT)</span>
          </div>
          <p className="text-lg font-black text-gray-900">{(totals.received / 1000).toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Net Zinc Balance</p>
            <h2 className="text-3xl font-black">{(totals.consumed - totals.received).toFixed(2)} KG</h2>
          </div>
          <div className={cn(
            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
            (totals.consumed - totals.received) > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
          )}>
            {(totals.consumed - totals.received) > 0 ? "Surplus Due" : "Excess Held"}
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
           <span className="text-[10px] font-bold uppercase opacity-60">Total Processed Wt.</span>
           <span className="text-sm font-black text-amber-400">{totals.ourWt.toLocaleString()} KG</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
        {activeTab === 'vendors' ? (
          vendorBalances.map((v, i) => {
            const balance = v.consumed - v.received;
            return (
              <div key={i} onClick={() => setSelectedVendor(v)} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{v.name}</h3>
                    <p className="text-[10px] text-gray-400">Last activity: {v.lastDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-black", balance > 0 ? "text-rose-600" : "text-emerald-600")}>
                    {balance > 0 ? "+" : ""}{balance.toFixed(2)} KG
                  </p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Balance</p>
                </div>
              </div>
            );
          })
        ) : (
          filteredChallans.map((entry) => {
            const entryZinc = entry.items.reduce((sum: number, i: any) => sum + (parseFloat(i.zinc) || 0), 0);
            return (
              <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase">{entry.challan}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{entry.date}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-900 mt-1">{entry.lorryNo}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-black", entryZinc < 0 ? "text-emerald-600" : "text-gray-900")}>
                      {entryZinc > 0 ? "₹" : "₹-"}{Math.abs(entryZinc).toFixed(1)} KG
                    </p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase">Impact</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vendor Summary Drawer */}
      <Drawer open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DrawerContent className="max-h-[85dvh] bg-white rounded-t-[2.5rem]">
          {selectedVendor && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Building2 size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedVendor.name}</DrawerTitle>
                <DrawerDescription className="text-sm font-medium">Challan-wise Summary</DrawerDescription>
              </DrawerHeader>

              <div className="bg-gray-50 rounded-3xl p-4 divide-y divide-gray-100">
                {entries.filter(e => e.vendor === selectedVendor.name).map((e, i) => {
                  const zinc = e.items.reduce((sum: number, it: any) => sum + it.zinc, 0);
                  return (
                    <div key={i} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{e.challan}</p>
                        <p className="text-[10px] text-gray-400">{e.date}</p>
                      </div>
                      <p className={cn("text-xs font-black", zinc < 0 ? "text-emerald-600" : "text-gray-900")}>
                        {zinc > 0 ? "+" : ""}{zinc.toFixed(1)} KG
                      </p>
                    </div>
                  );
                })}
              </div>
              <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold" onClick={() => setSelectedVendor(null)}>Done</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Challan Detail Drawer with Uploaded Image Mock */}
      <Drawer open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 rounded-t-[2rem]">
          {selectedEntry && (
            <div className="p-5 space-y-5 overflow-y-auto no-scrollbar pb-safe">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded uppercase">Challan View</span>
                <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
              </div>

              {/* Uploaded Challan Mock Image */}
              <div className="aspect-[4/5] bg-neutral-200 rounded-3xl relative overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center text-neutral-400">
                   <Receipt size={48} className="opacity-20" />
                   <p className="text-[10px] font-bold uppercase mt-2">Scanned Challan Image</p>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur p-3 rounded-2xl border border-white/20">
                   <p className="text-[10px] font-bold text-gray-900">{selectedEntry.challan} • {selectedEntry.vendor}</p>
                   <p className="text-[8px] text-gray-500">OCR Validated on {selectedEntry.date}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                {selectedEntry.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.material}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.thick}mm • {item.ourWt}KG @ {item.rate}%</p>
                    </div>
                    <p className={cn("text-xs font-black", item.zinc < 0 ? "text-emerald-600" : "text-gray-900")}>
                      {item.zinc.toFixed(1)} KG
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Entry Drawer (unchanged logic) */}
      <Drawer open={isEntryDrawerOpen} onOpenChange={setIsEntryDrawerOpen}>
        <DrawerContent className="max-h-[92dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-5 space-y-6 overflow-y-auto no-scrollbar pb-10">
            <DrawerHeader className="p-0 text-left">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                   <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Layers size={20} /></div>
                   <button onClick={handleScan} className="h-10 px-3 bg-gray-100 text-gray-600 rounded-xl flex items-center gap-2 text-xs font-bold">
                      <Camera size={16} /> Scan
                   </button>
                </div>
                <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
              </div>
              <DrawerTitle className="text-xl font-bold">New Entry</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Challan No" value={formHeader.challan} onChange={(e) => setFormHeader({...formHeader, challan: e.target.value})} className="h-11 rounded-xl bg-gray-50" />
                  <Input type="date" value={formHeader.date} onChange={(e) => setFormHeader({...formHeader, date: e.target.value})} className="h-11 rounded-xl bg-gray-50" />
               </div>
               <Input placeholder="Lorry No" value={formHeader.lorryNo} onChange={(e) => setFormHeader({...formHeader, lorryNo: e.target.value})} className="h-11 rounded-xl bg-gray-50" />
               <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-2xl font-bold">Save Entry</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}