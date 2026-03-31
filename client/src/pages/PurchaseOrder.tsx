import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Receipt, Package, Plus, Search, Camera, FileDown, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { DocumentExtractor } from "@/components/DocumentExtractor";
import { toast } from "sonner";
import { downloadExcel } from "@/lib/excel-export";
import { format } from "date-fns";

export default function PurchaseOrder() {
  const [activeTab, setActiveTab] = useState("open");
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();

  const { data: pos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/purchase-orders", data).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] }),
  });

  const handleDownloadExcel = async () => {
    await downloadExcel(pos, "Purchase_Orders", "POs");
    toast.success("Purchase Orders exported to Excel");
  };

  const handleExtract = async (data: any) => {
    const lineItems = data.line_items || [];
    const orderedQty = lineItems.reduce((s: number, li: any) => s + (li.quantity || 0), 0);
    const payload = {
      poNumber: data.po_number || `PO-${Date.now()}`,
      poDate: data.po_date || format(new Date(), "yyyy-MM-dd"),
      buyerName: data.buyer?.organization_name,
      buyerGstin: data.buyer?.gstin,
      gemContractNo: data.gem_contract_no,
      grandTotal: String(data.totals?.grand_total ?? ""),
      orderedQty: String(orderedQty),
      receivedQty: "0",
      deliveryPeriodDays: data.delivery?.delivery_period_days ?? null,
      status: "open",
      lineItems,
      rawData: data,
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowScanDrawer(false);
      toast.success("Purchase Order saved");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    }
  };

  const filtered = pos.filter((po: any) => {
    const matchesTab = po.status === activeTab;
    const matchesSearch = !search || [po.poNumber, po.buyerName].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Purchase Orders</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadExcel} className="h-9 w-9 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
              <FileDown size={18} />
            </button>
            <button onClick={() => setShowScanDrawer(true)} className="h-9 w-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
              <Camera size={18} />
            </button>
            <button onClick={() => setShowScanDrawer(true)} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input
            placeholder="Search PO numbers, buyer..."
            className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          {["open", "partial", "closed"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all", activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4 no-scrollbar">
        {isLoading && <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
            <Package size={32} className="opacity-30" />
            <p className="text-sm font-medium">No {activeTab} POs — scan a PO to add</p>
          </div>
        )}
        {filtered.map((po: any) => {
          const ordered = parseFloat(po.orderedQty || "0");
          const received = parseFloat(po.receivedQty || "0");
          const pct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0;
          const pending = Math.max(0, ordered - received);

          return (
            <div key={po.id} onClick={() => setSelectedPO(po)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4 cursor-pointer active:scale-[0.99] transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{po.poNumber}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{po.buyerName} • {po.poDate}</p>
                  {po.gemContractNo && (
                    <p className="text-[9px] text-blue-500 font-bold mt-0.5">GeM: {po.gemContractNo}</p>
                  )}
                </div>
                <span className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                  po.status === "partial" ? "bg-amber-50 text-amber-600" :
                  po.status === "closed" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
                )}>{po.status}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  <span>Fulfillment Progress</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-gray-400 font-bold uppercase">Ordered</p>
                  <p className="text-[11px] font-black text-gray-900">{ordered.toFixed(1)}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-emerald-600 font-bold uppercase">Received</p>
                  <p className="text-[11px] font-black text-emerald-700">{received.toFixed(1)}</p>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl text-center">
                  <p className="text-[8px] text-rose-600 font-bold uppercase">Pending</p>
                  <p className="text-[11px] font-black text-rose-700">{pending.toFixed(1)}</p>
                </div>
              </div>

              {po.grandTotal && (
                <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">PO Value</span>
                  <span className="font-bold text-gray-900 text-sm">₹{parseFloat(po.grandTotal).toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PO Detail Drawer */}
      <Drawer open={!!selectedPO} onOpenChange={open => !open && setSelectedPO(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 rounded-t-[2rem]">
          {selectedPO && (
            <div className="p-5 space-y-5 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Receipt size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedPO.poNumber}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">{selectedPO.buyerName} • {selectedPO.poDate}</DrawerDescription>
              </DrawerHeader>

              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                {selectedPO.grandTotal && (
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-400 font-bold uppercase">PO Value</span>
                    <span className="text-lg font-bold text-gray-900">₹{parseFloat(selectedPO.grandTotal).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {selectedPO.buyerGstin && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">Buyer GSTIN</span>
                    <span className="font-mono font-bold">{selectedPO.buyerGstin}</span>
                  </div>
                )}
                {selectedPO.gemContractNo && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">GeM Contract</span>
                    <span className="font-bold">{selectedPO.gemContractNo}</span>
                  </div>
                )}
                {selectedPO.deliveryPeriodDays && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase">Delivery Period</span>
                    <span className="font-bold">{selectedPO.deliveryPeriodDays} days</span>
                  </div>
                )}
              </div>

              {selectedPO.lineItems && selectedPO.lineItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Line Items</h4>
                  {selectedPO.lineItems.map((item: any, i: number) => (
                    <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-50">
                      <p className="text-xs font-bold text-gray-800">{item.description}</p>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{item.quantity} {item.uom} × ₹{item.unit_price}</span>
                        <span className="font-bold text-gray-700">₹{(item.total_amount_incl_tax || item.total_amount_excl_tax || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="w-full bg-primary text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg shadow-primary/20" onClick={() => setSelectedPO(null)}>Close</button>
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
