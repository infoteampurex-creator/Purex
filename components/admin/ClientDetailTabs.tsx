'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  CheckSquare,
  Dumbbell,
  CalendarClock,
  Sparkles,
  Plus,
  Send,
  Check,
  Circle,
  Flame,
  Droplets,
  Footprints,
  Moon,
  Heart,
  ExternalLink,
  Smile,
  TrendingUp,
  TrendingDown,
  Zap,
  Camera,
  Trash2,
  Edit3,
  Loader2,
} from 'lucide-react';
import type {
  AdminClient,
  AdminClientTask,
  AdminClientDailyLog,
  AdminClientWorkout,
  AdminBooking,
  AdminSuggestedApp,
  AdminInternalAction,
  AdminClientPhotoSet,
} from '@/lib/data/admin-mock';
import {
  addTask,
  toggleTask,
  deleteTask,
  toggleWorkout,
} from '@/lib/actions/client-tracking';
import { deleteDailyPlan } from '@/lib/actions/daily-plan';
import { StatusBadge } from './AdminTable';
import { LogMetricsModal } from './LogMetricsModal';
import { EditDailyPlanModal } from './EditDailyPlanModal';
import {
  type DailyPlan,
  type LibraryExerciseOption,
} from '@/lib/data/daily-plan-types';
import { type WorkoutTemplateSummary } from '@/lib/data/workout-templates-types';
import { PhotoUpload } from './PhotoUpload';
import { cn } from '@/lib/cn';

type TabId = 'progress' | 'tasks' | 'workouts' | 'bookings' | 'photos' | 'apps';

interface Props {
  client: AdminClient;
  tasks: AdminClientTask[];
  logs: AdminClientDailyLog[];
  workouts: AdminClientWorkout[];
  bookings: AdminBooking[];
  photos: AdminClientPhotoSet[];
  suggestedApps: AdminSuggestedApp[];
  internalActions: AdminInternalAction[];
  initialDailyPlan?: DailyPlan | null;
  exerciseLibrary?: LibraryExerciseOption[];
  workoutTemplates?: WorkoutTemplateSummary[];
}

