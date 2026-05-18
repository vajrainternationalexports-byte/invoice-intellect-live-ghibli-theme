/**
 * BottomNav.tsx — Premium bottom navigation bar
 * 5 tabs with spring-animated active indicator.
 */
import { Link, useLocation } from "wouter";
import { Home, Activity, Receipt, ShoppingCart, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const TABS = [
  { label: "Home",      href: ROUTES.HOME,      Icon: Home },
  { label: "Sales",     href: ROUTES.SALES,     Icon: Activity },
  { label: "Purchases", href: ROUTES.PURCHASES, Icon: Receipt },
  { label: "Orders",    href: ROUTES.ORDERS,    Icon: ShoppingCart },
  { label: "Process",   href: ROUTES.PROCESS,   Icon: Layers },
] as const;

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="flex justify-around items-center px-2 py-1">
      {TABS.map(({ label, href, Icon }) => {
        const active =
          href === "/"
            ? location === "/"
            : location.startsWith(href);

        return (
          <Link key={href} href={href}>
            <motion.div
              whileTap={{ scale: 0.88 }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-colors duration-200 cursor-pointer min-w-[3.5rem]",
                active ? "text-blue-mid" : "text-blue-ink/35 hover:text-blue-ink/60"
              )}
            >
              {/* Spring-animated background pill */}
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-blue-light rounded-2xl border border-blue-mid/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />
              </div>
              <span
                className={cn(
                  "relative z-10 text-[8px] font-black uppercase tracking-widest transition-all duration-200",
                  active ? "opacity-100" : "opacity-60"
                )}
              >
                {label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}