import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface TextFieldProps {
  label: string;
  id: string;
  registration?: UseFormRegisterReturn;
  error?: string;
  type?: "text" | "password" | "number" | "date" | "email";
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  hint?: string;
  required?: boolean;
  step?: string;
  min?: string;
  value?: string;
  onChange?: (e: any) => void;
}

export default function TextField({
  label,
  id,
  registration,
  error,
  type = "text",
  placeholder,
  disabled,
  multiline = false,
  rows = 3,
  className = "",
  prefix,
  suffix,
  hint,
  required,
  step,
  min,
  value,
  onChange,
}: TextFieldProps) {
  const inputClass = [
    multiline ? "field-textarea" : "field-input",
    error ? "field-error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {prefix && !multiline && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none flex items-center justify-center">
            {prefix}
          </div>
        )}

        {multiline ? (
          <textarea
            id={id}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClass}
            value={value}
            onChange={onChange}
            {...registration}
          />
        ) : (
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            step={step}
            min={min}
            className={inputClass}
            value={value}
            onChange={onChange}
            style={{
              paddingLeft: prefix ? "36px" : "12px",
              paddingRight: suffix ? "36px" : "12px",
            }}
            {...registration}
          />
        )}

        {suffix && !multiline && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none">
            {suffix}
          </div>
        )}
      </div>

      {hint && !error && <p className="text-xs text-text-faint">{hint}</p>}
      {error && <p className="field-error-msg">{error}</p>}
    </div>
  );
}
