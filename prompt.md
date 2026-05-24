# System Specification & Project Prompt: Institutional Finance Tracker (Next.js, Tailwind, GraphQL)

## 1. Project Overview & System Intent
The objective is to build a high-fidelity, self-contained **Institutional Finance Tracker** web application. The system serves as a unified financial ledger for an educational institution, tracking capital inflows from multiple streams and outflows via expenses. It computes real-time global liquidity metrics, maintains historical transaction records, and allows administrative staff to manage entries through a sleek, unified dashboard.

### Core Architecture Stack
- **Frontend Framework:** Next.js (App Router, React 19 compliance, Server Actions or client-side operations).
- **Styling Engine:** Tailwind CSS (Modern, dark-theme first, utilizing a highly polished, clean administrative interface inspired by sophisticated vault/security dashboards).
- **Data Layer & API:** GraphQL (Queries and mutations optimized for single-record ledgers and dynamic aggregations).
- **State & Component Library:** Custom Tailwind-styled Radix UI primitives or Lucide React icons for a professional dashboard aesthetic.

## 2. Financial Logic & Domain Model
The application tracks a unified ledger where money flows into or out of the institution. The system must support **four primary transaction categories**, classified under two transactional directions (`CREDIT` or `DEBIT`).

### Cash Inflow / Outflow Vectors
1. **Investors (`investor`):** 
   - *Credit:* Investors injecting capital into the institute.
   - *Debit:* Investors withdrawing capital from the institute.
2. **Employees (`employee`):** 
   - *Credit:* Employees loaning or investing internal funds into the institute.
   - *Debit:* Employees withdrawing their internal funds/capital.
3. **Student Fees (`student_fee`):**
   - *Credit:* Revenue collected from student tuitions, materials, or registrations.
   - *Debit:* N/A (or processing refunds if explicitly flagged, though primarily Credit).
4. **Institutional Expenses (`expense`):**
   - *Debit:* Operational costs, utilities, infrastructure, salaries, marketing, and miscellaneous spends.

### Global Financial Formulae
The system must dynamically compute and display the **Global Financial Metrics** at the top of the dashboard based on the sum of all records:
- **Total Inflow (Credits):** Sum of all Amounts where type = CREDIT
- **Total Outflow (Debits):** Sum of all Amounts where type = DEBIT
- **Global Institutional Balance (Liquidity Pool):** Total Inflow - Total Outflow

---

## 3. UI/UX Design System (Theme & Styling Guidelines)
The application must adhere to a dark, high-contrast, premium aesthetic reminiscent of modern security vaults and financial analytics terminals (e.g., *Boot Vault* aesthetics).

### Color Palette & Visual Accents
- **Primary Canvas Background:** Dark Charcoal / Near Black (`#0a0a0c`, `#111114`)
- **Card & Surface Containers:** Elevated Muted Slate (`#17171c`, `#1e1e24`)
- **Borders & Dividers:** Thin, razor-sharp borders using low-opacity zinc (`border-zinc-800` or `rgba(255,255,255,0.08)`)
- **Typography:** Sans-serif high-readability stack (Inter, Geist, or SF Pro). 
  - Text primary: Pure White (`#ffffff`) or Off-White (`#f4f4f5`)
  - Text secondary: Muted Gray (`#a1a1aa` or `#71717a`)
- **Action Accents:** 
  - Credits / Inflows: Soft emerald green (`#10b981` / `text-emerald-400`)
  - Debits / Outflows: Crisp rose red (`#f43f5e` / `text-rose-400`)
  - Focus interactive elements: Indigo/Violet neon or sharp white outlines.

### Component Design Specifications
- **Login Screen:** Clean, centered minimalist box containing an administrative access panel with an isolated password matrix. No username required. Modeled exactly like the theme and component structure of `https://boot-vault.vercel.app/admin/login`.
- **Form Fields:** Inset text areas, subtle focus transitions, hidden file-input wrappers utilizing stylized button triggers.
- **Data Tables:** Dense layout, crisp alignment, pagination, and colored indicators matching the transaction direction (`+` green for credits, `-` red for debits).

