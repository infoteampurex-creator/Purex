'use client';

import { type FormField, type FormTemplate } from '@/lib/services';
import { Input, Label, Textarea, Select, FieldError } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

interface PreConsultFormProps {
  template: FormTemplate;
  values: Record<string, string | string[]>;
  onChange: (id: string, value: string | string[]) => void;
  errors?: Record<string, string>;
}

export function PreConsultForm({
  template,
  values,
  onChange,
  errors = {},
}: PreConsultFormProps) {
  return (
    <div className="space-y-6">
      {template.intro && (
        <div className="p-4 rounded-lg bg-bg-inset border border-border">
          <p className="text-sm text-text-muted leading-relaxed">
            {template.intro}
          </p>
        </div>
      )}

      {template.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={values[field.id] ?? (field.type === 'checkbox-group' ? [] : '')}
          onChange={(v) => onChange(field.id, v)}
          error={errors[field.id]}
        />
      ))}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
}) {
  const fieldId = `field-${field.id}`;

  return (
    <div>
      <Label
        htmlFor={fieldId}
        required={field.required}
        helpText={field.helpText}
      >
        {field.label}
      </Label>

      {field.type === 'text' && (
        <Input
          id={fieldId}
          type="text"
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          id={fieldId}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}

      {field.type === 'number' && (
        <Input
          id={fieldId}
          type="number"
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}

      {field.type === 'date' && (
        <Input
          id={fieldId}
          type="date"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}

      {field.type === 'select' && (
        <Select
          id={fieldId}
          options={field.options ?? []}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )}

      {field.type === 'radio-group' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {(field.options ?? []).map((opt) => {
            const selected = value === opt;
            return (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  selected
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-border-soft bg-bg-inset'
                )}
              >
                <input
                  type="radio"
                  name={fieldId}
                  value={opt}
                  checked={selected}
                  onChange={() => onChange(opt)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    selected ? 'border-accent' : 'border-border'
                  )}
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {field.type === 'checkbox-group' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {(field.options ?? []).map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  selected
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-border-soft bg-bg-inset'
                )}
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={selected}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...current, opt]);
                    } else {
                      onChange(current.filter((v) => v !== opt));
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    selected ? 'border-accent bg-accent' : 'border-border'
                  )}
                >
                  {selected && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#0a0c09"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6l3 3 5-6" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      <FieldError message={error} />
    </div>
  );
}
