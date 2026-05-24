"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  id: string;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function SelectField({
  label,
  id,
  options,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
  placeholder,
  required,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={[
            "field-input flex items-center justify-between text-left cursor-pointer",
            error ? "field-error" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ width: "100%" }}
        >
          <span className="truncate" style={{ color: selectedOption ? "var(--text-base)" : "var(--text-faint)" }}>
            {selectedOption ? selectedOption.label : placeholder || "Select category"}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--text-faint)" }}
          />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 z-50 w-full mt-1.5 py-1 rounded-lg animate-slide-up"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "200px",
              overflowY: "auto",
              top: "100%",
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold transition-colors text-left"
                  style={{
                    color: isSelected ? "var(--primary)" : "var(--text-muted)",
                    background: isSelected ? "var(--surface-2)" : "transparent",
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--primary)" }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="field-error-msg">{error}</p>}
    </div>
  );
}
