/**
 * Sales.tsx — Sales invoice management
 * Clean architecture: useLocalFilter hook, InvoiceCard, shared formatters.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Search, X, Receipt, CheckCircle2, AlertTriangle, Clock, FileDown, Users, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { InvoiceCard } from "@/components/cards/InvoiceCard";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { downloadExcel } from "@/lib/excel-export";
import { useLocalFilter } from "@/hooks/useLocalFilter";
import { formatINR, formatDate } from "@/lib/formatters";
import { INVOICE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all",          label: "All"    },
  { id: "needs_review", label: "Review" },
  { id: "pending",      label: "Sent"   },
  { id: "processed",    label: "Paid"   },
];

export default function Sales() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer]   = useState(false);
  const [viewMode, setViewMode]               = useState<"invoices" | "customers">("invoices");
  const qc = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales-invoices"],
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/sales-invoices", d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => apiRequest("PATCH", `/api/sales-invoices/${id}`, d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] }),
  });

  const { search, setSearch, activeTab, setActiveTab, filtered } = useLocalFilter({
    items: invoices,
    searchFields: ["customerName", "invoiceNo", "customerGstin"],
    tabKey: "status",
    defaultTab: "all",
  });

  /* ── Customer grouping for customer view ── */
  const customerMap = invoices.reduce((acc: Record<string, any>, inv: any) => {
    const name = inv.customerName || "Unknown";
    if (!acc[name]) acc[name] = { name, invoices: [], total: 0 };
    acc[name].invoices.push(inv);
    acc[name].total += parseFloat(inv.invoiceTotal || "0");
    return acc;
  }, {});
  const customers = Object.values(customerMap).sort((a: any, b: any) => b.total - a.total);

  const handleExtract = async (data: any) => {
    const payload = {
      invoiceNo:    data.invoice_no || `IES-${Date.now()}`,
      invoiceDate:  data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      customerName: data.bill_to?.company_name,
      customerGstin:data.bill_to?.gstin,
      invoiceTotal: String(data.totals?.invoice_total ?? ""),
      taxableAmount:String(data.totals?.sub_total_taxable ?? ""),
      totalGst:     String(data.totals?.total_gst ?? ""),
      cgstAmount:   String(data.totals?.total_cgst ?? ""),
      sgstAmount:   String(data.totals?.total_sgst ?? ""),
      igstAmount:   String(data.totals?.total_igst ?? ""),
      irnNumber:    data.irn_number,
      status:       INVOICE_STATUSES.NEEDS_REVIEW,
      rawData:      data,
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Sales invoice saved ✓");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  return (
    <div className="space-y-4 py-4 pb-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">Commerce</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight">Sales</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setViewMode(v => v === "invoices" ? "customers" : "invoices")}
            className="icon-btn"
            title={viewMode === "invoices" ? "View by customer" : "View invoices"}
          >
            {viewMode === "invoices" ? <Users size={18} /> : <LayoutGrid size={18} />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => downloadExcel(invoices, "Sales_Invoices", "Sales").then(() => toast.success("Exported"))}
            className="icon-btn"
          >
            <FileDown size={18} />
          </motion.button>
          <ProfileMenu />
        </div>
      </header>

      {/* Search + Scan row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
          <input
            className="search-input"
            placeholder="Search customer, invoice #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowScanDrawer(true)}
          className="icon-btn icon-btn-primary"
        >
          <Camera size={18} />
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("tab-item", activeTab === t.id && "active")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        )}

        {/* Invoice view */}
        {!isLoading && viewMode === "invoices" && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-48 gap-3 text-blue-mid/30">
                <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
                  <Receipt size={28} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
              </motion.div>
            ) : filtered.map((inv: any) => (
              <InvoiceCard
                key={inv.id}
                name={inv.customerName}
                invoiceNo={inv.invoiceNo}
                date={inv.invoiceDate}
                total={inv.invoiceTotal}
                status={inv.status}
                hasEInvoice={inv.isEInvoice}
                onClick={() => setSelectedInvoice(inv)}
              />
            ))}
          </div>
        )}

        {/* Customer view */}
        {!isLoading && viewMode === "customers" && (
          <div className="space-y-3">
            {customers.map((cust: any) => (
              <motion.div
                key={cust.name}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-deep flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {cust.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-blue-ink text-sm truncate">{cust.name}</h3>
                  <p className="text-[10px] text-blue-mid/60 font-medium mt-0.5">
                    {cust.invoices.length} invoice{cust.invoices.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="fin-num text-base text-blue-ink">{formatINR(cust.total)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={o => !o && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[92dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem]">
          {selectedInvoice && (
            <div className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-10">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10">
                    <Receipt size={22} />
                  </div>
                  <DrawerClose className="icon-btn"><X size={18} /></DrawerClose>
                </div>
                <DrawerTitle className="text-2xl font-black text-blue-ink">
                  {selectedInvoice.customerName || "Unknown Customer"}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-blue-mid mt-0.5">
                  {selectedInvoice.invoiceNo} · {formatDate(selectedInvoice.invoiceDate)}
                </DrawerDescription>
              </DrawerHeader>

              <div className="card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-blue-light pb-4">
                  <span className="section-label">Receivable</span>
                  <span className="fin-num text-3xl text-blue-ink">{formatINR(selectedInvoice.invoiceTotal)}</span>
                </div>
                {[
                  { label: "Taxable Amount", value: formatINR(selectedInvoice.taxableAmount) },
                  { label: "Total GST",      value: formatINR(selectedInvoice.totalGst), accent: true },
                  { label: "CGST",           value: formatINR(selectedInvoice.cgstAmount) },
                  { label: "SGST",           value: formatINR(selectedInvoice.sgstAmount) },
                  { label: "IGST",           value: formatINR(selectedInvoice.igstAmount) },
                ].filter(r => r.value !== formatINR(0)).map(({ label, value, accent }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-blue-mid font-medium">{label}</span>
                    <span className={cn("font-bold text-blue-ink", accent && "text-green-600")}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="pb-safe">
                <button
                  onClick={() => { updateMutation.mutate({ id: selectedInvoice.id, status: "processed" }); toast.success("Marked as paid"); setSelectedInvoice(null); }}
                  className="btn-primary"
                >
                  Mark as Received
                </button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Scanner */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[92dvh] bg-white border-blue-mid/10 rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor docTypeHint="TAX_INVOICE" onExtract={handleExtract} onCancel={() => setShowScanDrawer(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
