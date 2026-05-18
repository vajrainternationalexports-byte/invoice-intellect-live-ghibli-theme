import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import {
  users, vendors, purchaseInvoices, salesInvoices, purchaseOrders,
  jobWorkEntries, labourInvoices, reconciliationRecords,
  tdsTcsRules, vendorBankAccounts, payments, paymentInvoiceMap, ocrLogs, approvalLogs, auditLogs,
  type User, type InsertUser,
  type Vendor, type InsertVendor,
  type PurchaseInvoice, type InsertPurchaseInvoice,
  type SalesInvoice, type InsertSalesInvoice,
  type PurchaseOrder, type InsertPurchaseOrder,
  type JobWorkEntry, type InsertJobWorkEntry,
  type LabourInvoice, type InsertLabourInvoice,
  type ReconciliationRecord, type InsertReconciliationRecord,
  type TdsTcsRule, type VendorBankAccount, type Payment, type OcrLog, type ApprovalLog, type AuditLog
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

let db: any;
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool);
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  listVendors(type?: string): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<void>;

  listPurchaseInvoices(): Promise<PurchaseInvoice[]>;
  getPurchaseInvoice(id: string): Promise<PurchaseInvoice | undefined>;
  createPurchaseInvoice(inv: InsertPurchaseInvoice): Promise<PurchaseInvoice>;
  updatePurchaseInvoice(id: string, updates: Partial<InsertPurchaseInvoice>): Promise<PurchaseInvoice | undefined>;
  deletePurchaseInvoice(id: string): Promise<void>;

  listSalesInvoices(): Promise<SalesInvoice[]>;
  getSalesInvoice(id: string): Promise<SalesInvoice | undefined>;
  createSalesInvoice(inv: InsertSalesInvoice): Promise<SalesInvoice>;
  updateSalesInvoice(id: string, updates: Partial<InsertSalesInvoice>): Promise<SalesInvoice | undefined>;
  deleteSalesInvoice(id: string): Promise<void>;

  listPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, updates: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  deletePurchaseOrder(id: string): Promise<void>;

  listJobWorkEntries(): Promise<JobWorkEntry[]>;
  getJobWorkEntry(id: string): Promise<JobWorkEntry | undefined>;
  createJobWorkEntry(entry: InsertJobWorkEntry): Promise<JobWorkEntry>;
  updateJobWorkEntry(id: string, updates: Partial<InsertJobWorkEntry>): Promise<JobWorkEntry | undefined>;
  deleteJobWorkEntry(id: string): Promise<void>;

  listLabourInvoices(): Promise<LabourInvoice[]>;
  getLabourInvoice(id: string): Promise<LabourInvoice | undefined>;
  createLabourInvoice(inv: InsertLabourInvoice): Promise<LabourInvoice>;
  updateLabourInvoice(id: string, updates: Partial<InsertLabourInvoice>): Promise<LabourInvoice | undefined>;
  deleteLabourInvoice(id: string): Promise<void>;

  listReconciliationRecords(period?: string): Promise<ReconciliationRecord[]>;
  createReconciliationRecord(rec: InsertReconciliationRecord): Promise<ReconciliationRecord>;
  updateReconciliationRecord(id: string, updates: Partial<InsertReconciliationRecord>): Promise<ReconciliationRecord | undefined>;

  // New modules
  listTdsTcsRules(): Promise<TdsTcsRule[]>;
  getTdsTcsRule(id: string): Promise<TdsTcsRule | undefined>;
  createTdsTcsRule(rule: any): Promise<TdsTcsRule>;

  listVendorBankAccounts(vendorId?: string): Promise<VendorBankAccount[]>;
  getVendorBankAccount(id: string): Promise<VendorBankAccount | undefined>;
  createVendorBankAccount(acct: any): Promise<VendorBankAccount>;
  updateVendorBankAccount(id: string, updates: Partial<VendorBankAccount>): Promise<VendorBankAccount | undefined>;

  listPayments(): Promise<Payment[]>;
  createPayment(pay: any): Promise<Payment>;
  getPaymentInvoiceAllocations(paymentId: string): Promise<any[]>;
  allocatePaymentToInvoice(paymentId: string, invoiceId: string, amount: string): Promise<void>;

  listOcrLogs(): Promise<OcrLog[]>;
  createOcrLog(log: any): Promise<OcrLog>;
  updateOcrLog(id: string, updates: Partial<OcrLog>): Promise<OcrLog | undefined>;

  listApprovalLogs(docType: string, docId: string): Promise<ApprovalLog[]>;
  createApprovalLog(log: any): Promise<ApprovalLog>;

  listAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: any): Promise<AuditLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private vendors: Map<string, Vendor> = new Map();
  private purchaseInvoices: Map<string, PurchaseInvoice> = new Map();
  private salesInvoices: Map<string, SalesInvoice> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  private jobWorkEntries: Map<string, JobWorkEntry> = new Map();
  private labourInvoices: Map<string, LabourInvoice> = new Map();
  private reconciliationRecords: Map<string, ReconciliationRecord> = new Map();

  private tdsTcsRules: Map<string, TdsTcsRule> = new Map();
  private vendorBankAccounts: Map<string, VendorBankAccount> = new Map();
  private payments: Map<string, Payment> = new Map();
  private paymentInvoiceMaps: Map<string, any> = new Map();
  private ocrLogs: Map<string, OcrLog> = new Map();
  private approvalLogs: Map<string, ApprovalLog> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed Vendors
    const v1Id = "v1";
    this.vendors.set(v1Id, {
      id: v1Id,
      name: "Acme India Pvt Ltd",
      tradeName: "Acme Materials",
      gstin: "19AAAAC1234A1Z1",
      pan: "AAAAC1234A",
      address: "55 Ezra Street, Kolkata",
      city: "Kolkata",
      state: "West Bengal",
      stateCode: "19",
      pincode: "700001",
      contactPerson: "Rajesh Kumar",
      phone: "+91 98300 12345",
      email: "rajesh@acmeindia.com",
      vendorType: "supplier",
      createdAt: new Date()
    });

    const v2Id = "v2";
    this.vendors.set(v2Id, {
      id: v2Id,
      name: "Bharat Galvanizers",
      tradeName: "Bharat Galvanizing Works",
      gstin: "19BBBFI1234Q1Z1",
      pan: "BBBFI1234Q",
      address: "Jalan Industrial Complex, Howrah",
      city: "Howrah",
      state: "West Bengal",
      stateCode: "19",
      pincode: "711411",
      contactPerson: "Amit Sen",
      phone: "+91 98310 98765",
      email: "info@bharatgalv.com",
      vendorType: "galvanizer",
      createdAt: new Date()
    });

    // Seed Purchase Invoices
    this.purchaseInvoices.set("pi1", {
      id: "pi1",
      invoiceNo: "INV/24/101",
      invoiceDate: "2026-05-10",
      financialYear: "2026-2027",
      vendorId: "v1",
      vendorName: "Acme India Pvt Ltd",
      vendorGstin: "19AAAAC1234A1Z1",
      taxableAmount: "38135.59",
      totalGst: "6864.41",
      invoiceTotal: "45000.00",
      cgstAmount: "3432.20",
      sgstAmount: "3432.21",
      igstAmount: "0.00",
      utgstAmount: "0.00",
      cessAmount: "0.00",
      supplyType: "Intrastate",
      irnNumber: "7f4c39832049dbe87a...",
      isEInvoice: true,
      status: "processed",
      lineItems: [
        { item: "Hot Dip Galvanised Steel Sheets", qty: 2.5, unit: "MT", hsn: "7210", rate: "15254.24", discount: 0, taxableValue: 38135.59, cgstRate: 9, cgstAmount: 3432.20, sgstRate: 9, sgstAmount: 3432.21, total: 45000.00, batchNo: "B2026-X1", serialNo: "S001", weight: 2500, warehouse: "Howrah W2", project: "P-IES-1", costCenter: "IES-PROD" }
      ],
      dueDate: "2026-06-09",
      acknowledgementStatus: "acknowledged",
      uploadedBy: "System",
      ocrConfidence: 99,
      tcsApplicable: false,
      paymentMode: "NEFT",
      grnStatus: "fully_received",
      branchLocation: "Kolkata Works W1",
      pendingDays: 0,
      tdsDeducted: "0.00",
      tcsCollected: "0.00",
      disputeReason: null,
      rawData: null,
      createdAt: new Date()
    });

    this.purchaseInvoices.set("pi2", {
      id: "pi2",
      invoiceNo: "INV/24/102",
      invoiceDate: "2026-05-12",
      financialYear: "2026-2027",
      vendorId: "v2",
      vendorName: "Bharat Galvanizers",
      vendorGstin: "19BBBFI1234Q1Z1",
      taxableAmount: "105932.20",
      totalGst: "19067.80",
      invoiceTotal: "125000.00",
      cgstAmount: "9533.90",
      sgstAmount: "9533.90",
      igstAmount: "0.00",
      utgstAmount: "0.00",
      cessAmount: "0.00",
      supplyType: "Intrastate",
      irnNumber: null,
      isEInvoice: false,
      status: "needs_review",
      lineItems: [
        { item: "Galvanizing Charges for Steel Trays", qty: 10, unit: "MT", hsn: "9988", rate: "10593.22", discount: 0, taxableValue: 105932.20, cgstRate: 9, cgstAmount: 9533.90, sgstRate: 9, sgstAmount: 9533.90, total: 125000.00, batchNo: "B2026-X2", serialNo: "S002", weight: 10000, warehouse: "Howrah W2", project: "P-IES-1", costCenter: "IES-JOB" }
      ],
      dueDate: "2026-06-11",
      acknowledgementStatus: "pending",
      uploadedBy: "Admin User",
      ocrConfidence: 94,
      tcsApplicable: false,
      paymentMode: "IMPS",
      grnStatus: "pending_receipt",
      branchLocation: "Howrah Works W2",
      pendingDays: 6,
      tdsDeducted: "105.93", // 0.1% TDS on 105932.20 under 194Q
      tcsCollected: "0.00",
      disputeReason: null,
      rawData: null,
      createdAt: new Date()
    });

    // Seed TDS/TCS rules
    this.tdsTcsRules.set("r1", {
      id: "r1",
      ruleName: "TDS u/s 194Q (Purchases)",
      section: "194Q",
      thresholdAmount: "5000000.00", // ₹50 Lakhs
      rate: "0.0010", // 0.1%
      rateNoPan: "0.0200", // 2.0%
      effectiveDate: "2026-04-01",
      applicableVendorType: "all",
      gstTreatment: "exclude",
      panRequired: true,
      priority: 1,
      createdAt: new Date()
    });

    this.tdsTcsRules.set("r2", {
      id: "r2",
      ruleName: "TCS u/s 206C(1H) (Sales)",
      section: "206C(1H)",
      thresholdAmount: "5000000.00", // ₹50 Lakhs
      rate: "0.0010", // 0.1%
      rateNoPan: "0.0200", // 2.0%
      effectiveDate: "2026-04-01",
      applicableVendorType: "all",
      gstTreatment: "exclude",
      panRequired: true,
      priority: 2,
      createdAt: new Date()
    });

    // Seed Vendor Bank Details
    this.vendorBankAccounts.set("ba1", {
      id: "ba1",
      vendorId: "v1",
      accountHolderName: "ACME INDIA PVT LTD",
      accountNumber: "918020042940294", // Masked: *******0294 in UI
      ifscCode: "ICIC0000104",
      bankName: "ICICI Bank Ltd",
      branchName: "Dalhousie Branch, Kolkata",
      upiId: "acmeindia@icici",
      cancelledChequeUrl: "/cheque_acme.pdf",
      verificationStatus: "penny_drop_verified",
      pennyDropRef: "PD-948204",
      createdAt: new Date()
    });

    // Seed Payments
    this.payments.set("p1", {
      id: "p1",
      paymentDate: "2026-05-15",
      vendorId: "v1",
      vendorName: "Acme India Pvt Ltd",
      amount: "45000.00",
      utrNumber: "ICICIN26136248924",
      bankReference: "REF-984209420",
      paymentMethod: "NEFT",
      tdsDeducted: "0.00",
      status: "success",
      createdAt: new Date()
    });

    // Seed Mapping
    this.paymentInvoiceMaps.set("m1", {
      id: "m1",
      paymentId: "p1",
      invoiceId: "pi1",
      amountAllocated: "45000.00",
      createdAt: new Date()
    });

    // Seed OCR Log
    this.ocrLogs.set("ol1", {
      id: "ol1",
      filename: "invoice_v2_102.pdf",
      docType: "TAX_INVOICE",
      rawText: "BHARAT GALVANIZERS INVOICE INV/24/102 TOTAL 125000 GSTIN 19BBBFI1234Q1Z1...",
      extractedJson: { invoice_no: "INV/24/102", totals: { invoice_total: 125000 } },
      confidenceScore: 94,
      verificationStatus: "warning_confirmed",
      correctedFields: null,
      userId: "Admin User",
      createdAt: new Date()
    });

    // Seed Approval Log
    this.approvalLogs.set("al1", {
      id: "al1",
      documentType: "purchase_invoice",
      documentId: "pi1",
      action: "approve",
      actor: "Checker User",
      comments: "GRN fully received and checked. Approved for payment release.",
      createdAt: new Date()
    });

    // Seed Audit Log
    this.auditLogs.set("au1", {
      id: "au1",
      actionType: "BANK_EXECUTE",
      entityName: "payments",
      entityId: "p1",
      details: { amount: 45000, utr: "ICICIN26136248924", bank: "ICICI CIB API" },
      actor: "Checker User",
      ipAddress: "192.168.1.15",
      createdAt: new Date()
    });

    // Seed Sales Invoices
    this.salesInvoices.set("si1", {
      id: "si1",
      invoiceNo: "IES/24-25/001",
      invoiceDate: "2026-05-14",
      customerName: "Reliance Infra",
      customerGstin: "19RELIA1234A1Z1",
      customerId: null,
      taxableAmount: "754237.29",
      totalGst: "135762.71",
      invoiceTotal: "890000.00",
      cgstAmount: "67881.35",
      sgstAmount: "67881.36",
      igstAmount: "0.00",
      supplyType: "Intrastate",
      irnNumber: null,
      isEInvoice: true,
      status: "pending",
      lineItems: [],
      poReference: null,
      createdAt: new Date(),
      rawData: null,
      financialYear: "2026-2027",
    });

    // Seed Job Work Entries
    this.jobWorkEntries.set("jw1", {
      id: "jw1",
      galvanizerName: "Bharat Galvanizers",
      period: "May 2026",
      periodFrom: "2026-05-01",
      periodTo: "2026-05-15",
      totalWeightKg: "10000.000",
      totalZincConsumedKg: "360.000",
      totalZincReceivedKg: "500.000",
      closingZincDueKg: "140.000",
      transactions: [{ challanNo: "CH-501", wt: 1000, zincPercent: 3.6, zincConsumed: 36 }],
      rawData: null,
      createdAt: new Date()
    });
  }

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(user: InsertUser) {
    const id = Math.random().toString(36).substring(2);
    const u: User = { ...user, id };
    this.users.set(id, u);
    return u;
  }

  async listVendors(type?: string) {
    const all = Array.from(this.vendors.values());
    if (type) return all.filter(v => v.vendorType === type);
    return all;
  }
  async getVendor(id: string) { return this.vendors.get(id); }
  async createVendor(vendor: InsertVendor) {
    const id = Math.random().toString(36).substring(2);
    const v: Vendor = { ...vendor, id, createdAt: new Date() } as any;
    this.vendors.set(id, v);
    return v;
  }
  async updateVendor(id: string, updates: Partial<InsertVendor>) {
    const v = this.vendors.get(id);
    if (!v) return undefined;
    const updated = { ...v, ...updates };
    this.vendors.set(id, updated);
    return updated;
  }
  async deleteVendor(id: string) { this.vendors.delete(id); }

  async listPurchaseInvoices() { return Array.from(this.purchaseInvoices.values()); }
  async getPurchaseInvoice(id: string) { return this.purchaseInvoices.get(id); }
  async createPurchaseInvoice(inv: InsertPurchaseInvoice) {
    const id = Math.random().toString(36).substring(2);
    const r: PurchaseInvoice = {
      ...inv,
      id,
      createdAt: new Date(),
      status: inv.status || "pending",
      isEInvoice: inv.isEInvoice || false,
      acknowledgementStatus: inv.acknowledgementStatus || "pending",
      uploadedBy: inv.uploadedBy || "System",
      ocrConfidence: inv.ocrConfidence ?? 100,
      tcsApplicable: inv.tcsApplicable || false,
      paymentMode: inv.paymentMode || "NEFT",
      grnStatus: inv.grnStatus || "pending_receipt",
      branchLocation: inv.branchLocation || "Kolkata Works W1",
      pendingDays: inv.pendingDays ?? 0,
      tdsDeducted: inv.tdsDeducted || "0.00",
      tcsCollected: inv.tcsCollected || "0.00",
      disputeReason: inv.disputeReason || null
    } as any;
    this.purchaseInvoices.set(id, r);
    return r;
  }
  async updatePurchaseInvoice(id: string, updates: Partial<InsertPurchaseInvoice>) {
    const r = this.purchaseInvoices.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.purchaseInvoices.set(id, updated);
    return updated;
  }
  async deletePurchaseInvoice(id: string) { this.purchaseInvoices.delete(id); }

  async listSalesInvoices() { return Array.from(this.salesInvoices.values()); }
  async getSalesInvoice(id: string) { return this.salesInvoices.get(id); }
  async createSalesInvoice(inv: InsertSalesInvoice) {
    const id = Math.random().toString(36).substring(2);
    const r: SalesInvoice = { ...inv, id, createdAt: new Date(), status: inv.status || "pending", isEInvoice: inv.isEInvoice || false } as any;
    this.salesInvoices.set(id, r);
    return r;
  }
  async updateSalesInvoice(id: string, updates: Partial<InsertSalesInvoice>) {
    const r = this.salesInvoices.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.salesInvoices.set(id, updated);
    return updated;
  }
  async deleteSalesInvoice(id: string) { this.salesInvoices.delete(id); }

  async listPurchaseOrders() { return Array.from(this.purchaseOrders.values()); }
  async getPurchaseOrder(id: string) { return this.purchaseOrders.get(id); }
  async createPurchaseOrder(po: InsertPurchaseOrder) {
    const id = Math.random().toString(36).substring(2);
    const r: PurchaseOrder = { ...po, id, createdAt: new Date(), status: po.status || "open" } as any;
    this.purchaseOrders.set(id, r);
    return r;
  }
  async updatePurchaseOrder(id: string, updates: Partial<InsertPurchaseOrder>) {
    const r = this.purchaseOrders.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.purchaseOrders.set(id, updated);
    return updated;
  }
  async deletePurchaseOrder(id: string) { this.purchaseOrders.delete(id); }

  async listJobWorkEntries() { return Array.from(this.jobWorkEntries.values()); }
  async getJobWorkEntry(id: string) { return this.jobWorkEntries.get(id); }
  async createJobWorkEntry(entry: InsertJobWorkEntry) {
    const id = Math.random().toString(36).substring(2);
    const r: JobWorkEntry = { ...entry, id, createdAt: new Date() } as any;
    this.jobWorkEntries.set(id, r);
    return r;
  }
  async updateJobWorkEntry(id: string, updates: Partial<InsertJobWorkEntry>) {
    const r = this.jobWorkEntries.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.jobWorkEntries.set(id, updated);
    return updated;
  }
  async deleteJobWorkEntry(id: string) { this.jobWorkEntries.delete(id); }

  async listLabourInvoices() { return Array.from(this.labourInvoices.values()); }
  async getLabourInvoice(id: string) { return this.labourInvoices.get(id); }
  async createLabourInvoice(inv: InsertLabourInvoice) {
    const id = Math.random().toString(36).substring(2);
    const r: LabourInvoice = { ...inv, id, createdAt: new Date(), status: inv.status || "pending" } as any;
    this.labourInvoices.set(id, r);
    return r;
  }
  async updateLabourInvoice(id: string, updates: Partial<InsertLabourInvoice>) {
    const r = this.labourInvoices.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.labourInvoices.set(id, updated);
    return updated;
  }
  async deleteLabourInvoice(id: string) { this.labourInvoices.delete(id); }

  async listReconciliationRecords(period?: string) {
    const all = Array.from(this.reconciliationRecords.values());
    if (period) return all.filter(r => r.period === period);
    return all;
  }
  async createReconciliationRecord(rec: InsertReconciliationRecord) {
    const id = Math.random().toString(36).substring(2);
    const r: ReconciliationRecord = { ...rec, id, createdAt: new Date(), status: rec.status || "pending" } as any;
    this.reconciliationRecords.set(id, r);
    return r;
  }
  async updateReconciliationRecord(id: string, updates: Partial<InsertReconciliationRecord>) {
    const r = this.reconciliationRecords.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.reconciliationRecords.set(id, updated);
    return updated;
  }

  // TDS Rules
  async listTdsTcsRules() { return Array.from(this.tdsTcsRules.values()); }
  async getTdsTcsRule(id: string) { return this.tdsTcsRules.get(id); }
  async createTdsTcsRule(rule: any) {
    const id = Math.random().toString(36).substring(2);
    const r: TdsTcsRule = { ...rule, id, createdAt: new Date() } as any;
    this.tdsTcsRules.set(id, r);
    return r;
  }

  // Bank Accounts
  async listVendorBankAccounts(vendorId?: string) {
    const all = Array.from(this.vendorBankAccounts.values());
    if (vendorId) return all.filter(a => a.vendorId === vendorId);
    return all;
  }
  async getVendorBankAccount(id: string) { return this.vendorBankAccounts.get(id); }
  async createVendorBankAccount(acct: any) {
    const id = Math.random().toString(36).substring(2);
    const r: VendorBankAccount = { ...acct, id, createdAt: new Date(), verificationStatus: acct.verificationStatus || "unverified" };
    this.vendorBankAccounts.set(id, r);
    return r;
  }
  async updateVendorBankAccount(id: string, updates: Partial<VendorBankAccount>) {
    const r = this.vendorBankAccounts.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.vendorBankAccounts.set(id, updated);
    return updated;
  }

  // Payments Ledger
  async listPayments() { return Array.from(this.payments.values()); }
  async createPayment(pay: any) {
    const id = Math.random().toString(36).substring(2);
    const r: Payment = { ...pay, id, createdAt: new Date(), status: pay.status || "success" };
    this.payments.set(id, r);
    return r;
  }
  async getPaymentInvoiceAllocations(paymentId: string) {
    return Array.from(this.paymentInvoiceMaps.values()).filter(m => m.paymentId === paymentId);
  }
  async allocatePaymentToInvoice(paymentId: string, invoiceId: string, amount: string) {
    const id = Math.random().toString(36).substring(2);
    this.paymentInvoiceMaps.set(id, { id, paymentId, invoiceId, amountAllocated: amount, createdAt: new Date() });
  }

  // OCR logs
  async listOcrLogs() { return Array.from(this.ocrLogs.values()); }
  async createOcrLog(log: any) {
    const id = Math.random().toString(36).substring(2);
    const r: OcrLog = { ...log, id, createdAt: new Date(), confidenceScore: log.confidenceScore ?? 100, verificationStatus: log.verificationStatus || "auto_approved" };
    this.ocrLogs.set(id, r);
    return r;
  }
  async updateOcrLog(id: string, updates: Partial<OcrLog>) {
    const r = this.ocrLogs.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...updates };
    this.ocrLogs.set(id, updated);
    return updated;
  }

  // Approvals
  async listApprovalLogs(docType: string, docId: string) {
    return Array.from(this.approvalLogs.values()).filter(l => l.documentType === docType && l.documentId === docId);
  }
  async createApprovalLog(log: any) {
    const id = Math.random().toString(36).substring(2);
    const r: ApprovalLog = { ...log, id, createdAt: new Date() };
    this.approvalLogs.set(id, r);
    return r;
  }

  // Audit Logs
  async listAuditLogs() { return Array.from(this.auditLogs.values()); }
  async createAuditLog(log: any) {
    const id = Math.random().toString(36).substring(2);
    const r: AuditLog = { ...log, id, createdAt: new Date() };
    this.auditLogs.set(id, r);
    return r;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }
  async getUserByUsername(username: string) {
    const [u] = await db.select().from(users).where(eq(users.username, username));
    return u;
  }
  async createUser(user: InsertUser) {
    const [u] = await db.insert(users).values(user).returning();
    return u;
  }

  async listVendors(type?: string) {
    if (type) return db.select().from(vendors).where(eq(vendors.vendorType, type)).orderBy(desc(vendors.createdAt));
    return db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }
  async getVendor(id: string) {
    const [v] = await db.select().from(vendors).where(eq(vendors.id, id));
    return v;
  }
  async createVendor(vendor: InsertVendor) {
    const [v] = await db.insert(vendors).values(vendor).returning();
    return v;
  }
  async updateVendor(id: string, updates: Partial<InsertVendor>) {
    const [v] = await db.update(vendors).set(updates).where(eq(vendors.id, id)).returning();
    return v;
  }
  async deleteVendor(id: string) {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  async listPurchaseInvoices() {
    return db.select().from(purchaseInvoices).orderBy(desc(purchaseInvoices.createdAt));
  }
  async getPurchaseInvoice(id: string) {
    const [inv] = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id));
    return inv;
  }
  async createPurchaseInvoice(inv: InsertPurchaseInvoice) {
    const [r] = await db.insert(purchaseInvoices).values(inv).returning();
    return r;
  }
  async updatePurchaseInvoice(id: string, updates: Partial<InsertPurchaseInvoice>) {
    const [r] = await db.update(purchaseInvoices).set(updates).where(eq(purchaseInvoices.id, id)).returning();
    return r;
  }
  async deletePurchaseInvoice(id: string) {
    await db.delete(purchaseInvoices).where(eq(purchaseInvoices.id, id));
  }

  async listSalesInvoices() {
    return db.select().from(salesInvoices).orderBy(desc(salesInvoices.createdAt));
  }
  async getSalesInvoice(id: string) {
    const [inv] = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id));
    return inv;
  }
  async createSalesInvoice(inv: InsertSalesInvoice) {
    const [r] = await db.insert(salesInvoices).values(inv).returning();
    return r;
  }
  async updateSalesInvoice(id: string, updates: Partial<InsertSalesInvoice>) {
    const [r] = await db.update(salesInvoices).set(updates).where(eq(salesInvoices.id, id)).returning();
    return r;
  }
  async deleteSalesInvoice(id: string) {
    await db.delete(salesInvoices).where(eq(salesInvoices.id, id));
  }

  async listPurchaseOrders() {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }
  async getPurchaseOrder(id: string) {
    const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return po;
  }
  async createPurchaseOrder(po: InsertPurchaseOrder) {
    const [r] = await db.insert(purchaseOrders).values(po).returning();
    return r;
  }
  async updatePurchaseOrder(id: string, updates: Partial<InsertPurchaseOrder>) {
    const [r] = await db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id)).returning();
    return r;
  }
  async deletePurchaseOrder(id: string) {
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  async listJobWorkEntries() {
    return db.select().from(jobWorkEntries).orderBy(desc(jobWorkEntries.createdAt));
  }
  async getJobWorkEntry(id: string) {
    const [e] = await db.select().from(jobWorkEntries).where(eq(jobWorkEntries.id, id));
    return e;
  }
  async createJobWorkEntry(entry: InsertJobWorkEntry) {
    const [r] = await db.insert(jobWorkEntries).values(entry).returning();
    return r;
  }
  async updateJobWorkEntry(id: string, updates: Partial<InsertJobWorkEntry>) {
    const [r] = await db.update(jobWorkEntries).set(updates).where(eq(jobWorkEntries.id, id)).returning();
    return r;
  }
  async deleteJobWorkEntry(id: string) {
    await db.delete(jobWorkEntries).where(eq(jobWorkEntries.id, id));
  }

  async listLabourInvoices() {
    return db.select().from(labourInvoices).orderBy(desc(labourInvoices.createdAt));
  }
  async getLabourInvoice(id: string) {
    const [inv] = await db.select().from(labourInvoices).where(eq(labourInvoices.id, id));
    return inv;
  }
  async createLabourInvoice(inv: InsertLabourInvoice) {
    const [r] = await db.insert(labourInvoices).values(inv).returning();
    return r;
  }
  async updateLabourInvoice(id: string, updates: Partial<InsertLabourInvoice>) {
    const [r] = await db.update(labourInvoices).set(updates).where(eq(labourInvoices.id, id)).returning();
    return r;
  }
  async deleteLabourInvoice(id: string) {
    await db.delete(labourInvoices).where(eq(labourInvoices.id, id));
  }

  async listReconciliationRecords(period?: string) {
    if (period) {
      return db.select().from(reconciliationRecords)
        .where(eq(reconciliationRecords.period, period))
        .orderBy(desc(reconciliationRecords.createdAt));
    }
    return db.select().from(reconciliationRecords).orderBy(desc(reconciliationRecords.createdAt));
  }
  async createReconciliationRecord(rec: InsertReconciliationRecord) {
    const [r] = await db.insert(reconciliationRecords).values(rec).returning();
    return r;
  }
  async updateReconciliationRecord(id: string, updates: Partial<InsertReconciliationRecord>) {
    const [r] = await db.update(reconciliationRecords).set(updates).where(eq(reconciliationRecords.id, id)).returning();
    return r;
  }

  // DatabaseStorage new modules implementations
  async listTdsTcsRules() {
    return db.select().from(tdsTcsRules).orderBy(desc(tdsTcsRules.createdAt));
  }
  async getTdsTcsRule(id: string) {
    const [r] = await db.select().from(tdsTcsRules).where(eq(tdsTcsRules.id, id));
    return r;
  }
  async createTdsTcsRule(rule: any) {
    const [r] = await db.insert(tdsTcsRules).values(rule).returning();
    return r;
  }

  async listVendorBankAccounts(vendorId?: string) {
    if (vendorId) {
      return db.select().from(vendorBankAccounts).where(eq(vendorBankAccounts.vendorId, vendorId)).orderBy(desc(vendorBankAccounts.createdAt));
    }
    return db.select().from(vendorBankAccounts).orderBy(desc(vendorBankAccounts.createdAt));
  }
  async getVendorBankAccount(id: string) {
    const [a] = await db.select().from(vendorBankAccounts).where(eq(vendorBankAccounts.id, id));
    return a;
  }
  async createVendorBankAccount(acct: any) {
    const [r] = await db.insert(vendorBankAccounts).values(acct).returning();
    return r;
  }
  async updateVendorBankAccount(id: string, updates: Partial<VendorBankAccount>) {
    const [r] = await db.update(vendorBankAccounts).set(updates).where(eq(vendorBankAccounts.id, id)).returning();
    return r;
  }

  async listPayments() {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }
  async createPayment(pay: any) {
    const [r] = await db.insert(payments).values(pay).returning();
    return r;
  }
  async getPaymentInvoiceAllocations(paymentId: string) {
    return db.select().from(paymentInvoiceMap).where(eq(paymentInvoiceMap.paymentId, paymentId));
  }
  async allocatePaymentToInvoice(paymentId: string, invoiceId: string, amount: string) {
    await db.insert(paymentInvoiceMap).values({ paymentId, invoiceId, amountAllocated: amount });
  }

  async listOcrLogs() {
    return db.select().from(ocrLogs).orderBy(desc(ocrLogs.createdAt));
  }
  async createOcrLog(log: any) {
    const [r] = await db.insert(ocrLogs).values(log).returning();
    return r;
  }
  async updateOcrLog(id: string, updates: Partial<OcrLog>) {
    const [r] = await db.update(ocrLogs).set(updates).where(eq(ocrLogs.id, id)).returning();
    return r;
  }

  async listApprovalLogs(docType: string, docId: string) {
    return db.select().from(approvalLogs).where(eq(approvalLogs.documentType, docType)).where(eq(approvalLogs.documentId, docId)).orderBy(desc(approvalLogs.createdAt));
  }
  async createApprovalLog(log: any) {
    const [r] = await db.insert(approvalLogs).values(log).returning();
    return r;
  }

  async listAuditLogs() {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }
  async createAuditLog(log: any) {
    const [r] = await db.insert(auditLogs).values(log).returning();
    return r;
  }
}

export const storage = (process.env.DATABASE_URL && process.env.DATABASE_URL !== "")
  ? new DatabaseStorage()
  : new MemStorage();
