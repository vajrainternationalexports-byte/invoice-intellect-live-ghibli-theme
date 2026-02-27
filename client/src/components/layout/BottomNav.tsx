import { Link, useLocation } from "wouter";
import { LayoutDashboard, ReceiptText, ArrowRightLeft, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: ReceiptText },
    { name: "Reconciliation", href: "/reconciliation", icon: ArrowRightLeft },
    { name: "Vendors", href: "/vendors", icon: Building2 },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center sm:pb-6 sm:pt-4 z-40">
      {tabs.map((tab) => {
        const isActive = location === tab.href;
        return (
          <Link key={tab.name} href={tab.href}>
            <div
              className="flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-95"
              data-testid={`nav-${tab.name.toLowerCase()}`}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                {tab.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}