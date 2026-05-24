"use client";

import React from "react";
import { Search, Plus, RefreshCw } from "lucide-react";
import CustomSelect from "../ui/CustomSelect";
import TextField from "../ui/TextField";

interface FilterToolbarProps {
  search: string;
  setSearch: (v: string) => void;
  catFilter: string;
  setCatFilter: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  onLogNew: () => void;
}

export const FILTER_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "INVESTOR", label: "Investor" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "STUDENT_FEE", label: "Student Fee" },
  { value: "EXPENSE", label: "Expense" },
];

export const FILTER_TYPE_OPTIONS = [
  { value: "ALL", label: "All Directions" },
  { value: "CREDIT", label: "Credit" },
  { value: "DEBIT", label: "Debit" },
];

export default function FilterToolbar({
  search,
  setSearch,
  catFilter,
  setCatFilter,
  typeFilter,
  setTypeFilter,
  onLogNew,
}: FilterToolbarProps) {
  const hasActiveFilters =
    search.trim() !== "" || catFilter !== "ALL" || typeFilter !== "ALL";

  const handleClearFilters = () => {
    setSearch("");
    setCatFilter("ALL");
    setTypeFilter("ALL");
  };

  return (
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
              onClick={handleClearFilters}
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
          onClick={onLogNew}
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
            onClick={handleClearFilters}
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
            onClick={onLogNew}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Log New Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
