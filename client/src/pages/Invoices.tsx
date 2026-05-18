import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, FileUp, Search, FileDown, X, Receipt, Filter, 
  AlertTriangle, CheckCircle2, Clock, Calendar, ShieldCheck, 
  Building, User, Percent, HelpCircle, ArrowRight, Play, Eye, EyeOff,
  Pin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { downloadExcel } from "@/lib/excel-export";
import { formatINR, formatDate } from "@/lib/formatters";
import { INVOICE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All Purchases" },
  { id: "needs_review", label: "Verification Required" },
  { id: "pending", label: "Approved (Pending Pay)" },
  { id: "processed", label: "Paid" },
];

export default function Purchases() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  // System Process Flags (Toggles)
  const [grnSystemEnabled, setGrnSystemEnabled] = useState(false);
  const [makerCheckerEnabled, setMakerCheckerEnabled] = useState(false);

  // KPI Metric Mode States
  const [totalPurchasesMode, setTotalPurchasesMode] = useState<"yearly" | "monthly">("yearly");
  const [outstandingMode, setOutstandingMode] = useState<"yearly" | "monthly">("yearly");

  // Stacked Filter State
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterGrn, setFilterGrn] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterOcr, setFilterOcr] = useState("all");
  const [filterTds, setFilterTds] = useState("all");

  // Extended Advanced Filters
  const [filterSeller, setFilterSeller] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [filterItem, setFilterItem] = useState("");

  // Pinned Filters (Users select exactly 4 filters to be permanently shown on dashboard)
  const [pinnedFilters, setPinnedFilters] = useState<string[]>(["location", "tds", "seller", "status"]);

  // Manual Inputs inside Detail Drawer
  const [localPaymentTerms, setLocalPaymentTerms] = useState("");
  const [localVehicleNumber, setLocalVehicleNumber] = useState("");
  const [localEWayBill, setLocalEWayBill] = useState("");

  // Maker-Checker & Payout states
  const [selectedGrnStatus, setSelectedGrnStatus] = useState("");
  const [disputeReasonText, setDisputeReasonText] = useState("");
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  const qc = useQueryClient();

  // Queries
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchase-invoices"],
  });

  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: [selectedInvoice?.vendorId ? `/api/vendors/${selectedInvoice.vendorId}/bank-accounts` : "/api/vendors/none/bank-accounts"],
    enabled: !!selectedInvoice?.vendorId,
  });

  const { data: approvalLogs = [] } = useQuery<any[]>({
    queryKey: [selectedInvoice?.id ? `/api/approval-logs?docType=purchase_invoice&docId=${selectedInvoice.id}` : "/api/approval-logs?docType=none&docId=none"],
    enabled: !!selectedInvoice?.id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/purchase-invoices", d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => apiRequest("PATCH", `/api/purchase-invoices/${id}`, { ...d, updatedBy: "Checker User" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      if (selectedInvoice) {
        qc.invalidateQueries({ queryKey: [`/api/approval-logs?docType=purchase_invoice&docId=${selectedInvoice.id}`] });
      }
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/payments", { ...d, actor: "Checker User" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      toast.success("Payment Executed via ICICI CIB Corporate Gateway!");
    }
  });

  const handleExtract = async (data: any) => {
    const confidence = data.confidence_score ?? Math.floor(Math.random() * 20) + 80;
    const payload = {
      invoiceNo: data.invoice_no || `INV-${Date.now()}`,
      invoiceDate: data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      financialYear: data.financial_year || "2026-2027",
      vendorId: "v1",
      vendorName: data.seller?.name || data.bill_to?.company_name || "Acme India Pvt Ltd",
      vendorGstin: data.seller?.gstin || "19AAAFI6886Q1ZE",
      taxableAmount: String(data.totals?.sub_total_taxable ?? "0"),
      totalGst: String(data.totals?.total_gst ?? "0"),
      invoiceTotal: String(data.totals?.invoice_total ?? "0"),
      cgstAmount: String(data.totals?.total_cgst ?? "0"),
      sgstAmount: String(data.totals?.total_sgst ?? "0"),
      igstAmount: String(data.totals?.total_igst ?? "0"),
      supplyType: data.supply_type || "Intrastate",
      irnNumber: data.irn_number || null,
      isEInvoice: !!data.irn_number,
      status: confidence < 90 ? INVOICE_STATUSES.NEEDS_REVIEW : "pending",
      lineItems: data.line_items || [
        { item: "Hot Dip Galvanised Cables Trays", qty: 100, unit: "Pcs", hsn: "7308", rate: "381.35", discount: 0, taxableValue: 38135.59, cgstRate: 9, cgstAmount: 3432.20, sgstRate: 9, sgstAmount: 3432.21, total: 45000.00, batchNo: "B-2026", serialNo: "SN-9824", weight: 800, warehouse: "Howrah Works W2", project: "Project Ezra", costCenter: "IES-PROD" }
      ],
      ocrConfidence: confidence,
      grnStatus: "pending_receipt",
      branchLocation: "Kolkata Works W1",
      uploadedBy: "Admin User",
      rawData: data
    };

    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Invoice uploaded to Stage 1. Processing auto validations.");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  // Stacked Advanced Filters Logic
  const filtered = invoices.filter((inv: any) => {
    // 1. Text Search
    const query = search.toLowerCase().trim();
    if (query) {
      const matchSearch = 
        (inv.invoiceNo || "").toLowerCase().includes(query) ||
        (inv.vendorName || "").toLowerCase().includes(query) ||
        (inv.vendorGstin || "").toLowerCase().includes(query) ||
        (inv.branchLocation || "").toLowerCase().includes(query);
      if (!matchSearch) return false;
    }

    // 2. Tabs
    if (makerCheckerEnabled) {
      if (activeTab === "needs_review" && inv.status !== "needs_review") return false;
      if (activeTab === "pending" && inv.status !== "pending") return false;
      if (activeTab === "processed" && inv.status !== "processed") return false;
    } else {
      if (activeTab === "processed" && inv.status !== "processed") return false;
    }

    // 3. GRN Status (Only if GRN Matching system is enabled)
    if (grnSystemEnabled && filterGrn !== "all" && inv.grnStatus !== filterGrn) return false;

    // 4. Branch
    if (filterBranch !== "all" && inv.branchLocation !== filterBranch) return false;

    // 5. OCR Confidence
    if (filterOcr === "low" && (inv.ocrConfidence ?? 100) >= 90) return false;
    if (filterOcr === "high" && (inv.ocrConfidence ?? 100) < 90) return false;

    // 6. TDS Deducted
    if (filterTds === "deducted" && parseFloat(inv.tdsDeducted || "0") === 0) return false;
    if (filterTds === "none" && parseFloat(inv.tdsDeducted || "0") > 0) return false;

    // 7. Seller's Name
    if (filterSeller !== "all" && inv.vendorName !== filterSeller) return false;

    // 8. Month Filter
    if (filterMonth !== "all") {
      const month = inv.invoiceDate ? inv.invoiceDate.split("-")[1] : "";
      if (month !== filterMonth) return false;
    }

    // 9. Year Filter
    if (filterYear !== "all") {
      const year = inv.invoiceDate ? inv.invoiceDate.split("-")[0] : "";
      if (year !== filterYear) return false;
    }

    // 10. Paid or Not Paid
    if (filterPaid === "paid" && inv.status !== "processed") return false;
    if (filterPaid === "unpaid" && inv.status === "processed") return false;

    // 11. Item-Wise Recognition Filter
    if (filterItem.trim()) {
      const itemQuery = filterItem.toLowerCase().trim();
      const matchesItem = inv.lineItems?.some((li: any) => 
        (li.item || "").toLowerCase().includes(itemQuery)
      );
      if (!matchesItem) return false;
    }

    return true;
  });

  // Unique vendor list for dropdown
  const uniqueSellers = Array.from(new Set(invoices.map((inv: any) => inv.vendorName).filter(Boolean)));

  // KPI calculations
  const totalPurchasesYearly = invoices.reduce((sum, inv) => sum + parseFloat(inv.invoiceTotal || "0"), 0);
  const totalPurchasesMonthly = invoices
    .filter(inv => (inv.invoiceDate || "").startsWith("2026-05"))
    .reduce((sum, inv) => sum + parseFloat(inv.invoiceTotal || "0"), 0);

  const outstandingYearly = invoices
    .filter(inv => inv.status !== "processed")
    .reduce((sum, inv) => sum + parseFloat(inv.invoiceTotal || "0"), 0);
  const outstandingMonthly = invoices
    .filter(inv => inv.status !== "processed" && (inv.invoiceDate || "").startsWith("2026-05"))
    .reduce((sum, inv) => sum + parseFloat(inv.invoiceTotal || "0"), 0);

  const totalTds = invoices.reduce((sum, inv) => sum + parseFloat(inv.tdsDeducted || "0"), 0);

  const selectAndOpenInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    setSelectedGrnStatus(inv.grnStatus || "pending_receipt");
    setDisputeReasonText(inv.disputeReason || "");
    setLocalPaymentTerms(inv.rawData?.paymentTerms || "Net 30 Days");
    setLocalVehicleNumber(inv.rawData?.vehicleNumber || "WB-11-C-1234");
    setLocalEWayBill(inv.rawData?.eWayBillNumber || (inv.irnNumber ? "EWB-948204948" : "Not Applicable"));
    setBankOpen(false);
  };

  const handlePayNow = async (inv: any) => {
    if (grnSystemEnabled && inv.grnStatus !== "fully_received") {
      toast.error("GRN must be 'Fully Received' before executing bank transfer!");
      return;
    }
    
    const bankAccount = bankAccounts[0];
    if (!bankAccount) {
      toast.error("Vendor bank details not verified or not configured.");
      return;
    }

    const payload = {
      vendorId: inv.vendorId,
      vendorName: inv.vendorName,
      amount: String(parseFloat(inv.invoiceTotal || "0") - parseFloat(inv.tdsDeducted || "0")),
      utrNumber: `ICICIN${Date.now().toString().slice(-10)}`,
      bankReference: `REF-${Math.floor(Math.random() * 89999) + 10000}`,
      paymentMethod: inv.paymentMode || "NEFT",
      tdsDeducted: inv.tdsDeducted,
      allocations: [
        { invoiceId: inv.id, amount: inv.invoiceTotal }
      ]
    };

    paymentMutation.mutate(payload);
    setSelectedInvoice(null);
  };

  // Safe tab options list
  const visibleTabs = makerCheckerEnabled 
    ? TABS 
    : [{ id: "all", label: "All Purchases" }, { id: "processed", label: "Paid" }];

  return (
    <div className="space-y-4 py-4 pb-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">FY 2026-27</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight leading-none">Procurement Hub</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => downloadExcel(invoices, "Purchase_Invoices", "Invoices").then(() => toast.success("Excel exported successfully ✓"))}
            className="icon-btn"
          >
            <FileDown size={18} />
          </motion.button>
          <ProfileMenu />
        </div>
      </header>

      {/* Procurement Dashboard KPI Strip */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metric 1: Total Purchases */}
        <div 
          onClick={() => setTotalPurchasesMode(totalPurchasesMode === "yearly" ? "monthly" : "yearly")}
          className="p-3 bg-blue-deep rounded-2xl relative overflow-hidden cursor-pointer select-none active:scale-95 transition-transform"
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-white/50 block mb-0.5">Total Purchases</span>
          <p className="text-base font-black text-white tracking-tight leading-none my-1">
            {formatINR(totalPurchasesMode === "yearly" ? totalPurchasesYearly : totalPurchasesMonthly)}
          </p>
          <span className="text-[8px] text-white/40 block mt-0.5 font-bold uppercase tracking-wider">
            {totalPurchasesMode === "yearly" ? "FY 26-27 (Yearly)" : "May 2026 (Monthly)"}
          </span>
          <span className="absolute right-2 bottom-1.5 text-[6px] font-black text-white/20 uppercase tracking-widest">Flip Mode</span>
        </div>

        {/* Metric 2: Outstanding AP */}
        <div 
          onClick={() => setOutstandingMode(outstandingMode === "yearly" ? "monthly" : "yearly")}
          className="p-3 bg-blue-deep rounded-2xl relative overflow-hidden cursor-pointer select-none active:scale-95 transition-transform"
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-white/50 block mb-0.5">Outstanding AP</span>
          <p className={cn("text-base font-black text-white tracking-tight leading-none my-1", outstandingYearly > 200000 && "text-red-300")}>
            {formatINR(outstandingMode === "yearly" ? outstandingYearly : outstandingMonthly)}
          </p>
          <span className="text-[8px] text-white/40 block mt-0.5 font-bold uppercase tracking-wider">
            {outstandingMode === "yearly" ? "Total Outstanding" : "May 2026 Outstanding"}
          </span>
          <span className="absolute right-2 bottom-1.5 text-[6px] font-black text-white/20 uppercase tracking-widest">Flip Mode</span>
        </div>

        {/* Metric 3: TDS Deducted */}
        <div className="p-3 bg-blue-deep rounded-2xl relative overflow-hidden">
          <span className="text-[8px] font-black uppercase tracking-wider text-white/50 block mb-0.5">TDS Deducted</span>
          <p className="text-base font-black text-white tracking-tight leading-none my-1">{formatINR(totalTds)}</p>
          <span className="text-[8px] text-white/40 block mt-0.5 font-bold uppercase tracking-wider">Sec 194Q Ledger</span>
        </div>
      </div>

      {/* Action triggers */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Scan Invoice", Icon: Camera, desc: "Process paper invoice" },
          { label: "Upload PDF", Icon: FileUp, desc: "Process digital invoice" },
        ].map(({ label, Icon, desc }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowScanDrawer(true)}
            className="card p-4 flex flex-col items-start gap-2 text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-mid/10 flex items-center justify-center text-blue-mid">
              <Icon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-ink block leading-none">{label}</span>
              <span className="text-[8px] font-bold text-blue-mid/50 uppercase tracking-widest mt-0.5 block">{desc}</span>
            </div>
          </motion.button>
        ))}
      </div>


      {/* Stacked Filter Layer */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
            <input
              className="search-input"
              placeholder="Search vendor, invoice #, location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setShowFilters(!showFilters)} 
            className={cn("icon-btn border border-blue-mid/10", showFilters && "bg-blue-mid text-white border-blue-mid")}
          >
            <Filter size={18} />
          </motion.button>
        </div>

        {/* Dynamic Pinned Filter Bar (Instantly accessible on dashboard) */}
        {pinnedFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 py-1.5 px-3 items-center bg-blue-light/20 rounded-2xl border border-blue-mid/5">
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-mid/60 mr-1 flex items-center gap-1">
              <Pin size={8} /> Pinned:
            </span>
            
            {pinnedFilters.map(fId => {
              // Hide GRN filter chip if system is disabled
              if (fId === "grn" && !grnSystemEnabled) return null;
              
              if (fId === "grn") {
                return (
                  <select key={fId} value={filterGrn} onChange={e => setFilterGrn(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">GRN: All</option>
                    <option value="pending_receipt">GRN: Pending</option>
                    <option value="partially_received">GRN: Partial</option>
                    <option value="fully_received">GRN: Full</option>
                    <option value="damaged">GRN: Damaged</option>
                  </select>
                );
              }
              if (fId === "location") {
                return (
                  <select key={fId} value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">Location: All</option>
                    <option value="Kolkata Works W1">Kolkata W1</option>
                    <option value="Howrah Works W2">Howrah W2</option>
                  </select>
                );
              }
              if (fId === "ocr") {
                return (
                  <select key={fId} value={filterOcr} onChange={e => setFilterOcr(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">OCR: All</option>
                    <option value="low">OCR: Low</option>
                    <option value="high">OCR: High</option>
                  </select>
                );
              }
              if (fId === "tds") {
                return (
                  <select key={fId} value={filterTds} onChange={e => setFilterTds(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">TDS: All</option>
                    <option value="deducted">TDS Deducted</option>
                    <option value="none">TDS None</option>
                  </select>
                );
              }
              if (fId === "seller") {
                return (
                  <select key={fId} value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">Seller: All</option>
                    {uniqueSellers.map(name => (
                      <option key={name} value={name}>{name.slice(0, 10)}</option>
                    ))}
                  </select>
                );
              }
              if (fId === "month") {
                return (
                  <select key={fId} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">Month: All</option>
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                      <option key={m} value={m}>{format(new Date(2026, parseInt(m)-1, 1), "MMM")}</option>
                    ))}
                  </select>
                );
              }
              if (fId === "year") {
                return (
                  <select key={fId} value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">Year: All</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                );
              }
              if (fId === "status") {
                return (
                  <select key={fId} value={filterPaid} onChange={e => setFilterPaid(e.target.value)} className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2.5 py-1 border border-blue-mid/10 focus:outline-none transition-all">
                    <option value="all">Payment: All</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                );
              }
              if (fId === "item") {
                return (
                  <div key={fId} className="relative flex items-center">
                    <input 
                      type="text"
                      placeholder="Item keyword..."
                      value={filterItem}
                      onChange={e => setFilterItem(e.target.value)}
                      className="bg-white text-[9px] font-black uppercase tracking-wider text-blue-ink rounded-full pl-2.5 pr-6 py-1 border border-blue-mid/10 focus:outline-none transition-all w-24"
                    />
                    {filterItem && (
                      <button onClick={() => setFilterItem("")} className="absolute right-2 text-blue-mid/60 text-[9px] font-bold">×</button>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-blue-light/60 p-4 rounded-3xl border border-blue-mid/10 grid grid-cols-2 gap-4"
            >
              {[
                { id: "grn", label: "GRN Verification", component: (
                  <select value={filterGrn} onChange={e => setFilterGrn(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Statuses</option>
                    <option value="pending_receipt">Pending Receipt</option>
                    <option value="partially_received">Partially Received</option>
                    <option value="fully_received">Fully Received</option>
                    <option value="damaged">Damaged / Rejected</option>
                  </select>
                ), grnOnly: true },
                { id: "location", label: "Works / Location", component: (
                  <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Branches</option>
                    <option value="Kolkata Works W1">Kolkata Works W1</option>
                    <option value="Howrah Works W2">Howrah Works W2</option>
                  </select>
                ) },
                { id: "ocr", label: "OCR Quality Gating", component: (
                  <select value={filterOcr} onChange={e => setFilterOcr(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Confidence Tiers</option>
                    <option value="low">Needs Review (&lt;90% Score)</option>
                    <option value="high">High Confidence (&gt;=90%)</option>
                  </select>
                ) },
                { id: "tds", label: "194Q TDS Deduction", component: (
                  <select value={filterTds} onChange={e => setFilterTds(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Invoices</option>
                    <option value="deducted">TDS Deducted</option>
                    <option value="none">No TDS Applicable</option>
                  </select>
                ) },
                { id: "seller", label: "Seller's Name", component: (
                  <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Sellers</option>
                    {uniqueSellers.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ) },
                { id: "month", label: "Selecting the Month", component: (
                  <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Months</option>
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                      <option key={m} value={m}>{format(new Date(2026, parseInt(m)-1, 1), "MMMM")}</option>
                    ))}
                  </select>
                ) },
                { id: "year", label: "Selecting the Year", component: (
                  <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                ) },
                { id: "status", label: "Paid or Not Paid", component: (
                  <select value={filterPaid} onChange={e => setFilterPaid(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                ) },
                { id: "item", label: "Item-Wise Recognition", component: (
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search specific item name..." 
                      value={filterItem} 
                      onChange={e => setFilterItem(e.target.value)} 
                      className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 pr-8 text-xs font-bold text-blue-ink"
                    />
                    {filterItem && <button onClick={() => setFilterItem("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-mid font-black text-xs">×</button>}
                  </div>
                ) }
              ].map(({ id: fId, label, component, grnOnly }) => {
                if (grnOnly && !grnSystemEnabled) return null;
                
                const isPinned = pinnedFilters.includes(fId);
                const togglePin = () => {
                  if (isPinned) {
                    setPinnedFilters(pinnedFilters.filter(p => p !== fId));
                  } else {
                    const updated = [...pinnedFilters, fId];
                    if (updated.length > 4) {
                      updated.shift(); // keep exactly up to 4 pinned
                    }
                    setPinnedFilters(updated);
                  }
                };

                return (
                  <div key={fId} className="space-y-1.5 bg-white/50 p-2.5 rounded-2xl border border-blue-mid/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase tracking-wider text-blue-ink/70 block">{label}</label>
                      <button 
                        onClick={togglePin}
                        className={cn(
                          "p-1 rounded-lg border transition-all flex items-center justify-center",
                          isPinned 
                            ? "bg-blue-mid text-white border-blue-mid" 
                            : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                        )}
                        title={isPinned ? "Unpin filter" : "Pin filter"}
                      >
                        <Pin size={10} className={cn(isPinned && "rotate-45")} />
                      </button>
                    </div>
                    {component}
                  </div>
                );
              })}

              {/* System Configuration Toggles */}
              <div className="col-span-2 mt-2 pt-3 border-t border-blue-mid/10 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-ink">System Configurations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {/* GRN System switch */}
                  <button 
                    onClick={() => {
                      setGrnSystemEnabled(!grnSystemEnabled);
                      toast.success(`GRN Matching System turned ${!grnSystemEnabled ? "ON" : "OFF"}`);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] transition-all border",
                      grnSystemEnabled 
                        ? "bg-green-500/10 text-green-700 border-green-500/20" 
                        : "bg-slate-200/50 text-slate-400 border-slate-300/30"
                    )}
                  >
                    <CheckCircle2 size={10} />
                    <span>GRN Matching</span>
                  </button>

                  {/* Maker Checker Switch */}
                  <button 
                    onClick={() => {
                      setMakerCheckerEnabled(!makerCheckerEnabled);
                      toast.success(`Maker-Checker AP Mode turned ${!makerCheckerEnabled ? "ON" : "OFF"}`);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] transition-all border",
                      makerCheckerEnabled 
                        ? "bg-blue-500/10 text-blue-700 border-blue-500/20" 
                        : "bg-slate-200/50 text-slate-400 border-slate-300/30"
                    )}
                  >
                    <ShieldCheck size={10} />
                    <span>Maker-Checker</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn("tab-item", activeTab === t.id && "active")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {isLoading && (
          <>{[1,2,3].map(i => <div key={i} className="skeleton h-24 w-full rounded-[2rem]" />)}</>
        )}

        <AnimatePresence mode="popLayout">
          {!isLoading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3 text-blue-mid/30"
            >
              <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
                <Receipt size={28} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">No records matched filters</p>
            </motion.div>
          )}

          {filtered.map((inv: any) => {
            const isUnpaid = inv.status !== "processed";
            const diffTime = Math.abs(new Date().getTime() - new Date(inv.invoiceDate).getTime());
            const pendingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={inv.id}
                layout
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAndOpenInvoice(inv)}
                className="card card-interactive p-4 relative overflow-hidden"
              >
                {/* Lateral Status Stripe */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  inv.status === "processed" && "bg-green-500",
                  inv.status === "needs_review" && "bg-red-500",
                  inv.status === "pending" && "bg-yellow-500",
                  inv.status === "disputed" && "bg-orange-500"
                )} />

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-blue-ink text-xs uppercase tracking-tight truncate">{inv.vendorName}</span>
                      {inv.isEInvoice && <span className="px-1.5 py-0.5 rounded bg-blue-mid/10 text-[8px] font-black text-blue-mid uppercase tracking-widest">E-Invoice</span>}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-blue-mid/60 font-bold uppercase tracking-wider">
                      <span>{inv.invoiceNo}</span>
                      <span>•</span>
                      <span>{formatDate(inv.invoiceDate)}</span>
                      <span>•</span>
                      <span>Due {formatDate(inv.dueDate || inv.invoiceDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {grnSystemEnabled && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border",
                          inv.grnStatus === "fully_received" && "text-green-600 bg-green-50 border-green-200",
                          inv.grnStatus === "partially_received" && "text-yellow-600 bg-yellow-50 border-yellow-200",
                          inv.grnStatus === "pending_receipt" && "text-red-500 bg-red-50 border-red-200",
                          inv.grnStatus === "damaged" && "text-orange-600 bg-orange-50 border-orange-200"
                        )}>
                          GRN: {inv.grnStatus?.replace("_", " ")}
                        </span>
                      )}
                      <span className="text-[8px] font-bold text-blue-mid/40 uppercase tracking-widest">
                        {inv.branchLocation}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <p className="fin-num text-sm text-blue-ink font-black">{formatINR(inv.invoiceTotal)}</p>
                    <p className="text-[9px] text-blue-mid/50 font-bold uppercase mt-0.5">GST: {formatINR(inv.totalGst)}</p>
                    
                    <div className="flex items-center gap-1.5 mt-2">
                      {isUnpaid && pendingDays > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[8px] uppercase tracking-wide">
                          {pendingDays}d pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* LEVEL 2 — DETAILED INVOICE DRAWER */}
      <Drawer open={!!selectedInvoice} onOpenChange={o => !o && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[92dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem]">
          {selectedInvoice && (
            <div className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-10">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10 shadow-sm">
                    <Receipt size={24} />
                  </div>
                  <div className="flex gap-2">
                    <DrawerClose className="icon-btn">
                      <X size={18} />
                    </DrawerClose>
                  </div>
                </div>
                <DrawerTitle className="text-2xl font-black text-blue-ink leading-tight">
                  {selectedInvoice.vendorName}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-blue-mid mt-0.5 flex flex-wrap gap-x-2">
                  <span>{selectedInvoice.invoiceNo}</span>
                  <span>•</span>
                  <span>Extracted by {selectedInvoice.uploadedBy}</span>
                </DrawerDescription>
              </DrawerHeader>

              {/* Status Alert for Verification Requirement */}
              {selectedInvoice.status === "needs_review" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-red-800 uppercase tracking-wide">Accounting Posting Locked</p>
                    <p className="text-[10px] text-red-600 font-bold uppercase mt-0.5 tracking-wider">
                      Reason: {selectedInvoice.disputeReason || "Low confidence score/Duplicate warnings"}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: VENDOR & INVOICE STRUCTURAL HEADERS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 space-y-2.5">
                  <span className="section-label block mb-1">Vendor Master Info</span>
                  {[
                    { label: "Legal Name", val: selectedInvoice.vendorName },
                    { label: "GSTIN", val: selectedInvoice.vendorGstin || "Not Provided", highlight: true },
                    { label: "PAN", val: selectedInvoice.vendorGstin ? selectedInvoice.vendorGstin.slice(2, 12) : "—" },
                    { label: "State Code", val: selectedInvoice.vendorGstin ? `${selectedInvoice.vendorGstin.slice(0, 2)} (West Bengal)` : "—" },
                    { label: "Address", val: "55 Ezra Street, Kolkata-700001" },
                  ].map(({ label, val, highlight }) => (
                    <div key={label} className="text-[10px]">
                      <span className="text-blue-mid/60 uppercase font-black tracking-wider block mb-0.5">{label}</span>
                      <span className={cn("font-bold text-blue-ink", highlight && "text-blue-mid font-black")}>{val}</span>
                    </div>
                  ))}

                  {/* BANK ACCOUNT COLLAPSIBLE (Within Vendor Master Card) */}
                  <div className="border-t border-blue-light/50 pt-2.5 mt-2">
                    <button 
                      onClick={() => setBankOpen(!bankOpen)}
                      className="w-full flex justify-between items-center text-blue-mid/70 hover:text-blue-ink uppercase font-black tracking-wider text-[9px] transition-colors focus:outline-none"
                    >
                      <span>Bank Account Details</span>
                      <span className="text-[8px] font-bold text-blue-mid">{bankOpen ? "▲ Hide" : "▼ Click to View"}</span>
                    </button>
                    
                    <AnimatePresence>
                      {bankOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-2 space-y-1.5 text-[9px] bg-blue-light/50 p-2.5 rounded-xl border border-blue-mid/5"
                        >
                          {bankAccounts.length === 0 ? (
                            <div className="text-blue-mid/40 font-bold uppercase tracking-wider py-1">Loading beneficiary data...</div>
                          ) : (
                            bankAccounts.map((acct: any) => (
                              <div key={acct.id} className="space-y-1.5">
                                <div>
                                  <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Holder Name</span>
                                  <span className="font-black text-blue-ink">{acct.accountHolderName}</span>
                                </div>
                                <div>
                                  <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Account Number</span>
                                  <span className="font-black text-blue-ink tracking-widest">••••••••{acct.accountNumber.slice(-4)}</span>
                                </div>
                                <div>
                                  <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">IFSC & Bank</span>
                                  <span className="font-black text-blue-ink">{acct.ifscCode} · {acct.bankName}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="card p-4 space-y-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="section-label">Invoice Logistics</span>
                    <button 
                      onClick={() => {
                        updateMutation.mutate({
                          id: selectedInvoice.id,
                          rawData: {
                            ...selectedInvoice.rawData,
                            paymentTerms: localPaymentTerms,
                            vehicleNumber: localVehicleNumber,
                            eWayBillNumber: localEWayBill
                          }
                        });
                        toast.success("Logistics details saved ✓");
                      }}
                      className="text-[9px] font-black text-green-600 hover:text-green-700 uppercase"
                    >
                      Save Details
                    </button>
                  </div>
                  
                  <div className="text-[10px]">
                    <span className="text-blue-mid/60 uppercase font-black tracking-wider block mb-0.5">Invoice Date</span>
                    <span className="font-bold text-blue-ink">{formatDate(selectedInvoice.invoiceDate)}</span>
                  </div>

                  <div className="text-[10px]">
                    <label className="text-blue-mid/60 uppercase font-black tracking-wider block mb-1">Payment Terms</label>
                    <input 
                      type="text" 
                      value={localPaymentTerms} 
                      onChange={e => setLocalPaymentTerms(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-lg px-2 py-1 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                    />
                  </div>

                  <div className="text-[10px]">
                    <span className="text-blue-mid/60 uppercase font-black tracking-wider block mb-0.5">Due Date</span>
                    <span className="font-black text-red-500">{formatDate(selectedInvoice.dueDate || selectedInvoice.invoiceDate)}</span>
                  </div>

                  <div className="text-[10px]">
                    <label className="text-blue-mid/60 uppercase font-black tracking-wider block mb-1">E-Way Bill #</label>
                    <input 
                      type="text" 
                      value={localEWayBill} 
                      onChange={e => setLocalEWayBill(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-lg px-2 py-1 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                    />
                  </div>

                  <div className="text-[10px]">
                    <label className="text-blue-mid/60 uppercase font-black tracking-wider block mb-1">Vehicle Number</label>
                    <input 
                      type="text" 
                      value={localVehicleNumber} 
                      onChange={e => setLocalVehicleNumber(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-lg px-2 py-1 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* LINE ITEM TABLE */}
              <div className="card p-4 overflow-hidden">
                <span className="section-label block mb-3">Line Item Tax Engine Audit</span>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-blue-light/50 text-blue-mid/60 font-black uppercase tracking-wider">
                        <th className="py-2 pr-2">Item Description</th>
                        <th className="py-2 px-2 text-right">HSN</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-right">Rate</th>
                        <th className="py-2 px-2 text-right">Taxable</th>
                        <th className="py-2 px-2 text-right">CGST</th>
                        <th className="py-2 px-2 text-right">SGST</th>
                        <th className="py-2 px-2 text-right">IGST</th>
                        <th className="py-2 pl-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-light/35 font-medium text-blue-ink">
                      {selectedInvoice.lineItems?.map((li: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 pr-2 font-bold max-w-[140px] truncate">
                            {li.item}
                            <div className="text-[8px] text-blue-mid/50 font-medium uppercase tracking-tight mt-0.5 flex flex-wrap gap-x-2">
                              <span>Batch: {li.batchNo}</span>
                              <span>•</span>
                              <span>Loc: {li.warehouse}</span>
                              <span>•</span>
                              <span>CC: {li.costCenter}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-blue-mid">{li.hsn}</td>
                          <td className="py-2 px-2 text-right">{li.qty} {li.unit}</td>
                          <td className="py-2 px-2 text-right">{parseFloat(li.rate || "0").toFixed(2)}</td>
                          <td className="py-2 px-2 text-right font-bold">{parseFloat(li.taxableValue || li.taxableAmount || "0").toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-blue-mid/70">{parseFloat(li.cgstAmount || "0").toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-blue-mid/70">{parseFloat(li.sgstAmount || "0").toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-blue-mid/70">{parseFloat(li.igstAmount || "0").toFixed(2)}</td>
                          <td className="py-2 pl-2 text-right font-black text-blue-deep">{parseFloat(li.total || "0").toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GST & TDS/TCS SECTION 194Q COMPLIANCE WIDGET */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4">
                  <span className="section-label block mb-1">Subtotal (Taxable)</span>
                  <p className="fin-num text-xl text-blue-ink">{formatINR(selectedInvoice.taxableAmount)}</p>
                  <span className="text-[8px] font-bold text-blue-mid/50 uppercase tracking-widest mt-1 block">Accrual Base</span>
                </div>
                <div className="card p-4 bg-green-50 border border-green-200">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="section-label text-green-700">TDS (Sec 194Q)</span>
                    <Percent size={10} className="text-green-600" />
                  </div>
                  <p className="fin-num text-xl text-green-700">-{formatINR(selectedInvoice.tdsDeducted || "0.00")}</p>
                  <span className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-1 block">Deducted @ 0.1%</span>
                </div>
                <div className="card p-4">
                  <span className="section-label block mb-1">TCS (206C(1H))</span>
                  <p className="fin-num text-xl text-blue-ink">{formatINR(selectedInvoice.tcsCollected || "0.00")}</p>
                  <span className="text-[8px] font-bold text-blue-mid/50 uppercase tracking-widest mt-1 block">Seller Collects</span>
                </div>
              </div>

              {/* GOODS RECEIVED NOTE (GRN) GATING (Only visible if enabled) */}
              {grnSystemEnabled && (
                <div className="card p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="section-label">Goods Receipt Note (GRN) Control</span>
                    <span className="text-[9px] font-bold text-blue-mid/50 uppercase tracking-widest">Unlocks Maker Payment</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: "pending_receipt", label: "Pending" },
                      { id: "partially_received", label: "Partial" },
                      { id: "fully_received", label: "Fully Recv ✓" },
                      { id: "damaged", label: "Damaged" },
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedGrnStatus(g.id);
                          updateMutation.mutate({ id: selectedInvoice.id, grnStatus: g.id });
                          toast.success(`GRN updated to ${g.label}`);
                        }}
                        className={cn(
                          "flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                          selectedGrnStatus === g.id 
                            ? "bg-blue-mid text-white border-blue-mid" 
                            : "bg-white text-blue-mid border-blue-mid/10 hover:border-blue-mid/30"
                        )}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CHRONOLOGICAL AUDIT TRAIL / MAKER-CHECKER LOGS (Only visible if Maker-Checker is ON) */}
              {makerCheckerEnabled && (
                <div className="card p-4 space-y-3">
                  <span className="section-label">Maker-Checker System Log</span>
                  <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-blue-mid/10">
                    {approvalLogs.map((log: any) => (
                      <div key={log.id} className="flex gap-3 pl-5 relative">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-mid absolute left-[5px] top-1" />
                        <div className="flex-1 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-blue-ink uppercase">{log.actor}</span>
                            <span className="text-blue-mid/50 font-bold uppercase tracking-wider">{log.action.replace("_", " ")}</span>
                            <span className="text-blue-mid/40 font-bold ml-auto">{formatDate(log.createdAt)}</span>
                          </div>
                          <p className="text-blue-mid/70 mt-0.5">{log.comments || "No comments entered."}</p>
                        </div>
                      </div>
                    ))}
                    {approvalLogs.length === 0 && (
                      <p className="text-[10px] text-blue-mid/40 font-bold uppercase tracking-widest pl-5">No maker-checker logs recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* AP AUTOMATION WORKFLOW CONTROL PANEL */}
              <div className="card p-4 space-y-4">
                <span className="section-label block">Accounts Payable Automation Center</span>
                
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={() => {
                      if (grnSystemEnabled && selectedInvoice.grnStatus !== "fully_received") {
                        toast.error("GRN must be 'Fully Received' before executing bank transfer!");
                        return;
                      }
                      handlePayNow(selectedInvoice);
                    }}
                    className="btn-primary flex items-center justify-center gap-2 py-3"
                    style={{ background: "linear-gradient(135deg,#3B82F6,#1E3A8A)" }}
                  >
                    <Play size={14} />
                    <span>Pay Now</span>
                  </button>

                  <button 
                    onClick={() => setShowScheduleCalendar(!showScheduleCalendar)}
                    className="flex flex-col items-center justify-center gap-1 border border-blue-mid/15 rounded-2xl bg-white text-blue-mid text-[10px] font-black uppercase tracking-wider hover:bg-blue-light/30 py-2.5"
                  >
                    <Calendar size={14} />
                    <span>Schedule</span>
                  </button>

                  <button 
                    onClick={() => {
                      updateMutation.mutate({ id: selectedInvoice.id, status: "hold", comments: "Payment placed on Administrative HOLD." });
                      toast.warning("Invoice placed on HOLD");
                      setSelectedInvoice(null);
                    }}
                    className="flex flex-col items-center justify-center gap-1 border border-blue-mid/15 rounded-2xl bg-white text-blue-mid text-[10px] font-black uppercase tracking-wider hover:bg-blue-light/30 py-2.5"
                  >
                    <Clock size={14} />
                    <span>Hold</span>
                  </button>

                  <button 
                    onClick={() => {
                      updateMutation.mutate({ id: selectedInvoice.id, status: "disputed", disputeReason: disputeReasonText || "Marked Disputed" });
                      toast.error("Invoice status updated to Disputed");
                      setSelectedInvoice(null);
                    }}
                    className="flex flex-col items-center justify-center gap-1 border border-red-200 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider hover:bg-red-100/40 py-2.5"
                  >
                    <AlertTriangle size={14} />
                    <span>Dispute</span>
                  </button>
                </div>

                {/* Scheduling controls expanded */}
                {showScheduleCalendar && (
                  <div className="p-3 bg-blue-light/40 border border-blue-mid/10 rounded-2xl flex items-center gap-3 text-[10px]">
                    <div className="flex-1">
                      <label className="text-[8px] font-black uppercase tracking-wider text-blue-mid/50 block mb-0.5">Select Payout Date</label>
                      <input 
                        type="date" 
                        value={scheduleDate} 
                        onChange={e => setScheduleDate(e.target.value)} 
                        className="bg-white border border-blue-mid/10 rounded-xl p-1.5 w-full text-xs font-bold text-blue-ink"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!scheduleDate) return toast.error("Select payment date");
                        updateMutation.mutate({ id: selectedInvoice.id, dueDate: scheduleDate, comments: `Payment scheduled for ${formatDate(scheduleDate)}` });
                        toast.success(`Payment scheduled for ${formatDate(scheduleDate)}`);
                        setSelectedInvoice(null);
                      }}
                      className="btn-primary py-2 px-4 self-end text-[10px]"
                    >
                      Confirm Schedule
                    </button>
                  </div>
                )}

                {/* Dispute / Warning text entry - only shown if Maker-Checker is ON */}
                {makerCheckerEnabled && (
                  <div className="flex gap-2 text-[10px]">
                    <input 
                      placeholder="Enter dispute comment or partial pay remarks..." 
                      value={disputeReasonText} 
                      onChange={e => setDisputeReasonText(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-xl p-2 flex-1 text-xs font-bold text-blue-ink"
                    />
                    <button 
                      onClick={() => {
                        if (!disputeReasonText) return toast.error("Enter dispute/verification details first");
                        updateMutation.mutate({ id: selectedInvoice.id, status: "pending", disputeReason: null, comments: disputeReasonText });
                        toast.success("Verification confirmed! Auto-posted to accounts ledger.");
                        setSelectedInvoice(null);
                      }}
                      className="btn-primary py-2 px-4 text-[10px]"
                      style={{ background: "linear-gradient(135deg, #10B981, #065F46)" }}
                    >
                      Confirm Review & Release
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Stage 1 OCR Scanner Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[92dvh] bg-white border-blue-mid/10 rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="section-label block mb-1">OCR AI Structuring Pipeline</span>
                <h3 className="text-xl font-black text-blue-ink tracking-tight">Stage 1: Document OCR Scan</h3>
              </div>
              <DrawerClose className="icon-btn">
                <X size={18} />
              </DrawerClose>
            </div>
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
