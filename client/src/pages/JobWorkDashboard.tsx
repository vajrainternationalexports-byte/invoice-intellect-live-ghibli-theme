import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Link } from "wouter";
import { ArrowLeft, FileDown, Activity, ChevronRight, Scale, TrendingDown, Layers } from "lucide-react";
import { downloadExcel } from "@/lib/excel-export";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function JobWorkDashboard() {
  const chartData = [
    { month: "Apr", balance: -450 },
    { month: "May", balance: -320 },
    { month: "Jun", balance: 120 },
    { month: "Jul", balance: 540 },
    { month: "Aug", balance: 210 },
    { month: "Sep", balance: -150 },
    { month: "Oct", balance: -890 }
  ];

  const handleDownloadExcel = () => {
    downloadExcel(chartData, "Zinc_Ledger_Dashboard", "Ledger");
    toast.success("Zinc Ledger exported to Excel");
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/jobwork">
            <button className="h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-all">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Zinc Ledger</h1>
            <p className="text-xs text-slate-500">Running Account</p>
          </div>
        </div>
        <button onClick={handleDownloadExcel} className="h-9 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-all text-xs font-bold uppercase tracking-wider">
          <FileDown size={16} /> Excel
        </button>
      </header>

      <div className="bg-[#0F172A] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Net Balance</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black text-emerald-400">-890.50</h2>
            <span className="text-sm font-bold text-slate-300">KG</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <Activity size={14} /> Galvanizer owes IES
          </p>
        </div>
        
        <div className="h-24 mt-4 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Ledger Statements</h3>
        
        {[
          { id: "Sheet #8", period: "Oct 2025", processed: 45200, consumed: 3840, received: 4500, bal: -660 },
          { id: "Sheet #7", period: "Sep 2025", processed: 38100, consumed: 3100, received: 2500, bal: 600 },
          { id: "Sheet #6", period: "Aug 2025", processed: 52400, consumed: 4800, received: 5000, bal: -200 }
        ].map((sheet, i) => (
          <div key={i} className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm active:scale-[0.98] transition-all cursor-pointer">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-50">
              <div>
                <h4 className="font-bold text-slate-900">{sheet.id}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{sheet.period}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Movement</span>
                <p className={`text-sm font-black ${sheet.bal < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {sheet.bal > 0 ? '+' : ''}{sheet.bal} KG
                </p>
              </div>
            </div>
            
            <div className="flex justify-between text-center gap-2">
              <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                <Scale size={14} className="mx-auto mb-1 text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Processed</p>
                <p className="text-xs font-black text-slate-700">{sheet.processed.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                <TrendingDown size={14} className="mx-auto mb-1 text-rose-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Consumed</p>
                <p className="text-xs font-black text-rose-600">{sheet.consumed.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                <Layers size={14} className="mx-auto mb-1 text-emerald-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Received</p>
                <p className="text-xs font-black text-emerald-600">{sheet.received.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
