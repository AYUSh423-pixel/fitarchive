/**
 * Input Validation Schemas using Zod
 * Centralized validation for all API endpoints
 */

import { z } from 'zod';

// Re-export z for convenience
export { z };

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);
export const nameSchema = z.string().min(1).max(100).trim();
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Date range
export const dateRangeSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
}).refine(data => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
  message: 'startDate must be before endDate',
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  action: z.literal('login'),
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  action: z.literal('signup'),
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
});

export const changePasswordSchema = z.object({
  action: z.literal('change_password'),
  newPassword: passwordSchema,
});

export const logoutSchema = z.object({
  action: z.literal('logout'),
});

export const quickPersonalSchema = z.object({
  action: z.literal('quick_personal'),
});

export const authActionSchema = z.discriminatedUnion('action', [
  loginSchema,
  signupSchema,
  changePasswordSchema,
  logoutSchema,
  quickPersonalSchema,
]);

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  age: z.number().int().min(10).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  dietType: z.enum(['pure_veg_no_egg', 'vegetarian', 'eggetarian', 'non_vegetarian']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'gym_4_5_days', 'athlete']).optional(),
  foodPreference: z.string().max(200).optional(),
  goal: z.enum(['lean_athletic', 'muscle_gain', 'fat_loss', 'maintenance']).optional(),
  allergies: z.array(z.string().max(50)).max(20).optional(),
  dislikedFoods: z.array(z.string().max(50)).max(50).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const nutritionTargetsSchema = z.object({
  caloriesKcal: z.number().int().min(800).max(5000),
  proteinG: z.number().int().min(20).max(500),
  carbsG: z.number().int().min(20).max(800),
  fatG: z.number().int().min(10).max(300),
  waterMl: z.number().int().min(500).max(10000),
});

export const statePatchSchema = z.object({
  profile: profileUpdateSchema.optional(),
  nutritionTargets: nutritionTargetsSchema.optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  recalculateMetabolism: z.boolean().optional(),
  recalculateTargets: z.boolean().optional(),
});

// ============================================================================
// FOOD LOGGING SCHEMAS
// ============================================================================

export const foodLogSchema = z.object({
  foodId: uuidSchema.optional(),
  foodName: z.string().min(1).max(200),
  mealSlot: z.enum(['breakfast', 'lunch', 'snacks', 'dinner']),
  quantity: z.number().positive().max(100),
  unit: z.enum(['serving', 'grams', 'ml', 'piece', 'cup', 'tbsp', 'tsp', 'bowl']),
  weightGrams: z.number().positive().max(5000),
  calories: z.number().nonnegative().max(10000),
  proteinG: z.number().nonnegative().max(1000),
  carbsG: z.number().nonnegative().max(1000),
  fatG: z.number().nonnegative().max(1000),
  oilGheeGrams: z.number().nonnegative().max(500).optional(),
  loggingMethod: z.enum(['manual', 'ai_photo', 'voice', 'meal_plan', 'quick_copy']).optional(),
  confidence: z.enum(['verified', 'ai_confirmed_estimate']).optional(),
  notes: z.string().max(500).optional(),
});

export const waterLogSchema = z.object({
  amountMl: z.number().int().positive().max(5000),
  logDate: z.string().date().optional(),
});

export const habitLogSchema = z.object({
  logDate: z.string().date().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  steps: z.number().int().min(0).max(100000).optional(),
  workoutCompleted: z.boolean().optional(),
  mealsLoggedCompleted: z.boolean().optional(),
  proteinTargetHit: z.boolean().optional(),
  consistencyScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// AI SCHEMAS
// ============================================================================

export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const aiScanSchema = z.object({
  imageBase64: z.string().min(100), // Base64 encoded image
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
});

export const aiVoiceParseSchema = z.object({
  audioBase64: z.string().min(100),
  mimeType: z.enum(['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']),
});

// ============================================================================
// WORKOUT SCHEMAS
// ============================================================================

export const workoutLogSchema = z.object({
  workoutDate: z.string().date().optional(),
  title: z.string().min(1).max(200),
  durationMin: z.number().int().positive().max(480),
  exercises: z.array(z.object({
    exerciseId: uuidSchema.optional(),
    name: z.string().min(1).max(200),
    muscleGroup: z.string().max(100),
    sets: z.array(z.object({
      reps: z.number().int().positive().max(100),
      weightKg: z.number().nonnegative().max(1000),
      rpe: z.number().min(1).max(10).optional(),
    })).max(50),
  })).max(30),
  cardioType: z.string().max(100).optional(),
  cardioMinutes: z.number().int().min(0).max(480).optional(),
  recoveryNotes: z.string().max(1000).optional(),
  isRestDay: z.boolean().optional(),
});

// ============================================================================
// BODY MEASUREMENT SCHEMAS
// ============================================================================

export const bodyMeasurementSchema = z.object({
  measuredDate: z.string().date().optional(),
  weightKg: z.number().positive().max(500),
  waistCm: z.number().positive().max(300).optional(),
  chestCm: z.number().positive().max(300).optional(),
  armCm: z.number().positive().max(200).optional(),
  thighCm: z.number().positive().max(200).optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  skeletalMuscleMassKg: z.number().positive().max(200).optional(),
  visceralFatLevel: z.number().int().min(0).max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const bodyScanSchema = z.object({
  scanDate: z.string().date().optional(),
  deviceName: z.string().max(100).optional(),
  weightKg: z.number().positive().max(500),
  bmi: z.number().positive().max(100).optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  skeletalMuscleMassKg: z.number().positive().max(200).optional(),
  waistCm: z.number().positive().max(300).optional(),
  visceralFatLevel: z.number().int().min(0).max(50).optional(),
  bmrKcal: z.number().int().positive().max(5000).optional(),
  teeKcal: z.number().int().positive().max(10000).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Format first error nicely
  const firstError = result.error.issues[0];
  const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
  return { success: false, error: `${path}${firstError.message}` };
}

// Middleware helper for API routes
export async function validateRequest<T>(req: Request, schema: z.ZodSchema<T>): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { success: false, response: new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) };
  }

  const result = validate(schema, body);
  if (!result.success) {
    return { success: false, response: new Response(JSON.stringify({ error: result.error }), { status: 400, headers: { 'Content-Type': 'application/json' } }) };
  }
  return { success: true, data: result.data };
}