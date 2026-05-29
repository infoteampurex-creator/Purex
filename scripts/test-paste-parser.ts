/**
 * Manual sanity test for the paste parser. Run with:
 *   npx tsx scripts/test-paste-parser.ts
 *
 * Not wired to CI — purely for spot-checking against Siva's actual
 * input format when we iterate on the parser.
 */
import { parsePastedWeeklyPlan } from '@/lib/data/weekly-plan-paste';

const sample = `*Monday*
Inclined chest press
Cable cross over
Cable shrugs
Reardelt fly
Tricep push down
Tricep extention
*Abs*
Weight cable crunches
Wood choppers
Leg raises

*Tuesday*
Pull ups/assisted pull ups
Lat pull down
Chest supported dumbbell rowing
Single arm dumbbell/cable rowing
Inclined bicep curls
Hammer curls
Bicep curls
Wrist curls
Reverse wrist curls


*Wednesday*
Smith squats/barbell squats
Split squats
Leg extensions
Harmsting curls
Calf raises
Shoulder press
Lateral raises

*Thursday rest walking must*

*Friday*
Flat dumbbell press
Cable crossover
Low to high cable fly
Pull ups
Close grip cable rowing
Chest supported rowing
Tricep push down
Tricep extension
Bicep curls
Hammer curls


*Saturday*
Smith squats/barbell squats
Split squats
Leg extensions
Harmsting curls
Calf raises
Shoulder press
Lateral raises

*Abs*
Cable crunches
Wood choppers
Leg raises

*Sunday active rest`;

const out = parsePastedWeeklyPlan(sample);
const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
for (const d of out.days) {
  if (d.isRest) {
    console.log(`${DAY[d.dayOfWeek]}: REST${d.restNote ? ' — ' + d.restNote : ''}`);
  } else {
    console.log(`${DAY[d.dayOfWeek]}: ${d.exerciseLines.length} exercises`);
    for (const ex of d.exerciseLines) console.log('  · ' + ex);
  }
}
