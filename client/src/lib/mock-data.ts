export const mockData = {
  stats: {
    totalPending: 45200.50,
    processedToday: 12,
    upcomingPayments: 8,
    discrepancies: 3
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
      id: "INV-2023-001",
      vendor: "Acme Corp Ltd.",
      amount: 4500.00,
      date: "Oct 24, 2023",
      dueDate: "Nov 24, 2023",
      status: "pending",
      confidence: 98,
      items: [
        { desc: "Server Hardware", qty: 2, price: 2000 },
        { desc: "Shipping", qty: 1, price: 500 }
      ]
    },
    {
      id: "INV-2023-002",
      vendor: "TechFlow Systems",
      amount: 1250.50,
      date: "Oct 22, 2023",
      dueDate: "Nov 22, 2023",
      status: "needs_review",
      confidence: 74,
      items: [
        { desc: "Software Licenses", qty: 10, price: 120.05 },
        { desc: "Support Fee", qty: 1, price: 50 }
      ]
    },
    {
      id: "INV-2023-003",
      vendor: "Global Logistics",
      amount: 890.00,
      date: "Oct 20, 2023",
      dueDate: "Nov 20, 2023",
      status: "processed",
      confidence: 99,
      items: [
        { desc: "Freight Charges Q3", qty: 1, price: 890 }
      ]
    }
  ],
  reconciliation: [
    {
      poNumber: "PO-9921",
      invoiceId: "INV-2023-001",
      vendor: "Acme Corp Ltd.",
      matchStatus: "matched",
      poAmount: 4500.00,
      invAmount: 4500.00,
      salesOrder: "SO-4432",
      margin: 25.5
    },
    {
      poNumber: "PO-9922",
      invoiceId: "INV-2023-002",
      vendor: "TechFlow Systems",
      matchStatus: "discrepancy",
      poAmount: 1100.00,
      invAmount: 1250.50,
      salesOrder: "SO-4433",
      margin: 18.2
    }
  ],
  vendors: [
    {
      id: "V-001",
      name: "Acme Corp Ltd.",
      riskScore: "Low",
      totalSpent: 125000,
      duplicateWarning: false,
      contact: "billing@acme.com"
    },
    {
      id: "V-002",
      name: "Acme Corporation",
      riskScore: "High",
      totalSpent: 4500,
      duplicateWarning: true,
      duplicateOf: "V-001",
      contact: "finance.acme@gmail.com"
    },
    {
      id: "V-003",
      name: "TechFlow Systems",
      riskScore: "Low",
      totalSpent: 89000,
      duplicateWarning: false,
      contact: "accounts@techflow.io"
    }
  ]
};