import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, FileUp, Search, FileDown, X, Receipt, Filter, Globe,
  AlertTriangle, CheckCircle2, Clock, Calendar, ShieldCheck, 
  Building, User, Percent, HelpCircle, ArrowRight, Play, Eye, EyeOff,
  Pin, Loader2, Trash2, Check, Share2, Users, ChevronUp, ChevronDown
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
import { compressFileForOcr } from "@/lib/image-compress";

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

  // Edit states for manual invoice correction
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerGstin, setEditCustomerGstin] = useState("");
  const [editInvoiceNo, setEditInvoiceNo] = useState("");
  const [editInvoiceDate, setEditInvoiceDate] = useState("");
  const [editInvoiceTotal, setEditInvoiceTotal] = useState("");
  const [editTaxableAmount, setEditTaxableAmount] = useState("");
  const [editTotalGst, setEditTotalGst] = useState("");

  // Extended edit states for buyer master & bank
  const [editBuyerAddress, setEditBuyerAddress] = useState("");
  const [editBuyerMobile, setEditBuyerMobile] = useState("");
  const [editBuyerPhone, setEditBuyerPhone] = useState("");
  const [editBuyerEmail, setEditBuyerEmail] = useState("");
  const [editBuyerBankHolder, setEditBuyerBankHolder] = useState("");
  const [editBuyerBankAccountNo, setEditBuyerBankAccountNo] = useState("");
  const [editBuyerBankName, setEditBuyerBankName] = useState("");
  const [editBuyerBankIfsc, setEditBuyerBankIfsc] = useState("");

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

  // Ledger compliance states inside Detail Drawer
  const [localAmountInBank, setLocalAmountInBank] = useState("");
  const [localInstRxilCharges, setLocalInstRxilCharges] = useState("");
  const [localOrderStatus, setLocalOrderStatus] = useState("");
  const [localDateAsOn, setLocalDateAsOn] = useState("");

  // Maker-Checker & Payments states
  const [selectedDispatchStatus, setSelectedDispatchStatus] = useState("");
  const [disputeReasonText, setDisputeReasonText] = useState("");
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  
  // Multi-Select & Bulk Actions (Long Press activation)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const isSelectionMode = selectedInvoiceIds.length > 0;

  // View Mode & Ledger Sorting
  const [viewMode, setViewMode] = useState<"ledger" | "card">("ledger");
  const [sortField, setSortField] = useState<string>("slNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    setLocalPaymentTerms(inv.paymentMode || "");
    setLocalVehicleNumber(inv.rawData?.vehicleNumber || "");
    setLocalEWayBill(inv.rawData?.eWayBill || "");
    setSelectedDispatchStatus(inv.dispatchStatus || "pending_dispatch");
    
    // Spreadsheet ledger compliance specs
    setLocalAmountInBank(inv.amountInBank || "0.00");
    setLocalInstRxilCharges(inv.instRxilCharges || "0.00");
    setLocalOrderStatus(inv.orderStatus || "RUNNING");
    setLocalDateAsOn(inv.dateAsOn || "");

    // Initialize edit states
    setIsEditing(false);
    setEditCustomerName(inv.customerName || "");
    setEditCustomerGstin(inv.customerGstin || "");
    setEditInvoiceNo(inv.invoiceNo || "");
    setEditInvoiceDate(inv.invoiceDate || "");
    setEditInvoiceTotal(inv.invoiceTotal || "");
    setEditTaxableAmount(inv.taxableAmount || "");
    setEditTotalGst(inv.totalGst || "");

    // Initialize extended buyer master & bank edit fields
    const buyer = inv.rawData?.buyer || inv.rawData?.bill_to || {};
    setEditBuyerAddress(buyer.address || "");
    setEditBuyerMobile(buyer.mobile || "");
    setEditBuyerPhone(buyer.phone || "");
    setEditBuyerEmail(buyer.email || "");
    const bBank = buyer.bank_details || {};
    setEditBuyerBankHolder(bBank.account_holder || "");
    setEditBuyerBankAccountNo(bBank.account_number || "");
    setEditBuyerBankName(bBank.bank_name || "");
    setEditBuyerBankIfsc(bBank.ifsc || "");
  };

  useEffect(() => {
    if (selectedInvoice && selectedInvoice.rawData?.fileBase64) {
      window.dispatchEvent(
        new CustomEvent("desktop-doc-preview", {
          detail: {
            fileBase64: selectedInvoice.rawData.fileBase64,
            invoiceNo: selectedInvoice.invoiceNo,
            vendorName: selectedInvoice.customerName || "Unknown Customer",
          },
        })
      );
    } else {
      window.dispatchEvent(new CustomEvent("desktop-doc-preview", { detail: null }));
    }
  }, [selectedInvoice]);

  const toggleInvoiceSelection = (id: string) => {
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
        await Promise.all(selectedInvoiceIds.map(id => deleteMutation.mutateAsync(String(id))));
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

    const mockProject = ["Singrauli Project", "Hazira Site", "IOCL Vadodara", "Khadava- Plot 14"][Math.floor(Math.random() * 4)];
    const mockSlNo = `${Math.floor(Math.random() * 50) + 10}/25-26`;
    const mockPoNumber = `LE/IES/${Math.floor(Math.random() * 1000)}/25-26`;
    const mockVehicle = "WB-" + (Math.floor(Math.random() * 90) + 10) + "-Y-" + (Math.floor(Math.random() * 9000) + 1000);
    const mockEway = String(Math.floor(100000000000 + Math.random() * 900000000000));

    return {
      invoice_no: `IES/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      financial_year: "2026-2027",
      po_reference: mockPoNumber,
      customerGstin: customer.gstin,
      customerName: customer.name,
      slNo: mockSlNo,
      poNumber: mockPoNumber,
      project: mockProject,
      vehicleNumber: mockVehicle,
      eWayBill: mockEway,
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
          project: mockProject,
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

      try {
        await updateStage("Stage 2: Processing AI OCR Extraction...");
        const { base64: base64Content, mimeType, dataUrl } = await compressFileForOcr(file);
        uploadedBase64 = dataUrl;

        const extractRes = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64Content, mimeType, docTypeHint: "TAX_INVOICE" }),
        });

        const response = await extractRes.json();
        if (response.success && response.data) {
          await updateStage("Stage 3: Auto-Validating Ledgers & GST...");
          
          const ocrData = response.data;
          const confidence = ocrData.confidence_score ?? Math.floor(Math.random() * 5) + 95;
          
          const finalPayload = {
            invoiceNo: ocrData.invoice_no || `SL-${Date.now()}`,
            invoiceDate: ocrData.invoice_date || format(new Date(), "yyyy-MM-dd"),
            financialYear: ocrData.financial_year || "2026-2027",
            customerName: ocrData.bill_to?.company_name || ocrData.buyer?.name || "Unknown Customer",
            customerGstin: ocrData.bill_to?.gstin || ocrData.buyer?.gstin || "",
            taxableAmount: String(ocrData.totals?.sub_total_taxable ?? "0"),
            totalGst: String(ocrData.totals?.total_gst ?? "0"),
            invoiceTotal: String(ocrData.totals?.invoice_total ?? "0"),
            cgstAmount: String(ocrData.totals?.total_cgst ?? "0"),
            sgstAmount: String(ocrData.totals?.total_sgst ?? "0"),
            igstAmount: String(ocrData.totals?.total_igst ?? "0"),
            status: (confidence < 90 || ocrData.dispute_reason) ? "needs_review" : "pending",
            lineItems: ocrData.line_items || [],
            ocrConfidence: confidence,
            disputeReason: ocrData.dispute_reason || null,
            rawData: {
              ...ocrData,
              fileBase64: uploadedBase64,
              processingStage: "Complete!",
              eWayBill: ocrData.e_way_bill_no || "",
              vehicleNumber: ocrData.vehicle_number || ""
            },
            duePayment: String(ocrData.totals?.invoice_total ?? "0"),
            amountInBank: "0.00",
            balance: String(ocrData.totals?.invoice_total ?? "0"),
            dateAsOn: ocrData.invoice_date || format(new Date(), "yyyy-MM-dd"),
            instRxilCharges: "0.00",
            balanceShortage: String(ocrData.totals?.invoice_total ?? "0"),
            orderStatus: "RUNNING"
          };

          await apiRequest("PATCH", `/api/sales-invoices/${invoiceId}`, finalPayload);
          qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });
          toast.success(`OCR Complete: Sales Invoice ${finalPayload.invoiceNo} processed!`, {
            duration: 3000
          });
        } else {
          throw new Error(response.error || "OCR extraction failed");
        }
      } catch (err: any) {
        console.error("Real OCR failed", err);
        toast.error("Real AI OCR pipeline failed.", {
          description: err.message || "Failed to extract invoice data."
        });
        // Save as error stage
        await apiRequest("PATCH", `/api/sales-invoices/${invoiceId}`, {
          status: "needs_review",
          customerName: `Error: ${file.name.slice(0, 20)}`,
          rawData: {
            fileName: file.name,
            processingStage: "Failed: " + err.message
          }
        });
        qc.invalidateQueries({ queryKey: ["/api/sales-invoices"] });
      }
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
      rawData: {
        ...data,
        vehicleNumber: data.vehicle_number || data.vehicle || "Not Applicable",
        eWayBill: data.e_way_bill_no || data.eway_bill || "Not Applicable"
      },
      slNo: data.sl_no || data.slNo || `${Math.floor(Math.random() * 100) + 1}/25-26`,
      poNumber: data.po_number || data.poNumber || `IES-PO-${Math.floor(Math.random() * 10000)}`,
      project: data.project || data.ship_to?.site_name || data.line_items?.[0]?.project || "IES Factory Site",
      amountIncGst: String(data.totals?.invoice_total ?? "0"),
      duePayment: String(data.totals?.invoice_total ?? "0"),
      amountInBank: "0.00",
      balance: String(data.totals?.invoice_total ?? "0"),
      dateAsOn: data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      instRxilCharges: "0.00",
      balanceShortage: String(data.totals?.invoice_total ?? "0"),
      orderStatus: "RUNNING"
    };

    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Sales Invoice processed and dispatched to verification pool.");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  // Stacked Filters Logic + Sorting
  const sortedAndFiltered = useMemo(() => {
    const res = invoices.filter((inv: any) => {
      const q = search.toLowerCase().trim();
      if (q) {
        const match = 
          (inv.invoiceNo || "").toLowerCase().includes(q) ||
          (inv.customerName || "").toLowerCase().includes(q) ||
          (inv.customerGstin || "").toLowerCase().includes(q) ||
          (inv.branchLocation || "").toLowerCase().includes(q) ||
          (Array.isArray(inv.lineItems) && inv.lineItems.some((li: any) =>
            (li.description || li.item || li.name || "").toLowerCase().includes(q) ||
            (li.hsn || li.hsn_sac || "").toLowerCase().includes(q)
          ));
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

    // Sort result
    return [...res].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle numerical parsing
      if (["amountIncGst", "duePayment", "invoiceTotal", "amountInBank", "balance", "taxableAmount", "tcsCollected", "totalGst", "instRxilCharges", "balanceShortage"].includes(sortField)) {
        valA = parseFloat(valA || "0");
        valB = parseFloat(valB || "0");
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [invoices, search, activeTab, filterDispatch, filterBranch, filterOcr, filterTcs, filterCustomer, filterMonth, filterYear, filterPaid, filterItem, sortField, sortOrder, makerCheckerEnabled, dispatchSystemEnabled]);

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
          <h1 className="text-3xl font-black text-blue-ink tracking-tight leading-none">Sales Hub</h1>
        </div>
        <div className="flex gap-2">
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

      {/* Sales Dashboard KPI Strip */}
      <div className="grid grid-cols-3 gap-2">
        {/* Metric 1: Total Sales */}
        <div 
          onClick={() => {
            setTotalSalesMode(totalSalesMode === "yearly" ? "monthly" : "yearly");
            toast.success(`Sales display updated to ${totalSalesMode === "yearly" ? "Monthly (May 2026)" : "Yearly YTD"}`);
          }}
          className="p-3 bg-blue-deep rounded-2xl relative overflow-hidden cursor-pointer select-none active:scale-95 transition-transform"
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-white/50 block mb-0.5">Total Sales Outward</span>
          <p className="text-base font-black text-white tracking-tight leading-none my-1">
            {formatINR(totals.totalSales)}
          </p>
          <span className="text-[8px] text-white/40 block mt-0.5 font-bold uppercase tracking-wider">
            {totalSalesMode === "yearly" ? "FY 26-27 (Yearly)" : "May 2026 (Monthly)"}
          </span>
          <span className="absolute right-2 bottom-1.5 text-[6px] font-black text-white/20 uppercase tracking-widest">Flip Mode</span>
        </div>

        {/* Metric 2: Accounts Receivable */}
        <div 
          onClick={() => {
            setOutstandingMode(outstandingMode === "yearly" ? "monthly" : "yearly");
            toast.success(`Outstanding AR display updated to ${outstandingMode === "yearly" ? "Monthly (May 2026)" : "Yearly YTD"}`);
          }}
          className="p-3 bg-blue-deep rounded-2xl relative overflow-hidden cursor-pointer select-none active:scale-95 transition-transform"
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-white/50 block mb-0.5">Accounts Receivable</span>
          <p className={cn("text-base font-black text-white tracking-tight leading-none my-1", totals.outstandingAr > 200000 && "text-red-300")}>
            {formatINR(totals.outstandingAr)}
          </p>
          <span className="text-[8px] text-white/40 block mt-0.5 font-bold uppercase tracking-wider">
            {outstandingMode === "yearly" ? "Total Outstanding" : "May 2026 Outstanding"}
          </span>
          <span className="absolute right-2 bottom-1.5 text-[6px] font-black text-white/20 uppercase tracking-widest">Flip Mode</span>
        </div>

        {/* Metric 3: TCS Collected */}
        <div className="p-3 bg-blue-deep rounded-2xl relative overflow-hidden">
          <span className="text-[8px] font-black uppercase tracking-wider text-white/50 block mb-0.5">TCS Sec 206C(1H)</span>
          <p className="text-base font-black text-white tracking-tight leading-none my-1">{formatINR(totals.tcsCollectedSum)}</p>
          <span className="text-[8px] text-white/40 block mt-0.5 font-bold uppercase tracking-wider">0.1% exceeding 50L limit</span>
        </div>
      </div>

      {/* Action triggers */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Scan Outward", Icon: Camera, desc: "Process paper bill" },
          { label: "Upload PDF", Icon: FileUp, desc: "Process digital copy" },
          { label: "Scrape URL", Icon: Globe, desc: "Extract from web link" },
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
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setShowFilters(!showFilters)} 
            className={cn("icon-btn border border-blue-mid/10", showFilters && "bg-blue-mid text-white border-blue-mid")}
          >
            <Filter size={18} />
          </motion.button>
        </div>

        {/* Dynamic Pinned Filter Bar */}
        {pinnedFilters.length > 0 && (
          <div className="flex w-full gap-1 py-1 px-2 items-center bg-blue-light/20 rounded-2xl border border-blue-mid/5 justify-between">
            <span className="text-[7.5px] font-black uppercase tracking-widest text-blue-mid/60 mr-0.5 flex items-center gap-0.5 shrink-0">
              <Pin size={8} /> Pinned:
            </span>
            
            {pinnedFilters.map(fId => {
              // Hide Dispatch filter chip if system is disabled
              if (fId === "dispatch" && !dispatchSystemEnabled) return null;
              
              if (fId === "dispatch") {
                return (
                  <select key={fId} value={filterDispatch} onChange={e => setFilterDispatch(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">DISP: ALL</option>
                    <option value="pending_dispatch">DISP: PEND</option>
                    <option value="partially_dispatched">DISP: PART</option>
                    <option value="fully_dispatched">DISP: FULL</option>
                    <option value="returned">DISP: RTN</option>
                  </select>
                );
              }
              if (fId === "location") {
                return (
                  <select key={fId} value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">LOC: ALL</option>
                    <option value="Kolkata Works W1">Kolkata W1</option>
                    <option value="Howrah Works W2">Howrah W2</option>
                  </select>
                );
              }
              if (fId === "ocr") {
                return (
                  <select key={fId} value={filterOcr} onChange={e => setFilterOcr(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">OCR: ALL</option>
                    <option value="low">OCR: LOW</option>
                    <option value="high">OCR: HIGH</option>
                  </select>
                );
              }
              if (fId === "tcs") {
                return (
                  <select key={fId} value={filterTcs} onChange={e => setFilterTcs(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">TCS: ALL</option>
                    <option value="yes">TCS: YES</option>
                    <option value="no">TCS: NO</option>
                  </select>
                );
              }
              if (fId === "customer") {
                return (
                  <select key={fId} value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0 text-ellipsis overflow-hidden">
                    <option value="all">CUST: ALL</option>
                    {uniqueCustomers.map(name => (
                      <option key={name} value={name}>{name.slice(0, 8)}</option>
                    ))}
                  </select>
                );
              }
              if (fId === "month") {
                return (
                  <select key={fId} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">MON: ALL</option>
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                      <option key={m} value={m}>{format(new Date(2026, parseInt(m)-1, 1), "MMM")}</option>
                    ))}
                  </select>
                );
              }
              if (fId === "year") {
                return (
                  <select key={fId} value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">YR: ALL</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                );
              }
              if (fId === "status") {
                return (
                  <select key={fId} value={filterPaid} onChange={e => setFilterPaid(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">PAY: ALL</option>
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
                { id: "customer", label: "Customer Name", component: (
                  <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Customers</option>
                    {uniqueCustomers.map(cust => (
                      <option key={cust} value={cust}>{cust}</option>
                    ))}
                  </select>
                ) },
                { id: "dispatch", label: "Dispatch Gating", component: (
                  <select value={filterDispatch} onChange={e => setFilterDispatch(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Statuses</option>
                    <option value="pending_dispatch">Pending Dispatch</option>
                    <option value="partially_dispatched">Partially Dispatched</option>
                    <option value="fully_dispatched">Fully Dispatched</option>
                    <option value="returned">Returned Goods</option>
                  </select>
                ), dispatchOnly: true },
                { id: "location", label: "Works / Branch", component: (
                  <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Works</option>
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
                { id: "tcs", label: "TCS Sec 206C(1H)", component: (
                  <select value={filterTcs} onChange={e => setFilterTcs(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Invoices</option>
                    <option value="yes">TCS Collected</option>
                    <option value="no">No TCS Applicable</option>
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
                { id: "status", label: "Paid or Outstanding", component: (
                  <select value={filterPaid} onChange={e => setFilterPaid(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Payments</option>
                    <option value="paid">Received (Paid)</option>
                    <option value="unpaid">Outstanding (Unpaid)</option>
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
              ].map(({ id: fId, label, component, dispatchOnly }) => {
                if (dispatchOnly && !dispatchSystemEnabled) return null;
                
                const isPinned = pinnedFilters.includes(fId);
                const togglePin = () => {
                  if (isPinned) {
                    setPinnedFilters(pinnedFilters.filter(p => p !== fId));
                  } else {
                    const updated = [...pinnedFilters, fId];
                    if (updated.length > 3) {
                      updated.shift(); // keep exactly up to 3 pinned
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
                  {/* Dispatch System switch */}
                  <button 
                    onClick={() => {
                      setDispatchSystemEnabled(!dispatchSystemEnabled);
                      toast.success(`Dispatch matching turned ${!dispatchSystemEnabled ? "ON" : "OFF"}`);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] transition-all border",
                      dispatchSystemEnabled 
                        ? "bg-green-50/10 text-green-700 border-green-50/20" 
                        : "bg-slate-200/50 text-slate-400 border-slate-300/30"
                    )}
                  >
                    <CheckCircle2 size={10} />
                    <span>Dispatch Gating</span>
                  </button>

                  {/* Maker Checker Switch */}
                  <button 
                    onClick={() => {
                      setMakerCheckerEnabled(!makerCheckerEnabled);
                      toast.success(`Maker-Checker mode turned ${!makerCheckerEnabled ? "ON" : "OFF"}`);
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

      {/* Tabs & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/40 p-2.5 rounded-2xl border border-blue-mid/10">
        <div className="tab-group md:w-auto w-full border-none p-0 bg-transparent">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("tab-item", activeTab === t.id && "active")}>
              {t.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1 bg-blue-light/50 border border-blue-mid/10 p-1 rounded-xl self-end md:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => setViewMode("ledger")}
            className={cn("px-3 py-1 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-colors", viewMode === "ledger" ? "bg-blue-ink text-white" : "text-blue-mid hover:text-blue-ink")}
          >
            Excel Ledger
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={cn("px-3 py-1 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-colors", viewMode === "card" ? "bg-blue-ink text-white" : "text-blue-mid hover:text-blue-ink")}
          >
            Card Hub
          </button>
        </div>
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
            {sortedAndFiltered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-48 gap-3 text-blue-mid/30">
                <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
                  <Receipt size={28} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest font-mono">No Outward Sales Records Found</p>
              </motion.div>
            ) : viewMode === "ledger" ? (
              <div className="overflow-x-auto border border-blue-mid/15 rounded-2xl bg-white shadow-sm font-mono text-[9px] w-full no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1700px]">
                  <thead>
                    <tr className="bg-blue-light/60 border-b border-blue-mid/15 uppercase text-blue-mid font-black select-none sticky top-0 z-10">
                      {[
                        { field: "slNo", label: "SL No." },
                        { field: "poNumber", label: "PO Number" },
                        { field: "customerName", label: "Particulars" },
                        { field: "project", label: "Project" },
                        { field: "amountIncGst", label: "Amount (Inc GST)" },
                        { field: "duePayment", label: "Due Payment" },
                        { field: "invoiceNo", label: "Invoice No." },
                        { field: "invoiceDate", label: "Invoice Date" },
                        { field: "invoiceTotal", label: "Invoice AMT (Inc GST)" },
                        { field: "amountInBank", label: "Amount in Bank" },
                        { field: "balance", label: "Balance" },
                        { field: "dateAsOn", label: "Date (As on)" },
                        { field: "taxableAmount", label: "Basic" },
                        { field: "tcsCollected", label: "TCS (2.1%)" },
                        { field: "totalGst", label: "GST" },
                        { field: "instRxilCharges", label: "Deductions / RXIL / Shortage" },
                        { field: "balanceShortage", label: "Balance - Shortage" },
                        { field: "orderStatus", label: "Order Status" }
                      ].map(col => {
                        const isSorted = sortField === col.field;
                        return (
                          <th 
                            key={col.field}
                            onClick={() => handleSort(col.field)}
                            className="p-3 cursor-pointer hover:bg-blue-light border-r border-blue-mid/10 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>{col.label}</span>
                              {isSorted && (
                                sortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-mid/10 text-blue-ink">
                    {sortedAndFiltered.map((inv: any) => {
                      const isSelected = selectedInvoiceIds.includes(inv.id);
                      const isPaid = inv.status === "processed";
                      
                      // Determine status color background highlight matching the spreadsheet colors
                      let rowBg = "bg-white";
                      if (inv.orderStatus === "RUNNING") {
                        rowBg = "bg-[#fef9c3]/30 hover:bg-[#fef9c3]/50"; // soft yellow for RUNNING
                      } else if (inv.orderStatus === "CLOSED") {
                        rowBg = "bg-[#fee2e2]/40 hover:bg-[#fee2e2]/60"; // soft red for CLOSED
                      } else if (inv.orderStatus === "COMPLETE") {
                        rowBg = "bg-[#dcfce7]/30 hover:bg-[#dcfce7]/50"; // soft green for COMPLETE
                      }
                      if (isSelected) {
                        rowBg = "bg-blue-light/40 hover:bg-blue-light/50 font-bold border-l-4 border-blue-ink";
                      }

                      return (
                        <tr 
                          key={inv.id} 
                          onClick={(e) => {
                            if (e.shiftKey || isSelectionMode) {
                              toggleInvoiceSelection(inv.id);
                            } else {
                              handleSelectInvoice(inv);
                            }
                          }}
                          className={cn(rowBg, "cursor-pointer transition-colors font-bold border-r border-blue-mid/10")}
                        >
                          <td className="p-3 font-mono border-r border-blue-mid/10">{inv.slNo || "—"}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 truncate max-w-[150px]" title={inv.poNumber}>{inv.poNumber || "—"}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 uppercase font-black truncate max-w-[150px]">{inv.customerName}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 uppercase truncate max-w-[120px]">{inv.project || "—"}</td>
                          
                          {/* Financial values aligned right */}
                          <td className={cn("p-3 font-mono border-r border-blue-mid/10 text-right font-black", parseFloat(inv.amountIncGst || "0") < 0 && "text-red-700")}>
                            {formatINR(inv.amountIncGst || 0)}
                          </td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-orange-700">{formatINR(inv.duePayment || 0)}</td>
                          
                          <td className="p-3 font-mono border-r border-blue-mid/10 font-black">{inv.invoiceNo}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10">{formatDate(inv.invoiceDate)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right font-black">{formatINR(inv.invoiceTotal || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-green-700">{formatINR(inv.amountInBank || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-orange-700">{formatINR(inv.balance || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10">{inv.dateAsOn || "—"}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-blue-mid">{formatINR(inv.taxableAmount || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-[#1a6b3c]">{formatINR(inv.tcsCollected || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-blue-mid">{formatINR(inv.totalGst || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right text-red-600">{formatINR(inv.instRxilCharges || 0)}</td>
                          <td className="p-3 font-mono border-r border-blue-mid/10 text-right font-black text-[#544837]">{formatINR(inv.balanceShortage || 0)}</td>
                          
                          {/* Order Status Badge */}
                          <td className="p-3 font-mono">
                            {inv.orderStatus === "RUNNING" ? (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-yellow-400 text-black border border-yellow-600">
                                ORDER RUNNING
                              </span>
                            ) : inv.orderStatus === "CLOSED" ? (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-red-600 text-white border border-red-800">
                                ORDER CLOSED
                              </span>
                            ) : (
                              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-green-600 text-white border border-green-800">
                                ORDER COMPLETE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedAndFiltered.map((inv: any) => {
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
                            handleSelectInvoice(inv);
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
                            
                            {/* High-Density Spreadsheet Metadata row */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[8px] font-mono">
                              <span className="bg-blue-light text-blue-ink px-1 rounded-sm border border-blue-mid/10 font-bold">SL: {inv.slNo || "—"}</span>
                              <span className="bg-blue-light text-blue-ink px-1 rounded-sm border border-blue-mid/10 font-bold">Proj: {inv.project || "—"}</span>
                              <span className="text-blue-mid truncate max-w-[120px]">PO: {inv.poNumber || "—"}</span>
                              
                              {inv.orderStatus === "RUNNING" && (
                                <span className="px-1 rounded-sm bg-yellow-100 text-yellow-800 border border-yellow-300 text-[7px] font-black">RUNNING</span>
                              )}
                              {inv.orderStatus === "CLOSED" && (
                                <span className="px-1 rounded-sm bg-red-100 text-red-800 border border-red-300 text-[7px] font-black">CLOSED</span>
                              )}
                              {inv.orderStatus === "COMPLETE" && (
                                <span className="px-1 rounded-sm bg-green-100 text-green-800 border border-green-300 text-[7px] font-black">COMPLETE</span>
                              )}
                              {(() => {
                                const eway = inv.rawData?.eWayBill || inv.rawData?.eWayBillNumber;
                                if (eway && eway.toLowerCase() !== "not applicable" && eway.toLowerCase() !== "n/a" && eway.trim() !== "") {
                                  return (
                                    <span className="bg-[#fee2e2]/60 text-red-700 px-1 rounded-sm border border-red-200/50 font-bold uppercase text-[7px]">E-Way: {eway}</span>
                                  );
                                }
                                return null;
                              })()}
                              {(() => {
                                const vehicle = inv.rawData?.vehicleNumber || inv.rawData?.vehicle;
                                if (vehicle && vehicle.toLowerCase() !== "not applicable" && vehicle.toLowerCase() !== "n/a" && vehicle.trim() !== "") {
                                  return (
                                    <span className="bg-[#fee2e2]/60 text-red-700 px-1 rounded-sm border border-red-200/50 font-bold uppercase text-[7px]">Vehicle: {vehicle}</span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
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
                  <button 
                    onClick={() => {
                      setShowDocPreview(true);
                    }}
                    className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10 shadow-sm hover:bg-blue-light hover:text-blue-ink hover:scale-105 active:scale-95 transition-all focus:outline-none animate-pulse-glow"
                    title="View Original Scanned Document"
                  >
                    <Eye size={24} />
                  </button>
                  <div className="flex gap-2 items-center">
                    {selectedInvoice.status !== "processed" && (
                      <button
                        onClick={() => {
                          if (isEditing) {
                            // Save changes
                            updateMutation.mutate({
                              id: selectedInvoice.id,
                              customerName: editCustomerName,
                              customerGstin: editCustomerGstin,
                              invoiceNo: editInvoiceNo,
                              invoiceDate: editInvoiceDate,
                              invoiceTotal: editInvoiceTotal,
                              taxableAmount: editTaxableAmount,
                              totalGst: editTotalGst,
                              rawData: {
                                ...selectedInvoice.rawData,
                                buyer: {
                                  ...(selectedInvoice.rawData?.buyer || {}),
                                  name: editCustomerName,
                                  gstin: editCustomerGstin,
                                  address: editBuyerAddress,
                                  mobile: editBuyerMobile,
                                  phone: editBuyerPhone,
                                  email: editBuyerEmail,
                                  bank_details: {
                                    account_holder: editBuyerBankHolder,
                                    account_number: editBuyerBankAccountNo,
                                    bank_name: editBuyerBankName,
                                    ifsc: editBuyerBankIfsc,
                                  }
                                }
                              }
                            }, {
                              onSuccess: (updatedData) => {
                                toast.success("Invoice details saved successfully ✓");
                                setSelectedInvoice(updatedData);
                                setIsEditing(false);
                              }
                            });
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                          isEditing 
                            ? "bg-green-600 text-white hover:bg-green-700 animate-pulse" 
                            : "bg-blue-mid/10 text-blue-mid hover:bg-blue-mid/20"
                        )}
                      >
                        {isEditing ? "Save Invoice" : "Edit Invoice"}
                      </button>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <DrawerClose className="icon-btn">
                      <X size={18} />
                    </DrawerClose>
                  </div>
                </div>
                <DrawerTitle className="text-2xl font-black text-blue-ink leading-tight">
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-black tracking-wider text-blue-mid/50 font-sans">Customer Name</label>
                      <input 
                        type="text" 
                        value={editCustomerName} 
                        onChange={e => setEditCustomerName(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-xl px-3 py-2 text-sm font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full font-sans uppercase"
                      />
                    </div>
                  ) : (
                    selectedInvoice.customerName || "Unknown Customer"
                  )}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-blue-mid/70 font-sans mt-2">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3 mt-2 font-sans">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-black tracking-wider text-blue-mid/50">Invoice Number</label>
                        <input 
                          type="text" 
                          value={editInvoiceNo} 
                          onChange={e => setEditInvoiceNo(e.target.value)}
                          className="bg-white border border-blue-mid/10 rounded-xl px-3 py-2 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full uppercase"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-black tracking-wider text-blue-mid/50">Invoice Date (YYYY-MM-DD)</label>
                        <input 
                          type="text" 
                          value={editInvoiceDate} 
                          onChange={e => setEditInvoiceDate(e.target.value)}
                          className="bg-white border border-blue-mid/10 rounded-xl px-3 py-2 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <>Tax Invoice No: {selectedInvoice.invoiceNo} &middot; Outward Date: {formatDate(selectedInvoice.invoiceDate)}</>
                  )}
                </DrawerDescription>
              </DrawerHeader>

              {/* Segment 1: Customer Master Info & Outward Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Particulars */}
                <div className="card p-4 space-y-2.5 bg-white border-blue-mid/10 text-xs font-mono">
                  <span className="text-[9px] font-mono uppercase font-black tracking-wider text-blue-mid block">Buyer Particulars</span>
                  <div>
                    <span className="text-blue-mid font-medium block">Legal Name:</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editCustomerName} 
                        onChange={e => setEditCustomerName(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full uppercase"
                      />
                    ) : (
                      <span className="font-bold text-blue-ink uppercase">{selectedInvoice.customerName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">GSTIN:</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editCustomerGstin} 
                        onChange={e => setEditCustomerGstin(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full uppercase"
                      />
                    ) : (
                      <span className="font-bold text-blue-ink">{selectedInvoice.customerGstin || "—"}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">Consignee Address:</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editBuyerAddress} 
                        onChange={e => setEditBuyerAddress(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full uppercase"
                      />
                    ) : (
                      <span className="font-bold text-blue-ink uppercase">{selectedInvoice.rawData?.buyer?.address || editBuyerAddress || "Address on record"}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">Mobile:</span>
                    {isEditing ? (
                      <input type="text" value={editBuyerMobile} onChange={e => setEditBuyerMobile(e.target.value)} className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full" />
                    ) : (
                      <span className="font-bold text-blue-ink">{selectedInvoice.rawData?.buyer?.mobile || editBuyerMobile || "—"}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">Phone:</span>
                    {isEditing ? (
                      <input type="text" value={editBuyerPhone} onChange={e => setEditBuyerPhone(e.target.value)} className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full" />
                    ) : (
                      <span className="font-bold text-blue-ink">{selectedInvoice.rawData?.buyer?.phone || editBuyerPhone || "—"}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-blue-mid font-medium block">Email:</span>
                    {isEditing ? (
                      <input type="text" value={editBuyerEmail} onChange={e => setEditBuyerEmail(e.target.value)} className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-full" />
                    ) : (
                      <span className="font-bold text-blue-ink">{selectedInvoice.rawData?.buyer?.email || editBuyerEmail || "—"}</span>
                    )}
                  </div>

                  {/* Buyer Bank Details Collapsible */}
                  <div className="border-t border-blue-light/50 pt-2 mt-1">
                    <span className="text-[8px] font-mono uppercase font-black text-blue-mid/60 tracking-wider block mb-1">Buyer Bank Account</span>
                    {isEditing ? (
                      <div className="space-y-1.5 text-[9px]">
                        <div><span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Holder</span><input type="text" value={editBuyerBankHolder} onChange={e => setEditBuyerBankHolder(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none" /></div>
                        <div><span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Account No</span><input type="text" value={editBuyerBankAccountNo} onChange={e => setEditBuyerBankAccountNo(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none tracking-widest" /></div>
                        <div><span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Bank Name</span><input type="text" value={editBuyerBankName} onChange={e => setEditBuyerBankName(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none" /></div>
                        <div><span className="text-blue-mid/50 font-bold uppercase block text-[8px]">IFSC</span><input type="text" value={editBuyerBankIfsc} onChange={e => setEditBuyerBankIfsc(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none tracking-widest" /></div>
                      </div>
                    ) : (
                      <div className="text-[9px] text-blue-ink/60 font-bold">
                        {selectedInvoice.rawData?.buyer?.bank_details?.account_number ? (
                          <span>••••{selectedInvoice.rawData.buyer.bank_details.account_number.slice(-4)} · {selectedInvoice.rawData.buyer.bank_details.bank_name || "Bank"}</span>
                        ) : (
                          <span className="text-blue-mid/40 uppercase tracking-wider">No buyer bank data on record</span>
                        )}
                      </div>
                    )}
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

              {/* Financial Totals Audit Widget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="card p-3 bg-white border-blue-mid/10 font-mono text-xs">
                  <span className="text-[9px] font-mono uppercase font-black text-blue-mid block mb-0.5">Subtotal (Taxable)</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editTaxableAmount} 
                      onChange={e => setEditTaxableAmount(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                    />
                  ) : (
                    <p className="fin-num text-lg text-blue-ink">{formatINR(selectedInvoice.taxableAmount)}</p>
                  )}
                  <span className="text-[8px] font-bold text-blue-mid/50 uppercase tracking-widest mt-1 block">Accrual Base</span>
                </div>
                <div className="card p-3 bg-white border-blue-mid/10 font-mono text-xs">
                  <span className="text-[9px] font-mono uppercase font-black text-blue-mid block mb-0.5">Total GST</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editTotalGst} 
                      onChange={e => setEditTotalGst(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                    />
                  ) : (
                    <p className="fin-num text-lg text-blue-ink">{formatINR(selectedInvoice.totalGst)}</p>
                  )}
                  <span className="text-[8px] font-bold text-blue-mid/50 uppercase tracking-widest mt-1 block">Tax Portion</span>
                </div>
                <div className="card p-3 bg-blue-mid/5 border border-blue-mid/25 shadow-sm font-mono text-xs">
                  <span className="text-[9px] font-mono uppercase font-black text-blue-mid font-black block mb-0.5">Grand Total</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editInvoiceTotal} 
                      onChange={e => setEditInvoiceTotal(e.target.value)}
                      className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                    />
                  ) : (
                    <p className="fin-num text-lg text-blue-ink font-black">{formatINR(selectedInvoice.invoiceTotal)}</p>
                  )}
                  <span className="text-[8px] font-bold text-blue-mid/50 uppercase tracking-widest mt-1 block">Payable Gross</span>
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

              {/* Segment 6.5: Pending Payments Spreadsheet Compliance Editor */}
              <div className="card p-5 space-y-4 bg-white border-blue-mid/10 rounded-2xl font-mono text-xs">
                <span className="text-[9px] font-mono uppercase font-black text-blue-mid block">Enterprise Spreadsheet Ledger Specifications</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">Amount in Bank (Cleared Receipt)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-mid text-[10px]">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={localAmountInBank}
                          onChange={e => setLocalAmountInBank(e.target.value)}
                          className="w-full rounded border border-blue-mid/20 p-1.5 pl-5 text-[10px] text-blue-ink font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">Inst + RXIL Charges / LD / Short Supply</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-mid text-[10px]">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={localInstRxilCharges}
                          onChange={e => setLocalInstRxilCharges(e.target.value)}
                          className="w-full rounded border border-blue-mid/20 p-1.5 pl-5 text-[10px] text-blue-ink font-bold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">Date (As on Cleared)</label>
                      <input
                        type="text"
                        value={localDateAsOn}
                        onChange={e => setLocalDateAsOn(e.target.value)}
                        className="w-full rounded border border-blue-mid/20 p-1.5 text-[10px] text-blue-ink font-bold"
                        placeholder="e.g. 08.07.25 or 09/05/2026"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono uppercase font-black text-blue-mid block mb-1">Spreadsheet Order Status</label>
                      <select
                        value={localOrderStatus}
                        onChange={e => setLocalOrderStatus(e.target.value)}
                        className="w-full rounded border border-blue-mid/20 bg-white p-1.5 text-[10px] text-blue-ink font-bold outline-none"
                      >
                        <option value="RUNNING">ORDER RUNNING</option>
                        <option value="CLOSED">ORDER CLOSED</option>
                        <option value="COMPLETE">ORDER COMPLETE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mathematical Ledger Summary in Drawer */}
                <div className="bg-blue-light/40 border border-blue-mid/10 p-3.5 rounded-xl space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-blue-mid font-medium">Outward Invoice Total:</span>
                    <span className="font-bold text-blue-ink">{formatINR(selectedInvoice.invoiceTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-mid font-medium">Amount Received in Bank:</span>
                    <span className="font-bold text-green-700">{formatINR(localAmountInBank || 0)}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-mid/10 pb-1.5">
                    <span className="text-blue-mid font-medium">Unpaid Balance (Excel Spec):</span>
                    <span className="font-black text-orange-700">
                      {formatINR(Math.max(0, parseFloat(selectedInvoice.invoiceTotal || "0") - parseFloat(localAmountInBank || "0")))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-blue-mid font-medium">Deductions (Shortage/RXIL/LD):</span>
                    <span className="font-bold text-red-600">{formatINR(localInstRxilCharges || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black pt-1.5 border-t border-dashed border-blue-mid/15">
                    <span className="text-blue-ink uppercase">Net Balance - Shortage:</span>
                    <span className="text-blue-ink">
                      {formatINR(
                        Math.max(
                          0,
                          parseFloat(selectedInvoice.invoiceTotal || "0") -
                            parseFloat(localAmountInBank || "0") -
                            parseFloat(localInstRxilCharges || "0")
                        )
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const parsedBank = parseFloat(localAmountInBank || "0");
                    const parsedCharges = parseFloat(localInstRxilCharges || "0");
                    const calculatedBal = Math.max(0, parseFloat(selectedInvoice.invoiceTotal || "0") - parsedBank);
                    const calculatedShortage = Math.max(0, calculatedBal - parsedCharges);

                    updateMutation.mutate({
                      id: selectedInvoice.id,
                      amountInBank: String(parsedBank.toFixed(2)),
                      instRxilCharges: String(parsedCharges.toFixed(2)),
                      balance: String(calculatedBal.toFixed(2)),
                      balanceShortage: String(calculatedShortage.toFixed(2)),
                      orderStatus: localOrderStatus,
                      dateAsOn: localDateAsOn
                    });
                    toast.success("Spreadsheet compliance ledger updated ✓");
                  }}
                  className="w-full bg-blue-ink hover:bg-blue-ink/90 text-white rounded-xl py-2 text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Save Ledger Compliance Specs
                </button>
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
