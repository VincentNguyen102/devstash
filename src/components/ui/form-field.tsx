import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  /** Optional control rendered at the trailing edge of the label row. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Label + control + optional hint wrapper shared by the item create and edit
 * forms so both surfaces keep the same field markup.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  action,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-6 items-center justify-between gap-2">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <span className="text-sm font-medium">{label}</span>
        )}
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
