import { mockData } from "@/lib/mock-data";
import { Link2, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Reconciliation() {
  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-1">3-Way matching and margins</p>
      </header>

      <div className="space-y-4">
        {mockData.reconciliation.map((rec, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{rec.vendor}</h3>
              {rec.matchStatus === 'matched' ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  <CheckCircle2 size={14} /> Matched
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                  <AlertTriangle size={14} /> Discrepancy
                </span>
              )}
            </div>

            <div className="flex justify-between items-center mb-6 relative">
              {/* Connector Line */}
              <div className="absolute left-10 right-10 top-5 h-[2px] bg-gray-100 z-0"></div>
              
              <div className="text-center relative z-10 bg-white px-2">
                <div className="text-xs text-gray-400 mb-1">Purchase Order</div>
                <div className="font-mono text-sm font-semibold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  {rec.poNumber}
                </div>
                <div className="text-sm font-bold mt-2">${rec.poAmount}</div>
              </div>

              <div className="relative z-10 bg-white p-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  rec.matchStatus === 'matched' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  <Link2 size={16} />
                </div>
              </div>

              <div className="text-center relative z-10 bg-white px-2">
                <div className="text-xs text-gray-400 mb-1">Invoice</div>
                <div className="font-mono text-sm font-semibold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  {rec.invoiceId}
                </div>
                <div className={cn(
                  "text-sm font-bold mt-2",
                  rec.matchStatus === 'discrepancy' ? "text-rose-600" : ""
                )}>${rec.invAmount}</div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Sales Order Linked</p>
                <p className="text-sm font-semibold text-blue-700">{rec.salesOrder}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Item Margin</p>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-end">
                  <TrendingUp size={14} /> {rec.margin}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}