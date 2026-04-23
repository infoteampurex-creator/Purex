'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Dumbbell, Utensils, Heart, Moon } from 'lucide-react';
import { toggleTask as toggleTaskAction } from '@/lib/actions/client-tracking';
import type { AdminClientTask } from '@/lib/data/admin-mock';
import { cn } from '@/lib/cn';

interface TaskChecklistProps {
  tasks: AdminClientTask[];
  /** Whether these tasks are editable (client can toggle own tasks) */
  readOnly?: boolean;
}

const categoryStyles: Record<
  AdminClientTask['category'],
  { icon: React.ComponentType<{ size?: number }>; color: string; bg: string }
> = {
  workout: { icon: Dumbbell, color: '#c6ff3d', bg: 'rgba(198, 255, 61, 0.12)' },
  nutrition: { icon: Utensils, color: '#ffb84d', bg: 'rgba(255, 184, 77, 0.12)' },
  recovery: { icon: Heart, color: '#ff6b9d', bg: 'rgba(255, 107, 157, 0.12)' },
  lifestyle: { icon: Moon, color: '#7dd3ff', bg: 'rgba(125, 211, 255, 0.12)' },
};

export function TaskChecklist({ tasks, readOnly = false }: TaskChecklistProps) {
  const router = useRouter();
  const [taskList, setTaskList] = useState(tasks);
  const [isPending, startTransition] = useTransition();

  const toggleTask = (id: string) => {
    if (readOnly || isPending) return;
    // Don't allow toggling demo/mock tasks — they won't persist
    if (!isUuid(id)) return;

    const current = taskList.find((t) => t.id === id);
    if (!current) return;
    const next = !current.completed;

    // Optimistic
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: next } : t))
    );

    startTransition(async () => {
      const result = await toggleTaskAction(id, next);
      if (!result.ok) {
        // Revert
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: current.completed } : t
          )
        );
      } else {
        router.refresh();
      }
    });
  };

  const completedCount = taskList.filter((t) => t.completed).length;
  const percentage =
    taskList.length > 0
      ? Math.round((completedCount / taskList.length) * 100)
      : 0;

  if (taskList.length === 0) {
    return (
      <section className="bg-bg-card border border-border rounded-2xl p-5 md:p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
          Today&rsquo;s Tasks
        </div>
        <p className="text-sm text-text-muted">
          No tasks assigned for today. Your coach will set these up soon.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      className="bg-bg-card border border-border rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
            Today&rsquo;s Tasks
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">
            {completedCount} of {taskList.length} complete
          </h3>
        </div>
        <div className="font-display font-bold text-2xl text-accent tracking-tight">
          {percentage}
          <span className="text-xs text-text-muted font-mono font-medium ml-0.5">
            %
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {taskList.map((task) => {
            const style = categoryStyles[task.category];
            const Icon = style.icon;
            return (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  disabled={readOnly || isPending}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                    'hover:bg-bg-elevated/60 active:scale-[0.99]',
                    task.completed && 'bg-bg-elevated/40',
                    (readOnly || isPending) && 'cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      task.completed
                        ? 'border-accent bg-accent text-bg'
                        : 'border-border hover:border-accent'
                    )}
                  >
                    {task.completed && <Check size={12} strokeWidth={3} />}
                  </div>

                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: style.bg, color: style.color }}
                  >
                    <Icon size={14} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-medium transition-all',
                        task.completed
                          ? 'text-text-muted line-through'
                          : 'text-text'
                      )}
                    >
                      {task.title}
                    </div>
                  </div>

                  {task.scheduledTime && (
                    <div className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium">
                      {task.scheduledTime}
                    </div>
                  )}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

// Simple UUID check — used to distinguish real Supabase rows from mock tasks
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
