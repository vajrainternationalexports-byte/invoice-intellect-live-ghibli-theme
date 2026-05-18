/**
 * InvoiceCard.tsx — Reusable card for purchase & sales invoice list items.
 * Displays vendor/customer name, invoice number, date, amount, and status.
 */
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, Fingerprint } from "lucide-react";
import { formatINR, formatDate } from "@/lib/formatters";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface InvoiceCardProps {
  name: string;
  invoiceNo: string;
  date: string;
  total: number | string;
  status: string;
  hasEInvoice?: boolean;
  onClick: () => void;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  processed:   { icon: CheckCircle2, color: "text-green-500" },
  needs_review: { icon: AlertTriangle, color: "text-amber-500" },
  pending:     { icon: Clock,         color: "text-blue-mid"  },
};

export function InvoiceCard({
  name,
  invoiceNo,
  date,
  total,
  status,
  hasEInvoice,
  onClick,
}: InvoiceCardProps) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.982 }}
      onClick={onClick}
      className="card card-interactive p-4 flex items-center gap-4"
    >
      {/* Status dot */}
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-light", cfg.color)}>
        <Icon size={18} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-bold text-blue-ink text-sm leading-none truncate">{name || "Unknown"}</h3>
          {hasEInvoice && <Fingerprint size={12} className="text-green-500 flex-shrink-0 opacity-70" />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-semibold text-blue-mid/70 truncate">{invoiceNo}</span>
          <span className="text-blue-mid/30 text-[10px]">•</span>
          <span className="text-[10px] text-blue-mid/50 font-medium">{formatDate(date)}</span>
        </div>
      </div>

      {/* Amount + status */}
      <div className="text-right flex-shrink-0">
        <p className="fin-num text-base text-blue-ink">{formatINR(total)}</p>
        <span className={cn("text-[9px] font-bold uppercase tracking-widest", cfg.color)}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>
    </motion.div>
  );
}
