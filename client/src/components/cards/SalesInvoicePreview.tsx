import { formatINR, formatDate } from "@/lib/formatters";

export function SalesScannedInvoice({ invoice }: { invoice: any }) {
  const buyer = invoice.rawData?.buyer || {};
  return (
    <div className="relative mx-auto max-w-3xl bg-[#fbf9f5] p-8 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-[#e8dfd5] rounded-sm select-none transform rotate-[-0.2deg] font-serif text-[#3e3427] min-h-[800px] overflow-hidden my-4">
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{backgroundImage:`radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)`,backgroundSize:"20px 20px"}}/>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#453723]/[0.02] to-transparent bg-[size:100%_4px] opacity-40"/>
      <div className="absolute top-[35%] left-[20%] pointer-events-none opacity-[0.06] select-none text-center rotate-[-25deg] border-8 border-dashed border-[#8d2a2a] p-6 rounded-3xl">
        <span className="text-6xl font-black block leading-none text-[#8d2a2a] tracking-wider">ORIGINAL</span>
        <span className="text-3xl font-black block tracking-widest mt-2 text-[#8d2a2a]">FOR BUYER</span>
      </div>
      <div className="absolute top-[12%] right-[8%] pointer-events-none opacity-80 select-none text-center rotate-[12deg] border-4 border-double border-[#1a6b3c] p-3 rounded-xl bg-white/40">
        <span className="text-[10px] font-black block leading-none text-[#1a6b3c] tracking-wider">DISPATCHED</span>
        <span className="text-[8px] font-bold block text-[#1a6b3c] mt-1">IES SALES DEPT</span>
      </div>
      <div className="text-center border-b-2 border-[#544837]/30 pb-6 mb-8">
        <h2 className="text-2xl font-black tracking-wide text-[#2e261b] font-mono uppercase">TAX INVOICE</h2>
        <p className="text-[9px] font-mono tracking-widest text-[#544837]/70 mt-1">ORIGINAL FOR RECIPIENT — OUTWARD SUPPLY</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#544837]/20 pb-6 mb-6 text-[10px] font-mono leading-relaxed">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">SELLER Particulars</span>
          <h3 className="text-sm font-black text-[#2e261b] uppercase">INDIA ELECTRICALS SYNDICATE</h3>
          <p className="text-[#544837]/80 uppercase">55, Ezra Street, 1st Floor, Kolkata - 700001</p>
          <div className="pt-2 space-y-0.5">
            <div>GSTIN: <span className="font-bold">19AAAFI6886Q1ZE</span></div>
            <div>PAN: <span className="font-bold">AAAFI6886Q</span></div>
            <div>State Code: <span className="font-bold">19 (West Bengal)</span></div>
          </div>
        </div>
        <div className="space-y-1.5 md:text-right md:flex md:flex-col md:items-end">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide md:text-right">INVOICE SPECIFICATION</span>
          <div className="w-full max-w-[240px] space-y-1 pt-1">
            {[
              ["Invoice No:", invoice.invoiceNo],
              ["Invoice Date:", formatDate(invoice.invoiceDate)],
              ["Due Date:", invoice.dueDate ? formatDate(invoice.dueDate) : formatDate(invoice.invoiceDate)],
              ["PO Reference:", invoice.poReference || "—"],
            ].map(([l,v])=>(<div key={l} className="flex justify-between"><span>{l}</span><span className="font-black text-[#2e261b]">{v}</span></div>))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#544837]/20 pb-6 mb-6 text-[10px] font-mono leading-relaxed">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">BUYER / BILLED TO</span>
          <h4 className="text-xs font-black text-[#2e261b] uppercase">{invoice.customerName}</h4>
          <p className="text-[#544837]/80 uppercase">{buyer.address || "Address on record"}</p>
          <div className="pt-2 space-y-0.5">
            <div>GSTIN: <span className="font-bold">{invoice.customerGstin}</span></div>
            <div>PAN: <span className="font-bold">{invoice.customerGstin?.slice(2,12) || "—"}</span></div>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">SHIPPED FROM</span>
          <h4 className="text-xs font-black text-[#2e261b] uppercase">INDIA ELECTRICALS SYNDICATE</h4>
          <p className="text-[#544837]/80 uppercase">WORKS: 80 JAWPORE ROAD, KOLKATA - 700074</p>
          <div className="pt-2 space-y-0.5">
            <div>Dispatch Point: <span className="font-bold uppercase">{invoice.branchLocation}</span></div>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block mb-2 font-mono">Particulars of Supply</span>
        <table className="w-full text-[10px] font-mono border-collapse border border-[#544837]/30 text-left">
          <thead><tr className="bg-[#e8dfd5]/40 text-[#3e3427] font-black uppercase border-b border-[#544837]/30 text-[8px] tracking-wider">
            <th className="py-2 px-2 border-r border-[#544837]/30 text-center">Sl</th>
            <th className="py-2 px-3 border-r border-[#544837]/30 w-[45%]">Description of Goods</th>
            <th className="py-2 px-2 border-r border-[#544837]/30 text-center">HSN</th>
            <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Qty</th>
            <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Rate</th>
            <th className="py-2 px-3 text-right">Amount</th>
          </tr></thead>
          <tbody className="divide-y divide-[#544837]/20 border-b border-[#544837]/30">
            {invoice.lineItems?.map((li:any, idx:number) => (
              <tr key={idx} className="align-top font-bold text-[#2e261b]">
                <td className="py-2 px-2 border-r border-[#544837]/30 text-center">{idx+1}</td>
                <td className="py-2 px-3 border-r border-[#544837]/30"><div className="font-black text-[#1e1912]">{li.item||li.description}</div><div className="text-[7px] text-[#544837]/60 mt-0.5">BATCH: {li.batchNo||"B-IES"} · SN: {li.serialNo||"SN-000"}</div></td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-center text-[#544837]/80">{li.hsn||"7308"}</td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{li.qty} {li.unit||"Mtr"}</td>
                <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{parseFloat(li.rate||"0").toFixed(2)}</td>
                <td className="py-2 px-3 text-right font-black">{parseFloat(li.total||"0").toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 mb-8 font-mono text-[10px]">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block">OUR BANK ACCOUNT (FOR PAYMENT)</span>
          <div className="bg-[#e8dfd5]/20 p-3 rounded-lg border border-[#e8dfd5] text-[#544837] space-y-0.5">
            <div>A/c Holder: <span className="font-bold uppercase">INDIA ELECTRICALS SYNDICATE</span></div>
            <div>Account No: <span className="font-bold tracking-wider">918020042940294 (AXIS)</span></div>
            <div>Bank Name: <span className="font-bold">Axis Bank Ltd</span></div>
            <div>IFSC Code: <span className="font-bold tracking-widest">UTIB0000104</span></div>
          </div>
        </div>
        <div className="bg-[#e8dfd5]/30 p-4 rounded-xl border border-[#e8dfd5]/75 space-y-1.5 font-bold">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block mb-1">VALUATION SPEC SHEET</span>
          {[
            ["Taxable Value:", formatINR(invoice.taxableAmount)],
            ...(parseFloat(invoice.cgstAmount||"0")>0?[["CGST @9%:",formatINR(invoice.cgstAmount)]]:[]),
            ...(parseFloat(invoice.sgstAmount||"0")>0?[["SGST @9%:",formatINR(invoice.sgstAmount)]]:[]),
            ...(parseFloat(invoice.igstAmount||"0")>0?[["IGST @18%:",formatINR(invoice.igstAmount)]]:[]),
            ["Total GST:", formatINR(invoice.totalGst)],
          ].map(([l,v])=>(<div key={l} className="flex justify-between border-b border-[#544837]/10 pb-1"><span>{l}</span><span>{v}</span></div>))}
          <div className="flex justify-between text-sm font-black text-[#1e1912] pt-1"><span>Grand Total (INR):</span><span>{formatINR(invoice.invoiceTotal)}</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#544837]/30 text-[8px] font-mono uppercase text-[#544837]/80">
        <div>
          <span className="font-bold text-[#8d6e50]">TERMS AND CONDITIONS</span>
          <p className="leading-relaxed mt-1">1. Payment due within 30 days of invoice date. 2. Interest at 18% p.a. on delayed payments. 3. Subject to Kolkata jurisdiction.</p>
        </div>
        <div className="flex flex-col items-end text-center space-y-4">
          <span>For INDIA ELECTRICALS SYNDICATE</span>
          <div className="h-8 flex items-center justify-center opacity-70 font-sans italic text-sm text-[#1e2a5a] select-none pr-8">
            <span className="font-serif text-lg tracking-wider font-extrabold pr-2" style={{fontFamily:"Georgia, serif"}}>Authorized Signatory</span>
          </div>
          <span className="block border-t border-[#544837]/20 pt-1 w-44">Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
}
