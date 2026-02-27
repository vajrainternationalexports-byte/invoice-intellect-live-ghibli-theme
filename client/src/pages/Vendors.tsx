import { mockData } from "@/lib/mock-data";
import { ShieldAlert, ShieldCheck, Mail, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Vendors() {
  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-500 mt-1">Intelligence & Deduplication</p>
      </header>

      {/* Intelligence Alert */}
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3">
        <div className="h-10 w-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm">
          <AlertTriangle size={20} className="text-rose-500" />
        </div>
        <div>
          <h4 className="font-bold text-rose-900 text-sm mb-1">Duplicate Detected</h4>
          <p className="text-xs text-rose-700 leading-relaxed">
            We noticed <strong>Acme Corporation</strong> shares bank details with <strong>Acme Corp Ltd.</strong> Review recommended before next payment run.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {mockData.vendors.map((vendor) => (
          <div key={vendor.id} className={cn(
            "bg-white p-4 rounded-2xl shadow-sm border",
            vendor.duplicateWarning ? "border-rose-200" : "border-gray-100"
          )}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  {vendor.name}
                  {vendor.duplicateWarning && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      Review
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-1">{vendor.id}</p>
              </div>
              
              <div className="flex items-center gap-1.5">
                {vendor.riskScore === 'Low' ? (
                  <ShieldCheck size={16} className="text-emerald-500" />
                ) : (
                  <ShieldAlert size={16} className="text-rose-500" />
                )}
                <span className={cn(
                  "text-xs font-semibold",
                  vendor.riskScore === 'Low' ? "text-emerald-600" : "text-rose-600"
                )}>{vendor.riskScore} Risk</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Total Spent YTD</p>
                <p className="font-bold text-gray-900">${vendor.totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Primary Contact</p>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700 truncate">
                  <Mail size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{vendor.contact}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}