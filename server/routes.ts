import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertVendorSchema,
  insertPurchaseInvoiceSchema,
  insertSalesInvoiceSchema,
  insertPurchaseOrderSchema,
  insertJobWorkEntrySchema,
  insertLabourInvoiceSchema,
  insertReconciliationRecordSchema,
} from "@shared/schema";

const MASTER_SYSTEM_PROMPT = `You are a precision document data extraction engine for India Electricals Syndicate (IES), GSTIN 19AAAFI6886Q1ZE, a manufacturer of Hot Dip Galvanised Steel Cable Trays, Coupler Plates, and accessories based in Kolkata, West Bengal.

You extract structured JSON from Tax Invoices, Purchase Orders, Zinc Consumption Statements, Zinc Ledgers, and Labour invoices.

ABSOLUTE RULES — NEVER VIOLATE:
1. Extract EVERY visible field. Do not omit, summarize, paraphrase, or merge fields.
2. Numeric values: preserve exact digits including all decimals. Never round. Never approximate.
3. Dates: ISO 8601 format only — YYYY-MM-DD. If only month+year visible, use YYYY-MM-01.
4. Currency: numeric value only, no ₹ symbol, always INR. E.g. 399725 not 3,99,725.
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

const EXTRACTION_PROMPTS: Record<string, string> = {
  TAX_INVOICE: `This document is a Tax Invoice issued BY India Electricals Syndicate. Extract all data into this exact JSON schema. Return JSON only.

{"document_type":"TAX_INVOICE","invoice_no":null,"invoice_date":null,"financial_year":null,"e_way_bill_no":null,"place_of_supply_state":null,"supply_type":null,"po_number":null,"seller":{"name":null,"gstin":null,"bank_account_no":null,"bank_ifsc":null},"bill_to":{"company_name":null,"address_line1":null,"city":null,"state":null,"state_code":null,"pincode":null,"gstin":null},"ship_to":{"company_name":null,"site_name":null,"address_line1":null,"city":null,"state":null,"pincode":null},"line_items":[{"sl_no":1,"description":null,"hsn_sac":null,"quantity":null,"unit":null,"price_per_unit":null,"taxable_amount":null,"cgst_rate":null,"cgst_amount":null,"sgst_rate":null,"sgst_amount":null,"igst_rate":null,"igst_amount":null,"total_amount":null}],"totals":{"sub_total_taxable":null,"total_cgst":null,"total_sgst":null,"total_igst":null,"total_gst":null,"round_off":null,"invoice_total":null,"amount_in_words":null},"irn_number":null,"is_e_invoice":null,"reverse_charge_applicable":false}`,

  PURCHASE_ORDER: `This document is a Purchase Order addressed TO India Electricals Syndicate from a client/buyer. Extract all data. Return JSON only.

{"document_type":"PURCHASE_ORDER","po_number":null,"po_date":null,"amendment_no":null,"gem_contract_no":null,"buyer":{"organization_name":null,"plant_name":null,"address_line1":null,"city":null,"state":null,"pincode":null,"gstin":null,"contact_person":null,"contact_email":null,"contact_phone":null},"line_items":[{"item_no":null,"description":null,"hsn_code":null,"quantity":null,"uom":null,"unit_price":null,"tax_type":null,"tax_rate_percent":null,"total_amount_excl_tax":null,"total_amount_incl_tax":null,"delivery_date":null}],"totals":{"basic_price_ex_works":null,"packing_forwarding":null,"freight":null,"igst_rate":null,"igst_amount":null,"cgst_rate":null,"cgst_amount":null,"grand_total":null,"amount_in_words":null},"delivery":{"delivery_period_days":null,"delivery_basis":null,"delivery_location":null},"payment_terms":{"advance_percent":null,"balance_percent":null,"payment_days":null},"warranty_months":null}`,

  ZINC_STATEMENT_IES: `This is a Zinc Statement maintained by India Electricals Syndicate. Extract ALL rows. Return JSON only.

