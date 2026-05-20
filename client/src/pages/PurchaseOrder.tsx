/**
 * PurchaseOrder.tsx — Purchase Order management
 * Shows fulfillment % via animated progress bar. Uses shared formatters.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { compressFileForOcr } from "@/lib/image-compress";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, Search, FileDown, X, ChevronRight, Eye, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { downloadExcel } from "@/lib/excel-export";
import { useLocalFilter } from "@/hooks/useLocalFilter";
import { formatINR, formatDate, fulfillmentPct, toFloat } from "@/lib/formatters";
import { PO_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PurchaseOrderScannedPaper } from "@/components/cards/PurchaseOrderPreview";

const TABS = [
  { id: "open",    label: "Open"    },
  { id: "partial", label: "Partial" },
  { id: "closed",  label: "Closed"  },
];

const statusColors: Record<string, string> = {
  open:    "badge-success",
  partial: "badge-warning",
  closed:  "badge-neutral",
};

export default function PurchaseOrder() {
  const [selectedPO, setSelectedPO]         = useState<any>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const qc = useQueryClient();

  const { data: pos = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/purchase-orders"] });

  const createMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/purchase-orders", d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/purchase-orders"] }),
  });

  const processingPOs = pos.filter((po: any) => po.status === "processing");
  const nonProcessingPOs = pos.filter((po: any) => po.status !== "processing");

  const { search, setSearch, activeTab, setActiveTab, filtered } = useLocalFilter({
    items: nonProcessingPOs,
    searchFields: ["poNumber", "buyerName"],
    tabKey: "status",
    defaultTab: "open",
  });

  const generateMockOcr = (fileName: string) => {
    const buyers = [
      { name: "Bharat Heavy Electricals Ltd (BHEL)", gstin: "33AAACB4824A1ZB", address: "Ranipet Boiler Auxiliaries Plant, Ranipet, Tamil Nadu - 632406", city: "Ranipet", state: "Tamil Nadu", pincode: "632406" },
      { name: "Larsen & Toubro Construction", gstin: "27AAACL1024D1ZA", address: "L&T House, Ballard Estate, Mumbai, Maharashtra - 400001", city: "Mumbai", state: "Maharashtra", pincode: "400001" },
      { name: "Kolkata Metro Rail Corp (KMRC)", gstin: "19AAACK9824A1Z8", address: "HRBC Complex, KMRCL Bhawan, Munshi Premchand Sarani, Kolkata - 700021", city: "Kolkata", state: "West Bengal", pincode: "700021" }
    ];
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];
    const mockPoNo = `PO/26-27/${Math.floor(1000 + Math.random() * 9000)}`;
    const lineItems = [
      {
        item_no: 1,
        description: "Hot Dip Galvanised Perforated Cable Trays 150x50x2.0mm",
        hsn_code: "73089090",
        quantity: 1200,
        uom: "Mtr",
        unit_price: 650.00,
        tax_type: "IGST",
        tax_rate_percent: 18,
        total_amount_excl_tax: 780000,
        total_amount_incl_tax: 920400,
        delivery_date: format(new Date(Date.now() + 15 * 86400000), "yyyy-MM-dd")
      },
      {
        item_no: 2,
        description: "Coupler Plates 50x5.0mm with Fasteners",
        hsn_code: "73089090",
        quantity: 2400,
        uom: "Pcs",
        unit_price: 45.00,
        tax_type: "IGST",
        tax_rate_percent: 18,
        total_amount_excl_tax: 108000,
        total_amount_incl_tax: 127440,
        delivery_date: format(new Date(Date.now() + 15 * 86400000), "yyyy-MM-dd")
      }
    ];
    const basic = 888000;
    const tax = 159840;
    const grand = 1047840;

    return {
      document_type: "PURCHASE_ORDER",
      po_number: mockPoNo,
      po_date: format(new Date(), "yyyy-MM-dd"),
      gem_contract_no: `GEM-${Math.floor(10000000 + Math.random() * 90000000)}`,
      buyer: {
        organization_name: buyer.name,
        gstin: buyer.gstin,
        address_line1: buyer.address,
        city: buyer.city,
        state: buyer.state,
        pincode: buyer.pincode
      },
      line_items: lineItems,
      totals: {
        basic_price_ex_works: basic,
        grand_total: grand,
        igst_amount: tax,
        igst_rate: 18
      },
      delivery: {
        delivery_period_days: 30,
        delivery_basis: "F.O.R. Kolkata Works",
        delivery_location: "KMRC Ezra Site"
      },
      payment_terms: {
        advance_percent: 10,
        balance_percent: 90,
        payment_days: 45
      }
    };
  };

  const handleBackgroundExtract = async (file: File) => {
    setShowScanDrawer(false);
    toast.info(`"${file.name}" uploaded! Procurement PO OCR scan running in background...`, { duration: 2000 });

    const tempPoNo = `OCR-PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialPayload = {
      poNumber: tempPoNo,
      poDate: format(new Date(), "yyyy-MM-dd"),
      buyerName: `Processing: ${file.name.slice(0, 20)}`,
      buyerGstin: "19AAAAC1234A1Z1",
      grandTotal: "0.00",
      orderedQty: "0",
      receivedQty: "0",
      status: "processing",
      rawData: { 
        fileName: file.name, 
        processingStage: "Stage 1: Scanning Purchase Order (OCR)" 
      }
    };

    try {
      const res = await apiRequest("POST", "/api/purchase-orders", initialPayload);
      const created = await res.json();
      const poId = created.id;

      qc.invalidateQueries({ queryKey: ["/api/purchase-orders"] });

      let uploadedBase64 = "";
      const updateStage = async (stageText: string, extraData: any = {}) => {
        try {
          await apiRequest("PATCH", `/api/purchase-orders/${poId}`, {
            rawData: { 
              fileName: file.name, 
              processingStage: stageText,
              ...extraData
            }
          });
          qc.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
        } catch (err) {
          console.error("Failed to update PO scanning stage:", err);
        }
      };

      try {
        await updateStage("Stage 2: Processing AI OCR Extraction...");
        const { base64: base64Content, mimeType, dataUrl } = await compressFileForOcr(file);
        uploadedBase64 = dataUrl;

        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64Content, mimeType, docTypeHint: "PURCHASE_ORDER" }),
        });

        const response = await res.json();
        if (response.success && response.data) {
          await updateStage("Stage 3: Auto-Validating Line Items & Delivery Terms...");
          
          const ocrData = response.data;
          const lineItems = ocrData.line_items || [];
          const orderedQty = lineItems.reduce((s: number, li: any) => s + (li.quantity || 0), 0);
          
          const finalPayload = {
            poNumber: ocrData.po_number || `PO-${Date.now()}`,
            poDate: ocrData.po_date || format(new Date(), "yyyy-MM-dd"),
            buyerName: ocrData.buyer?.organization_name || "Unknown Buyer",
            buyerGstin: ocrData.buyer?.gstin || "",
            gemContractNo: ocrData.gem_contract_no || null,
            grandTotal: String(ocrData.totals?.grand_total ?? "0"),
            orderedQty: String(orderedQty),
            status: "open",
            lineItems,
            rawData: {
              ...ocrData,
              fileBase64: uploadedBase64,
              processingStage: "Complete!"
            }
          };

          await apiRequest("PATCH", `/api/purchase-orders/${poId}`, finalPayload);
          qc.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
          toast.success(`OCR Complete: Purchase Order ${finalPayload.poNumber} structured!`);
        } else {
          throw new Error(response.error || "OCR extraction failed");
        }
      } catch (err: any) {
        console.error("Real PO OCR failed, falling back to mock", err);
        toast.warning("Real PO OCR pipeline failed. Falling back to structured trial data.", {
          description: err.message || "Is your backend running and configured?"
        });

        // Fallback to mock
        const ocrData = generateMockOcr(file.name);
        const lineItems = ocrData.line_items || [];
        const orderedQty = lineItems.reduce((s: number, li: any) => s + (li.quantity || 0), 0);
        
        const finalPayload = {
          poNumber: ocrData.po_number || `PO-${Date.now()}`,
          poDate: ocrData.po_date || format(new Date(), "yyyy-MM-dd"),
          buyerName: ocrData.buyer?.organization_name || "BHEL- Ranipet",
          buyerGstin: ocrData.buyer?.gstin || "19AAAAC1234A1Z1",
          gemContractNo: ocrData.gem_contract_no || null,
          grandTotal: String(ocrData.totals?.grand_total ?? "0"),
          orderedQty: String(orderedQty),
          status: "open",
          lineItems,
          rawData: {
            ...ocrData,
            fileBase64: uploadedBase64,
            processingStage: "Complete (Demo Fallback)"
          }
        };

        await apiRequest("PATCH", `/api/purchase-orders/${poId}`, finalPayload);
        qc.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      }
    } catch (e: any) {
      toast.error(`OCR processing failed: ${e.message}`);
    }
  };

  const handleExtract = async (data: any) => {
    const lineItems   = data.line_items || [];
    const orderedQty  = lineItems.reduce((s: number, li: any) => s + (li.quantity || 0), 0);
    const payload = {
      poNumber:           data.po_number || `PO-${Date.now()}`,
      poDate:             data.po_date || format(new Date(), "yyyy-MM-dd"),
      buyerName:          data.buyer?.organization_name || "BHEL- Ranipet",
      buyerGstin:         data.buyer?.gstin || "33AAACB4824A1ZB",
      gemContractNo:      data.gem_contract_no || null,
      grandTotal:         String(data.totals?.grand_total ?? "117000"),
      orderedQty:         String(orderedQty || 6500),
      receivedQty:        "0",
      deliveryPeriodDays: data.delivery?.delivery_period_days ?? null,
      status:             PO_STATUSES.OPEN,
      lineItems,
      rawData:            data,
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Purchase Order saved ✓");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  return (
    <div className="space-y-4 py-4 pb-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">Procurement</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight">Orders</h1>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => downloadExcel(pos, "Purchase_Orders", "POs").then(() => toast.success("Exported"))}
            className="icon-btn">
            <FileDown size={18} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => setShowScanDrawer(true)}
            className="icon-btn icon-btn-primary">
            <Plus size={18} />
          </motion.button>
          <ProfileMenu />
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
        <input className="search-input" placeholder="Search PO number, buyer..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <div className="tab-group">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("tab-item", activeTab === t.id && "active")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {TABS.map(t => {
          const count = pos.filter((p: any) => p.status === t.id).length;
          return (
            <div key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn("card p-3 cursor-pointer transition-all", activeTab === t.id && "border-blue-mid/30 bg-blue-mid/5")}>
              <p className="fin-num text-xl text-blue-ink">{count}</p>
              <p className="section-label mt-0.5">{t.label}</p>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading && [1,2,3].map(i => <div key={i} className="skeleton h-28 w-full" />)}
        <AnimatePresence mode="popLayout">
          {!isLoading && filtered.length === 0 && processingPOs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3 text-blue-mid/30">
              <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
                <Package size={28} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">No {activeTab} orders</p>
            </motion.div>
          )}

          {/* Processing Cards */}
          {processingPOs.map((po: any) => (
            <motion.div
              key={po.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card p-4 relative overflow-hidden bg-blue-light/20 border-dashed border-2 border-blue-mid/20 animate-pulse cursor-not-allowed select-none"
              onClick={() => toast.info(`Processing "${po.rawData?.fileName || "PO PDF"}" in background. Almost done!`)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-mid animate-pulse" />
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-blue-ink text-xs uppercase tracking-tight truncate">
                      🤖 {po.rawData?.fileName || "Scanning Purchase Order..."}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-mid/10 text-[8px] font-black text-blue-mid uppercase tracking-widest animate-pulse">
                      Processing
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-mid/70 font-semibold truncate">
                    {po.rawData?.processingStage || "Stage 1: Scanning Purchase Order (OCR)"}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Loader2 size={16} className="animate-spin text-blue-mid" />
                </div>
              </div>
            </motion.div>
          ))}

          {/* Normal Cards */}
          {filtered.map((po: any) => {
            const pct = fulfillmentPct(toFloat(po.orderedQty), toFloat(po.receivedQty));
            return (
              <motion.div
                key={po.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                whileTap={{ scale: 0.982 }}
                onClick={() => setSelectedPO(po)}
                className="card card-interactive p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-blue-ink text-sm">{po.poNumber}</h4>
                      <span className={cn("badge", statusColors[po.status])}>{STATUS_LABELS[po.status]}</span>
                    </div>
                    <p className="text-[10px] text-blue-mid/70 font-semibold truncate">{po.buyerName}</p>
                    <p className="text-[10px] text-blue-mid/40 font-medium">{formatDate(po.poDate)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="fin-num text-base text-blue-ink">{formatINR(po.grandTotal)}</p>
                    <ChevronRight size={14} className="text-blue-mid/25 ml-auto mt-1" />
                  </div>
                </div>

                {/* Fulfillment bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-blue-mid/50 uppercase tracking-widest">
                    <span>Fulfilment</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail Drawer */}
      <Drawer open={!!selectedPO} onOpenChange={o => !o && setSelectedPO(null)}>
        <DrawerContent className="max-h-[92dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem]">
          {selectedPO && (
            <div className="p-6 space-y-5 overflow-y-auto no-scrollbar pb-10">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10 shadow-sm">
                      <Package size={22} />
                    </div>
                    <button 
                      onClick={() => {
                        setShowDocPreview(true);
                      }}
                      className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10 shadow-sm hover:bg-blue-light hover:text-blue-ink hover:scale-105 active:scale-95 transition-all focus:outline-none animate-pulse-glow"
                      title="View Original Scanned Document"
                    >
                      <Eye size={24} />
                    </button>
                  </div>
                  <DrawerClose className="icon-btn"><X size={18} /></DrawerClose>
                </div>
                <DrawerTitle className="text-2xl font-black text-blue-ink">{selectedPO.poNumber}</DrawerTitle>
                <DrawerDescription className="text-sm text-blue-mid mt-0.5">
                  {selectedPO.buyerName} · {formatDate(selectedPO.poDate)}
                </DrawerDescription>
              </DrawerHeader>

              <div className="card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-blue-light pb-4">
                  <span className="section-label">Order Value</span>
                  <span className="fin-num text-3xl text-blue-ink">{formatINR(selectedPO.grandTotal)}</span>
                </div>
                {[
                  { label: "Ordered Qty",  value: `${selectedPO.orderedQty} units` },
                  { label: "Received Qty", value: `${selectedPO.receivedQty} units` },
                  { label: "Fulfilment",   value: `${Math.round(fulfillmentPct(toFloat(selectedPO.orderedQty), toFloat(selectedPO.receivedQty)))}%` },
                  { label: "Delivery",     value: selectedPO.deliveryPeriodDays ? `${selectedPO.deliveryPeriodDays} days` : "—" },
                  { label: "GEM Contract", value: selectedPO.gemContractNo || "—" },
                  { label: "Status",       value: STATUS_LABELS[selectedPO.status] },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-blue-mid font-medium">{label}</span>
                    <span className="font-bold text-blue-ink capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <div className="pb-safe">
                <button onClick={() => setSelectedPO(null)} className="btn-primary">Done</button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Original Document Preview Sheet */}
      <Drawer open={showDocPreview} onOpenChange={setShowDocPreview}>
        <DrawerContent className="max-h-[95dvh] bg-blue-light border-blue-mid/10 rounded-t-[2.5rem] overflow-y-auto no-scrollbar">
          <div className="p-6 pb-12 overflow-y-auto no-scrollbar max-w-4xl mx-auto w-full relative flex flex-col">
            <div className="flex justify-between items-center bg-blue-light/50 px-8 py-4 border-b border-blue-mid/10 flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Eye className="text-blue-mid animate-pulse" size={16} />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-ink">Document Viewer (Original Purchase Order)</span>
              </div>
              <button
                onClick={() => setShowDocPreview(false)}
                className="px-4 py-2 rounded-xl border border-blue-mid/20 hover:border-blue-mid/45 text-[9px] font-black uppercase tracking-wider text-blue-mid bg-white hover:bg-blue-light/20 transition-all shadow-sm"
              >
                Close Preview
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto no-scrollbar bg-[#fafafa] flex-1">
              {selectedPO && selectedPO.rawData?.fileBase64 ? (
                <div className="flex flex-col items-center justify-center p-4 bg-[#fafafa] min-h-[500px]">
                  {selectedPO.rawData.fileBase64.startsWith("data:application/pdf") ? (
                    <iframe 
                      src={selectedPO.rawData.fileBase64} 
                      className="w-full h-[70vh] rounded-2xl border border-blue-mid/10 shadow-sm animate-fade-in"
                      title="Original Scanned Document"
                    />
                  ) : (
                    <div className="relative rounded-2xl border border-blue-mid/10 shadow-sm overflow-hidden bg-white p-2 max-w-3xl mx-auto animate-fade-in">
                      <img 
                        src={selectedPO.rawData.fileBase64} 
                        className="max-h-[70vh] w-auto object-contain rounded-xl"
                        alt="Original Scanned Document"
                      />
                    </div>
                  )}
                </div>
              ) : (
                selectedPO && <PurchaseOrderScannedPaper po={selectedPO} />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Scanner */}
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
              docTypeHint="PURCHASE_ORDER" 
              onExtract={handleExtract} 
              onCancel={() => setShowScanDrawer(false)}
              onFileSelected={handleBackgroundExtract}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

