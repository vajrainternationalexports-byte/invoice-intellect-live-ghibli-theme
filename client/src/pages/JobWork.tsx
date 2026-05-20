/**
 * JobWork.tsx — Zinc & Labour process management
 * Correct zinc maths: balance = Σ(consumed) - Σ(received), signed label.
 */
import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Layers, Building2, FileDown, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { downloadExcel } from "@/lib/excel-export";
import { useLocalFilter } from "@/hooks/useLocalFilter";
import { formatINR, formatThousands, zincBalanceLabel, toFloat } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type MainTab = "incoming" | "labour";
type SubTab  = "vendors"  | "challans";

export default function JobWork() {
  const [mainTab, setMainTab] = useState<MainTab>("incoming");
  const [subTab,  setSubTab]  = useState<SubTab>("vendors");

  const { data: rawEntries = [] } = useQuery<any[]>({ queryKey: ["/api/job-work"] });
  const { data: labourInvoices  = [] } = useQuery<any[]>({ queryKey: ["/api/labour-invoices"] });

  const entries = useMemo(() => {
    return rawEntries.map((e: any) => {
      if (e.items) return e;

      // Extract transaction rows
      const txs = e.transactions;
      let itemsList: any[] = [];
      
      if (txs && typeof txs === "object") {
        const inward = Array.isArray(txs.inwardRows) ? txs.inwardRows : [];
        
        inward.forEach((row: any) => {
          itemsList.push({
            ourWt: toFloat(row.inwardQty),
            zinc: toFloat(row.grossZinc)
          });
        });
      } else if (Array.isArray(txs)) {
        txs.forEach((row: any) => {
          itemsList.push({
            ourWt: toFloat(row.wt || row.inwardQty),
            zinc: toFloat(row.zincConsumed || row.grossZinc)
          });
        });
      }

      // Add zinc received row as a negative item
      if (parseFloat(e.totalZincReceivedKg) > 0) {
        itemsList.push({
          ourWt: 0,
          zinc: -Math.abs(toFloat(e.totalZincReceivedKg))
        });
      }

      return {
        ...e,
        vendor: e.galvanizerName || "Unknown Galvanizer",
        challan: e.period || "Statement",
        date: e.periodFrom || (e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""),
        items: itemsList.length > 0 ? itemsList : [
          { ourWt: toFloat(e.totalWeightKg), zinc: toFloat(e.totalZincConsumedKg) }
        ]
      };
    });
  }, [rawEntries]);

  /* ── Zinc aggregations ─────────────────────────── */
  const totals = useMemo(() => {
    let consumed = 0, received = 0, ourWt = 0;
    entries.forEach((entry: any) => {
      (entry.items as any[] ?? []).forEach((item: any) => {
        ourWt    += toFloat(item.ourWt);
        if (item.zinc > 0) consumed += toFloat(item.zinc);
        else               received += Math.abs(toFloat(item.zinc));
      });
    });
    return { consumed, received, ourWt };
  }, [entries]);

  const vendorBalances = useMemo(() => {
    const map: Record<string, any> = {};
    entries.forEach((entry: any) => {
      const v = entry.vendor;
      if (!map[v]) map[v] = { name: v, consumed: 0, received: 0, totalWt: 0 };
      (entry.items as any[] ?? []).forEach((item: any) => {
        map[v].totalWt += toFloat(item.ourWt);
        if (item.zinc > 0) map[v].consumed += toFloat(item.zinc);
        else               map[v].received += Math.abs(toFloat(item.zinc));
      });
    });
    return Object.values(map).sort((a: any, b: any) => Math.abs(b.consumed - b.received) - Math.abs(a.consumed - a.received));
  }, [entries]);

  /* ── Filter for challans ───────────────────────── */
  const challanFilter = useLocalFilter({
    items: entries,
    searchFields: ["challan", "vendor"],
  });

  const labourFilter = useLocalFilter({
    items: labourInvoices,
    searchFields: ["invNo", "vendor"],
    tabKey: "status",
    defaultTab: "all",
  });

  const labourTotal = useMemo(
    () => labourInvoices.reduce((s: number, i: any) => s + toFloat(i.netPayable || i.total), 0),
    [labourInvoices]
  );

  const LABOUR_TABS = [
    { id: "all",          label: "All"     },
    { id: "pending",      label: "Pending" },
    { id: "needs_review", label: "Review"  },
    { id: "paid",         label: "Paid"    },
  ];

  return (
    <div className="space-y-4 py-4 pb-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">Production</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight">Process</h1>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => downloadExcel(mainTab === "incoming" ? entries : labourInvoices, "Process", "Data").then(() => toast.success("Exported"))}
            className="icon-btn">
            <FileDown size={18} />
          </motion.button>
          <ProfileMenu />
        </div>
      </header>

      {/* Main tabs */}
      <div className="tab-group">
        {([["incoming", "Zinc Incoming"], ["labour", "Labour Cost"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setMainTab(id as MainTab)}
            className={cn("tab-item", mainTab === id && "active")}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ INCOMING TAB ══════════════════════════════ */}
      <AnimatePresence mode="wait">
        {mainTab === "incoming" && (
          <motion.div key="incoming"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Zinc hero card */}
            <div className="surface-deep rounded-[2rem] p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-[0.07]">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 block mb-1">
                  Net Zinc Balance
                </span>
                <p className="text-4xl font-black text-white tracking-tighter mb-4">
                  {zincBalanceLabel(totals.consumed, totals.received)}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  {[
                    { label: "Our Wt.", val: `${totals.ourWt.toFixed(1)} kg` },
                    { label: "Consumed", val: `${totals.consumed.toFixed(1)} kg` },
                    { label: "Received", val: `${totals.received.toFixed(1)} kg` },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-[9px] font-black uppercase text-white/50 mb-0.5">{label}</p>
                      <p className="text-sm font-black text-white">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="tab-group">
              {([["vendors", "Vendors"], ["challans", "Challans"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setSubTab(id as SubTab)}
                  className={cn("tab-item", subTab === id && "active")}>
                  {label}
                </button>
              ))}
            </div>

            {/* Search (challans only) */}
            {subTab === "challans" && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
                <input className="search-input" placeholder="Search challan, vendor..."
                  value={challanFilter.search} onChange={e => challanFilter.setSearch(e.target.value)} />
              </div>
            )}

            {/* Vendor balances */}
            {subTab === "vendors" && (
              <div className="space-y-3">
                {vendorBalances.length === 0 ? (
                  <div className="flex flex-col items-center h-40 justify-center gap-2 text-blue-mid/30">
                    <Building2 size={28} />
                    <p className="text-xs font-bold uppercase tracking-widest">No vendors yet</p>
                  </div>
                ) : vendorBalances.map((v: any, i: number) => {
                  const delta = v.consumed - v.received;
                  const isDue = delta > 0;
                  return (
                    <motion.div key={i} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="card p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-mid/10 flex items-center justify-center text-blue-mid flex-shrink-0">
                        <Building2 size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-blue-ink text-sm truncate">{v.name}</h3>
                        <p className="text-[10px] text-blue-mid/60 font-semibold mt-0.5">
                          {v.totalWt.toFixed(1)} kg processed
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn("fin-num text-sm", isDue ? "text-amber-600" : "text-green-600")}>
                          {Math.abs(delta).toFixed(2)} kg
                        </p>
                        <p className={cn("text-[9px] font-black uppercase tracking-widest", isDue ? "text-amber-500" : "text-green-500")}>
                          {isDue ? "Due" : "Excess"}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Challans */}
            {subTab === "challans" && (
              <div className="space-y-3">
                {challanFilter.filtered.length === 0 ? (
                  <div className="flex flex-col items-center h-40 justify-center gap-2 text-blue-mid/30">
                    <Layers size={28} />
                    <p className="text-xs font-bold uppercase tracking-widest">No challans found</p>
                  </div>
                ) : challanFilter.filtered.map((e: any) => {
                  const zincNet = (e.items as any[] ?? []).reduce((s: number, i: any) => s + toFloat(i.zinc), 0);
                  return (
                    <motion.div key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="card p-4">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <span className="badge badge-info mb-2">{e.challan}</span>
                          <h4 className="font-black text-blue-ink text-sm">{e.vendor}</h4>
                          <p className="text-[10px] text-blue-mid/50 font-medium mt-0.5">{e.date}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="fin-num text-base text-blue-ink">{zincNet.toFixed(2)}</p>
                          <p className="text-[9px] font-bold text-blue-mid/50 uppercase tracking-widest">kg zinc</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ LABOUR TAB ════════════════════════════════ */}
        {mainTab === "labour" && (
          <motion.div key="labour"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Labour hero */}
            <div className="surface-primary rounded-[2rem] p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-[0.07]"><Sparkles size={120} /></div>
              <div className="relative z-10">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 block mb-1">
                  Labour Outstanding
                </span>
                <p className="text-4xl font-black text-white tracking-tighter">{formatINR(labourTotal)}</p>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-2">
                  {labourInvoices.length} invoice{labourInvoices.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Labour filter tabs */}
            <div className="tab-group">
              {LABOUR_TABS.map(t => (
                <button key={t.id} onClick={() => labourFilter.setActiveTab(t.id)}
                  className={cn("tab-item", labourFilter.activeTab === t.id && "active")}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Labour search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-mid/40" size={16} />
              <input className="search-input" placeholder="Search vendor, invoice #..."
                value={labourFilter.search} onChange={e => labourFilter.setSearch(e.target.value)} />
            </div>

            {/* Labour list */}
            <div className="space-y-3">
              {labourFilter.filtered.length === 0 ? (
                <div className="flex flex-col items-center h-40 justify-center gap-2 text-blue-mid/30">
                  <p className="text-xs font-bold uppercase tracking-widest">No invoices found</p>
                </div>
              ) : labourFilter.filtered.map((inv: any) => (
                <motion.div key={inv.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-blue-ink text-sm truncate">{inv.vendor}</h4>
                    <p className="text-[10px] text-blue-mid/60 font-medium mt-0.5">{inv.invNo} · {inv.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="fin-num text-base text-blue-ink">{formatINR(inv.total || inv.netPayable)}</p>
                    <span className={cn("badge mt-1",
                      inv.status === "paid" ? "badge-success" :
                      inv.status === "needs_review" ? "badge-warning" : "badge-info"
                    )}>
                      {inv.status?.replace("_", " ")}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}