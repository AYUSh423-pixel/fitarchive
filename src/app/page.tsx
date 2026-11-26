'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Moon, Coffee, Sun, Utensils } from 'lucide-react';
import { CalorieArcGauge } from '@/components/CalorieArcGauge';
import { FoodLogModal } from '@/components/FoodLogModal';
import type { FoodLog, MealSlot, NutritionTarget, UserProfile } from '@/types/nutrifit';

interface DashboardData {
  date: string;
  profile: UserProfile;
  nutritionTargets: NutritionTarget;
  dayFoodLogs: FoodLog[];
  dayWaterMl: number;
}

const MEAL_SLOTS: Array<{ key: MealSlot; label: string; icon: React.ReactNode }> = [
  { key: 'breakfast', label: 'Breakfast', icon: <Sun className="w-4 h-4 text-[#c05800]" /> },
  { key: 'lunch', label: 'Lunch', icon: <Utensils className="w-4 h-4 text-[#c05800]" /> },
  { key: 'snacks', label: 'Snack', icon: <Coffee className="w-4 h-4 text-[#c05800]" /> },
  { key: 'dinner', label: 'Dinner', icon: <Moon className="w-4 h-4 text-[#c05800]" /> },
];

export default function HomeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSlot, setLogSlot] = useState<MealSlot>('lunch');

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
        <div className="h-10 w-48 rounded-2xl bg-white/60" />
        <div className="h-72 rounded-[20px] bg-white/80" />
        <div className="h-16 rounded-[20px] bg-white/80" />
        <div className="h-56 rounded-[20px] bg-white/80" />
      </div>
    );
  }

  const { profile, nutritionTargets: target, dayFoodLogs, dayWaterMl } = data;

  const totals = dayFoodLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      proteinG: acc.proteinG + l.proteinG,
      carbsG: acc.carbsG + l.carbsG,
      fatG: acc.fatG + l.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const calLeft = Math.max(0, Math.round(target.caloriesKcal - totals.calories));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date()
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    .toUpperCase();

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-6">
      {/* Header Greeting */}
      <div className="flex items-center justify-between pb-1 animate-fade-in">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#B45309]">
            TODAY · {formattedDate}
          </p>
          <h1 className="text-2xl font-bold text-[#1C1917] tracking-tight mt-0.5">
            {greeting}, {profile?.name ? profile.name.split(' ')[0] : 'Friend'}
          </h1>
        </div>
        <Link
          href="/profile"
          className="w-10 h-10 rounded-full bg-white border border-[#E7E3D8] shadow-sm flex items-center justify-center text-[#B45309] font-bold text-sm tactile-press overflow-hidden"
          title="Profile"
        >
          {profile?.name ? profile.name.charAt(0).toUpperCase() : 'N'}
        </Link>
      </div>

      {/* Calorie Arc Card */}
      <div className="card-minimal p-5 animate-fade-in-up">
        <CalorieArcGauge consumed={totals.calories} target={target.caloriesKcal} />

        {/* Left / Right labels */}
        <div className="flex justify-between text-xs text-[#8C827A] font-medium mt-3 px-1">
          <span>0</span>
          <span className="text-[#B45309] font-bold text-sm">{calLeft.toLocaleString()} kcal left</span>
          <span>{target.caloriesKcal.toLocaleString()}</span>
        </div>

        {/* Macro chips */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="bg-[#FAF8F5] border border-[#E7E3D8]/60 rounded-2xl px-3 py-2.5 transition-transform duration-200 hover:scale-[1.02]">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#B45309]">PROTEIN</p>
            <p className="font-bold text-[#1C1917] text-sm mt-0.5">
              {Math.round(totals.proteinG)} <span className="font-normal text-xs text-[#8C827A]">/{target.proteinG}g</span>
            </p>
            <div className="h-1 bg-[#E7E3D8] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[#B45309] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, (totals.proteinG / target.proteinG) * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-[#FAF8F5] border border-[#E7E3D8]/60 rounded-2xl px-3 py-2.5 transition-transform duration-200 hover:scale-[1.02]">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#D97706]">CARBS</p>
            <p className="font-bold text-[#1C1917] text-sm mt-0.5">
              {Math.round(totals.carbsG)} <span className="font-normal text-xs text-[#8C827A]">/{target.carbsG}g</span>
            </p>
            <div className="h-1 bg-[#E7E3D8] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[#D97706] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, (totals.carbsG / target.carbsG) * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-[#FAF8F5] border border-[#E7E3D8]/60 rounded-2xl px-3 py-2.5 transition-transform duration-200 hover:scale-[1.02]">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#78716C]">FATS</p>
            <p className="font-bold text-[#1C1917] text-sm mt-0.5">
              {Math.round(totals.fatG)} <span className="font-normal text-xs text-[#8C827A]">/{target.fatG}g</span>
            </p>
            <div className="h-1 bg-[#E7E3D8] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[#78716C] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, (totals.fatG / target.fatG) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Log Meal CTA with tactile spring */}
      <button
        onClick={() => { setLogSlot('lunch'); setLogModalOpen(true); }}
        className="w-full py-4 rounded-[20px] bg-[#B45309] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(180,83,9,0.28)] tactile-press cursor-pointer animate-fade-in-up"
      >
        <span className="text-xl leading-none">+</span> Log meal or snack
      </button>

      {/* Meal Slots Quick View */}
      <div className="card-minimal overflow-hidden divide-y divide-[#F1EFEA] animate-fade-in-up">
        {MEAL_SLOTS.map((slot) => {
          const slotLogs = dayFoodLogs.filter((l) => l.mealSlot === slot.key);
          const slotCals = slotLogs.reduce((s, l) => s + l.calories, 0);
          return (
            <button
              key={slot.key}
              onClick={() => { setLogSlot(slot.key); setLogModalOpen(true); }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#FAF9F6] transition-colors cursor-pointer text-left active:bg-[#F5F2EB]"
            >
              <div className="w-9 h-9 rounded-full bg-[#FFF7ED] border border-[#FED7AA]/40 flex items-center justify-center shrink-0">
                {slot.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1C1917] text-sm">{slot.label}</p>
                <p className="text-xs text-[#8C827A]">
                  {slotLogs.length > 0 ? `${slotCals} kcal` : 'Nothing logged yet'}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full border border-[#E7E3D8] flex items-center justify-center shrink-0 text-[#8C827A] hover:border-[#B45309] hover:text-[#B45309] transition-colors">
                <span className="text-base leading-none">+</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* EVOLT / body plan nudge */}
      {!profile.onboardingCompleted ? (
        <Link
          href="/onboarding"
          className="card-minimal p-4 flex items-center justify-between tactile-press animate-fade-in-up"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#B45309]">EVOLT 360 PLAN READY</p>
            <p className="text-sm font-semibold text-[#1C1917] mt-0.5">
              {profile.weightKg}kg baseline, lean-athletic plan
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8C827A] shrink-0" />
        </Link>
      ) : (
        <Link
          href="/coach"
          className="card-minimal p-4 flex items-center justify-between tactile-press animate-fade-in-up"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#B45309]">AI COACH</p>
            <p className="text-sm font-semibold text-[#1C1917] mt-0.5">Ask your dietitian anything</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#8C827A] shrink-0" />
        </Link>
      )}

      <FoodLogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        defaultMealSlot={logSlot}
        onSaved={fetchState}
      />
    </div>
  );
}