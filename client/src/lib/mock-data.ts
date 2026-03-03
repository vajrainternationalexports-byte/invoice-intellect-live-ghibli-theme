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
    zincPendingQty: 358.31, // KG
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
    { id: "V-001", name: "Acme India Pvt Ltd." },
    { id: "V-002", name: "Bharat Industrial" }
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
    }
  ]
};