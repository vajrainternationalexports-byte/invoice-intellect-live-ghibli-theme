import { useState } from "react";
import { mockData } from "@/lib/mock-data";
import { Camera, FileUp, Search, CheckCircle2, AlertTriangle, Clock, Check, CreditCard, Calendar as CalendarIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function Invoices() {
  const [activeTab, setActiveTab] = useState("all");
  const [invoices, setInvoices] = useState(mockData.invoices);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'processed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'needs_review': return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Clock size={16} className="text-blue-500" />;
    }
  };

  const handleApprove = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'pending' } : inv
    ));
    toast.success("Invoice approved and moved to pending");
  };

  const handlePay = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'processed' } : inv
    ));
    toast.success("Payment initiated successfully");
  };

  const handleSchedulePayment = (id: string, date: Date) => {
    const formattedDate = format(date, "dd/MM/yyyy");
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'processed', processedDate: formattedDate } : inv
    ));
    toast.success(`Payment scheduled for ${formattedDate}`);
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Invoices</h1>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm p-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Camera size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Scan Receipt</span>
          </button>
          <button className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm p-3 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
            <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <FileUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700">Upload PDF</span>
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search vendor, ID or amount..." 
            className="pl-10 bg-white border-0 shadow-sm rounded-xl h-12"
          />
        </div>

        <div className="flex gap-2 mb-4 bg-gray-200/50 p-1 rounded-xl">
          {['all', 'pending', 'needs_review'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-lg capitalize transition-all",
                activeTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              )}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {invoices
          .filter(inv => activeTab === 'all' || inv.status === activeTab)
          .map((inv) => (
          <div key={inv.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{inv.vendor}</h3>
                <p className="text-xs text-gray-500">{inv.id} • {inv.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${inv.amount.toLocaleString()}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  {getStatusIcon(inv.status)}
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                    {inv.status === 'processed' && inv.processedDate ? `Paid ${inv.processedDate}` : inv.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">OCR Confidence</span>
                <span className={cn(
                  "font-bold",
                  inv.confidence >= 95 ? "text-emerald-500" : inv.confidence > 80 ? "text-blue-500" : "text-amber-500"
                )}>{inv.confidence}%</span>
              </div>
              <Progress value={inv.confidence} className={cn(
                "h-1.5",
                inv.confidence >= 95 ? "[&>div]:bg-emerald-500" : inv.confidence > 80 ? "[&>div]:bg-blue-500" : "[&>div]:bg-amber-500"
              )} />
            </div>

            <div className="flex flex-col gap-2">
              {inv.status === 'needs_review' && (
                <button 
                  onClick={() => handleApprove(inv.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-emerald-200"
                >
                  <Check size={16} /> Approve
                </button>
              )}
              {inv.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePay(inv.id)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-blue-200"
                  >
                    <CreditCard size={16} /> Pay Now
                  </button>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                      >
                        <CalendarIcon size={16} /> Pay on Due Date
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-0" align="end">
                      <div className="p-4 bg-white">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              handleSchedulePayment(inv.id, date);
                            }
                          }}
                          initialFocus
                          className="rounded-2xl"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}