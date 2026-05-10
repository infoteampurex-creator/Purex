import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TemplatesList } from '@/components/admin/TemplatesList';
import { loadWorkoutTemplate } from '@/lib/actions/workout-templates';
import {
  getCachedActiveExerciseLibrary,
  getCachedWorkoutTemplates,
} from '@/lib/data/cached-queries';
import { type LibraryExerciseOption } from '@/lib/data/daily-plan-types';

export const metadata = { title: 'Admin · Templates' };

export default async function AdminTemplatesPage() {
  const [templates, libraryRows] = await Promise.all([
    getCachedWorkoutTemplates(),
    getCachedActiveExerciseLibrary(),
  ]);

  const exerciseLibrary: LibraryExerciseOption[] = libraryRows.map((e) => ({
    slug: e.slug,
    name: e.name,
    category: e.category,
    defaultSets: e.defaultSets ?? null,
    defaultReps: e.defaultReps ?? null,
    defaultRestSeconds: e.defaultRestSeconds ?? null,
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Library"
        title="Workout Templates"
        subtitle="Reusable workouts with exercises pre-loaded. Build them once, then apply to any client's day with a single click instead of typing 7-8 exercises from scratch every time."
      />

      <TemplatesList
        templates={templates}
        exerciseLibrary={exerciseLibrary}
        loadTemplate={loadWorkoutTemplate}
      />
    </>
  );
}
