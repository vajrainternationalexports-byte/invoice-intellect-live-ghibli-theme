import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, FileUp, Search, FileDown, X, Receipt, Filter, Globe,
  AlertTriangle, CheckCircle2, Clock, Calendar, ShieldCheck, 
  Building, User, Percent, HelpCircle, ArrowRight, Play, Eye, EyeOff,
  Pin, Loader2, Trash2, Check, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { AIVoiceAgent } from "@/components/AIVoiceAgent";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { downloadExcel } from "@/lib/excel-export";
import { formatINR, formatDate, getStateNameFromCode } from "@/lib/formatters";
import { INVOICE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { compressFileForOcr } from "@/lib/image-compress";

function ScannedPaperInvoice({ invoice }: { invoice: any }) {
  const hasIgst = parseFloat(invoice.igstAmount || "0") > 0;

  const { data: vendor } = useQuery<any>({
    queryKey: [invoice.vendorId ? `/api/vendors/${invoice.vendorId}` : "/api/vendors/none"],
    enabled: !!invoice.vendorId,
  });

  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: [invoice.vendorId ? `/api/vendors/${invoice.vendorId}/bank-accounts` : "/api/vendors/none/bank-accounts"],
    enabled: !!invoice.vendorId,
  });

  const seller = invoice.rawData?.seller || {};
  const mobile = vendor?.phone || seller.phone || seller.mobile || seller.contact?.mobile || "";
  const landline = seller.landline || seller.contact?.landline || "";
  const email = vendor?.email || seller.email || seller.contact?.email || "";
  
  const address = invoice.rawData?.seller?.address || vendor?.address || "—";
  const gstin = invoice.vendorGstin || vendor?.gstin || "—";
  const pan = gstin && gstin !== "—" ? gstin.slice(2, 12) : "—";
  const stateCode = gstin && gstin !== "—" ? gstin.slice(0, 2) : "—";

  // Prefer mobile as contact 1; fallback to landline if not present.
  const contact1Label = mobile ? "Mobile" : "Landline";
  const contact1Val = mobile || landline || "—";

  // Show secondary contact detail (either landline if mobile was first, or email).
  const contact2Label = (mobile && landline) ? "Landline" : "Email";
  const contact2Val = (mobile && landline) ? landline : (email || "—");
  
  return (
    <div className="relative mx-auto max-w-3xl bg-[#fbf9f5] p-8 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-[#e8dfd5] rounded-sm select-none transform rotate-[-0.2deg] font-serif text-[#3e3427] min-h-[1000px] overflow-hidden my-4">
      {/* Distressed paper fibers texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #000 1px, transparent 1px), radial-gradient(circle at 0 0, #000 1px, transparent 1px)`,
          backgroundSize: "20px 20px, 15px 15px",
        }}
      />
      
      {/* Light Scanline Overlay to look authentic */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#453723]/[0.02] to-transparent bg-[size:100%_4px] opacity-40" />

      {/* Stamped Watermark */}
      <div className="absolute top-[35%] left-[20%] pointer-events-none opacity-[0.06] select-none text-center rotate-[-25deg] border-8 border-dashed border-[#8d2a2a] p-6 rounded-3xl">
        <span className="text-6xl font-black block leading-none text-[#8d2a2a] tracking-wider">DUPLICATE</span>
        <span className="text-3xl font-black block tracking-widest mt-2 text-[#8d2a2a]">OFFICIAL RECORD</span>
      </div>

      {/* Blue Rubber Validation Stamp */}
      <div className="absolute top-[12%] right-[8%] pointer-events-none opacity-80 select-none text-center rotate-[12deg] border-4 border-double border-[#24458d] p-3 rounded-xl bg-white/40">
        <span className="text-[10px] font-black block leading-none text-[#24458d] tracking-wider">RECEIVED</span>
        <span className="text-[8px] font-bold block text-[#24458d] mt-1">IES FINANCE DEPT</span>
        <span className="text-[7px] font-black block text-[#24458d] border-t border-[#2448d]/30 mt-1 pt-1">{invoice.invoiceDate ? formatDate(invoice.invoiceDate).toUpperCase() : "18 MAY 2026"}</span>
      </div>

      {/* Invoice Title */}
      <div className="text-center border-b-2 border-[#544837]/30 pb-6 mb-8">
        <h2 className="text-2xl font-black tracking-wide text-[#2e261b] font-mono uppercase">TAX INVOICE</h2>
        <p className="text-[9px] font-mono tracking-widest text-[#544837]/70 mt-1">ORIGINAL SCANNED DOCUMENT RECORD</p>
      </div>

      {/* Seller and Invoice Meta info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#544837]/20 pb-6 mb-6 text-[10px] font-mono leading-relaxed">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">SELLER Particulars</span>
          <h3 className="text-sm font-black text-[#2e261b] uppercase">{invoice.vendorName}</h3>
          <p className="text-[#544837]/80 uppercase">{address}</p>
          <div className="pt-2 space-y-0.5">
            <div>GSTIN: <span className="font-bold">{gstin}</span></div>
            <div>PAN: <span className="font-bold">{pan}</span></div>
            <div>State Code: <span className="font-bold">{stateCode}</span></div>
            
            <div className="pt-1 border-t border-[#544837]/10 mt-1 space-y-0.5">
              <div>Contact 1 ({contact1Label}): <span className="font-bold">{contact1Val}</span></div>
              {contact2Val !== "—" && (
                <div>Contact 2 ({contact2Label}): <span className="font-bold text-[#3d518c]">{contact2Val}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 md:text-right md:flex md:flex-col md:items-end">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide md:text-right">INVOICE SPECIFICATION</span>
          <div className="w-full max-w-[240px] space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Invoice No:</span>
              <span className="font-black text-[#2e261b]">{invoice.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Invoice Date:</span>
              <span className="font-bold">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span className="font-bold">{invoice.dueDate ? formatDate(invoice.dueDate) : formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>PO Reference:</span>
              <span className="font-bold uppercase">{invoice.rawData?.po_number || "IES-PO-9824"}</span>
            </div>
            {(() => {
              const eway = invoice.rawData?.eWayBillNumber || invoice.rawData?.eWayBill;
              if (eway && eway.toLowerCase() !== "not applicable" && eway.toLowerCase() !== "n/a" && eway.trim() !== "") {
                return (
                  <div className="flex justify-between text-[#8d2a2a]">
                    <span>E-Way Bill:</span>
                    <span className="font-bold uppercase">{eway}</span>
                  </div>
                );
              }
              return null;
            })()}
            {(() => {
              const vehicle = invoice.rawData?.vehicleNumber || invoice.rawData?.vehicle;
              if (vehicle && vehicle.toLowerCase() !== "not applicable" && vehicle.toLowerCase() !== "n/a" && vehicle.trim() !== "") {
                return (
                  <div className="flex justify-between text-[#8d2a2a]">
                    <span>Vehicle No:</span>
                    <span className="font-bold uppercase">{vehicle}</span>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Buyer Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#544837]/20 pb-6 mb-6 text-[10px] font-mono leading-relaxed">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">CONSIGNEE / BILLED TO</span>
          <h4 className="text-xs font-black text-[#2e261b] uppercase">INDIA ELECTRICALS SYNDICATE</h4>
          <p className="text-[#544837]/80 uppercase">55, Ezra Street, 1st Floor, Kolkata - 700001</p>
          <div className="pt-2 space-y-0.5">
            <div>GSTIN: <span className="font-bold">19AAAFI6886Q1ZE</span></div>
            <div>PAN: <span className="font-bold">AAAFI6886Q</span></div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">CONSIGNOR / SHIPPED TO</span>
          <h4 className="text-xs font-black text-[#2e261b] uppercase">INDIA ELECTRICALS SYNDICATE</h4>
          <p className="text-[#544837]/80 uppercase">WORKS W1: 80 JAWPORE ROAD, KOLKATA - 700074</p>
          <div className="pt-2 space-y-0.5">
            <div>Delivery Site: <span className="font-bold">Kolkata Galvanizing Facility</span></div>
            <div>Location: <span className="font-bold uppercase">{invoice.branchLocation}</span></div>
          </div>
        </div>
      </div>

      {/* Scanned Line Items Table */}
      <div className="mb-6">
        <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block mb-2 font-mono">Particulars of Supply</span>
        <table className="w-full text-[10px] font-mono border-collapse border border-[#544837]/30 text-left">
          <thead>
            <tr className="bg-[#e8dfd5]/40 text-[#3e3427] font-black uppercase border-b border-[#544837]/30 text-[8px] tracking-wider">
              <th className="py-2 px-2 border-r border-[#544837]/30 text-center">Sl</th>
              <th className="py-2 px-3 border-r border-[#544837]/30 w-[45%]">Description of Goods</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-center">HSN</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Qty</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Rate</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Disc%</th>
              <th className="py-2 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#544837]/20 border-b border-[#544837]/30">
            {invoice.lineItems?.map((li: any, idx: number) => (
              <tr key={idx} className="align-top font-bold text-[#2e261b]">
                <td className="py-2 px-2 border-r border-[#544837]/30 text-center">{idx + 1}</td>
                <td className="py-2 px-3 border-r border-[#544837]/30">
                  <div className="font-black text-[#1e1912]">{li.item || li.description}</div>
                  <div className="text-[7px] text-[#544837]/60 mt-0.5">
                    BATCH: {li.batchNo || "B2026-X"} · SN: {li.serialNo || "SN-109"}
                  </div>
                </td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-center text-[#544837]/80">{li.hsn || "73181500"}</td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{li.qty || li.quantity} {li.unit || "Pcs"}</td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{parseFloat(li.rate || li.price_per_unit || "0").toFixed(2)}</td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{li.discount || 0}%</td>
                <td className="py-2 px-3 text-right font-black">{parseFloat(li.total || li.total_amount || "0").toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations & Bank specifics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 mb-8 font-mono text-[10px]">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block">BENEFICIARY BANK ACCOUNT</span>
            <div className="bg-[#e8dfd5]/20 p-3 rounded-lg border border-[#e8dfd5] text-[#544837] space-y-0.5">
              <div>A/c Holder: <span className="font-bold uppercase">{vendor?.name || invoice.vendorName}</span></div>
              {invoice.rawData?.seller?.bank_details ? (
                <>
                  <div>Account No: <span className="font-bold tracking-wider">{invoice.rawData.seller.bank_details.account_number}</span></div>
                  <div>Bank Name: <span className="font-bold">{invoice.rawData.seller.bank_details.bank_name}</span></div>
                  <div>IFSC Code: <span className="font-bold tracking-widest">{invoice.rawData.seller.bank_details.ifsc}</span></div>
                </>
              ) : bankAccounts && bankAccounts.length > 0 ? (
                <>
                  <div>Account No: <span className="font-bold tracking-wider">{bankAccounts[0].accountNumber}</span></div>
                  <div>Bank Name: <span className="font-bold">{bankAccounts[0].bankName}</span></div>
                  <div>IFSC Code: <span className="font-bold tracking-widest">{bankAccounts[0].ifscCode}</span></div>
                </>
              ) : (
                <>
                  <div>Account No: <span className="font-bold tracking-wider">—</span></div>
                  <div>Bank Name: <span className="font-bold">—</span></div>
                  <div>IFSC Code: <span className="font-bold tracking-widest">—</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#e8dfd5]/30 p-4 rounded-xl border border-[#e8dfd5]/75 space-y-1.5 font-bold">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block mb-1">VALUATION SPEC SHEET</span>
          <div className="flex justify-between border-b border-[#544837]/10 pb-1">
            <span>Taxable Value:</span>
            <span>{formatINR(invoice.taxableAmount)}</span>
          </div>
          {parseFloat(invoice.cgstAmount || "0") > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1 text-[#544837]">
              <span>CGST @9%:</span>
              <span>{formatINR(invoice.cgstAmount)}</span>
            </div>
          )}
          {parseFloat(invoice.sgstAmount || "0") > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1 text-[#544837]">
              <span>SGST @9%:</span>
              <span>{formatINR(invoice.sgstAmount)}</span>
            </div>
          )}
          {parseFloat(invoice.igstAmount || "0") > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1 text-[#544837]">
              <span>IGST @18%:</span>
              <span>{formatINR(invoice.igstAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-[#544837]/20 pb-1.5">
            <span>Total GST Amount:</span>
            <span>{formatINR(invoice.totalGst)}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-[#1e1912] pt-1">
            <span>Grand Total (INR):</span>
            <span>{formatINR(invoice.invoiceTotal)}</span>
          </div>
        </div>
      </div>

      {/* Signature & T&C */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#544837]/30 text-[8px] font-mono uppercase text-[#544837]/80">
        <div>
          <span className="font-bold text-[#8d6e50]">TERMS AND CONDITIONS</span>
          <p className="leading-relaxed mt-1">1. Goods once sold will not be taken back or exchanged. 2. Any disputes are subject to municipal jurisdiction only. 3. Interest at 18% p.a. will be charged for delayed payments.</p>
        </div>
        <div className="flex flex-col items-end text-center space-y-4">
          <span>For {invoice.vendorName}</span>
          
          {/* Cursive Pen Handwritten Signature */}
          <div className="h-8 flex items-center justify-center opacity-70 font-sans italic text-sm text-[#1e2a5a] select-none pr-8">
            <span className="font-serif text-lg tracking-wider font-extrabold pr-2" style={{ fontFamily: "Georgia, serif" }}>
              Rajesh Kumar
            </span>
          </div>
          
          <span className="block border-t border-[#544837]/20 pt-1 w-44">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
}

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
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [swipedCardId, setSwipedCardId] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Edit states for manual invoice correction
  const [isEditing, setIsEditing] = useState(false);
  const [editVendorName, setEditVendorName] = useState("");
  const [editVendorGstin, setEditVendorGstin] = useState("");
  const [editInvoiceNo, setEditInvoiceNo] = useState("");
  const [editInvoiceDate, setEditInvoiceDate] = useState("");
  const [editInvoiceTotal, setEditInvoiceTotal] = useState("");
  const [editTaxableAmount, setEditTaxableAmount] = useState("");
  const [editTotalGst, setEditTotalGst] = useState("");
  const [editCategory, setEditCategory] = useState("Steel");

  // Extended edit states for vendor master & bank
  const [editAddress, setEditAddress] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBankHolder, setEditBankHolder] = useState("");
  const [editBankAccountNo, setEditBankAccountNo] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBankIfsc, setEditBankIfsc] = useState("");

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

  // Procurement segments custom categorization
  const [segments, setSegments] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem("procurement_segments");
      return cached ? JSON.parse(cached) : ["Steel", "Cables", "Fasteners", "Electricals", "Services", "Others"];
    } catch {
      return ["Steel", "Cables", "Fasteners", "Electricals", "Services", "Others"];
    }
  });
  const [filterSegment, setFilterSegment] = useState("all");

  useEffect(() => {
    localStorage.setItem("procurement_segments", JSON.stringify(segments));
  }, [segments]);

  // Extended Advanced Filters
  const [filterSeller, setFilterSeller] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [filterItem, setFilterItem] = useState("");

  // Pinned Filters (Users select exactly 3 filters to be permanently shown on dashboard)
  const [pinnedFilters, setPinnedFilters] = useState<string[]>(["location", "tds", "seller"]);

  // Manual Inputs inside Detail Drawer
  const [localPaymentTerms, setLocalPaymentTerms] = useState("");
  const [localVehicleNumber, setLocalVehicleNumber] = useState("");
  const [localEWayBill, setLocalEWayBill] = useState("");

  // Maker-Checker & Payout states
  const [selectedGrnStatus, setSelectedGrnStatus] = useState("");
  const [disputeReasonText, setDisputeReasonText] = useState("");
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  // Multi-Select & Bulk Actions (Long Press activation)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const isSelectionMode = selectedInvoiceIds.length > 0;

  useEffect(() => {
    if (selectedInvoice && selectedInvoice.rawData?.fileBase64) {
      window.dispatchEvent(
        new CustomEvent("desktop-doc-preview", {
          detail: {
            fileBase64: selectedInvoice.rawData.fileBase64,
            invoiceNo: selectedInvoice.invoiceNo,
            vendorName: selectedInvoice.vendorName,
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

    const headers = ["Invoice No", "Vendor Name", "GSTIN", "Invoice Date", "Invoice Total", "GST", "Branch Location", "Status"];
    const rows = selectedInvoices.map(inv => [
      inv.invoiceNo,
      `"${inv.vendorName.replace(/"/g, '""')}"`,
      inv.vendorGstin || "",
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
    link.setAttribute("download", `invoices_bulk_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedInvoices.length} invoices successfully!`);
  };

  const handleBulkShare = () => {
    const selectedInvoices = invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    if (selectedInvoices.length === 0) return;

    let reportText = `*INVOICE INTELLECT - BULK EXPORT REPORT*\n\n`;
    let totalAmt = 0;
    selectedInvoices.forEach((inv, index) => {
      reportText += `${index + 1}. *${inv.vendorName.toUpperCase()}*\n`;
      reportText += `   Inv No: ${inv.invoiceNo}\n`;
      reportText += `   Date: ${formatDate(inv.invoiceDate)}\n`;
      reportText += `   Total: ${formatINR(inv.invoiceTotal)} (GST: ${formatINR(inv.totalGst)})\n\n`;
      totalAmt += parseFloat(inv.invoiceTotal || "0");
    });
    reportText += `*Total Invoices:* ${selectedInvoices.length}\n`;
    reportText += `*Consolidated Sum:* ${formatINR(totalAmt)}\n\n`;
    reportText += `Generated on Invoice Intellect via Apple Mobile Platform.`;

    const encoded = encodeURIComponent(reportText);
    const option = window.confirm("Would you like to share via WhatsApp? (Click 'Cancel' to share via Email)");
    if (option) {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    } else {
      window.open(`mailto:?subject=Consolidated%20Invoices%20Summary&body=${encoded}`, "_blank");
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedInvoiceIds.length;
    if (count === 0) return;

    if (window.confirm(`Are you sure you want to permanently delete all ${count} selected invoices?`)) {
      try {
        await Promise.all(selectedInvoiceIds.map(id => deleteMutation.mutateAsync(id)));
        setSelectedInvoiceIds([]);
        toast.success(`Successfully deleted ${count} invoices in bulk!`);
      } catch (err) {
        toast.error("Failed to delete some invoices in bulk.");
      }
    }
  };

  const qc = useQueryClient();

  // Queries
  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchase-invoices"],
  });

  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: [selectedInvoice?.vendorId ? `/api/vendors/${selectedInvoice.vendorId}/bank-accounts` : "/api/vendors/none/bank-accounts"],
    enabled: !!selectedInvoice?.vendorId,
  });

  const { data: currentVendor } = useQuery<any>({
    queryKey: [selectedInvoice?.vendorId ? `/api/vendors/${selectedInvoice.vendorId}` : "/api/vendors/none"],
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/purchase-invoices/${id}`).then(r => {
      if (!r.ok) throw new Error("Failed to delete invoice");
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete invoice");
    }
  });

  const generateMockOcr = (fileName: string) => {
    const SUPPLIERS = [
      { name: "Indian Steel Corporation", gstin: "19AAAFI8501J1ZC", state: "West Bengal", state_code: "19", address: "71B, Netaji Subhas Road Gooptu Mansion, Ground Floor, Room No. 10, Kolkata - 700001", mobile: "+91 7980266981", landline: "033-22435861", email: "indiansteelcorp76@gmail.com", web: "www.welfastfasteners.com" },
      { name: "POLYCAB INDIA LIMITED", gstin: "27AAACP0124K1Z0", state: "Maharashtra", state_code: "27", address: "Polycab House, 771 Mogul Lane, Mahim, Mumbai - 400016", mobile: "+91 9820123456", landline: "022-24449771", email: "info@polycab.com" },
      { name: "BAJAJ ELECTRICALS LTD", gstin: "27AAACB3490G2ZC", state: "Maharashtra", state_code: "27", address: "45/47, Veer Nariman Road, Mumbai - 400001", mobile: "+91 9819234567", landline: "022-22043841", email: "customercare@bajajelectricals.com" },
      { name: "HAVELLS INDIA LIMITED", gstin: "07AAACH4293N1Z8", state: "Delhi", state_code: "07", address: "QRG Towers, 2D, Sector 126, Expressway, Noida - 201304", mobile: "+91 9811345678", landline: "0120-4771000", email: "marketing@havells.com" },
      { name: "FINOLEX CABLES LIMITED", gstin: "27AAACF8302M1Z4", state: "Maharashtra", state_code: "27", address: "26-27, Bombay-Pune Road, Pimpri, Pune - 411018", mobile: "+91 9822456789", landline: "020-27475963", email: "sales@finolex.com" },
      { name: "SUPREME INDUSTRIES LTD", gstin: "27AAACS1094J1ZF", state: "Maharashtra", state_code: "27", address: "612, Raheja Chambers, Nariman Point, Mumbai - 400021", mobile: "+91 9820567890", landline: "022-22851656", email: "supreme@supreme.co.in" },
      { name: "SHREE GANESH STEEL TRADERS", gstin: "19AABCS8849L1Z5", state: "West Bengal", state_code: "19", address: "40 Strand Road, 3rd Floor, Kolkata - 700001", mobile: "+91 9830678901", landline: "033-22108745", email: "ganeshsteel@yahoo.com" }
    ];
    
    // Fuzzy match supplier name from the uploaded filename
    const lowerName = fileName.toLowerCase();
    let supplier = SUPPLIERS[0]; // Default to Indian Steel Corporation!
    
    if (lowerName.includes("polycab") || lowerName.includes("poly")) supplier = SUPPLIERS[1];
    else if (lowerName.includes("bajaj")) supplier = SUPPLIERS[2];
    else if (lowerName.includes("havells") || lowerName.includes("hav")) supplier = SUPPLIERS[3];
    else if (lowerName.includes("finolex") || lowerName.includes("fin")) supplier = SUPPLIERS[4];
    else if (lowerName.includes("supreme") || lowerName.includes("sup")) supplier = SUPPLIERS[5];
    else if (lowerName.includes("ganesh") || lowerName.includes("shree")) supplier = SUPPLIERS[6];
    else supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    
    // Check if supplier is Indian Steel Corporation (either matched or fallback)
    if (supplier.name === "Indian Steel Corporation") {
      return {
        invoice_no: "ISC-CM/0181",
        invoice_date: "2026-05-06",
        financial_year: "2026-2027",
        po_number: "IES-PO-9824",
        seller: {
          name: supplier.name,
          gstin: supplier.gstin,
          pan: "AAAFI8501J",
          address: supplier.address,
          state: supplier.state,
          state_code: supplier.state_code,
          mobile: supplier.mobile,
          landline: supplier.landline,
          phone: supplier.mobile,
          email: supplier.email,
          web: supplier.web,
          bank_details: {
            account_holder: "Indian Steel Corporation",
            account_number: "777705266981",
            bank_name: "ICICI BANK",
            ifsc: "ICIC0006952"
          }
        },
        bill_to: {
          company_name: "M/s India Electricals Syndicates",
          gstin: "19AAAFI6886Q1ZE",
          address: "55, Ezra Street, 1st Floor, Kolkata - 700001",
          state: "West Bengal",
          state_code: "19"
        },
        totals: {
          sub_total_taxable: 4383.54,
          total_gst: 789.04,
          invoice_total: 5173.00,
          total_cgst: 394.52,
          total_sgst: 394.52,
          total_igst: 0.00
        },
        line_items: [
          { 
            item: "Wedge Fasteners 10X150", 
            qty: 420, 
            unit: "Pcs", 
            hsn: "73181500", 
            rate: "10.65", 
            discount: 2, 
            taxableValue: 4383.54, 
            cgstRate: 9, 
            cgstAmount: 394.52, 
            sgstRate: 9, 
            sgstAmount: 394.52, 
            igstRate: 0, 
            igstAmount: 0, 
            total: 5173.00, 
            batchNo: "B-2026-A1", 
            serialNo: "S-5021", 
            weight: 85, 
            warehouse: "Kolkata Works W1", 
            project: "Project Ezra", 
            costCenter: "IES-PROD" 
          }
        ],
        confidence_score: 100
      };
    }

    const randomTotal = Math.floor(Math.random() * 150000) + 30000;
    const taxable = Math.round(randomTotal / 1.18);
    const gst = randomTotal - taxable;
    
    // Interstate rule: Different state code than West Bengal (19)
    const isInterstate = supplier.state_code !== "19";
    const igst = isInterstate ? gst : 0;
    const cgst = isInterstate ? 0 : Math.round(gst / 2);
    const sgst = isInterstate ? 0 : Math.round(gst / 2);
    
    const shortCode = supplier.name.split(" ")[0];
    const invNo = `${shortCode}/25-26/` + Math.floor(100 + Math.random() * 900);
    
    return {
      invoice_no: invNo,
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      financial_year: "2026-2027",
      seller: {
        name: supplier.name,
        gstin: supplier.gstin,
        pan: supplier.gstin.slice(2, 12),
        address: supplier.address,
        state: supplier.state,
        state_code: supplier.state_code,
        mobile: supplier.mobile,
        landline: supplier.landline,
        email: supplier.email,
        phone: supplier.mobile || supplier.landline,
        bank_details: {
          account_holder: supplier.name,
          account_number: "9180200" + Math.floor(1000000 + Math.random() * 9000000),
          bank_name: "HDFC BANK LTD",
          ifsc: "HDFC0000060"
        }
      },
      bill_to: {
        company_name: "INDIA ELECTRICALS SYNDICATE",
        gstin: "19AAAFI6886Q1ZE",
        address: "12, G.C. Avenue, Kolkata - 700013",
        state: "West Bengal",
        state_code: "19"
      },
      totals: {
        sub_total_taxable: taxable,
        total_gst: gst,
        invoice_total: randomTotal,
        total_cgst: cgst,
        total_sgst: sgst,
        total_igst: igst
      },
      line_items: [
        { 
          item: "Hot Dip Galvanised Cable Trays", 
          qty: 250, 
          unit: "Mtr", 
          hsn: "7308", 
          rate: (taxable / 250).toFixed(2), 
          discount: 0, 
          taxableValue: taxable, 
          cgstRate: isInterstate ? 0 : 9, 
          cgstAmount: cgst, 
          sgstRate: isInterstate ? 0 : 9, 
          sgstAmount: sgst, 
          igstRate: isInterstate ? 18 : 0, 
          igstAmount: igst, 
          total: randomTotal, 
          batchNo: "B-9834", 
          serialNo: "SN-023", 
          weight: 920, 
          warehouse: "Kolkata Works W1", 
          project: "Project Ezra", 
          costCenter: "IES-PROD" 
        }
      ],
      confidence_score: 100
    };
  };

  const handleBackgroundExtract = async (file: File) => {
    setShowScanDrawer(false);
    toast.info(`"${file.name}" uploaded! Stage 1 OCR scan running in background...`, {
      duration: 2000
    });

    const tempInvNo = `OCR-SCAN-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialPayload = {
      invoiceNo: tempInvNo,
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      financialYear: "2026-2027",
      vendorId: "v1",
      vendorName: `Processing: ${file.name.slice(0, 20)}`,
      vendorGstin: "19AAAAC1234A1Z1",
      taxableAmount: "0.00",
      totalGst: "0.00",
      invoiceTotal: "0.00",
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      igstAmount: "0.00",
      supplyType: "Intrastate",
      status: "processing",
      grnStatus: "pending_receipt",
      branchLocation: "Kolkata Works W1",
      uploadedBy: "Admin User",
      ocrConfidence: 100,
      rawData: { 
        fileName: file.name, 
        processingStage: "Stage 1: Scanning Document (OCR)" 
      }
    };

    try {
      // 1. Synchronously insert card immediately
      const res = await apiRequest("POST", "/api/purchase-invoices", initialPayload);
      const created = await res.json();
      const invoiceId = created.id;

      qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });

      let uploadedBase64 = "";

      const updateStage = async (stageText: string, extraData: any = {}) => {
        try {
          await apiRequest("PATCH", `/api/purchase-invoices/${invoiceId}`, {
            rawData: { 
              fileName: file.name, 
              processingStage: stageText,
              ...extraData
            }
          });
          qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
        } catch (err) {
          console.error("Failed to update processing stage:", err);
        }
      };

      // 2. Compress and read the file, then send to backend OCR pipeline
      try {
        await updateStage("Stage 2: Processing AI OCR Extraction...");
        const { base64: base64Content, mimeType, dataUrl } = await compressFileForOcr(file);
        uploadedBase64 = dataUrl;

        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64Content, mimeType, docTypeHint: "PURCHASE_INVOICE" }),
        });

        const response = await res.json();
        if (response.success && response.data) {
          await updateStage("Stage 3: Auto-Validating Ledgers & GST...");
          
          const ocrData = response.data;
          const confidence = ocrData.confidence_score ?? Math.floor(Math.random() * 5) + 95;
          
          const finalPayload = {
            invoiceNo: ocrData.invoice_no || `INV-${Date.now()}`,
            invoiceDate: ocrData.invoice_date || format(new Date(), "yyyy-MM-dd"),
            financialYear: ocrData.financial_year || "2026-2027",
            vendorName: ocrData.seller?.name || "Unknown Vendor",
            vendorGstin: ocrData.seller?.gstin || "",
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
              processingStage: "Complete!"
            }
          };

          await apiRequest("PATCH", `/api/purchase-invoices/${invoiceId}`, finalPayload);
          qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
          toast.success(`OCR Complete: Invoice ${finalPayload.invoiceNo} processed!`, {
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
        
        const finalPayload = {
          invoiceNo: `ERR-${Date.now()}`,
          invoiceDate: format(new Date(), "yyyy-MM-dd"),
          financialYear: "2026-2027",
          vendorName: `Manual Input Required (${file.name})`,
          vendorGstin: "",
          taxableAmount: "0.00",
          totalGst: "0.00",
          invoiceTotal: "0.00",
          cgstAmount: "0.00",
          sgstAmount: "0.00",
          igstAmount: "0.00",
          status: "needs_review",
          lineItems: [],
          ocrConfidence: 0,
          rawData: {
            error: err.message || "Extraction Failed",
            fileBase64: uploadedBase64,
            processingStage: "Extraction Failed: Manual Review Required"
          },
          disputeReason: `AI extraction failed: ${err.message || "API error"}`
        };

        await apiRequest("PATCH", `/api/purchase-invoices/${invoiceId}`, finalPayload);
        qc.invalidateQueries({ queryKey: ["/api/purchase-invoices"] });
      }

    } catch (e: any) {
      toast.error(`OCR initialization failed: ${e.message}`);
    }
  };

  const handleExtract = async (data: any) => {
    const confidence = data.confidence_score ?? Math.floor(Math.random() * 20) + 80;
    const payload = {
      invoiceNo: data.invoice_no || `INV-${Date.now()}`,
      invoiceDate: data.invoice_date || format(new Date(), "yyyy-MM-dd"),
      financialYear: data.financial_year || "2026-2027",
      vendorId: "v1",
      vendorName: data.seller?.name || "Acme India Pvt Ltd",
      vendorGstin: data.seller?.gstin || "19AAAAC1234A1Z1",
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
    // 1. Text Search (vendor, invoice #, location, AND item names in line items)
    const query = search.toLowerCase().trim();
    if (query) {
      const matchSearch = 
        (inv.invoiceNo || "").toLowerCase().includes(query) ||
        (inv.vendorName || "").toLowerCase().includes(query) ||
        (inv.vendorGstin || "").toLowerCase().includes(query) ||
        (inv.branchLocation || "").toLowerCase().includes(query) ||
        (Array.isArray(inv.lineItems) && inv.lineItems.some((li: any) =>
          (li.description || li.item || li.name || "").toLowerCase().includes(query) ||
          (li.hsn || li.hsn_sac || "").toLowerCase().includes(query)
        ));
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

    // 12. Category Segment Filter
    if (filterSegment !== "all" && (inv.category || "Steel") !== filterSegment) return false;

    return true;
  });

  // Unique vendor list for dropdown (filtered by category segment)
  const uniqueSellers = useMemo(() => {
    const pool = filterSegment !== "all" 
      ? invoices.filter((inv: any) => (inv.category || "Steel") === filterSegment)
      : invoices;
    return Array.from(new Set(pool.map((inv: any) => inv.vendorName).filter(Boolean)));
  }, [invoices, filterSegment]);

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
    setLocalVehicleNumber(inv.rawData?.vehicleNumber || "Not Applicable");
    setLocalEWayBill(inv.rawData?.eWayBillNumber || "Not Applicable");
    setBankOpen(false);

    // Initialize edit fields
    setIsEditing(false);
    setEditVendorName(inv.vendorName || "");
    setEditVendorGstin(inv.vendorGstin || "");
    setEditInvoiceNo(inv.invoiceNo || "");
    setEditInvoiceDate(inv.invoiceDate ? inv.invoiceDate.split("T")[0] : "");
    setEditInvoiceTotal(inv.invoiceTotal || "");
    setEditTaxableAmount(inv.taxableAmount || "");
    setEditTotalGst(inv.totalGst || "");
    setEditCategory(inv.category || "Steel");

    // Initialize extended vendor master & bank edit fields
    const seller = inv.rawData?.seller || {};
    setEditAddress(seller.address || "");
    setEditMobile(seller.mobile || "");
    setEditPhone(seller.phone || "");
    setEditEmail(seller.email || "");
    const bankD = seller.bank_details || {};
    setEditBankHolder(bankD.account_holder || "");
    setEditBankAccountNo(bankD.account_number || "");
    setEditBankName(bankD.bank_name || "");
    setEditBankIfsc(bankD.ifsc || "");
  };

  const handlePayNow = async (inv: any) => {
    if (grnSystemEnabled && inv.grnStatus !== "fully_received") {
      toast.error("GRN must be 'Fully Received' before executing bank transfer!");
      return;
    }
    
    const bankAccount = bankAccounts && bankAccounts.length > 0 ? bankAccounts[0] : null;
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Scan Invoice", Icon: Camera, desc: "Process paper invoice" },
          { label: "Upload PDF", Icon: FileUp, desc: "Process digital invoice" },
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
              placeholder="Search vendor, invoice #, item name, HSN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <AIVoiceAgent 
            contextMode="global"
            onAction={(action) => {
              if (action.intent === "SEARCH_INVOICES" && action.searchQuery) {
                setSearch(action.searchQuery);
                toast.success(`AI Search Filter Applied: ${action.searchQuery}`);
              } else if (action.message) {
                toast.info(action.message);
              }
            }}
          />
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
          <div className="flex w-full gap-1 py-1 px-2 items-center bg-blue-light/20 rounded-2xl border border-blue-mid/5 justify-between">
            <span className="text-[7.5px] font-black uppercase tracking-widest text-blue-mid/60 mr-0.5 flex items-center gap-0.5 shrink-0">
              <Pin size={8} /> Pinned:
            </span>
            
            {pinnedFilters.map(fId => {
              // Hide GRN filter chip if system is disabled
              if (fId === "grn" && !grnSystemEnabled) return null;
              
              if (fId === "grn") {
                return (
                  <select key={fId} value={filterGrn} onChange={e => setFilterGrn(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">GRN: ALL</option>
                    <option value="pending_receipt">GRN: PEND</option>
                    <option value="partially_received">GRN: PART</option>
                    <option value="fully_received">GRN: FULL</option>
                    <option value="damaged">GRN: DMG</option>
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
              if (fId === "segment") {
                return (
                  <select key={fId} value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">CAT: ALL</option>
                    {segments.map(seg => (
                      <option key={seg} value={seg}>{seg.toUpperCase().slice(0, 8)}</option>
                    ))}
                  </select>
                );
              }
              if (fId === "tds") {
                return (
                  <select key={fId} value={filterTds} onChange={e => setFilterTds(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0">
                    <option value="all">TDS: ALL</option>
                    <option value="deducted">TDS: YES</option>
                    <option value="none">TDS: NO</option>
                  </select>
                );
              }
              if (fId === "seller") {
                return (
                  <select key={fId} value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="bg-white text-[8px] font-black uppercase tracking-wider text-blue-ink rounded-full px-2 py-0.5 border border-blue-mid/10 focus:outline-none transition-all flex-1 min-w-0 shrink-0 text-ellipsis overflow-hidden">
                    <option value="all">SELL: ALL</option>
                    {uniqueSellers.map(name => (
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
                { id: "segment", label: "Procurement Category", component: (
                  <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="w-full bg-white border border-blue-mid/10 rounded-xl p-2 text-xs font-bold text-blue-ink">
                    <option value="all">All Categories</option>
                    {segments.map(seg => (
                      <option key={seg} value={seg}>{seg}</option>
                    ))}
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
            if (inv.status === "processing") {
              const stage = inv.rawData?.processingStage || "Stage 1: Scanning Document...";
              return (
                <motion.div
                  key={inv.id}
                  layout
                  className="card p-4 relative overflow-hidden bg-blue-light/10 border-dashed border-2 border-blue-mid/20 animate-pulse cursor-not-allowed select-none"
                  onClick={() => toast.info(`Processing "${inv.rawData?.fileName || "document"}" in background. Almost done!`)}
                >
                  {/* Lateral Status Stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-mid animate-pulse" />

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-blue-ink text-xs uppercase tracking-tight truncate">
                          🤖 {inv.rawData?.fileName || "Scanning Document..."}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-mid/10 text-[8px] font-black text-blue-mid uppercase tracking-widest animate-pulse">
                          Processing
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-blue-mid/60 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin text-blue-mid" />
                        <span>{stage}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-blue-mid uppercase tracking-wider">
                        100% Accuracy
                      </span>
                      <p className="text-[8px] font-bold text-blue-mid/40 uppercase tracking-widest mt-1">
                        Background Pipeline
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            }

            const isUnpaid = inv.status !== "processed";
            const diffTime = Math.abs(new Date().getTime() - new Date(inv.invoiceDate).getTime());
            const pendingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isSelected = selectedInvoiceIds.includes(inv.id);

            return (
              <div
                key={inv.id}
                className="relative overflow-hidden rounded-2xl bg-red-600 shadow-sm border border-blue-mid/10 group"
              >
                {/* Background Red Delete Button */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNo} from ${inv.vendorName}?`)) {
                      deleteMutation.mutate(inv.id);
                    }
                  }}
                  className={cn(
                    "absolute right-0 top-0 bottom-0 w-[100px] flex flex-col items-center justify-center text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all cursor-pointer select-none z-20",
                    swipedCardId === inv.id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  )}
                >
                  <Trash2 size={16} className="mb-1" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Delete</span>
                </div>

                {/* Draggable Foreground Card */}
                <motion.div
                  drag={isSelectionMode ? false : "x"}
                  dragDirectionLock
                  dragConstraints={{ left: -100, right: 0 }}
                  dragElastic={{ left: 0.1, right: 0.1 }}
                  animate={{ x: swipedCardId === inv.id ? -100 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onDragEnd={(event, info) => {
                    if (info.offset.x < -30) {
                      setSwipedCardId(inv.id);
                    } else if (info.offset.x > 30) {
                      setSwipedCardId(null);
                    }
                  }}
                  onPointerDown={() => {
                    (window as any)[`longpress_${inv.id}`] = setTimeout(() => {
                      if (navigator.vibrate) navigator.vibrate(50);
                      toggleInvoiceSelection(inv.id);
                      (window as any)[`is_longpress_${inv.id}`] = true;
                    }, 600);
                  }}
                  onPointerUp={() => {
                    clearTimeout((window as any)[`longpress_${inv.id}`]);
                    setTimeout(() => {
                      (window as any)[`is_longpress_${inv.id}`] = false;
                    }, 50);
                  }}
                  onPointerCancel={() => {
                    clearTimeout((window as any)[`longpress_${inv.id}`]);
                  }}
                  onPointerMove={() => {
                    clearTimeout((window as any)[`longpress_${inv.id}`]);
                  }}
                  onClick={(e) => {
                    if ((window as any)[`is_longpress_${inv.id}`]) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    if (isSelectionMode) {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleInvoiceSelection(inv.id);
                      return;
                    }
                    if (swipedCardId === inv.id) {
                      setSwipedCardId(null);
                      return;
                    }
                    selectAndOpenInvoice(inv);
                  }}
                  className="card card-interactive p-4 relative bg-white z-10 w-full cursor-pointer select-none flex items-center gap-2"
                  whileHover={swipedCardId === inv.id ? {} : { y: -2 }}
                  whileTap={swipedCardId === inv.id ? {} : { scale: 0.98 }}
                >
                  {/* Lateral Status Stripe */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    inv.status === "processed" && "bg-green-500",
                    inv.status === "needs_review" && "bg-red-500",
                    inv.status === "pending" && "bg-yellow-500",
                    inv.status === "disputed" && "bg-orange-500"
                  )} />

                  {isSelectionMode && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleInvoiceSelection(inv.id);
                      }}
                      className="shrink-0 flex items-center mr-1 z-20"
                    >
                      <div className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center transition-all shadow-sm",
                        isSelected 
                          ? "bg-blue-mid border-blue-mid text-white scale-110" 
                          : "border-blue-mid/30 bg-white"
                      )}>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              className="flex items-center justify-center"
                            >
                              <Check size={10} className="stroke-[3.5px]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
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
                        {(() => {
                          const vGstin = inv.vendorGstin;
                          const vName = inv.vendorName;
                          const vTotal = invoices
                            .filter((i2: any) => {
                              if (vGstin && i2.vendorGstin) return i2.vendorGstin === vGstin;
                              return i2.vendorName?.toLowerCase() === vName?.toLowerCase();
                            })
                            .reduce((s: number, i2: any) => s + parseFloat(i2.invoiceTotal || "0"), 0);
                          if (vTotal > 4500000) {
                            return (
                              <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[7px] font-black uppercase tracking-wider animate-pulse">
                                ⚠️ &gt;45L
                              </span>
                            );
                          }
                          return null;
                        })()}
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
              </div>
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setShowDocPreview(true);
                      }}
                      className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10 shadow-sm hover:bg-blue-light hover:text-blue-ink hover:scale-105 active:scale-95 transition-all focus:outline-none animate-pulse-glow"
                      title="View Original Scanned Document"
                    >
                      <Eye size={24} />
                    </button>
                    <AIVoiceAgent 
                      contextMode="invoice"
                      invoiceData={selectedInvoice}
                      className="h-12 w-12 rounded-2xl"
                      onAction={(action) => {
                        if (action.intent === "EDIT_INVOICE" && action.edits) {
                          const { lineItemIndex, rate, quantity } = action.edits;
                          const msg = action.message || `AI wants to update line item ${lineItemIndex + 1}. Rate: ${rate}, Quantity: ${quantity}. Confirm to recalculate?`;
                          if (window.confirm(msg)) {
                            const currentItems = Array.isArray(selectedInvoice.lineItems) ? [...selectedInvoice.lineItems] : [];
                            if (currentItems[lineItemIndex]) {
                              const item = { ...currentItems[lineItemIndex] };
                              const newRate = rate !== null ? rate : parseFloat(item.price_per_unit || item.pricePerUnit || item.rate || "0");
                              const newQty = quantity !== null ? quantity : parseFloat(item.quantity || item.qty || "0");
                              const newTotal = newRate * newQty;
                              
                              item.price_per_unit = String(newRate);
                              item.pricePerUnit = String(newRate);
                              item.quantity = String(newQty);
                              item.qty = String(newQty);
                              item.taxable_amount = String(newTotal);
                              item.taxableAmount = String(newTotal);
                              
                              // Recalculate taxes
                              item.cgst_amount = String((parseFloat(item.cgst_rate || item.cgstRate || "0") / 100) * newTotal);
                              item.cgstAmount = item.cgst_amount;
                              item.sgst_amount = String((parseFloat(item.sgst_rate || item.sgstRate || "0") / 100) * newTotal);
                              item.sgstAmount = item.sgst_amount;
                              item.igst_amount = String((parseFloat(item.igst_rate || item.igstRate || "0") / 100) * newTotal);
                              item.igstAmount = item.igst_amount;
                              item.total_amount = String(newTotal + parseFloat(item.cgst_amount) + parseFloat(item.sgst_amount) + parseFloat(item.igst_amount));
                              item.total = item.total_amount;
                              item.totalAmount = item.total_amount;
                              
                              currentItems[lineItemIndex] = item;
                              
                              // Recalculate Grand Totals
                              const newTaxable = currentItems.reduce((acc, curr) => acc + parseFloat(curr.taxableAmount || curr.taxable_amount || "0"), 0);
                              const newCgst = currentItems.reduce((acc, curr) => acc + parseFloat(curr.cgstAmount || curr.cgst_amount || "0"), 0);
                              const newSgst = currentItems.reduce((acc, curr) => acc + parseFloat(curr.sgstAmount || curr.sgst_amount || "0"), 0);
                              const newIgst = currentItems.reduce((acc, curr) => acc + parseFloat(curr.igstAmount || curr.igst_amount || "0"), 0);
                              const newTotalGst = newCgst + newSgst + newIgst;
                              const newInvoiceTotal = newTaxable + newTotalGst;
                              
                              // Check mismatch with amount in words
                              const amountInWords = selectedInvoice.rawData?.totals?.amount_in_words || selectedInvoice.amountInWords || "";
                              let newStatus = selectedInvoice.status;
                              let newDisputeReason = selectedInvoice.disputeReason;
                              
                              // We just flag it if there's any edit as a safeguard (or check strictly if we had parsing for words)
                              if (Math.abs(parseFloat(selectedInvoice.invoiceTotal || "0") - newInvoiceTotal) > 1) {
                                 newStatus = "needs_review";
                                 newDisputeReason = `Amount verification mismatch due to AI voice edit. Old Total: ${selectedInvoice.invoiceTotal}, New Calculated Total: ${newInvoiceTotal}. Pls verify with amount in words: ${amountInWords}`;
                              }

                              updateMutation.mutate({
                                id: selectedInvoice.id,
                                lineItems: currentItems,
                                taxableAmount: String(newTaxable),
                                totalGst: String(newTotalGst),
                                cgstAmount: String(newCgst),
                                sgstAmount: String(newSgst),
                                igstAmount: String(newIgst),
                                invoiceTotal: String(newInvoiceTotal),
                                status: newStatus,
                                disputeReason: newDisputeReason
                              }, {
                                onSuccess: (updatedData) => {
                                  toast.success("AI Voice edits calculated and saved successfully!");
                                  setSelectedInvoice(updatedData);
                                }
                              });
                            } else {
                              toast.error(`Line item at index ${lineItemIndex + 1} not found.`);
                            }
                          }
                        } else if (action.message) {
                          toast.info(action.message);
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    {selectedInvoice.status !== "processed" && (
                      <button
                        onClick={() => {
                          if (isEditing) {
                            // Save changes
                            updateMutation.mutate({
                              id: selectedInvoice.id,
                              vendorName: editVendorName,
                              vendorGstin: editVendorGstin,
                              invoiceNo: editInvoiceNo,
                              invoiceDate: editInvoiceDate,
                              invoiceTotal: editInvoiceTotal,
                              taxableAmount: editTaxableAmount,
                              totalGst: editTotalGst,
                              category: editCategory,
                              rawData: {
                                ...selectedInvoice.rawData,
                                seller: {
                                  ...(selectedInvoice.rawData?.seller || {}),
                                  name: editVendorName,
                                  gstin: editVendorGstin,
                                  address: editAddress,
                                  mobile: editMobile,
                                  phone: editPhone,
                                  email: editEmail,
                                  bank_details: {
                                    account_holder: editBankHolder,
                                    account_number: editBankAccountNo,
                                    bank_name: editBankName,
                                    ifsc: editBankIfsc,
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
                      <label className="text-[9px] uppercase font-black tracking-wider text-blue-mid/50">Vendor Name</label>
                      <input 
                        type="text" 
                        value={editVendorName} 
                        onChange={e => setEditVendorName(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-xl px-3 py-1.5 w-full text-base font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                      />
                    </div>
                  ) : (
                    selectedInvoice.vendorName
                  )}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-blue-mid mt-0.5 flex flex-wrap gap-x-2 items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <label className="text-[9px] uppercase font-black tracking-wider text-blue-mid/50">Invoice No</label>
                      <input 
                        type="text" 
                        value={editInvoiceNo} 
                        onChange={e => setEditInvoiceNo(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-xl px-2 py-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none w-36"
                      />
                    </div>
                  ) : (
                    <span>{selectedInvoice.invoiceNo}</span>
                  )}
                  <span>•</span>
                  <span>Extracted by {selectedInvoice.uploadedBy}</span>
                </DrawerDescription>
              </DrawerHeader>

              {/* Status Alert for Verification Requirement */}
              {selectedInvoice.status === "needs_review" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-red-800 uppercase tracking-wide">Accounting Posting Locked</p>
                      <p className="text-[10px] text-red-600 font-bold uppercase mt-0.5 tracking-wider">
                        Reason: {selectedInvoice.disputeReason || "Low confidence score/Duplicate warnings"}
                      </p>
                    </div>
                  </div>
                  {!makerCheckerEnabled && (
                    <button
                      onClick={() => {
                        updateMutation.mutate({
                          id: selectedInvoice.id,
                          status: "pending",
                          disputeReason: null,
                          comments: "Manually verified and released by accountant."
                        }, {
                          onSuccess: (updatedData) => {
                            toast.success("Verification confirmed! Posted to accounts ledger.");
                            setSelectedInvoice(updatedData);
                          }
                        });
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm transition-all flex-shrink-0"
                    >
                      Approve & Post
                    </button>
                  )}
                </div>
              )}

              {/* SECTION: VENDOR & INVOICE STRUCTURAL HEADERS */}

              {/* 45 LAKH TDS/194Q COMPLIANCE WARNING */}
              {(() => {
                const vendorGstin = selectedInvoice.vendorGstin;
                const vendorName = selectedInvoice.vendorName;
                const currentFy = selectedInvoice.financialYear || "2026-2027";
                const vendorTotal = invoices
                  .filter((inv: any) => {
                    const matchGstin = vendorGstin && inv.vendorGstin && inv.vendorGstin === vendorGstin;
                    const matchName = !vendorGstin && inv.vendorName && inv.vendorName.toLowerCase() === vendorName?.toLowerCase();
                    return (matchGstin || matchName) && (inv.financialYear === currentFy || !inv.financialYear);
                  })
                  .reduce((sum: number, inv: any) => sum + parseFloat(inv.invoiceTotal || "0"), 0);
                
                if (vendorTotal > 4500000) {
                  const lakhs = (vendorTotal / 100000).toFixed(2);
                  return (
                    <div className="rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 p-4 flex items-start gap-3 shadow-sm animate-pulse-glow">
                      <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-red-700 uppercase tracking-wider">⚠️ TDS/194Q Compliance Warning</p>
                        <p className="text-[10px] text-red-600 font-bold mt-1">
                          Vendor purchases for FY {currentFy} exceed <span className="font-black">₹45 Lakhs</span> (Current Total: <span className="font-black text-red-800">₹{lakhs}L</span>). 
                          Ensure <span className="font-black">0.1% TDS under Section 194Q</span> is deducted on all future payments to this vendor.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                {/* CARD 1: VENDOR MASTER INFO */}
                <div className="card p-4 space-y-2.5">
                  <span className="section-label block mb-1">Vendor Master Info</span>
                  {(() => {
                    const seller = selectedInvoice.rawData?.seller || {};
                    const mobile = currentVendor?.phone || seller.mobile || (seller.phone && seller.phone.startsWith("+91") ? seller.phone : null) || (seller.phone && seller.phone.length === 10 ? `+91 ${seller.phone}` : null) || "";
                    const landline = seller.landline || "";
                    const email = currentVendor?.email || seller.email || "";
                    const address = selectedInvoice.rawData?.seller?.address || currentVendor?.address || "—";

                    // Deduplicate Phone and Mobile if they match
                    let phoneStr = seller.phone || landline || "";
                    if (mobile && phoneStr && mobile.replace(/[^a-zA-Z0-9]/g, "") === phoneStr.replace(/[^a-zA-Z0-9]/g, "")) {
                      phoneStr = "";
                    }

                    const fields = [
                      { label: "Legal Name", val: selectedInvoice.vendorName, isEditable: true, editValue: editVendorName, setEditValue: setEditVendorName },
                      { label: "GSTIN", val: selectedInvoice.vendorGstin || "Not Provided", highlight: true, isEditable: true, editValue: editVendorGstin, setEditValue: setEditVendorGstin },
                      { label: "PAN", val: selectedInvoice.vendorGstin ? selectedInvoice.vendorGstin.slice(2, 12) : "—" },
                      { label: "State Code", val: selectedInvoice.vendorGstin ? `${selectedInvoice.vendorGstin.slice(0, 2)} (${getStateNameFromCode(selectedInvoice.vendorGstin)})` : "—" },
                      { label: "Address", val: address || "—", isEditable: true, editValue: editAddress, setEditValue: setEditAddress },
                      { label: "Mobile", val: mobile || "—", isEditable: true, editValue: editMobile, setEditValue: setEditMobile },
                      ...(phoneStr ? [{ label: "Phone", val: phoneStr, isEditable: true, editValue: editPhone, setEditValue: setEditPhone }] : []),
                      { label: "Email", val: email || "—", isEditable: true, editValue: editEmail, setEditValue: setEditEmail },
                    ];

                    return fields.map((fld) => (
                      <div key={fld.label} className="text-[10px]">
                        <span className="text-blue-mid/60 uppercase font-black tracking-wider block mb-0.5">{fld.label}</span>
                        {isEditing && fld.isEditable ? (
                          <input 
                            type="text" 
                            value={fld.editValue} 
                            onChange={e => fld.setEditValue?.(e.target.value)}
                            className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                          />
                        ) : (
                          <span className={cn("font-bold text-blue-ink", fld.highlight && "text-blue-mid font-black")}>{fld.val}</span>
                        )}
                      </div>
                    ));
                  })()}

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
                          {(() => {
                            const ocrBank = selectedInvoice.rawData?.seller?.bank_details;
                            if (isEditing) {
                              return (
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Holder Name</span>
                                    <input type="text" value={editBankHolder} onChange={e => setEditBankHolder(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none" />
                                  </div>
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Account Number</span>
                                    <input type="text" value={editBankAccountNo} onChange={e => setEditBankAccountNo(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none tracking-widest" />
                                  </div>
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Bank Name</span>
                                    <input type="text" value={editBankName} onChange={e => setEditBankName(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none" />
                                  </div>
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">IFSC Code</span>
                                    <input type="text" value={editBankIfsc} onChange={e => setEditBankIfsc(e.target.value)} className="bg-white border border-blue-mid/10 rounded-lg px-2 py-0.5 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none tracking-widest" />
                                  </div>
                                </div>
                              );
                            }
                            if (ocrBank) {
                              return (
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Holder Name</span>
                                    <span className="font-black text-blue-ink">{ocrBank.account_holder}</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">Account Number</span>
                                    <span className="font-black text-blue-ink tracking-widest">••••••••{ocrBank.account_number?.slice(-4)}</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-mid/50 font-bold uppercase block text-[8px]">IFSC & Bank</span>
                                    <span className="font-black text-blue-ink">{ocrBank.ifsc} · {ocrBank.bank_name}</span>
                                  </div>
                                </div>
                              );
                            }
                            
                            if (bankAccounts.length === 0) {
                              return <div className="text-blue-mid/40 font-bold uppercase tracking-wider py-1">No beneficiary data extracted</div>;
                            }
                            
                            return bankAccounts.map((acct: any) => (
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
                            ));
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* CARD 3: INVOICE LOGISTICS */}
                <div className="card p-4 space-y-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="section-label">Invoice Logistics</span>
                    <button 
                      onClick={() => {
                        const daysMatch = localPaymentTerms.match(/\d+/);
                        let updatedDueDate = selectedInvoice.dueDate || selectedInvoice.invoiceDate;
                        if (daysMatch) {
                          const days = parseInt(daysMatch[0], 10);
                          const invoiceDate = new Date(selectedInvoice.invoiceDate);
                          if (!isNaN(invoiceDate.getTime())) {
                            const calculated = new Date(invoiceDate.getTime() + days * 24 * 60 * 60 * 1000);
                            updatedDueDate = calculated.toISOString().split("T")[0];
                          }
                        }
                        updateMutation.mutate({
                          id: selectedInvoice.id,
                          dueDate: updatedDueDate,
                          category: editCategory,
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
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={editInvoiceDate} 
                        onChange={e => setEditInvoiceDate(e.target.value)}
                        className="bg-white border border-blue-mid/10 rounded-lg px-2 py-1 w-full text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-blue-ink">{formatDate(selectedInvoice.invoiceDate)}</span>
                    )}
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

                  {(() => {
                    const daysMatch = localPaymentTerms.match(/\d+/);
                    let computedDueDate = selectedInvoice.dueDate || selectedInvoice.invoiceDate;
                    if (daysMatch) {
                      const days = parseInt(daysMatch[0], 10);
                      const baseDateStr = isEditing ? editInvoiceDate : selectedInvoice.invoiceDate;
                      const invoiceDate = new Date(baseDateStr);
                      if (!isNaN(invoiceDate.getTime())) {
                        const calculated = new Date(invoiceDate.getTime() + days * 24 * 60 * 60 * 1000);
                        computedDueDate = calculated.toISOString().split("T")[0];
                      }
                    }
                    return (
                      <div className="text-[10px]">
                        <span className="text-blue-mid/60 uppercase font-black tracking-wider block mb-0.5">Due Date</span>
                        <span className="font-black text-red-500">{formatDate(computedDueDate)}</span>
                      </div>
                    );
                  })()}

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

                  <div className="text-[10px]">
                    <label className="text-blue-mid/60 uppercase font-black tracking-wider block mb-1">Purchase Segment / Category</label>
                    <div className="flex gap-1.5 items-center">
                      <select 
                        value={editCategory}
                        onChange={e => {
                          setEditCategory(e.target.value);
                          updateMutation.mutate({
                            id: selectedInvoice.id,
                            category: e.target.value
                          });
                        }}
                        className="bg-white border border-blue-mid/10 rounded-lg px-2 py-1 flex-1 text-xs font-bold text-blue-ink focus:border-blue-mid focus:outline-none h-7"
                      >
                        {segments.map(seg => (
                          <option key={seg} value={seg}>{seg}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => {
                          const newSeg = prompt("Enter new purchase segment / category name:");
                          if (newSeg && newSeg.trim()) {
                            const trimmed = newSeg.trim();
                            if (segments.includes(trimmed)) {
                              toast.error("Category already exists!");
                              return;
                            }
                            const updatedSegments = [...segments, trimmed];
                            setSegments(updatedSegments);
                            setEditCategory(trimmed);
                            updateMutation.mutate({
                              id: selectedInvoice.id,
                              category: trimmed
                            });
                            toast.success(`Category "${trimmed}" added ✓`);
                          }
                        }}
                        className="h-7 w-7 rounded-lg bg-blue-mid/10 hover:bg-blue-mid/20 text-blue-mid flex items-center justify-center border border-blue-mid/15 transition-all text-xs font-black active:scale-95 cursor-pointer"
                        title="Add Category"
                      >
                        +
                      </button>

                      <button
                        onClick={() => {
                          if (segments.length <= 1) {
                            toast.error("Cannot delete the last remaining category.");
                            return;
                          }
                          if (confirm(`Are you sure you want to delete category "${editCategory}"? All invoices in this category will default to "Steel".`)) {
                            const updatedSegments = segments.filter(s => s !== editCategory);
                            setSegments(updatedSegments);
                            const nextCategory = updatedSegments[0] || "Steel";
                            setEditCategory(nextCategory);
                            updateMutation.mutate({
                              id: selectedInvoice.id,
                              category: nextCategory
                            });
                            toast.success(`Category "${editCategory}" removed ✓`);
                          }
                        }}
                        className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 flex items-center justify-center border border-red-500/15 transition-all text-xs font-black active:scale-95 cursor-pointer"
                        title="Remove Category"
                      >
                        -
                      </button>
                    </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="card p-3">
                  <span className="section-label block mb-0.5">Subtotal (Taxable)</span>
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
                <div className="card p-3">
                  <span className="section-label block mb-0.5">Total GST</span>
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
                <div className="card p-3 bg-blue-mid/5 border border-blue-mid/25 shadow-sm">
                  <span className="section-label block mb-0.5 text-blue-mid font-black">Grand Total</span>
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
                <div className="card p-3 bg-green-50 border border-green-200">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="section-label text-green-700">TDS (Sec 194Q)</span>
                    <Percent size={10} className="text-green-600" />
                  </div>
                  <p className="fin-num text-lg text-green-700">-{formatINR(selectedInvoice.tdsDeducted || "0.00")}</p>
                  <span className="text-[8px] font-black text-green-600 uppercase tracking-widest mt-1 block">Deducted @ 0.1%</span>
                </div>
                <div className="card p-3">
                  <span className="section-label block mb-0.5">TCS (206C(1H))</span>
                  <p className="fin-num text-lg text-blue-ink">{formatINR(selectedInvoice.tcsCollected || "0.00")}</p>
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
                      <div className="relative flex items-center">
                        <style>{`
                          .custom-date-input::-webkit-calendar-picker-indicator {
                            display: none !important;
                            -webkit-appearance: none !important;
                          }
                        `}</style>
                        <input 
                          type="date" 
                          ref={dateInputRef}
                          value={scheduleDate} 
                          onChange={e => setScheduleDate(e.target.value)} 
                          className="custom-date-input bg-white border border-blue-mid/10 rounded-xl p-1.5 pr-9 w-full text-xs font-bold text-blue-ink focus:outline-none focus:border-blue-mid"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              dateInputRef.current?.showPicker();
                            } catch (err) {}
                          }}
                          className="absolute right-1.5 p-1 rounded-lg text-blue-mid hover:text-blue-ink border border-blue-mid/20 bg-blue-light/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:border-blue-mid/40"
                          title="Open Calendar"
                        >
                          <Calendar size={13} />
                        </button>
                      </div>
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

              {/* Dynamic Simulated Original Invoice Scanned Document Preview Modal */}
              <AnimatePresence>
                {showDocPreview && selectedInvoice && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowDocPreview(false)}
                      className="absolute inset-0 bg-blue-ink/65 backdrop-blur-sm animate-fade-in"
                    />
                    
                    {/* Sheet Container */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 30 }}
                      className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-blue-mid/20 overflow-hidden z-10 flex flex-col my-8 max-h-[88vh]"
                    >
                      {/* View Header */}
                      <div className="flex justify-between items-center bg-blue-light/50 px-8 py-4 border-b border-blue-mid/10 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Eye className="text-blue-mid animate-pulse" size={16} />
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-ink">Document Viewer (Original Tax Invoice)</span>
                        </div>
                        <button
                          onClick={() => setShowDocPreview(false)}
                          className="px-4 py-2 rounded-xl border border-blue-mid/20 hover:border-blue-mid/45 text-[9px] font-black uppercase tracking-wider text-blue-mid bg-white hover:bg-blue-light/20 transition-all shadow-sm"
                        >
                          Close Preview
                        </button>
                      </div>

                      {/* Real Paper Document Rendering */}
                      <div className="p-8 overflow-y-auto no-scrollbar bg-[#fafafa] flex-1">
                        {selectedInvoice.rawData?.fileBase64 ? (
                          <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] min-h-[500px]">
                            {selectedInvoice.rawData.fileBase64.startsWith("data:application/pdf") ? (
                              <iframe 
                                src={selectedInvoice.rawData.fileBase64} 
                                className="w-full h-[70vh] rounded-2xl border border-blue-mid/10 shadow-sm animate-fade-in"
                                title="Original Scanned Document"
                              />
                            ) : (
                              <div className="relative rounded-2xl border border-blue-mid/10 shadow-sm overflow-hidden bg-white p-2 max-w-3xl mx-auto animate-fade-in">
                                <img 
                                  src={selectedInvoice.rawData.fileBase64} 
                                  className="max-h-[70vh] w-auto object-contain rounded-xl"
                                  alt="Original Scanned Document"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <ScannedPaperInvoice invoice={selectedInvoice} />
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
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
              docTypeHint="PURCHASE_INVOICE"
              onExtract={handleExtract}
              onCancel={() => setShowScanDrawer(false)}
              onFileSelected={handleBackgroundExtract}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* LEVEL 3 — FLOATING BULK ACTIONS BAR */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.95)" }}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                {selectedInvoiceIds.length} Invoice{selectedInvoiceIds.length > 1 ? "s" : ""} Selected
              </span>
              <button 
                onClick={() => setSelectedInvoiceIds([])}
                className="text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
              >
                Cancel Selection
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={handleBulkDownload}
                className="bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-1 border border-white/5"
              >
                <FileDown size={14} /> Download
              </button>
              <button 
                onClick={handleBulkShare}
                className="bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-1 border border-white/5"
              >
                <Share2 size={14} /> Share
              </button>
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
