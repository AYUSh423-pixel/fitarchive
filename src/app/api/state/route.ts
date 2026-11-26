import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { DEFAULT_USER_ID, todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';
import { calculateBmi, calculateBmr, calculateRecommendedTargets, calculateTee } from '@/lib/nutrition-engine';
import { validateRequest, statePatchSchema } from '@/lib/validation';
import { logger, generateRequestId } from '@/lib/logger';
import { apiRateLimiter, applyRateLimit, getClientKey } from '@/lib/rate-limit';
import type { DietType } from '@/types/nutrifit';

export async function GET(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(req, apiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;
    const { db, session } = guard;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || todayIsoDate();

    const dayFoodLogs = db.foodLogs.filter((l) => l.logDate === date);
    const dayWaterMl = db.waterLogs
      .filter((w) => w.logDate === date)
      .reduce((sum, w) => sum + w.amountMl, 0);
    const dayHabit = db.habitLogs.find((h) => h.logDate === date) ?? null;

    const headers = rateLimitResult?.headers || {};
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
      aiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY),
      supabaseConfigured: isSupabaseEnabled(),
    }, { headers });
  } catch (err) {
    logger.error('State GET error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const requestId = generateRequestId();
  const clientKey = getClientKey(req);

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(req, apiRateLimiter, clientKey);
  if (rateLimitResult && !rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const guard = await requireAuth();
    if (guard.error) return guard.error;
    const { session } = guard;

    // Validate request body
    const validation = await validateRequest(req, statePatchSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;
    const isSupabaseUser = isSupabaseEnabled() && supabaseAdmin && guard.session.userId !== DEFAULT_USER_ID;
    const headers = rateLimitResult?.headers || {};

    if (isSupabaseUser && supabaseAdmin) {
      if (body.profile) {
        const p = { ...guard.db.profile, ...body.profile } as typeof guard.db.profile;
        const bmi = calculateBmi(Number(p.weightKg), Number(p.heightCm));
        let bmrKcal = p.bmrKcal;
        let teeKcal = p.teeKcal;

        if (body.recalculateMetabolism || !bmrKcal) {
          bmrKcal = calculateBmr(Number(p.weightKg), Number(p.heightCm), Number(p.age), p.gender);
          teeKcal = calculateTee(bmrKcal, p.activityLevel);
        }

        await supabaseAdmin
          .from('user_profiles')
          .update({
            name: p.name,
            age: p.age,
            gender: p.gender,
            height_cm: p.heightCm,
            weight_kg: p.weightKg,
            bmi,
            bmr_kcal: bmrKcal,
            tee_kcal: teeKcal,
            diet_type: p.dietType,
            activity_level: p.activityLevel,
            food_preference: p.foodPreference,
            goal: p.goal,
            onboarding_completed: Boolean(p.onboardingCompleted),
            updated_at: new Date().toISOString(),
          })
          .eq('id', guard.session.userId);

        if (body.recalculateTargets) {
          const calc = calculateRecommendedTargets({ ...p, bmi, bmrKcal, teeKcal });
          await supabaseAdmin
            .from('nutrition_targets')
            .upsert({
              user_id: guard.session.userId,
              calories_kcal: calc.caloriesKcal,
              protein_g: calc.proteinG,
              carbs_g: calc.carbsG,
              fat_g: calc.fatG,
              water_ml: calc.waterMl,
            }, { onConflict: 'user_id' });
        }

        logger.audit('Profile updated', { fields: Object.keys(body.profile) }, session.userId, requestId);
      }

      if (body.nutritionTargets) {
        const t = body.nutritionTargets;
        const safeCalories = Math.max(1300, Number(t.caloriesKcal ?? 1800));
        await supabaseAdmin
          .from('nutrition_targets')
          .upsert({
            user_id: guard.session.userId,
            calories_kcal: safeCalories,
            protein_g: t.proteinG,
            carbs_g: t.carbsG,
            fat_g: t.fatG,
            water_ml: t.waterMl,
          }, { onConflict: 'user_id' });

        logger.audit('Nutrition targets updated', {}, session.userId, requestId);
      }

      if (body.preferences) {
        // Preferences are stored in user_preferences table in Supabase
        await supabaseAdmin
          .from('user_preferences')
          .upsert({
            user_id: guard.session.userId,
            ...body.preferences,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }

      // Re-fetch updated state
      const refreshed = await requireAuth();
      return NextResponse.json({
        profile: refreshed.db?.profile,
        nutritionTargets: refreshed.db?.nutritionTargets,
        preferences: refreshed.db?.preferences,
      }, { headers });
    }

    // Local mode fallback
    const updated = updateDatabase((draft) => {
      if (body.profile) {
        const p = { ...draft.profile, ...body.profile, updatedAt: new Date().toISOString() } as typeof draft.profile;
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

    logger.audit('State updated (local)', { fields: Object.keys(body) }, session.userId, requestId);
    return NextResponse.json({
      profile: updated.profile,
      nutritionTargets: updated.nutritionTargets,
      preferences: updated.preferences,
    }, { headers });
  } catch (err) {
    logger.error('State PATCH error', { error: err }, undefined, requestId);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: rateLimitResult?.headers || {} });
  }
}