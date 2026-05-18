/**
 * useDashboard.ts — Aggregated dashboard metrics hook
 * Computes all financial KPIs, GST breakdowns, and zinc balances
 * from a single API call with proper maths.
 */
import { useQuery } from "@tanstack/react-query";
import { toFloat } from "@/lib/formatters";

export interface DashboardData {
  sales: {
    total: number;
    count: number;
    gst: { cgst: number; sgst: number; igst: number; total: number };
  };
  purchases: {
    total: number;
    count: number;
    pending: number;
    needsReview: number;
    gst: { cgst: number; sgst: number; igst: number; total: number };
  };
  purchaseOrders: { count: number; open: number };
  jobWork: {
    entries: number;
    zincDueKg: number;
    zincConsumed: number;
    zincReceived: number;
  };
  labourInvoices: { count: number; totalPayable: number };
  /** Net revenue = sales.total - purchases.total */
  netRevenue: number;
  /** GST liability = sales GST - purchases GST (input credit) */
  netGstLiability: number;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    select: (raw: any): DashboardData => {
      const salesGst = raw?.sales?.gst ?? { cgst: 0, sgst: 0, igst: 0 };
      const purchGst = raw?.purchases?.gst ?? { cgst: 0, sgst: 0, igst: 0 };

      const salesTotal   = toFloat(raw?.sales?.total);
      const purchTotal   = toFloat(raw?.purchases?.total);
      const salesGstTot  = salesGst.cgst + salesGst.sgst + salesGst.igst;
      const purchGstTot  = purchGst.cgst + purchGst.sgst + purchGst.igst;

      return {
        sales: {
          total: salesTotal,
          count: raw?.sales?.count ?? 0,
          gst: { ...salesGst, total: salesGstTot },
        },
        purchases: {
          total: purchTotal,
          count: raw?.purchases?.count ?? 0,
          pending: raw?.purchases?.pending ?? 0,
          needsReview: raw?.purchases?.needsReview ?? 0,
          gst: { ...purchGst, total: purchGstTot },
        },
        purchaseOrders: raw?.purchaseOrders ?? { count: 0, open: 0 },
        jobWork: raw?.jobWork ?? { entries: 0, zincDueKg: 0, zincConsumed: 0, zincReceived: 0 },
        labourInvoices: raw?.labourInvoices ?? { count: 0, totalPayable: 0 },
        netRevenue:       salesTotal - purchTotal,
        netGstLiability:  salesGstTot - purchGstTot,
      };
    },
  });
}
