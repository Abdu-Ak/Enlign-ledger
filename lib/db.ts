import { connectDB } from "./mongoose";
import Transaction from "./models/Transaction";
import type { TransactionType, TransactionCategory, FinancialRecord, FinancialSummary } from "./types";

// Re-export so existing consumers (like graphql/route.ts) that import from db still work
export type { TransactionType, TransactionCategory, FinancialRecord, FinancialSummary };


/** Map a Mongoose document to the plain FinancialRecord shape used everywhere */
function toRecord(doc: any): FinancialRecord {
  return {
    id: doc._id.toString(),
    date: doc.date,
    amount: doc.amount,
    category: doc.category,
    type: doc.type,
    purpose: doc.purpose ?? null,
    fileAttachment: doc.fileAttachment ?? null,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : doc.createdAt,
  };
}

/** Read all records, newest date first */
export async function readRecords(): Promise<FinancialRecord[]> {
  await connectDB();
  const docs = await Transaction.find({}).sort({ date: -1, createdAt: -1 }).lean();
  return docs.map(toRecord);
}

/** Create a new transaction record */
export async function writeRecord(
  input: Omit<FinancialRecord, "id" | "createdAt">
): Promise<FinancialRecord> {
  await connectDB();
  const doc = await Transaction.create({
    date: input.date,
    amount: Number(input.amount),
    category: input.category,
    type: input.type,
    purpose: input.purpose ?? null,
    fileAttachment: input.fileAttachment ?? null,
  });
  return toRecord(doc);
}

/** Update an existing transaction record by ID */
export async function updateRecord(
  id: string,
  input: Partial<Omit<FinancialRecord, "id" | "createdAt">>
): Promise<FinancialRecord> {
  await connectDB();
  const doc = await Transaction.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) throw new Error("Record not found");
  return toRecord(doc);
}

/** Delete a transaction record by ID */
export async function deleteRecord(id: string): Promise<boolean> {
  await connectDB();
  const result = await Transaction.findByIdAndDelete(id);
  return result !== null;
}

/** Compute financial summary aggregations from a list of records */
export function getSummaryData(records: FinancialRecord[]): FinancialSummary {
  let totalInflow = 0;
  let totalOutflow = 0;
  let investorCredits = 0;
  let investorDebits = 0;
  let employeeCredits = 0;
  let employeeDebits = 0;
  let totalFeesCollected = 0;
  let totalExpensesPaid = 0;

  for (const record of records) {
    const amount = Number(record.amount) || 0;

    if (record.type === "CREDIT") totalInflow += amount;
    else if (record.type === "DEBIT") totalOutflow += amount;

    switch (record.category) {
      case "INVESTOR":
        if (record.type === "CREDIT") investorCredits += amount;
        else investorDebits += amount;
        break;
      case "EMPLOYEE":
        if (record.type === "CREDIT") employeeCredits += amount;
        else employeeDebits += amount;
        break;
      case "STUDENT_FEE":
        if (record.type === "CREDIT") totalFeesCollected += amount;
        else totalFeesCollected -= amount; // refund
        break;
      case "EXPENSE":
        if (record.type === "DEBIT") totalExpensesPaid += amount;
        else totalExpensesPaid -= amount; // credit refund
        break;
    }
  }

  return {
    globalBalance: totalInflow - totalOutflow,
    totalInflow,
    totalOutflow,
    investorBalance: investorCredits - investorDebits,
    employeeBalance: employeeCredits - employeeDebits,
    totalFeesCollected,
    totalExpensesPaid,
  };
}
