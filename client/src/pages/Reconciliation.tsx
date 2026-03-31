import { useQuery } from "@tanstack/react-query";
import { Link2, AlertTriangle, CheckCircle2, TrendingUp, FileDown, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadExcel } from "@/lib/excel-export";
import { toast } from "sonner";

export default function Reconciliation() {
  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/reconciliation"],
  });

  const handleDownloadExcel = async () => {
    await downloadExcel(records, "Reconciliation_Report", "Reconciliation");
    toast.success("Reconciliation exported to Excel");
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reconciliation</h1>
          <p className="text-sm text-gray-500 mt-1">3-Way matching & margins</p>
        </div>
        <button
          onClick={handleDownloadExcel}
          className="h-9 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-all text-xs font-bold uppercase tracking-wider"
        >
          <FileDown size={16} /> Excel
        </button>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading records...</div>
      )}

      {!isLoading && records.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-400">
          <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center">
            <GitMerge size={36} className="opacity-30" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-500 text-base">No Reconciliation Records</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">Records appear here once purchase invoices are matched with purchase orders and sales invoices.</p>
          </div>
        </div>
      )}

      <div className="space-y-4 overflow-y-auto no-scrollbar">
        {records.map((rec: any) => (
          <div key={rec.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{rec.vendorName || rec.vendor}</h3>
                {rec.reconciliationDate && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{rec.reconciliationDate}</p>
                )}
              </div>
              {rec.matchStatus === "matched" ? (
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
              <div className="absolute left-10 right-10 top-5 h-[2px] bg-gray-100 z-0"></div>

              <div className="text-center relative z-10 bg-white px-2">
                <div className="text-xs text-gray-400 mb-1">Purchase Order</div>
                <div className="font-mono text-xs font-semibold bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                  {rec.purchaseOrderId || "—"}
                </div>
                {rec.poAmount && (
                  <div className="text-sm font-bold mt-2">₹{parseFloat(rec.poAmount).toLocaleString("en-IN")}</div>
                )}
              </div>

              <div className="relative z-10 bg-white p-1">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  rec.matchStatus === "matched" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  <Link2 size={16} />
                </div>
              </div>

              <div className="text-center relative z-10 bg-white px-2">
                <div className="text-xs text-gray-400 mb-1">Invoice</div>
                <div className="font-mono text-xs font-semibold bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                  {rec.purchaseInvoiceId || "—"}
                </div>
                {rec.invoiceAmount && (
                  <div className={cn(
                    "text-sm font-bold mt-2",
                    rec.matchStatus === "discrepancy" ? "text-rose-600" : ""
                  )}>
                    ₹{parseFloat(rec.invoiceAmount).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Sales Invoice Linked</p>
                <p className="text-sm font-semibold text-blue-700">{rec.salesInvoiceId || "Not linked"}</p>
              </div>
              {rec.marginPercent && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Margin</p>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 justify-end">
                    <TrendingUp size={14} /> {parseFloat(rec.marginPercent).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {rec.discrepancyNote && (
              <div className="mt-3 bg-rose-50 rounded-xl p-3">
                <p className="text-xs text-rose-700 font-medium">{rec.discrepancyNote}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
