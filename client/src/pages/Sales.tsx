import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Search, CheckCircle2, AlertTriangle, Clock, Receipt, X, FileDown, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { downloadExcel } from "@/lib/excel-export";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { format } from "date-fns";

export default function Sales() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"invoices" | "customers">("invoices");
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales-invoices"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/sales-invoices", data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales-invoices"] }),
  });

  const getStatusIcon = (status: string, size = 14) => {
    switch (status) {
      case "processed": return <CheckCircle2 size={size} className="text-emerald-500" />;
      case "needs_review": return <AlertTriangle size={size} className="text-amber-500" />;
      default: return <Clock size={size} className="text-blue-500" />;
    }
  };

  const handleDownloadExcel = async () => {
    await downloadExcel(invoices, "Sales_Invoices", "Sales");
    toast.success("Sales Invoices exported to Excel");
  };

  const handleExtract = async (data: any) => {
    const payload = {
      invoiceNo: data.invoice_no || `IES-${Date.now()}`,
      invoiceDate: data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      financialYear: data.financial_year,
      customerName: data.bill_to?.company_name,
      customerGstin: data.bill_to?.gstin,
      taxableAmount: String(data.totals?.sub_total_taxable ?? ""),
      totalGst: String(data.totals?.total_gst ?? ""),
      invoiceTotal: String(data.totals?.invoice_total ?? ""),
      cgstAmount: String(data.totals?.total_cgst ?? ""),
      sgstAmount: String(data.totals?.total_sgst ?? ""),
      igstAmount: String(data.totals?.total_igst ?? ""),
      supplyType: data.supply_type,
      irnNumber: data.irn_number,
      isEInvoice: !!data.irn_number,
      poReference: data.po_number,
      status: "needs_review",
      lineItems: data.line_items || [],
      rawData: data,
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Sales invoice saved");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    }
  };

  const filtered = invoices.filter((inv: any) => {
    const matchesTab = activeTab === "all" || inv.status === activeTab;
    const matchesSearch = !search || [inv.customerName, inv.invoiceNo].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Sales</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === "invoices" ? "customers" : "invoices")}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold uppercase tracking-wider"
            >
              {viewMode === "invoices" ? "Customers" : "Invoices"}
            </button>
            <button onClick={handleDownloadExcel} className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 active:scale-95 transition-all">
              <FileDown size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input
              placeholder={`Search ${viewMode}...`}
              className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {viewMode === "invoices" && (
            <button onClick={() => setShowScanDrawer(true)}
              className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
              <Camera size={16} />
              <span className="hidden sm:inline">Scan</span>
            </button>
          )}
        </div>

        {viewMode === "invoices" && (
          <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
            {["all", "pending", "needs_review"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all", activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4 no-scrollbar">
        {viewMode === "invoices" ? (
          <>
            {isLoading && <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                <Receipt size={32} className="opacity-30" />
                <p className="text-sm font-medium">No sales invoices yet — scan to add</p>
              </div>
            )}
            {filtered.map((inv: any) => (
              <div key={inv.id} onClick={() => setSelectedInvoice(inv)}
                className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{inv.customerName || "Unknown Customer"}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">{inv.invoiceNo} • {inv.invoiceDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 text-sm">₹{parseFloat(inv.invoiceTotal || "0").toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {getStatusIcon(inv.status, 12)}
                      <span className="text-[9px] uppercase font-bold text-gray-400">{inv.status.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <User size={32} className="opacity-30" />
            <p className="text-sm font-medium">Customer list coming from invoice data</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={open => !open && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 rounded-t-[2.5rem]">
          {selectedInvoice && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Receipt size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedInvoice.customerName || "Unknown Customer"}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">Invoice: {selectedInvoice.invoiceNo}</DrawerDescription>
              </DrawerHeader>

              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold uppercase">Receivable Amount</span>
                  <span className="text-lg text-gray-900 font-black">₹{parseFloat(selectedInvoice.invoiceTotal || "0").toLocaleString("en-IN")}</span>
                </div>
                {selectedInvoice.poReference && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">PO Ref</span>
                    <span className="font-bold">{selectedInvoice.poReference}</span>
                  </div>
                )}
                {selectedInvoice.customerGstin && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">Customer GSTIN</span>
                    <span className="font-mono font-bold">{selectedInvoice.customerGstin}</span>
                  </div>
                )}
              </div>

              <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all" onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Scanner Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[90dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor
              docTypeHint="TAX_INVOICE"
              onExtract={handleExtract}
              onCancel={() => setShowScanDrawer(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
