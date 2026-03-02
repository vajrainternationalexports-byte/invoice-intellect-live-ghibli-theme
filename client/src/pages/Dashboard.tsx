import { Card, CardContent } from "@/components/ui/card";
import { mockData } from "@/lib/mock-data";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertCircle, 
  Layers, 
  ShoppingBag, 
  TrendingUp,
  ChevronRight 
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const stats = mockData.stats;

  const mainModules = [
    { id: 'purchase', name: 'Purchase', href: '/invoices', icon: ShoppingBag, color: 'bg-blue-500' },
    { id: 'sales', name: 'Sales', href: '/sales', icon: ArrowUpRight, color: 'bg-emerald-500' },
    { id: 'jobwork', name: 'Job Work', href: '/jobwork', icon: Layers, color: 'bg-amber-500' },
    { id: 'po', name: 'Purchase Order', href: '/po', icon: Receipt, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Control Center</h1>
          <p className="text-sm text-gray-500">Business Overview</p>
        </div>
        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-primary font-semibold">SA</span>
        </div>
      </header>

      {/* Financial Summary Area */}
      <div className="grid grid-cols-2 gap-3">
        {/* Payable Summary */}
        <Link href="/invoices">
          <div className="bg-blue-600 rounded-3xl p-4 text-white shadow-lg active:scale-95 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Payable</span>
              <ShoppingBag size={14} className="opacity-60" />
            </div>
            <h2 className="text-xl font-bold mb-3">₹{stats.totalPending.toLocaleString('en-IN')}</h2>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="opacity-70">Upcoming</span>
                <span className="font-bold">{stats.upcomingPayments}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="opacity-70">Discrepancies</span>
                <span className="font-bold text-amber-300">{stats.discrepancies}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Receivable Summary */}
        <Link href="/sales">
          <div className="bg-emerald-600 rounded-3xl p-4 text-white shadow-lg active:scale-95 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Receivable</span>
              <ArrowUpRight size={14} className="opacity-60" />
            </div>
            <h2 className="text-xl font-bold mb-3">₹{stats.totalReceivable.toLocaleString('en-IN')}</h2>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="opacity-70">15 Days</span>
                <span className="font-bold">₹{stats.receivable15Days.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="opacity-70">45 Days</span>
                <span className="font-bold">₹{stats.receivable45Days.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Job Work & Exposure */}
      <Link href="/jobwork">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <Layers size={18} />
              </div>
              <span className="font-bold text-gray-900">Job Work Exposure</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Labour Payable</p>
              <p className="text-lg font-bold text-gray-900">₹{stats.labourChargesPayable.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Zinc Pending</p>
              <p className="text-lg font-bold text-amber-600">{stats.zincPendingQty} MT</p>
              <p className="text-[9px] text-gray-400 font-medium mt-0.5">Value: ₹{(stats.zincPendingValue/100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-2 gap-4">
        {mainModules.map((module) => (
          <Link key={module.id} href={module.href}>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3 active:scale-95 transition-all cursor-pointer">
              <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-md", module.color)}>
                <module.icon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{module.name}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Manage workflow</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Minimal icon component to fix build
function Receipt({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17.5V6.5"/>
    </svg>
  );
}