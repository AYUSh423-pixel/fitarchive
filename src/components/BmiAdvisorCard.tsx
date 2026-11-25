'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Flame,
  Info,
  Scale,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { calculateBmi, getBmiDetailedAdvice } from '@/lib/nutrition-engine';
import type { UserProfile } from '@/types/nutrifit';

interface BmiAdvisorCardProps {
  initialWeightKg?: number;
  initialHeightCm?: number;
  gender?: UserProfile['gender'];
  onApplyTargets?: (calories: number, protein: number, carbs: number, fat: number) => void;
}

export function BmiAdvisorCard({
  initialWeightKg = 76.4,
  initialHeightCm = 164,
  gender = 'male',
  onApplyTargets,
}: BmiAdvisorCardProps) {
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg);
  const [heightCm, setHeightCm] = useState<number>(initialHeightCm);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const bmi = useMemo(() => {
    return calculateBmi(weightKg, heightCm);
  }, [weightKg, heightCm]);

  const advice = useMemo(() => {
    return getBmiDetailedAdvice(bmi, heightCm, weightKg, gender);
  }, [bmi, heightCm, weightKg, gender]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { weightKg, heightCm, bmi },
          nutritionTargets: {
            caloriesKcal: advice.recommendedCalories,
            proteinG: advice.recommendedProteinG,
            carbsG: advice.recommendedCarbsG,
            fatG: advice.recommendedFatG,
            isManualOverride: true,
            rationale: `Personalized BMI Recommendation (${advice.category} • BMI ${bmi}):\n• Target Calories: ${advice.recommendedCalories} kcal\n• High Pure-Veg Protein: ${advice.recommendedProteinG}g\n• Carbs: ${advice.recommendedCarbsG}g | Fats: ${advice.recommendedFatG}g`,
          },
        }),
      });

      if (res.ok) {
        setApplied(true);
        if (onApplyTargets) {
          onApplyTargets(
            advice.recommendedCalories,
            advice.recommendedProteinG,
            advice.recommendedCarbsG,
            advice.recommendedFatG
          );
        }
        setTimeout(() => setApplied(false), 3500);
      }
    } finally {
      setApplying(false);
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Normal range':
        return { bg: 'bg-[#DCFCE7]', text: 'text-[#14532D]', border: 'border-[#34D399]/40' };
      case 'Overweight':
        return { bg: 'bg-[#FFEDD5]', text: 'text-[#944A00]', border: 'border-[#FB923C]/40' };
      case 'Obese Class 1':
      case 'Obese Class 2+':
        return { bg: 'bg-[#FFDAD6]', text: 'text-[#93000A]', border: 'border-[#BA1A1A]/40' };
      default:
        return { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]', border: 'border-[#38BDF8]/40' };
    }
  };

  const theme = getCategoryTheme(advice.category);

  return (
    <section className="tactile-card-white p-6 space-y-5 border border-[#E4E0D8]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FB923C] text-white flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#1B1B1E]">
              Dynamic BMI Advisor &amp; Recommendations
            </h2>
            <p className="text-xs text-[#554337]">
              Enter your weight &amp; height to get tailored pure-veg targets &amp; strategies
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
          {advice.category} • BMI {bmi}
        </span>
      </div>

      {/* Sliders / Number Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8]/80">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-[#554337]">
            <span>Your Weight</span>
            <span className="font-display font-bold text-base text-[#1B1B1E]">{weightKg} kg</span>
          </div>
          <input
            type="range"
            min={40}
            max={140}
            step={0.2}
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            className="w-full accent-[#FB923C] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#71717A]">
            <span>40 kg</span>
            <span>Ideal: {advice.idealWeightRange.minKg}–{advice.idealWeightRange.maxKg} kg</span>
            <span>140 kg</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-[#554337]">
            <span>Your Height</span>
            <span className="font-display font-bold text-base text-[#1B1B1E]">{heightCm} cm</span>
          </div>
          <input
            type="range"
            min={130}
            max={210}
            step={1}
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
            className="w-full accent-[#006C4B] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#71717A]">
            <span>130 cm</span>
            <span>Height: {(heightCm / 100).toFixed(2)} m</span>
            <span>210 cm</span>
          </div>
        </div>
      </div>

      {/* Suggested Macro Dashboard for this BMI */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#944A00] flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" /> Recommended Targets for BMI {bmi} ({advice.category})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3.5 rounded-2xl bg-[#FFEDD5]">
            <p className="text-[10px] font-bold uppercase text-[#7C2D12]">Calories</p>
            <p className="font-display text-xl font-bold text-[#944A00]">{advice.recommendedCalories}</p>
            <p className="text-[10px] text-[#7C2D12] opacity-80">kcal / day</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#DCFCE7]">
            <p className="text-[10px] font-bold uppercase text-[#14532D]">Protein</p>
            <p className="font-display text-xl font-bold text-[#006C4B]">{advice.recommendedProteinG}g</p>
            <p className="text-[10px] text-[#14532D] opacity-80">pure veg</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F3E8FF]">
            <p className="text-[10px] font-bold uppercase text-[#581C87]">Carbs</p>
            <p className="font-display text-xl font-bold text-[#674BB5]">{advice.recommendedCarbsG}g</p>
            <p className="text-[10px] text-[#581C87] opacity-80">wholesome</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F0EDF1]">
            <p className="text-[10px] font-bold uppercase text-[#554337]">Healthy Fats</p>
            <p className="font-display text-xl font-bold text-[#1B1B1E]">{advice.recommendedFatG}g</p>
            <p className="text-[10px] text-[#554337] opacity-80">oil &amp; ghee cap</p>
          </div>
        </div>
      </div>

      {/* Nutrition & Gym Recommendations */}
      <div className="grid sm:grid-cols-2 gap-3 text-xs leading-relaxed">
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8]/80 space-y-2">
          <h3 className="font-bold text-sm text-[#1B1B1E] flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-[#FB923C]" /> Pure-Veg Nutrition Strategy
          </h3>
          <ul className="space-y-1.5 text-[#554337]">
            {advice.nutritionStrategy.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#006C4B] font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4E0D8]/80 space-y-2">
          <h3 className="font-bold text-sm text-[#1B1B1E] flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-[#006C4B]" /> Training &amp; Cardio Plan
          </h3>
          <ul className="space-y-1.5 text-[#554337]">
            {advice.gymStrategy.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#FB923C] font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Indian Foods for this BMI */}
      <div className="p-3.5 rounded-2xl bg-[#E8DDFF]/50 border border-[#B69DFF]/40 text-xs space-y-1.5">
        <p className="font-bold text-[#482995] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Best Indian Meals for BMI {bmi}:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {advice.suggestedIndianFoods.map((food, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full bg-white text-[#21005E] font-medium shadow-2xs">
              {food}
            </span>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-[#71717A] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {advice.caution}
        </p>

        <button
          onClick={handleApply}
          disabled={applying}
          className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
            applied
              ? 'bg-[#006C4B] text-white'
              : 'bg-[#FB923C] hover:bg-[#f97316] text-white active:scale-95'
          }`}
        >
          {applied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Targets Applied to Dashboard!</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{applying ? 'Applying...' : 'Apply Recommendations To App'}</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
