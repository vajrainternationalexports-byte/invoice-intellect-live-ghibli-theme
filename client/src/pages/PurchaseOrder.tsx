import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Receipt, Package, Truck, Clock, CheckCircle2, AlertCircle, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function PurchaseOrder() {
  const [activeTab, setActiveTab] = useState("open");

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Purchase Orders</h1>
          <button className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <Plus size={18} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input placeholder="Search PO numbers..." className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl" />
        </div>

        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          {['open', 'partial', 'closed'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all", activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4 no-scrollbar">
        {mockData.purchaseOrders.map((po) => (
          <div key={po.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
               <div>
                  <h4 className="font-bold text-gray-900 text-sm">{po.id}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{po.vendor} • {po.date}</p>
               </div>
               <span className={cn(
                 "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                 po.status.includes('Partial') ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
               )}>{po.status}</span>
            </div>

            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  <span>Fulfillment Progress</span>
                  <span>{Math.round((po.received/po.ordered)*100)}%</span>
               </div>
               <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${(po.received/po.ordered)*100}%` }}
                  ></div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Ordered</p>
                  <p className="text-[11px] font-black text-gray-900">{po.ordered} MT</p>
               </div>
               <div className="bg-emerald-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-emerald-600 font-bold uppercase">Received</p>
                  <p className="text-[11px] font-black text-emerald-700">{po.received} MT</p>
               </div>
               <div className="bg-rose-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-rose-600 font-bold uppercase">Pending</p>
                  <p className="text-[11px] font-black text-rose-700">{po.pending} MT</p>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}