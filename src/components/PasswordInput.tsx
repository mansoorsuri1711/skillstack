"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
};

export default function PasswordInput({
  label,
  className = "",
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id || props.name || "password";

  return (
    <label className="block" htmlFor={inputId}>
      <span className="text-sm font-medium text-snow">{label}</span>
      <div className="relative mt-1.5">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={`w-full rounded-md border border-line bg-bg-input py-2 pl-3 pr-10 text-sm text-snow outline-none transition placeholder:text-ink-muted/50 focus:border-accent ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-muted transition-colors hover:text-snow"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </label>
  );
}