{"document_type":"ZINC_STATEMENT_IES","account_name":"INDIA ELECTRICALS SYNDICATE","sheet_no":null,"period_from":null,"period_to":null,"previous_zinc_due_kgs":null,"transactions":[{"sl_no":null,"date":null,"description":null,"party_challan_no":null,"qty_nos":null,"weight_kgs":null,"zinc_percent":null,"zinc_consumed_kgs":null,"zinc_ingot_received_kgs":null,"transaction_type":null}],"summary":{"total_weight_dispatched_kgs":null,"total_zinc_consumed_kgs":null,"total_zinc_received_kgs":null,"closing_zinc_due_kgs":null,"zinc_excess_kgs":null}}

transaction_type: DISPATCH, ZINC_RECEIPT, or OPENING. zinc_consumed_kgs = weight_kgs x zinc_percent/100.`,

  ZINC_LEDGER_GALVANIZER: `This is a monthly Zinc Consumption Register by the galvanizer. Extract ALL entries from both sections. Return JSON only.

{"document_type":"ZINC_LEDGER_GALVANIZER","month":null,"year":null,"party_name":"INDIA ELECTRICALS SYNDICATE","opening_zinc_cf_kgs":null,"inward_transactions":[{"sl_no":null,"date":null,"challan_no":null,"inward_qty_mts":null,"material_description":null,"zinc_consumption_per_mts_kgs":null,"gross_zinc_consumption_kgs":null}],"outward_dispatches":[{"dispatch_doc_no":null,"despatch_qty_nos":null,"dispatch_date":null,"remarks":null}],"totals":{"total_inward_qty_mts":null,"total_gross_zinc_consumed_kgs":null,"total_despatch_qty_nos":null},"zinc_account":{"opening_zinc_kgs":null,"zinc_ingots_received_kgs":null,"total_zinc_available_kgs":null,"zinc_consumed_kgs":null,"balance_zinc_kgs":null}}`,

  LABOUR_INVOICE: `This is a Labour/Job Work Invoice for galvanizing services. Extract all data. Return JSON only.

{"document_type":"LABOUR_INVOICE","invoice_no":null,"invoice_date":null,"job_work_doc_no":null,"period_from":null,"period_to":null,"galvanizer":{"name":null,"address":null,"gstin":null},"billed_to":{"name":"INDIA ELECTRICALS SYNDICATE","gstin":"19AAAFI6886Q1ZE"},"line_items":[{"sl_no":null,"description":null,"dispatch_doc_no":null,"qty_nos":null,"weight_kgs":null,"rate_per_kg":null,"taxable_amount":null,"gst_rate":null,"gst_amount":null,"total_amount":null}],"totals":{"sub_total_taxable":null,"total_cgst":null,"total_sgst":null,"total_igst":null,"invoice_total":null},"zinc_consumed_kgs":null,"zinc_returned_kgs":null}`,

  AUTO_DETECT: `Examine this document carefully and determine its type, then extract ALL data using the appropriate schema.

DOCUMENT TYPES:
1. TAX_INVOICE - Invoice issued by India Electricals Syndicate. Has "IES/25-26/XXXX" invoice number.
2. PURCHASE_ORDER - PO issued TO India Electricals Syndicate by a client. Has buyer's PO number.
3. ZINC_STATEMENT_IES - IES internal zinc tracking. Columns: Wt(Kgs), Zinc%, Zinc Consumed(Kgs), Zinc(Kgs).
4. ZINC_LEDGER_GALVANIZER - Monthly register with Inward Qty(MTS), Zinc Consumption Per MTS.
5. LABOUR_INVOICE - Galvanizer invoice showing rate per kg for galvanizing service.

