import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Layers, ArrowUpRight, Calculator, Landmark, X, Truck, Calendar, Weight, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";

export default function JobWork() {
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const zincReceivable = mockData.jobWorkEntries.reduce((acc, entry) => acc + entry.zinc, 0);

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Job Work Registry</h1>
        <p className="text-xs text-gray-500 mt-1">Zinc Consumption & Settlement Tracker</p>
      </header>

      {/* Real-time Zinc Summary from Ledger */}
      <div className="bg-amber-500 rounded-3xl p-5 text-white shadow-lg shadow-amber-200">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
             <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Zinc Receivable (Balance)</p>
             <h2 className="text-3xl font-black">{zincReceivable.toFixed(2)} KG</h2>
          </div>
          <Calculator size={24} className="opacity-40" />
        </div>
        <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase opacity-80">Total Incoming Material</span>
          <span className="text-lg font-black">67,150 KG</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Ledger Entries</h3>
        {mockData.jobWorkEntries.map((entry) => (
          <div 
            key={entry.id} 
            onClick={() => setSelectedEntry(entry)}
            className={cn(
              "bg-white p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer",
              entry.zinc < 0 ? "border-emerald-100 bg-emerald-50/30" : ""
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn("font-bold text-sm", entry.zinc < 0 ? "text-emerald-700" : "text-gray-900")}>
                    {entry.material}
                  </h4>
                  {entry.zinc < 0 && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Settlement</span>}
                </div>
                <p className="text-[10px] text-gray-400 font-mono">Challan: {entry.challan} • {entry.date}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-black", entry.zinc < 0 ? "text-emerald-600" : "text-amber-600")}>
                  {entry.zinc > 0 ? "+" : ""}{entry.zinc} KG
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Zinc Impact</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
               <div className="bg-white/50 p-1.5 rounded-lg text-center border border-gray-50">
                  <p className="text-[7px] text-gray-400 font-bold uppercase">Thick</p>
                  <p className="text-[10px] font-bold text-gray-700">{entry.thick !== "N/A" ? entry.thick + "mm" : "-"}</p>
               </div>
               <div className="bg-white/50 p-1.5 rounded-lg text-center border border-gray-100">
                  <p className="text-[7px] text-gray-400 font-bold uppercase">Weight</p>
                  <p className="text-[10px] font-bold text-gray-700">{entry.ourWt > 0 ? entry.ourWt : "-"}</p>
               </div>
               <div className="bg-white/50 p-1.5 rounded-lg text-center border border-gray-100">
                  <p className="text-[7px] text-gray-400 font-bold uppercase">Rate</p>
                  <p className="text-[10px] font-bold text-gray-700">{entry.rate || "-"}</p>
               </div>
               <div className="bg-white/50 p-1.5 rounded-lg text-center border border-gray-100">
                  <p className="text-[7px] text-gray-400 font-bold uppercase">Lorry</p>
                  <p className="text-[8px] font-bold text-gray-700 truncate px-0.5">{entry.lorryNo.split('-')[1] || entry.lorryNo}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DrawerContent className="max-h-[85dvh] bg-white rounded-t-[2.5rem]">
          {selectedEntry && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                    selectedEntry.zinc < 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  )}>
                    <Weight size={24} />
                  </div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <X size={16} />
                  </DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedEntry.material}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">
                  Logistics & Processing Details
                </DrawerDescription>
              </DrawerHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Truck size={12} />
                    <span className="text-[10px] font-bold uppercase">Lorry No.</span>
                  </div>
                  <p className="font-bold text-gray-900">{selectedEntry.lorryNo}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold uppercase">In-Date</span>
                  </div>
                  <p className="font-bold text-gray-900">{selectedEntry.date}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Weight Comparison</span>
                  <Percent size={14} className="text-gray-300" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Party Weight</span>
                    <span className="font-bold text-gray-900">{selectedEntry.partyWt} KG</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Our Weight</span>
                    <span className="font-bold text-gray-900">{selectedEntry.ourWt} KG</span>
                  </div>
                  <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-xs text-amber-600 font-bold uppercase">Consumption Rate</span>
                    <span className="text-lg font-black text-amber-600">{selectedEntry.rate}</span>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-2xl flex justify-between items-center shadow-inner",
                selectedEntry.zinc < 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}>
                <span className="text-[11px] font-bold uppercase tracking-widest">Total Zinc Transaction</span>
                <span className="text-xl font-black">{selectedEntry.zinc} KG</span>
              </div>

              <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all" onClick={() => setSelectedEntry(null)}>
                Close Ledger
              </button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}