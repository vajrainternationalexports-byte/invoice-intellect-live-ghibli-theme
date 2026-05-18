import React from "react";
import { BottomNav } from "./BottomNav";
import { motion, AnimatePresence } from "framer-motion";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-light p-0 sm:p-4 overflow-hidden">
      {/* Rich Device Frame */}
      <div className="relative w-full h-full sm:w-[410px] sm:h-[840px] bg-white sm:rounded-[3.5rem] sm:shadow-[0_20px_60px_rgba(92,142,189,0.2)] overflow-hidden border-[12px] border-blue-medium/20 flex flex-col">
        
        {/* Deeper Notch */}
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-blue-medium/10 rounded-full z-[100] border border-white/20"></div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative pt-12 px-5">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav */}
        <div className="p-4 pb-8 sm:pb-6">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}