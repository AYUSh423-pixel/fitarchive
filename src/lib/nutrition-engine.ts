import type { ActivityLevel, BodyMeasurement, GoalType, NutritionTarget, UserProfile } from '@/types/nutrifit';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.48,
  gym_4_5_days: 1.54, // Matches 1529 * 1.54 ≈ 2354 kcal from EVOLT 360
  athlete: 1.725,
};

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal range';
  if (bmi < 30) return 'Overweight (Note: BMI does not separate muscle from fat)';
  return 'Obese range (Note: BMI does not separate muscle from fat)';
}

export interface BmiDetailedAdvice {
  bmi: number;
  category: 'Underweight' | 'Normal range' | 'Overweight' | 'Obese Class 1' | 'Obese Class 2+';
  idealWeightRange: { minKg: number; maxKg: number };
  recommendedCalories: number;
  recommendedProteinG: number;
  recommendedCarbsG: number;
  recommendedFatG: number;
  headline: string;
  nutritionStrategy: string[];
  gymStrategy: string[];
  suggestedIndianFoods: string[];
  caution: string;
}

export function getBmiDetailedAdvice(
  bmi: number,
  heightCm: number,
  weightKg: number,
  gender: UserProfile['gender'] = 'male',
  activity: ActivityLevel = 'gym_4_5_days'
): BmiDetailedAdvice {
  const heightM = heightCm / 100;
  const idealMinKg = Number((18.5 * heightM * heightM).toFixed(1));
  const idealMaxKg = Number((24.9 * heightM * heightM).toFixed(1));

  const bmr = calculateBmr(weightKg, heightCm, 20, gender);
  const tee = calculateTee(bmr, activity);

  if (bmi < 18.5) {
    const targetCalories = Math.round((tee + 350) / 10) * 10;
    const proteinG = Math.round(weightKg * 1.8);
    const fatG = Math.round((targetCalories * 0.3) / 9);
    const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);

    return {
      bmi,
      category: 'Underweight',
      idealWeightRange: { minKg: idealMinKg, maxKg: idealMaxKg },
      recommendedCalories: targetCalories,
      recommendedProteinG: proteinG,
      recommendedCarbsG: carbsG,
      recommendedFatG: fatG,
      headline: 'Lean Mass & Healthy Calorie Surplus Strategy',
      nutritionStrategy: [
        'Eat in a gentle calorie surplus (+300–400 kcal/day above burn) to build muscle and strengthen immunity.',
        'Choose nutrient-dense pure-veg foods: soaked almonds, walnuts, peanut butter toast, and full-cream milk/curd.',
        'Drink homemade smoothies: milk + banana + rolled oats + peanut butter for easy, non-bloating calories.',
        'Ensure 1.6–1.8g protein per kg with paneer, dal, besan chilla, and whey/soya.',
      ],
      gymStrategy: [
        'Focus on heavy compound lifts (squats, bench press, rows, overhead press) 3–4 days/week.',
        'Keep rest periods between 2–3 minutes to maximize strength gains.',
        'Limit excessive high-intensity cardio; do 15–20 mins light walking for cardiovascular health.',
      ],
      suggestedIndianFoods: [
        'Paneer Bhurji with 2–3 Phulkas (with 1 tsp ghee)',
        'Banana Peanut Butter Shake with Toned Milk',
        'Khaman Dhokla + Roasted Peanuts & Makhana',
        'Moong Dal Khichdi topped with 1 tsp Cow Ghee & Curd',
      ],
      caution:
        'Avoid dirty bulking (deep-fried samosas or sweets) — focus on clean wholesome homemade surplus.',
    };
  }

  if (bmi >= 18.5 && bmi < 25) {
    const targetCalories = Math.round(tee / 10) * 10;
    const proteinG = Math.round(weightKg * 1.6);
    const fatG = Math.round((targetCalories * 0.28) / 9);
    const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);

    return {
      bmi,
      category: 'Normal range',
      idealWeightRange: { minKg: idealMinKg, maxKg: idealMaxKg },
      recommendedCalories: targetCalories,
      recommendedProteinG: proteinG,
      recommendedCarbsG: carbsG,
      recommendedFatG: fatG,
      headline: 'Body Recomposition & Lean Athletic Sculpting',
      nutritionStrategy: [
        'Eat at maintenance calories or a subtle 150 kcal deficit to lose residual fat while building muscle.',
        'Anchor each meal with 25–30g pure-veg protein (paneer, soya chunks, Greek yogurt, dal).',
        'Maintain fiber intake with kachumber salad and green vegetables before grains.',
        'Keep daily water intake at 2.8–3.2 Liters.',
      ],
      gymStrategy: [
        'Follow a 4–5 day Upper/Lower or Push/Pull/Legs progressive overload routine.',
        'Add 20 minutes incline treadmill walking (8–10% incline at 5 km/h) 3x weekly.',
        'Track personal records (PRs) each week to ensure progressive overload.',
      ],
      suggestedIndianFoods: [
        'Grilled Paneer Tikka Salad with Mint Chutney',
        '2 Paneer-Stuffed Moong Dal Chillas + Greek Yogurt',
        'Soya Chunk Biryani with Cucumber Raita',
        'Gujarati Dal + 2 Methi Thepla + Paneer Bhurji',
      ],
      caution:
        'Normal BMI can still hide "skinny-fat" composition; focus on strength metrics rather than scale weight.',
    };
  }

  if (bmi >= 25 && bmi < 30) {
    // Overweight range (like the baseline 28.4)
    const targetCalories = Math.max(1500, Math.round((tee - 500) / 10) * 10);
    const proteinG = Math.round(weightKg * 1.7);
    const fatG = Math.round((targetCalories * 0.3) / 9);
    const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);

    return {
      bmi,
      category: 'Overweight',
      idealWeightRange: { minKg: idealMinKg, maxKg: idealMaxKg },
      recommendedCalories: targetCalories,
      recommendedProteinG: proteinG,
      recommendedCarbsG: carbsG,
      recommendedFatG: fatG,
      headline: 'Sustainable Fat Loss & Muscle Preservation (Lean Athletic Blueprint)',
      nutritionStrategy: [
        'Maintain a steady ~500 kcal deficit (target ~1,800 kcal) — never drop below 1,500 kcal or starve.',
        'High protein priority (~130g/day): Prevents muscle loss so you lose waist circumference, not strength.',
        'Measure cooking oil & ghee with a teaspoon (1 tsp = 5g = 45 kcal); avoid freehand pouring in sabzi.',
        'Volume eating trick: Eat 1 bowl cucumber-tomato kachumber or boiled sprouts before roti & dal.',
      ],
      gymStrategy: [
        'Lift weights 4–5 days/week to signal your body to hold onto muscle while burning fat.',
        'Joint-friendly cardio: Incline treadmill walk (8–12% incline, 5 km/h) for 20–25 mins after lifting.',
        'Aim for 8,000–10,000 daily steps for non-exercise thermogenesis (NEAT).',
      ],
      suggestedIndianFoods: [
        '50g Soya Chunk Masala Curry (27g protein, only ~245 kcal)',
        '150g Grilled Low-Fat Paneer Tikka with salad',
        '2 Phulka Rotis (no ghee) + 1 bowl Moong Dal Tadka + Kachumber',
        'Roasted Peri-Peri Makhana + Sprouted Moong Salad for snacks',
      ],
      caution:
        'Do not drop calories after single-day weight spikes; weigh in weekly and check 7-day rolling averages.',
    };
  }

  // Obese Class 1 or 2+ (bmi >= 30)
  const targetCalories = Math.max(1600, Math.round((tee - 600) / 10) * 10);
  const proteinG = Math.round(weightKg * 1.5);
  const fatG = Math.round((targetCalories * 0.28) / 9);
  const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);

  return {
    bmi,
    category: bmi < 35 ? 'Obese Class 1' : 'Obese Class 2+',
    idealWeightRange: { minKg: idealMinKg, maxKg: idealMaxKg },
    recommendedCalories: targetCalories,
    recommendedProteinG: proteinG,
    recommendedCarbsG: carbsG,
    recommendedFatG: fatG,
    headline: 'High-Impact Fat Reduction with Joint & Metabolic Protection',
    nutritionStrategy: [
      'Focus on a comfortable, non-restrictive 500–600 kcal deficit that you can sustain for 6–12 months.',
      'Cap hidden fats: Cook sabzi with water/steam first, using 1 tsp oil max per portion.',
      'Swap high-calorie snacks (samosas, bhujia, biscuits) for air-popped makhana, roasted chana, and chaas.',
      'Drink 3.0–3.5 Liters of water daily to support kidney function and reduce false hunger cues.',
    ],
    gymStrategy: [
      'Protect knees & lower back: Avoid high-impact running, box jumps, or burpees initially.',
      'Do machine & dumbbell strength training (leg press, chest supported rows, lat pulldowns, seated dumbbell press).',
      'Cardio: Low-impact stationary cycling or flat/gentle incline walking 25–30 mins daily.',
    ],
    suggestedIndianFoods: [
      'Boiled Kala Chana Chaat with lemon, cucumber & tomato',
      'Besan Chilla with grated veggies & 1 glass Masala Chaas',
      'Yellow Moong Dal + Steamed Lauki/Turai Sabzi + 2 Phulkas',
      'Low-Fat Paneer / Tofu Bhurji + Big Bowl Green Salad',
    ],
    caution:
      'BMI is a statistical indicator, not a clinical diagnosis. Consult your healthcare provider for clinical medical advice.',
  };
}

