-- ==============================================================================
-- NutriFit AI — Complete Supabase PostgreSQL Schema + Row Level Security (RLS)
-- ==============================================================================
-- Covers all 18 required tables, indexes, updated_at triggers, and private
-- per-user RLS policies.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Rohan',
  age INTEGER NOT NULL CHECK (age BETWEEN 10 AND 120),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm > 0),
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0),
  bmi NUMERIC(4,1),
  body_fat_pct NUMERIC(4,1),
  skeletal_muscle_mass_kg NUMERIC(5,2),
  waist_cm NUMERIC(5,1),
  visceral_fat_level INTEGER,
  bmr_kcal INTEGER,
  tee_kcal INTEGER,
  diet_type TEXT NOT NULL DEFAULT 'pure_veg_no_egg',
  activity_level TEXT NOT NULL DEFAULT 'gym_4_5_days',
  food_preference TEXT NOT NULL DEFAULT 'Homemade Indian food',
  goal TEXT NOT NULL DEFAULT 'lean_athletic',
  allergies TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. body_scans (EVOLT 360 & future BIA scans; informational only, not medical diagnosis)
CREATE TABLE IF NOT EXISTS public.body_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  device_name TEXT NOT NULL DEFAULT 'EVOLT 360',
  weight_kg NUMERIC(5,2) NOT NULL,
  bmi NUMERIC(4,1),
  body_fat_pct NUMERIC(4,1),
  skeletal_muscle_mass_kg NUMERIC(5,2),
  waist_cm NUMERIC(5,1),
  visceral_fat_level INTEGER,
  bmr_kcal INTEGER,
  tee_kcal INTEGER,
  report_storage_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_body_scans_user_date ON public.body_scans(user_id, scan_date DESC);

-- 3. body_measurements
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  waist_cm NUMERIC(5,1),
  chest_cm NUMERIC(5,1),
  arm_cm NUMERIC(5,1),
  thigh_cm NUMERIC(5,1),
  body_fat_pct NUMERIC(4,1),
  skeletal_muscle_mass_kg NUMERIC(5,2),
  visceral_fat_level INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON public.body_measurements(user_id, measured_date DESC);

