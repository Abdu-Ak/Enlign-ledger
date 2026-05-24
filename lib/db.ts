import fs from "fs";
import path from "path";

// Define the standard Transaction Type and Category enums matching the GraphQL Schema
export type TransactionType = "CREDIT" | "DEBIT";
export type TransactionCategory = "INVESTOR" | "EMPLOYEE" | "STUDENT_FEE" | "EXPENSE";

export interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  purpose?: string | null;
  fileAttachment?: string | null; // Cloudinary URL or local base64 fallback string
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

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "ledger.json");

// Safely ensure data directory and file exist
function ensureDatabaseInit() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), "utf8");
  }
}

// Read all records from the ledger file
export async function readRecords(): Promise<FinancialRecord[]> {
  ensureDatabaseInit();
  try {
    const data = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(data) as FinancialRecord[];
  } catch (error) {
    console.error("Error reading financial records database file:", error);
    return [];
  }
}

// Write a new record to the ledger
export async function writeRecord(
  input: Omit<FinancialRecord, "id" | "createdAt">
): Promise<FinancialRecord> {
  ensureDatabaseInit();
  const records = await readRecords();

  const newRecord: FinancialRecord = {
    ...input,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  records.push(newRecord);
  
  // Sort records by date descending (newest first) by default
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
    return newRecord;
  } catch (error) {
    console.error("Error writing new financial record:", error);
    throw new Error("Failed to write transaction record to ledger.");
  }
}

// Update a record in the ledger
export async function updateRecord(
  id: string,
  input: Partial<Omit<FinancialRecord, "id" | "createdAt">>
): Promise<FinancialRecord> {
  ensureDatabaseInit();
  const records = await readRecords();
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error("Record not found");
  }

  const updatedRecord: FinancialRecord = {
    ...records[index],
    ...input,
  };

  records[index] = updatedRecord;

  // Sort records by date descending (newest first) by default
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
    return updatedRecord;
  } catch (error) {
    console.error("Error updating financial record:", error);
    throw new Error("Failed to update transaction record in ledger.");
  }
}

// Delete a record from the ledger
export async function deleteRecord(id: string): Promise<boolean> {
  ensureDatabaseInit();
  const records = await readRecords();
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) {
    return false;
  }

  records.splice(index, 1);

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error deleting financial record:", error);
    return false;
  }
}

// Compute the global ledger balance aggregations
export function getSummaryData(records: FinancialRecord[]): FinancialSummary {
  let totalInflow = 0; // sum of all CREDITS
  let totalOutflow = 0; // sum of all DEBITS
  
  let investorCredits = 0;
  let investorDebits = 0;
  
  let employeeCredits = 0;
  let employeeDebits = 0;
  
  let totalFeesCollected = 0; // net fees, or just credits
  let totalExpensesPaid = 0;  // net expenses, or just debits

  for (const record of records) {
    const amount = Number(record.amount) || 0;
    
    // Calculate inflow/outflow
    if (record.type === "CREDIT") {
      totalInflow += amount;
    } else if (record.type === "DEBIT") {
      totalOutflow += amount;
    }

    // Category breakdown logic
    switch (record.category) {
      case "INVESTOR":
        if (record.type === "CREDIT") investorCredits += amount;
        if (record.type === "DEBIT") investorDebits += amount;
        break;
      case "EMPLOYEE":
        if (record.type === "CREDIT") employeeCredits += amount;
        if (record.type === "DEBIT") employeeDebits += amount;
        break;
      case "STUDENT_FEE":
        // Primarily CREDIT
        if (record.type === "CREDIT") {
          totalFeesCollected += amount;
        } else {
          totalFeesCollected -= amount; // Handling student fee refunds
        }
        break;
      case "EXPENSE":
        // Primarily DEBIT
        if (record.type === "DEBIT") {
          totalExpensesPaid += amount;
        } else {
          totalExpensesPaid -= amount; // Handling credit expense refunds
        }
        break;
    }
  }

  const globalBalance = totalInflow - totalOutflow;
  const investorBalance = investorCredits - investorDebits;
  const employeeBalance = employeeCredits - employeeDebits;

  return {
    globalBalance,
    totalInflow,
    totalOutflow,
    investorBalance,
    employeeBalance,
    totalFeesCollected,
    totalExpensesPaid,
  };
}
