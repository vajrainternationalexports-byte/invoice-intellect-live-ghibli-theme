import { useState, useMemo, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileDown, Activity, Scale, TrendingDown, Layers, Upload, Trash2, Plus, X, Save } from "lucide-react";
import { downloadExcel } from "@/lib/excel-export";
import { toast } from "sonner";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ExcelJS from "exceljs";
import { apiRequest } from "@/lib/queryClient";
import { formatINR } from "@/lib/formatters";

interface InwardRow {
  date: string;
  particulars: string;
  vchType: string;
  challanNo: string;
  inwardQty: number;
  materialDesc: string;
  thickness: string;
  zincRate: number;
  grossZinc: number;
}

interface OutwardRow {
  dispatchDocNo: string;
  dispatchQty: number;
  date: string;
  remarks: string;
}

interface ParsedSheet {
  period: string;
  galvanizerName: string;
  periodFrom: string;
  periodTo: string;
  totalWeightKg: string;
  totalZincConsumedKg: string;
  totalZincReceivedKg: string;
  closingZincDueKg: string;
  inwardRows: InwardRow[];
  outwardRows: OutwardRow[];
}

export default function JobWorkDashboard() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/job-work"]
  });

  // State for Upload and Preview Modal
  const [previewData, setPreviewData] = useState<ParsedSheet[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Calculate dynamic stats from actual DB entries
  const stats = useMemo(() => {
    let totalProcessed = 0;
    let totalConsumed = 0;
    let totalReceived = 0;

    entries.forEach(e => {
      totalProcessed += parseFloat(e.totalWeightKg) || 0;
      totalConsumed += parseFloat(e.totalZincConsumedKg) || 0;
      totalReceived += parseFloat(e.totalZincReceivedKg) || 0;
    });

    const balance = totalConsumed - totalReceived;

    return {
      processed: totalProcessed,
      consumed: totalConsumed,
      received: totalReceived,
      balance
    };
  }, [entries]);

  // Chart data from DB entries or mock fallback
  const chartData = useMemo(() => {
    if (entries.length === 0) {
      return [
        { month: "Apr", balance: -450 },
        { month: "May", balance: -320 },
        { month: "Jun", balance: 120 },
        { month: "Jul", balance: 540 },
        { month: "Aug", balance: 210 },
        { month: "Sep", balance: -150 },
        { month: "Oct", balance: -890 }
      ];
    }
    
    // Sort chronologically by date
    const sorted = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sorted.map((e: any) => {
      const month = e.period ? e.period.split(" ")[0].substring(0, 3) : "Entry";
      return {
        month,
        balance: parseFloat(e.closingZincDueKg) || 0
      };
    });
  }, [entries]);

  // Save parsed statement mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const r = await apiRequest("POST", "/api/job-work", payload);
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error?.message || "Failed to save statement");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/job-work"] });
      toast.success("Zinc ledger statement saved successfully!");
    },
    onError: (err: any) => {
      toast.error(`Error saving statement: ${err.message}`);
    }
  });

  const handleDownloadExcel = async () => {
    const exportData = entries.map(e => ({
      Period: e.period,
      Galvanizer: e.galvanizerName,
      "Processed (KG)": parseFloat(e.totalWeightKg) || 0,
      "Zinc Consumed (KG)": parseFloat(e.totalZincConsumedKg) || 0,
      "Zinc Received (KG)": parseFloat(e.totalZincReceivedKg) || 0,
      "Closing Balance (KG)": parseFloat(e.closingZincDueKg) || 0
    }));
    await downloadExcel(exportData.length > 0 ? exportData : chartData, "Zinc_Ledger_Dashboard", "Ledger");
    toast.success("Zinc Ledger exported to Excel");
  };

  // Helper Excel functions
  const getCellValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') {
      if (val.result !== undefined && val.result !== null) return String(val.result);
      if (val.text !== undefined && val.text !== null) return String(val.text);
      return "";
    }
    return String(val);
  };

  const getNumericValue = (val: any): number => {
    const s = getCellValue(val);
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const getNumericValueFromRow = (vals: any[]): number => {
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] !== null && vals[i] !== undefined && vals[i] !== "") {
        const val = getCellValue(vals[i]);
        const n = parseFloat(val);
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  };

  // Parser
  const parseFile = async (file: File) => {
    const loadingToast = toast.loading(`Parsing "${file.name}"...`);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const parsedSheets: ParsedSheet[] = [];
      
      workbook.worksheets.forEach(ws => {
        const sheetName = ws.name;
        // Skip default or empty worksheets
        if (!sheetName || sheetName.toLowerCase().startsWith("sheet")) return;

        let inwardRows: InwardRow[] = [];
        let outwardRows: OutwardRow[] = [];
        let totalWeight = 0;
        let totalZincConsumed = 0;
        let totalZincReceived = 0;
        
        let inMainTable = false;
        
        ws.eachRow((row) => {
          const vals = row.values as any[];
          if (!vals) return;
          
          const colBVal = getCellValue(vals[2]);
          if (colBVal === "SL NO" || String(colBVal).toLowerCase().includes("sl no")) {
            inMainTable = true;
            return;
          }
          
          if (inMainTable && (colBVal === "TOTAL" || String(colBVal).toLowerCase().includes("total"))) {
            inMainTable = false;
            totalWeight = getNumericValue(vals[7]) * 1000; // MT to KG
            totalZincConsumed = getNumericValue(vals[11]);
            return;
          }
          
          if (inMainTable) {
            const inwardQty = getNumericValue(vals[7]) * 1000; // MT to KG
            const grossZinc = getNumericValue(vals[11]);
            const challanNo = getCellValue(vals[6]);
            
            if (challanNo || inwardQty > 0) {
              inwardRows.push({
                date: getCellValue(vals[3]).split("T")[0],
                particulars: getCellValue(vals[4]),
                vchType: getCellValue(vals[5]),
                challanNo,
                inwardQty,
                materialDesc: getCellValue(vals[8]),
                thickness: getCellValue(vals[9]),
                zincRate: getNumericValue(vals[10]),
                grossZinc
              });
            }
            
            const dispatchDocNo = getCellValue(vals[12]);
            const dispatchQty = getNumericValue(vals[13]);
            if (dispatchDocNo || dispatchQty > 0) {
              outwardRows.push({
                dispatchDocNo,
                dispatchQty,
                date: getCellValue(vals[14]).split("T")[0],
                remarks: getCellValue(vals[15])
              });
            }
          }
          
          const rowJson = JSON.stringify(vals).toLowerCase();
          if (rowJson.includes("zinc received")) {
            totalZincReceived = getNumericValueFromRow(vals);
          }
        });

        // Fallback calculations if TOTAL row didn't map perfectly
        if (totalWeight === 0) {
          totalWeight = inwardRows.reduce((sum, r) => sum + r.inwardQty, 0);
        }
        if (totalZincConsumed === 0) {
          totalZincConsumed = inwardRows.reduce((sum, r) => sum + r.grossZinc, 0);
        }

        const closingZincDue = totalZincConsumed - totalZincReceived;
        
        parsedSheets.push({
          period: sheetName.replace(/'/g, " 20"), // APR'25 -> APR 2025
          galvanizerName: "Bharat Galvanizers",
          periodFrom: inwardRows[0]?.date || "",
          periodTo: inwardRows[inwardRows.length - 1]?.date || "",
          totalWeightKg: totalWeight.toFixed(2),
          totalZincConsumedKg: totalZincConsumed.toFixed(2),
          totalZincReceivedKg: totalZincReceived.toFixed(2),
          closingZincDueKg: closingZincDue.toFixed(2),
          inwardRows,
          outwardRows
        });
      });
      
      toast.dismiss(loadingToast);
      if (parsedSheets.length === 0) {
        toast.error("No valid monthly sheets found in this file. Make sure sheets are named like APR'25.");
        return;
      }
      
      setPreviewData(parsedSheets);
      setSelectedPreviewIndex(0);
      setIsPreviewOpen(true);
      toast.success(`Successfully parsed ${parsedSheets.length} running account statements!`);
    } catch (e: any) {
      toast.dismiss(loadingToast);
      console.error(e);
      toast.error(`Excel extraction failed: ${e.message || e}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  // Inline edits handler
  const handleMetaChange = (field: keyof ParsedSheet, val: any) => {
    setPreviewData(prev => {
      const updated = [...prev];
      const active = { ...updated[selectedPreviewIndex] };
      (active as any)[field] = val;
      
      // Auto recalculate balance if values changed
      if (field === "totalZincConsumedKg" || field === "totalZincReceivedKg") {
        const cons = parseFloat(active.totalZincConsumedKg) || 0;
        const rec = parseFloat(active.totalZincReceivedKg) || 0;
        active.closingZincDueKg = (cons - rec).toFixed(2);
      }
      
      updated[selectedPreviewIndex] = active;
      return updated;
    });
  };

  const handleInwardRowChange = (rowIndex: number, field: keyof InwardRow, val: any) => {
    setPreviewData(prev => {
      const updated = [...prev];
      const active = { ...updated[selectedPreviewIndex] };
      const rows = [...active.inwardRows];
      
      const updatedRow = { ...rows[rowIndex] };
      (updatedRow as any)[field] = field === "inwardQty" || field === "zincRate" || field === "grossZinc" ? parseFloat(val) || 0 : val;
      
      // Recalculate gross zinc if rate or qty changes
      if (field === "inwardQty" || field === "zincRate") {
        // qty is in kgs, rate is in kgs per MT (1000 kgs)
        const qtyMT = updatedRow.inwardQty / 1000;
        updatedRow.grossZinc = parseFloat((qtyMT * updatedRow.zincRate).toFixed(2));
      }
      
      rows[rowIndex] = updatedRow;
      active.inwardRows = rows;
      
      // Recalculate totals
      const totalWt = rows.reduce((sum, r) => sum + r.inwardQty, 0);
      const totalCons = rows.reduce((sum, r) => sum + r.grossZinc, 0);
      active.totalWeightKg = totalWt.toFixed(2);
      active.totalZincConsumedKg = totalCons.toFixed(2);
      active.closingZincDueKg = (totalCons - parseFloat(active.totalZincReceivedKg || "0")).toFixed(2);
      
      updated[selectedPreviewIndex] = active;
      return updated;
    });
  };

  const handleOutwardRowChange = (rowIndex: number, field: keyof OutwardRow, val: any) => {
    setPreviewData(prev => {
      const updated = [...prev];
      const active = { ...updated[selectedPreviewIndex] };
      const rows = [...active.outwardRows];
      
      const updatedRow = { ...rows[rowIndex] };
      (updatedRow as any)[field] = field === "dispatchQty" ? parseFloat(val) || 0 : val;
      
      rows[rowIndex] = updatedRow;
      active.outwardRows = rows;
      
      updated[selectedPreviewIndex] = active;
      return updated;
    });
  };

  const handleAddInwardRow = () => {
    setPreviewData(prev => {
      const updated = [...prev];
      const active = { ...updated[selectedPreviewIndex] };
      active.inwardRows = [
        ...active.inwardRows,
        { date: new Date().toISOString().split("T")[0], particulars: "", vchType: "IN", challanNo: "", inwardQty: 0, materialDesc: "", thickness: "", zincRate: 0, grossZinc: 0 }
      ];
      updated[selectedPreviewIndex] = active;
      return updated;
    });
  };

  const handleAddOutwardRow = () => {
    setPreviewData(prev => {
      const updated = [...prev];
      const active = { ...updated[selectedPreviewIndex] };
      active.outwardRows = [
        ...active.outwardRows,
        { dispatchDocNo: "", dispatchQty: 0, date: new Date().toISOString().split("T")[0], remarks: "" }
      ];
      updated[selectedPreviewIndex] = active;
      return updated;
    });
  };

  const handleSaveActiveSheet = async () => {
    const sheet = previewData[selectedPreviewIndex];
    
    // Construct database transaction payload
    const payload = {
      galvanizerName: sheet.galvanizerName,
      period: sheet.period,
      periodFrom: sheet.periodFrom || null,
      periodTo: sheet.periodTo || null,
      totalWeightKg: sheet.totalWeightKg,
      totalZincConsumedKg: sheet.totalZincConsumedKg,
      totalZincReceivedKg: sheet.totalZincReceivedKg,
      closingZincDueKg: sheet.closingZincDueKg,
      transactions: {
        inwardRows: sheet.inwardRows,
        outwardRows: sheet.outwardRows
      },
      rawData: null
    };

    try {
      await saveMutation.mutateAsync(payload);
      // Remove this sheet from preview array
      const remaining = previewData.filter((_, i) => i !== selectedPreviewIndex);
      setPreviewData(remaining);
      
      if (remaining.length === 0) {
        setIsPreviewOpen(false);
      } else {
        setSelectedPreviewIndex(0);
      }
    } catch (e) {
      // toast shown in mutation onError
    }
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/jobwork">
            <button className="h-10 w-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-all">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Zinc Running Account</h1>
            <p className="text-xs text-slate-500">Maker-Checker Audit Control</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadExcel} className="h-9 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-90 transition-all text-xs font-bold uppercase tracking-wider">
            <FileDown size={16} /> Excel
          </button>
        </div>
      </header>

      {/* Stats Card */}
      <div className="bg-[#0F172A] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Net Balance</p>
          <div className="flex items-baseline gap-2">
            <h2 className={`text-4xl font-black ${stats.balance < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.balance > 0 ? `+${stats.balance.toFixed(2)}` : stats.balance.toFixed(2)}
            </h2>
            <span className="text-sm font-bold text-slate-300">KG</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <Activity size={14} /> {stats.balance < 0 ? "Galvanizer owes IES zinc" : "Excess zinc at IES premises"}
          </p>
        </div>
        
        <div className="h-24 mt-4 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upload Box */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
          isDragging 
            ? "border-emerald-500 bg-emerald-50/50" 
            : "border-slate-200 hover:border-slate-300 bg-white"
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".xlsx" 
          className="hidden" 
        />
        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Upload size={22} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">Upload running account sheet</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Drag and drop statement .xlsx file here</p>
        </div>
      </div>

      {/* Database Sheets List */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Ledger Statements</h3>
        
        {isLoading ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold">Loading statement data...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 bg-white border border-slate-100 rounded-3xl text-slate-400 text-xs font-medium">
            No statements uploaded yet. Upload an Excel sheet above to populate the ledger.
          </div>
        ) : (
          entries.map((sheet, i) => {
            const bal = parseFloat(sheet.closingZincDueKg) || 0;
            return (
              <div key={i} className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">{sheet.period}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{sheet.galvanizerName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Movement</span>
                    <p className={`text-sm font-black ${bal < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {bal > 0 ? '+' : ''}{bal.toFixed(2)} KG
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between text-center gap-2">
                  <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                    <Scale size={14} className="mx-auto mb-1 text-slate-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Processed</p>
                    <p className="text-xs font-black text-slate-700">{(parseFloat(sheet.totalWeightKg) || 0).toLocaleString()} KG</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                    <TrendingDown size={14} className="mx-auto mb-1 text-rose-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Consumed</p>
                    <p className="text-xs font-black text-rose-600">{(parseFloat(sheet.totalZincConsumedKg) || 0).toLocaleString()} KG</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-2xl flex-1">
                    <Layers size={14} className="mx-auto mb-1 text-emerald-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Received</p>
                    <p className="text-xs font-black text-emerald-600">{(parseFloat(sheet.totalZincReceivedKg) || 0).toLocaleString()} KG</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Gorgeous Preview / Inline Edit Modal */}
      {isPreviewOpen && previewData.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Preview & Edit Imported Ledger</h3>
                <p className="text-xs text-slate-500">Double-check extracted values before committing to database.</p>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sheets selector tabs inside modal */}
            {previewData.length > 1 && (
              <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/30 px-4 py-2 gap-2">
                {previewData.map((sheet, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPreviewIndex(index)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedPreviewIndex === index 
                        ? "bg-[#0F172A] text-white" 
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {sheet.period}
                  </button>
                ))}
              </div>
            )}

            {/* Active Sheet Preview Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta information summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Period / Month</label>
                  <input 
                    type="text" 
                    value={previewData[selectedPreviewIndex].period}
                    onChange={(e) => handleMetaChange("period", e.target.value)}
                    className="w-full bg-transparent border-0 font-bold text-xs text-slate-800 focus:ring-0 p-0 mt-0.5" 
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Galvanizer Name</label>
                  <input 
                    type="text" 
                    value={previewData[selectedPreviewIndex].galvanizerName}
                    onChange={(e) => handleMetaChange("galvanizerName", e.target.value)}
                    className="w-full bg-transparent border-0 font-bold text-xs text-slate-800 focus:ring-0 p-0 mt-0.5" 
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Total Weight (KG)</label>
                  <input 
                    type="text" 
                    value={previewData[selectedPreviewIndex].totalWeightKg}
                    onChange={(e) => handleMetaChange("totalWeightKg", e.target.value)}
                    className="w-full bg-transparent border-0 font-bold text-xs text-slate-800 focus:ring-0 p-0 mt-0.5" 
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-rose-500 uppercase">Gross Zinc Consumed</label>
                  <input 
                    type="text" 
                    value={previewData[selectedPreviewIndex].totalZincConsumedKg}
                    onChange={(e) => handleMetaChange("totalZincConsumedKg", e.target.value)}
                    className="w-full bg-transparent border-0 font-bold text-xs text-rose-600 focus:ring-0 p-0 mt-0.5" 
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-emerald-500 uppercase">Zinc Received</label>
                  <input 
                    type="text" 
                    value={previewData[selectedPreviewIndex].totalZincReceivedKg}
                    onChange={(e) => handleMetaChange("totalZincReceivedKg", e.target.value)}
                    className="w-full bg-transparent border-0 font-bold text-xs text-emerald-600 focus:ring-0 p-0 mt-0.5" 
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Closing Balance</label>
                  <p className="font-bold text-xs text-slate-800 mt-0.5">
                    {previewData[selectedPreviewIndex].closingZincDueKg} KG
                  </p>
                </div>
              </div>

              {/* Inward Transactions Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Inward Materials & Consumption</h4>
                  <button 
                    onClick={handleAddInwardRow}
                    className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 text-[10px] font-bold active:scale-95 transition-all"
                  >
                    <Plus size={12} /> Add Inward Row
                  </button>
                </div>
                <div className="border border-slate-150 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 text-[10px] uppercase">
                        <th className="p-2 w-24">Date</th>
                        <th className="p-2">Particulars</th>
                        <th className="p-2 w-16">Type</th>
                        <th className="p-2 w-24">Challan</th>
                        <th className="p-2 w-24 text-right">Inward Qty (KG)</th>
                        <th className="p-2">Material Description</th>
                        <th className="p-2 w-16 text-center">Thk</th>
                        <th className="p-2 w-20 text-right">Zinc rate</th>
                        <th className="p-2 w-24 text-right">Gross Zinc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData[selectedPreviewIndex].inwardRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.date} 
                              onChange={(e) => handleInwardRowChange(idx, "date", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.particulars} 
                              onChange={(e) => handleInwardRowChange(idx, "particulars", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.vchType} 
                              onChange={(e) => handleInwardRowChange(idx, "vchType", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs text-center"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.challanNo} 
                              onChange={(e) => handleInwardRowChange(idx, "challanNo", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={row.inwardQty} 
                              onChange={(e) => handleInwardRowChange(idx, "inwardQty", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs text-right"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.materialDesc} 
                              onChange={(e) => handleInwardRowChange(idx, "materialDesc", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.thickness} 
                              onChange={(e) => handleInwardRowChange(idx, "thickness", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs text-center"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={row.zincRate} 
                              onChange={(e) => handleInwardRowChange(idx, "zincRate", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs text-right"
                            />
                          </td>
                          <td className="p-1 font-semibold text-right p-2 text-rose-600">
                            {row.grossZinc.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outward Dispatches Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Outward Dispatches</h4>
                  <button 
                    onClick={handleAddOutwardRow}
                    className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 text-[10px] font-bold active:scale-95 transition-all"
                  >
                    <Plus size={12} /> Add Outward Row
                  </button>
                </div>
                <div className="border border-slate-150 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 text-[10px] uppercase">
                        <th className="p-2">Dispatch Doc No</th>
                        <th className="p-2 w-32 text-right">Despatch Qty (Nos)</th>
                        <th className="p-2 w-36">Date</th>
                        <th className="p-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData[selectedPreviewIndex].outwardRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.dispatchDocNo} 
                              onChange={(e) => handleOutwardRowChange(idx, "dispatchDocNo", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              value={row.dispatchQty} 
                              onChange={(e) => handleOutwardRowChange(idx, "dispatchQty", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs text-right"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.date} 
                              onChange={(e) => handleOutwardRowChange(idx, "date", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="text" 
                              value={row.remarks} 
                              onChange={(e) => handleOutwardRowChange(idx, "remarks", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                {previewData.length} pending statements in import queue.
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveActiveSheet}
                  disabled={saveMutation.isPending}
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Save size={16} /> {saveMutation.isPending ? "Saving..." : "Save to Database"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
