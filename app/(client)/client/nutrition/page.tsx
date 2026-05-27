import { redirect } from 'next/navigation';
import { Apple } from 'lucide-react';
import { NutritionPageView } from '@/components/client/nutrition/NutritionPageView';
import { getCurrentUserId } from '@/lib/data/client-live';
import { getTwinDailyInputs } from '@/lib/data/twin-server';
import { getTodaysMeals } from '@/lib/data/meals';
import {
  EMPTY_NUTRITION_SNAPSHOT,
  type NutritionSnapshot,
} from '@/lib/data/twin';

export const metadata = {
  title: 'PureX Nutrition · Daily fuel + food sources',
};
export const dynamic = 'force-dynamic';

/**
 * Top-level Nutrition page.
 *
 * Promoted from a buried bottom-sheet to a primary nav surface
 * because logging meals is a daily action — especially for clients
 * outside India where the dashboard food-source affordance felt
 * culturally narrow. This page combines:
 *
 *   • Today's macro totals + targets at the top (hero)
 *   • Today's meals list with delete
 *   • Log meal CTA (opens existing MealLogSheet — no rewrite)
 *   • Browse food ideas (opens existing FoodSourcesSheet, with
 *     cuisine filter so clients narrow to their kitchen)
 *
 * Reuses MealLogSheet + FoodSourcesSheet — the page is a host, not
 * a re-implementation. Both sheets keep working from the dashboard
 * too (Quick Log on Home still opens MealLogSheet).
 */
export default async function NutritionPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const today = new Date().toISOString().slice(0, 10);

  const [inputsResult, meals] = await Promise.all([
    getTwinDailyInputs(userId, today),
    getTodaysMeals(userId, today),
  ]);

  const nutrition: NutritionSnapshot =
    inputsResult.nutrition ?? EMPTY_NUTRITION_SNAPSHOT;

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere — orange-lime to read as "nutrition" */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(255, 138, 77, 0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-24 max-w-3xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#ff8a4d' }}
          >
            <Apple size={12} />
            PureX Nutrition
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-2">
            Today&apos;s fuel
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-xl"
            style={{ fontSize: 15 }}
          >
            Log meals, track macros, browse food ideas by meal type and
            cuisine. Your daily food log feeds the PureX Score on your
            home screen.
          </p>
        </header>

        <NutritionPageView nutrition={nutrition} meals={meals} />
      </div>
    </main>
  );
}
