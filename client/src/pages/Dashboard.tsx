import { Card, CardContent } from "@/components/ui/card";
import { mockData } from "@/lib/mock-data";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers, 
  ShoppingBag, 
  ChevronRight,
  Receipt,
  Bell
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const stats = mockData.stats;

  const mainModules = [
    { id: 'purchase', name: 'Purchase', href: '/invoices', icon: ShoppingBag, color: 'bg-blue-600' },
    { id: 'sales', name: 'Sales', href: '/sales', icon: ArrowUpRight, color: 'bg-emerald-600' },
    { id: 'jobwork', name: 'Job Work', href: '/jobwork', icon: Layers, color: 'bg-[#F59E0B]' },
    { id: 'po', name: 'Purchase Order', href: '/po', icon: Receipt, color: 'bg-purple-600' },
  ];

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-[#0F172A] -mx-4 -mt-4 p-4 rounded-b-3xl text-white shadow-lg">
        <div>
          <h1 className="text-xl font-bold tracking-tight">India Electricals Syndicate</h1>
          <p className="text-xs text-slate-300 font-mono mt-0.5">FY 25-26 • GSTIN: 19AAAFI6886Q1ZE</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} className="text-slate-300" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#F59E0B] rounded-full border-2 border-[#0F172A]"></span>
          </div>
          <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <span className="text-xs font-semibold text-[#F59E0B]">SA</span>
          </div>
        </div>
      </header>

      {/* Financial Summary Area */}
      <div className="grid grid-cols-2 gap-3">
        {/* Payable Summary */}
        <Link href="/invoices">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm active:scale-95 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payable</span>
              <div className="h-6 w-6 bg-rose-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={12} className="text-rose-500" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-3">₹{stats.totalPending.toLocaleString('en-IN')}</h2>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Upcoming</span>
                <span className="font-bold text-slate-700">{stats.upcomingPayments}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Discrepancies</span>
                <span className="font-bold text-rose-500">{stats.discrepancies}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Receivable Summary */}
        <Link href="/sales">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm active:scale-95 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Receivable</span>
              <div className="h-6 w-6 bg-emerald-50 rounded-full flex items-center justify-center">
                <ArrowUpRight size={12} className="text-emerald-500" />
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-3">₹{stats.totalReceivable.toLocaleString('en-IN')}</h2>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">15 Days</span>
                <span className="font-bold text-emerald-600">₹{stats.receivable15Days.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">45 Days</span>
                <span className="font-bold text-amber-500">₹{stats.receivable45Days.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Job Work & Exposure */}
      <Link href="/jobwork">
        <div className="bg-[#0F172A] rounded-3xl p-5 shadow-lg active:scale-[0.98] transition-all cursor-pointer text-white relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B] opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Layers size={18} className="text-[#F59E0B]" />
              </div>
              <span className="font-bold text-white tracking-wide text-sm">Job Work Exposure</span>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Labour Payable</p>
              <p className="text-lg font-black text-white">₹{stats.labourChargesPayable.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Zinc Pending</p>
              <p className="text-lg font-black text-[#F59E0B]">{stats.zincPendingQty} KG</p>
              <p className="text-[9px] text-slate-300 font-medium mt-0.5">Value: ₹{(stats.zincPendingValue/100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-2 gap-4">
        {mainModules.map((module) => (
          <Link key={module.id} href={module.href}>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 active:scale-95 transition-all cursor-pointer">
              <div className={cn("h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-md", module.color)}>
                <module.icon size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{module.name}</h3>
                <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">Manage</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
