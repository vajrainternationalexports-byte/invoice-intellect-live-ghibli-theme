import { useState, useRef } from "react";
import { Camera, Upload, Loader2, FileText, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DocumentExtractor({
  docTypeHint = "AUTO_DETECT",
  onExtract,
  onCancel
}: {
  docTypeHint?: string;
  onExtract: (data: any) => void;
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setStatus("processing");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      const mimeType = file.type;

      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64String, mimeType, docTypeHint }),
        });

        const response = await res.json();

        if (response.success && response.data) {
          setStatus("success");
          setResult(response.data);
          setTimeout(() => {
            onExtract(response.data);
            toast.success("Document extracted successfully");
          }, 1000);
        } else {
          setStatus("error");
          toast.error(response.error || "Failed to extract document");
        }
      } catch (err: any) {
        setStatus("error");
        toast.error(err.message || "An error occurred");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900">AI Document Scanner</h3>
        {onCancel && (
          <button onClick={onCancel} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {status === "idle" && (
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => cameraInputRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-gray-500 cursor-pointer active:scale-95 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm"
          >
            <div className="h-14 w-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <Camera size={24} />
            </div>
            <span className="font-bold text-sm text-gray-700">Use Camera</span>
            <span className="text-[10px] text-gray-400 text-center px-2">Take a photo</span>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-gray-500 cursor-pointer active:scale-95 transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm"
          >
            <div className="h-14 w-14 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
              <Upload size={24} />
            </div>
            <span className="font-bold text-sm text-gray-700">Upload PDF</span>
            <span className="text-[10px] text-gray-400 text-center px-2">From your device files</span>
          </div>
          
          <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {status === "processing" && (
        <div className="border border-blue-100 bg-blue-50/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-blue-600 shadow-inner relative">
          <button 
            onClick={() => {
              setStatus("idle");
              toast.info("Extraction cancelled");
            }}
            className="absolute top-4 right-4 p-1.5 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm"
          >
            <X size={14} />
          </button>
          <Loader2 size={36} className="animate-spin text-blue-500" />
          <div className="text-center">
            <p className="font-bold text-blue-900">AI is analyzing document...</p>
            <p className="text-xs text-blue-600/70 mt-1">Extracting line items and values</p>
          </div>
        </div>
      )}

      {status === "success" && result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-emerald-600 animate-in zoom-in-95 duration-300 shadow-sm">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <div className="text-center">
            <p className="font-bold text-emerald-900 text-lg">Extraction Complete</p>
            <div className="bg-white/60 px-3 py-1.5 rounded-lg mt-2 inline-block border border-emerald-100/50">
               <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                 Found {result.line_items?.length || result.transactions?.length || 0} line items
               </p>
            </div>
          </div>
          <button 
            className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
            onClick={() => onExtract(result)}
          >
            Review extracted data
          </button>
        </div>
      )}
    </div>
  );
}

function generateMockDataForType(type: string) {
  if (type === "TAX_INVOICE" || type === "AUTO_DETECT") {
    return {
      document_type: "TAX_INVOICE",
      invoice_no: "IES/25-26/0117",
      invoice_date: "2026-03-30",
      seller: { name: "INDIA ELECTRICALS SYNDICATE", gstin: "19AAAFI6886Q1ZE" },
      bill_to: { company_name: "BHEL- Ranipet" },
      totals: { invoice_total: 117000 },
      line_items: [
        { description: "M8x35 Boult, Spring Nut", quantity: 6500, price_per_unit: 15.25, total_amount: 117000 }
      ]
    };
  }
  if (type === "PURCHASE_ORDER") {
    return {
      document_type: "PURCHASE_ORDER",
      po_number: "7100000854",
      po_date: "2026-02-07",
      buyer: { organization_name: "BHEL- Ranipet" },
      totals: { grand_total: 117000 },
      line_items: [
        { description: "M8x35 Boult, Spring Nut", quantity: 6500, unit_price: 15.25 }
      ]
    };
  }
  if (type === "ZINC_STATEMENT_IES") {
    return {
      document_type: "ZINC_STATEMENT_IES",
      sheet_no: "8",
      period_from: "2024-02-28",
      period_to: "2024-03-30",
      previous_zinc_due_kgs: 4714.962,
      summary: { total_zinc_consumed_kgs: 7194.162, closing_zinc_due_kgs: 239.162 },
      transactions: [
        { description: "Zinc Ingot Received", weight_kgs: 0, zinc_ingot_received_kgs: 4980 },
        { description: "MS Coupler Plate", weight_kgs: 1850, zinc_percent: 6.2, zinc_consumed_kgs: 114.7 }
      ]
    };
  }
  if (type === "LABOUR_INVOICE") {
    return {
      document_type: "LABOUR_INVOICE",
      invoice_no: "JW/1024",
      invoice_date: "2026-03-25",
      galvanizer: { name: "Acme Galvanizers" },
      totals: { invoice_total: 45000 },
      line_items: [
        { description: "Galvanizing Charges", weight_kgs: 2500, rate_per_kg: 18 }
      ]
    };
  }
  return {};
}
