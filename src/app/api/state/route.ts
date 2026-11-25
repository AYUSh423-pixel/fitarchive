import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import { calculateBmi, calculateBmr, calculateRecommendedTargets, calculateTee } from '@/lib/nutrition-engine';

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { db } = guard;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || todayIsoDate();

  const dayFoodLogs = db.foodLogs.filter((l) => l.logDate === date);
  const dayWaterMl = db.waterLogs
    .filter((w) => w.logDate === date)
    .reduce((sum, w) => sum + w.amountMl, 0);
  const dayHabit = db.habitLogs.find((h) => h.logDate === date) ?? null;

  return NextResponse.json({
    date,
    profile: db.profile,
    nutritionTargets: db.nutritionTargets,
    dayFoodLogs,
    dayWaterMl,
    dayHabit,
    favoriteMeals: db.favoriteMeals,
    recipes: db.recipes.slice(0, 6),
    bodyMeasurements: db.bodyMeasurements,
    bodyScans: db.bodyScans,
    workoutRoutine: db.workoutRoutine,
    workoutLogs: db.workoutLogs.slice(0, 10),
    preferences: db.preferences,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}

export async function PATCH(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const updated = updateDatabase((draft) => {
      if (body.profile) {
        const p = { ...draft.profile, ...body.profile, updatedAt: new Date().toISOString() };
        // Always enforce pure_veg_no_egg unless explicitly changed, and recalculate BMI/BMR/TEE if height/weight/age changed
        p.bmi = calculateBmi(Number(p.weightKg), Number(p.heightCm));
        if (body.recalculateMetabolism) {
          p.bmrKcal = calculateBmr(Number(p.weightKg), Number(p.heightCm), Number(p.age), p.gender);
          p.teeKcal = calculateTee(p.bmrKcal, p.activityLevel);
        }
        draft.profile = p;

        if (body.recalculateTargets && !draft.nutritionTargets.isManualOverride) {
          const calc = calculateRecommendedTargets(p);
          draft.nutritionTargets = {
            ...draft.nutritionTargets,
            caloriesKcal: calc.caloriesKcal,
            proteinG: calc.proteinG,
            carbsG: calc.carbsG,
            fatG: calc.fatG,
            waterMl: calc.waterMl,
            goal: p.goal,
            rationale: calc.rationale,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      if (body.nutritionTargets) {
        const t = body.nutritionTargets;
        // Enforce safe minimum floor (never starvation diets)
        const safeCalories = Math.max(1300, Number(t.caloriesKcal ?? draft.nutritionTargets.caloriesKcal));
        draft.nutritionTargets = {
          ...draft.nutritionTargets,
          ...t,
          caloriesKcal: safeCalories,
          updatedAt: new Date().toISOString(),
        };
      }

      if (body.preferences) {
        draft.preferences = {
          ...draft.preferences,
          ...body.preferences,
          updatedAt: new Date().toISOString(),
        };
      }
    });

    return NextResponse.json({
      profile: updated.profile,
      nutritionTargets: updated.nutritionTargets,
      preferences: updated.preferences,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
