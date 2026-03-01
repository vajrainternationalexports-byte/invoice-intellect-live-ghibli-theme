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
      irn: "1234567890123456789012345678901234567890123456789012345678901234",
      vendor: "Acme India Pvt Ltd.",
      gstin: "27AAAAA0000A1Z5",
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
      irn: "9876543210987654321098765432109876543210987654321098765432109876",
      vendor: "TechFlow Systems India",
      gstin: "29BBBBB1111B1Z2",
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
      irn: "4567890123456789012345678901234567890123456789012345678901234567",
      vendor: "Global Logistics India",
      gstin: "19CCCCC2222C1Z3",
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
      vendor: "Acme India Pvt Ltd.",
      matchStatus: "matched",
      poAmount: 4500.00,
      invAmount: 4500.00,
      salesOrder: "SO-4432",
      margin: 25.5
    },
    {
      poNumber: "PO-9922",
      invoiceId: "INV-2023-002",
      vendor: "TechFlow Systems India",
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
      name: "Acme India Pvt Ltd.",
      gstin: "27AAAAA0000A1Z5",
      riskScore: "Low",
      totalSpent: 125000,
      duplicateWarning: false,
      contact: "billing@acme.in",
      owner: "Robert J. Wilson",
      totalOrders: 42,
      lastOrderDate: "Oct 24, 2023",
      bankDetails: {
        accountName: "Acme India Pvt Ltd",
        accountNumber: "**** 8892",
        routingNumber: "HDFC0001234",
        bankName: "HDFC Bank"
      }
    },
    {
      id: "V-002",
      name: "Acme Corporation (India)",
      gstin: "27AAAAA0000A1Z5",
      riskScore: "High",
      totalSpent: 4500,
      duplicateWarning: true,
      duplicateOf: "V-001",
      contact: "finance.acme@gmail.com",
      owner: "Unknown",
      totalOrders: 2,
      lastOrderDate: "Oct 15, 2023",
      bankDetails: {
        accountName: "Acme Corp",
        accountNumber: "**** 8892",
        routingNumber: "ICIC0005678",
        bankName: "ICICI Bank"
      }
    },
    {
      id: "V-003",
      name: "TechFlow Systems India",
      gstin: "29BBBBB1111B1Z2",
      riskScore: "Low",
      totalSpent: 89000,
      duplicateWarning: false,
      contact: "accounts@techflow.co.in",
      owner: "Elena Rodriguez",
      totalOrders: 156,
      lastOrderDate: "Oct 22, 2023",
      bankDetails: {
        accountName: "TechFlow Systems India",
        accountNumber: "**** 4431",
        routingNumber: "SBIN0000001",
        bankName: "State Bank of India"
      }
    }
  ]
};