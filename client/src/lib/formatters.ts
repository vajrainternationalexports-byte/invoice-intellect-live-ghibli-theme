/**
 * formatters.ts — Shared financial & date formatting utilities
 * All monetary values in the app flow through these functions for consistency.
 */

/** Format a number as Indian Rupees — e.g. 1234567 → "₹12,34,567" */
export function formatINR(value: number | string | null | undefined, decimals = 0): string {
  const n = parseFloat(String(value ?? 0)) || 0;
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format in Lakhs — e.g. 1500000 → "₹15.00L" */
export function formatLakhs(value: number | string | null | undefined): string {
  const n = parseFloat(String(value ?? 0)) || 0;
  return "₹" + (n / 100_000).toFixed(2) + "L";
}

/** Format in thousands — e.g. 12500 → "₹12.5k" */
export function formatThousands(value: number | string | null | undefined): string {
  const n = parseFloat(String(value ?? 0)) || 0;
  return "₹" + (n / 1_000).toFixed(1) + "k";
}

/** Parse a raw string/number to float safely */
export function toFloat(value: any): number {
  return parseFloat(String(value ?? 0)) || 0;
}

/** Format a date string to Indian format — e.g. "2025-04-01" → "01 Apr 2025" */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return date;
  }
}

/** Format a percentage — e.g. 0.1234 → "12.3%" */
export function formatPercent(value: number, decimals = 1): string {
  return (value * 100).toFixed(decimals) + "%";
}

/** Compute GST breakdown label from amounts */
export function gstLabel(cgst: number, sgst: number, igst: number): string {
  if (igst > 0) return `IGST ${formatINR(igst)}`;
  if (cgst > 0 && sgst > 0) return `CGST ${formatINR(cgst)} + SGST ${formatINR(sgst)}`;
  return "No GST";
}

/** Zinc balance: positive = due to galvanizer, negative = excess with galvanizer */
export function zincBalanceLabel(consumed: number, received: number): string {
  const delta = consumed - received;
  if (delta > 0) return `${delta.toFixed(2)} KG due`;
  if (delta < 0) return `${Math.abs(delta).toFixed(2)} KG excess`;
  return "Balanced";
}

/** Fulfillment percentage for POs */
export function fulfillmentPct(ordered: number, received: number): number {
  if (!ordered) return 0;
  return Math.min(100, (received / ordered) * 100);
}
