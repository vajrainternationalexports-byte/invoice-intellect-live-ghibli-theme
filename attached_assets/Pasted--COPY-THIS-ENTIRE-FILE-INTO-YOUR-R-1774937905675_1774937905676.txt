// ============================================================
// COPY THIS ENTIRE FILE INTO YOUR REPLIT APP
// File: src/lib/documentExtractor.js
// ============================================================

// ──────────────────────────────────────────────
// MASTER SYSTEM PROMPT — use for ALL API calls
// ──────────────────────────────────────────────
export const MASTER_SYSTEM_PROMPT = `You are a precision document data extraction engine for India Electricals Syndicate (IES), GSTIN 19AAAFI6886Q1ZE, a manufacturer of Hot Dip Galvanised Steel Cable Trays, Coupler Plates, and accessories based in Kolkata, West Bengal.

You extract structured JSON from Tax Invoices, Purchase Orders, Zinc Consumption Statements, Zinc Ledgers, and Labour invoices.

ABSOLUTE RULES — NEVER VIOLATE:
1. Extract EVERY visible field. Do not omit, summarize, paraphrase, or merge fields.
2. Numeric values: preserve exact digits including all decimals. Never round. Never approximate.
3. Dates: ISO 8601 format only — YYYY-MM-DD. If only month+year visible, use YYYY-MM-01.
4. Currency: numeric value only, no ₹ symbol, always INR. E.g. 399725 not ₹3,99,725.
5. Missing field: return null. NEVER fabricate or infer a value not in the document.
6. GST rule: CGST+SGST applies when bill-to and seller are same state (intra-state). IGST applies when different states (inter-state). They NEVER coexist on the same invoice.
7. Line items: every row = separate object in the array. Never merge rows.
8. HSN/SAC codes: always string type to preserve leading zeros.
9. Company names: verbatim including "M/s.", "Ltd.", "Pvt.", abbreviations.
10. Zinc percent: never confuse with GST percent. They appear in different columns.
11. Output: ONLY valid JSON. No markdown code fences. No preamble. No explanation. No trailing text.
12. If image quality is poor for a field, still extract best interpretation and add "_low_confidence": true on that field.

INDIA ELECTRICALS SYNDICATE KNOWN DATA:
- Seller GSTIN: 19AAAFI6886Q1ZE
- State: West Bengal, Code: 19
- Office: 55 Ezra Street, 2nd Floor, Kolkata-700001
- Works W1: 80 Jawpore Road, Kolkata-700074
- Works W2: Jalan Industrial Complex, Gate-1, 2nd Right Lane, Howrah-711411
- Bank: HDFC Bank, India Exchange Place
- Account: 12422020001109, IFSC: HDFC0001242
- Invoice series: IES/{FY}/{4-digit-seq}, e.g. IES/25-26/0109`;


