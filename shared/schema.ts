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
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  vendorType: text("vendor_type").notNull().default("supplier"),
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
  supplyType: text("supply_type"),
  irnNumber: text("irn_number"),
  isEInvoice: boolean("is_e_invoice").default(false),
  status: text("status").notNull().default("pending"),
  lineItems: jsonb("line_items"),
  rawData: jsonb("raw_data"),
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
