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
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export default function JobWork() {
  const [entries, setEntries] = useState(mockData.jobWorkEntries);
  const [isEntryDrawerOpen, setIsEntryDrawerOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
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

  const addMaterialLine = () => {
    setFormItems([...formItems, { material: "", thick: "", pcs: "", partyWt: "", ourWt: "", rate: "", zinc: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formItems];
    newItems[index][field] = value;

    // Zinc Consumed Formula: Our Weight × Rate %
    if (field === "ourWt" || field === "rate" || field === "material") {
      const ourWt = parseFloat(newItems[index].ourWt) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      
      if (newItems[index].material === "Zinc Received") {
        // Zinc Received is treated as negative consumption
        newItems[index].zinc = -Math.abs(parseFloat(value) || 0);
      } else {
        newItems[index].zinc = (ourWt * rate) / 100;
      }
    }
    setFormItems(newItems);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

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
    setFormItems([{ material: "", thick: "", pcs: "", partyWt: "", ourWt: "", rate: "", zinc: 0 }]);
    setFormHeader({ challan: "", date: format(new Date(), "yyyy-MM-dd"), lorryNo: "", vendor: mockData.vendors[0].name });
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Job Work</h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Incoming Tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEntryDrawerOpen(true)} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Dashboard Summary Widget */}
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

      <div className="bg-gray-900 rounded-3xl p-5 text-white shadow-xl shadow-gray-200">
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

      {/* List View */}
      <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Challans</h3>
          <Filter size={14} className="text-gray-400" />
        </div>
        {entries.map((entry) => {
          const entryWt = entry.items.reduce((sum: number, i: any) => sum + (parseFloat(i.ourWt) || 0), 0);
          const entryZinc = entry.items.reduce((sum: number, i: any) => sum + (parseFloat(i.zinc) || 0), 0);
          return (
            <div key={entry.id} onClick={() => setSelectedEntry(entry)} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase tracking-wider">{entry.challan}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{entry.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-1">{entry.lorryNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">₹{entryZinc.toFixed(1)} KG</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Impact</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Summary Bar */}
      <div className="fixed bottom-20 left-4 right-4 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-3 flex justify-between items-center shadow-lg z-30">
        <div className="text-center">
          <p className="text-[8px] text-gray-400 font-bold uppercase">Total Wt</p>
          <p className="text-xs font-black text-gray-900">{totals.ourWt} KG</p>
        </div>
        <div className="h-6 w-px bg-gray-100"></div>
        <div className="text-center">
          <p className="text-[8px] text-gray-400 font-bold uppercase">Consumed</p>
          <p className="text-xs font-black text-rose-600">{totals.consumed.toFixed(1)}</p>
        </div>
        <div className="h-6 w-px bg-gray-100"></div>
        <div className="text-center">
          <p className="text-[8px] text-gray-400 font-bold uppercase">Received</p>
          <p className="text-xs font-black text-emerald-600">{totals.received.toFixed(1)}</p>
        </div>
      </div>

      {/* Data Entry Drawer */}
      <Drawer open={isEntryDrawerOpen} onOpenChange={setIsEntryDrawerOpen}>
        <DrawerContent className="max-h-[92dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-5 space-y-6 overflow-y-auto no-scrollbar pb-10">
            <DrawerHeader className="p-0 text-left">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                   <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Layers size={20} /></div>
                   <button onClick={handleScan} className="h-10 px-3 bg-gray-100 text-gray-600 rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95">
                      <Camera size={16} /> Scan Challan
                   </button>
                </div>
                <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
              </div>
              <DrawerTitle className="text-xl font-bold">New Job Work Entry</DrawerTitle>
            </DrawerHeader>

            <div className="space-y-4">
               {/* Header Fields */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">JW / Challan No</Label>
                    <Input value={formHeader.challan} onChange={(e) => setFormHeader({...formHeader, challan: e.target.value})} className="h-11 rounded-xl bg-gray-50 font-mono text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date</Label>
                    <Input type="date" value={formHeader.date} onChange={(e) => setFormHeader({...formHeader, date: e.target.value})} className="h-11 rounded-xl bg-gray-50 text-sm" />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lorry No</Label>
                  <Input value={formHeader.lorryNo} onChange={(e) => setFormHeader({...formHeader, lorryNo: e.target.value})} className="h-11 rounded-xl bg-gray-50 text-sm" placeholder="e.g. WB11C-0000" />
               </div>

               {/* Line Items */}
               <div className="space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Material Lines</h4>
                    <button onClick={addMaterialLine} className="text-[10px] font-black text-primary flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg">
                      <Plus size={12} /> Add Line
                    </button>
                  </div>
                  
                  {formItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl space-y-4 relative border border-gray-100">
                      {idx > 0 && (
                        <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-rose-400 h-7 w-7 flex items-center justify-center bg-white rounded-full shadow-sm">
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Material</Label>
                            <Input list="materials" value={item.material} onChange={(e) => updateItem(idx, 'material', e.target.value)} className="h-10 rounded-xl bg-white text-xs" />
                            <datalist id="materials">
                               <option value="MS Ladder" />
                               <option value="Flat 50x6" />
                               <option value="Flat 25x3" />
                               <option value="Zinc Received" />
                            </datalist>
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Thick (mm)</Label>
                            <Input value={item.thick} onChange={(e) => updateItem(idx, 'thick', e.target.value)} className="h-10 rounded-xl bg-white text-xs" />
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                         <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Our Wt</Label>
                            <Input type="number" value={item.ourWt} onChange={(e) => updateItem(idx, 'ourWt', e.target.value)} className="h-10 rounded-xl bg-white text-xs" />
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-gray-400 uppercase">Rate %</Label>
                            <Input type="number" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} className="h-10 rounded-xl bg-white text-xs" />
                         </div>
                         <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold text-gray-400 uppercase text-primary">Zinc (KG)</Label>
                            <div className="h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-black text-primary text-xs">
                               {item.zinc.toFixed(2)}
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="pt-6">
               <button onClick={handleSave} className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                  <Save size={20} /> Save Entry
               </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DrawerContent className="max-h-[85dvh] bg-white rounded-t-[2.5rem]">
          {selectedEntry && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
               <DrawerHeader className="p-0 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded uppercase tracking-widest">{selectedEntry.challan}</span>
                    <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                  </div>
                  <DrawerTitle className="text-xl font-bold">{selectedEntry.lorryNo}</DrawerTitle>
                  <DrawerDescription className="text-sm font-medium">{selectedEntry.vendor} • {selectedEntry.date}</DrawerDescription>
               </DrawerHeader>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Material Breakdown</h4>
                  <div className="bg-gray-50 rounded-3xl overflow-hidden divide-y divide-gray-100">
                     {selectedEntry.items.map((item: any, i: number) => (
                       <div key={i} className="p-4 flex justify-between items-center">
                          <div>
                             <p className="text-xs font-black text-gray-900">{item.material}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{item.thick}mm • {item.ourWt}KG @ {item.rate}%</p>
                          </div>
                          <p className={cn("font-black text-sm", item.zinc < 0 ? "text-emerald-600" : "text-gray-900")}>
                             {item.zinc.toFixed(1)} KG
                          </p>
                       </div>
                     ))}
                  </div>
               </div>

               <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold" onClick={() => setSelectedEntry(null)}>Close</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}