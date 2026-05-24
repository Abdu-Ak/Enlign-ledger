"use client";
import React from "react";
import { Download, X } from "lucide-react";

interface Props {
  src: string;
  onClose: () => void;
}

export default function AttachmentViewer({ src, onClose }: Props) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const isPdf = src.startsWith("data:application/pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-3xl flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-base)" }}
            >
              Receipt Preview
            </span>
            <a
              href={src}
              download="receipt"
              title="Download receipt"
              className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                background: "var(--surface-2)",
              }}
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: "var(--text-faint)", background: "transparent" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Content */}
        <div
          className="flex-1 flex items-center justify-center overflow-auto p-4"
          style={{ minHeight: 300 }}
        >
          {isPdf ? (
            <iframe
              src={src}
              className="w-full rounded"
              style={{ height: "60vh", border: "none" }}
              title="PDF"
            />
          ) : (
            <img
              src={src}
              alt="Receipt"
              className="max-w-full rounded"
              style={{ maxHeight: "60vh", objectFit: "contain" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