// ──────────────────────────────────────────────
// PER-DOCUMENT USER PROMPTS
// ──────────────────────────────────────────────
export const EXTRACTION_PROMPTS = {

  TAX_INVOICE: `This document is a Tax Invoice issued BY India Electricals Syndicate. Extract all data into this exact JSON schema. Return JSON only — no markdown, no explanation.

{
  "document_type": "TAX_INVOICE",
  "invoice_no": null,
  "invoice_date": null,
  "financial_year": null,
  "e_way_bill_no": null,
  "e_way_bill_date": null,
  "place_of_supply_state": null,
  "place_of_supply_code": null,
  "supply_type": null,
  "po_number": null,
  "po_date": null,
  "amended_po_no": null,
  "amended_po_date": null,
  "project_name": null,
  "contact_person": null,
  "contact_mobile": null,
  "vehicle_number": null,
  "transport_name": null,
  "lr_rr_no": null,
  "insurance_name": null,
  "insurance_policy_no": null,
  "dispatch_clearance_ref": null,
  "seller": {
    "name": null,
    "gstin": null,
    "bank_account_no": null,
    "bank_ifsc": null
  },
  "bill_to": {
    "company_name": null,
    "address_line1": null,
    "address_line2": null,
    "city": null,
    "state": null,
    "state_code": null,
    "pincode": null,
    "country": null,
    "gstin": null,
    "contact_no": null
  },
  "ship_to": {
    "company_name": null,
    "site_name": null,
    "address_line1": null,
    "city": null,
    "state": null,
    "pincode": null
  },
  "line_items": [
    {
      "sl_no": 1,
      "description": null,
      "hsn_sac": null,
      "quantity": null,
      "unit": null,
      "price_per_unit": null,
      "taxable_amount": null,
      "gst_amount": null,
      "total_amount": null,
      "cgst_rate": null,
      "cgst_amount": null,
      "sgst_rate": null,
      "sgst_amount": null,
      "igst_rate": null,
      "igst_amount": null
    }
  ],
  "totals": {
    "sub_total_taxable": null,
    "total_cgst": null,
    "total_sgst": null,
    "total_igst": null,
    "total_gst": null,
    "round_off": null,
    "invoice_total": null,
    "amount_in_words": null
  },
  "hsn_summary": [
    {
      "hsn_sac": null,
      "taxable_amount": null,
      "cgst_rate": null,
      "cgst_amount": null,
      "sgst_rate": null,
      "sgst_amount": null,
      "igst_rate": null,
      "igst_amount": null,
      "total_tax": null
    }
  ],
  "irn_number": null,
  "is_e_invoice": null,
  "reverse_charge_applicable": false,
  "packing_list_ref": null
}`,


  PURCHASE_ORDER: `This document is a Purchase Order addressed TO India Electricals Syndicate from a client/buyer. Extract all data into this exact JSON schema. Return JSON only — no markdown, no explanation.

{
  "document_type": "PURCHASE_ORDER",
  "po_number": null,
  "po_date": null,
  "amendment_no": null,
  "amendment_date": null,
  "gem_contract_no": null,
  "gem_contract_date": null,
  "nit_no": null,
  "bid_no": null,
  "buyer": {
    "organization_name": null,
    "plant_name": null,
    "address_line1": null,
    "city": null,
    "state": null,
    "pincode": null,
    "gstin": null,
    "contact_person": null,
    "contact_email": null,
    "contact_phone": null,
    "vendor_id_for_ies": null
  },
  "line_items": [
    {
      "item_no": null,
      "material_code": null,
      "description": null,
      "hsn_code": null,
      "quantity": null,
      "uom": null,
      "unit_price": null,
      "tax_type": null,
      "tax_rate_percent": null,
      "tax_amount": null,
      "total_amount_excl_tax": null,
      "total_amount_incl_tax": null,
      "delivery_date": null,
      "ship_to_address": null,
      "bill_to_address": null
    }
  ],
  "totals": {
    "basic_price_ex_works": null,
    "packing_forwarding": null,
    "freight": null,
    "transit_insurance": null,
    "tpia_charges": null,
    "sub_total": null,
    "igst_rate": null,
    "igst_amount": null,
    "cgst_rate": null,
    "cgst_amount": null,
    "grand_total": null,
    "amount_in_words": null
  },
  "delivery": {
    "delivery_period_days": null,
    "delivery_period_weeks": null,
    "delivery_basis": null,
    "delivery_location": null,
    "price_basis": null
  },
  "payment_terms": {
    "advance_percent": null,
    "balance_percent": null,
    "payment_days": null,
    "payment_trigger": null,
    "payment_mode": null,
    "payment_through_bank": null
  },
  "ld_clause": {
    "ld_percent_per_week": null,
    "max_ld_percent": null,
    "grace_period_weeks": null
  },
  "warranty_months": null,
  "warranty_trigger": null,
  "quantity_variation_percent": null,
  "inspection_agency": null,
  "security_deposit_percent": null,
  "jurisdiction": null,
  "special_instructions": []
}`,


  ZINC_STATEMENT_IES: `This is a Zinc Statement (also called Zinc Account or Zinc Due Statement) maintained by India Electricals Syndicate. It tracks: materials sent to galvanizer, zinc consumed per dispatch, zinc ingots delivered to galvanizer, and the running zinc due balance. Extract ALL rows — do not skip any. Return JSON only.

{
  "document_type": "ZINC_STATEMENT_IES",
  "account_name": "INDIA ELECTRICALS SYNDICATE",
  "sheet_no": null,
  "period_from": null,
  "period_to": null,
  "previous_zinc_due_kgs": null,
  "transactions": [
    {
      "sl_no": null,
      "date": null,
      "description": null,
      "party_challan_no": null,
      "qty_nos": null,
      "weight_kgs": null,
      "zinc_percent": null,
      "zinc_consumed_kgs": null,
      "zinc_ingot_received_kgs": null,
      "transaction_type": null
    }
  ],
  "summary": {
    "total_weight_dispatched_kgs": null,
    "total_zinc_consumed_kgs": null,
    "total_zinc_received_kgs": null,
    "closing_zinc_due_kgs": null,
    "zinc_excess_kgs": null
  }
}

IMPORTANT FIELD NOTES:
- transaction_type values: "DISPATCH" (material sent for galvanizing), "ZINC_RECEIPT" (zinc ingots sent to galvanizer), "OPENING" (opening balance)
- zinc_percent: the percentage column showing how much zinc that material type uses (e.g. 9.60%, 6.20%)
- zinc_consumed_kgs = weight_kgs × zinc_percent/100
- zinc_ingot_received_kgs: only non-null on ZINC_RECEIPT rows
- closing_zinc_due_kgs: negative means galvanizer OWES zinc TO IES; positive means IES must send more zinc`,


  ZINC_LEDGER_GALVANIZER: `This is a monthly Zinc Consumption Register maintained by the galvanizing job worker (not IES). It has two sections: (1) Inward materials from IES + zinc consumed, (2) Dispatched finished goods + zinc balance summary. Extract ALL entries from both sections. Return JSON only.

{
  "document_type": "ZINC_LEDGER_GALVANIZER",
  "month": null,
  "year": null,
  "party_name": "INDIA ELECTRICALS SYNDICATE",
  "opening_zinc_cf_kgs": null,
  "inward_transactions": [
    {
      "sl_no": null,
      "date": null,
      "challan_no": null,
      "inward_qty_mts": null,
      "material_description": null,
      "thickness_mm": null,
      "zinc_consumption_per_mts_kgs": null,
      "gross_zinc_consumption_kgs": null
    }
  ],
  "outward_dispatches": [
    {
      "dispatch_doc_no": null,
      "despatch_qty_nos": null,
      "dispatch_date": null,
      "remarks": null
    }
  ],
  "totals": {
    "total_inward_qty_mts": null,
    "total_gross_zinc_consumed_kgs": null,
    "total_despatch_qty_nos": null
  },
  "zinc_account": {
    "opening_zinc_kgs": null,
    "zinc_ingots_received_kgs": null,
    "zinc_ingot_challan_no": null,
    "zinc_ingot_receipt_date": null,
    "total_zinc_available_kgs": null,
    "zinc_consumed_kgs": null,
    "balance_zinc_kgs": null
  }
}`,


  LABOUR_INVOICE: `This is a Labour or Job Work Invoice for galvanizing services rendered. Extract all data. Return JSON only.

{
  "document_type": "LABOUR_INVOICE",
  "invoice_no": null,
  "invoice_date": null,
  "job_work_doc_no": null,
  "period_from": null,
  "period_to": null,
  "galvanizer": {
    "name": null,
    "address": null,
    "gstin": null
  },
  "billed_to": {
    "name": "INDIA ELECTRICALS SYNDICATE",
    "gstin": "19AAAFI6886Q1ZE"
  },
  "line_items": [
    {
      "sl_no": null,
      "description": null,
      "dispatch_doc_no": null,
      "qty_nos": null,
      "weight_kgs": null,
      "rate_per_kg": null,
      "taxable_amount": null,
      "gst_rate": null,
      "gst_amount": null,
      "total_amount": null
    }
  ],
  "totals": {
    "sub_total_taxable": null,
    "total_cgst": null,
    "total_sgst": null,
    "total_igst": null,
    "invoice_total": null
  },
  "zinc_consumed_kgs": null,
  "zinc_returned_kgs": null
}`,


  AUTO_DETECT: `Examine this document carefully and determine which type it is. Then extract ALL data using the appropriate schema.

DOCUMENT TYPES:
1. TAX_INVOICE — Invoice issued by India Electricals Syndicate (seller). Has "IES/25-26/XXXX" invoice number. Has Bill To, Ship To, line items with price per unit, taxable amount, GST breakdown.
2. PURCHASE_ORDER — PO issued TO India Electricals Syndicate by a client. Has buyer's PO number. May reference GeM contract, SAP PO, or manual reference. Has line items with HSN, UOM, delivery dates.
3. ZINC_STATEMENT_IES — IES internal zinc tracking sheet. Columns: Date, Description, Party Challan No., Qty(Nos), Wt(Kgs), Zinc%, Zinc Consumed(Kgs), Zinc(Kgs), Zinc Due/Excess. Shows "Sheet No." and "Previous Zinc Due".
4. ZINC_LEDGER_GALVANIZER — Monthly Excel register. Has SL NO, Inward Qty(MTS), Zinc Consumption Per MTS, Gross Zinc Consumption, Dispatch Doc No, Despatch Quantity. Bottom section shows Opening Zinc C/F, Zinc Received, Zinc Consumed, Balance Zinc.
5. LABOUR_INVOICE — Galvanizer invoice for job work charges. Shows rate per kg for galvanizing service.

Set "document_type" to the matching value above, then extract ALL fields using the schema for that type. Return JSON only.`

};


