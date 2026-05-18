# INVOICE INTELLECT — SYSTEM ARCHITECTURE BLUEPRINT
# ⚠️ READ THIS BEFORE TOUCHING ANY CODE ⚠️
# Last updated: 2026-05-18 | Scope: PURCHASE SECTION (Phase 1)

---

## WHAT WE ARE BUILDING

This is NOT a simple dashboard or CRUD app.
This is ERP-lite procurement + finance infrastructure.

Wrong implementation causes:
- GST filing issues → tax notices
- Reconciliation failures → duplicate payments
- Audit exposure → legal liability

### Core Modules (Purchase Section — Phase 1)
1. Procurement Management
2. OCR Invoice Reading Pipeline
3. Vendor Ledger System
4. GST Accounting Engine
5. Payment Scheduling Engine
6. Bank Integration Layer (ICICI)
7. TDS/TCS Compliance Engine
8. Search + Multi-filter Analytics
9. Excel / CSV / PDF Export System
10. Approval Workflow System (Maker-Checker)
11. Audit Trail System

---

## PURCHASE SECTION — SCREEN STRUCTURE

### LEVEL 1 — PURCHASE HOME SCREEN (List View)

Visible columns in the invoice list:

| Column | Notes |
|---|---|
| Invoice Number | Unique, searchable |
| Vendor Name | Linked to Vendor Master |
| Invoice Date | ISO 8601 |
| Total Amount | ₹ formatted |
| GST Amount | CGST+SGST or IGST breakdown |
| Payment Status | Paid / Unpaid / Partial / Overdue / Disputed |
| Due Date | Calculated from payment terms |
| Acknowledgement Status | Acknowledged / Pending / Rejected |
| Uploaded By | User who uploaded |
| OCR Confidence % | 0–100%, colour coded |
| TCS Applicable? | Yes / No (206C(1H)) |
| Payment Mode | NEFT / RTGS / UPI / IMPS / Cheque |
| GRN Status | Pending / Partial / Full / Damaged / Rejected |
| Branch / Location | If multi-branch enabled |
| Pending Days | Days since invoice date unpaid |

### LEVEL 2 — INVOICE DETAIL SCREEN

#### HEADER — Vendor Information
- Legal Business Name
- Trade Name
- GSTIN (validated)
- PAN
- Address
- State + State Code
- Contact Person, Mobile, Email

#### HEADER — Invoice Information
- Invoice Number
- Invoice Date
- Purchase Order Number (linked)
- E-Way Bill Number
- Delivery Challan Number
- Vehicle Number
- Reverse Charge Applicable? (Y/N)
- Place of Supply
- Payment Terms (Net 30, etc.)
- Calculated Due Date

#### LINE ITEM TABLE

Each row:

| Item | Qty | Unit | HSN | Rate | Discount | Taxable Value | SGST% | SGST₹ | CGST% | CGST₹ | IGST% | IGST₹ | Total |

Extended fields per line item:
- Batch Number
- Serial Number
- Weight (kg)
- Warehouse Allocation
- Project Mapping
- Cost Center Mapping

---

## TAX ENGINE — INDIAN GST

### GST Types Supported
- CGST
- SGST
- IGST
- UTGST
- CESS (on luxury/sin goods)

### Purchase Types
- Intrastate (CGST + SGST)
- Interstate (IGST)
- Import (IGST + Custom Duty)
- SEZ (Zero-rated)
- RCM — Reverse Charge Mechanism

### GST Rule: CGST+SGST vs IGST
> CGST+SGST = buyer and seller in SAME state (intra-state)
> IGST = buyer and seller in DIFFERENT states (inter-state)
> These NEVER coexist on the same invoice line.
> UTGST applies when supply is to Union Territory.

### Validations Required
- GSTIN format: `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}`
- HSN code validation against official HSN master
- GST mismatch detection (calculated vs invoiced)
- Duplicate invoice detection (same vendor + same invoice no)
- Invoice date mismatch (future-dated, pre-GST)
- Tax calculation mismatch (sum of line items ≠ total)
- ITC eligibility check per GSTR-2B

