import * as React from 'react';
import { cn } from '@/lib/cn';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-12 px-4 rounded-lg',
      'bg-bg-inset border border-border',
      'text-text placeholder:text-text-dim',
      'focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20',
      'transition-[border-color,box-shadow] duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      error && 'border-danger focus:ring-danger/20',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={4}
    className={cn(
      'w-full px-4 py-3 rounded-lg resize-none',
      'bg-bg-inset border border-border',
      'text-text placeholder:text-text-dim',
      'focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20',
      'transition-[border-color,box-shadow] duration-200',
      error && 'border-danger focus:ring-danger/20',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export function Label({
  children,
  required,
  helpText,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  helpText?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-2">
      <span className="font-medium text-sm text-text">
        {children}
        {required && <span className="text-accent ml-1">*</span>}
      </span>
      {helpText && (
        <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mt-1 font-medium">
          {helpText}
        </span>
      )}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-danger font-medium">{message}</p>
  );
}

export function Select({
  options,
  error,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly string[] | string[];
  error?: string;
}) {
  return (
    <select
      className={cn(
        'w-full h-12 px-4 rounded-lg',
        'bg-bg-inset border border-border',
        'text-text',
        'focus:border-accent focus:outline-none transition-colors',
        'appearance-none cursor-pointer',
        error && 'border-danger',
        className
      )}
      {...props}
    >
      <option value="">Select an option...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
