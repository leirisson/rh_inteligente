import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
}

const baseFieldClasses =
  "w-full rounded-xl border px-3.5 text-sm font-sans outline-none text-text placeholder:text-text-muted focus:border-primary";

function fieldBorder(error?: string) {
  return error ? "border-danger" : "border-border";
}

export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: FieldWrapperProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-text">
          {label}
        </label>
      )}
      <input id={id} className={`h-11 ${baseFieldClasses} ${fieldBorder(error)}`} {...props} />
      {error && <span className="mt-1 block text-[11.5px] font-medium text-danger">{error}</span>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: FieldWrapperProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-text">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`resize-vertical py-3 leading-relaxed ${baseFieldClasses} ${fieldBorder(error)}`}
        {...props}
      />
      {error && <span className="mt-1 block text-[11.5px] font-medium text-danger">{error}</span>}
    </div>
  );
}

export function Select({
  label,
  error,
  className = "",
  id,
  children,
  ...props
}: FieldWrapperProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-text">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`h-11 bg-white ${baseFieldClasses} ${fieldBorder(error)}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-[11.5px] font-medium text-danger">{error}</span>}
    </div>
  );
}
