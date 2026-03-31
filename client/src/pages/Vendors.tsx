import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { ShieldAlert, ShieldCheck, Mail, AlertTriangle, ChevronRight, X, Building, User, Hash, Landmark, Calendar, Package, FileDown, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { downloadExcel } from "@/lib/excel-export";
import { toast } from "sonner";
import { DocumentExtractor } from "@/components/DocumentExtractor";

export default function Vendors() {
  const [selectedVendor, setSelectedVendor] = useState<typeof mockData.vendors[0] | null>(null);
  const [showScanDrawer, setShowScanDrawer] = useState(false);

  const handleDownloadExcel = () => {
    downloadExcel(mockData.vendors, "Vendors_Master", "Vendors");
    toast.success("Vendors exported to Excel");
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Intelligence & Deduplication</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanDrawer(true)} className="h-9 w-9 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
            <Camera size={16} />
          </button>
          <button onClick={handleDownloadExcel} className="h-9 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-all text-xs font-bold uppercase tracking-wider">
            <FileDown size={16} /> Excel
          </button>
        </div>
      </header>

      {/* Intelligence Alert */}
      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3">
        <div className="h-10 w-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm">
          <AlertTriangle size={20} className="text-rose-500" />
        </div>
        <div>
          <h4 className="font-bold text-rose-900 text-sm mb-1">Duplicate Detected</h4>
          <p className="text-xs text-rose-700 leading-relaxed">
            We noticed <strong>Acme Corporation</strong> shares bank details with <strong>Acme Corp Ltd.</strong> Review recommended before next payment run.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {mockData.vendors.map((vendor) => (
          <div 
            key={vendor.id} 
            onClick={() => setSelectedVendor(vendor)}
            className={cn(
              "bg-white p-4 rounded-2xl shadow-sm border cursor-pointer active:scale-[0.98] transition-all flex items-center justify-between",
              vendor.duplicateWarning ? "border-rose-200" : "border-gray-100"
            )}
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {vendor.name}
                    {vendor.duplicateWarning && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Review
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">{vendor.id}</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {vendor.riskScore === 'Low' ? (
                    <ShieldCheck size={16} className="text-emerald-500" />
                  ) : (
                    <ShieldAlert size={16} className="text-rose-500" />
                  )}
                  <span className={cn(
                    "text-xs font-semibold",
                    vendor.riskScore === 'Low' ? "text-emerald-600" : "text-rose-600"
                  )}>{vendor.riskScore} Risk</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Total Spent YTD</p>
                  <p className="font-bold text-gray-900 text-sm">${vendor.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-xs font-medium text-gray-700 truncate">{vendor.contact}</p>
                </div>
              </div>
            </div>
            <ChevronRight className="text-gray-300 ml-2" size={20} />
          </div>
        ))}
      </div>

      {/* Vendor Detail Drawer */}
      <Drawer open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 p-0 rounded-t-[2.5rem]">
          {selectedVendor && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Building size={32} />
                  </div>
                  <DrawerClose className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <X size={20} />
                  </DrawerClose>
                </div>
                <DrawerTitle className="text-2xl font-bold">{selectedVendor.name}</DrawerTitle>
                <DrawerDescription className="text-gray-500 font-mono">ID: {selectedVendor.id}</DrawerDescription>
              </DrawerHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Package size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Orders</span>
                  </div>
                  <p className="text-xl font-bold">{selectedVendor.totalOrders}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Last Order</span>
                  </div>
                  <p className="text-sm font-bold">{selectedVendor.lastOrderDate}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ownership & Identity</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Owner Name</p>
                      <p className="font-semibold text-gray-900">{selectedVendor.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Business Email</p>
                      <p className="font-semibold text-gray-900">{selectedVendor.contact}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={18} /> Bank Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bank Name</p>
                    <p className="font-bold text-gray-900">{selectedVendor.bankDetails.bankName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account Number</p>
                      <p className="font-mono font-bold text-gray-900">{selectedVendor.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Routing No.</p>
                      <p className="font-mono font-bold text-gray-900">{selectedVendor.bankDetails.routingNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pb-safe pt-2">
                <button 
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                  onClick={() => setSelectedVendor(null)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[90dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor 
              docTypeHint="AUTO_DETECT"
              onExtract={(data) => {
                console.log("Extracted Vendor Data:", data);
                setTimeout(() => {
                  setShowScanDrawer(false);
                  toast.success("Vendor details extracted successfully");
                }, 2000);
              }}
              onCancel={() => setShowScanDrawer(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}