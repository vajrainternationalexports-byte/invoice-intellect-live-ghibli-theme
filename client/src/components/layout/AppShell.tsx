/**
 * AppShell.tsx — Main app wrapper.
 * Renders the device frame, page content area, and bottom navigation.
 * Replaced "MobileShell" — cleaner name, same layout.
 */
import React from "react";
import { BottomNav } from "./BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const pageVariants: any = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-light p-0 sm:p-6 overflow-hidden">
      {/* Device frame — phone form-factor on desktop */}
      <div
        className={[
          "relative w-full h-screen",
          "sm:w-[420px] sm:h-[870px] sm:rounded-[3.5rem]",
          "bg-white overflow-hidden flex flex-col",
          "sm:shadow-[0_24px_80px_rgba(30,58,138,0.22),0_8px_24px_rgba(30,58,138,0.12)]",
          "sm:border-[10px] sm:border-blue-deep/10",
        ].join(" ")}
      >
        {/* Notch (desktop only) */}
        <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 z-50
          w-28 h-7 bg-blue-ink/90 rounded-full items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-mid/60" />
          <div className="w-10 h-1.5 rounded-full bg-blue-mid/30" />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pt-10 sm:pt-12 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="px-4 sm:px-5 pb-2 min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom navigation */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-blue-mid/8 pb-safe pt-2">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
