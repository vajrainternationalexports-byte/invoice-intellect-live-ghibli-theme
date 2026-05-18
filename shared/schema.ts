import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Vendors ───────────────────────────────────────────────────
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  gstin: text("gstin"),
  pan: text("pan"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  stateCode: text("state_code"),
  pincode: text("pincode"),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  vendorType: text("vendor_type").notNull().default("supplier"), // supplier, galvanizer, transporter
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// ─── Purchase Invoices ──────────────────────────────────────────
export const purchaseInvoices = pgTable("purchase_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNo: text("invoice_no").notNull(),
  invoiceDate: text("invoice_date").notNull(),
  financialYear: text("financial_year"),
  vendorId: varchar("vendor_id"),
  vendorName: text("vendor_name"),
  vendorGstin: text("vendor_gstin"),
  taxableAmount: numeric("taxable_amount", { precision: 14, scale: 2 }),
  totalGst: numeric("total_gst", { precision: 14, scale: 2 }),
  invoiceTotal: numeric("invoice_total", { precision: 14, scale: 2 }),
  cgstAmount: numeric("cgst_amount", { precision: 14, scale: 2 }),
  sgstAmount: numeric("sgst_amount", { precision: 14, scale: 2 }),
  igstAmount: numeric("igst_amount", { precision: 14, scale: 2 }),
  utgstAmount: numeric("utgst_amount", { precision: 14, scale: 2 }),
  cessAmount: numeric("cess_amount", { precision: 14, scale: 2 }),
  supplyType: text("supply_type"), // Intrastate, Interstate, Import, SEZ, RCM Purchases
  irnNumber: text("irn_number"),
  isEInvoice: boolean("is_e_invoice").default(false),
  status: text("status").notNull().default("pending"), // pending, needs_review, approved, processed (paid), partial, disputed, hold
  lineItems: jsonb("line_items"), // Array of { item, qty, unit, hsn, rate, discount, taxableValue, sgstRate, sgstAmount, cgstRate, cgstAmount, igstRate, igstAmount, total, batchNo, serialNo, weight, warehouse, project, costCenter }
  rawData: jsonb("raw_data"),
  
  // Enterprise Procurement Additions
  dueDate: text("due_date"),
  acknowledgementStatus: text("acknowledgement_status").default("pending"), // pending, acknowledged, rejected
  uploadedBy: text("uploaded_by").default("System"),
  ocrConfidence: integer("ocr_confidence").default(100),
  tcsApplicable: boolean("tcs_applicable").default(false),
  paymentMode: text("payment_mode").default("NEFT"), // NEFT, RTGS, IMPS, UPI, Cheque
  grnStatus: text("grn_status").default("pending_receipt"), // pending_receipt, partially_received, fully_received, damaged, rejected
  branchLocation: text("branch_location").default("Kolkata Works W1"),
  pendingDays: integer("pending_days").default(0),
  
  // TDS/TCS Breakdown
  tdsDeducted: numeric("tds_deducted", { precision: 14, scale: 2 }).default("0.00"),
  tcsCollected: numeric("tcs_collected", { precision: 14, scale: 2 }).default("0.00"),
  disputeReason: text("dispute_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseInvoiceSchema = createInsertSchema(purchaseInvoices).omit({ id: true, createdAt: true });
export type InsertPurchaseInvoice = z.infer<typeof insertPurchaseInvoiceSchema>;
export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;

// ─── Sales Invoices ─────────────────────────────────────────────
export const salesInvoices = pgTable("sales_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNo: text("invoice_no").notNull(),
  invoiceDate: text("invoice_date").notNull(),
  financialYear: text("financial_year"),
  customerId: varchar("customer_id"),
  customerName: text("customer_name"),
  customerGstin: text("customer_gstin"),
  taxableAmount: numeric("taxable_amount", { precision: 14, scale: 2 }),
  totalGst: numeric("total_gst", { precision: 14, scale: 2 }),
  invoiceTotal: numeric("invoice_total", { precision: 14, scale: 2 }),
  cgstAmount: numeric("cgst_amount", { precision: 14, scale: 2 }),
  sgstAmount: numeric("sgst_amount", { precision: 14, scale: 2 }),
  igstAmount: numeric("igst_amount", { precision: 14, scale: 2 }),
  supplyType: text("supply_type"),
  irnNumber: text("irn_number"),
  isEInvoice: boolean("is_e_invoice").default(false),
  poReference: text("po_reference"),
  status: text("status").notNull().default("pending"),
  lineItems: jsonb("line_items"),
  rawData: jsonb("raw_data"),

  // Enterprise Sales Additions
  dueDate: text("due_date"),
  acknowledgementStatus: text("acknowledgement_status").default("pending"),
  uploadedBy: text("uploaded_by").default("System"),
  ocrConfidence: integer("ocr_confidence").default(100),
  tcsApplicable: boolean("tcs_applicable").default(false),
  paymentMode: text("payment_mode").default("NEFT"),
  dispatchStatus: text("dispatch_status").default("pending_dispatch"), // pending_dispatch, partially_dispatched, fully_dispatched, returned
  branchLocation: text("branch_location").default("Kolkata Works W1"),
  pendingDays: integer("pending_days").default(0),
  tcsCollected: numeric("tcs_collected", { precision: 14, scale: 2 }).default("0.00"),
  disputeReason: text("dispute_reason"),

  // Pending Payments Spreadsheet Heads
  slNo: text("sl_no"),
  poNumber: text("po_number"),
  project: text("project"),
  amountIncGst: numeric("amount_inc_gst", { precision: 14, scale: 2 }).default("0.00"),
  duePayment: numeric("due_payment", { precision: 14, scale: 2 }).default("0.00"),
  amountInBank: numeric("amount_in_bank", { precision: 14, scale: 2 }).default("0.00"),
  balance: numeric("balance", { precision: 14, scale: 2 }).default("0.00"),
  dateAsOn: text("date_as_on"),
  instRxilCharges: numeric("inst_rxil_charges", { precision: 14, scale: 2 }).default("0.00"),
  balanceShortage: numeric("balance_shortage", { precision: 14, scale: 2 }).default("0.00"),
  orderStatus: text("order_status").default("RUNNING"), // CLOSED, RUNNING, COMPLETE

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSalesInvoiceSchema = createInsertSchema(salesInvoices).omit({ id: true, createdAt: true });
export type InsertSalesInvoice = z.infer<typeof insertSalesInvoiceSchema>;
export type SalesInvoice = typeof salesInvoices.$inferSelect;

// ─── Purchase Orders ────────────────────────────────────────────
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: text("po_number").notNull(),
  poDate: text("po_date"),
  buyerName: text("buyer_name"),
  buyerGstin: text("buyer_gstin"),
  gemContractNo: text("gem_contract_no"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }),
  orderedQty: numeric("ordered_qty", { precision: 14, scale: 3 }),
  receivedQty: numeric("received_qty", { precision: 14, scale: 3 }).default("0"),
  deliveryPeriodDays: integer("delivery_period_days"),
  status: text("status").notNull().default("open"),
  lineItems: jsonb("line_items"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true });
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// ─── Job Work Entries (Zinc Statements) ─────────────────────────
export const jobWorkEntries = pgTable("job_work_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  galvanizerName: text("galvanizer_name"),
  period: text("period"),
  periodFrom: text("period_from"),
  periodTo: text("period_to"),
  totalWeightKg: numeric("total_weight_kg", { precision: 14, scale: 3 }),
  totalZincConsumedKg: numeric("total_zinc_consumed_kg", { precision: 14, scale: 3 }),
  totalZincReceivedKg: numeric("total_zinc_received_kg", { precision: 14, scale: 3 }),
  closingZincDueKg: numeric("closing_zinc_due_kg", { precision: 14, scale: 3 }),
  transactions: jsonb("transactions"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobWorkEntrySchema = createInsertSchema(jobWorkEntries).omit({ id: true, createdAt: true });
export type InsertJobWorkEntry = z.infer<typeof insertJobWorkEntrySchema>;
export type JobWorkEntry = typeof jobWorkEntries.$inferSelect;

// ─── Labour Invoices ────────────────────────────────────────────
export const labourInvoices = pgTable("labour_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNo: text("invoice_no").notNull(),
  invoiceDate: text("invoice_date"),
  galvanizerName: text("galvanizer_name"),
  galvanizerGstin: text("galvanizer_gstin"),
  jobWorkDocNo: text("job_work_doc_no"),
  periodFrom: text("period_from"),
  periodTo: text("period_to"),
  taxableAmount: numeric("taxable_amount", { precision: 14, scale: 2 }),
  totalGst: numeric("total_gst", { precision: 14, scale: 2 }),
  invoiceTotal: numeric("invoice_total", { precision: 14, scale: 2 }),
  tdsAmount: numeric("tds_amount", { precision: 14, scale: 2 }),
  netPayable: numeric("net_payable", { precision: 14, scale: 2 }),
  zincConsumedKg: numeric("zinc_consumed_kg", { precision: 14, scale: 3 }),
  status: text("status").notNull().default("pending"),
  lineItems: jsonb("line_items"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLabourInvoiceSchema = createInsertSchema(labourInvoices).omit({ id: true, createdAt: true });
export type InsertLabourInvoice = z.infer<typeof insertLabourInvoiceSchema>;
export type LabourInvoice = typeof labourInvoices.$inferSelect;

// ─── Reconciliation Records ─────────────────────────────────────
export const reconciliationRecords = pgTable("reconciliation_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: text("period").notNull(),
  gstin: text("gstin").notNull(),
  partyName: text("party_name"),
  our2BAmount: numeric("our_2b_amount", { precision: 14, scale: 2 }),
  gstr2BAmount: numeric("gstr2b_amount", { precision: 14, scale: 2 }),
  difference: numeric("difference", { precision: 14, scale: 2 }),
  status: text("status").notNull().default("pending"),
  invoiceRef: text("invoice_ref"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReconciliationRecordSchema = createInsertSchema(reconciliationRecords).omit({ id: true, createdAt: true });
export type InsertReconciliationRecord = z.infer<typeof insertReconciliationRecordSchema>;
export type ReconciliationRecord = typeof reconciliationRecords.$inferSelect;

// ─── TDS/TCS Tax Rules (Configurable rules per FY) ───────────────
export const tdsTcsRules = pgTable("tds_tcs_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleName: text("rule_name").notNull(),
  section: text("section").notNull(), // "194Q", "206C(1H)"
  thresholdAmount: numeric("threshold_amount", { precision: 14, scale: 2 }).notNull(), // e.g. 5000000.00
  rate: numeric("rate", { precision: 6, scale: 4 }).notNull(), // e.g. 0.0010 (0.1%)
  rateNoPan: numeric("rate_no_pan", { precision: 6, scale: 4 }).notNull(), // e.g. 0.0200 (2.0%)
  effectiveDate: text("effective_date").notNull(),
  applicableVendorType: text("applicable_vendor_type").default("all"),
  gstTreatment: text("gst_treatment").default("exclude"), // exclude, include
  panRequired: boolean("pan_required").default(true),
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTdsTcsRuleSchema = createInsertSchema(tdsTcsRules).omit({ id: true, createdAt: true });
export type TdsTcsRule = typeof tdsTcsRules.$inferSelect;

// ─── Vendor Bank Accounts ──────────────────────────────────────────
export const vendorBankAccounts = pgTable("vendor_bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(), // Secure encrypted string
  ifscCode: text("ifsc_code").notNull(),
  bankName: text("bank_name").notNull(),
  branchName: text("branch_name"),
  upiId: text("upi_id"),
  cancelledChequeUrl: text("cancelled_cheque_url"),
  verificationStatus: text("verification_status").notNull().default("unverified"), // unverified, penny_drop_verified, manual_verified
  pennyDropRef: text("penny_drop_ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVendorBankAccountSchema = createInsertSchema(vendorBankAccounts).omit({ id: true, createdAt: true });
export type VendorBankAccount = typeof vendorBankAccounts.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentDate: text("payment_date").notNull(),
  vendorId: varchar("vendor_id"),
  vendorName: text("vendor_name").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  utrNumber: text("utr_number").notNull(),
  bankReference: text("bank_reference"),
  paymentMethod: text("payment_method").notNull().default("NEFT"), // NEFT, RTGS, IMPS, UPI
  tdsDeducted: numeric("tds_deducted", { precision: 14, scale: 2 }).default("0.00"),
  status: text("status").notNull().default("success"), // success, pending, failed, reversed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export type Payment = typeof payments.$inferSelect;

// ─── Payment Invoice Mapping (Many-to-Many Ledger allocation) ──
export const paymentInvoiceMap = pgTable("payment_invoice_map", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: varchar("payment_id").notNull(),
  invoiceId: varchar("invoice_id").notNull(),
  amountAllocated: numeric("amount_allocated", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── OCR Logs (Auditing & manual correction tracking) ───────────
export const ocrLogs = pgTable("ocr_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename"),
  docType: text("doc_type").notNull(), // TAX_INVOICE, LABOUR_INVOICE, etc.
  rawText: text("raw_text"),
  extractedJson: jsonb("extracted_json"),
  confidenceScore: integer("confidence_score").default(100),
  verificationStatus: text("verification_status").default("auto_approved"), // auto_approved, warning_confirmed, manual_corrected
  correctedFields: jsonb("corrected_fields"), // Record of { fieldPath: { original, corrected } }
  userId: text("user_id").default("System"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Approval Logs (Maker-Checker Workflow history) ─────────────
export const approvalLogs = pgTable("approval_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentType: text("document_type").notNull(), // purchase_invoice, payment, etc.
  documentId: varchar("document_id").notNull(),
  action: text("action").notNull(), // submit, approve, reject, hold, dispute
  actor: text("actor").notNull(), // username
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Audit Logs (Immutable security logs) ────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actionType: text("action_type").notNull(), // CREATE, UPDATE, DELETE, VIEW_SECURE_DATA, BANK_EXECUTE
  entityName: text("entity_name").notNull(), // purchase_invoices, vendor_bank_accounts, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details").notNull(), // details of what changed or what was viewed
  actor: text("actor").notNull(), // username or IP
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OcrLog = typeof ocrLogs.$inferSelect;
export type ApprovalLog = typeof approvalLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

