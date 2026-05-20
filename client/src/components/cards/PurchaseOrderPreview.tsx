import { formatINR, formatDate } from "@/lib/formatters";

export function PurchaseOrderScannedPaper({ po }: { po: any }) {
  const buyer = po.rawData?.buyer || {};
  const totals = po.rawData?.totals || {};
  const delivery = po.rawData?.delivery || {};
  const paymentTerms = po.rawData?.payment_terms || {};
  
  // Clean values helper
  const cleanNum = (val: any) => parseFloat(String(val || "0").replace(/,/g, ""));

  return (
    <div className="relative mx-auto max-w-3xl bg-[#faf7f2] p-8 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-[#e3dcd3] rounded-sm select-none transform rotate-[0.1deg] font-serif text-[#3e3427] min-h-[900px] overflow-hidden my-4">
      {/* Distressed paper fibers texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]" 
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)`,
          backgroundSize: "22px 22px"
        }}
      />
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#453723]/[0.02] to-transparent bg-[size:100%_4px] opacity-40" />

      {/* PO Stamp */}
      <div className="absolute top-[35%] left-[25%] pointer-events-none opacity-[0.07] select-none text-center rotate-[-20deg] border-8 border-dashed border-[#1e3a8a] p-6 rounded-3xl">
        <span className="text-6xl font-black block leading-none text-[#1e3a8a] tracking-wider">OFFICIAL PO</span>
        <span className="text-3xl font-black block tracking-widest mt-2 text-[#1e3a8a]">PROCUREMENT APPROVED</span>
      </div>

      {/* Rubber Approval Stamp */}
      <div className="absolute top-[12%] right-[8%] pointer-events-none opacity-85 select-none text-center rotate-[-8deg] border-4 border-double border-[#2563eb] p-3 rounded-xl bg-white/40">
        <span className="text-[10px] font-black block leading-none text-[#2563eb] tracking-wider">PO ACCEPTED</span>
        <span className="text-[8px] font-bold block text-[#2563eb] mt-1">IES ORDER ENGINE</span>
        <span className="text-[7px] font-black block text-[#2563eb] border-t border-[#2563eb]/30 mt-1 pt-1">
          {po.poDate ? formatDate(po.poDate) : "APPROVED"}
        </span>
      </div>

      {/* PO Title */}
      <div className="text-center border-b-2 border-[#544837]/30 pb-6 mb-8">
        <h2 className="text-2xl font-black tracking-wide text-[#2e261b] font-mono uppercase">PURCHASE ORDER</h2>
        <p className="text-[9px] font-mono tracking-widest text-[#544837]/70 mt-1">FORMAL PROCUREMENT DIRECTIVE</p>
      </div>

      {/* Buyer & Seller Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#544837]/20 pb-6 mb-6 text-[10px] font-mono leading-relaxed">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">ISSUING BUYER</span>
          <h3 className="text-sm font-black text-[#2e261b] uppercase">{po.buyerName || buyer.organization_name || "Buyer Organization"}</h3>
          <p className="text-[#544837]/80 uppercase">
            {buyer.address_line1 || "Corporate Procurement Headquarters"}
            {buyer.city && `, ${buyer.city}`}
            {buyer.state && `, ${buyer.state}`}
            {buyer.pincode && ` - ${buyer.pincode}`}
          </p>
          <div className="pt-2 space-y-0.5">
            <div>GSTIN: <span className="font-bold">{po.buyerGstin || buyer.gstin || "—"}</span></div>
            {buyer.contact_person && <div>Contact: <span className="font-bold">{buyer.contact_person}</span></div>}
            {buyer.contact_email && <div>Email: <span className="font-bold text-[#3d518c]">{buyer.contact_email}</span></div>}
          </div>
        </div>

        <div className="space-y-1.5 md:text-right md:flex md:flex-col md:items-end">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide md:text-right">ORDER SPECIFICATIONS</span>
          <div className="w-full max-w-[240px] space-y-1 pt-1">
            <div className="flex justify-between">
              <span>PO Number:</span>
              <span className="font-black text-[#2e261b]">{po.poNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>PO Date:</span>
              <span className="font-bold">{po.poDate ? formatDate(po.poDate) : "—"}</span>
            </div>
            {po.gemContractNo && (
              <div className="flex justify-between text-[#8d2a2a]">
                <span>GeM Contract:</span>
                <span className="font-bold uppercase">{po.gemContractNo}</span>
              </div>
            )}
            {delivery.delivery_period_days && (
              <div className="flex justify-between">
                <span>Delivery Period:</span>
                <span className="font-bold">{delivery.delivery_period_days} Days</span>
              </div>
            )}
            {delivery.delivery_location && (
              <div className="flex justify-between text-right truncate">
                <span>Location:</span>
                <span className="font-bold uppercase max-w-[130px] truncate" title={delivery.delivery_location}>{delivery.delivery_location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Addressed To Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#544837]/20 pb-6 mb-6 text-[10px] font-mono leading-relaxed">
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">SUPPLIER (VALUED VENDOR)</span>
          <h4 className="text-xs font-black text-[#2e261b] uppercase">INDIA ELECTRICALS SYNDICATE</h4>
          <p className="text-[#544837]/80 uppercase">55, Ezra Street, 2nd Floor, Kolkata, West Bengal - 700001</p>
          <div className="pt-2 space-y-0.5">
            <div>GSTIN: <span className="font-bold">19AAAFI6886Q1ZE</span></div>
            <div>PAN: <span className="font-bold">AAAFI6886Q</span></div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide">SHIPPING & DISPATCH DESTINATION</span>
          <h4 className="text-xs font-black text-[#2e261b] uppercase">IES Kolkata Works</h4>
          <p className="text-[#544837]/80 uppercase">80 JAWPORE ROAD, KOLKATA, WEST BENGAL - 700074</p>
          <div className="pt-2 space-y-0.5">
            <div>Delivery Basis: <span className="font-bold uppercase">{delivery.delivery_basis || "F.O.R. Site"}</span></div>
          </div>
        </div>
      </div>

      {/* PO Items Table */}
      <div className="mb-6">
        <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block mb-2 font-mono">Scope of Procurement</span>
        <table className="w-full text-[10px] font-mono border-collapse border border-[#544837]/30 text-left">
          <thead>
            <tr className="bg-[#e8dfd5]/40 text-[#3e3427] font-black uppercase border-b border-[#544837]/30 text-[8px] tracking-wider">
              <th className="py-2 px-2 border-r border-[#544837]/30 text-center">Item</th>
              <th className="py-2 px-3 border-r border-[#544837]/30 w-[45%]">Description of Materials</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-center">HSN</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Qty</th>
              <th className="py-2 px-2 border-r border-[#544837]/30 text-right">Rate</th>
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#544837]/20 border-b border-[#544837]/30">
            {po.lineItems?.map((li: any, idx: number) => {
              const qty = cleanNum(li.quantity || li.qty);
              const rate = cleanNum(li.unit_price || li.rate);
              const total = cleanNum(li.total_amount_incl_tax || li.total_amount_excl_tax || li.total || (qty * rate));
              return (
                <tr key={idx} className="align-top font-bold text-[#2e261b]">
                  <td className="py-2 px-2 border-r border-[#544837]/30 text-center">{li.item_no || idx + 1}</td>
                  <td className="py-2 px-3 border-r border-[#544837]/30">
                    <div className="font-black text-[#1e1912]">{li.description || li.item}</div>
                    {li.delivery_date && (
                      <div className="text-[7px] text-[#8d2a2a] mt-0.5">
                        DELIVERY DATE: {formatDate(li.delivery_date)}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 border-r border-[#544837]/30 text-center text-[#544837]/80">{li.hsn_code || li.hsn || "7308"}</td>
                  <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{qty} {li.uom || li.unit || "Mtr"}</td>
                  <td className="py-2 px-2 border-r border-[#544837]/30 text-right">{formatINR(rate)}</td>
                  <td className="py-2 px-3 text-right font-black">{formatINR(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals & Commercial Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 mb-8 font-mono text-[10px]">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block">COMMERCIAL PAYMENT TERMS</span>
            <div className="bg-[#e8dfd5]/20 p-3 rounded-lg border border-[#e8dfd5] text-[#544837] space-y-1">
              <div>Advance Portion: <span className="font-bold">{paymentTerms.advance_percent || "0"}%</span></div>
              <div>Balance Portion: <span className="font-bold">{paymentTerms.balance_percent || "100"}%</span></div>
              {paymentTerms.payment_days && <div>Settlement: <span className="font-bold">Within {paymentTerms.payment_days} Days</span></div>}
              {po.rawData?.warranty_months && <div>Warranty: <span className="font-bold">{po.rawData.warranty_months} Months</span></div>}
            </div>
          </div>
        </div>

        <div className="bg-[#e8dfd5]/30 p-4 rounded-xl border border-[#e8dfd5]/75 space-y-1.5 font-bold">
          <span className="text-[8px] font-bold text-[#8d6e50] uppercase tracking-wide block mb-1">COMMERCIAL BREAKDOWN</span>
          {totals.basic_price_ex_works && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1">
              <span>Basic (Ex-Works):</span>
              <span>{formatINR(totals.basic_price_ex_works)}</span>
            </div>
          )}
          {totals.packing_forwarding && cleanNum(totals.packing_forwarding) > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1">
              <span>P&F Charges:</span>
              <span>{formatINR(totals.packing_forwarding)}</span>
            </div>
          )}
          {totals.freight && cleanNum(totals.freight) > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1">
              <span>Freight / Transit:</span>
              <span>{formatINR(totals.freight)}</span>
            </div>
          )}
          {totals.cgst_amount && cleanNum(totals.cgst_amount) > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1 text-[#544837]">
              <span>CGST:</span>
              <span>{formatINR(totals.cgst_amount)}</span>
            </div>
          )}
          {totals.igst_amount && cleanNum(totals.igst_amount) > 0 && (
            <div className="flex justify-between border-b border-[#544837]/10 pb-1 text-[#544837]">
              <span>IGST:</span>
              <span>{formatINR(totals.igst_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-[#1e1912] pt-1">
            <span>Grand Total (PO Val):</span>
            <span>{formatINR(po.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Signature and Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#544837]/30 text-[8px] font-mono uppercase text-[#544837]/80">
        <div>
          <span className="font-bold text-[#8d6e50]">GENERAL PROCUREMENT DIRECTIVE</span>
          <p className="leading-relaxed mt-1">
            This purchase order is legally binding under corporate law. All materials must conform strictly to specifications. Invoices must list the PO reference number.
          </p>
        </div>
        <div className="flex flex-col items-end text-center space-y-4">
          <span>For {po.buyerName || buyer.organization_name || "THE ISSUING BUYER"}</span>
          <div className="h-8 flex items-center justify-center opacity-70 font-sans italic text-sm text-[#1e2a5a] select-none pr-8">
            <span className="font-serif text-lg tracking-wider font-extrabold pr-2" style={{fontFamily:"Georgia, serif"}}>Authorized Signatory</span>
          </div>
          <span className="block border-t border-[#544837]/20 pt-1 w-44">Purchasing Authority</span>
        </div>
      </div>
    </div>
  );
}
