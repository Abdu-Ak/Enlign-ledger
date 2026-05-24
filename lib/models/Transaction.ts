import mongoose, { Schema, Document, Model } from "mongoose";
import type { TransactionType, TransactionCategory } from "../types";

export interface ITransaction extends Document {
  date: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  purpose?: string | null;
  fileAttachment?: string | null;
  createdAt: string;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: ["INVESTOR", "EMPLOYEE", "STUDENT_FEE", "EXPENSE"],
      required: true,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    purpose: { type: String, default: null },
    fileAttachment: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

// Indexes for efficient filtering by common query patterns
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ createdAt: -1 });

// Prevent model re-compilation on hot reload
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
