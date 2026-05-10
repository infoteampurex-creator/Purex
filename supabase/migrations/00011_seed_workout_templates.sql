-- ════════════════════════════════════════════════════════════════════
-- PURE X — Starter workout templates seed
-- ════════════════════════════════════════════════════════════════════
--
-- Six reusable templates covering most weekly programming. Each
-- template is editable from /admin/templates after this runs — change
-- the name, swap exercises, tune sets/reps/rest, or delete entirely.
--
-- Idempotent: re-running this file updates the child exercises but
-- keeps each template's id stable, so plans already applied to client
-- days don't lose their connection.
--
-- Run order: after 00010_workout_templates.sql
-- ════════════════════════════════════════════════════════════════════

do $seed$
declare
  tpl_id uuid;
begin

-- ════════════════════════════════════════════════════════════════════
-- 1. Push Day A — bench, OHP, dips
-- ════════════════════════════════════════════════════════════════════
select id into tpl_id from public.workout_templates where name = 'Push Day A' limit 1;
if tpl_id is null then
  insert into public.workout_templates
    (name, category, target_muscle_group, difficulty, description,
     trainer_notes, estimated_duration_minutes, is_shared)
  values
    ('Push Day A', 'Strength', 'Push (Chest · Shoulders · Triceps)',
     'intermediate',
     'Heavy push day — bench, overhead press, dips, core finisher. ~60 min.',
     'Top sets at RPE 8. Drop weight on assistance to keep form clean. Track top-set weight week-over-week.',
     60, true)
  returning id into tpl_id;
end if;
delete from public.workout_template_exercises where template_id = tpl_id;

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Chest', 4, '5-8', 180, 8,
       'Top set RPE 8. Pause briefly on the chest, drive up explosively.', 0
from public.exercise_library el where el.slug = 'barbell-bench-press';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Shoulders', 3, '6-8', 120, 7,
       'Strict press — no leg drive. Squeeze glutes for stability.', 1
from public.exercise_library el where el.slug = 'overhead-press';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Chest · Triceps', 3, '8-10', 90, 8,
       'Body upright for triceps focus, lean forward for chest emphasis.', 2
from public.exercise_library el where el.slug = 'parallel-bar-dip';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Core', 3, '60s hold', 60, null,
       'Tight glutes, ribs down, breathe normally.', 3
from public.exercise_library el where el.slug = 'plank';


-- ════════════════════════════════════════════════════════════════════
-- 2. Pull Day A — deadlift, pull-ups, rows
-- ════════════════════════════════════════════════════════════════════
select id into tpl_id from public.workout_templates where name = 'Pull Day A' limit 1;
if tpl_id is null then
  insert into public.workout_templates
    (name, category, target_muscle_group, difficulty, description,
     trainer_notes, estimated_duration_minutes, is_shared)
  values
    ('Pull Day A', 'Strength', 'Pull (Back · Biceps · Posterior chain)',
     'intermediate',
     'Heavy pull day — deadlift, pull-ups, rows, core. ~60 min.',
     'Deadlift first while fresh. Drop weight if grip fails before form does.',
     60, true)
  returning id into tpl_id;
end if;
delete from public.workout_template_exercises where template_id = tpl_id;

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Posterior chain', 4, '3-5', 240, 8,
       'Set lats, brace, take slack out of bar before each rep. Reset between reps.', 0
from public.exercise_library el where el.slug = 'conventional-deadlift';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Back · Biceps', 4, '6-10', 120, 8,
       'Chin clears the bar each rep. Pause at top, control the descent.', 1
from public.exercise_library el where el.slug = 'pull-up';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Mid-back', 3, '8-10', 90, 7,
       'Hinge at hips ~45°. Pull elbow to hip, squeeze shoulder blade.', 2
from public.exercise_library el where el.slug = 'barbell-bent-over-row';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Core', 3, '60s hold', 60, null,
       'Tight glutes, ribs down, breathe normally.', 3
from public.exercise_library el where el.slug = 'plank';


-- ════════════════════════════════════════════════════════════════════
-- 3. Lower Body A — Quad focus
-- ════════════════════════════════════════════════════════════════════
select id into tpl_id from public.workout_templates where name = 'Lower Body A · Quad Focus' limit 1;
if tpl_id is null then
  insert into public.workout_templates
    (name, category, target_muscle_group, difficulty, description,
     trainer_notes, estimated_duration_minutes, is_shared)
  values
    ('Lower Body A · Quad Focus', 'Strength', 'Legs (Quads · Glutes)',
     'intermediate',
     'Squat-led leg day with single-leg work and explosive jumps. ~55 min.',
     'Warm up with bodyweight squats + 10 box jumps before loading the bar.',
     55, true)
  returning id into tpl_id;
end if;
delete from public.workout_template_exercises where template_id = tpl_id;

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Quads · Glutes', 4, '5-8', 180, 8,
       'Hip crease below knee on every rep. Drive through midfoot, not toes.', 0
from public.exercise_library el where el.slug = 'barbell-back-squat';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Quads · Glutes', 3, '10-12 each leg', 90, 7,
       'Long stride, knee tracks over toes, full hip extension at top.', 1
from public.exercise_library el where el.slug = 'walking-lunge';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Glutes · Calves', 3, '5', 90, null,
       'Soft landing, full hip extension at top of jump. Reset before each rep.', 2
