import React from "react";
import { BottomNav } from "./BottomNav";
import { useLocation } from "wouter";

export function MobileShell({ children }: { children: React.ReactNode }) {
  // To avoid showing nav on 404, we can check location, but let's keep it simple for the prototype
  return (
    <div className="min-h-screen bg-neutral-200/50 flex items-center justify-center sm:p-8 font-sans">
      <div className="w-full h-[100dvh] sm:max-w-[400px] sm:h-[850px] bg-background relative overflow-hidden flex flex-col sm:shadow-2xl sm:rounded-[3rem] sm:border-[14px] sm:border-black ring-1 ring-black/5">
        
        {/* iOS Status Bar Mock (only visible on desktop wrapper for realism) */}
        <div className="hidden sm:flex justify-between items-center px-6 pt-3 pb-1 text-[13px] font-medium z-50 bg-background/80 backdrop-blur-md absolute top-0 w-full">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 9.5C1 10.3284 1.67157 11 2.5 11H3.5C4.32843 11 5 10.3284 5 9.5V8.5C5 7.67157 4.32843 7 3.5 7H2.5C1.67157 7 1 7.67157 1 8.5V9.5Z" fill="black"/>
              <path d="M7 9.5C7 10.3284 7.67157 11 8.5 11H9.5C10.3284 11 11 10.3284 11 9.5V5.5C11 4.67157 10.3284 4 9.5 4H8.5C7.67157 4 7 4.67157 7 5.5V9.5Z" fill="black"/>
              <path d="M13 9.5C13 10.3284 13.6716 11 14.5 11H15.5C16.3284 11 17 10.3284 17 9.5V2.5C17 1.67157 16.3284 1 15.5 1H14.5C13.6716 1 13 1.67157 13 2.5V9.5Z" fill="black"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5C4.68629 1.5 1.68629 2.84315 0 5.02944L8 11.5L16 5.02944C14.3137 2.84315 11.3137 1.5 8 1.5ZM8 3.5C5.81371 3.5 3.81371 4.28629 2.37868 5.52944L8 10.0294L13.6213 5.52944C12.1863 4.28629 10.1863 3.5 8 3.5Z" fill="black"/>
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="black"/>
              <rect x="2" y="2" width="15" height="8" rx="2" fill="black"/>
              <path d="M23 4V8C23.5523 8 24 7.55228 24 7V5C24 4.44772 23.5523 4 23 4Z" fill="black"/>
            </svg>
          </div>
        </div>

        {/* Dynamic Notch / Dynamic Island */}
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-50"></div>

        {/* App Content */}
        <div className="flex-1 overflow-y-auto pb-24 pt-safe sm:pt-14 no-scrollbar">
          {children}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}