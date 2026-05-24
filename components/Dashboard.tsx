"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import StatCards from "./dashboard/StatCards";
import TransactionModal, {
  TransactionFormValues,
} from "./dashboard/TransactionModal";
import AttachmentViewer from "./dashboard/AttachmentViewer";
import ConfirmDialog from "./ui/ConfirmDialog";

// Shared Types & Utilities
import { FinancialRecord, FinancialSummary } from "../lib/types";
import { GQL, parsePurpose } from "../lib/utils";
import {
  GET_ALL_RECORDS_AND_SUMMARY,
  CREATE_RECORD,
  UPDATE_RECORD,
  DELETE_RECORD,
} from "../lib/graphql";

// Subcomponents
import Header from "./dashboard/Header";
import FilterToolbar from "./dashboard/FilterToolbar";
import LedgerTable from "./dashboard/LedgerTable";

interface DashboardProps {
  onLogout: () => void;
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

export default function Dashboard({ onLogout }: DashboardProps) {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          query: GET_ALL_RECORDS_AND_SUMMARY,
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
        query: CREATE_RECORD,
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
        query: UPDATE_RECORD,
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
        query: DELETE_RECORD,
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
    try {
      await fetch("/api/auth", { method: "DELETE" });
      onLogout();
    } catch {
      setActionLoading(false);
      setConfirmLock(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Header subcomponent */}
      <Header onLock={() => setConfirmLock(true)} />

      {/* Main content grid */}
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

        {/* Filter subcomponent */}
        <FilterToolbar
          search={search}
          setSearch={setSearch}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          onLogNew={() => {
            setEditingRecord(null);
            setFormError(null);
            setModalOpen(true);
          }}
        />

        {/* LedgerTable subcomponent */}
        <LedgerTable
          records={records}
          loading={loading}
          onPreview={setPreview}
          onEditClick={handleEditClick}
          onDeleteClick={setConfirmDelete}
        />
      </main>

      <footer
        className="py-4 text-center text-xs animate-fade-in"
        style={{
          color: "var(--text-faint)",
          borderTop: "1px solid var(--border)",
        }}
      >
        Enlighn Learning Hub · Secure Admin Terminal
      </footer>

      {/* Modals & Dialogs */}
      {modalOpen && (
        <TransactionModal
          onClose={() => {
            setModalOpen(false);
            setEditingRecord(null);
          }}
          onSubmit={editingRecord ? handleEditSubmit : handleFormSubmit}
          serverError={formError}
          isEdit={!!editingRecord}
          initialFileAttachment={editingRecord?.fileAttachment}
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