---

## TDS/TCS ENGINE — CORRECT LEGAL IMPLEMENTATION

### ⚠️ CRITICAL: Do NOT hardcode 2% anywhere

### TDS — Section 194Q (BUYER deducts)
- **Rate: 0.1%** (not 2%)
- Triggered when:
  - Buyer's turnover in previous FY > ₹10 crore
  - AND purchases from ONE seller exceed ₹50 lakh in current FY
- Deduction base: amount EXCEEDING ₹50 lakh threshold
- Applied on: taxable value (excluding GST, usually)
- 2% rate applies ONLY if seller has no PAN

### TCS — Section 206C(1H) (SELLER collects from buyer)
- **Rate: 0.1%** (not 2%)
- Seller collects from buyer on sales exceeding ₹50 lakh/FY
- 2% applies only when buyer has no PAN/Aadhaar

### Configurable Tax Rule Table (DB Schema)

```
TaxRule {
  ruleName        string
  section         string   // "194Q" | "206C(1H)"
  thresholdAmount number   // e.g. 5000000 (₹50L)
  rate            number   // e.g. 0.001 (0.1%)
  rateNoPan       number   // e.g. 0.02 (2%)
  effectiveFrom   date
  effectiveTo     date | null
  applicableType  string   // "buyer" | "seller"
  gstTreatment    string   // "exclude" | "include"
  panRequired     boolean
  vendorOverride  boolean  // can vendor have custom rate?
  priority        number
}
```

---

## OCR PIPELINE — 4-STAGE ARCHITECTURE

### Stage 1 — Extraction
Primary: Claude Vision API (currently implemented)
Fallbacks (in order):
1. Google Vision API
2. AWS Textract
3. Azure Form Recognizer
4. Gemini OCR
5. Tesseract (last resort)

### Stage 2 — AI Structuring
LLM converts raw OCR text → structured invoice JSON
Uses MASTER_SYSTEM_PROMPT with IES-specific knowledge
Output schema: fully typed TypeScript interface

### Stage 3 — Validation Engine
Cross-check:
- Line item sum = taxable subtotal
- CGST + SGST total = GST total
- IGST = taxable × rate
- GSTIN format valid
- No duplicate invoice (same vendor + number)
- HSN codes exist in master
- Date is valid and not future-dated

### Stage 4 — Human Verification Layer

| Confidence | Action |
|---|---|
| ≥ 98% | Auto-process, post to ledger |
| 90–97% | Warning shown, user must confirm |
| < 90% | MANDATORY human review, posting LOCKED |

### OCR Failure Handling
If confidence < threshold:
- Lock accounting posting
- Highlight unread / low-confidence fields in RED
- Request user verification field-by-field
- Track all manual corrections in OCR Logs
- Feed corrections back to improve future extraction

---

## GOODS RECEIVED NOTE (GRN) SYSTEM

GRN must be completed before payment is eligible.

### GRN Statuses
- `pending_receipt` — invoice uploaded, goods not yet received
- `partially_received` — partial delivery
- `fully_received` — complete delivery confirmed
- `damaged` — goods received but damaged
- `rejected` — goods rejected, return in progress

### GRN → Payment Gate
Payment eligibility unlocks ONLY when GRN = `fully_received`
Exception: advance payments (pre-GRN, requires extra approval)

---

## PAYMENT SYSTEM — AP AUTOMATION FLOW

```
Invoice Uploaded
  → OCR Processing
  → Validation
  → GRN Confirmation
  → Approval Workflow (Maker → Checker)
  → Payment Scheduling
  → Bank API Execution (ICICI)
  → Ledger Auto-Posting
  → Reconciliation
```

### Payment Actions (on Invoice Detail)
- **Pay Now** — immediate execution (requires authorization)
- **Schedule Payment** — pick date + method
- **Hold** — freeze payment, add reason
- **Partial Payment** — enter amount < total
- **Mark Disputed** — locks invoice, opens dispute thread

