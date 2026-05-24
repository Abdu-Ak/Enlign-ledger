export interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  category: "INVESTOR" | "EMPLOYEE" | "STUDENT_FEE" | "EXPENSE";
  type: "CREDIT" | "DEBIT";
  purpose?: string | null;
  fileAttachment?: string | null;
  createdAt: string;
}

export interface FinancialSummary {
  globalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  investorBalance: number;
  employeeBalance: number;
  totalFeesCollected: number;
  totalExpensesPaid: number;
}
