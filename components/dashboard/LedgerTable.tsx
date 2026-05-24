"use client";

import React from "react";
import { FileText, Download, Paperclip, Edit, Trash2 } from "lucide-react";
import { FinancialRecord } from "../../lib/types";
import { fmt, parsePurpose, exportToCSV } from "../../lib/utils";
import {
  Table,
  TableHead,
  Th,
  TableBody,
  Tr,
  Td,
  TableEmpty,
} from "../ui/Table";

interface LedgerTableProps {
  records: FinancialRecord[];
  loading: boolean;
  onPreview: (src: string) => void;
  onEditClick: (rec: FinancialRecord) => void;
  onDeleteClick: (id: string) => void;
}

export default function LedgerTable({
  records,
  loading,
  onPreview,
  onEditClick,
  onDeleteClick,
}: LedgerTableProps) {
  const handleExport = () => {
    exportToCSV(records);
  };

  return (
    <div className="card overflow-hidden" style={{ padding: 0 }}>
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Left side: title + download button side-by-side */}
        <div className="flex items-center gap-2 min-w-0">
          <h2
            className="text-sm font-semibold flex items-center gap-2 min-w-0"
            style={{ color: "var(--text-base)" }}
          >
            <FileText
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--text-muted)" }}
            />
            <span className="hidden md:inline truncate">
              Audit Transaction Ledger
            </span>
            <span className="md:hidden truncate">Transaction Ledger</span>
          </h2>
          {records.length > 0 && (
            <button
              onClick={handleExport}
              title="Export to CSV"
              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors shrink-0"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                background: "var(--surface-2)",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "var(--border)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "var(--surface-2)")
              }
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right side: records badge only */}
        <div className="shrink-0">
          <span className="badge badge-neutral">{records.length} records</span>
        </div>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center gap-3 py-20"
          style={{ color: "var(--text-faint)" }}
        >
          <span className="h-5 w-5 rounded-full border-2 border-current border-t-transparent spin" />
          <span className="text-sm">Loading records…</span>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Party</Th>
                <Th>Direction</Th>
                <Th>Description</Th>
                <Th align="center">Receipt</Th>
                <Th>Amount</Th>
                <Th align="center">Action</Th>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    icon={<FileText className="h-8 w-8" />}
                    title="No records found"
                    description="Adjust filters or log a new transaction"
                  />
                ) : (
                  records.map((rec) => {
                    const { party, desc } = parsePurpose(rec.purpose);
                    const isCredit = rec.type === "CREDIT";
                    return (
                      <Tr key={rec.id} className="group">
                        <Td muted>{rec.date}</Td>
                        <Td>
                          <span className="badge badge-neutral">
                            {rec.category.replace("_", " ")}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className="font-medium"
                            style={{ color: "var(--text-base)" }}
                          >
                            {party}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className={`badge ${isCredit ? "badge-credit" : "badge-debit"}`}
                          >
                            {isCredit ? "Credit (+)" : "Debit (−)"}
                          </span>
                        </Td>
                        <Td
                          muted
                          className="max-w-xs truncate"
                          title={desc || ""}
                        >
                          {desc || "—"}
                        </Td>
                        <Td align="center">
                          {rec.fileAttachment ? (
                            <button
                              onClick={() => onPreview(rec.fileAttachment!)}
                              className="h-7 w-7 rounded-md flex items-center justify-center mx-auto transition-colors"
                              style={{
                                border: "1px solid var(--border)",
                                color: "var(--text-muted)",
                                background: "var(--surface-2)",
                              }}
                              title="View receipt"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span style={{ color: "var(--text-faint)" }}>
                              —
                            </span>
                          )}
                        </Td>
                        <Td>
                          <span
                            className="font-bold"
                            style={{
                              color: isCredit
                                ? "var(--credit)"
                                : "var(--debit)",
                            }}
                          >
                            {isCredit ? "+" : "−"}
                            {fmt(rec.amount)}
                          </span>
                        </Td>
                        <Td align="center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditClick(rec)}
                              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
                              style={{
                                border: "1px solid var(--border)",
                                color: "var(--text-muted)",
                                background: "var(--surface)",
                              }}
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteClick(rec.id)}
                              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
                              style={{
                                border: "1px solid var(--debit-border)",
                                color: "var(--debit)",
                                background: "transparent",
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div
            className="block md:hidden divide-y"
            style={{ borderColor: "var(--border)" }}
          >
            {records.length === 0 ? (
              <div
                className="py-16 text-center text-sm"
                style={{ color: "var(--text-faint)" }}
              >
                No records found
              </div>
            ) : (
              records.map((rec) => {
                const { party, desc } = parsePurpose(rec.purpose);
                const isCredit = rec.type === "CREDIT";
                return (
                  <div key={rec.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-neutral">
                        {rec.category.replace("_", " ")}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {rec.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className="text-xs block mb-0.5"
                          style={{ color: "var(--text-faint)" }}
                        >
                          Party
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-base)" }}
                        >
                          {party}
                        </span>
                      </div>
                      <span
                        className="text-base font-bold"
                        style={{
                          color: isCredit ? "var(--credit)" : "var(--debit)",
                        }}
                      >
                        {isCredit ? "+" : "−"}
                        {fmt(rec.amount)}
                      </span>
                    </div>
                    {desc && (
                      <p
                        className="text-xs px-3 py-2 rounded-md"
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {desc}
                      </p>
                    )}
                    <div
                      className="flex items-center justify-between pt-2"
                      style={{
                        borderTop: "1px solid var(--border)",
                        minHeight: "2.5rem",
                      }}
                    >
                      <div className="flex items-center">
                        {rec.fileAttachment ? (
                          <button
                            onClick={() => onPreview(rec.fileAttachment!)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium h-8 px-2 rounded-md"
                            style={{
                              color: "var(--text-muted)",
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            View Receipt
                          </button>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-faint)" }}
                          >
                            No receipt
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditClick(rec)}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md"
                          style={{
                            color: "var(--text-muted)",
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteClick(rec.id)}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-md"
                          style={{
                            color: "var(--debit)",
                            background: "var(--debit-bg)",
                            border: "1px solid var(--debit-border)",
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
