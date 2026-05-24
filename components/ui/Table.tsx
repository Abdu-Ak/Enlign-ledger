import React from "react";

/* ─── Table Root ──────────────────────────────────────────────── */
interface TableProps {
  children: React.ReactNode;
  className?: string;
}
export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

/* ─── Table Head ──────────────────────────────────────────────── */
interface TableHeadProps {
  children: React.ReactNode;
}
export function TableHead({ children }: TableHeadProps) {
  return (
    <thead>
      <tr
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
        }}
      >
        {children}
      </tr>
    </thead>
  );
}

/* ─── Table Header Cell ───────────────────────────────────────── */
interface ThProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}
export function Th({ children, className = "", align = "left" }: ThProps) {
  return (
    <th
      style={{ color: "var(--text-muted)" }}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-${align} ${className}`}
    >
      {children}
    </th>
  );
}

/* ─── Table Body ──────────────────────────────────────────────── */
interface TableBodyProps {
  children: React.ReactNode;
}
export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody
      style={{ borderTop: "1px solid var(--border)" }}
      className="divide-y"
    >
      {children}
    </tbody>
  );
}

/* ─── Table Row ───────────────────────────────────────────────── */
interface TrProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
export function Tr({ children, className = "", onClick }: TrProps) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-surface-2 ${className}`}
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {children}
    </tr>
  );
}

/* ─── Table Data Cell ─────────────────────────────────────────── */
interface TdProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  muted?: boolean;
  title?: string;
}
export function Td({
  children,
  className = "",
  align = "left",
  muted = false,
  title,
}: TdProps) {
  return (
    <td
      title={title}
      style={{ color: muted ? "var(--text-muted)" : "var(--text-base)" }}
      className={`px-4 py-3 text-sm text-${align} whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}

/* ─── Table Empty State ───────────────────────────────────────── */
interface TableEmptyProps {
  colSpan: number;
  icon?: React.ReactNode;
  title: string;
  description?: string;
}
export function TableEmpty({
  colSpan,
  icon,
  title,
  description,
}: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          {icon && <div style={{ color: "var(--text-faint)" }}>{icon}</div>}
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              {title}
            </p>
            {description && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-faint)" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
