export type TransactionType = "CREDIT" | "DEBIT";
export type TransactionCategory = "INVESTOR" | "EMPLOYEE" | "STUDENT_FEE" | "EXPENSE";

export interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
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