---

## 4. Feature Requirements & User Stories

### Feature 1: Static Administrative Access Gate (Static Login)
- **Requirement:** Access to the financial tracker must be guarded by a static password verification mechanism.
- **Workflow:** 
  - The default landing page checks for a local/session cookie or client state indicating successful authentication.
  - If unauthenticated, the user is locked out and presented with a pristine login card containing a single password input field.
  - The input is checked against a static environment variable (`ADMIN_TRACKER_PASSWORD`). No external OAuth, database user tables, or third-party identity providers are required.

### Feature 2: Unified Financial Metrics Dashboard
- **Requirement:** A real-time executive dashboard presenting administrative summary cards.
- **Cards Needed:**
  - **Global Wallet Balance:** Big bold currency number showing net institutional cash.
  - **Investor Pool Value:** Net investor funds currently held (Investor Credits - Investor Debits).
  - **Employee Internal Ledger:** Net employee capital balance (Employee Credits - Employee Debits).
  - **Cumulative Revenue & Spend:** Quick metrics showing total fees collected vs total operations expenses.

### Feature 3: Universal Transaction Entry Engine (Form Modal)
- **Requirement:** An intuitive creation form to log records instantly.
- **Input Fields & Constraints:**
  1. **Date:** Calendar datepicker component (`Required`). Defaults to current date.
  2. **Amount:** Positive floating-point number (`Required`).
  3. **Source Category:** Dropdown selection containing `Investor`, `Employee`, `Student Fee`, or `Expense` (`Required`).
  4. **Transaction Type:** Toggle switch or segmented control selection for `CREDIT` (Inflow/Deposit) or `DEBIT` (Outflow/Withdrawal) (`Required`).
  5. **Purpose/Description:** Textarea input for contextual logs (`Optional`).
  6. **Attachment/Reference Upload:** File attachment interface mapping to image screenshots or receipt PDFs (`Optional`). Encoded as Base64 text string or handled via binary upload to preserve records.

### Feature 4: Interactive Historical Audit Ledger (Data Table)
- **Requirement:** A robust table filtering, sorting, and listing every historical financial action.
- **Columns:** Date, Category, Type, Purpose, Reference Attachment Indicator, Amount.
- **Interactive Controls:**
  - Dynamic filters to view only specific categories (e.g., Show only `Student Fee`).
  - Search bar to parse text strings inside the Purpose column.
  - Visual attachment viewer: Clicking a row with an attachment reveals the screenshot/file preview inside a modal or drawer.

---

## 5. Technical Architecture & Implementation Blueprint

### GraphQL Schema Definition (`schema.graphql`)
```graphql
enum TransactionType {
  CREDIT
  DEBIT
}

enum TransactionCategory {
  INVESTOR
  EMPLOYEE
  STUDENT_FEE
  EXPENSE
}

type FinancialRecord {
  id: ID!
  date: String!
  amount: Float!
  category: TransactionCategory!
  type: TransactionType!
  purpose: String
  fileAttachment: String # Base64 encoded data URI or URL string
  createdAt: String!
}

type FinancialSummary {
  globalBalance: Float!
  totalInflow: Float!
  totalOutflow: Float!
  investorBalance: Float!
  employeeBalance: Float!
  totalFeesCollected: Float!
  totalExpensesPaid: Float!
}

type Query {
  getRecords(category: TransactionCategory, type: TransactionType, search: String): [FinancialRecord!]!
  getFinancialSummary: FinancialSummary!
}

type Mutation {
  createRecord(
    date: String!
    amount: Float!
    category: TransactionCategory!
    type: TransactionType!
    purpose: String
    fileAttachment: String
  ): FinancialRecord!
  
  deleteRecord(id: ID!): Boolean!
}