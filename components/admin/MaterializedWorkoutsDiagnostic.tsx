import { Database, Calendar } from 'lucide-react';

interface UpcomingWorkout {
  workoutDate: string;
  name: string | null;
  exerciseCount: number;
}

interface Props {
  workouts: UpcomingWorkout[];
}

/**
 * Server-rendered diagnostic panel — lives below the WeeklyScheduleEditor
 * on the admin client detail page. Shows what's ACTUALLY in client_workouts
 * for [today, today + 13 days], so the coach can verify the
 * materialization step wrote rows after they hit Save.
 *
 * Why it exists: a previous coach session ended with "I saved but
 * Vishnu doesn't see anything" — without ground-truth visibility into
 * the client_workouts table, debugging is guesswork. With this panel
 * the coach can see day-by-day: which dates have a workout, which are
 * rest, and whether something materialized at all.
 */
export function MaterializedWorkoutsDiagnostic({ workouts }: Props) {
  // Build a 14-day map for visualization
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Array<{
    iso: string;
    dayLabel: string;
    workout: UpcomingWorkout | null;
  }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const workout = workouts.find((w) => w.workoutDate === iso) ?? null;
    const dayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][
      (d.getDay() + 6) % 7
    ];
    days.push({
      iso,
      dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${dayShort} ${d.getDate()}`,
      workout,
    });
  }

  const totalScheduled = workouts.length;

  return (
    <section
      className="rounded-2xl border bg-bg-card p-5 md:p-6"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Database size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
        <h2
          className="font-display font-semibold text-base tracking-tight"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          What the client actually sees (next 14 days)
        </h2>
      </div>
      <p className="text-sm text-text-muted mb-4">
        Live read from <code className="font-mono">client_workouts</code>
        . If a day is empty here, the client&apos;s app shows nothing for
        it either — useful for verifying after you hit Save.
      </p>

      {totalScheduled === 0 ? (
        <div
          className="rounded-xl border border-dashed px-4 py-6 text-center"
          style={{
            borderColor: 'rgba(255,107,107,0.30)',
            background: 'rgba(255,107,107,0.04)',
          }}
        >
          <Calendar
            size={18}
            style={{ color: '#ff9999', margin: '0 auto 8px' }}
          />
          <div
            className="font-display font-semibold mb-1"
            style={{ fontSize: 13, color: '#ff9999' }}
          >
            No materialized workouts
          </div>
          <div
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
          >
            Nothing in <code className="font-mono">client_workouts</code>{' '}
            for the next 14 days. Set the weekly schedule above and hit
            Save — the action will write rows here.
          </div>
        </div>
      ) : (
        <>
          <div
            className="font-mono uppercase tracking-[0.14em] font-bold mb-2"
            style={{ fontSize: 9, color: 'rgba(198,255,61,0.85)' }}
          >
            ✓ {totalScheduled} workout{totalScheduled === 1 ? '' : 's'}{' '}
            scheduled
          </div>
          <ul className="space-y-1">
            {days.map((d) => (
              <li
                key={d.iso}
                className="flex items-center gap-3 rounded-lg px-3 py-1.5"
                style={{
                  background: d.workout
                    ? 'rgba(198,255,61,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: '1px solid '+ (d.workout ? 'rgba(198,255,61,0.15)' : 'rgba(255,255,255,0.05)'),
                }}
              >
                <span
                  className="font-mono uppercase tracking-[0.14em] font-bold w-20"
                  style={{
                    fontSize: 10,
                    color: d.workout
                      ? '#c6ff3d'
                      : 'rgba(255,255,255,0.40)',
                  }}
                >
                  {d.dayLabel}
                </span>
                {d.workout ? (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.90)' }}>
                    {d.workout.name ?? 'Untitled'}
                    <span
                      className="font-mono ml-2"
                      style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
                    >
                      · {d.workout.exerciseCount} exercise
                      {d.workout.exerciseCount === 1 ? '' : 's'}
                    </span>
                  </span>
                ) : (
                  <span
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}
                  >
                    Rest day
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
