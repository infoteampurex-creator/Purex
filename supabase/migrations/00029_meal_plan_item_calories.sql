-- ═════════════════════════════════════════════════════════════════════
-- Migration 00029 — Per-item calories on coach-assigned diet plans
-- ─────────────────────────────────────────────────────────────────────
-- Team request: "Calories for every portion has to shown and show
-- alternative breakfast with similar calories."
--
-- The client_meal_plan_items table previously stored only food_name,
-- quantity, item_order, and notes — calories were implicit in the
-- daily target on the parent plan. With this column the coach can
-- spell out the kcal per portion explicitly, the client sees it
-- in /client/nutrition, and the new "swap" UI on the client side
-- can pick alternatives within ±15% kcal from the curated food
-- library.
--
-- Nullable so existing plan rows continue to load. New rows the
-- coach saves through the diet editor populate it.
-- ═════════════════════════════════════════════════════════════════════

alter table public.client_meal_plan_items
  add column if not exists calories smallint;

comment on column public.client_meal_plan_items.calories is
  'Per-portion kcal for this item. Optional — coach fills in to enable per-item display + swap suggestions on the client.';

-- Force PostgREST schema reload.
notify pgrst, 'reload schema';
