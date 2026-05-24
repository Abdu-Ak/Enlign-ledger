"use client";

import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import TextField from "./ui/TextField";

/* ─── Zod Schema ─────────────────────────────────────────────── */
const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

/* ─── Props ──────────────────────────────────────────────────── */
interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" },
  });

  /* Auto-focus password on mount */
  useEffect(() => {
    setFocus("password");
  }, [setFocus]);

  /* Submit handler */
  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTimeout(onSuccess, 200);
      } else {
        setServerError(data.error || "Incorrect password. Please try again.");
        setFocus("password");
      }
    } catch {
      setServerError("Unable to connect. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-3xl animate-slide-up">
        <div
          className="flex flex-col sm:flex-row overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* ── Left Branding Panel ─────────────────────────────── */}
          <div
            className="sm:w-2/5 p-8 flex flex-col justify-between"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-6">
                <span className="text-xs font-semibold tracking-wide opacity-90">
                  ENLIGHN ADMIN
                </span>
              </div>
              <h1 className="text-2xl font-bold leading-snug mb-3">
                Manage your ledger with confidence
              </h1>
              <p className="text-sm opacity-70 leading-relaxed">
                Track transactions, monitor balances, and review financial
                records from one secure place.
              </p>
            </div>

            <div className="mt-8">
              <div
                className="rounded-lg p-4 text-xs opacity-60 leading-relaxed"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <ShieldCheck className="h-4 w-4 mb-2 opacity-80" />
                Protected by secure cookie-based admin authentication. Session
                auto-expires for better security.
              </div>
            </div>
          </div>

          {/* ── Right Form Panel ────────────────────────────────── */}
          <div className="sm:w-3/5 p-8 flex flex-col justify-center">
            <div className="mb-7">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "var(--text-faint)" }}
              >
                Admin Access
              </p>
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--text-base)" }}
              >
                Sign in
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Enter your admin password to access the dashboard.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                className="mb-5 p-3 rounded-lg text-sm flex items-center gap-2"
                style={{
                  background: "var(--debit-bg)",
                  border: "1px solid var(--debit-border)",
                  color: "var(--debit)",
                }}
              >
                <Lock className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <TextField
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                required
                registration={register("password")}
                error={errors.password?.message}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="pointer-events-auto cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-10 text-sm"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white spin" />
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p
              className="text-xs mt-5"
              style={{ color: "var(--text-faint)" }}
            >
              You will be redirected to the dashboard after login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
