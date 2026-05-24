import { NextRequest, NextResponse } from "next/server";
import { graphql, buildSchema } from "graphql";
import { readRecords, writeRecord, deleteRecord, getSummaryData, updateRecord } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Define the schema using official buildSchema
const schemaSource = `
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
    fileAttachment: String
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
    
    updateRecord(
      id: ID!
      date: String
      amount: Float
      category: TransactionCategory
      type: TransactionType
      purpose: String
      fileAttachment: String
    ): FinancialRecord!
    
    deleteRecord(id: ID!): Boolean!
  }
`;

const schema = buildSchema(schemaSource);

// Define resolvers matching the API requirements
const rootValue = {
  getRecords: async ({
    category,
    type,
    search,
  }: {
    category?: string;
    type?: string;
    search?: string;
  }) => {
    let records = await readRecords();

    if (category) {
      records = records.filter((r) => r.category === category);
    }

    if (type) {
      records = records.filter((r) => r.type === type);
    }

    if (search) {
      const s = search.toLowerCase();
      records = records.filter(
        (r) =>
          (r.purpose && r.purpose.toLowerCase().includes(s)) ||
          r.category.toLowerCase().includes(s)
      );
    }

    return records;
  },

  getFinancialSummary: async () => {
    const records = await readRecords();
    return getSummaryData(records);
  },

  createRecord: async ({
    date,
    amount,
    category,
    type,
    purpose,
    fileAttachment,
  }: {
    date: string;
    amount: number;
    category: "INVESTOR" | "EMPLOYEE" | "STUDENT_FEE" | "EXPENSE";
    type: "CREDIT" | "DEBIT";
    purpose?: string | null;
    fileAttachment?: string | null;
  }) => {
    // 1. Upload Base64 attachment to Cloudinary if it exists, falling back to local Base64
    let finalAttachment = null;
    if (fileAttachment) {
      finalAttachment = await uploadToCloudinary(fileAttachment);
    }

    // 2. Save financial transaction record
    const savedRecord = await writeRecord({
      date,
      amount: Number(amount),
      category,
      type,
      purpose: purpose || null,
      fileAttachment: finalAttachment,
    });

    return savedRecord;
  },

  updateRecord: async ({
    id,
    date,
    amount,
    category,
    type,
    purpose,
    fileAttachment,
  }: {
    id: string;
    date?: string;
    amount?: number;
    category?: "INVESTOR" | "EMPLOYEE" | "STUDENT_FEE" | "EXPENSE";
    type?: "CREDIT" | "DEBIT";
    purpose?: string | null;
    fileAttachment?: string | null;
  }) => {
    let finalAttachment = undefined;
    if (fileAttachment) {
      if (fileAttachment.startsWith("data:")) {
        finalAttachment = await uploadToCloudinary(fileAttachment);
      } else {
        finalAttachment = fileAttachment;
      }
    } else if (fileAttachment === null) {
      finalAttachment = null;
    }

    const savedRecord = await updateRecord(id, {
      ...(date !== undefined && { date }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(category !== undefined && { category }),
      ...(type !== undefined && { type }),
      ...(purpose !== undefined && { purpose: purpose }),
      ...(finalAttachment !== undefined && { fileAttachment: finalAttachment }),
    });

    return savedRecord;
  },

  deleteRecord: async ({ id }: { id: string }) => {
    return await deleteRecord(id);
  },
};

// Route Handler POST Method
export async function POST(req: NextRequest) {
  try {
    const { query, variables } = await req.json();

    if (!query) {
      return NextResponse.json(
        { errors: [{ message: "GraphQL query is required." }] },
        { status: 400 }
      );
    }

    // Execute graphql query
    const response = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("GraphQL request processing error:", error);
    return NextResponse.json(
      {
        errors: [
          { message: error.message || "An internal error occurred executing query." },
        ],
      },
      { status: 500 }
    );
  }
}