-- 4. foods (Indian Vegetarian Food Database + Custom User Foods)
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global verified Indian DB
  name TEXT NOT NULL,
  hindi_or_regional_name TEXT,
  category TEXT NOT NULL,
  calories NUMERIC(7,2) NOT NULL,
  protein_g NUMERIC(6,2) NOT NULL,
  carbs_g NUMERIC(6,2) NOT NULL,
  fat_g NUMERIC(6,2) NOT NULL,
  fiber_g NUMERIC(6,2) DEFAULT 0,
  serving_size NUMERIC(7,2) NOT NULL DEFAULT 1,
  serving_unit TEXT NOT NULL DEFAULT 'bowl',
  weight_grams NUMERIC(7,2) NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('raw', 'cooked', 'packaged')),
  source TEXT NOT NULL DEFAULT 'ICMR-NIN / Homemade Standard',
  confidence TEXT NOT NULL CHECK (confidence IN ('verified', 'estimate')) DEFAULT 'verified',
  is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
  has_egg BOOLEAN NOT NULL DEFAULT FALSE,
  oil_or_ghee_included_g NUMERIC(5,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods USING gin (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_foods_user ON public.foods(user_id);

-- 5. recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  prep_time_min INTEGER NOT NULL DEFAULT 20,
  servings INTEGER NOT NULL DEFAULT 1,
  calories_per_serving NUMERIC(7,2) NOT NULL,
  protein_per_serving NUMERIC(6,2) NOT NULL,
  carbs_per_serving NUMERIC(6,2) NOT NULL,
  fat_per_serving NUMERIC(6,2) NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions TEXT[] NOT NULL DEFAULT '{}',
  oil_ghee_notes TEXT,
  is_vegetarian BOOLEAN NOT NULL DEFAULT TRUE,
  has_egg BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty TEXT DEFAULT 'Easy',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. nutrition_targets
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_kcal INTEGER NOT NULL DEFAULT 1800,
  protein_g INTEGER NOT NULL DEFAULT 130,
  carbs_g INTEGER NOT NULL DEFAULT 155,
  fat_g INTEGER NOT NULL DEFAULT 65,
  water_ml INTEGER NOT NULL DEFAULT 3000,
  goal TEXT NOT NULL DEFAULT 'lean_athletic',
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  rationale TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. meals (Saved Favorite Meals & Templates)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  items JSONB NOT NULL DEFAULT '[]',
  total_calories NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_protein_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_carbs_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_fat_g NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. food_logs
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  quantity NUMERIC(7,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'serving',
  weight_grams NUMERIC(7,2) NOT NULL DEFAULT 100,
  calories NUMERIC(7,2) NOT NULL,
  protein_g NUMERIC(6,2) NOT NULL,
  carbs_g NUMERIC(6,2) NOT NULL,
  fat_g NUMERIC(6,2) NOT NULL,
  logging_method TEXT NOT NULL CHECK (logging_method IN ('manual', 'ai_photo', 'voice', 'meal_plan', 'quick_copy')) DEFAULT 'manual',
  confidence TEXT NOT NULL CHECK (confidence IN ('verified', 'ai_confirmed_estimate')) DEFAULT 'verified',
  oil_ghee_grams NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, log_date);

-- 9. meal_plans
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', '7_day', '30_day')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  days JSONB NOT NULL DEFAULT '[]',
  target_calories INTEGER NOT NULL,
  target_protein_g INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. grocery_lists
CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')) DEFAULT 'weekly',
  items JSONB NOT NULL DEFAULT '[]',
  estimated_total_inr NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. exercises (Exercise Library)
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT NOT NULL,
  instructions TEXT,
  is_compound BOOLEAN DEFAULT FALSE
);

-- 12. workouts (4-to-5 Day Customizable Routine)
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  title TEXT NOT NULL,
  focus TEXT NOT NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  planned_exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. workout_logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 45,
  exercises JSONB NOT NULL DEFAULT '[]',
  cardio_type TEXT,
  cardio_minutes INTEGER DEFAULT 0,
  recovery_notes TEXT,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, workout_date DESC);

-- 14. water_logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, log_date);

-- 15. habit_logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC(4,2) DEFAULT 7.5,
  steps INTEGER DEFAULT 0,
  workout_completed BOOLEAN DEFAULT FALSE,
  meals_logged_completed BOOLEAN DEFAULT FALSE,
  protein_target_hit BOOLEAN DEFAULT FALSE,
  consistency_score INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(user_id, log_date)
);

-- 16. progress_photos (Private storage references only)
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pose TEXT NOT NULL CHECK (pose IN ('front', 'side', 'back', 'other')) DEFAULT 'front',
  storage_path TEXT NOT NULL,
  milestone_day INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. ai_conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, created_at);

-- 18. user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  units TEXT NOT NULL DEFAULT 'metric',
  currency TEXT NOT NULL DEFAULT 'INR',
  reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  local_caching_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) — Strictly Private Per-User Access
-- ==============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for user-owned tables
CREATE POLICY "own_profile" ON public.user_profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own_scans" ON public.body_scans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_measurements" ON public.body_measurements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_global_or_own_foods" ON public.foods FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "write_own_foods" ON public.foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_foods" ON public.foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_foods" ON public.foods FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "read_global_or_own_recipes" ON public.recipes FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "write_own_recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_targets" ON public.nutrition_targets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_meals" ON public.meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_food_logs" ON public.food_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_meal_plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_grocery_lists" ON public.grocery_lists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_global_or_own_exercises" ON public.exercises FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "own_workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_workout_logs" ON public.workout_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_water_logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_habit_logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_progress_photos" ON public.progress_photos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_ai_conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Private Storage Buckets (run in Supabase SQL editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('body-scans', 'body-scans', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('food-scans', 'food-scans', false) ON CONFLICT DO NOTHING;
