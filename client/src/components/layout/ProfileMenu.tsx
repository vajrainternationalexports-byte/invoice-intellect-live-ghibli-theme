/**
 * ProfileMenu.tsx — Premium user profile dropdown
 * Uses updated blue-mid/deep tokens. No more blue-medium references.
 */
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, CreditCard, LifeBuoy, ChevronRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { COMPANY } from "@/lib/constants";

const MENU_ITEMS = [
  { label: "Accounts",  sub: "Billing & plan",    Icon: CreditCard },
  { label: "Settings",  sub: "Configurations",     Icon: Settings  },
  { label: "Support",   sub: "Help centre",        Icon: LifeBuoy  },
];

export function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="h-11 w-11 bg-white rounded-2xl flex items-center justify-center
                     border border-blue-mid/15 shadow-sm outline-none
                     focus-visible:ring-2 focus-visible:ring-blue-mid/30 transition-all"
        >
          <User size={19} className="text-blue-mid" />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-60 bg-white/97 backdrop-blur-2xl border border-blue-mid/15
                   rounded-3xl p-2 shadow-[0_16px_48px_rgba(30,58,138,0.16)] mt-2"
      >
        {/* Identity block */}
        <DropdownMenuLabel className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-deep flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.15em] text-blue-ink">
                Anjan Agarwal
              </p>
              <p className="text-[9px] font-bold text-blue-mid uppercase tracking-widest mt-0.5">
                {COMPANY.SHORT} · Admin
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-blue-mid/8 mx-2 my-1" />

        {MENU_ITEMS.map(({ label, sub, Icon }) => (
          <DropdownMenuItem
            key={label}
            className="rounded-2xl px-3 py-2.5 focus:bg-blue-light cursor-pointer transition-colors group mx-1"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="h-9 w-9 rounded-xl bg-blue-mid/8 flex items-center justify-center text-blue-mid
                              group-focus:bg-blue-mid group-focus:text-white transition-all flex-shrink-0">
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-ink">{label}</p>
                <p className="text-[8px] font-semibold text-blue-mid/50 mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={12} className="text-blue-mid/25 flex-shrink-0" />
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-blue-mid/8 mx-2 my-1" />

        <DropdownMenuItem className="rounded-2xl px-3 py-2.5 focus:bg-red-50 cursor-pointer transition-colors group mx-1">
          <div className="flex items-center gap-3 w-full">
            <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500
                            group-focus:bg-red-500 group-focus:text-white transition-all flex-shrink-0">
              <LogOut size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 group-focus:text-red-600">
              Sign Out
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
