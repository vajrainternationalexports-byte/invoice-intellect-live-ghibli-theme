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
    zincPendingQty: 358.31,
    zincPendingValue: 840000.00
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
      gstin: "27GVPPS1234A1Z5", 
      labourOutstanding: 12500, 
      totalPaid: 45000,
      totalSpent: 125000,
      contact: "vendor@acmeindia.com",
      owner: "Rajesh Kumar",
      riskScore: "Low",
      duplicateWarning: false,
      totalOrders: 24,
      lastOrderDate: "Mar 28, 2026",
      bankDetails: { bankName: "ICICI Bank", accountNumber: "1234567890", routingNumber: "ICIC0000123" }
    },
    { 
      id: "V-002", 
      name: "Bharat Industrial", 
      gstin: "09AAACB1234P1Z2", 
      labourOutstanding: 8400, 
      totalPaid: 22000,
      totalSpent: 87500,
      contact: "inquiry@bharatind.com",
      owner: "Priya Singh",
      riskScore: "Low",
      duplicateWarning: false,
      totalOrders: 18,
      lastOrderDate: "Mar 25, 2026",
      bankDetails: { bankName: "HDFC Bank", accountNumber: "9876543210", routingNumber: "HDFC0000456" }
    }
  ],
  jobWorkEntries: [
    {
      id: 1,
      challan: "J/54",
      date: "2025-08-05",
      lorryNo: "WB37A-6326",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "MS Ladder", thick: 2.8, pcs: 161, partyWt: 0, ourWt: 5690, rate: 8, zinc: 455.2 }
      ]
    },
    {
      id: 2,
      challan: "J/55",
      date: "2025-08-05",
      lorryNo: "WB19J-4277",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Flat 50x6", thick: 6, pcs: 0, partyWt: 14230, ourWt: 14260, rate: 3.6, zinc: 512.28 }
      ]
    },
    {
      id: 3,
      challan: "J/61",
      date: "2025-08-15",
      lorryNo: "WB37A-6326",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Zinc Received", thick: 0, pcs: 0, partyWt: 0, ourWt: 0, rate: 0, zinc: -1003 }
      ]
    },
    {
      id: 4,
      challan: "J/100",
      date: "2025-12-06",
      lorryNo: "WB11C-6257",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Flat 25x3", thick: 3, pcs: 0, partyWt: 2330, ourWt: 12340, rate: 7, zinc: 163.1 },
        { material: "Flat 50x6", thick: 6, pcs: 0, partyWt: 6430, ourWt: 0, rate: 3.6, zinc: 231.48 },
        { material: "Flat 75x10", thick: 10, pcs: 0, partyWt: 3570, ourWt: 0, rate: 2.5, zinc: 89.25 }
      ]
    },
    {
      id: 5,
      challan: "J/105",
      date: "2025-12-22",
      lorryNo: "WB11E-3832",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Zinc Received", thick: 0, pcs: 0, partyWt: 0, ourWt: 0, rate: 0, zinc: -1200 }
      ]
    },
    {
      id: 6,
      challan: "J/114",
      date: "2026-01-05",
      lorryNo: "WB11C-6257",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Flat 75x10", thick: 10, pcs: 0, partyWt: 3900, ourWt: 11800, rate: 3, zinc: 117 },
        { material: "Flat 65x8", thick: 8, pcs: 0, partyWt: 7920, ourWt: 0, rate: 3, zinc: 237.6 }
      ]
    },
    {
      id: 7,
      challan: "J/127",
      date: "2026-02-06",
      lorryNo: "WB11C-8500",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Flat 65x8", thick: 8, pcs: 0, partyWt: 9270, ourWt: 12420, rate: 3, zinc: 278.1 },
        { material: "Flat 50x8", thick: 8, pcs: 0, partyWt: 3130, ourWt: 0, rate: 3, zinc: 93.9 }
      ]
    },
    {
      id: 8,
      challan: "J/128",
      date: "2026-02-07",
      lorryNo: "WB11C-8500",
      vendor: "Acme India Pvt Ltd.",
      items: [
        { material: "Flat 50x6", thick: 6, pcs: 0, partyWt: 2500, ourWt: 10640, rate: 3.6, zinc: 90 },
        { material: "Flat 25x6", thick: 6, pcs: 0, partyWt: 8150, ourWt: 0, rate: 3.6, zinc: 293.4 }
      ]
    }
  ],
  labourInvoices: [
    {
      id: "L-101",
      vendor: "Acme India Pvt Ltd.",
      invNo: "INV/LB/001",
      date: "2024-03-01",
      vehicleNo: "WB11C-1234",
      weight: 1250,
      rate: 10,
      basic: 10593.22,
      gstRate: 18,
      gstAmount: 1906.78,
      total: 12500,
      tds: 211.86,
      payable: 12288.14,
      status: "pending",
      gstPercent: "18"
    },
    {
      id: "L-102",
      vendor: "Bharat Industrial",
      invNo: "INV/LB/002",
      date: "2024-03-02",
      vehicleNo: "WB11C-5678",
      weight: 840,
      rate: 10,
      basic: 7118.64,
      gstRate: 18,
      gstAmount: 1281.36,
      total: 8400,
      tds: 142.37,
      payable: 8257.63,
      status: "needs_review",
      gstPercent: "18"
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
  ],
  reconciliation: [
    {
      id: "REC-001",
      invoiceId: "PUR/24/001",
      vendor: "Acme India Pvt Ltd.",
      invoiceAmount: 4500,
      paidAmount: 4500,
      difference: 0,
      status: "matched",
      date: "Oct 24, 2023"
    },
    {
      id: "REC-002",
      invoiceId: "PUR/24/002",
      vendor: "Bharat Industrial",
      invoiceAmount: 8500,
      paidAmount: 8200,
      difference: 300,
      status: "discrepancy",
      date: "Oct 25, 2023"
    }
  ]
};