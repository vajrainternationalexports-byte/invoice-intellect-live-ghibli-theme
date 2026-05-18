/**
 * Dashboard.tsx — Command centre overview
 * Uses useDashboard() hook for all data. All maths via formatters.
 */
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Zap, ShoppingBag,
  Receipt, Layers, ChevronRight, Activity, BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { useDashboard } from "@/hooks/useDashboard";
import { MetricCard } from "@/components/cards/MetricCard";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { formatINR, formatLakhs, formatThousands, zincBalanceLabel } from "@/lib/formatters";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* Staggered container for child reveal */
const container = {
  animate: { transition: { staggerChildren: 0.07 } },
};
const item: any = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};

export default function Dashboard() {
  const { data, isLoading } = useDashboard();

  /* ─── Derived values ─────────────────────────────── */
  const netRevenue     = data?.netRevenue        ?? 0;
  const salesTotal     = data?.sales.total       ?? 0;
  const purchTotal     = data?.purchases.total   ?? 0;
  const labourPayable  = data?.labourInvoices.totalPayable ?? 0;
  const zincDue        = data?.jobWork.zincDueKg ?? 0;
  const salesGst       = data?.sales.gst         ?? { cgst: 0, sgst: 0, igst: 0, total: 0 };
  const openPOs        = data?.purchaseOrders.open ?? 0;
  const needsReview    = data?.purchases.needsReview ?? 0;

  const netPositive    = netRevenue >= 0;

  /* ─── Skeleton ─────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-24 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="initial" animate="animate" className="space-y-4 py-4 pb-6">

      {/* ── Header ───────────────────────────────────── */}
      <motion.header variants={item} className="flex items-start justify-between">
        <div>
          <span className="section-label block mb-1">FY {new Date().getFullYear()}-{String(new Date().getFullYear() + 1).slice(2)}</span>
          <h1 className="text-3xl font-black text-blue-ink tracking-tight leading-none">
            Overview
          </h1>
        </div>
        <ProfileMenu />
      </motion.header>

      {/* ── Hero — Net Revenue ───────────────────────── */}
      <motion.div variants={item}>
        <div className="surface-deep rounded-[2rem] p-6 relative overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/10" />
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border border-white/8" />

          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 block mb-1">
              Net Revenue
            </span>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black text-white tracking-tighter">
                {formatLakhs(Math.abs(netRevenue))}
              </span>
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black mb-1",
                netPositive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
              )}>
                {netPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {netPositive ? "Profitable" : "Deficit"}
              </div>
            </div>

            {/* Sales vs Purchase bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] text-white/50 uppercase font-bold tracking-widest">
                <span>Sales</span>
                <span>Purchases</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: salesTotal > 0 ? `${Math.min(100, (salesTotal / (salesTotal + purchTotal)) * 100)}%` : "0%" }}
                  transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full bg-gradient-to-r from-blue-mid to-blue-300 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[10px] font-black">
                <span className="text-white">{formatLakhs(salesTotal)}</span>
                <span className="text-white/60">{formatLakhs(purchTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Two-column KPIs ─────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <MetricCard
          variant="primary"
          label="GST Collected"
          value={formatThousands(salesGst.total)}
          sub={salesGst.igst > 0 ? "IGST" : "CGST+SGST"}
          icon={<BarChart3 size={16} />}
        />
        <MetricCard
          variant="light"
          label="Open POs"
          value={String(openPOs)}
          sub="Purchase orders"
          icon={<ShoppingBag size={16} />}
          trend={openPOs > 0 ? { value: "Active", positive: true } : undefined}
        />
      </motion.div>

      {/* ── GST Breakdown ───────────────────────────── */}
      <motion.div variants={item}>
        <div className="card p-4">
          <span className="section-label block mb-3">GST Breakdown — Sales</span>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "CGST", val: salesGst.cgst },
              { label: "SGST", val: salesGst.sgst },
              { label: "IGST", val: salesGst.igst },
            ].map(({ label, val }) => (
              <div key={label} className="p-3 bg-blue-light/60 rounded-xl">
                <p className="section-label text-blue-mid mb-1">{label}</p>
                <p className="fin-num text-sm text-blue-ink">{formatThousands(val)}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-bold text-blue-mid/50 text-center mt-2 uppercase tracking-widest">
            GST Rule: CGST+SGST intra-state • IGST inter-state • never both
          </p>
        </div>
      </motion.div>

      {/* ── Quick Actions ───────────────────────────── */}
      <motion.div variants={item} className="space-y-2">
        <span className="section-label pl-1">Operations</span>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Sales",     sub: "Tax Invoices",    href: ROUTES.SALES,      Icon: Activity,    accent: "bg-blue-mid"  },
            { label: "Purchases", sub: `${needsReview} need review`, href: ROUTES.PURCHASES, Icon: Receipt, accent: "bg-blue-deep" },
          ].map(({ label, sub, href, Icon, accent }) => (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="card card-interactive p-4 flex items-center gap-3"
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white flex-shrink-0", accent)}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-blue-ink text-xs uppercase tracking-tight">{label}</h4>
                  <p className="text-[9px] text-blue-mid/70 font-bold uppercase tracking-wider mt-0.5 truncate">{sub}</p>
                </div>
                <ChevronRight size={14} className="text-blue-mid/30 ml-auto flex-shrink-0" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Process (Zinc + Labour) ─────────────────── */}
      <motion.div variants={item}>
        <Link href={ROUTES.PROCESS}>
          <motion.div
            whileHover={{ scale: 0.99 }}
            whileTap={{ scale: 0.975 }}
            className="surface-primary rounded-[2rem] p-5 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Layers size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                    Production Exposure
                  </span>
                </div>
                <ChevronRight size={18} className="text-white/60" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-0.5">Labour Payable</p>
                  <p className="metric-value text-xl text-white">{formatThousands(labourPayable)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-0.5">Zinc Balance</p>
                  <p className="metric-value text-xl text-white">{zincBalanceLabel(data?.jobWork.zincConsumed ?? 0, data?.jobWork.zincReceived ?? 0)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

    </motion.div>
  );
}