Set "document_type" to one of the above values. Return JSON only.`,
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── OCR Extract via Claude API (secure server-side proxy) ─────
  app.post("/api/extract", async (req, res) => {
    try {
      const { fileBase64, mimeType, docTypeHint = "AUTO_DETECT" } = req.body;
      if (!fileBase64 || !mimeType) {
        return res.status(400).json({ error: "fileBase64 and mimeType are required" });
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
      }

      const userPrompt = EXTRACTION_PROMPTS[docTypeHint] || EXTRACTION_PROMPTS.AUTO_DETECT;
      const contentArray: any[] = [];

      if (mimeType === "application/pdf") {
        contentArray.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } });
      } else {
        contentArray.push({ type: "image", source: { type: "base64", media_type: mimeType, data: fileBase64 } });
      }
      contentArray.push({ type: "text", text: userPrompt });

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 4096,
          system: MASTER_SYSTEM_PROMPT,
          messages: [{ role: "user", content: contentArray }],
        }),
      });

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        console.error("Claude API error:", errText);
        return res.status(502).json({ error: "Claude API error", detail: errText });
      }

      const claudeData = await claudeRes.json() as any;
      const rawText = claudeData.content?.[0]?.text || "";

      const cleaned = rawText
        .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        return res.json({ success: true, document_type: parsed.document_type, data: parsed, raw_text: rawText });
      } catch {
        return res.json({ success: false, error: "JSON parse failed", raw_text: rawText });
      }
    } catch (err: any) {
      console.error("Extract error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ─── Vendors ───────────────────────────────────────────────────
  app.get("/api/vendors", async (req, res) => {
    const type = req.query.type as string | undefined;
    res.json(await storage.listVendors(type));
  });
  app.get("/api/vendors/:id", async (req, res) => {
    const v = await storage.getVendor(req.params.id);
    if (!v) return res.status(404).json({ error: "Vendor not found" });
    res.json(v);
  });
  app.post("/api/vendors", async (req, res) => {
    const parsed = insertVendorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createVendor(parsed.data));
  });
  app.patch("/api/vendors/:id", async (req, res) => {
    const v = await storage.updateVendor(req.params.id, req.body);
    if (!v) return res.status(404).json({ error: "Vendor not found" });
    res.json(v);
  });
  app.delete("/api/vendors/:id", async (req, res) => {
    await storage.deleteVendor(req.params.id);
    res.status(204).send();
  });

  // ─── Purchase Invoices ──────────────────────────────────────────
  app.get("/api/purchase-invoices", async (_req, res) => {
    res.json(await storage.listPurchaseInvoices());
  });
  app.get("/api/purchase-invoices/:id", async (req, res) => {
    const inv = await storage.getPurchaseInvoice(req.params.id);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  });
  app.post("/api/purchase-invoices", async (req, res) => {
    const parsed = insertPurchaseInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createPurchaseInvoice(parsed.data));
  });
  app.patch("/api/purchase-invoices/:id", async (req, res) => {
    const inv = await storage.updatePurchaseInvoice(req.params.id, req.body);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  });
  app.delete("/api/purchase-invoices/:id", async (req, res) => {
    await storage.deletePurchaseInvoice(req.params.id);
    res.status(204).send();
  });

  // ─── Sales Invoices ─────────────────────────────────────────────
  app.get("/api/sales-invoices", async (_req, res) => {
    res.json(await storage.listSalesInvoices());
  });
  app.get("/api/sales-invoices/:id", async (req, res) => {
    const inv = await storage.getSalesInvoice(req.params.id);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  });
  app.post("/api/sales-invoices", async (req, res) => {
    const parsed = insertSalesInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createSalesInvoice(parsed.data));
  });
  app.patch("/api/sales-invoices/:id", async (req, res) => {
    const inv = await storage.updateSalesInvoice(req.params.id, req.body);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  });
  app.delete("/api/sales-invoices/:id", async (req, res) => {
    await storage.deleteSalesInvoice(req.params.id);
    res.status(204).send();
  });

  // ─── Purchase Orders ────────────────────────────────────────────
  app.get("/api/purchase-orders", async (_req, res) => {
    res.json(await storage.listPurchaseOrders());
  });
  app.get("/api/purchase-orders/:id", async (req, res) => {
    const po = await storage.getPurchaseOrder(req.params.id);
    if (!po) return res.status(404).json({ error: "PO not found" });
    res.json(po);
  });
  app.post("/api/purchase-orders", async (req, res) => {
    const parsed = insertPurchaseOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createPurchaseOrder(parsed.data));
  });
  app.patch("/api/purchase-orders/:id", async (req, res) => {
    const po = await storage.updatePurchaseOrder(req.params.id, req.body);
    if (!po) return res.status(404).json({ error: "PO not found" });
    res.json(po);
  });
  app.delete("/api/purchase-orders/:id", async (req, res) => {
    await storage.deletePurchaseOrder(req.params.id);
    res.status(204).send();
  });

  // ─── Job Work (Zinc) ────────────────────────────────────────────
  app.get("/api/job-work", async (_req, res) => {
    res.json(await storage.listJobWorkEntries());
  });
  app.get("/api/job-work/:id", async (req, res) => {
    const e = await storage.getJobWorkEntry(req.params.id);
    if (!e) return res.status(404).json({ error: "Entry not found" });
    res.json(e);
  });
  app.post("/api/job-work", async (req, res) => {
    const parsed = insertJobWorkEntrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createJobWorkEntry(parsed.data));
  });
  app.patch("/api/job-work/:id", async (req, res) => {
    const e = await storage.updateJobWorkEntry(req.params.id, req.body);
    if (!e) return res.status(404).json({ error: "Entry not found" });
    res.json(e);
  });
  app.delete("/api/job-work/:id", async (req, res) => {
    await storage.deleteJobWorkEntry(req.params.id);
    res.status(204).send();
  });

  // ─── Labour Invoices ────────────────────────────────────────────
  app.get("/api/labour-invoices", async (_req, res) => {
    res.json(await storage.listLabourInvoices());
  });
  app.get("/api/labour-invoices/:id", async (req, res) => {
    const inv = await storage.getLabourInvoice(req.params.id);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  });
  app.post("/api/labour-invoices", async (req, res) => {
    const parsed = insertLabourInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createLabourInvoice(parsed.data));
  });
  app.patch("/api/labour-invoices/:id", async (req, res) => {
    const inv = await storage.updateLabourInvoice(req.params.id, req.body);
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  });
  app.delete("/api/labour-invoices/:id", async (req, res) => {
    await storage.deleteLabourInvoice(req.params.id);
    res.status(204).send();
  });

  // ─── Reconciliation ─────────────────────────────────────────────
  app.get("/api/reconciliation", async (req, res) => {
    const period = req.query.period as string | undefined;
    res.json(await storage.listReconciliationRecords(period));
  });
  app.post("/api/reconciliation", async (req, res) => {
    const parsed = insertReconciliationRecordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    res.status(201).json(await storage.createReconciliationRecord(parsed.data));
  });
  app.patch("/api/reconciliation/:id", async (req, res) => {
    const r = await storage.updateReconciliationRecord(req.params.id, req.body);
    if (!r) return res.status(404).json({ error: "Record not found" });
    res.json(r);
  });

  // ─── Dashboard Summary ──────────────────────────────────────────
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const [purchInvoices, salesInvs, pos, jobWork, labourInvs] = await Promise.all([
        storage.listPurchaseInvoices(),
        storage.listSalesInvoices(),
        storage.listPurchaseOrders(),
        storage.listJobWorkEntries(),
        storage.listLabourInvoices(),
      ]);

      const totalPurchase = purchInvoices.reduce((s, i) => s + parseFloat(i.invoiceTotal || "0"), 0);
      const totalSales = salesInvs.reduce((s, i) => s + parseFloat(i.invoiceTotal || "0"), 0);
      const pendingPurchase = purchInvoices.filter(i => i.status === "pending").length;
      const needsReview = purchInvoices.filter(i => i.status === "needs_review").length;
      const openPOs = pos.filter(p => p.status === "open" || p.status === "partial").length;
      const totalZincDue = jobWork.reduce((s, j) => s + parseFloat(j.closingZincDueKg || "0"), 0);

      res.json({
        purchases: { total: totalPurchase, count: purchInvoices.length, pending: pendingPurchase, needsReview },
        sales: { total: totalSales, count: salesInvs.length },
        purchaseOrders: { count: pos.length, open: openPOs },
        jobWork: { entries: jobWork.length, zincDueKg: totalZincDue },
        labourInvoices: { count: labourInvs.length },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
