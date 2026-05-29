'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Save, Stethoscope } from 'lucide-react';
import { updateHealthConditions } from '@/lib/actions/health-conditions';
import {
  COMMON_CONDITIONS,
  type HealthConditionsProfile,
} from '@/lib/data/health-conditions';

interface Props {
  clientId: string;
  initial: HealthConditionsProfile;
}

/**
 * HealthConditionsEditor — admin-side coach UI for setting a client's
 * conditions, allergies, injuries, medications, and free-text notes.
 *
 * Drops into the existing /admin/clients/[id] page as a self-contained
 * section. Uses the updateHealthConditions server action (RLS-gated
 * to admins, with a friendly in-action role check).
 */
export function HealthConditionsEditor({ clientId, initial }: Props) {
  const router = useRouter();
  const [conditions, setConditions] = useState<string[]>(initial.conditions);
  const [allergies, setAllergies] = useState<string[]>(initial.allergies);
  const [injuries, setInjuries] = useState<string[]>(initial.injuries);
  const [medications, setMedications] = useState<string[]>(initial.medications);
  const [coachNotes, setCoachNotes] = useState(initial.coachNotes ?? '');

  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const handleSave = () => {
    setError(null);
    startSave(async () => {
      const res = await updateHealthConditions({
        clientId,
        conditions,
        allergies,
        injuries,
        medications,
        coachNotes: coachNotes.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  };

  return (
    <section
      className="rounded-2xl border bg-bg-card p-5 md:p-6"
      style={{ borderColor: 'rgba(255,138,77,0.20)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Stethoscope size={14} style={{ color: '#ff8a4d' }} />
        <h2 className="font-display font-semibold text-lg tracking-tight">
          Health conditions
        </h2>
      </div>
      <p className="text-sm text-text-muted mb-5">
        What your client lives with — drives plan + meal tailoring.
        Visible to them on their Health tab.
      </p>

      <ChipEditor
        label="Conditions"
        color="#ff8a4d"
        values={conditions}
        onChange={setConditions}
        suggestions={COMMON_CONDITIONS}
        placeholder="e.g. Type 2 diabetes (HbA1c 6.4)"
      />

      <ChipEditor
        label="Allergies"
        color="#ff6b6b"
        values={allergies}
        onChange={setAllergies}
        placeholder="e.g. Peanuts, shellfish"
      />

      <ChipEditor
        label="Injuries"
        color="#ffd24d"
        values={injuries}
        onChange={setInjuries}
        placeholder="e.g. Right knee ACL (2022), recurring lower-back"
      />

      <ChipEditor
        label="Medications"
        color="#a78bfa"
        values={medications}
        onChange={setMedications}
        placeholder="e.g. Metformin 500mg 2x"
      />

      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold text-text-muted mb-2">
          Coach notes (free-text)
        </div>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value.slice(0, 2000))}
          placeholder="Family history of diabetes. Avoids dairy. Prefers morning training. Etc."
          rows={4}
          className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm focus:border-accent/50 focus:outline-none resize-y"
        />
        <div className="font-mono text-[10px] text-text-dim mt-1">
          {coachNotes.length}/2000
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg px-3 py-2 mb-3 font-mono text-xs"
          style={{
            color: '#ff9999',
            background: 'rgba(255,107,107,0.10)',
            border: '1px solid rgba(255,107,107,0.30)',
          }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            fontSize: 11,
            color: '#0a0c09',
            background: 'linear-gradient(135deg, #ff8a4d 0%, #ffd24d 100%)',
          }}
        >
          <Save size={12} />
          {saving ? 'Saving…' : 'Save'}
        </button>
        {savedAt && !saving && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-success font-bold">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>
    </section>
  );
}

// ─── Chip editor primitive ──────────────────────────────────────

function ChipEditor({
  label,
  color,
  values,
  onChange,
  suggestions = [],
  placeholder,
}: {
  label: string;
  color: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const addItem = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...values, v]);
    setInput('');
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const unsuggested = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="mb-5">
      <div
        className="font-mono uppercase tracking-[0.18em] font-bold mb-2"
        style={{ fontSize: 10, color }}
      >
        {label}
      </div>

      {/* Selected chips */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full"
              style={{
                fontSize: 11,
                color: 'rgba(245,245,240,0.92)',
                background: `${color}1A`,
                border: `1px solid ${color}55`,
              }}
            >
              {v}
              <button
                type="button"
                onClick={() => removeItem(i)}
                aria-label={`Remove ${v}`}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + add */}
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 200))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem(input);
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg bg-bg-elevated border border-border-soft px-3 py-1.5 text-sm focus:border-accent/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => addItem(input)}
          disabled={!input.trim()}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40"
          style={{
            color: '#0a0c09',
            background: color,
          }}
        >
          <Plus size={11} />
          Add
        </button>
      </div>

      {/* Suggestion chips */}
      {unsuggested.length > 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unsuggested.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addItem(s)}
              className="font-mono text-[10px] px-2 py-0.5 rounded-full transition-colors hover:bg-white/5"
              style={{
                color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
