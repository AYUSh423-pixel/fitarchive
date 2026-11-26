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
        return { bg: 'bg-[#f5f2e0]', text: 'text-[#713600]', border: 'border-[#c05800]/40' };
      case 'Overweight':
        return { bg: 'bg-[#fff3e0]', text: 'text-[#c05800]', border: 'border-[#c05800]/40' };
      case 'Obese Class 1':
      case 'Obese Class 2+':
        return { bg: 'bg-[#fdf2f0]', text: 'text-[#a04800]', border: 'border-[#c05800]/40' };
      default:
        return { bg: 'bg-[#f5f2e0]', text: 'text-[#713600]', border: 'border-[#c05800]/40' };
    }
  };

  const theme = getCategoryTheme(advice.category);

  return (
    <section className="tactile-card-white p-6 space-y-5 border border-[#e8e4d0]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#c05800] text-white flex items-center justify-center shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#38240d]">
              Dynamic BMI Advisor & Recommendations
            </h2>
            <p className="text-xs text-[#a08a6a]">
              Enter your weight & height to get tailored pure-veg targets & strategies
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
          {advice.category} • BMI {bmi}
        </span>
      </div>

      {/* Sliders / Number Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#f5f2e0] border border-[#e8e4d0]/80">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-[#713600]">
            <span>Your Weight</span>
            <span className="font-display font-bold text-base text-[#38240d]">{weightKg} kg</span>
          </div>
          <input
            type="range"
            min={40}
            max={140}
            step={0.2}
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            className="w-full accent-[#c05800] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#a08a6a]">
            <span>40 kg</span>
            <span>Ideal: {advice.idealWeightRange.minKg}–{advice.idealWeightRange.maxKg} kg</span>
            <span>140 kg</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-[#713600]">
            <span>Your Height</span>
            <span className="font-display font-bold text-base text-[#38240d]">{heightCm} cm</span>
          </div>
          <input
            type="range"
            min={130}
            max={210}
            step={1}
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
            className="w-full accent-[#713600] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#a08a6a]">
            <span>130 cm</span>
            <span>Height: {(heightCm / 100).toFixed(2)} m</span>
            <span>210 cm</span>
          </div>
        </div>
      </div>

      {/* Suggested Macro Dashboard for this BMI */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#c05800] flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" /> Recommended Targets for BMI {bmi} ({advice.category})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3.5 rounded-2xl bg-[#fff3e0]">
            <p className="text-[10px] font-bold uppercase text-[#c05800]">Calories</p>
            <p className="font-display text-xl font-bold text-[#38240d]">{advice.recommendedCalories}</p>
            <p className="text-[10px] text-[#c05800] opacity-80">kcal / day</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#f5f2e0]">
            <p className="text-[10px] font-bold uppercase text-[#713600]">Protein</p>
            <p className="font-display text-xl font-bold text-[#713600]">{advice.recommendedProteinG}g</p>
            <p className="text-[10px] text-[#713600] opacity-80">pure veg</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#fff8e8]">
            <p className="text-[10px] font-bold uppercase text-[#a04800]">Carbs</p>
            <p className="font-display text-xl font-bold text-[#c05800]">{advice.recommendedCarbsG}g</p>
            <p className="text-[10px] text-[#a04800] opacity-80">wholesome</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#f0ece0]">
            <p className="text-[10px] font-bold uppercase text-[#713600]">Healthy Fats</p>
            <p className="font-display text-xl font-bold text-[#38240d]">{advice.recommendedFatG}g</p>
            <p className="text-[10px] text-[#713600] opacity-80">oil & ghee cap</p>
          </div>
        </div>
      </div>

      {/* Nutrition & Gym Recommendations */}
      <div className="grid sm:grid-cols-2 gap-3 text-xs leading-relaxed">
        <div className="p-4 rounded-2xl bg-[#f5f2e0] border border-[#e8e4d0]/80 space-y-2">
          <h3 className="font-bold text-sm text-[#38240d] flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-[#c05800]" /> Pure-Veg Nutrition Strategy
          </h3>
          <ul className="space-y-1.5 text-[#713600]">
            {advice.nutritionStrategy.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#c05800] font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-[#f5f2e0] border border-[#e8e4d0]/80 space-y-2">
          <h3 className="font-bold text-sm text-[#38240d] flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-[#713600]" /> Training & Cardio Plan
          </h3>
          <ul className="space-y-1.5 text-[#713600]">
            {advice.gymStrategy.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#c05800] font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Indian Foods for this BMI */}
      <div className="p-3.5 rounded-2xl bg-[#f5f2e0] border border-[#e8e4d0] text-xs space-y-1.5">
        <p className="font-bold text-[#713600] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Best Indian Meals for BMI {bmi}:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {advice.suggestedIndianFoods.map((food, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full bg-white text-[#38240d] font-medium shadow-xs">
              {food}
            </span>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-[#a08a6a] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {advice.caution}
        </p>

        <button
          onClick={handleApply}
          disabled={applying}
          className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
            applied
              ? 'bg-[#713600] text-white'
              : 'bg-[#c05800] hover:bg-[#a04800] text-white active:scale-95'
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