### Scheduled Payment Engine
- Due-date based auto-scheduling
- Indian public holiday calendar awareness
- Approval required before release
- Auto-reminder notifications (D-7, D-3, D-1)
- Retry mechanism on bank failure
- Bank reconciliation post-execution

---

## BANK INTEGRATION — ICICI CORPORATE BANKING

### Requirements
- CIB (Corporate Internet Banking) API / Infinity API
- Maker-Checker dual authorization
- Token-based authentication (OAuth2 / API keys)
- Payment methods: UPI / NEFT / RTGS / IMPS

### Vendor Bank Details (Secure Storage)
```
VendorBankAccount {
  accountHolderName  string (encrypted)
  accountNumber      string (encrypted, masked in UI)
  ifscCode           string
  bankName           string
  branchName         string
  upiId              string | null
  cancelledChequeUrl string | null  // S3/secure storage
  verificationStatus enum: unverified | penny_drop_verified | manual_verified
  pennyDropRef       string | null
  auditLog           AuditEntry[]
}
```

### Security
- AES-256 encryption for account numbers
- Only last 4 digits shown in UI
- Full number visible only with MFA
- All access logged to audit trail

---

## FILTER SYSTEM — EXCEL-LIKE STACKED FILTERS

All filters stack simultaneously (AND logic by default, OR available).

### Date Filters
- Today / This Week / This Month / This Quarter / This FY
- Custom date range
- Financial Year selector (Apr–Mar)

### Vendor Filters
- Single vendor search
- Multi-vendor multi-select
- Vendor type (supplier / galvanizer / contractor)

### Financial Filters
- Total amount range (₹ min – ₹ max)
- GST amount range
- Outstanding amount
- TDS deducted range

### Operational Filters
- Payment status: Paid / Unpaid / Partial / Overdue / Disputed
- TDS deducted: Yes / No
- TCS collected: Yes / No
- OCR status: Processed / Pending / Failed / Manual
- Approval status: Approved / Pending / Rejected
- GRN status

### Location Filters (if multi-branch)
- Branch / Location
- Warehouse
- Site / Project

---

## PAYMENTS LEDGER MODULE

Separate from invoice list. One-to-many and many-to-one supported.

### Columns
| Column | Notes |
|---|---|
| Payment Date | Execution date |
| Vendor | Linked to Vendor Master |
| Amount Paid | ₹ |
| Invoice(s) Mapped | Can be multiple |
| UTR Number | Bank reference |
| Bank Reference | Internal ref |
| Payment Method | NEFT/RTGS/UPI/IMPS |
| TDS Deducted | ₹ amount |
| Status | Success / Failed / Pending / Reversed |

---

## ACCOUNTING ENGINE — JOURNAL ENTRIES

### Purchase Entry
```
Dr  Purchase Account            [Taxable Amount]
Dr  Input CGST                  [CGST Amount]
Dr  Input SGST                  [SGST Amount]
Dr  Input IGST (if interstate)  [IGST Amount]
    Cr  Vendor Account          [Invoice Total]
```

### Payment Entry
```
Dr  Vendor Account              [Amount Paid]
    Cr  Bank Account            [Amount Paid - TDS]
    Cr  TDS Payable             [TDS Amount]
```

### RCM Entry
```
Dr  Input CGST (RCM)            [CGST Amount]
Dr  Input SGST (RCM)            [SGST Amount]
    Cr  Output CGST (RCM)       [CGST Amount]
    Cr  Output SGST (RCM)       [SGST Amount]
```

### Accounting Basis
- **Accrual**: Entry at invoice date
- **Cash**: Entry at payment date
- System supports both, selectable per company

---

## GST REPORTING REQUIREMENTS

- GSTR-2B reconciliation (match ITC with supplier filings)
- ITC eligibility auto-check
- Mismatch alerts (our books vs GSTR-2B)
- Monthly GST summary report
- Vendor GST mismatch tracking
- E-Invoice IRN validation via NIC API

