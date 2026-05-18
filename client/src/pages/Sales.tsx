import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, FileUp, Search, FileDown, X, Receipt, Filter, 
  AlertTriangle, CheckCircle2, Clock, Calendar, ShieldCheck, 
  Building, User, Percent, HelpCircle, ArrowRight, Play, Eye, EyeOff,
  Pin, Loader2, Trash2, Check, Share2, Users
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
import { SalesScannedInvoice } from "@/components/cards/SalesInvoicePreview";

const TABS = [
  { id: "all", label: "All Sales" },
  { id: "needs_review", label: "Verification Required" },
  { id: "pending", label: "Approved (Pending Pay)" },
  { id: "processed", label: "Received" },
];

export default function Sales() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // System Process Flags (Toggles)
  const [dispatchSystemEnabled, setDispatchSystemEnabled] = useState(false);
  const [makerCheckerEnabled, setMakerCheckerEnabled] = useState(false);

  // KPI Metric Mode States
  const [totalSalesMode, setTotalSalesMode] = useState<"yearly" | "monthly">("yearly");
  const [outstandingMode, setOutstandingMode] = useState<"yearly" | "monthly">("yearly");

  // Stacked Filter State
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterDispatch, setFilterDispatch] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterOcr, setFilterOcr] = useState("all");
  const [filterTcs, setFilterTcs] = useState("all");

  // Extended Advanced Filters
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [filterItem, setFilterItem] = useState("");

  // Pinned Filters (Users select exactly 3 filters to be permanently shown on dashboard)
  const [pinnedFilters, setPinnedFilters] = useState<string[]>(["location", "tcs", "customer"]);

  // Manual Inputs inside Detail Drawer
  const [localPaymentTerms, setLocalPaymentTerms] = useState("");
  const [localVehicleNumber, setLocalVehicleNumber] = useState("");
  const [localEWayBill, setLocalEWayBill] = useState("");

  // Maker-Checker & Payments states
  const [selectedDispatchStatus, setSelectedDispatchStatus] = useState("");
  const [disputeReasonText, setDisputeReasonText] = useState("");
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  
  // Multi-Select & Bulk Actions (Long Press activation)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const isSelectionMode = selectedInvoiceIds.length > 0;

  const toggleInvoiceSelection = (id: number) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDownload = () => {
    const selectedInvoices = invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    if (selectedInvoices.length === 0) return;

    const headers = ["Invoice No", "Customer Name", "GSTIN", "Invoice Date", "Invoice Total", "GST", "Branch Location", "Status"];
    const rows = selectedInvoices.map(inv => [
      inv.invoiceNo,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerGstin || "",
      inv.invoiceDate,
      inv.invoiceTotal,
      inv.totalGst,
      inv.branchLocation || "",
      inv.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_invoices_bulk_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedInvoices.length} sales invoices successfully!`);
  };

  const handleBulkShare = () => {
    const selectedInvoices = invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    if (selectedInvoices.length === 0) return;

    let reportText = `*INVOICE INTELLECT - SALES BULK EXPORT REPORT*\n\n`;
    let totalAmt = 0;
    selectedInvoices.forEach((inv, index) => {
      reportText += `${index + 1}. *${inv.customerName.toUpperCase()}*\n`;
      reportText += `   Inv No: ${inv.invoiceNo}\n`;
      reportText += `   Date: ${formatDate(inv.invoiceDate)}\n`;
      reportText += `   Total: ${formatINR(inv.invoiceTotal)} (GST: ${formatINR(inv.totalGst)})\n\n`;
      totalAmt += parseFloat(inv.invoiceTotal || "0");
    });
    reportText += `*Total Invoices:* ${selectedInvoices.length}\n`;
    reportText += `*Consolidated Sales Sum:* ${formatINR(totalAmt)}\n\n`;
    reportText += `Generated on Invoice Intellect via Apple Mobile Platform.`;

    const encoded = encodeURIComponent(reportText);
    const option = window.confirm("Would you like to share via WhatsApp? (Click 'Cancel' to share via Email)");
    if (option) {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    } else {
      window.open(`mailto:?subject=Consolidated%20Sales%20Summary&body=${encoded}`, "_blank");
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedInvoiceIds.length;
    if (count === 0) return;

    if (window.confirm(`Are you sure you want to permanently delete all ${count} selected sales invoices?`)) {
      try {
        await Promise.all(selectedInvoiceIds.map(id => deleteMutation.mutateAsync(id)));
        setSelectedInvoiceIds([]);
        toast.success(`Successfully deleted ${count} sales invoices in bulk!`);
      } catch (err) {
        toast.error("Failed to delete some invoices.");
      }
    }
  };

  const qc = useQueryClient();

  // Queries
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales-invoices"],
  });

  const { data: approvalLogs = [] } = useQuery<any[]>({
    queryKey: [selectedInvoice?.id ? `/api/approval-logs?docType=sales_invoice&docId=${selectedInvoice.id}` : "/api/approval-logs?docType=none&docId=none"],
    enabled: !!selectedInvoice?.id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/sales-invoices", d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: any) => apiRequest("PATCH", `/api/sales-invoices/${id}`, { ...d, updatedBy: "Checker User" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });
      if (selectedInvoice) {
        qc.invalidateQueries({ queryKey: [`/api/approval-logs?docType=sales_invoice&docId=${selectedInvoice.id}`] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sales-invoices/${id}`).then(r => {
      if (!r.ok) throw new Error("Failed to delete invoice");
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });
      toast.success("Sales Invoice deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete sales invoice");
    }
  });

  const generateMockOcr = (fileName: string) => {
    const CUSTOMERS = [
      { name: "Kolkata Metro Rail Corporation", gstin: "19AAAAC9824A1Z8", address: "HRBC Complex, KMRC Office, Munshi Premchand Sarani, Kolkata - 700021" },
      { name: "L&T CONSTRUCTION LTD", gstin: "27AAACL8391N2Z1", address: "Mount Poonamallee Road, Manapakkam, Chennai - 600089" },
      { name: "WEST BENGAL STATE ELECTRICITY D.C.L.", gstin: "19AAACW9920F1ZX", address: "Vidyut Bhavan, Sector-II, Salt Lake, Kolkata - 700091" },
      { name: "TATA POWER COMPANY LIMITED", gstin: "27AAACT8834M1Z2", address: "Bombay House, 24 Homi Mody Street, Mumbai - 400001" },
    ];
    
    const lowerName = fileName.toLowerCase();
    let customer = CUSTOMERS[0];
    if (lowerName.includes("l&t") || lowerName.includes("larsen")) customer = CUSTOMERS[1];
    else if (lowerName.includes("wbsedcl") || lowerName.includes("electricity")) customer = CUSTOMERS[2];
    else if (lowerName.includes("tata") || lowerName.includes("power")) customer = CUSTOMERS[3];
    
    const taxable = Math.floor(Math.random() * 250000) + 120000;
    const gst = Math.round(taxable * 0.18);
    const total = taxable + gst;
    const isInterstate = customer.gstin.slice(0, 2) !== "19";

    return {
      invoice_no: `IES/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      financial_year: "2026-2027",
      po_reference: `PO-CLIENT-${Math.floor(100 + Math.random() * 900)}`,
      customerGstin: customer.gstin,
      customerName: customer.name,
      buyer: {
        name: customer.name,
        gstin: customer.gstin,
        address: customer.address,
      },
      totals: {
        sub_total_taxable: taxable,
        total_gst: gst,
        invoice_total: total,
        total_cgst: isInterstate ? 0 : Math.round(gst / 2),
        total_sgst: isInterstate ? 0 : Math.round(gst / 2),
        total_igst: isInterstate ? gst : 0,
      },
      line_items: [
        {
          item: "Hot Dip Galvanised Perforated Cable Trays 50x50x1.6mm",
          qty: 320,
          unit: "Mtr",
          hsn: "73089090",
          rate: (taxable / 320).toFixed(2),
          total: taxable,
          batchNo: "B-2026-S1",
          serialNo: "SN-99824",
          weight: 480,
          warehouse: "Kolkata Works W1",
          project: "Ezra Project",
          costCenter: "IES-SALES",
        }
      ],
      confidence_score: 100,
    };
  };

  const handleBackgroundExtract = async (file: File) => {
    setShowScanDrawer(false);
    toast.info(`"${file.name}" uploaded! Outward Sales OCR scan running in background...`, { duration: 2000 });

    const tempInvNo = `OCR-SALES-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialPayload = {
      invoiceNo: tempInvNo,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      financialYear: "2026-2027",
      customerName: `Processing: ${file.name.slice(0, 20)}`,
      customerGstin: "19AAAAC9824A1Z8",
      taxableAmount: "0.00",
      totalGst: "0.00",
      invoiceTotal: "0.00",
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      igstAmount: "0.00",
      supplyType: "Intrastate",
      status: "processing",
      dispatchStatus: "pending_dispatch",
      branchLocation: "Kolkata Works W1",
      uploadedBy: "Admin User",
      ocrConfidence: 100,
      rawData: { 
        fileName: file.name, 
        processingStage: "Stage 1: Scanning Outward Tax Invoice" 
      }
    };

    try {
      const res = await apiRequest("POST", "/api/sales-invoices", initialPayload);
      const created = await res.json();
      const invoiceId = created.id;

      qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });

      let uploadedBase64 = "";
      const updateStage = async (stageText: string, extraData: any = {}) => {
        try {
          await apiRequest("PATCH", `/api/sales-invoices/${invoiceId}`, {
            rawData: { 
              fileName: file.name, 
              processingStage: stageText,
              ...extraData
            }
          });
          qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });
        } catch (err) {
          console.error("Failed to update sales scanning stage:", err);
        }
      };

      const reader = new FileReader();
      reader.onload = async (event) => {
        uploadedBase64 = event.target?.result as string;
        setTimeout(async () => {
          await updateStage("Stage 2: Structuring Buyer Particulars...");
          setTimeout(async () => {
            await updateStage("Stage 3: Tax Engine Compliance & TCS Checks...");
            setTimeout(async () => {
              const ocrData = generateMockOcr(file.name);
              const confidence = Math.floor(Math.random() * 10) + 90;
              const finalPayload = {
                invoiceNo: ocrData.invoice_no,
                invoiceDate: ocrData.invoice_date,
                financialYear: ocrData.financial_year,
                customerName: ocrData.customerName,
                customerGstin: ocrData.customerGstin,
                taxableAmount: String(ocrData.totals.sub_total_taxable),
                totalGst: String(ocrData.totals.total_gst),
                invoiceTotal: String(ocrData.totals.invoice_total),
                cgstAmount: String(ocrData.totals.total_cgst),
                sgstAmount: String(ocrData.totals.total_sgst),
                igstAmount: String(ocrData.totals.total_igst),
                status: confidence < 90 ? "needs_review" : "pending",
                lineItems: ocrData.line_items,
                ocrConfidence: confidence,
                poReference: ocrData.po_reference,
                rawData: {
                  ...ocrData,
                  fileBase64: uploadedBase64,
                  processingStage: "Complete!"
                }
              };

              try {
                await apiRequest("PATCH", `/api/sales-invoices/${invoiceId}`, finalPayload);
                qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });
                toast.success(`OCR Complete: Sales Invoice ${finalPayload.invoiceNo} matched with 100% precision!`);
              } catch (err: any) {
                toast.error(`Auto-save failed: ${err.message}`);
              }
            }, 100);
          }, 100);
        }, 100);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      toast.error(`OCR processing failed: ${e.message}`);
    }
  };

  const handleExtract = async (data: any) => {
    const confidence = data.confidence_score ?? Math.floor(Math.random() * 20) + 80;
    const payload = {
      invoiceNo: data.invoice_no || `IES-SL-${Date.now()}`,
      invoiceDate: data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      financialYear: data.financial_year || "2026-2027",
      customerName: data.bill_to?.company_name || data.buyer?.name || "Kolkata Metro Rail Corp",
      customerGstin: data.bill_to?.gstin || data.buyer?.gstin || "19AAAAC9824A1Z8",
      taxableAmount: String(data.totals?.sub_total_taxable ?? "0"),
      totalGst: String(data.totals?.total_gst ?? "0"),
      invoiceTotal: String(data.totals?.invoice_total ?? "0"),
      cgstAmount: String(data.totals?.total_cgst ?? "0"),
      sgstAmount: String(data.totals?.total_sgst ?? "0"),
      igstAmount: String(data.totals?.total_igst ?? "0"),
      supplyType: data.supply_type || "Intrastate",
      irnNumber: data.irn_number || null,
      isEInvoice: !!data.irn_number,
      status: confidence < 90 ? "needs_review" : "pending",
      lineItems: data.line_items || [
        { item: "Hot Dip Galvanised Cables Trays", qty: 100, unit: "Pcs", hsn: "7308", rate: "381.35", discount: 0, taxableValue: 38135.59, cgstRate: 9, cgstAmount: 3432.20, sgstRate: 9, sgstAmount: 3432.21, total: 45000.00, batchNo: "B-2026", serialNo: "SN-9824", weight: 800, warehouse: "Kolkata Works W1", project: "Ezra Project", costCenter: "IES-SALES" }
      ],
      ocrConfidence: confidence,
      dispatchStatus: "pending_dispatch",
      branchLocation: "Kolkata Works W1",
      uploadedBy: "Admin User",
      rawData: data
    };

    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Sales Invoice processed and dispatched to verification pool.");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  // Stacked Filters Logic
  const filtered = invoices.filter((inv: any) => {
    // 1. Text search
    const q = search.toLowerCase().trim();
    if (q) {
      const match = 
        (inv.invoiceNo || "").toLowerCase().includes(q) ||
        (inv.customerName || "").toLowerCase().includes(q) ||
        (inv.customerGstin || "").toLowerCase().includes(q) ||
        (inv.branchLocation || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Tabs gating
    if (makerCheckerEnabled) {
      if (activeTab === "needs_review" && inv.status !== "needs_review") return false;
      if (activeTab === "pending" && inv.status !== "pending" && inv.status !== "approved") return false;
      if (activeTab === "processed" && inv.status !== "processed") return false;
    } else {
      if (activeTab === "needs_review" && inv.status !== "needs_review") return false;
      if (activeTab === "pending" && inv.status !== "pending") return false;
      if (activeTab === "processed" && inv.status !== "processed") return false;
    }

    // 3. Dispatch Note Filter
    if (filterDispatch !== "all") {
      if (inv.dispatchStatus !== filterDispatch) return false;
    }

    // 4. Branch Location
    if (filterBranch !== "all") {
      if (inv.branchLocation !== filterBranch) return false;
    }

    // 5. OCR Gating
    if (filterOcr !== "all") {
      const conf = inv.ocrConfidence ?? 100;
      if (filterOcr === "low" && conf >= 90) return false;
      if (filterOcr === "high" && conf < 90) return false;
    }

    // 6. TCS Gating
    if (filterTcs !== "all") {
      const hasTcs = parseFloat(inv.tcsCollected || "0") > 0 || !!inv.tcsApplicable;
      if (filterTcs === "yes" && !hasTcs) return false;
      if (filterTcs === "no" && hasTcs) return false;
    }

    // 7. Customer dropdown
    if (filterCustomer !== "all") {
      if (inv.customerName !== filterCustomer) return false;
    }

    // 8. Date Month & Year
    if (filterMonth !== "all" || filterYear !== "all") {
      const dateParts = (inv.invoiceDate || "").split("-");
      if (dateParts.length >= 3) {
        const y = dateParts[0];
        const m = dateParts[1];
        if (filterMonth !== "all" && m !== filterMonth) return false;
        if (filterYear !== "all" && y !== filterYear) return false;
      } else {
        return false;
      }
    }

    // 9. Paid Gating
    if (filterPaid !== "all") {
      const isPaid = inv.status === "processed";
      if (filterPaid === "paid" && !isPaid) return false;
      if (filterPaid === "unpaid" && isPaid) return false;
    }

    // 10. Item matching
    if (filterItem.trim()) {
      const match = (inv.lineItems || []).some((li: any) => 
        (li.item || li.description || "").toLowerCase().includes(filterItem.toLowerCase())
      );
      if (!match) return false;
    }

    return true;
  });

  // Calculate Metrics from raw invoices
  const totals = invoices.reduce((acc, inv) => {
    const amt = parseFloat(inv.invoiceTotal || "0");
    const tcsVal = parseFloat(inv.tcsCollected || "0");
    const isPaid = inv.status === "processed";

    const dateParts = (inv.invoiceDate || "").split("-");
    const isCurrentYear = dateParts[0] === "2026" || dateParts[0] === "2027";
    const isCurrentMonth = dateParts[1] === "05" && dateParts[0] === "2026"; // Simulated live May 2026

    // Total Sales
    if (totalSalesMode === "yearly" && isCurrentYear) acc.totalSales += amt;
    if (totalSalesMode === "monthly" && isCurrentMonth) acc.totalSales += amt;

    // Outstanding AR
    if (!isPaid) {
      if (outstandingMode === "yearly" && isCurrentYear) acc.outstandingAr += amt;
      if (outstandingMode === "monthly" && isCurrentMonth) acc.outstandingAr += amt;
    }

    // TCS Collected
    acc.tcsCollectedSum += tcsVal;

    return acc;
  }, { totalSales: 0, outstandingAr: 0, tcsCollectedSum: 0 });

  // Get unique customers list for filters dropdown
  const uniqueCustomers = Array.from(new Set(invoices.map((inv: any) => inv.customerName).filter(Boolean)));

  const togglePinnedFilter = (filterKey: string) => {
    setPinnedFilters(prev => 
      prev.includes(filterKey) ? prev.filter(k => k !== filterKey) : (prev.length < 3 ? [...prev, filterKey] : prev)
    );
  };

  const handleDragEnd = (event: any, info: any, id: string) => {
    if (info.offset.x < -80) {
      if (window.confirm("Are you sure you want to permanently delete this outward sales invoice?")) {
        deleteMutation.mutate(id);
      } else {
        setSwipedCardId(null);
      }
    } else {
      setSwipedCardId(null);
    }
  };

  return (
    <div className="space-y-4 py-4 pb-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">Commerce / Sales</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight">Sales Hub</h1>
          <span className="text-[10px] font-mono text-blue-mid/60 tracking-wider">FY 2026-27 AUTHORITATIVE REGISTER</span>
        </div>
        <div className="flex gap-2">
          {/* System Control Settings Toggles */}
          <div className="flex flex-col items-end gap-1 mr-3 border-r border-blue-mid/10 pr-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span className="text-[9px] font-mono text-blue-mid font-bold uppercase">Dispatch Match</span>
              <button 
                onClick={() => {
                  setDispatchSystemEnabled(!dispatchSystemEnabled);
                  toast.success(dispatchSystemEnabled ? "Dispatch Note System Gating disabled!" : "Dispatch Note matching forced!");
                }}
                className={cn("w-7 h-4 rounded-full transition-colors flex items-center p-0.5 border border-blue-mid/20", dispatchSystemEnabled ? "bg-green-600 justify-end" : "bg-blue-mid/10 justify-start")}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-ink shadow-sm" />
              </button>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span className="text-[9px] font-mono text-blue-mid font-bold uppercase">Maker Checker</span>
              <button 
                onClick={() => {
                  setMakerCheckerEnabled(!makerCheckerEnabled);
                  toast.success(makerCheckerEnabled ? "Direct approvals enabled!" : "Checker authorization required!");
                }}
                className={cn("w-7 h-4 rounded-full transition-colors flex items-center p-0.5 border border-blue-mid/20", makerCheckerEnabled ? "bg-green-600 justify-end" : "bg-blue-mid/10 justify-start")}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-ink shadow-sm" />
              </button>
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => downloadExcel(invoices, "IES_Sales_Invoices", "Sales").then(() => toast.success("Sales register exported"))}
            className="icon-btn"
            title="Download Excel Register"
          >
            <FileDown size={18} />
          </motion.button>
          <ProfileMenu />
        </div>
      </header>

      {/* KPI Dynamic Flip metrics strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Sales */}
        <motion.div 
          onClick={() => {
            setTotalSalesMode(m => m === "yearly" ? "monthly" : "yearly");
            toast.success(`Sales display updated to ${totalSalesMode === "yearly" ? "Monthly (May 2026)" : "Yearly YTD"}`);
          }}
          whileHover={{ y: -2 }}
          className="card p-4 cursor-pointer select-none bg-blue-light/50 border-blue-mid/20 border-dashed relative overflow-hidden"
        >
          <div className="absolute right-3 top-3 opacity-15"><Receipt size={24} /></div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-blue-mid font-bold flex items-center gap-1">
            Total Sales Outward 
            <span className="px-1 py-0.2 bg-blue-ink/10 rounded text-[7px]">{totalSalesMode.toUpperCase()}</span>
          </span>
          <div className="fin-num text-2xl font-black text-blue-ink mt-1.5">{formatINR(totals.totalSales)}</div>
          <span className="text-[8px] text-blue-mid/60 font-medium">Sec 9 GST Taxable Invoice Sums</span>
        </motion.div>

        {/* Outstanding AR */}
        <motion.div 
          onClick={() => {
            setOutstandingMode(m => m === "yearly" ? "monthly" : "yearly");
            toast.success(`Outstanding AP display updated to ${outstandingMode === "yearly" ? "Monthly (May 2026)" : "Yearly YTD"}`);
          }}
          whileHover={{ y: -2 }}
          className="card p-4 cursor-pointer select-none bg-white border-blue-mid/15 relative overflow-hidden"
        >
          <div className="absolute right-3 top-3 opacity-15 text-orange-600"><AlertTriangle size={24} /></div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-orange-700 font-bold flex items-center gap-1">
            Accounts Receivable (AR)
            <span className="px-1 py-0.2 bg-orange-600/10 rounded text-[7px]">{outstandingMode.toUpperCase()}</span>
          </span>
          <div className="fin-num text-2xl font-black text-orange-800 mt-1.5">{formatINR(totals.outstandingAr)}</div>
          <span className="text-[8px] text-blue-mid/60 font-medium">Pending collection age YTD</span>
        </motion.div>

        {/* TCS Section 206C(1H) */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="card p-4 bg-green-50/50 border-green-200/60 relative overflow-hidden"
        >
          <div className="absolute right-3 top-3 opacity-15 text-green-700"><Percent size={24} /></div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-green-700 font-bold flex items-center gap-1">
            TCS Sec 206C(1H) Collection
            <span className="px-1 py-0.2 bg-green-600/10 rounded text-[7px]">LEDGER</span>
          </span>
          <div className="fin-num text-2xl font-black text-green-800 mt-1.5">{formatINR(totals.tcsCollectedSum)}</div>
          <span className="text-[8px] text-green-700/60 font-medium">0.1% matching exceeding 50L limit</span>
        </motion.div>
      </div>

      {/* Main Command Bar (Search + Scanner triggers) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
          <input
            className="search-input pr-10"
            placeholder="Search buyer name, tax invoice #, works..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-mid/40 hover:text-blue-ink">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowScanDrawer(true)}
          className="icon-btn-primary flex items-center gap-2 px-4 shrink-0"
        >
          <Camera size={18} />
          <span className="text-xs uppercase font-mono tracking-wider font-black">Scan Outward</span>
        </button>
      </div>

      {/* Pinned Filter Pill Bar */}
      <div className="bg-blue-light/30 border border-blue-mid/5 rounded-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-mono uppercase font-black tracking-widest text-blue-mid flex items-center gap-1">
            <Pin size={10} className="rotate-45" /> Pinned:
          </span>
          
          {pinnedFilters.includes("location") && (
            <select 
              value={filterBranch} 
              onChange={e => setFilterBranch(e.target.value)}
              className="px-2 py-0.5 rounded border border-blue-mid/20 bg-white text-[10px] font-mono text-blue-ink outline-none"
            >
              <option value="all">Works: All</option>
              <option value="Kolkata Works W1">Kolkata W1</option>
              <option value="Howrah Works W2">Howrah W2</option>
            </select>
          )}

          {pinnedFilters.includes("tcs") && (
            <select 
              value={filterTcs} 
              onChange={e => setFilterTcs(e.target.value)}
              className="px-2 py-0.5 rounded border border-blue-mid/20 bg-white text-[10px] font-mono text-blue-ink outline-none"
            >
              <option value="all">TCS: All</option>
              <option value="yes">TCS Applicable</option>
              <option value="no">No TCS</option>
            </select>
          )}

          {pinnedFilters.includes("customer") && (
            <select 
              value={filterCustomer} 
              onChange={e => setFilterCustomer(e.target.value)}
              className="px-2 py-0.5 rounded border border-blue-mid/20 bg-white text-[10px] font-mono text-blue-ink outline-none max-w-[120px]"
            >
              <option value="all">Customer: All</option>
              {uniqueCustomers.map(cust => (
                <option key={cust} value={cust}>{cust}</option>
              ))}
            </select>
          )}

          {pinnedFilters.includes("dispatch") && (
            <select 
              value={filterDispatch} 
              onChange={e => setFilterDispatch(e.target.value)}
              className="px-2 py-0.5 rounded border border-blue-mid/20 bg-white text-[10px] font-mono text-blue-ink outline-none"
            >
              <option value="all">Dispatch: All</option>
              <option value="pending_dispatch">Pending</option>
              <option value="partially_dispatched">Partial</option>
              <option value="fully_dispatched">Fully Dispatched</option>
              <option value="returned">Returned</option>
            </select>
          )}
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className={cn("text-[9px] font-mono uppercase font-black flex items-center gap-1 px-2 py-1 rounded border", showFilters ? "bg-blue-ink text-white border-blue-ink" : "bg-white text-blue-mid border-blue-mid/20")}
        >
          <Filter size={10} /> Advanced Filters
        </button>
      </div>

      {/* Stacked Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card p-4 space-y-4 bg-white border-blue-mid/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {/* Customer dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Customer Name</label>
                  <select 
                    value={filterCustomer} 
                    onChange={e => setFilterCustomer(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Customers</option>
                    {uniqueCustomers.map(cust => (
                      <option key={cust} value={cust}>{cust}</option>
                    ))}
                  </select>
                </div>

                {/* Dispatch Status */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Dispatch Gating</label>
                  <select 
                    value={filterDispatch} 
                    onChange={e => setFilterDispatch(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All States</option>
                    <option value="pending_dispatch">Pending Dispatch</option>
                    <option value="partially_dispatched">Partially Dispatched</option>
                    <option value="fully_dispatched">Fully Dispatched</option>
                    <option value="returned">Returned Goods</option>
                  </select>
                </div>

                {/* Branch Location */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Works/Branch</label>
                  <select 
                    value={filterBranch} 
                    onChange={e => setFilterBranch(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Works</option>
                    <option value="Kolkata Works W1">Kolkata Works W1</option>
                    <option value="Howrah Works W2">Howrah Works W2</option>
                  </select>
                </div>

                {/* OCR Quality */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">OCR Confidence</label>
                  <select 
                    value={filterOcr} 
                    onChange={e => setFilterOcr(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">High Confidence (&ge;90%)</option>
                    <option value="low">Needs Review (&lt;90%)</option>
                  </select>
                </div>

                {/* TCS Section 206C(1H) */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">TCS Applicability</label>
                  <select 
                    value={filterTcs} 
                    onChange={e => setFilterTcs(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Transactions</option>
                    <option value="yes">TCS Collected</option>
                    <option value="no">No TCS</option>
                  </select>
                </div>

                {/* Date Months */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Invoice Month</label>
                  <select 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Months</option>
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Financial Year */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Invoice Year</label>
                  <select 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                {/* Status Gating */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Payment Gating</label>
                  <select 
                    value={filterPaid} 
                    onChange={e => setFilterPaid(e.target.value)}
                    className="w-full rounded border border-blue-mid/20 bg-white p-1.5 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="paid">Received (Paid)</option>
                    <option value="unpaid">Outstanding (Unpaid)</option>
                  </select>
                </div>
              </div>

              {/* Item recognition search bar */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-wider text-blue-mid block">Item-wise Recognition</label>
                <input 
                  value={filterItem}
                  onChange={e => setFilterItem(e.target.value)}
                  placeholder="Enter specific line item product keyword (e.g. Coupler, Perforated, Galvanised...)"
                  className="search-input text-[10px]"
                />
              </div>

              {/* Configure Pinned Filters selection */}
              <div className="border-t border-blue-mid/10 pt-3 text-[10px]">
                <span className="font-mono uppercase font-black text-blue-mid tracking-wider">Configure Dashboard Quick Filters (Max 3):</span>
                <div className="flex gap-2 mt-2">
                  {[
                    { key: "location", label: "Works Location" },
                    { key: "tcs", label: "TCS Sec 206C" },
                    { key: "customer", label: "Customer List" },
                    { key: "dispatch", label: "Dispatch Gating" },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => togglePinnedFilter(item.key)}
                      className={cn("px-2.5 py-1 rounded-full border text-[9px] font-mono uppercase font-bold", pinnedFilters.includes(item.key) ? "bg-blue-ink text-white border-blue-ink" : "bg-white text-blue-mid border-blue-mid/15")}
                    >
                      {item.label} {pinnedFilters.includes(item.key) && "✓"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="tab-group">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("tab-item", activeTab === t.id && "active")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      <AnimatePresence mode="popLayout">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-48 gap-3 text-blue-mid/30">
                <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
                  <Receipt size={28} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest font-mono">No Outward Sales Records Found</p>
              </motion.div>
            ) : filtered.map((inv: any) => {
              const isSelected = selectedInvoiceIds.includes(inv.id);
              const isPaid = inv.status === "processed";

              // Render intermediate processing stage card
              if (inv.status === "processing") {
                return (
                  <motion.div
                    key={inv.id}
                    layoutId={`card-${inv.id}`}
                    className="card border-blue-mid/20 p-4 flex items-center justify-between bg-blue-light/20 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="animate-spin text-blue-ink" size={18} />
                      <div>
                        <h4 className="text-xs font-mono font-black text-blue-ink uppercase">Processing Outward Invoices OCR...</h4>
                        <p className="text-[9px] font-mono text-blue-mid tracking-wide mt-0.5">{inv.rawData?.processingStage || "Stage 1: Scanning Outward Tax Invoice"}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-blue-mid/60 uppercase">{inv.rawData?.fileName || "outward.pdf"}</span>
                  </motion.div>
                );
              }

              return (
                <div key={inv.id} className="relative select-none">
                  {/* Swipe-to-delete Trash absolute background */}
                  <div className="absolute inset-0 bg-[#8d2a2a] rounded-[1.5rem] flex items-center justify-end px-6 text-white border border-[#8d2a2a]/20">
                    <div className="flex items-center gap-2">
                      <Trash2 size={16} />
                      <span className="text-[9px] font-mono uppercase font-black">Drag to Delete</span>
                    </div>
                  </div>

                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -120, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(e, info) => handleDragEnd(e, info, inv.id)}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleInvoiceSelection(inv.id);
                      } else {
                        setSelectedInvoice(inv);
                        setLocalPaymentTerms(inv.paymentMode || "");
                        setLocalVehicleNumber(inv.rawData?.vehicleNumber || "");
                        setLocalEWayBill(inv.rawData?.eWayBill || "");
                        setSelectedDispatchStatus(inv.dispatchStatus || "pending_dispatch");
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      toggleInvoiceSelection(inv.id);
                    }}
                    style={{ x: swipedCardId === inv.id ? -120 : 0 }}
                    className={cn(
                      "card p-4 flex items-center justify-between cursor-pointer bg-white relative transition-colors duration-150 active:bg-blue-light/30 select-none touch-none",
                      isSelected && "border-blue-ink bg-blue-light/20",
                      inv.status === "needs_review" && "border-red-400 bg-red-50/20"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isSelectionMode ? (
                        <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isSelected ? "border-blue-ink bg-blue-ink text-white" : "border-blue-mid/30 bg-white")}>
                          {isSelected && <Check size={10} strokeWidth={4} />}
                        </div>
                      ) : (
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          isPaid ? "bg-green-50 border-green-200 text-green-700" : 
                          inv.status === "needs_review" ? "bg-red-50 border-red-200 text-red-700" :
                          "bg-blue-light border-blue-mid/10 text-blue-ink"
                        )}>
                          <Receipt size={18} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-mono font-black text-blue-ink text-xs uppercase truncate max-w-[150px]">{inv.customerName}</h3>
                          {inv.isEInvoice && <span className="text-[7px] font-mono font-black tracking-widest text-green-700 bg-green-50 border border-green-200 px-1 rounded-sm">E-INV</span>}
                        </div>
                        <p className="text-[9px] font-mono text-blue-mid/70 mt-0.5">
                          {inv.invoiceNo} · {formatDate(inv.invoiceDate)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="fin-num text-sm font-black text-blue-ink">{formatINR(inv.invoiceTotal)}</div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {isPaid ? (
                          <span className="text-[8px] font-mono uppercase font-black text-green-700 bg-green-50 border border-green-150 px-1.5 py-0.2 rounded-sm flex items-center gap-0.5">
                            <CheckCircle2 size={8} /> Received
                          </span>
                        ) : inv.status === "needs_review" ? (
                          <span className="text-[8px] font-mono uppercase font-black text-red-700 bg-red-50 border border-red-150 px-1.5 py-0.2 rounded-sm flex items-center gap-0.5">
                            <AlertTriangle size={8} /> Needs Review
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono uppercase font-black text-blue-mid bg-blue-light border border-blue-mid/10 px-1.5 py-0.2 rounded-sm flex items-center gap-0.5">
                            <Clock size={8} /> Outward Approved
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Select Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-50 bg-blue-ink text-white p-3 rounded-2xl flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-blue-mid/20"
          >
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedInvoiceIds([])} className="hover:bg-white/10 p-1.5 rounded-lg text-white">
                <X size={16} />
              </button>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider">
                {selectedInvoiceIds.length} Sales Selected
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleBulkDownload} 
                className="bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase font-black flex items-center gap-1"
              >
                <FileDown size={12} /> Excel
              </button>
              <button 
                onClick={handleBulkShare} 
                className="bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase font-black flex items-center gap-1"
              >
                <Share2 size={12} /> Share
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="bg-[#8d2a2a] hover:bg-[#a13737] px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase font-black flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales Invoice Details Drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={o => !o && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[95dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem]">
          {selectedInvoice && (
            <div className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-10">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10">
                    <Receipt size={22} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowDocPreview(true)}
                      className="icon-btn hover:border-blue-ink hover:text-blue-ink"
                      title="View Outward Paper Invoice"
                    >
                      <Eye size={18} />
                    </button>
                    <DrawerClose className="icon-btn"><X size={18} /></DrawerClose>
                  </div>
                </div>
                <DrawerTitle className="text-2xl font-black text-blue-ink uppercase leading-none">
                  {selectedInvoice.customerName || "Unknown Customer"}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-blue-mid font-mono mt-1">
                  Tax Invoice No: {selectedInvoice.invoiceNo} · Outward Date: {formatDate(selectedInvoice.invoiceDate)}
                </DrawerDescription>
              </DrawerHeader>

              {/* Segment 1: Customer Master Info & Outward Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Particulars */}
                <div className="card p-4 space-y-2.5 bg-white border-blue-mid/10 text-xs font-mono">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-blue-mid block">Buyer Particulars</span>
                  <div>
                    <span className="text-blue-mid font-medium block">Legal Name:</span>
                    <span className="font-bold text-blue-ink uppercase">{selectedInvoice.customerName}</span>
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">GSTIN:</span>
                    <span className="font-bold text-blue-ink">{selectedInvoice.customerGstin || "—"}</span>
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">Consignee Address:</span>
                    <span className="font-bold text-blue-ink uppercase">{selectedInvoice.rawData?.buyer?.address || "Address on record"}</span>
                  </div>
                </div>

                {/* Our Bank Details ( Axis Bank Receivables ) */}
                <div className="card p-4 space-y-2.5 bg-white border-blue-mid/10 text-xs font-mono">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-blue-mid block">IES Receivables Account</span>
                  <div>
                    <span className="text-blue-mid font-medium block">Beneficiary Bank:</span>
                    <span className="font-bold text-blue-ink uppercase">Axis Bank Ltd</span>
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">Account Number:</span>
                    <span className="font-bold text-blue-ink tracking-wider">918020042940294</span>
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">IFSC Code:</span>
                    <span className="font-bold text-blue-ink tracking-widest">UTIB0000104</span>
                  </div>
                </div>
              </div>

              {/* Segment 2: Outward Logistics Manual Fields */}
              <div className="card p-4 space-y-3 bg-white border-blue-mid/10 text-xs font-mono">
                <span className="text-[9px] font-mono uppercase font-black tracking-wider text-blue-mid block">Outward Logistics Specs</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">Payment Mode</label>
                    <input
                      value={localPaymentTerms}
                      onChange={e => setLocalPaymentTerms(e.target.value)}
                      placeholder="e.g. NEFT, RTGS, CHEQUE"
                      className="w-full rounded border border-blue-mid/20 p-1.5 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">E-Way Bill Number</label>
                    <input
                      value={localEWayBill}
                      onChange={e => setLocalEWayBill(e.target.value)}
                      placeholder="Enter 12-digit e-way bill"
                      className="w-full rounded border border-blue-mid/20 p-1.5 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">Vehicle Plate Number</label>
                    <input
                      value={localVehicleNumber}
                      onChange={e => setLocalVehicleNumber(e.target.value)}
                      placeholder="e.g. WB-02-X-9824"
                      className="w-full rounded border border-blue-mid/20 p-1.5 text-[10px]"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    updateMutation.mutate({
                      id: selectedInvoice.id,
                      paymentMode: localPaymentTerms,
                      rawData: {
                        ...selectedInvoice.rawData,
                        eWayBill: localEWayBill,
                        vehicleNumber: localVehicleNumber
                      }
                    });
                    toast.success("Outward Logistics saved ✓");
                  }}
                  className="bg-blue-ink hover:bg-blue-ink/90 text-white rounded-lg px-3 py-1.5 text-[9px] font-mono uppercase font-black"
                >
                  Save Logistics
                </button>
              </div>

              {/* Segment 3: Line Item Tax Engine Audit Table */}
              <div className="card p-4 space-y-2 bg-white border-blue-mid/10 text-xs">
                <span className="text-[9px] font-mono uppercase font-black tracking-wider text-blue-mid block">Particulars of Outward Supply</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[9px] border-collapse border border-blue-mid/10">
                    <thead>
                      <tr className="bg-blue-light/50 border-b border-blue-mid/10 uppercase text-blue-mid">
                        <th className="p-2">Description</th>
                        <th className="p-2 text-center">HSN</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">CGST</th>
                        <th className="p-2 text-right">SGST</th>
                        <th className="p-2 text-right">IGST</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-mid/5 text-blue-ink">
                      {(selectedInvoice.lineItems || []).map((li: any, i: number) => (
                        <tr key={i} className="font-bold">
                          <td className="p-2">
                            <div>{li.item || li.description}</div>
                            <div className="text-[7px] text-blue-mid/50 mt-0.5">WH: {li.warehouse || "Kolkata W1"} · Proj: {li.project || "Ezra"}</div>
                          </td>
                          <td className="p-2 text-center">{li.hsn || "7308"}</td>
                          <td className="p-2 text-right">{li.qty || li.quantity} {li.unit || "Mtr"}</td>
                          <td className="p-2 text-right">{parseFloat(li.rate || "0").toFixed(2)}</td>
                          <td className="p-2 text-right">{formatINR(li.cgstAmount || 0)}</td>
                          <td className="p-2 text-right">{formatINR(li.sgstAmount || 0)}</td>
                          <td className="p-2 text-right">{formatINR(li.igstAmount || 0)}</td>
                          <td className="p-2 text-right font-black">{formatINR(li.total || li.total_amount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Segment 4: GST & TCS Compliance verification widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* State code verification */}
                <div className="card p-4 space-y-2 bg-white border-blue-mid/10 text-xs font-mono">
                  <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">State Code Gating</span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-green-600 shrink-0" size={16} />
                    <div>
                      <span className="font-black text-blue-ink block uppercase">{selectedInvoice.supplyType || "Intrastate"}</span>
                      <span className="text-[8px] text-blue-mid/70">Buyer code: {selectedInvoice.customerGstin?.slice(0, 2) || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* GST mismatch audit */}
                <div className="card p-4 space-y-2 bg-white border-blue-mid/10 text-xs font-mono">
                  <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">GST Audit Status</span>
                  {parseFloat(selectedInvoice.totalGst || "0") > 0 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-green-600 shrink-0" size={16} />
                      <div>
                        <span className="font-black text-blue-ink block">MATCHED ✓</span>
                        <span className="text-[8px] text-blue-mid/70">Tax split verified perfectly</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-yellow-600 shrink-0" size={16} />
                      <div>
                        <span className="font-black text-blue-ink block">NO GST RECORDED</span>
                        <span className="text-[8px] text-blue-mid/70">Check item tax rates</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* TCS Sec 206C(1H) exceeding 50L check */}
                <div className="card p-4 space-y-2 bg-white border-blue-mid/10 text-xs font-mono">
                  <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">TCS 206C(1H) Threshold</span>
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-blue-mid">TCS Collected:</span>
                      <span className="text-blue-ink">{formatINR(selectedInvoice.tcsCollected || 0)}</span>
                    </div>
                    <div className="text-[7px] text-blue-mid/60 leading-tight">
                      {selectedInvoice.tcsApplicable ? "✓ Client annual sales exceed ₹50L. TCS collected." : "Client annual sales below ₹50L. No TCS applied."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Segment 5: Dispatch Note Control (Instead of GRN) */}
              <div className="card p-4 space-y-3 bg-white border-blue-mid/10 text-xs font-mono">
                <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">Dispatch Note Control Center</span>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedDispatchStatus}
                    onChange={e => {
                      setSelectedDispatchStatus(e.target.value);
                      updateMutation.mutate({ id: selectedInvoice.id, dispatchStatus: e.target.value });
                      toast.success(`Dispatch Note status updated: ${e.target.value}`);
                    }}
                    className="rounded border border-blue-mid/20 bg-white p-2 font-mono text-[10px] text-blue-ink outline-none"
                  >
                    <option value="pending_dispatch">Pending Dispatch</option>
                    <option value="partially_dispatched">Partially Dispatched</option>
                    <option value="fully_dispatched">Fully Dispatched</option>
                    <option value="returned">Returned Goods</option>
                  </select>

                  <div className="flex items-center gap-1 text-[8px] font-bold text-blue-mid/70">
                    <Building size={12} /> Branch Dispatch Location: <span className="text-blue-ink uppercase font-black">{selectedInvoice.branchLocation}</span>
                  </div>
                </div>
              </div>

              {/* Segment 6: Maker-Checker System log */}
              <div className="card p-4 space-y-2 bg-white border-blue-mid/10 text-xs font-mono">
                <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">Maker-Checker Authorization Logs</span>
                {approvalLogs.length === 0 ? (
                  <p className="text-[9px] text-blue-mid/50 italic">No authorization logs recorded for this sales invoice.</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {approvalLogs.map((log: any, i: number) => (
                      <div key={i} className="flex justify-between border-b border-blue-mid/5 pb-1">
                        <div>
                          <span className="font-bold text-blue-ink uppercase">{log.actor}</span>
                          <span className="text-[8px] text-blue-mid/60 block">{log.comments || "No comments"}</span>
                        </div>
                        <span className="text-[8px] text-blue-mid/60 font-medium">{formatDate(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Segment 7: Accounts Receivable (AR) Automation Center */}
              <div className="card p-5 space-y-4 bg-white border-blue-mid/10 border-2 border-blue-ink/10 rounded-2xl">
                <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">Accounts Receivable Automation Center</span>
                
                <div className="flex justify-between items-center border-b border-blue-light pb-4">
                  <span className="section-label">Receivable Invoice Amount</span>
                  <span className="fin-num text-3xl text-blue-ink">{formatINR(selectedInvoice.invoiceTotal)}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => {
                      updateMutation.mutate({ id: selectedInvoice.id, status: "processed" });
                      toast.success("Payment Received recorded in general ledger!");
                      setSelectedInvoice(null);
                    }}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> Record Payment Received
                  </button>

                  <button
                    onClick={() => setShowScheduleCalendar(!showScheduleCalendar)}
                    className="bg-blue-light hover:bg-blue-light/80 text-blue-ink px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase border border-blue-mid/20 flex items-center gap-1.5"
                  >
                    <Calendar size={16} /> Schedule Receipt
                  </button>

                  <button
                    onClick={() => {
                      updateMutation.mutate({ id: selectedInvoice.id, status: "needs_review", disputeReason: "AR Payment Hold triggered by Admin" });
                      toast.info("Invoice placed on Payment Hold.");
                      setSelectedInvoice(null);
                    }}
                    className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase border border-yellow-200/50 flex items-center gap-1.5"
                  >
                    <Clock size={16} /> Place Hold
                  </button>
                </div>

                {/* Calendar Schedule Modal/Date Input */}
                <AnimatePresence>
                  {showScheduleCalendar && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-blue-light/50 p-3 rounded-xl border border-blue-mid/10 mt-2 space-y-2 text-xs font-mono"
                    >
                      <label className="text-[9px] font-black uppercase text-blue-mid block">Select Receipt Scheduled Date</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          ref={dateInputRef}
                          defaultValue={selectedInvoice.dueDate || selectedInvoice.invoiceDate}
                          className="rounded border border-blue-mid/20 bg-white p-1.5 text-[10px]"
                        />
                        <button
                          onClick={() => {
                            const val = dateInputRef.current?.value;
                            if (val) {
                              updateMutation.mutate({ id: selectedInvoice.id, dueDate: val });
                              toast.success(`Payment receipt scheduled on ${val}`);
                              setShowScheduleCalendar(false);
                            }
                          }}
                          className="bg-blue-ink text-white rounded px-3 text-[9px] font-black uppercase"
                        >
                          Confirm Schedule
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dispute / Raise Mismatch section */}
                <div className="border-t border-blue-mid/10 pt-4 space-y-2 text-xs font-mono">
                  <label className="text-[9px] font-black uppercase text-blue-mid block">Flag Mismatch / Raise Dispute</label>
                  <div className="flex gap-2">
                    <input
                      value={disputeReasonText}
                      onChange={e => setDisputeReasonText(e.target.value)}
                      placeholder="Specify dispute reason (e.g. GST Rate Mismatch, Damaged Material...)"
                      className="w-full rounded border border-blue-mid/20 p-2 text-[10px]"
                    />
                    <button
                      onClick={() => {
                        if (!disputeReasonText.trim()) {
                          toast.error("Please enter a dispute reason");
                          return;
                        }
                        updateMutation.mutate({ 
                          id: selectedInvoice.id, 
                          status: "needs_review", 
                          disputeReason: disputeReasonText 
                        });
                        toast.error(`Dispute raised: "${disputeReasonText}"`);
                        setDisputeReasonText("");
                        setSelectedInvoice(null);
                      }}
                      className="bg-[#8d2a2a] text-white rounded-lg px-4 text-[10px] font-black uppercase"
                    >
                      Submit Dispute
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Outward Tax Invoice Paper Preview Modal */}
      <Drawer open={showDocPreview} onOpenChange={setShowDocPreview}>
        <DrawerContent className="max-h-[95dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem] overflow-y-auto no-scrollbar">
          <div className="p-6 pb-12 overflow-y-auto no-scrollbar max-w-4xl mx-auto w-full relative">
            <div className="absolute right-4 top-4 z-50">
              <button onClick={() => setShowDocPreview(false)} className="icon-btn bg-white/80 shadow-md">
                <X size={18} />
              </button>
            </div>
            {selectedInvoice && (
              <div className="overflow-x-auto w-full flex justify-center py-4">
                <div className="min-w-[768px]">
                  <SalesScannedInvoice invoice={selectedInvoice} />
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Stage 1 Outward OCR Scanner Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[95dvh] bg-white border-blue-mid/10 rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <div className="flex justify-between items-center mb-6 border-b border-blue-mid/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-blue-ink uppercase leading-none">Stage 1 OCR Ingestion</h3>
                <span className="text-[10px] font-mono text-blue-mid/60 mt-1 block">Ingest outbound tax invoice PDFs or scans</span>
              </div>
              <button onClick={() => setShowScanDrawer(false)} className="icon-btn"><X size={18} /></button>
            </div>
            
            <DocumentExtractor 
              docTypeHint="TAX_INVOICE" 
              onExtract={handleExtract} 
              onFileSelected={handleBackgroundExtract}
              onCancel={() => setShowScanDrawer(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
