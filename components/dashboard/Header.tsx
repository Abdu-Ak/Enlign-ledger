"use client";

import React from "react";
import { FileText, Lock } from "lucide-react";

interface HeaderProps {
  onLock: () => void;
}

export default function Header({ onLock }: HeaderProps) {
  return (
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
            onClick={onLock}
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
  );
}
