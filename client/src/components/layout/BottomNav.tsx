import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, ShoppingBag, Truck, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { name: "Home", href: "/", icon: LayoutDashboard },
    { name: "Sales", href: "/sales", icon: Receipt },
    { name: "Purchases", href: "/invoices", icon: ShoppingBag },
    { name: "PO", href: "/po", icon: Truck },
    { name: "Job Work", href: "/jobwork", icon: Layers },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#0F172A] border-t border-[#1e293b] pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 px-2 flex justify-between items-center sm:pb-6 sm:pt-4 z-[60]">
      {tabs.map((tab) => {
        const isActive = location === tab.href || (tab.href !== "/" && location.startsWith(tab.href));
        return (
          <Link key={tab.name} href={tab.href}>
            <div
              className="flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-95 w-14"
              data-testid={`nav-${tab.name.toLowerCase().replace(' ', '-')}`}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive ? "text-[#F59E0B]" : "text-slate-400 hover:text-slate-300"
                )}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium transition-colors text-center w-full truncate px-1",
                  isActive ? "text-[#F59E0B]" : "text-slate-400"
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