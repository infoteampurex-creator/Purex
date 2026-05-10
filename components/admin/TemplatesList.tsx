'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Plus,
  Edit3,
  Layers,
  Activity,
  Loader2,
} from 'lucide-react';
import { EditTemplateModal } from './EditTemplateModal';
import { type WorkoutTemplate } from '@/lib/data/workout-templates-types';
import { type LibraryExerciseOption } from '@/lib/data/daily-plan-types';
import { cn } from '@/lib/cn';

export interface TemplateCardData {
  id: string;
  name: string;
  category: string | null;
  targetMuscleGroup: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  exerciseCount: number;
  updatedAt: string;
}

interface TemplatesListProps {
  templates: TemplateCardData[];
  exerciseLibrary: LibraryExerciseOption[];
  /**
   * Returns the full template (header + exercises) for the given id —
   * used when the user clicks Edit. We fetch on demand so the list
   * stays light even with many templates.
   */
  loadTemplate: (id: string) => Promise<WorkoutTemplate | null>;
}

export function TemplatesList({
  templates,
  exerciseLibrary,
  loadTemplate,
}: TemplatesListProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setLoadingId(id);
    startTransition(async () => {
      const full = await loadTemplate(id);
      setLoadingId(null);
      if (full) {
        setEditing(full);
        setModalOpen(true);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="text-xs text-text-muted">
          {templates.length} template{templates.length === 1 ? '' : 's'} available
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card p-10 text-center">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-4">
            <Layers size={20} />
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">
            No templates yet
          </h3>
          <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
            Create reusable workout templates once — &ldquo;Chest Day A&rdquo;,
            &ldquo;Pull Hypertrophy&rdquo; — then assign any of them to a
            client&apos;s day in one click.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 mt-5 h-10 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create first template
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t) => {
            const isLoading = loadingId === t.id;
            return (
              <div
                key={t.id}
                className={cn(
                  'rounded-2xl bg-bg-card border border-border p-5 hover:border-border-soft transition-colors',
                  isLoading && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    {t.category && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold mb-1">
                        {t.category}
                      </div>
                    )}
                    <div className="font-display font-semibold text-base">
                      {t.name}
                    </div>
                    {t.targetMuscleGroup && (
                      <div className="text-xs text-text-muted mt-1">
                        {t.targetMuscleGroup}
                      </div>
                    )}
                  </div>
                  {t.difficulty && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bg-elevated text-[10px] text-text-muted font-mono uppercase tracking-[0.12em] border border-border flex-shrink-0">
                      {t.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted font-mono pt-3 border-t border-border-soft">
                  <span className="inline-flex items-center gap-1">
                    <Dumbbell size={11} />
                    {t.exerciseCount} exercise{t.exerciseCount === 1 ? '' : 's'}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    <Activity size={10} />
                    Updated {new Date(t.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => openEdit(t.id)}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Edit3 size={11} />
                    )}
                    {isLoading ? 'Loading…' : 'Edit template'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        template={editing}
        exerciseLibrary={exerciseLibrary}
      />
    </>
  );
}
