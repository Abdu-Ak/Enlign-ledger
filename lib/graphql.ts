export const GET_ALL_RECORDS_AND_SUMMARY = `
  query GetAll($category: TransactionCategory, $type: TransactionType, $search: String) {
    getRecords(category: $category, type: $type, search: $search) {
      id
      date
      amount
      category
      type
      purpose
      fileAttachment
      createdAt
    }
    getFinancialSummary {
      globalBalance
      totalInflow
      totalOutflow
      investorBalance
      employeeBalance
      totalFeesCollected
      totalExpensesPaid
    }
  }
`;

export const CREATE_RECORD = `
  mutation C(
    $date: String!
    $amount: Float!
    $category: TransactionCategory!
    $type: TransactionType!
    $purpose: String
    $fileAttachment: String
  ) {
    createRecord(
      date: $date
      amount: $amount
      category: $category
      type: $type
      purpose: $purpose
      fileAttachment: $fileAttachment
    ) {
      id
    }
  }
`;

export const UPDATE_RECORD = `
  mutation U(
    $id: ID!
    $date: String
    $amount: Float
    $category: TransactionCategory
    $type: TransactionType
    $purpose: String
    $fileAttachment: String
  ) {
    updateRecord(
      id: $id
      date: $date
      amount: $amount
      category: $category
      type: $type
      purpose: $purpose
      fileAttachment: $fileAttachment
    ) {
      id
    }
  }
`;

export const DELETE_RECORD = `
  mutation D($id: ID!) {
    deleteRecord(id: $id)
  }
`;
