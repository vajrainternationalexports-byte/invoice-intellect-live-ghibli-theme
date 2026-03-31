import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, FileUp, Search, CheckCircle2, AlertTriangle, Clock, Check, CreditCard, Calendar as CalendarIcon, X, Receipt, Fingerprint, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { downloadExcel } from "@/lib/excel-export";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchase-invoices"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/purchase-invoices", data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/purchase-invoices/${id}`, data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/purchase-invoices"] }),
  });

  const getStatusIcon = (status: string, size = 14) => {
    switch (status) {
      case "processed": return <CheckCircle2 size={size} className="text-emerald-500" />;
      case "needs_review": return <AlertTriangle size={size} className="text-amber-500" />;
      default: return <Clock size={size} className="text-blue-500" />;
    }
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({ id, status: "pending" });
    toast.success("Invoice approved");
  };

  const handlePay = (id: string) => {
    updateMutation.mutate({ id, status: "processed" });
    toast.success("Payment initiated");
  };

  const handleSchedulePayment = (id: string, date: Date) => {
    updateMutation.mutate({ id, status: "processed" });
    toast.success(`Scheduled for ${format(date, "dd/MM/yyyy")}`);
  };

  const handleDownloadExcel = () => {
    downloadExcel(invoices, "Purchase_Invoices", "Invoices");
    toast.success("Purchase Invoices exported to Excel");
  };

  const handleExtract = async (data: any) => {
    const payload = {
      invoiceNo: data.invoice_no || `INV-${Date.now()}`,
      invoiceDate: data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      financialYear: data.financial_year,
      vendorName: data.seller?.name || data.bill_to?.company_name,
      vendorGstin: data.seller?.gstin,
      taxableAmount: String(data.totals?.sub_total_taxable ?? ""),
      totalGst: String(data.totals?.total_gst ?? ""),
      invoiceTotal: String(data.totals?.invoice_total ?? ""),
      cgstAmount: String(data.totals?.total_cgst ?? ""),
      sgstAmount: String(data.totals?.total_sgst ?? ""),
      igstAmount: String(data.totals?.total_igst ?? ""),
      supplyType: data.supply_type,
      irnNumber: data.irn_number,
      isEInvoice: !!data.irn_number,
      status: "needs_review",
      lineItems: data.line_items || [],
      rawData: data,
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Purchase invoice saved");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    }
  };

  const filtered = invoices.filter((inv: any) => {
    const matchesTab = activeTab === "all" || inv.status === activeTab;
    const matchesSearch = !search || [inv.vendorName, inv.invoiceNo, inv.vendorGstin].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Purchase Invoices</h1>
          <button onClick={handleDownloadExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 active:scale-95 transition-all">
            <FileDown size={14} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Excel</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setShowScanDrawer(true)} className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <Camera size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-700">Scan Invoice</span>
          </button>
          <button onClick={() => setShowScanDrawer(true)} className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <FileUp size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-700">Upload PDF</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input
            placeholder="Search vendor, invoice no..."
            className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          {["all", "pending", "needs_review"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all", activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4 no-scrollbar">
        {isLoading && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading invoices...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
            <Receipt size={32} className="opacity-30" />
            <p className="text-sm font-medium">No invoices yet — scan one to start</p>
          </div>
        )}
        {filtered.map((inv: any) => (
          <div key={inv.id} onClick={() => setSelectedInvoice(inv)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{inv.vendorName || "Unknown Vendor"}</h3>
                  {inv.irnNumber && <Fingerprint size={12} className="text-emerald-500" />}
                </div>
                <p className="text-[10px] text-gray-500 font-medium">{inv.invoiceNo} • {inv.invoiceDate}</p>
                {inv.vendorGstin && (
                  <span className="text-[9px] text-primary/70 bg-primary/5 px-1 rounded uppercase font-bold tracking-tight">GSTIN: {inv.vendorGstin}</span>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 text-sm">₹{parseFloat(inv.invoiceTotal || "0").toLocaleString("en-IN")}</p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  {getStatusIcon(inv.status, 12)}
                  <span className="text-[9px] uppercase tracking-tight font-bold text-gray-400">{inv.status.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            {inv.status !== "processed" && (
              <div className="mt-2 pt-2 border-t border-gray-50 flex gap-2" onClick={e => e.stopPropagation()}>
                {inv.status === "needs_review" && (
                  <button onClick={() => handleApprove(inv.id)} className="flex-1 bg-emerald-500 text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                    <Check size={12} /> Approve
                  </button>
                )}
                {inv.status === "pending" && (
                  <>
                    <button onClick={() => handlePay(inv.id)} className="flex-1 bg-primary text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                      <CreditCard size={12} /> Pay
                    </button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                          <CalendarIcon size={12} /> Schedule
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-0" align="end">
                        <Calendar mode="single" selected={selectedDate} onSelect={date => date && handleSchedulePayment(inv.id, date)} className="rounded-xl" />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={open => !open && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 rounded-t-[2rem]">
          {selectedInvoice && (
            <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Receipt size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedInvoice.vendorName || "Unknown Vendor"}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">
                  {selectedInvoice.invoiceNo} • {selectedInvoice.invoiceDate}
                  {selectedInvoice.vendorGstin && ` • ${selectedInvoice.vendorGstin}`}
                </DrawerDescription>
              </DrawerHeader>

              {selectedInvoice.irnNumber && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Fingerprint size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">IRN Validated</span>
                  </div>
                  <p className="text-[10px] font-mono text-emerald-600 break-all">{selectedInvoice.irnNumber}</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedInvoice.status, 14)}
                    <span className="text-xs font-bold capitalize">{selectedInvoice.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Taxable</span>
                  <span className="text-sm font-bold text-gray-900">₹{parseFloat(selectedInvoice.taxableAmount || "0").toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">GST</span>
                  <span className="text-sm font-bold text-gray-900">₹{parseFloat(selectedInvoice.totalGst || "0").toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total</span>
                  <span className="text-lg font-bold text-gray-900">₹{parseFloat(selectedInvoice.invoiceTotal || "0").toLocaleString("en-IN")}</span>
                </div>
              </div>

              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Line Items</h4>
                  {selectedInvoice.lineItems.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-50 space-y-1">
                      <p className="text-xs font-bold text-gray-800">{item.description}</p>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{item.quantity} {item.unit} × ₹{item.price_per_unit}</span>
                        <span className="font-bold text-gray-700">₹{(item.total_amount || item.taxable_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pb-safe">
                <button className="w-full bg-primary text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg shadow-primary/20" onClick={() => setSelectedInvoice(null)}>Close</button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Scanner Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[90dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor
              docTypeHint="PURCHASE_ORDER"
              onExtract={handleExtract}
              onCancel={() => setShowScanDrawer(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
