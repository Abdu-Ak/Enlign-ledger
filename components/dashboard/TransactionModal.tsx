"use client";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Paperclip, TrendingUp, AlertCircle, Edit3 } from "lucide-react";
import TextField from "../ui/TextField";
import SelectField from "../ui/SelectField";

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be positive"),
  category: z.enum(["STUDENT_FEE", "EXPENSE", "INVESTOR", "EMPLOYEE"]),
  type: z.enum(["CREDIT", "DEBIT"]),
  partyName: z.string().optional(),
  purpose: z.string().optional(),
});
export type TransactionFormValues = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
  onSubmit: (data: TransactionFormValues, fileBase64: string | null) => Promise<void>;
  serverError: string | null;
  initialValues?: TransactionFormValues;
  isEdit?: boolean;
  initialFileAttachment?: string | null;
}

const CATEGORY_OPTIONS = [
  { value: "STUDENT_FEE", label: "Student Fee" },
  { value: "EXPENSE", label: "Expense" },
  { value: "INVESTOR", label: "Investor" },
  { value: "EMPLOYEE", label: "Employee" },
];
const TYPE_OPTIONS = [{ value: "CREDIT", label: "Credit (Inflow)" }, { value: "DEBIT", label: "Debit (Outflow)" }];

export default function TransactionModal({ onClose, onSubmit, serverError, initialValues, isEdit = false, initialFileAttachment }: Props) {
  const [fileBase64, setFileBase64] = React.useState<string | null>(initialFileAttachment || null);
  const [fileName, setFileName] = React.useState<string | null>(() => {
    if (!initialFileAttachment) return null;
    try {
      const decoded = decodeURIComponent(initialFileAttachment);
      const parts = decoded.split("/");
      const lastPart = parts[parts.length - 1];
      return lastPart.split("?")[0] || "receipt-file";
    } catch {
      return "receipt-file";
    }
  });
  const [fileError, setFileError] = React.useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      date: new Date().toISOString().split("T")[0],
      category: "STUDENT_FEE", type: "CREDIT", partyName: "", purpose: "",
    },
  });

  const category = watch("category");

  // Determine which type buttons should be locked per category
  const lockedType: "CREDIT" | "DEBIT" | null =
    category === "STUDENT_FEE" ? "CREDIT" :
    category === "EXPENSE"     ? "DEBIT"  : null;

  useEffect(() => {
    if (category === "INVESTOR")    { setValue("partyName", "NR sir"); setValue("type", "CREDIT"); }
    else if (category === "EMPLOYEE") { setValue("partyName", "Nafi");   setValue("type", "CREDIT"); }
    else if (category === "EXPENSE")  { setValue("type", "DEBIT");  }
    else                               { setValue("type", "CREDIT"); } // STUDENT_FEE + default
  }, [category, setValue]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setFileError("File must be under 8MB"); return; }
    setFileName(file.name); setFileError(null);
    const reader = new FileReader();
    reader.onload = () => setFileBase64(reader.result as string);
    reader.onerror = () => setFileError("Failed to read file");
    reader.readAsDataURL(file);
  };

  /* close on Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = (data: TransactionFormValues) => onSubmit(data, fileBase64);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg animate-slide-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {isEdit ? <Edit3 className="h-4 w-4" style={{ color: "var(--text-muted)" }} /> : <Plus className="h-4 w-4" style={{ color: "var(--text-muted)" }} />}
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-base)" }}>{isEdit ? "Edit Transaction" : "Log Transaction"}</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center transition-colors" style={{ color: "var(--text-faint)" }}
            onMouseOver={e => (e.currentTarget.style.background = "var(--surface-2)")}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(submit)} className="p-5 space-y-4 overflow-y-auto flex-1">
          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "var(--debit-bg)", border: "1px solid var(--debit-border)", color: "var(--debit)" }}>
              <AlertCircle className="h-4 w-4 shrink-0" />{serverError}
            </div>
          )}

          {/* Type toggle */}
          <div>
            <p className="field-label mb-2">Transaction Direction</p>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              {(["CREDIT", "DEBIT"] as const).map(t => {
                const active = watch("type") === t;
                const isCredit = t === "CREDIT";
                // Button is disabled when a lockedType exists and this button is NOT the locked one
                const isDisabled = lockedType !== null && lockedType !== t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setValue("type", t)}
                    className="h-9 rounded-md text-xs font-semibold transition-all"
                    style={{
                      ...(active
                        ? {
                            background: isCredit ? "var(--credit-bg)" : "var(--debit-bg)",
                            color: isCredit ? "var(--credit)" : "var(--debit)",
                            border: `1px solid ${isCredit ? "var(--credit-border)" : "var(--debit-border)"}`,
                          }
                        : { color: "var(--text-faint)" }),
                      ...(isDisabled ? { opacity: 0.38, cursor: "not-allowed" } : {}),
                    }}
                  >
                    {isCredit ? "Credit (Inflow)" : "Debit (Outflow)"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SelectField
                  id="category"
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.category?.message}
                  required
                />
              )}
            />
            <TextField id="date" label="Date" type="date" registration={register("date")} error={errors.date?.message} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField id="partyName" label="Reference / Party" placeholder="e.g. John Doe" registration={register("partyName")} />
            <TextField id="amount" label="Amount (INR)" type="number" step="any" min="0.01" placeholder="0.00" registration={register("amount", { valueAsNumber: true })} error={errors.amount?.message} required />
          </div>

          <TextField id="purpose" label="Description / Purpose" placeholder="Details of this transaction..." multiline rows={2} registration={register("purpose")} />

          {/* File upload */}
          <div>
            <p className="field-label">Receipt (Optional)</p>
            <label className="relative flex flex-col items-center justify-center h-20 rounded-lg cursor-pointer transition-colors"
              style={{ border: "1.5px dashed var(--border)", background: "var(--surface-2)" }}>
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="sr-only" />
              {fileName ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{fileName}</span>
                  <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setFileName(null); setFileBase64(null); }}
                    className="h-5 w-5 rounded-full flex items-center justify-center" style={{ color: "var(--text-faint)" }}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Paperclip className="h-4 w-4 mx-auto mb-1" style={{ color: "var(--text-faint)" }} />
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>Click to attach image or PDF · Max 8MB</p>
                </div>
              )}
            </label>
            {fileError && <p className="field-error-msg mt-1">{fileError}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white spin" /> : <><TrendingUp className="h-4 w-4" />{isEdit ? "Update Transaction" : "Save Transaction"}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
