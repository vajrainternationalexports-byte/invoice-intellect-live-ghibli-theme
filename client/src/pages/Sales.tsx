import { useState, useRef } from "react";
import { mockData } from "@/lib/mock-data";
import { Camera, FileUp, Search, CheckCircle2, AlertTriangle, Clock, Check, Receipt, X, FileDown, User, Landmark, Fingerprint, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { DocumentExtractor } from "@/components/DocumentExtractor";

export default function Sales() {
  const [activeTab, setActiveTab] = useState("all");
  const [invoices, setInvoices] = useState(mockData.salesInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'invoices' | 'customers'>('invoices');
  const [showScanDrawer, setShowScanDrawer] = useState(false);

  const getStatusIcon = (status: string, size = 14) => {
    switch(status) {
      case 'processed': return <CheckCircle2 size={size} className="text-emerald-500" />;
      case 'needs_review': return <AlertTriangle size={size} className="text-amber-500" />;
      default: return <Clock size={size} className="text-blue-500" />;
    }
  };

  const downloadExcel = () => {
    toast.info("Generating Sales & Receivables report...");
  };

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Sales</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'invoices' ? 'customers' : 'invoices')}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold uppercase tracking-wider"
            >
              {viewMode === 'invoices' ? 'Customers' : 'Invoices'}
            </button>
            <button onClick={downloadExcel} className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <FileDown size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input placeholder={`Search ${viewMode}...`} className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl" />
          </div>
          {viewMode === 'invoices' && (
            <button 
              onClick={() => setShowScanDrawer(true)}
              className="h-10 px-4 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Scan</span>
            </button>
          )}
        </div>

        {viewMode === 'invoices' && (
          <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
            {['all', 'pending', 'needs_review'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all", activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4 no-scrollbar">
        {viewMode === 'invoices' ? (
          invoices.filter(inv => activeTab === 'all' || inv.status === activeTab).map((inv) => (
            <div key={inv.id} onClick={() => setSelectedInvoice(inv)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{inv.customer}</h3>
                  <p className="text-[10px] text-gray-500 font-medium">{inv.id} • {inv.date}</p>
                  <div className="mt-1 flex gap-1">
                    {inv.items.map((item: any, i: number) => (
                      <span key={i} className="text-[8px] bg-gray-50 text-gray-400 px-1 py-0.5 rounded uppercase font-bold">{item.desc}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-sm">₹{inv.amount.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {getStatusIcon(inv.status, 12)}
                    <span className="text-[9px] uppercase font-bold text-gray-400">{inv.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          mockData.customers.map((cust) => (
            <div key={cust.id} onClick={() => setSelectedCustomer(cust)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{cust.name}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Outstanding: <span className="text-rose-600 font-bold">₹{cust.totalOutstanding.toLocaleString('en-IN')}</span></p>
              </div>
              <ChevronRight className="text-gray-200" size={18} />
            </div>
          ))
        )}
      </div>

      {/* Sales Detail Drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 rounded-t-[2.5rem]">
          {selectedInvoice && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Receipt size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedInvoice.customer}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">Invoice: {selectedInvoice.id}</DrawerDescription>
              </DrawerHeader>

              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span>Receivable Amount</span>
                  <span className="text-lg text-gray-900 font-black">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-gray-400 font-bold uppercase">Aging</span>
                   <span className="font-bold text-emerald-600">Within 15 Days</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Customer Profile</h4>
                <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><User size={20} /></div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Account Manager</p>
                      <p className="font-semibold">Mukesh A.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200" onClick={() => setSelectedInvoice(null)}>Acknowledge</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Customer Profile Drawer (Mirror of Vendor) */}
      <Drawer open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DrawerContent className="max-h-[85dvh] bg-white rounded-t-[2.5rem]">
          {selectedCustomer && (
            <div className="p-6 space-y-6 overflow-y-auto no-scrollbar pb-safe">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><User size={24} /></div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><X size={16} /></DrawerClose>
                </div>
                <DrawerTitle className="text-2xl font-bold">{selectedCustomer.name}</DrawerTitle>
                <DrawerDescription className="text-sm font-mono text-gray-400">GSTIN: {selectedCustomer.gstin}</DrawerDescription>
              </DrawerHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl space-y-1">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Outstanding</p>
                  <p className="text-xl font-black text-emerald-700">₹{selectedCustomer.totalOutstanding.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Pending Inv.</p>
                  <p className="text-xl font-black text-gray-900">{selectedCustomer.pendingInvoices}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Verified</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Primary Email</span>
                    <span className="font-bold text-gray-900">{selectedCustomer.contact}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Transaction</span>
                    <span className="font-bold text-gray-900">{selectedCustomer.lastTransaction}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all" onClick={() => setSelectedCustomer(null)}>Done</button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
      {/* Document Scanner Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[90dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 overflow-y-auto no-scrollbar pb-safe">
            <DocumentExtractor 
              docTypeHint="TAX_INVOICE"
              onExtract={(data) => {
                // In a real app we'd populate a form here
                console.log("Extracted Data:", data);
                setTimeout(() => {
                  setShowScanDrawer(false);
                  toast.success("Sales invoice added successfully");
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

function ChevronRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}