export const mockData = {
  stats: {
    totalPending: 45200.50,
    processedToday: 12,
    upcomingPayments: 8,
    discrepancies: 3,
    totalReceivable: 68400.00,
    receivableInvoicesCount: 14,
    receivable15Days: 28000.00,
    receivable45Days: 40400.00,
    labourChargesPayable: 15400.00,
    zincPendingQty: 358.31, // MT based on sheet
    zincPendingValue: 840000.00 // INR
  },
  monthlyVolume: [
    { month: 'Jan', amount: 35000 },
    { month: 'Feb', amount: 42000 },
    { month: 'Mar', amount: 38000 },
    { month: 'Apr', amount: 51000 },
    { month: 'May', amount: 45200 },
  ],
  invoices: [
    {
      id: "PUR/24/001",
      irn: "1234...5678",
      vendor: "Acme India Pvt Ltd.",
      gstin: "27AAAAA0000A1Z5",
      amount: 4500.00,
      date: "Oct 24, 2023",
      dueDate: "Nov 24, 2023",
      status: "pending",
      confidence: 98,
      items: [{ desc: "Server Hardware", qty: 2, price: 2000 }, { desc: "Shipping", qty: 1, price: 500 }]
    }
  ],
  salesInvoices: [
    {
      id: "SAL/24/001",
      customer: "Reliance Industries",
      gstin: "27AAACR0001A1Z1",
      amount: 15400.00,
      date: "Oct 25, 2023",
      dueDate: "Nov 05, 2023",
      status: "pending",
      confidence: 99,
      items: [{ desc: "Galvanized Steel", qty: 5, price: 3000 }]
    }
  ],
  vendors: [
    {
      id: "V-001",
      name: "Acme India Pvt Ltd.",
      gstin: "27AAAAA0000A1Z5",
      riskScore: "Low",
      totalSpent: 125000,
      contact: "billing@acme.in",
      owner: "Robert J. Wilson",
      totalOrders: 42,
      bankDetails: { bankName: "HDFC Bank", accountNumber: "**** 8892", routingNumber: "HDFC0001234" }
    }
  ],
  customers: [
    {
      id: "C-001",
      name: "Reliance Industries",
      gstin: "27AAACR0001A1Z1",
      totalOutstanding: 45000,
      pendingInvoices: 3,
      lastTransaction: "Oct 25, 2023",
      contact: "accounts@ril.com",
      owner: "Mukesh A."
    }
  ],
  jobWorkEntries: [
    {
      id: 1,
      challan: "J/54",
      date: "05-08-2025",
      lorryNo: "WB37A-6326",
      material: "MS Ladder",
      pcs: 161,
      thick: 2.8,
      partyWt: "NA",
      ourWt: 5690,
      rate: "8%",
      zinc: 455.2
    },
    {
      id: 2,
      challan: "J/55",
      date: "05-08-2025",
      lorryNo: "WB19J-4277",
      material: "Flat 50x6",
      pcs: "N/A",
      thick: 6,
      partyWt: 14230,
      ourWt: 14260,
      rate: "3.60%",
      zinc: 512.28
    },
    {
      id: 3,
      challan: "J/61",
      date: "15-08-2025",
      lorryNo: "WB37A-6326",
      material: "Zinc Received",
      pcs: "N/A",
      thick: "N/A",
      partyWt: 0,
      ourWt: 0,
      rate: 0,
      zinc: -1003
    },
    {
      id: 4,
      challan: "J/100",
      date: "06-12-2025",
      lorryNo: "WB11C-6257",
      material: "Flat 25x3",
      pcs: "N/A",
      thick: 3,
      partyWt: 2330,
      ourWt: 12340,
      rate: "7%",
      zinc: 163.1
    },
    {
      id: 5,
      challan: "J/105",
      date: "22/12/2025",
      lorryNo: "WB11E-3832",
      material: "Zinc Received",
      pcs: "N/A",
      thick: "N/A",
      partyWt: 0,
      ourWt: 0,
      rate: 0,
      zinc: -1200
    },
    {
      id: 6,
      challan: "J/114",
      date: "05-01-2026",
      lorryNo: "WB11C-6257",
      material: "Flat 75x10",
      pcs: "N/A",
      thick: 10,
      partyWt: 3900,
      ourWt: 11800,
      rate: "3%",
      zinc: 117
    },
    {
      id: 7,
      challan: "J/127",
      date: "06-02-2026",
      lorryNo: "WB11C-8500",
      material: "Flat 65x8",
      pcs: "N/A",
      thick: 8,
      partyWt: 9270,
      ourWt: 12420,
      rate: "3%",
      zinc: 278.1
    },
    {
      id: 8,
      challan: "J/128",
      date: "07-02-2026",
      lorryNo: "WB11C-8500",
      material: "Flat 50x6",
      pcs: "N/A",
      thick: 6,
      partyWt: 2500,
      ourWt: 10640,
      rate: "3.60%",
      zinc: 90
    }
  ],
  purchaseOrders: [
    {
      id: "PO-2024-001",
      vendor: "Acme India",
      date: "Oct 01, 2023",
      status: "Partially fulfilled",
      ordered: 100,
      received: 60,
      pending: 40
    }
  ]
};