// ──────────────────────────────────────────────
// MAIN EXTRACTION FUNCTION
// ──────────────────────────────────────────────
export async function extractDocumentWithClaude({
  fileBase64,
  mimeType,
  docTypeHint = "AUTO_DETECT"
}) {
  const userPrompt = EXTRACTION_PROMPTS[docTypeHint] || EXTRACTION_PROMPTS.AUTO_DETECT;

  // Build content array
  const contentArray = [];

  if (mimeType === "application/pdf") {
    contentArray.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: fileBase64 }
    });
  } else {
    // image/jpeg, image/png, image/webp
    contentArray.push({
      type: "image",
      source: { type: "base64", media_type: mimeType, data: fileBase64 }
    });
  }

  contentArray.push({
    type: "text",
    text: userPrompt
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: MASTER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentArray }]
    })
  });

  const data = await response.json();
  const rawText = data.content?.[0]?.text || "";

  // Clean and parse
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Post-process: run validation
    const validation = validateExtractedData(parsed);

    return {
      success: true,
      document_type: parsed.document_type,
      data: parsed,
      validation,
      raw_text: rawText
    };
  } catch (e) {
    return {
      success: false,
      error: "JSON parse failed: " + e.message,
      raw_text: rawText
    };
  }
}


// ──────────────────────────────────────────────
// VALIDATION ENGINE
// ──────────────────────────────────────────────
export function validateExtractedData(data) {
  const warnings = [];
  const errors = [];

  if (!data || !data.document_type) {
    errors.push("document_type missing");
    return { valid: false, errors, warnings };
  }

  if (data.document_type === "TAX_INVOICE") {
    // Check invoice total arithmetic
    if (data.totals?.sub_total_taxable != null && data.totals?.total_gst != null) {
      const computed = (data.totals.sub_total_taxable + data.totals.total_gst + (data.totals.round_off || 0));
      const stated = data.totals.invoice_total;
      if (stated != null && Math.abs(computed - stated) > 1) {
        warnings.push(`Invoice total mismatch: computed ₹${computed.toFixed(2)}, stated ₹${stated}`);
      }
    }

    // Check GST type consistency
    if (data.supply_type === "intra_state" && data.totals?.total_igst) {
      errors.push("Intra-state invoice has IGST — check supply type");
    }
    if (data.supply_type === "inter_state" && (data.totals?.total_cgst || data.totals?.total_sgst)) {
      errors.push("Inter-state invoice has CGST/SGST — check supply type");
    }

    // Check line item sum
    if (data.line_items?.length) {
      const lineSum = data.line_items.reduce((s, li) => s + (li.taxable_amount || 0), 0);
      if (data.totals?.sub_total_taxable && Math.abs(lineSum - data.totals.sub_total_taxable) > 1) {
        warnings.push(`Line items taxable sum ₹${lineSum.toFixed(2)} ≠ stated taxable ₹${data.totals.sub_total_taxable}`);
      }
    }
  }

  if (data.document_type === "ZINC_STATEMENT_IES") {
    // Validate closing balance
    if (
      data.previous_zinc_due_kgs != null &&
      data.summary?.total_zinc_consumed_kgs != null &&
      data.summary?.total_zinc_received_kgs != null &&
      data.summary?.closing_zinc_due_kgs != null
    ) {
      const computed = data.previous_zinc_due_kgs
        - data.summary.total_zinc_received_kgs
        + data.summary.total_zinc_consumed_kgs;
      const diff = Math.abs(computed - data.summary.closing_zinc_due_kgs);
      if (diff > 0.5) {
        warnings.push(`Zinc balance mismatch: computed ${computed.toFixed(3)} kg, stated ${data.summary.closing_zinc_due_kgs} kg`);
      }
    }
  }

  if (data.document_type === "PURCHASE_ORDER") {
    if (!data.po_number) errors.push("PO number missing");
    if (!data.po_date) errors.push("PO date missing");
    if (!data.line_items?.length) errors.push("No line items extracted");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}


// ──────────────────────────────────────────────
// ZINC BALANCE CALCULATOR
// ──────────────────────────────────────────────
export function computeZincRunningBalance(sheets) {
  // sheets: array of ZINC_STATEMENT_IES objects, sorted by period_from
  let runningDue = 0;

  return sheets.map((sheet) => {
    const consumed = sheet.summary?.total_zinc_consumed_kgs || 0;
    const received = sheet.summary?.total_zinc_received_kgs || 0;

    runningDue = runningDue - received + consumed;

    return {
      sheet_no: sheet.sheet_no,
      period: `${sheet.period_from} to ${sheet.period_to}`,
      zinc_consumed: consumed,
      zinc_received: received,
      closing_due: runningDue,
      status: runningDue < 0
        ? `Galvanizer owes IES ${Math.abs(runningDue).toFixed(3)} kg`
        : `IES must send ${runningDue.toFixed(3)} kg more`
    };
  });
}


// ──────────────────────────────────────────────
// PO FULFILMENT TRACKER
// ──────────────────────────────────────────────
export function trackPOFulfilment(po, linkedInvoices = []) {
  const items = po.line_items?.map((item) => {
    const invoicedQty = linkedInvoices
      .flatMap((inv) => inv.line_items || [])
      .filter((li) =>
        li.hsn_sac === item.hsn_code ||
        (li.description || "").toLowerCase().includes((item.description || "").toLowerCase().slice(0, 25))
      )
      .reduce((sum, li) => sum + (li.quantity || 0), 0);

    const pending = Math.max(0, (item.quantity || 0) - invoicedQty);
    const pct = item.quantity ? Math.min(100, (invoicedQty / item.quantity) * 100) : 0;

    return {
      item_no: item.item_no,
      description: item.description,
      uom: item.uom,
      ordered: item.quantity,
      invoiced: invoicedQty,
      pending,
      pending_value: pending * (item.unit_price || 0),
      completion_pct: pct.toFixed(1),
      status: pending <= 0 ? "COMPLETE" : invoicedQty > 0 ? "PARTIAL" : "PENDING"
    };
  }) || [];

  const overallPct = items.length
    ? items.reduce((s, i) => s + parseFloat(i.completion_pct), 0) / items.length
    : 0;

  return {
    po_number: po.po_number,
    buyer: po.buyer?.organization_name,
    items,
    overall_pct: overallPct.toFixed(1),
    overall_status:
      items.every((i) => i.status === "COMPLETE") ? "COMPLETE" :
      items.some((i) => i.status !== "PENDING") ? "PARTIAL" : "PENDING"
  };
}


// ──────────────────────────────────────────────
// ZINC PERCENT LOOKUP TABLE
// (based on actual data from IES zinc statements)
// ──────────────────────────────────────────────
export const ZINC_PERCENT_LOOKUP = {
  "MS Ladder Tray 600mm": 9.60,
  "MS Ladder Tray 300mm": 9.60,
  "MS Ladder Tray 150mm": 9.60,
  "MS Coupler Plate 10Swg": 6.20,
  "MS Coupler Plate 14Swg": 6.20,
  "MS Coupler Plate 145swg": 6.20,
  "MS Coupler Plate loose": 6.20,
  "MS Cable Tray with Acc": 9.60,
  "Ladder Tray 300mm": 9.00,
  "Ladder Tray 600mm": 9.00,
  "MS Flat Channel Angle 600x300x150": 9.60,
  "MS Vertical PCT 150mm": 9.60,
  "MS V Accs 300mm": 9.60,
  "Earthing Pipe": 7.00,
  "Clamp": 6.50,
  "Side Plate Cover 3mm": 6.70,
  "Side Middle Plate 2.8mm": 6.70,
  "Cover 2.2mm": 10.00,
  "Flat 50x6mm": 3.80,
  "Flat 75x10mm": 3.25,
  "MS Pipe": 7.50,
  "Zinc Ingot": 0,
  "100mm Perforated Cable Tray": 9.00,
  "Ladder Type Cable Tray 2.8mm": 6.70,
  "Ladder Type Cable Tray 3mm": 9.00
};

export function estimateZincConsumption(description, weightKgs) {
  const key = Object.keys(ZINC_PERCENT_LOOKUP).find(k =>
    description?.toLowerCase().includes(k.toLowerCase().split(" ").slice(0, 3).join(" "))
  );
  const pct = key ? ZINC_PERCENT_LOOKUP[key] : null;
  return pct != null ? { zinc_pct: pct, zinc_kgs: (weightKgs * pct / 100).toFixed(3) } : null;
}