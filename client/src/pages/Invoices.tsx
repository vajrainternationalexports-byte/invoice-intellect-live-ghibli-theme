import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Camera, FileUp, Search, CheckCircle2, AlertTriangle, Clock, Check, CreditCard, Calendar as CalendarIcon, X, ChevronRight, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("all");
  const [invoices, setInvoices] = useState(mockData.invoices);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockData.invoices[0] | null>(null);

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

  return (
    <div className="p-3 space-y-4 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="space-y-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Invoices</h1>
        
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <Camera size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-700">Scan</span>
          </button>
          <button className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <FileUp size={16} className="text-primary" />
            <span className="text-xs font-semibold text-gray-700">Upload</span>
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
            onClick={() => setSelectedInvoice(inv)}
            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 min-w-0 mr-2">
                <h3 className="font-bold text-gray-900 text-sm truncate">{inv.vendor}</h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  {inv.id} • {inv.date}
                </p>
                <div className="flex gap-1 mt-0.5 overflow-hidden">
                  {inv.items.slice(0, 2).map((item, idx) => (
                    <span key={idx} className="text-[9px] text-gray-400 whitespace-nowrap bg-gray-50 px-1 rounded">
                      {item.desc}
                    </span>
                  ))}
                  {inv.items.length > 2 && <span className="text-[9px] text-gray-400">+{inv.items.length - 2}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 text-sm">${inv.amount.toLocaleString()}</p>
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
                  {selectedInvoice.id} • Issued {selectedInvoice.date}
                </DrawerDescription>
              </DrawerHeader>

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
                  <span className="text-lg font-bold text-gray-900">${selectedInvoice.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Line Items</h4>
                <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
                  {selectedInvoice.items.map((item, i) => (
                    <div key={i} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{item.desc}</p>
                        <p className="text-[10px] text-gray-400">Qty: {item.qty} × ${item.price}</p>
                      </div>
                      <p className="text-xs font-bold">${(item.qty * item.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Payment Intelligence</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-900 font-medium">Due Date</span>
                  <span className="text-xs font-bold text-blue-900">{selectedInvoice.dueDate}</span>
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
    </div>
  );
}