export function ClientDetailTabs({
  client,
  tasks,
  logs,
  workouts,
  bookings,
  photos,
  suggestedApps,
  internalActions,
  initialDailyPlan,
  exerciseLibrary,
  workoutTemplates,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('progress');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [planModalDate, setPlanModalDate] = useState<string>(todayStr);

  const openPlanForDate = (date: string) => {
    setPlanModalDate(date);
    setPlanModalOpen(true);
  };

  const tabs: { id: TabId; label: string; icon: typeof Activity; count?: number }[] = [
    { id: 'progress', label: 'Progress', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks.filter((t) => !t.completed).length },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'bookings', label: 'Bookings', icon: CalendarClock, count: bookings.filter((b) => b.status === 'scheduled' || b.status === 'new').length },
    { id: 'photos', label: 'Photos', icon: Camera, count: photos.length },
    { id: 'apps', label: 'Suggest', icon: Sparkles },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div className="border-b border-border mb-6">
        <div className="flex items-center gap-1 overflow-x-auto -mb-px">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  active
                    ? 'text-accent border-accent'
                    : 'text-text-muted border-transparent hover:text-text hover:border-border-soft'
                )}
              >
                <Icon size={14} />
                {t.label}
                {typeof t.count === 'number' && t.count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-mono font-bold',
                      active ? 'bg-accent text-bg' : 'bg-bg-elevated text-text-muted'
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'progress' && (
          <ProgressTab
            logs={logs}
            onLogMetrics={() => setLogModalOpen(true)}
            onEditPlan={() => openPlanForDate(todayStr)}
          />
        )}
        {activeTab === 'tasks' && <TasksTab tasks={tasks} clientId={client.id} />}
        {activeTab === 'workouts' && (
          <WorkoutsTab
            workouts={workouts}
            clientId={client.id}
            onEditWorkout={(date) => openPlanForDate(date)}
            onAssignNew={() => openPlanForDate(todayStr)}
          />
        )}
        {activeTab === 'bookings' && <BookingsTab bookings={bookings} />}
        {activeTab === 'photos' && (
          <PhotosTab
            photos={photos}
            clientId={client.id}
            clientName={client.fullName}
          />
        )}
        {activeTab === 'apps' && (
          <AppsTab
            apps={suggestedApps}
            internalActions={internalActions}
            clientName={client.fullName}
          />
        )}
      </div>

      {/* Log metrics modal */}
      <LogMetricsModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        clientName={client.fullName}
        clientId={client.id}
      />

      {/* Edit daily plan modal */}
      <EditDailyPlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        clientName={client.fullName}
        clientId={client.id}
        initialDate={planModalDate}
        // Only pass the prefetched plan when we're opening for today —
        // for any other date the modal fetches fresh on open.
        initialPlan={planModalDate === todayStr ? (initialDailyPlan ?? null) : null}
        workoutTemplates={workoutTemplates}
        exerciseLibrary={exerciseLibrary ?? []}
      />
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────────────
function ProgressTab({
  logs,
  onLogMetrics,
  onEditPlan,
}: {
  logs: AdminClientDailyLog[];
  onLogMetrics: () => void;
  onEditPlan: () => void;
}) {
  const today = logs[0];
  const yesterday = logs[1];

  if (!today) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Activity />}
          title="No progress logs yet"
          description="This client hasn't logged any metrics."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={onEditPlan}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} />
            Set today&apos;s plan
          </button>
          <button
            onClick={onLogMetrics}
            className="inline-flex items-center justify-center gap-2 h-11 rounded-full border border-border text-sm font-semibold hover:border-accent transition-colors"
          >
            <Plus size={14} />
            Log first metrics
          </button>
        </div>
      </div>
    );
  }

  const weightDelta = yesterday?.weightKg && today.weightKg
    ? (today.weightKg - yesterday.weightKg).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Plan toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onEditPlan}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          Edit today&apos;s plan
        </button>
        <button
          onClick={onLogMetrics}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border text-sm font-medium hover:border-accent transition-colors"
        >
          Log metrics
        </button>
      </div>

      {/* Today's snapshot */}
      <div>
        <SectionHeader title="Today's Snapshot" subtitle={today.logDate} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricTile
            icon={<Heart size={14} />}
            label="Weight"
            value={today.weightKg ? `${today.weightKg} kg` : '—'}
            trend={weightDelta ? { value: weightDelta, direction: parseFloat(weightDelta) < 0 ? 'down' : 'up' } : undefined}
          />
          <MetricTile
            icon={<Flame size={14} />}
            label="Calories"
            value={today.caloriesConsumed ? `${today.caloriesConsumed}` : '—'}
            sublabel={today.caloriesTarget ? `of ${today.caloriesTarget}` : undefined}
            progress={today.caloriesConsumed && today.caloriesTarget ? today.caloriesConsumed / today.caloriesTarget : undefined}
          />
          <MetricTile
            icon={<Footprints size={14} />}
            label="Steps"
            value={today.steps ? today.steps.toLocaleString() : '—'}
            sublabel={`of ${today.stepsTarget.toLocaleString()}`}
            progress={today.steps ? today.steps / today.stepsTarget : undefined}
          />
          <MetricTile
            icon={<Droplets size={14} />}
            label="Water"
            value={today.waterGlasses ? `${today.waterGlasses}/${today.waterTarget}` : '—'}
            sublabel="glasses"
            progress={today.waterGlasses ? today.waterGlasses / today.waterTarget : undefined}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <MetricTile
            icon={<Moon size={14} />}
            label="Sleep"
            value={today.sleepHours ? `${today.sleepHours}h` : '—'}
            sublabel={today.sleepQuality ? `Quality ${today.sleepQuality}/5` : undefined}
          />
          <MetricTile
            icon={<Smile size={14} />}
            label="Mood"
            value={today.mood ? `${today.mood}/5` : '—'}
          />
          <MetricTile
            icon={<Activity size={14} />}
            label="Recovery"
            value={today.recoveryScore ? `${today.recoveryScore}%` : '—'}
            progress={today.recoveryScore ? today.recoveryScore / 100 : undefined}
          />
          <LogMetricsButton onClick={onLogMetrics} />
        </div>
      </div>

      {/* Recent logs */}
      <div>
        <SectionHeader title="Last 7 Days" />
        <div className="rounded-2xl bg-bg-card border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">Date</th>
                <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">Weight</th>
                <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">Calories</th>
                <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">Steps</th>
                <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">Sleep</th>
                <th className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">Recovery</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border-soft last:border-0 hover:bg-bg-elevated/50 transition-colors">
                  <td className="py-3 px-4 text-xs font-mono">{log.logDate}</td>
                  <td className="py-3 px-4 text-sm">{log.weightKg ? `${log.weightKg} kg` : '—'}</td>
                  <td className="py-3 px-4 text-sm">{log.caloriesConsumed || '—'}</td>
                  <td className="py-3 px-4 text-sm">{log.steps ? log.steps.toLocaleString() : '—'}</td>
                  <td className="py-3 px-4 text-sm">{log.sleepHours ? `${log.sleepHours}h` : '—'}</td>
                  <td className="py-3 px-4 text-sm">
                    {log.recoveryScore ? (
                      <span className={cn('font-mono font-bold', log.recoveryScore >= 75 ? 'text-accent' : log.recoveryScore >= 50 ? 'text-amber' : 'text-danger')}>
                        {log.recoveryScore}%
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TASKS TAB ────────────────────────────────────────────────────────
function TasksTab({
  tasks,
  clientId,
}: {
  tasks: AdminClientTask[];
  clientId: string;
}) {
  const router = useRouter();
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] =
    useState<AdminClientTask['category']>('lifestyle');
  const [taskList, setTaskList] = useState(tasks);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string) => {
    // Optimistic flip
    const current = taskList.find((t) => t.id === id);
    if (!current) return;
    const nextCompleted = !current.completed;

    setTaskList((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    startTransition(async () => {
      const result = await toggleTask(id, nextCompleted);
      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not save change.');
        // Revert
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, completed: current.completed, completedAt: current.completedAt }
              : t
          )
        );
      } else {
        router.refresh();
      }
    });
  };

  const handleAdd = () => {
    const title = newTask.trim();
    if (!title) return;
    setErrorMsg(null);

    // Optimistic append with a temp id
    const tempId = `pending-${Date.now()}`;
    const optimistic: AdminClientTask = {
      id: tempId,
      title,
      category: newCategory,
      completed: false,
      taskDate: new Date().toISOString().slice(0, 10),
    };

    setTaskList((prev) => [...prev, optimistic]);
    setNewTask('');

    startTransition(async () => {
      const result = await addTask({
        clientId,
        title,
        category: newCategory,
      });

      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not add task.');
        // Remove the optimistic row
        setTaskList((prev) => prev.filter((t) => t.id !== tempId));
      } else if (result.taskId) {
        // Swap temp id for real id
        setTaskList((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: result.taskId! } : t))
        );
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    // Optimistic remove
    const snapshot = taskList;
    setTaskList((prev) => prev.filter((t) => t.id !== id));

    startTransition(async () => {
      const result = await deleteTask(id);
      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not delete.');
        setTaskList(snapshot);
      } else {
        router.refresh();
      }
    });
  };

  const completed = taskList.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Progress summary */}
      <div className="rounded-2xl bg-bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display font-semibold text-base">
              Today&apos;s Tasks
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {completed} of {taskList.length} complete
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-accent">
            {taskList.length > 0
              ? Math.round((completed / taskList.length) * 100)
              : 0}
            %
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{
              width: `${taskList.length > 0 ? (completed / taskList.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {taskList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <div className="text-sm text-text-muted">
              No tasks assigned yet. Add the first one below.
            </div>
          </div>
        ) : (
          taskList.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task.id)}
              onDelete={() => handleDelete(task.id)}
              pending={isPending && task.id.startsWith('pending-')}
            />
          ))
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
          {errorMsg}
        </div>
      )}

      {/* Add task */}
      <div className="rounded-2xl bg-bg-card border border-border p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3">
          Assign a new task
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Complete 20 min yoga flow"
            className="flex-1 h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
            disabled={isPending}
          />
          <select
            value={newCategory}
            onChange={(e) =>
              setNewCategory(e.target.value as AdminClientTask['category'])
            }
            className="h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
            disabled={isPending}
          >
            <option value="lifestyle">Lifestyle</option>
            <option value="workout">Workout</option>
            <option value="nutrition">Nutrition</option>
            <option value="recovery">Recovery</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!newTask.trim() || isPending}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  pending,
}: {
  task: AdminClientTask;
  onToggle: () => void;
  onDelete: () => void;
  pending?: boolean;
}) {
  const categoryColors: Record<string, string> = {
    workout: '#c6ff3d',
    nutrition: '#ffb84d',
    recovery: '#7dd3ff',
    lifestyle: '#ff6b9d',
  };
  const color = categoryColors[task.category];

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-border-soft transition-colors',
        task.completed && 'opacity-60',
        pending && 'opacity-50'
      )}
    >
      <button
        onClick={onToggle}
        disabled={pending}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
          task.completed
            ? 'bg-accent border-accent text-bg'
            : 'border border-text-muted hover:border-accent'
        )}
      >
        {task.completed ? <Check size={14} strokeWidth={3} /> : <Circle size={0} />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm font-medium',
            task.completed && 'line-through text-text-muted'
          )}
        >
          {task.title}
        </div>
        {task.scheduledTime && (
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.12em] mt-0.5">
            {task.scheduledTime}
          </div>
        )}
      </div>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.12em] flex-shrink-0"
        style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}
      >
        {task.category}
      </span>
      <button
        onClick={onDelete}
        disabled={pending}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
        aria-label="Delete task"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ─── WORKOUTS TAB ─────────────────────────────────────────────────────
function WorkoutsTab({
  workouts,
  clientId: _clientId,
  onEditWorkout,
  onAssignNew,
}: {
  workouts: AdminClientWorkout[];
  clientId: string;
  onEditWorkout: (date: string) => void;
  onAssignNew: () => void;
}) {
  const router = useRouter();
  const [workoutList, setWorkoutList] = useState(workouts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleDone = (w: AdminClientWorkout) => {
    if (isPending) return;
    const next = !w.completed;
    setWorkoutList((prev) =>
      prev.map((x) => (x.id === w.id ? { ...x, completed: next } : x))
    );
    setPendingId(w.id);

    startTransition(async () => {
      const result = await toggleWorkout(w.id, next);
      setPendingId(null);
      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not update workout.');
        setWorkoutList((prev) =>
          prev.map((x) => (x.id === w.id ? { ...x, completed: w.completed } : x))
        );
      } else {
        router.refresh();
      }
    });
  };

  const deleteForDate = (w: AdminClientWorkout) => {
    if (!w.workoutDate) {
      setErrorMsg('Cannot delete a workout without a date.');
      return;
    }
    setPendingId(w.id);
    setErrorMsg(null);
    startTransition(async () => {
      const result = await deleteDailyPlan({
        clientId: _clientId,
        planDate: w.workoutDate!,
      });
      setPendingId(null);
      setConfirmDeleteId(null);
      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not delete the workout.');
        return;
      }
      // Optimistically remove from list; refresh re-fetches from server.
      setWorkoutList((prev) => prev.filter((x) => x.id !== w.id));
      router.refresh();
    });
  };

  if (workoutList.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Dumbbell />}
          title="No workouts assigned"
          description="Click below to plan today's workout, or use the Progress tab toolbar."
        />
        <button
          onClick={onAssignNew}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          Assign first workout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assigned Workouts"
        subtitle={`${workoutList.length} total · ${
          workoutList.filter((w) => w.completed).length
        } completed`}
      />
      {errorMsg && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
          {errorMsg}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        {workoutList.map((w) => {
          const isRowPending = pendingId === w.id;
          const isConfirming = confirmDeleteId === w.id;
          return (
            <div
              key={w.id}
              className={cn(
                'rounded-2xl bg-bg-card border border-border p-5 hover:border-border-soft transition-colors',
                isRowPending && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold mb-1">
                    {w.category}
                  </div>
                  <div className="font-display font-semibold text-base">{w.name}</div>
                  {w.focus && (
                    <div className="text-xs text-text-muted mt-1">{w.focus}</div>
                  )}
                </div>
                <button
                  onClick={() => toggleDone(w)}
                  disabled={isRowPending}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.12em] flex-shrink-0 transition-all',
                    w.completed
                      ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
                      : 'bg-bg-elevated text-text-muted border border-border hover:border-text-muted'
                  )}
                >
                  {isRowPending ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : w.completed ? (
                    <Check size={10} />
                  ) : null}
                  {w.completed ? 'Done' : 'Mark done'}
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted font-mono pt-3 border-t border-border-soft">
                {w.durationMinutes && <span>{w.durationMinutes} min</span>}
                {w.calories && <span>{w.calories} cal</span>}
                {w.difficulty && <span>{w.difficulty}</span>}
                {w.workoutDate && <span className="ml-auto">{w.workoutDate}</span>}
              </div>

              {/* Edit / Delete row */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() =>
                    w.workoutDate
                      ? onEditWorkout(w.workoutDate)
                      : setErrorMsg('This workout has no date — assign a new one instead.')
                  }
                  disabled={isRowPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50"
                >
                  <Edit3 size={11} />
                  Edit
                </button>
                {isConfirming ? (
                  <>
                    <button
                      onClick={() => deleteForDate(w)}
                      disabled={isRowPending}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-danger text-bg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isRowPending ? 'Deleting…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isRowPending}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-text-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(w.id)}
                    disabled={isRowPending}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full border border-danger/40 bg-danger/10 text-danger text-xs font-semibold hover:bg-danger/20 hover:border-danger transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onAssignNew}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full border border-accent/50 bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 hover:border-accent transition-colors"
      >
        <Plus size={14} strokeWidth={2.5} />
        Assign new workout
      </button>
    </div>
  );
}

// ─── BOOKINGS TAB ─────────────────────────────────────────────────────
function BookingsTab({ bookings }: { bookings: AdminBooking[] }) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock />}
        title="No bookings yet"
        description="This client hasn't made any consultation requests."
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="rounded-2xl bg-bg-card border border-border p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1">
                {b.referenceId}
              </div>
              <div className="font-display font-semibold text-base">{b.serviceName}</div>
              <div className="text-xs text-text-muted mt-1">With {b.expertName}</div>
            </div>
            <StatusBadge
              status={b.status}
              variant={
                b.status === 'scheduled'
                  ? 'info'
                  : b.status === 'completed'
                    ? 'success'
                    : b.status === 'cancelled' || b.status === 'no_show'
                      ? 'danger'
                      : 'warning'
              }
            />
          </div>
          {b.scheduledDatetime && (
            <div className="text-xs font-mono text-text-muted">
              Scheduled: {new Date(b.scheduledDatetime).toLocaleString('en-GB')}
            </div>
          )}
          {b.notes && (
            <div className="mt-3 pt-3 border-t border-border-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1">
                Notes
              </div>
              <div className="text-xs text-text-muted leading-relaxed">{b.notes}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PHOTOS TAB ────────────────────────────────────────────────────────
function PhotosTab({
  photos,
  clientId,
  clientName,
}: {
  photos: AdminClientPhotoSet[];
  clientId: string;
  clientName: string;
}) {
  const firstName = clientName.split(' ')[0];

  if (photos.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Camera />}
          title="No photos yet"
          description={`No transformation check-in photos uploaded for ${firstName}. Add the first set to start tracking visual progress.`}
        />
        <UploadPhotoSetButton />
      </div>
    );
  }

  const latest = photos[0];
  const baseline = photos.find((p) => p.isBaseline);
  const weightChange =
    latest.weightKg && baseline?.weightKg
      ? (latest.weightKg - baseline.weightKg).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      {baseline && latest.id !== baseline.id && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
              <TrendingDown size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
                Transformation so far
              </div>
              <div className="font-display font-semibold text-lg">
                {weightChange && (
                  <>
                    {parseFloat(weightChange) < 0 ? 'Down' : 'Up'}{' '}
                    <span className="text-accent">{Math.abs(parseFloat(weightChange))}kg</span>{' '}
                  </>
                )}
                across {photos.length} check-in{photos.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-text-muted mt-1">
                From {baseline.checkInDate} → {latest.checkInDate}
                {baseline.bodyFatPercent && latest.bodyFatPercent && (
                  <>
                    {' '}
                    · Body fat {baseline.bodyFatPercent}% →{' '}
                    <span className="text-accent font-mono">{latest.bodyFatPercent}%</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload CTA */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Check-in photos"
          subtitle="Most recent first · front, side, and back views per session"
        />
        <UploadPhotoSetButton />
      </div>

      {/* Photo set cards */}
      <div className="space-y-4">
        {photos.map((set, idx) => (
          <PhotoSetCard
            key={set.id}
            photoSet={set}
            index={photos.length - idx}
            clientId={clientId}
          />
        ))}
      </div>

      {/* Helper note */}
      <div className="rounded-xl bg-bg-card border border-border p-4">
        <p className="text-[11px] text-text-muted leading-relaxed">
          <span className="font-mono text-accent font-bold uppercase tracking-[0.14em]">Photos are private</span>{' '}
          — stored in Supabase Storage with row-level security. Only the client and PURE X admins can view them.
          URLs are short-lived (1 hour) and regenerated on each page load.
        </p>
      </div>
    </div>
  );
}

function PhotoSetCard({
  photoSet,
  index,
  clientId,
}: {
  photoSet: AdminClientPhotoSet;
  index: number;
  clientId: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs flex-shrink-0"
            style={{
              background: photoSet.isBaseline
                ? 'rgba(125, 211, 255, 0.12)'
                : 'rgba(198, 255, 61, 0.1)',
              color: photoSet.isBaseline ? '#7dd3ff' : '#c6ff3d',
              border: `1px solid ${photoSet.isBaseline ? 'rgba(125, 211, 255, 0.3)' : 'rgba(198, 255, 61, 0.25)'}`,
            }}
          >
            #{index}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-display font-semibold text-base">
                {photoSet.checkInDate}
              </div>
              {photoSet.isBaseline && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky/10 text-sky text-[10px] font-mono font-bold uppercase tracking-[0.12em] border border-sky/30">
                  Baseline
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted font-mono">
              {photoSet.weightKg && <span>{photoSet.weightKg} kg</span>}
              {photoSet.bodyFatPercent && <span>{photoSet.bodyFatPercent}% BF</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Three photo slots: front / side / back — real upload components */}
      <div className="grid grid-cols-3 gap-px bg-border-soft">
        <PhotoUpload
          clientId={clientId}
          mode="progress"
          currentUrl={photoSet.frontPhotoUrl}
          progressMeta={{ checkInDate: photoSet.checkInDate, view: 'front' }}
          label="Front"
        />
        <PhotoUpload
          clientId={clientId}
          mode="progress"
          currentUrl={photoSet.sidePhotoUrl}
          progressMeta={{ checkInDate: photoSet.checkInDate, view: 'side' }}
          label="Side"
        />
        <PhotoUpload
          clientId={clientId}
          mode="progress"
          currentUrl={photoSet.backPhotoUrl}
          progressMeta={{ checkInDate: photoSet.checkInDate, view: 'back' }}
          label="Back"
        />
      </div>

      {/* Coach notes */}
      {photoSet.coachNotes && (
        <div className="px-5 py-4 border-t border-border-soft">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5">
            Coach notes
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{photoSet.coachNotes}</p>
        </div>
      )}
    </div>
  );
}

function UploadPhotoSetButton() {
  return (
    <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors flex-shrink-0">
      <Camera size={14} />
      Add check-in
    </button>
  );
}

// ─── APPS TAB ─────────────────────────────────────────────────────────
function AppsTab({
  apps,
  internalActions,
  clientName,
}: {
  apps: AdminSuggestedApp[];
  internalActions: AdminInternalAction[];
  clientName: string;
}) {
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'internal' | 'apps'>('all');

  const toggleApp = (id: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAction = (id: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSelected = selectedApps.size + selectedActions.size;
  const showInternal = sectionFilter === 'all' || sectionFilter === 'internal';
  const showApps = sectionFilter === 'all' || sectionFilter === 'apps';

  return (
    <div className="space-y-6">
      {/* Section intro + filter */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg">Recommend to {clientName.split(' ')[0]}</h2>
          <p className="text-xs text-text-muted mt-0.5 max-w-xl">
            Pick internal actions (book sessions, assign workouts) or external apps. They'll be
            sent to the client via WhatsApp or email.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-bg-card border border-border rounded-full p-1">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'internal' as const, label: 'PURE X' },
            { id: 'apps' as const, label: 'Apps' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSectionFilter(f.id)}
              className={cn(
                'px-3 h-7 rounded-full text-[11px] font-medium transition-colors',
                sectionFilter === f.id
                  ? 'bg-accent text-bg'
                  : 'text-text-muted hover:text-text'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Internal PURE X actions */}
      {showInternal && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center">
              <Zap size={12} />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
              PURE X Actions
            </div>
            <div className="h-px flex-1 bg-border-soft" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {internalActions.map((action) => {
              const selected = selectedActions.has(action.id);
              return (
                <button
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  className={cn(
                    'text-left p-4 rounded-2xl border transition-all',
                    selected
                      ? 'bg-accent/5 border-accent/40'
                      : 'bg-bg-card border-border hover:border-border-soft'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{action.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-display font-semibold text-base">{action.name}</div>
                        {selected && <SelectedCheck />}
                      </div>
                      <div className="text-[10px] text-accent font-mono uppercase tracking-[0.14em] font-bold mt-0.5">
                        {action.category}
                      </div>
                      <div className="text-xs text-text-muted mt-1.5">{action.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* External apps */}
      {showApps && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-sky/10 text-sky flex items-center justify-center">
              <Sparkles size={12} />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
              External Apps
            </div>
            <div className="h-px flex-1 bg-border-soft" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {apps.map((app) => {
              const selected = selectedApps.has(app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => toggleApp(app.id)}
                  className={cn(
                    'text-left p-4 rounded-2xl border transition-all',
                    selected
                      ? 'bg-accent/5 border-accent/40'
                      : 'bg-bg-card border-border hover:border-border-soft'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">{app.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-display font-semibold text-base">{app.name}</div>
                        {selected && <SelectedCheck />}
                      </div>
                      <div className="text-[10px] text-sky font-mono uppercase tracking-[0.14em] font-bold mt-0.5">
                        {app.category}
                      </div>
                      <div className="text-xs text-text-muted mt-1.5">{app.description}</div>
                      {app.deepLink && (
                        <a
                          href={app.deepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 mt-2 text-[10px] text-text-muted hover:text-accent font-mono uppercase tracking-[0.14em]"
                        >
                          Visit site <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky send panel */}
      {totalSelected > 0 && (
        <div className="rounded-2xl bg-bg-card border border-accent/30 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-3">
            Personal note to include
          </div>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            placeholder={`Hi ${clientName.split(' ')[0]}, based on our chat today I'd recommend these...`}
            className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-text-muted">
              Recommending{' '}
              <span className="text-accent font-mono font-bold">
                {selectedActions.size} action{selectedActions.size !== 1 ? 's' : ''}
              </span>{' '}
              +{' '}
              <span className="text-sky font-mono font-bold">
                {selectedApps.size} app{selectedApps.size !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border text-xs font-medium hover:border-accent/50 transition-colors">
                <MessageCircleShort />
                WhatsApp
              </button>
              <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors">
                <Send size={12} />
                Send
              </button>
            </div>
          </div>
          <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.14em] mt-3">
            Dev: UI only — wire to WhatsApp API / email service next iteration
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedCheck() {
  return (
    <span
      className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0"
      style={{ boxShadow: '0 0 6px rgba(198, 255, 61, 0.5)' }}
    >
      <Check size={10} strokeWidth={3} className="text-bg" />
    </span>
  );
}

function MessageCircleShort() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display font-semibold text-lg">{title}</h2>
      {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-elevated text-text-muted flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <div className="font-display font-semibold text-lg mb-2">{title}</div>
      <p className="text-sm text-text-muted max-w-md mx-auto">{description}</p>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  sublabel,
  trend,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  progress?: number;
}) {
  return (
    <div className="rounded-xl bg-bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="w-7 h-7 rounded-lg bg-bg-elevated text-accent flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-[0.12em] font-bold',
              trend.direction === 'down' ? 'text-accent' : 'text-amber'
            )}
          >
            {trend.direction === 'down' ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-bold mb-0.5">
        {label}
      </div>
      <div className="font-display font-bold text-lg tracking-tight leading-none">{value}</div>
      {sublabel && <div className="text-[10px] text-text-muted mt-0.5">{sublabel}</div>}
      {typeof progress === 'number' && (
        <div className="h-1 rounded-full bg-bg-elevated overflow-hidden mt-2">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function LogMetricsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-bg-card border border-dashed border-accent/40 hover:border-accent p-4 text-center transition-colors group"
    >
      <Plus
        size={18}
        className="mx-auto mb-1.5 text-accent group-hover:scale-110 transition-transform"
        strokeWidth={2}
      />
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent font-bold">
        Log metrics
      </div>
    </button>
  );
}
