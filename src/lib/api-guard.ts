import { NextResponse } from 'next/server';
import { getServerSession, type SessionPayload } from '@/lib/auth';
import { DEFAULT_USER_ID, readDatabase } from '@/lib/db/local-store';
import { supabaseAdmin, isSupabaseEnabled } from '@/lib/db/supabase-client';
import type { DatabaseState, FoodUnit, GoalType, MealSlot } from '@/types/nutrifit';

export async function requireAuth(): Promise<
  { session: SessionPayload; db: DatabaseState; error?: never } | { error: NextResponse; session?: never; db?: never }
> {
  const session = await getServerSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 }),
    };
  }

  // 1. If Supabase is enabled and user is an authenticated Supabase user
  if (isSupabaseEnabled() && supabaseAdmin && session.userId !== DEFAULT_USER_ID) {
    try {
      const [
        profileRes,
        targetsRes,
        foodsRes,
        recipesRes,
        foodLogsRes,
        waterLogsRes,
        habitLogsRes,
        mealsRes,
        workoutsRes,
        bodyScansRes,
        bodyMeasurementsRes,
      ] = await Promise.all([
        supabaseAdmin.from('user_profiles').select('*').eq('id', session.userId).single(),
        supabaseAdmin.from('nutrition_targets').select('*').eq('user_id', session.userId).maybeSingle(),
        supabaseAdmin.from('foods').select('*').or(`user_id.is.null,user_id.eq.${session.userId}`),
        supabaseAdmin.from('recipes').select('*').limit(20),
        supabaseAdmin.from('food_logs').select('*').eq('user_id', session.userId).order('logged_at', { ascending: false }),
        supabaseAdmin.from('water_logs').select('*').eq('user_id', session.userId),
        supabaseAdmin.from('habit_logs').select('*').eq('user_id', session.userId),
        supabaseAdmin.from('meals').select('*').eq('user_id', session.userId),
        supabaseAdmin.from('workouts').select('*').eq('user_id', session.userId),
        supabaseAdmin.from('body_scans').select('*').eq('user_id', session.userId).order('scan_date', { ascending: false }),
        supabaseAdmin.from('body_measurements').select('*').eq('user_id', session.userId).order('measured_date', { ascending: false }),
      ]);

      const baseDb = readDatabase();

      if (profileRes.data) {
        const p = profileRes.data;
        const t = targetsRes.data;

        const userProfile: DatabaseState['profile'] = {
          id: p.id,
          name: p.name || 'Member',
          email: p.email || session.email,
          age: Number(p.age || 25),
          gender: p.gender || 'male',
          heightCm: Number(p.height_cm || 170),
          weightKg: Number(p.weight_kg || 70),
          bmi: Number(p.bmi || 24.2),
          bodyFatPct: Number(p.body_fat_pct || 25),
          skeletalMuscleMassKg: Number(p.skeletal_muscle_mass_kg || 28),
          waistCm: Number(p.waist_cm || 85),
          visceralFatLevel: Number(p.visceral_fat_level || 5),
          bmrKcal: Number(p.bmr_kcal || 1600),
          teeKcal: Number(p.tee_kcal || 2200),
          dietType: 'pure_veg_no_egg',
          activityLevel: p.activity_level || 'gym_4_5_days',
          foodPreference: p.food_preference || 'Homemade Indian food',
          goal: (p.goal || 'lean_athletic') as GoalType,
          allergies: p.allergies || [],
          dislikedFoods: p.disliked_foods || [],
          onboardingCompleted: Boolean(p.onboarding_completed),
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };

        const userTargets: DatabaseState['nutritionTargets'] = t
          ? {
              id: t.id,
              userId: session.userId,
              caloriesKcal: Number(t.calories_kcal || 1800),
              proteinG: Number(t.protein_g || 130),
              carbsG: Number(t.carbs_g || 155),
              fatG: Number(t.fat_g || 65),
              waterMl: Number(t.water_ml || 3000),
              goal: (p.goal || 'lean_athletic') as GoalType,
              isManualOverride: false,
              rationale: 'Personalized target based on body composition and training volume.',
              updatedAt: t.updated_at || new Date().toISOString(),
            }
          : baseDb.nutritionTargets;

        const userFoodLogs: DatabaseState['foodLogs'] = (foodLogsRes.data || []).map((l: any) => ({
          id: l.id,
          userId: l.user_id,
          foodId: l.food_id || undefined,
          foodName: l.food_name,
          mealSlot: l.meal_slot as MealSlot,
          quantity: Number(l.quantity),
          unit: (l.unit || 'serving') as FoodUnit,
          weightGrams: Number(l.weight_grams),
          calories: Number(l.calories),
          proteinG: Number(l.protein_g),
          carbsG: Number(l.carbs_g),
          fatG: Number(l.fat_g),
          oilGheeGrams: Number(l.oil_ghee_grams || 0),
          loggingMethod: l.logging_method || 'manual',
          confidence: l.confidence || 'verified',
          notes: l.notes || undefined,
          loggedAt: l.logged_at,
          logDate: l.log_date,
        }));

        const userWaterLogs: DatabaseState['waterLogs'] = (waterLogsRes.data || []).map((w: any) => ({
          id: w.id,
          userId: w.user_id,
          amountMl: Number(w.amount_ml),
          logDate: w.log_date,
          loggedAt: w.logged_at,
        }));

        const userHabitLogs: DatabaseState['habitLogs'] = (habitLogsRes.data || []).map((h: any) => ({
          id: h.id,
          userId: h.user_id,
          logDate: h.log_date,
          sleepHours: Number(h.sleep_hours || 7.5),
          steps: Number(h.daily_steps || h.steps || 7000),
          workoutCompleted: Boolean(h.workout_completed),
          mealsLoggedCompleted: Boolean(h.meals_logged_completed),
          proteinTargetHit: Boolean(h.protein_target_completed),
          consistencyScore: Number(h.consistency_score || 50),
          notes: h.notes || undefined,
        }));

        const userBodyScans: DatabaseState['bodyScans'] = (bodyScansRes.data || []).map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          scanDate: s.scan_date,
          deviceName: s.device_name || 'EVOLT 360',
          weightKg: Number(s.weight_kg),
          bmi: Number(s.bmi),
          bodyFatPct: Number(s.body_fat_pct || 0),
          skeletalMuscleMassKg: Number(s.skeletal_muscle_mass_kg || 0),
          waistCm: Number(s.waist_cm || 0),
          visceralFatLevel: Number(s.visceral_fat_level || 0),
          bmrKcal: Number(s.bmr_kcal || 0),
          teeKcal: Number(s.tee_kcal || 0),
          reportUrl: s.report_url || undefined,
          notes: s.notes || undefined,
          createdAt: s.created_at || new Date().toISOString(),
          heightCm: s.height_cm ? Number(s.height_cm) : undefined,
          reportedBmi: s.reported_bmi ? Number(s.reported_bmi) : undefined,
          calculatedBmi: s.calculated_bmi ? Number(s.calculated_bmi) : undefined,
          fileType: s.file_type || undefined,
          rawExtractedJson: s.raw_extracted_json || undefined,
          validationStatus: s.validation_status || undefined,
        }));

        const userBodyMeasurements: DatabaseState['bodyMeasurements'] = (bodyMeasurementsRes.data || []).map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          measuredDate: m.measured_date,
          weightKg: Number(m.weight_kg),
          waistCm: m.waist_cm ? Number(m.waist_cm) : undefined,
          bodyFatPct: m.body_fat_pct ? Number(m.body_fat_pct) : undefined,
          skeletalMuscleMassKg: m.skeletal_muscle_mass_kg ? Number(m.skeletal_muscle_mass_kg) : undefined,
          visceralFatLevel: m.visceral_fat_level ? Number(m.visceral_fat_level) : undefined,
          notes: m.notes || undefined,
          createdAt: m.created_at || new Date().toISOString(),
        }));

        const scopedDb: DatabaseState = {
          ...baseDb,
          auth: {
            ...baseDb.auth,
            userId: session.userId,
            email: session.email,
          },
          profile: userProfile,
          nutritionTargets: userTargets,
          foodLogs: userFoodLogs,
          waterLogs: userWaterLogs,
          habitLogs: userHabitLogs,
          bodyScans: userBodyScans,
          bodyMeasurements: userBodyMeasurements,
        };

        return { session, db: scopedDb };
      }
    } catch (e) {
      console.error('Supabase user scope fallback:', e);
    }
  }

  // 2. Local database fallback (Single personal profile / offline mode)
  const db = readDatabase();
  return { session, db };
}
