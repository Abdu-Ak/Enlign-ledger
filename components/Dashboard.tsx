"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  Paperclip,
  Lock,
  RefreshCw,
  FileText,
  AlertCircle,
  Edit,
  Download,
} from "lucide-react";
import StatCards from "./dashboard/StatCards";
import TransactionModal, {
  TransactionFormValues,
} from "./dashboard/TransactionModal";
import AttachmentViewer from "./dashboard/AttachmentViewer";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
  Table,
  TableHead,
  Th,
  TableBody,
  Tr,
  Td,
  TableEmpty,
} from "./ui/Table";
import CustomSelect from "./ui/CustomSelect";
import TextField from "./ui/TextField";

interface DashboardProps {
  onLogout: () => void;
}

interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  category: "INVESTOR" | "EMPLOYEE" | "STUDENT_FEE" | "EXPENSE";
  type: "CREDIT" | "DEBIT";
  purpose?: string | null;
  fileAttachment?: string | null;
  createdAt: string;
}

interface FinancialSummary {
  globalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  investorBalance: number;
  employeeBalance: number;
  totalFeesCollected: number;
  totalExpensesPaid: number;
}

const EMPTY_SUMMARY: FinancialSummary = {
  globalBalance: 0,
  totalInflow: 0,
  totalOutflow: 0,
  investorBalance: 0,
  employeeBalance: 0,
  totalFeesCollected: 0,
  totalExpensesPaid: 0,
};

const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);

const parsePurpose = (s?: string | null) => {
  if (!s) return { party: "—", desc: "" };
  const m = s.match(/^\[(.*?)\]\s*(.*)$/);
  return m ? { party: m[1], desc: m[2] } : { party: "—", desc: s };
};

const GQL = (body: object) =>
  fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const FILTER_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "INVESTOR", label: "Investor" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "STUDENT_FEE", label: "Student Fee" },
  { value: "EXPENSE", label: "Expense" },
];

const FILTER_TYPE_OPTIONS = [
  { value: "ALL", label: "All Directions" },
  { value: "CREDIT", label: "Credit" },
  { value: "DEBIT", label: "Debit" },
];