---

## EXPORT REQUIREMENTS

Every table/view must support:
- **Excel (.xlsx)** — with formatting, grouped totals
- **CSV** — raw data
- **PDF** — print-ready with company header

Exports preserve:
- Active filters applied
- Column totals + subtotals
- GST breakdown (CGST/SGST/IGST separately)
- Grouped summaries by vendor / month / branch

---

## DATABASE MODULES REQUIRED

```
vendors                 — Vendor Master
vendor_bank_accounts    — Encrypted bank details
invoices                — Purchase invoice header
invoice_line_items      — Per-line item details
invoice_taxes           — Tax breakdown per invoice
purchase_orders         — PO linked to invoice
grn_records             — Goods Receipt Notes
payments                — Payment transactions
payment_invoice_map     — Many-to-many: payments ↔ invoices
bank_accounts           — Company bank accounts
ocr_logs                — Per-extraction OCR metadata + confidence
approval_logs           — Approval workflow history
audit_logs              — Immutable audit trail (all actions)
gst_reconciliation      — GSTR-2B match records
financial_years         — FY config (Apr–Mar)
tds_tcs_rules           — Configurable tax rules
branches                — Multi-branch (optional)
users                   — Role-based access
roles                   — Permission matrix
```

---

## SECURITY REQUIREMENTS

| Requirement | Implementation |
|---|---|
| Role-Based Access | Admin / Accountant / Approver / Viewer |
| Approval Hierarchy | Maker → Checker → CFO (configurable) |
| Audit Logs | Immutable, timestamped, user-tagged |
| Payment Logs | Append-only, never editable |
| Encryption | AES-256 for bank data, TLS in transit |
| MFA | Required for: payments, bank detail edits |
| Session | JWT with refresh, auto-expiry |

---

## INTEGRATIONS ROADMAP

| System | Type | Priority |
|---|---|---|
| ICICI CIB API | Bank payments | Phase 1 |
| NIC e-Invoice API | IRN validation | Phase 1 |
| GST Portal (GSTN) | GSTR-2B pull | Phase 2 |
| TallyPrime | Ledger sync | Phase 2 |
| SAP ERP | Full ERP sync | Phase 3 |
| Oracle NetSuite | Full ERP sync | Phase 3 |
| WhatsApp Business API | Approval flow | Phase 2 |
| Email (SMTP) | Approvals + reminders | Phase 1 |

---

## COMPANY CONTEXT

```
Company:  India Electricals Syndicate (IES)
GSTIN:    19AAAFI6886Q1ZE
State:    West Bengal (Code: 19)
Office:   55 Ezra Street, 2nd Floor, Kolkata-700001
Works W1: 80 Jawpore Road, Kolkata-700074
Works W2: Jalan Industrial Complex, Howrah-711411
Bank:     HDFC Bank, A/C: 12422020001109, IFSC: HDFC0001242
Product:  Hot Dip Galvanised Steel Cable Trays + accessories
Invoice:  IES/{FY}/{4-digit-seq} e.g. IES/25-26/0109
FY:       April to March
```

---

## ENGINEERING PRINCIPLES

1. **Never hardcode tax rates** — all rates in DB, configurable
2. **Never auto-post low-confidence OCR** — human gate required
3. **Never allow payment without GRN** — except advance (extra auth)
4. **All financial writes are append-only** — no hard deletes
5. **All user actions logged** — who, what, when, IP
6. **GST rule: CGST+SGST XOR IGST** — never both on same line
7. **TDS rate is 0.1% (194Q), NOT 2%** — unless no PAN
8. **TCS rate is 0.1% (206C(1H)), NOT 2%** — unless no PAN
9. **Bank details encrypted at rest** — AES-256
10. **Exports preserve active filters** — never dump raw data

---

*This file is the single source of truth for system design.*
*Update it whenever requirements change.*
*Every code change must be consistent with this blueprint.*
