import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Layers, ArrowUpRight, TrendingUp, AlertTriangle, Info, Calculator, Landmark, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";

export default function JobWork() {
  const [selectedWork, setSelectedWork] = useState<any>(null);

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Job Work</h1>
        <p className="text-xs text-gray-500 mt-1">Material Exposure & Labour Tracking</p>
      </header>

      {/* Zinc Summary Card */}
      <div className="bg-amber-500 rounded-3xl p-5 text-white shadow-lg shadow-amber-200">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
             <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Zinc Exposure</p>
             <h2 className="text-3xl font-black">{mockData.stats.zincPendingQty} MT</h2>
          </div>
          <Calculator size={24} className="opacity-40" />
        </div>
        <div className="bg-black/10 backdrop-blur-md rounded-2xl p-3 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase opacity-80">Total Payable Value</span>
          <span className="text-lg font-black">₹{mockData.stats.labourChargesPayable.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Active Job Challans</h3>
        {mockData.jobWork.map((work, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedWork(work)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Vendor ID: {work.vendor}</h4>
                <p className="text-[10px] text-gray-400 font-mono">Challan: {work.challanNo} • {work.date}</p>
              </div>
              <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Processing</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
               <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Material</p>
                  <p className="text-[11px] font-bold text-gray-800">{work.material}</p>
               </div>
               <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Thickness</p>
                  <p className="text-[11px] font-bold text-gray-800">{work.thickness}</p>
               </div>
               <div className="bg-amber-50 p-2 rounded-xl text-center border border-amber-100">
                  <p className="text-[8px] text-amber-600 font-bold uppercase">KGs Issued</p>
                  <p className="text-[11px] font-bold text-amber-700">{work.kgsIssued}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={!!selectedWork} onOpenChange={(open) => !open && setSelectedWork(null)}>
        <DrawerContent className="max-h-[85dvh] bg-white rounded-t-[2.5rem]">
          {selectedWork && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600"><Landmark size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">Challan Details</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">Inventory Exposure Tracking</DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase">Formula Applied</span>
                    <span className="text-xs font-bold text-amber-600 bg-white px-2 py-1 rounded-lg shadow-sm border border-amber-100">{selectedWork.zincFormula}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase">Expected Zinc Cons.</span>
                    <span className="text-lg font-black text-gray-900">{selectedWork.expectedZinc} KGs</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 border border-gray-100 rounded-xl">
                    <p className="text-gray-400 font-bold uppercase text-[9px]">Material In-Flow</p>
                    <p className="font-bold text-gray-900 mt-1">Raw Coil (MS)</p>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl">
                    <p className="text-gray-400 font-bold uppercase text-[9px]">Processing State</p>
                    <p className="font-bold text-emerald-600 mt-1">Pickling Complete</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-amber-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-200" onClick={() => setSelectedWork(null)}>Close Tracker</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}