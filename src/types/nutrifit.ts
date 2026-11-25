export type GoalType = 'lean_athletic' | 'fat_loss' | 'maintenance' | 'muscle_gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'gym_4_5_days' | 'athlete';
export type MealSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner';
export type FoodUnit =
  | 'g'
  | 'ml'
  | 'bowl'
  | 'cup'
  | 'slice'
  | 'piece'
  | 'tbsp'
  | 'tsp'
  | 'serving';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  skeletalMuscleMassKg: number;
  waistCm: number;
  visceralFatLevel: number;
  bmrKcal: number;
  teeKcal: number;
  dietType: 'pure_veg_no_egg';
  activityLevel: ActivityLevel;
  foodPreference: string;
  goal: GoalType;
  allergies: string[];
  dislikedFoods: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BodyScan {
  id: string;
  userId: string;
  scanDate: string;
  deviceName: string;
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  skeletalMuscleMassKg: number;
  waistCm: number;
  visceralFatLevel: number;
  bmrKcal: number;
  teeKcal: number;
  reportUrl?: string;
  notes?: string;
  createdAt: string;
  heightCm?: number;
  reportedBmi?: number;
  calculatedBmi?: number;
  fileType?: string;
  rawExtractedJson?: any;
  validationStatus?: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  measuredDate: string;
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  bodyFatPct?: number;
  skeletalMuscleMassKg?: number;
  visceralFatLevel?: number;
  notes?: string;
  createdAt: string;
}

export interface NutritionTarget {
  id: string;
  userId: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  goal: GoalType;
  isManualOverride: boolean;
  rationale: string;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  userId?: string | null;
  name: string;
  regionalName?: string;
  category:
    | 'Roti & Breads'
    | 'Rice & Grains'
    | 'Dal & Legumes'
    | 'Paneer, Soya & Dairy'
    | 'Gujarati & Regional'
    | 'South Indian'
    | 'Snacks & Street'
    | 'Fruits & Veggies'
    | 'Nuts, Seeds & Fats'
    | 'Protein & Drinks';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingSize: number;
  servingUnit: FoodUnit;
  weightGrams: number;
  state: 'raw' | 'cooked' | 'packaged';
  source: string;
  confidence: 'verified' | 'estimate';
  isVegetarian: true;
  hasEgg: false;
  oilOrGheeIncludedG: number;
  tags: string[];
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  grams: number;
  inPantry?: boolean;
}

export interface Recipe {
  id: string;
  userId?: string | null;
  name: string;
  description: string;
  category: string;
  prepTimeMin: number;
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  oilGheeNotes: string;
  difficulty: 'Easy' | 'Medium';
  tags: string[];
  isVegetarian: true;
  hasEgg: false;
}

export interface FoodLog {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  mealSlot: MealSlot;
  foodId?: string | null;
  foodName: string;
  quantity: number;
  unit: FoodUnit;
  weightGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggingMethod: 'manual' | 'ai_photo' | 'voice' | 'meal_plan' | 'quick_copy';
  confidence: 'verified' | 'ai_confirmed_estimate';
  oilGheeGrams: number;
  notes?: string;
  loggedAt: string;
}

export interface FavoriteMeal {
  id: string;
  userId: string;
  name: string;
  mealSlot: MealSlot;
  items: Array<{
    foodId?: string;
    foodName: string;
    quantity: number;
    unit: FoodUnit;
    weightGrams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    oilGheeGrams: number;
  }>;
  totalCalories: number;
  totalProteinG: number;
  createdAt: string;
}

export interface MealPlanDay {
  dayNumber: number;
  label: string;
  meals: Record<
    MealSlot,
    {
      title: string;
      recipeId?: string;
      items: Array<{ name: string; quantity: string; calories: number; proteinG: number; carbsG: number; fatG: number }>;
      totalCalories: number;
      totalProteinG: number;
      prepNotes: string;
    }
  >;
}

export interface MealPlan {
  id: string;
  userId: string;
  planType: 'daily' | '7_day' | '30_day';
  startDate: string;
  days: MealPlanDay[];
  targetCalories: number;
  targetProteinG: number;
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  estimatedCostInr: number;
  purchased: boolean;
  isBudgetProteinTip?: boolean;
}

export interface GroceryList {
  id: string;
  userId: string;
  period: 'weekly' | 'monthly';
  items: GroceryItem[];
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Cardio';
  equipment: string;
  instructions: string;
  isCompound: boolean;
}

export interface WorkoutRoutineDay {
  id: string;
  userId: string;
  dayOfWeek: number; // 1 = Mon ... 7 = Sun
  title: string;
  focus: string;
  isRestDay: boolean;
  plannedExercises: Array<{
    exerciseName: string;
    sets: number;
    reps: string;
    restSec: number;
  }>;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutDate: string;
  title: string;
  durationMin: number;
  isRestDay: boolean;
  exercises: Array<{
    exerciseName: string;
    sets: number;
    reps: number;
    weightKg: number;
    restSec: number;
  }>;
  cardioType?: string;
  cardioMinutes?: number;
  recoveryNotes?: string;
  createdAt: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  logDate: string;
  amountMl: number;
  loggedAt: string;
}

export interface HabitLog {
  id: string;
  userId: string;
  logDate: string;
  sleepHours: number;
  steps: number;
  workoutCompleted: boolean;
  mealsLoggedCompleted: boolean;
  proteinTargetHit: boolean;
  consistencyScore: number;
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  photoDate: string;
  pose: 'front' | 'side' | 'back' | 'other';
  url: string;
  milestoneDay?: number;
  notes?: string;
  createdAt: string;
}

export interface AiMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'gemini' | 'openai' | 'groq' | 'openrouter' | 'custom' | 'local_engine';
  createdAt: string;
}

export type AiProvider = 'gemini' | 'openai' | 'groq' | 'openrouter' | 'custom';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  configured: boolean;
}

export interface UserPreferences {
  userId: string;
  units: 'metric' | 'imperial';
  currency: 'INR';
  remindersEnabled: boolean;
  localCachingEnabled: boolean;
  updatedAt: string;
}

export interface DatabaseState {
  auth: {
    userId: string;
    email: string;
    passwordHash: string;
    pinEnabled: boolean;
  };
  profile: UserProfile;
  bodyScans: BodyScan[];
  bodyMeasurements: BodyMeasurement[];
  nutritionTargets: NutritionTarget;
  foods: FoodItem[];
  recipes: Recipe[];
  foodLogs: FoodLog[];
  favoriteMeals: FavoriteMeal[];
  mealPlans: MealPlan[];
  groceryLists: GroceryList[];
  exercises: Exercise[];
  workoutRoutine: WorkoutRoutineDay[];
  workoutLogs: WorkoutLog[];
  waterLogs: WaterLog[];
  habitLogs: HabitLog[];
  progressPhotos: ProgressPhoto[];
  aiConversations: AiMessage[];
  aiConfig?: AiConfig;
  preferences: UserPreferences;
}
