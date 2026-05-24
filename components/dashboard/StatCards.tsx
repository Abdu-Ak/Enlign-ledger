"use client";
import React from "react";
import { TrendingUp, TrendingDown, Wallet, Users, Briefcase, Layers } from "lucide-react";

interface Summary {
  globalBalance: number; totalInflow: number; totalOutflow: number;
  investorBalance: number; employeeBalance: number;
  totalFeesCollected: number; totalExpensesPaid: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

interface CardProps { title: string; value: string; subtitle: string; icon: React.ReactNode; accent: string; footer?: React.ReactNode; }

function StatCard({ title, value, subtitle, icon, accent, footer }: CardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3" style={{ borderRadius: "var(--radius-lg)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{title}</span>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: accent + "18", color: accent, border: `1px solid ${accent}30` }}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-base)" }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{subtitle}</p>
      </div>
      {footer && <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>{footer}</div>}
    </div>
  );
}

export default function StatCards({ summary, loading }: { summary: Summary; loading: boolean }) {
  const v = (n: number) => loading ? "—" : fmt(n);
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Liquidity Pool" value={v(summary.globalBalance)} subtitle="Global net institutional capital" icon={<Layers className="h-4 w-4" />} accent="#6366f1"
        footer={<div className="flex justify-between text-xs font-medium">
          <span className="flex items-center gap-1" style={{ color: "var(--credit)" }}><TrendingUp className="h-3 w-3" />In: {v(summary.totalInflow)}</span>
          <span className="flex items-center gap-1" style={{ color: "var(--debit)" }}><TrendingDown className="h-3 w-3" />Out: {v(summary.totalOutflow)}</span>
        </div>}
      />
      <StatCard title="Investor Endowments" value={v(summary.investorBalance)} subtitle="Net investor liquidity held" icon={<Users className="h-4 w-4" />} accent="#16a34a"
        footer={<div className="flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
          <span>Primary: NR sir</span><span style={{ color: "var(--credit)" }}>Stable Pool</span>
        </div>}
      />
      <StatCard title="Employee Ledger" value={v(summary.employeeBalance)} subtitle="Internal corporate credit balance" icon={<Briefcase className="h-4 w-4" />} accent="#0ea5e9"
        footer={<div className="flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
          <span>Primary: Nafi</span><span style={{ color: "#0ea5e9" }}>Repayable</span>
        </div>}
      />
      <StatCard title="Operational Revenue" value="" subtitle="" icon={<TrendingUp className="h-4 w-4" />} accent="#f59e0b"
        footer={
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span style={{ color: "var(--text-muted)" }}>Fees Collected</span><span className="font-semibold" style={{ color: "var(--credit)" }}>{v(summary.totalFeesCollected)}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: "var(--text-muted)" }}>Operating Spends</span><span className="font-semibold" style={{ color: "var(--debit)" }}>{v(summary.totalExpensesPaid)}</span></div>
          </div>
        }
      />
    </section>
  );
}