from public.exercise_library el where el.slug = 'box-jump';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Core', 3, '45s hold', 60, null,
       'Tight glutes, ribs down, breathe normally.', 3
from public.exercise_library el where el.slug = 'plank';


-- ════════════════════════════════════════════════════════════════════
-- 4. Lower Body B — Hip / hamstring focus
-- ════════════════════════════════════════════════════════════════════
select id into tpl_id from public.workout_templates where name = 'Lower Body B · Hip & Hamstring' limit 1;
if tpl_id is null then
  insert into public.workout_templates
    (name, category, target_muscle_group, difficulty, description,
     trainer_notes, estimated_duration_minutes, is_shared)
  values
    ('Lower Body B · Hip & Hamstring', 'Strength', 'Legs (Hams · Glutes)',
     'intermediate',
     'Hinge-led leg day. Romanian deadlifts, swings, lunges, carries.',
     'Brace the trunk hard on every rep. Glutes drive every lockout.',
     55, true)
  returning id into tpl_id;
end if;
delete from public.workout_template_exercises where template_id = tpl_id;

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Hamstrings · Glutes', 4, '6-8', 150, 8,
       'Hinge at hips with soft knees. Bar travels over midfoot.', 0
from public.exercise_library el where el.slug = 'romanian-deadlift';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Posterior chain', 4, '15', 60, 7,
       'Snap the hips, don''t lift with arms. Bell floats up.', 1
from public.exercise_library el where el.slug = 'kettlebell-swing';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Quads · Glutes', 3, '10-12 each leg', 90, 7,
       'Long stride, knee tracks over toes, full hip extension at top.', 2
from public.exercise_library el where el.slug = 'walking-lunge';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Grip · Core', 3, '40m', 90, null,
       'Heavy bells. Stand tall, brace, walk smooth. Don''t shrug.', 3
from public.exercise_library el where el.slug = 'farmer-carry';


-- ════════════════════════════════════════════════════════════════════
-- 5. HYROX Conditioning
-- ════════════════════════════════════════════════════════════════════
select id into tpl_id from public.workout_templates where name = 'HYROX Conditioning' limit 1;
if tpl_id is null then
  insert into public.workout_templates
    (name, category, target_muscle_group, difficulty, description,
     trainer_notes, estimated_duration_minutes, is_shared)
  values
    ('HYROX Conditioning', 'HYROX', 'Full body · Hybrid',
     'intermediate',
     'Race-style circuit. Sled, wall ball, row, burpees. ~45 min.',
     'Treat each station like the race — fast transitions, sustainable pace. Track total time.',
     45, true)
  returning id into tpl_id;
end if;
delete from public.workout_template_exercises where template_id = tpl_id;

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Full body', 4, '20', 60, 7,
       'Catch and throw in one motion. Squat depth on every rep.', 0
from public.exercise_library el where el.slug = 'wall-ball';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Legs · Conditioning', 4, '40m', 90, 8,
       'Low body angle, drive with legs. Short choppy steps.', 1
from public.exercise_library el where el.slug = 'sled-push';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Cardio', 4, '500m', 60, 7,
       'Drive with legs, sequence: legs → back → arms. Smooth recovery.', 2
from public.exercise_library el where el.slug = 'row-erg';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Full body', 3, '10', 45, 8,
       'Full chest to ground, jump up with full hip extension.', 3
from public.exercise_library el where el.slug = 'burpee';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Grip · Core', 3, '40m', 60, 7,
       'Pace yourself — last 10m hurts. Don''t shrug.', 4
from public.exercise_library el where el.slug = 'farmer-carry';


-- ════════════════════════════════════════════════════════════════════
-- 6. Full Body Beginner
-- ════════════════════════════════════════════════════════════════════
select id into tpl_id from public.workout_templates where name = 'Full Body · Beginner' limit 1;
if tpl_id is null then
  insert into public.workout_templates
    (name, category, target_muscle_group, difficulty, description,
     trainer_notes, estimated_duration_minutes, is_shared)
  values
    ('Full Body · Beginner', 'Strength', 'Full body',
     'beginner',
     'Three big lifts + core. Use as a starter program for new clients.',
     'Light weight first 2 weeks. Add 2.5kg only when all sets hit RPE 7 or lower.',
     45, true)
  returning id into tpl_id;
end if;
delete from public.workout_template_exercises where template_id = tpl_id;

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Quads · Glutes', 3, '5', 120, 7,
       'Stay upright, depth before weight. Brace before unrack.', 0
from public.exercise_library el where el.slug = 'barbell-back-squat';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Chest · Shoulders', 3, '5', 120, 7,
       'Feet flat. Bar to chest, slow descent, drive up.', 1
from public.exercise_library el where el.slug = 'barbell-bench-press';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Mid-back', 3, '8', 90, 7,
       'Pull elbow to hip, no jerking. Pause 1 sec at top.', 2
from public.exercise_library el where el.slug = 'barbell-bent-over-row';

insert into public.workout_template_exercises
  (template_id, exercise_library_id, exercise_name, target_muscle, sets, reps,
   rest_seconds, rpe_target, trainer_instruction, exercise_order)
select tpl_id, el.id, el.name, 'Core', 3, '45s hold', 60, null,
       'Tight glutes, ribs down, normal breathing.', 3
from public.exercise_library el where el.slug = 'plank';


end $seed$;
