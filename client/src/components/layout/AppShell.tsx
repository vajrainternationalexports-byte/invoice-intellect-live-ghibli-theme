import React, { useState, useEffect } from "react";
import { BottomNav } from "./BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { MobileAccessHelper } from "./MobileAccessHelper";
import { X, FileText } from "lucide-react";

const pageVariants: any = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

interface PreviewState {
  fileBase64: string;
  invoiceNo: string;
  vendorName: string;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [activePreview, setActivePreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent<PreviewState | null>;
      if (customEvent.detail) {
        setActivePreview(customEvent.detail);
      } else {
        setActivePreview(null);
      }
    };

    window.addEventListener("desktop-doc-preview", handlePreview);
    return () => {
      window.removeEventListener("desktop-doc-preview", handlePreview);
    };
  }, []);

  // Automatically reset preview on location change
  useEffect(() => {
    setActivePreview(null);
  }, [location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-light p-0 lg:p-6 overflow-hidden gap-8">
      {/* Big Screen Document Viewer — desktop only */}
      <AnimatePresence>
        {activePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col bg-white border border-blue-mid/10 rounded-[2.5rem] shadow-[0_24px_80px_rgba(30,58,138,0.15)] p-6 w-[550px] h-[900px] z-30"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-blue-mid/8">
              <div className="min-w-0 flex-1 pr-4">
                <span className="text-[9px] font-black text-blue-mid uppercase tracking-widest block">Original Document Record</span>
                <span className="text-sm font-black text-blue-ink uppercase truncate block mt-0.5" title={`${activePreview.vendorName} (${activePreview.invoiceNo})`}>
                  {activePreview.vendorName} ({activePreview.invoiceNo})
                </span>
              </div>
              <button 
                onClick={() => setActivePreview(null)}
                className="p-2 bg-blue-mid/5 hover:bg-blue-mid/10 text-blue-mid rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Preview Frame */}
            <div className="flex-1 mt-4 rounded-[1.5rem] overflow-hidden bg-[#fafafa] border border-blue-mid/5 flex items-center justify-center relative shadow-inner">
              {activePreview.fileBase64 ? (
                activePreview.fileBase64.startsWith("data:application/pdf") ? (
                  <iframe 
                    src={activePreview.fileBase64} 
                    className="w-full h-full border-0"
                    title="Document Preview"
                  />
                ) : (
                  <div className="w-full h-full p-4 overflow-y-auto no-scrollbar flex items-center justify-center">
                    <img 
                      src={activePreview.fileBase64} 
                      className="max-h-full max-w-full object-contain rounded-xl shadow-sm bg-white p-1"
                      alt="Scanned Tax Invoice"
                    />
                  </div>
                )
              ) : (
                <div className="text-center p-6 text-blue-mid/40">
                  <FileText size={48} className="mx-auto mb-2 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest block">No digital document attached</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device frame — phone form-factor on desktop */}
      <div
        className={[
          "relative w-full h-screen",
          "lg:w-[450px] lg:h-[900px] lg:rounded-[3.5rem]",
          "bg-white overflow-hidden flex flex-col",
          "lg:shadow-[0_24px_80px_rgba(30,58,138,0.22),0_8px_24px_rgba(30,58,138,0.12)]",
          "lg:border-[10px] lg:border-blue-deep/10",
        ].join(" ")}
      >
        {/* Notch (desktop only) */}
        <div className="hidden lg:flex absolute top-3 left-1/2 -translate-x-1/2 z-50
          w-28 h-7 bg-blue-ink/90 rounded-full items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-mid/60" />
          <div className="w-10 h-1.5 rounded-full bg-blue-mid/30" />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pt-10 lg:pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="px-4 lg:px-5 pb-2 min-h-full"
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

      {/* Floating helper card on desktop */}
      <MobileAccessHelper />
    </div>
  );
}
