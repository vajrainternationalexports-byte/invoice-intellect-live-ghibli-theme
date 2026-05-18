/**
 * constants.ts — App-wide constants: routes, statuses, tabs, labels
 * Single source of truth — never hardcode these strings in components.
 */

export const ROUTES = {
  HOME:            "/",
  SALES:           "/sales",
  PURCHASES:       "/invoices",
  ORDERS:          "/po",
  PROCESS:         "/jobwork",
  VENDORS:         "/vendors",
  RECONCILIATION:  "/reconciliation",
} as const;

export const INVOICE_STATUSES = {
  NEEDS_REVIEW: "needs_review",
  PENDING:      "pending",
  PROCESSED:    "processed",
} as const;

export const PO_STATUSES = {
  OPEN:    "open",
  PARTIAL: "partial",
  CLOSED:  "closed",
} as const;

export const LABOUR_STATUSES = {
  PENDING:      "pending",
  NEEDS_REVIEW: "needs_review",
  PAID:         "paid",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  needs_review: "Review",
  pending:      "Pending",
  processed:    "Paid",
  open:         "Open",
  partial:      "Partial",
  closed:       "Closed",
  paid:         "Paid",
};

export const DOC_TYPE_HINTS = [
  "AUTO_DETECT",
  "TAX_INVOICE",
  "PURCHASE_ORDER",
  "LABOUR_INVOICE",
  "ZINC_STATEMENT_IES",
  "ZINC_LEDGER_GALVANIZER",
] as const;

export const COMPANY = {
  NAME:   "India Electricals Syndicate",
  SHORT:  "IES",
  GSTIN:  "19AAAFI6886Q1ZE",
  STATE:  "West Bengal",
  CITY:   "Kolkata",
} as const;

/** Financial year helper */
export function currentFY(): string {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1; // 1-indexed
  const start = mo >= 4 ? yr : yr - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}
