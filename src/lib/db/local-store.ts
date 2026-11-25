import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { DatabaseState } from '@/types/nutrifit';
import { hashPassword } from '@/lib/auth';
import { SEED_INDIAN_FOODS, SEED_RECIPES } from '@/lib/indian-foods-seed';
import { SEED_EXERCISES, createDefaultRoutine } from '@/lib/workouts-seed';
import { calculateRecommendedTargets } from '@/lib/nutrition-engine';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nutrifit-db.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

export const DEFAULT_USER_ID = '11111111-1111-4111-8111-111111111111';

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createInitialDatabaseState(): DatabaseState {
  const today = todayIsoDate();
  const nowIso = new Date().toISOString();

  const initialProfile: DatabaseState['profile'] = {
    id: DEFAULT_USER_ID,
    name: 'Ayush',
    email: 'personal@nutrifit.local',
    age: 20,
    gender: 'male',
    heightCm: 164,
    weightKg: 76.4,
    bmi: 28.4,
    bodyFatPct: 29.7,
    skeletalMuscleMassKg: 29.6,
    waistCm: 96.7,
    visceralFatLevel: 11,
    bmrKcal: 1529,
    teeKcal: 2354,
    dietType: 'pure_veg_no_egg',
    activityLevel: 'gym_4_5_days',
    foodPreference: 'Homemade Indian food',
    goal: 'lean_athletic',
    allergies: [],
    dislikedFoods: [],
    onboardingCompleted: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const targetCalc = calculateRecommendedTargets(initialProfile);

  return {
    auth: {
      userId: DEFAULT_USER_ID,
      email: 'personal@nutrifit.local',
      passwordHash: hashPassword('nutrifit123'),
      pinEnabled: false,
    },
    profile: initialProfile,
    bodyScans: [
      {
        id: 'scan-evolt-day1',
        userId: DEFAULT_USER_ID,
        scanDate: today,
        deviceName: 'EVOLT 360',
        weightKg: 76.4,
        bmi: 28.4,
        bodyFatPct: 29.7,
        skeletalMuscleMassKg: 29.6,
        waistCm: 96.7,
        visceralFatLevel: 11,
        bmrKcal: 1529,
        teeKcal: 2354,
        notes: 'Initial baseline EVOLT 360 body scan. Informational BIA estimate — not a medical diagnosis.',
        createdAt: nowIso,
      },
    ],
    bodyMeasurements: [
      {
        id: 'meas-day1',
        userId: DEFAULT_USER_ID,
        measuredDate: today,
        weightKg: 76.4,
        waistCm: 96.7,
        bodyFatPct: 29.7,
        skeletalMuscleMassKg: 29.6,
        visceralFatLevel: 11,
        notes: 'Day 1 Baseline (EVOLT 360)',
        createdAt: nowIso,
      },
    ],
    nutritionTargets: {
      id: 'target-initial',
      userId: DEFAULT_USER_ID,
      caloriesKcal: 1800,
      proteinG: 130,
      carbsG: 155,
      fatG: 65,
      waterMl: 3000,
      goal: 'lean_athletic',
      isManualOverride: false,
      rationale: targetCalc.rationale,
      updatedAt: nowIso,
    },
    foods: SEED_INDIAN_FOODS,
    recipes: SEED_RECIPES,
    foodLogs: [],
    favoriteMeals: [
      {
        id: 'fav-moong-chilla-combo',
        userId: DEFAULT_USER_ID,
        name: '2 Moong Dal Chilla + Greek Yogurt',
        mealSlot: 'breakfast',
        items: [
          {
            foodId: 'food-moong-chilla',
            foodName: 'Moong Dal Chilla (Paneer-stuffed, 1 pc)',
            quantity: 2,
            unit: 'piece',
            weightGrams: 180,
            calories: 380,
            proteinG: 23,
            carbsG: 38,
            fatG: 14,
            oilGheeGrams: 7,
          },
          {
            foodId: 'food-greek-yogurt',
            foodName: 'Unsweetened Greek Yogurt / Hung Curd',
            quantity: 1,
            unit: 'serving',
            weightGrams: 150,
            calories: 110,
            proteinG: 14,
            carbsG: 5.5,
            fatG: 3.5,
            oilGheeGrams: 0,
          },
        ],
        totalCalories: 490,
        totalProteinG: 37,
        createdAt: nowIso,
      },
    ],
    mealPlans: [],
    groceryLists: [
      {
        id: 'grocery-weekly-default',
        userId: DEFAULT_USER_ID,
        period: 'weekly',
        items: [
          { id: 'g-1', name: 'Low-Fat Paneer (Amul / Fresh)', category: 'Protein', quantity: '1 kg (200g x 5)', estimatedCostInr: 420, purchased: false, isBudgetProteinTip: false },
          { id: 'g-2', name: 'Soya Chunks (Nutrela)', category: 'Budget Protein', quantity: '500 g', estimatedCostInr: 95, purchased: false, isBudgetProteinTip: true },
          { id: 'g-3', name: 'Yellow Moong Dal & Toor Dal', category: 'Dal & Legumes', quantity: '1 kg', estimatedCostInr: 150, purchased: false, isBudgetProteinTip: true },
          { id: 'g-4', name: 'Hung Curd / Toned Milk for Dahi', category: 'Dairy', quantity: '3.5 Liters', estimatedCostInr: 210, purchased: false, isBudgetProteinTip: true },
          { id: 'g-5', name: 'Whole Wheat Chakki Atta', category: 'Grains', quantity: '2 kg', estimatedCostInr: 110, purchased: false },
          { id: 'g-6', name: 'Cucumber, Tomato, Onion, Spinach & Methi', category: 'Vegetables', quantity: '2.5 kg assorted', estimatedCostInr: 180, purchased: false },
          { id: 'g-7', name: 'Bananas & Apples', category: 'Fruits', quantity: '12 pcs', estimatedCostInr: 160, purchased: false },
          { id: 'g-8', name: 'Roasted Makhana & Raw Almonds', category: 'Snacks & Fats', quantity: '250 g', estimatedCostInr: 220, purchased: false },
        ],
        updatedAt: nowIso,
      },
    ],
    exercises: SEED_EXERCISES,
    workoutRoutine: createDefaultRoutine(DEFAULT_USER_ID),
    workoutLogs: [],
    waterLogs: [],
    habitLogs: [],
    progressPhotos: [],
    aiConversations: [
      {
        id: 'ai-welcome',
        userId: DEFAULT_USER_ID,
        role: 'assistant',
        content:
          "Namaste! I'm your personal AI Dietitian. I already have your EVOLT 360 baseline (76.4 kg, 29.7% body fat, 29.6 kg muscle) and your Pure Vegetarian (no eggs) homemade Indian food preference. Your starting targets are ~1,800 kcal and 130g protein/day to lean out while keeping your gym strength. Log your first meal or ask me anything!",
        mode: 'local_engine',
        createdAt: nowIso,
      },
    ],
    preferences: {
      userId: DEFAULT_USER_ID,
      units: 'metric',
      currency: 'INR',
      remindersEnabled: true,
      localCachingEnabled: true,
      updatedAt: nowIso,
    },
  };
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function readDatabase(): DatabaseState {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDatabaseState();
    writeDatabase(initial);
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(raw) as DatabaseState;
}

export function writeDatabase(state: DatabaseState): void {
  ensureDirectories();
  const tmpFile = `${DB_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function updateDatabase(mutator: (draft: DatabaseState) => void): DatabaseState {
  const current = readDatabase();
  mutator(current);
  writeDatabase(current);
  return current;
}

export function resetDatabase(): DatabaseState {
  const fresh = createInitialDatabaseState();
  writeDatabase(fresh);
  return fresh;
}
