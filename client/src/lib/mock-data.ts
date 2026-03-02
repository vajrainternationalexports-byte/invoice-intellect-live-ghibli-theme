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
    zincPendingQty: 4.2, // MT
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
    },
    {
      id: "PUR/24/002",
      irn: "9876...4321",
      vendor: "TechFlow Systems",
      gstin: "29BBBBB1111B1Z2",
      amount: 1250.50,
      date: "Oct 22, 2023",
      dueDate: "Nov 22, 2023",
      status: "needs_review",
      confidence: 74,
      items: [{ desc: "Licenses", qty: 10, price: 125 }]
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
    },
    {
      id: "SAL/24/002",
      customer: "Tata Steel Ltd",
      gstin: "24AAATT1234A1Z0",
      amount: 8200.00,
      date: "Oct 20, 2023",
      dueDate: "Nov 15, 2023",
      status: "needs_review",
      confidence: 85,
      items: [{ desc: "Zinc Coating Services", qty: 2, price: 4100 }]
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
    },
    {
      id: "C-002",
      name: "Tata Steel Ltd",
      gstin: "24AAATT1234A1Z0",
      totalOutstanding: 12000,
      pendingInvoices: 1,
      lastTransaction: "Oct 20, 2023",
      contact: "finance@tatasteel.com",
      owner: "Ratan T."
    }
  ],
  jobWork: [
    {
      vendor: "V-001",
      challanNo: "CH-9921",
      date: "Oct 24, 2023",
      material: "Steel Coil",
      thickness: "2.5mm",
      kgsIssued: 5000,
      zincFormula: "45kg/Ton",
      expectedZinc: 225
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