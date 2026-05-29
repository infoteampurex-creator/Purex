/**
 * Manual sanity test for the diet plan parser. Run with:
 *   npx tsx scripts/test-diet-parser.ts
 *
 * Locks in the parser's behavior against Siva's real WhatsApp format.
 */
import { parsePastedDietPlan } from '@/lib/data/meal-plan-paste';

const sample = `*Breakfast*
• Oats – 60g
• Skim Milk – 150ml
• Blueberries – 50g
• Chia Seeds – 5g
• Flax Seeds – 5g
• Watermelon Seeds – 5g
• Sunflower Seeds – 5g
• 1 Whole Egg + 3 Egg Whites
• Apple – 100g

*Lunch*
• White Rice – 275g (cooked)
• Chicken Breast – 200g (cooked)
• Cucumber – 100g
• Carrot – 50g
• Curd – 100g

 *Pre-Workout*
• Banana – 200g

*Dinner*
• White Rice – 275g (cooked)
• Chicken Breast – 200g (cooked)
• Carrot – 75g
• Cucumber – 100g

*Cooking Oil*
• Olive Oil – 10ml (total for the day)

*Daily Macros*
• Calories – 2,500 kcal
• Carbs – 310–315g
• Protein – 185–190g
• Fats – 53–56g


Note-
4 ltrs water intake is mandatory
10k steps everyday
7 hours sleep`;

const out = parsePastedDietPlan(sample);

console.log('═══ MEALS ═══');
for (const m of out.meals) {
  console.log(`\n${m.name} (type=${m.mealType ?? 'unknown'}) — ${m.items.length} items`);
  for (const it of m.items) {
    console.log(`  · ${it.foodName}${it.quantity ? ' — ' + it.quantity : ''}`);
  }
}

console.log('\n═══ COOKING OIL ═══');
console.log(out.cookingOilNote);

console.log('\n═══ MACROS ═══');
console.log(`  calories: ${out.macros.calories}`);
console.log(`  carbs:    ${out.macros.carbsMin}–${out.macros.carbsMax}g`);
console.log(`  protein:  ${out.macros.proteinMin}–${out.macros.proteinMax}g`);
console.log(`  fats:     ${out.macros.fatsMin}–${out.macros.fatsMax}g`);

console.log('\n═══ LIFESTYLE ═══');
console.log(`  water: ${out.lifestyle.waterLiters} L`);
console.log(`  steps: ${out.lifestyle.stepsTarget}`);
console.log(`  sleep: ${out.lifestyle.sleepHours} h`);

console.log('\n═══ NOTES (free text) ═══');
console.log(out.notesFreeText);

console.log('\n═══ UNPARSED ═══');
console.log(out.unparsedLines.length === 0 ? '(none)' : out.unparsedLines);