export default function Dashboard({ onLogout }: DashboardProps) {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmLock, setConfirmLock] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(
    null,
  );

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
          " · " +
          d.toLocaleTimeString("en-US", { hour12: false }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(
    async (silent = false) => {
      silent ? setRefreshing(true) : setLoading(true);
      setError(null);
      const vars: Record<string, string> = {};
      if (catFilter !== "ALL") vars.category = catFilter;
      if (typeFilter !== "ALL") vars.type = typeFilter;
      if (search.trim()) vars.search = search.trim();
      try {
        const json = await GQL({
          query: `query GetAll($category:TransactionCategory,$type:TransactionType,$search:String){
          getRecords(category:$category,type:$type,search:$search){id date amount category type purpose fileAttachment createdAt}
          getFinancialSummary{globalBalance totalInflow totalOutflow investorBalance employeeBalance totalFeesCollected totalExpensesPaid}
        }`,
          variables: vars,
        });
        if (json.errors) throw new Error(json.errors[0].message);
        setRecords(json.data.getRecords ?? []);
        setSummary(json.data.getFinancialSummary ?? EMPTY_SUMMARY);
      } catch (e: any) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [catFilter, typeFilter, search],
  );

  useEffect(() => {
    fetchData();
  }, [catFilter, typeFilter]);
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 420);
    return () => clearTimeout(t);
  }, [search]);

  const handleFormSubmit = async (
    data: TransactionFormValues,
    fileBase64: string | null,
  ) => {
    setFormError(null);
    let finalPurpose = data.purpose ?? "";
    if (data.partyName?.trim())
      finalPurpose = `[${data.partyName.trim()}] ${finalPurpose}`;
    try {
      const json = await GQL({
        query: `mutation C($date:String!,$amount:Float!,$category:TransactionCategory!,$type:TransactionType!,$purpose:String,$fileAttachment:String){
          createRecord(date:$date,amount:$amount,category:$category,type:$type,purpose:$purpose,fileAttachment:$fileAttachment){id}
        }`,
        variables: {
          date: data.date,
          amount: data.amount,
          category: data.category,
          type: data.type,
          purpose: finalPurpose,
          fileAttachment: fileBase64,
        },
      });
      if (json.errors) throw new Error(json.errors[0].message);
      setModalOpen(false);
      fetchData(true);
    } catch (e: any) {
      setFormError(e.message || "Failed to save transaction");
      throw e;
    }
  };

  const handleEditClick = (rec: FinancialRecord) => {
    setEditingRecord(rec);
    setModalOpen(true);
  };

  const handleEditSubmit = async (
    data: TransactionFormValues,
    fileBase64: string | null,
  ) => {
    if (!editingRecord) return;
    setFormError(null);
    let finalPurpose = data.purpose ?? "";
    if (data.partyName?.trim())
      finalPurpose = `[${data.partyName.trim()}] ${finalPurpose}`;
    try {
      const json = await GQL({
        query: `mutation U($id:ID!,$date:String,$amount:Float,$category:TransactionCategory,$type:TransactionType,$purpose:String,$fileAttachment:String){
          updateRecord(id:$id,date:$date,amount:$amount,category:$category,type:$type,purpose:$purpose,fileAttachment:$fileAttachment){id}
        }`,
        variables: {
          id: editingRecord.id,
          date: data.date,
          amount: data.amount,
          category: data.category,
          type: data.type,
          purpose: finalPurpose,
          fileAttachment: fileBase64,
        },
      });
      if (json.errors) throw new Error(json.errors[0].message);
      setModalOpen(false);
      setEditingRecord(null);
      fetchData(true);
    } catch (e: any) {
      setFormError(e.message || "Failed to update transaction");
      throw e;
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      const json = await GQL({
        query: `mutation D($id:ID!){deleteRecord(id:$id)}`,
        variables: { id: confirmDelete },
      });
      if (json.errors) throw new Error(json.errors[0].message);
      fetchData(true);
    } catch (e: any) {
      setError(e.message || "Failed to delete record");
    } finally {
      setActionLoading(false);
      setConfirmDelete(null);
    }
  };

  const doLock = async () => {
    setActionLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      onLogout();
    } catch {
      setActionLoading(false);
      setConfirmLock(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Category",
      "Party",
      "Direction",
      "Description",
      "Amount (INR)",
    ];
    const rows = records.map((rec) => {
      const { party, desc } = parsePurpose(rec.purpose);
      return [
        rec.date,
        rec.category.replace(/_/g, " "),
        party === "—" ? "" : party,
        rec.type,
        desc || "",
        rec.type === "CREDIT" ? rec.amount : -rec.amount,
      ];
    });
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enlign-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    search.trim() !== "" || catFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="mx-auto max-w-7xl px-3 md:px-8 h-14 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-sm font-bold truncate"
                style={{ color: "var(--text-base)" }}
              >
                Enlighn Learning Hub
              </h1>
              <p
                className="text-xs flex items-center gap-1.5 truncate"
                style={{ color: "var(--text-faint)" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500 inline-block pulse-led" />
                <span className="hidden sm:inline">System Running</span>
                <span className="sm:hidden">Live</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmLock(true)}
              className="flex items-center gap-1.5 h-9 px-3 md:px-4 rounded-md text-xs font-semibold transition-colors"
              style={{
                border: "1px solid var(--debit-border)",
                background: "var(--debit-bg)",
                color: "var(--debit)",
              }}
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock Session</span>
              <span className="sm:hidden">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-8 py-6 space-y-6">
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg text-sm"
            style={{
              background: "var(--debit-bg)",
              border: "1px solid var(--debit-border)",
              color: "var(--debit)",
            }}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <StatCards summary={summary} loading={loading} />

        {/* Filters */}
        <div className="card p-4 flex flex-col gap-3">
          {/* ── MOBILE layout (hidden on md+) ─────────────────────── */}
          <div className="md:hidden flex flex-col gap-3">
            {/* Row 1: Search + refresh reset button */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextField
                  id="search"
                  label=""
                  placeholder="Search purpose or party..."
                  prefix={<Search className="h-3.5 w-3.5" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCatFilter("ALL");
                    setTypeFilter("ALL");
                  }}
                  title="Reset filters"
                  style={{
                    height: 40,
                    width: 40,
                    border: "1.5px dashed var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                    borderRadius: "var(--radius)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Row 2: Two selects side by side */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CustomSelect
                  id="catFilter"
                  options={FILTER_CATEGORY_OPTIONS}
                  value={catFilter}
                  onChange={setCatFilter}
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  id="typeFilter"
                  options={FILTER_TYPE_OPTIONS}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
              </div>
            </div>
            {/* Row 3: Add button full width */}
            <button
              onClick={() => {
                setEditingRecord(null);
                setFormError(null);
                setModalOpen(true);
              }}
              className="btn-primary w-full"
            >
              <Plus className="h-4 w-4" />
              Log New Transaction
            </button>
          </div>

          {/* ── DESKTOP layout (hidden below md) ─────────────────── */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <div style={{ width: 240, flexShrink: 0 }}>
              <TextField
                id="search-desktop"
                label=""
                placeholder="Search purpose or party..."
                prefix={<Search className="h-3.5 w-3.5" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1" style={{ maxWidth: 200 }}>
              <CustomSelect
                id="catFilter-d"
                options={FILTER_CATEGORY_OPTIONS}
                value={catFilter}
                onChange={setCatFilter}
              />
            </div>
            <div className="flex-1" style={{ maxWidth: 200 }}>
              <CustomSelect
                id="typeFilter-d"
                options={FILTER_TYPE_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setCatFilter("ALL");
                  setTypeFilter("ALL");
                }}
                className="btn-ghost flex items-center gap-1.5 text-xs transition-colors shrink-0"
                style={{
                  border: "1.5px dashed var(--border)",
                  height: 40,
                  fontSize: "0.75rem",
                  borderRadius: "var(--radius)",
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setFormError(null);
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Log New Transaction
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
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
                <FileText className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="hidden md:inline truncate">Audit Transaction Ledger</span>
                <span className="md:hidden truncate">Transaction Ledger</span>
              </h2>
              {records.length > 0 && (
                <button
                  onClick={exportToCSV}
                  title="Export to CSV"
                  className="h-7 w-7 rounded-md flex items-center justify-center transition-colors shrink-0"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    background: "var(--surface-2)",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--border)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
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
                    <Th align="right">Amount</Th>
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
                                  onClick={() =>
                                    setPreview(rec.fileAttachment!)
                                  }
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
                            <Td align="right">
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
                                  onClick={() => handleEditClick(rec)}
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
                                  onClick={() => setConfirmDelete(rec.id)}
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
                              color: isCredit
                                ? "var(--credit)"
                                : "var(--debit)",
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
                                onClick={() => setPreview(rec.fileAttachment!)}
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
                              onClick={() => handleEditClick(rec)}
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
                              onClick={() => setConfirmDelete(rec.id)}
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
      </main>

      <footer
        className="py-4 text-center text-xs"
        style={{
          color: "var(--text-faint)",
          borderTop: "1px solid var(--border)",
        }}
      >
        Enlighn Learning Hub · Secure Admin Terminal
      </footer>

      {/* Modals */}
      {modalOpen && (
        <TransactionModal
          onClose={() => {
            setModalOpen(false);
            setEditingRecord(null);
          }}
          onSubmit={editingRecord ? handleEditSubmit : handleFormSubmit}
          serverError={formError}
          isEdit={!!editingRecord}
          initialValues={
            editingRecord
              ? {
                  date: editingRecord.date,
                  amount: editingRecord.amount,
                  category: editingRecord.category,
                  type: editingRecord.type,
                  partyName:
                    parsePurpose(editingRecord.purpose).party === "—"
                      ? ""
                      : parsePurpose(editingRecord.purpose).party,
                  purpose: parsePurpose(editingRecord.purpose).desc,
                }
              : undefined
          }
        />
      )}
      {preview && (
        <AttachmentViewer src={preview} onClose={() => setPreview(null)} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        variant="danger"
        title="Delete Transaction"
        message="This record will be permanently removed from the ledger. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={actionLoading}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        isOpen={confirmLock}
        variant="info"
        title="Lock Session"
        message="Are you sure you want to lock the dashboard? You will need to sign in again to access it."
        confirmLabel="Lock"
        cancelLabel="Cancel"
        loading={actionLoading}
        onConfirm={doLock}
        onCancel={() => setConfirmLock(false)}
      />
    </div>
  );
}
