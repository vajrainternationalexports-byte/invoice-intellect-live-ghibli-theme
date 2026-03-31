import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import {
  users, vendors, purchaseInvoices, salesInvoices, purchaseOrders,
  jobWorkEntries, labourInvoices, reconciliationRecords,
  type User, type InsertUser,
  type Vendor, type InsertVendor,
  type PurchaseInvoice, type InsertPurchaseInvoice,
  type SalesInvoice, type InsertSalesInvoice,
  type PurchaseOrder, type InsertPurchaseOrder,
  type JobWorkEntry, type InsertJobWorkEntry,
  type LabourInvoice, type InsertLabourInvoice,
  type ReconciliationRecord, type InsertReconciliationRecord,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

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
}

export const storage = new DatabaseStorage();
