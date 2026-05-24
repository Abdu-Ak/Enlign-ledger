"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onCancel} aria-hidden="true" />

      <div className="dialog-panel relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 h-7 w-7 rounded-md flex items-center justify-center text-text-faint hover:text-text-muted hover:bg-surface-2 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-3.5">
            <div
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: isDanger ? "var(--debit-bg)" : "#eff6ff",
                border: `1px solid ${isDanger ? "var(--debit-border)" : "#bfdbfe"}`,
              }}
            >
              {isDanger ? (
                <AlertTriangle
                  className="h-4.5 w-4.5"
                  style={{ color: "var(--debit)" }}
                />
              ) : (
                <Info className="h-4.5 w-4.5" style={{ color: "#3b82f6" }} />
              )}
            </div>

            <div className="pt-0.5 flex-1">
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-base)" }}
              >
                {title}
              </h2>
              <p
                className="text-sm mt-1 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {message}
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4">
                <button onClick={onCancel} disabled={loading} className="btn-ghost" style={{ height: 36, fontSize: "0.75rem" }}>
                  {cancelLabel}
                </button>

                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={isDanger ? "btn-danger" : "btn-primary"}
                  style={{ height: 36, fontSize: "0.75rem" }}
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white spin" />
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