export function calculateBmr(weightKg: number, heightCm: number, age: number, gender: UserProfile['gender']): number {
  // Mifflin-St Jeor equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base + 5);
}

export function calculateTee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.54));
}

export function calculateRecommendedTargets(profile: UserProfile): {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  rationale: string;
} {
  const bmr = profile.bmrKcal > 0 ? profile.bmrKcal : calculateBmr(profile.weightKg, profile.heightCm, profile.age, profile.gender);
  const tee = profile.teeKcal > 0 ? profile.teeKcal : calculateTee(bmr, profile.activityLevel);

  // Safe, sustainable deficit/surplus — never starvation or extreme deficits
  let targetCalories = tee;
  let proteinPerKg = 1.7;

  if (profile.goal === 'lean_athletic') {
    // ~550 kcal moderate deficit from 2,354 -> ~1,800 kcal
    targetCalories = Math.max(bmr + 150, Math.round((tee - 550) / 10) * 10);
    proteinPerKg = 1.7; // 76.4 * 1.7 ≈ 130g
  } else if (profile.goal === 'fat_loss') {
    targetCalories = Math.max(bmr + 100, Math.round((tee - 500) / 10) * 10);
    proteinPerKg = 1.75;
  } else if (profile.goal === 'maintenance') {
    targetCalories = Math.round(tee / 10) * 10;
    proteinPerKg = 1.5;
  } else if (profile.goal === 'muscle_gain') {
    targetCalories = Math.round((tee + 250) / 10) * 10;
    proteinPerKg = 1.8;
  }

  // Enforce safe floor (never below 1,500 kcal for adult male or BMR)
  const safeFloor = profile.gender === 'female' ? 1300 : 1500;
  targetCalories = Math.max(safeFloor, targetCalories);

  const proteinG = Math.round(profile.weightKg * proteinPerKg);
  const fatCalories = Math.round(targetCalories * 0.32); // ~65g on 1800 kcal
  const fatG = Math.max(45, Math.round(fatCalories / 9));
  const remainingForCarbs = Math.max(200, targetCalories - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(remainingForCarbs / 4);
  const waterMl = Math.round((profile.weightKg * 38) / 100) * 100; // ~2900-3000 ml

  const goalLabel: Record<GoalType, string> = {
    lean_athletic: 'Lean Athletic Physique (Fat Loss + Muscle Preservation)',
    fat_loss: 'Steady Fat Loss',
    maintenance: 'Weight & Composition Maintenance',
    muscle_gain: 'Lean Muscle Gain',
  };

  const rationale = [
    `Starting estimate for ${goalLabel[profile.goal]}:`,
    `• Your estimated daily burn (TEE) is ~${tee.toLocaleString()} kcal based on your BMR (~${bmr.toLocaleString()} kcal) and 4–5x weekly gym routine.`,
    `• ${targetCalories.toLocaleString()} kcal/day creates a gentle, sustainable gap—never a crash diet—so you lose fat without losing strength or feeling starved.`,
    `• ${proteinG}g protein/day (~${proteinPerKg}g per kg) protects your 29.6 kg of muscle mass while trimming waist fat.`,
    `• ${carbsG}g carbs fuel your workouts and daily homemade Indian meals; ${fatG}g healthy fats support hormones and satiety.`,
  ].join('\n');

  return {
    caloriesKcal: targetCalories,
    proteinG,
    carbsG,
    fatG,
    waterMl,
    rationale,
  };
}

/**
 * Evaluates weekly progress using 7-day rolling averages rather than single-day
 * scale spikes. Never drops calories after one fluctuation.
 */
export function evaluateWeeklyProgress(
  measurements: BodyMeasurement[],
  currentTarget: NutritionTarget
): {
  status: 'insufficient_data' | 'on_track' | 'plateau' | 'too_fast';
  thisWeekAvgKg: number | null;
  lastWeekAvgKg: number | null;
  weeklyDeltaKg: number | null;
  recommendation: string;
  suggestedCalories: number;
} {
  if (measurements.length < 4) {
    return {
      status: 'insufficient_data',
      thisWeekAvgKg: measurements[0]?.weightKg ?? null,
      lastWeekAvgKg: null,
      weeklyDeltaKg: null,
      recommendation:
        'Log at least 4 weight entries across 2 weeks before adjusting calories. Single-day scale changes are usually water, salt, or digestion—not fat gain.',
      suggestedCalories: currentTarget.caloriesKcal,
    };
  }

  const sorted = [...measurements].sort((a, b) => b.measuredDate.localeCompare(a.measuredDate));
  const recent = sorted.slice(0, Math.min(7, Math.floor(sorted.length / 2)));
  const prior = sorted.slice(recent.length, recent.length * 2);

  if (prior.length === 0) {
    return {
      status: 'insufficient_data',
      thisWeekAvgKg: Number((recent.reduce((s, m) => s + m.weightKg, 0) / recent.length).toFixed(2)),
      lastWeekAvgKg: null,
      weeklyDeltaKg: null,
      recommendation: 'Keep logging your morning weight consistently for another week to compare 7-day averages.',
      suggestedCalories: currentTarget.caloriesKcal,
    };
  }

  const thisAvg = Number((recent.reduce((s, m) => s + m.weightKg, 0) / recent.length).toFixed(2));
  const lastAvg = Number((prior.reduce((s, m) => s + m.weightKg, 0) / prior.length).toFixed(2));
  const delta = Number((thisAvg - lastAvg).toFixed(2));

  if (delta <= -0.25 && delta >= -0.75) {
    return {
      status: 'on_track',
      thisWeekAvgKg: thisAvg,
      lastWeekAvgKg: lastAvg,
      weeklyDeltaKg: delta,
      recommendation: `Great pace! Your 7-day average dropped by ${Math.abs(delta)} kg. Keep your current ${currentTarget.caloriesKcal} kcal and ${currentTarget.proteinG}g protein targets.`,
      suggestedCalories: currentTarget.caloriesKcal,
    };
  }

  if (delta < -0.9) {
    const bumped = Math.min(2400, currentTarget.caloriesKcal + 100);
    return {
      status: 'too_fast',
      thisWeekAvgKg: thisAvg,
      lastWeekAvgKg: lastAvg,
      weeklyDeltaKg: delta,
      recommendation: `You lost ${Math.abs(delta)} kg in one week, which may be faster than ideal for preserving muscle. Consider nudging up by +100 kcal to ${bumped} kcal.`,
      suggestedCalories: bumped,
    };
  }

  // Plateau only if average weight didn't move across full comparison
  const nudged = Math.max(1550, currentTarget.caloriesKcal - 80);
  return {
    status: 'plateau',
    thisWeekAvgKg: thisAvg,
    lastWeekAvgKg: lastAvg,
    weeklyDeltaKg: delta,
    recommendation: `Your 7-day average is steady (${delta >= 0 ? '+' : ''}${delta} kg). Before cutting food, check steps (aim for 7,500–9,000/day) and cooking oil/ghee portions, or gently adjust to ${nudged} kcal.`,
    suggestedCalories: nudged,
  };
}
