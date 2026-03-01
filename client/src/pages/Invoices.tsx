import { useState, useRef } from "react";
import { mockData } from "@/lib/mock-data";
import { Camera, FileUp, Search, CheckCircle2, AlertTriangle, Clock, Check, CreditCard, Calendar as CalendarIcon, X, ChevronRight, Receipt, Loader2, Save, Fingerprint } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("all");
  const [invoices, setInvoices] = useState(mockData.invoices);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockData.invoices[0] | null>(null);
  
  // OCR Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [showScanDrawer, setShowScanDrawer] = useState(false);
  const [scannedData, setScannedData] = useState({
    vendor: "",
    amount: "",
    id: "",
    irn: "",
    gstin: "",
    date: format(new Date(), "MMM dd, yyyy")
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusIcon = (status: string, size = 14) => {
    switch(status) {
      case 'processed': return <CheckCircle2 size={size} className="text-emerald-500" />;
      case 'needs_review': return <AlertTriangle size={size} className="text-amber-500" />;
      default: return <Clock size={size} className="text-blue-500" />;
    }
  };

  const handleApprove = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'pending' } : inv
    ));
    toast.success("Invoice approved");
  };

  const handlePay = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'processed' } : inv
    ));
    toast.success("Payment initiated");
  };

  const handleSchedulePayment = (id: string, date: Date) => {
    const formattedDate = format(date, "dd/MM/yyyy");
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'processed', processedDate: formattedDate } : inv
    ));
    toast.success(`Scheduled for ${formattedDate}`);
  };

  const handleScan = () => {
    setIsScanning(true);
    setShowScanDrawer(true);
    
    // Simulate OCR processing for Indian Invoices with IRN
    setTimeout(() => {
      setScannedData({
        vendor: "Bharat Industrial Supplies",
        amount: "12500.00",
        id: "INV/24-25/088",
        irn: "4a2b6c...9e8f", // Shortened for display
        gstin: "27GVPPS1234A1Z5",
        date: format(new Date(), "MMM dd, yyyy")
      });
      setIsScanning(false);
      toast.info("e-Invoice Validated: IRN & GSTIN extracted");
    }, 2500);
  };

  const saveScannedInvoice = () => {
    if (!scannedData.vendor || !scannedData.amount) {
      toast.error("Please fill in required details");
      return;
    }

    const newInvoice = {
      id: scannedData.id || "INV-" + Math.floor(Math.random() * 1000),
      vendor: scannedData.vendor,
      irn: scannedData.irn,
      gstin: scannedData.gstin,
      amount: parseFloat(scannedData.amount),
      date: scannedData.date,
      dueDate: format(new Date(), "MMM dd, yyyy"),
      status: "needs_review",
      confidence: 94,
      items: [{ desc: "e-Invoice Line Item", qty: 1, price: parseFloat(scannedData.amount) }]
    };

    setInvoices([newInvoice, ...invoices]);
    setShowScanDrawer(false);
    toast.success("e-Invoice added for matching");
  };

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Invoices</h1>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleScan}
            className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Camera size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-700">Scan</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <FileUp size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-700">Upload</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleScan}
              accept="image/*,application/pdf" 
            />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <Input 
            placeholder="Search..." 
            className="pl-9 bg-gray-100/50 border-0 h-10 text-sm rounded-xl"
          />
        </div>

        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          {['all', 'pending', 'needs_review'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1 text-[11px] font-bold rounded-lg capitalize transition-all",
                activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              )}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4 no-scrollbar">
        {invoices
          .filter(inv => activeTab === 'all' || inv.status === activeTab)
          .map((inv) => (
          <div 
            key={inv.id} 
            onClick={() => setSelectedInvoice(inv as any)}
            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                   <h3 className="font-bold text-gray-900 text-sm truncate">{inv.vendor}</h3>
                   {inv.irn && <Fingerprint size={12} className="text-emerald-500" title="IRN Validated" />}
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  {inv.id} • {inv.date}
                </p>
                <div className="flex gap-1 mt-0.5 overflow-hidden">
                  <span className="text-[9px] text-primary/70 bg-primary/5 px-1 rounded uppercase font-bold tracking-tight">
                    GSTIN: {inv.gstin}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 text-sm">₹{inv.amount.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  {getStatusIcon(inv.status, 12)}
                  <span className="text-[9px] uppercase tracking-tight font-bold text-gray-400">
                    {inv.status === 'processed' && inv.processedDate ? `Paid ${inv.processedDate}` : inv.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {inv.status !== 'processed' && (
              <div className="mt-2 pt-2 border-t border-gray-50 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {inv.status === 'needs_review' && (
                  <button 
                    onClick={() => handleApprove(inv.id)}
                    className="flex-1 bg-emerald-500 text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Check size={12} /> Approve
                  </button>
                )}
                {inv.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handlePay(inv.id)}
                      className="flex-1 bg-primary text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"
                    >
                      <CreditCard size={12} /> Pay
                    </button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                          <CalendarIcon size={12} /> Schedule
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-0" align="end">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && handleSchedulePayment(inv.id, date)}
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invoice Detail Drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DrawerContent className="max-h-[85dvh] bg-gray-50 rounded-t-[2rem]">
          {selectedInvoice && (
            <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
              <DrawerHeader className="p-0 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Receipt size={24} />
                  </div>
                  <DrawerClose className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <X size={16} />
                  </DrawerClose>
                </div>
                <DrawerTitle className="text-xl font-bold">{selectedInvoice.vendor}</DrawerTitle>
                <DrawerDescription className="text-xs text-gray-500">
                  GSTIN: {selectedInvoice.gstin}
                </DrawerDescription>
              </DrawerHeader>

              {selectedInvoice.irn && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl space-y-1">
                   <div className="flex items-center gap-2 text-emerald-700">
                      <Fingerprint size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">IRN Validated</span>
                   </div>
                   <p className="text-[10px] font-mono text-emerald-600 break-all">{selectedInvoice.irn}</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedInvoice.status, 14)}
                    <span className="text-xs font-bold capitalize">{selectedInvoice.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Amount Due</span>
                  <span className="text-lg font-bold text-gray-900">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tax Breakdown (GST)</h4>
                <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden text-xs">
                   <div className="p-3 flex justify-between">
                      <span className="text-gray-500">CGST (9%)</span>
                      <span className="font-bold">₹{((selectedInvoice.amount / 1.18) * 0.09).toFixed(2)}</span>
                   </div>
                   <div className="p-3 flex justify-between">
                      <span className="text-gray-500">SGST (9%)</span>
                      <span className="font-bold">₹{((selectedInvoice.amount / 1.18) * 0.09).toFixed(2)}</span>
                   </div>
                </div>
              </div>

              <div className="pb-safe">
                <button 
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* OCR Scan/Manual Entry Drawer */}
      <Drawer open={showScanDrawer} onOpenChange={setShowScanDrawer}>
        <DrawerContent className="max-h-[90dvh] bg-white rounded-t-[2.5rem]">
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
            <DrawerHeader className="p-0 text-left">
              <div className="flex justify-between items-center mb-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Camera size={24} />
                </div>
                <DrawerClose className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <X size={16} />
                </DrawerClose>
              </div>
              <DrawerTitle className="text-xl font-bold">
                {isScanning ? "Scanning Invoice..." : "Verify Indian Tax Details"}
              </DrawerTitle>
              <DrawerDescription className="text-sm text-gray-500">
                {isScanning ? "Extracting GSTIN & IRN from e-Invoice." : "Ensure IRN and GSTIN are correct for ITC compliance."}
              </DrawerDescription>
            </DrawerHeader>

            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="h-24 w-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={32} className="text-primary animate-pulse" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-500 animate-pulse">Validating with GST Portal...</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Vendor Name</Label>
                  <Input 
                    value={scannedData.vendor} 
                    onChange={(e) => setScannedData({...scannedData, vendor: e.target.value})}
                    placeholder="Enter vendor name"
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">GSTIN</Label>
                  <Input 
                    value={scannedData.gstin} 
                    onChange={(e) => setScannedData({...scannedData, gstin: e.target.value})}
                    placeholder="GSTIN (e.g. 27AAAAA...)"
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">IRN (64-character hash)</Label>
                  <Input 
                    value={scannedData.irn} 
                    onChange={(e) => setScannedData({...scannedData, irn: e.target.value})}
                    placeholder="Invoice Reference Number"
                    className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-mono text-[10px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Total Amount (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                      <Input 
                        value={scannedData.amount} 
                        onChange={(e) => setScannedData({...scannedData, amount: e.target.value})}
                        placeholder="0.00"
                        className="h-12 pl-7 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Invoice No.</Label>
                    <Input 
                      value={scannedData.id} 
                      onChange={(e) => setScannedData({...scannedData, id: e.target.value})}
                      placeholder="INV/XX-XX/..."
                      className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 pb-safe">
                  <button 
                    onClick={saveScannedInvoice}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Save size={20} /> Save e-Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}