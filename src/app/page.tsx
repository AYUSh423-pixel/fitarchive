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
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Calorie Arc Card */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm">
        <CalorieArcGauge consumed={totals.calories} target={target.caloriesKcal} />

        {/* Left / Right labels */}
        <div className="flex justify-between text-xs text-[#a08a6a] font-medium mt-2 px-1">
          <span>0</span>
          <span className="text-[#c05800] font-bold text-sm">{calLeft.toLocaleString()} kcal left</span>
          <span>{target.caloriesKcal.toLocaleString()}</span>
        </div>

        {/* Macro chips */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="bg-[#f5f2e0] rounded-2xl px-3 py-2.5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#713600]">PROTEIN</p>
            <p className="font-bold text-[#713600] text-sm mt-0.5">
              {Math.round(totals.proteinG)} <span className="font-normal text-xs text-[#a08a6a]">/{target.proteinG}g</span>
            </p>
            <div className="h-1 bg-[#e8e4d0] rounded-full mt-1.5">
              <div className="h-full bg-[#713600] rounded-full" style={{ width: `${Math.min(100, (totals.proteinG / target.proteinG) * 100)}%` }} />
            </div>
          </div>
          <div className="bg-[#fff3e0] rounded-2xl px-3 py-2.5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#c05800]">CARBS</p>
            <p className="font-bold text-[#c05800] text-sm mt-0.5">
              {Math.round(totals.carbsG)} <span className="font-normal text-xs text-[#a08a6a]">/{target.carbsG}g</span>
            </p>
            <div className="h-1 bg-[#e8e4d0] rounded-full mt-1.5">
              <div className="h-full bg-[#c05800] rounded-full" style={{ width: `${Math.min(100, (totals.carbsG / target.carbsG) * 100)}%` }} />
            </div>
          </div>
          <div className="bg-[#efebe9] rounded-2xl px-3 py-2.5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#5d4037]">FATS</p>
            <p className="font-bold text-[#5d4037] text-sm mt-0.5">
              {Math.round(totals.fatG)} <span className="font-normal text-xs text-[#a08a6a]">/{target.fatG}g</span>
            </p>
            <div className="h-1 bg-[#e8e4d0] rounded-full mt-1.5">
              <div className="h-full bg-[#5d4037] rounded-full" style={{ width: `${Math.min(100, (totals.fatG / target.fatG) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Log Meal CTA */}
      <button
        onClick={() => { setLogSlot('lunch'); setLogModalOpen(true); }}
        className="w-full py-4 rounded-[20px] bg-[#c05800] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(192,88,0,0.35)] active:scale-[0.98] transition-transform cursor-pointer"
      >
        <span className="text-lg">+</span> Log meal or snack
      </button>

      {/* Meal Slots Quick View */}
      <div className="bg-white rounded-[20px] shadow-sm overflow-hidden divide-y divide-[#f0ece0]">
        {MEAL_SLOTS.map((slot) => {
          const slotLogs = dayFoodLogs.filter((l) => l.mealSlot === slot.key);
          const slotCals = slotLogs.reduce((s, l) => s + l.calories, 0);
          return (
            <button
              key={slot.key}
              onClick={() => { setLogSlot(slot.key); setLogModalOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#faf9f5] transition-colors cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-full bg-[#fff3e0] flex items-center justify-center shrink-0">
                {slot.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#38240d] text-sm">{slot.label}</p>
                <p className="text-xs text-[#a08a6a]">
                  {slotLogs.length > 0 ? `${slotCals} kcal` : 'Nothing logged yet'}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-[#e8e4d0] flex items-center justify-center shrink-0">
                <span className="text-[#a08a6a] text-base leading-none">+</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* EVOLT / body plan nudge */}
      {!profile.onboardingCompleted ? (
        <Link
          href="/onboarding"
          className="flex items-center justify-between p-4 bg-white rounded-[20px] shadow-sm"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#c05800]">EVOLT 360 PLAN READY</p>
            <p className="text-sm font-semibold text-[#38240d] mt-0.5">
              {profile.weightKg}kg baseline, lean-athletic plan
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#a08a6a] shrink-0" />
        </Link>
      ) : (
        <Link
          href="/coach"
          className="flex items-center justify-between p-4 bg-white rounded-[20px] shadow-sm"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#c05800]">AI COACH</p>
            <p className="text-sm font-semibold text-[#38240d] mt-0.5">Ask your dietitian anything</p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#a08a6a] shrink-0" />
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