/**
 * MetricCard.tsx — Reusable KPI metric card
 * Displays a label, a large formatted value, and an optional trend badge.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive: boolean };
  variant?: "light" | "primary" | "deep";
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const variants = {
  light:   "card bg-white",
  primary: "surface-primary rounded-[2rem]",
  deep:    "surface-deep rounded-[2rem]",
};

export function MetricCard({
  label,
  value,
  sub,
  trend,
  variant = "light",
  icon,
  onClick,
  className,
}: MetricCardProps) {
  const isColored = variant !== "light";

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: isColored ? undefined : "0 16px 40px rgba(30,58,138,0.14)" }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className={cn(
        variants[variant],
        "p-5 relative overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Background decoration */}
      {isColored && (
        <div className="absolute -right-4 -top-4 opacity-10">
          <div className="w-24 h-24 rounded-full border-2 border-white" />
        </div>
      )}

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "section-label",
              isColored ? "text-white/70" : "text-blue-mid"
            )}
          >
            {label}
          </span>
          {icon && (
            <div
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center",
                isColored ? "bg-white/20" : "bg-blue-mid/10 text-blue-mid"
              )}
            >
              {icon}
            </div>
          )}
        </div>

        <div
          className={cn(
            "metric-value text-3xl",
            isColored ? "text-white" : "text-blue-ink"
          )}
        >
          {value}
        </div>

        {(sub || trend) && (
          <div className="flex items-center gap-2 flex-wrap">
            {trend && (
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  trend.positive
                    ? isColored ? "bg-white/20 text-white" : "bg-green-50 text-green-700"
                    : isColored ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            )}
            {sub && (
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isColored ? "text-white/50" : "text-blue-mid/60"
                )}
              >
                {sub}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
