/**
 * PurchaseOrder.tsx — Purchase Order management
 * Shows fulfillment % via animated progress bar. Uses shared formatters.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Package, Plus, Search, FileDown, X, ChevronRight } from "lucide-react";
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
  const qc = useQueryClient();

  const { data: pos = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/purchase-orders"] });

  const createMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/purchase-orders", d).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/purchase-orders"] }),
  });

  const { search, setSearch, activeTab, setActiveTab, filtered } = useLocalFilter({
    items: pos,
    searchFields: ["poNumber", "buyerName"],
    tabKey: "status",
    defaultTab: "open",
  });

  const handleExtract = async (data: any) => {
    const lineItems   = data.line_items || [];
    const orderedQty  = lineItems.reduce((s: number, li: any) => s + (li.quantity || 0), 0);
    const payload = {
      poNumber:           data.po_number || `PO-${Date.now()}`,
      poDate:             data.po_date || format(new Date(), "yyyy-MM-dd"),
      buyerName:          data.buyer?.organization_name,
      buyerGstin:         data.buyer?.gstin,
      gemContractNo:      data.gem_contract_no,
      grandTotal:         String(data.totals?.grand_total ?? ""),
      orderedQty:         String(orderedQty),
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
          {!isLoading && filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3 text-blue-mid/30">
              <div className="h-16 w-16 rounded-[2rem] bg-white/60 flex items-center justify-center border border-blue-mid/10">
                <Package size={28} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">No {activeTab} orders</p>
            </motion.div>
          )}
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
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-blue-mid border border-blue-mid/10">
                    <Package size={22} />
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

      {/* Scanner */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[92dvh] bg-white border-blue-mid/10 rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor docTypeHint="PURCHASE_ORDER" onExtract={handleExtract} onCancel={() => setShowScanDrawer(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
