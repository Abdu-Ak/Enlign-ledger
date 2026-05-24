import { FinancialRecord } from "./types";

export const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);

export const parsePurpose = (s?: string | null) => {
  if (!s) return { party: "—", desc: "" };
  const m = s.match(/^\[(.*?)\]\s*(.*)$/);
  return m ? { party: m[1], desc: m[2] } : { party: "—", desc: s };
};

export const GQL = (body: object) =>
  fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export const exportToCSV = (records: FinancialRecord[]) => {
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
