'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Camera,
  Clock,
  Droplets,
  Pencil,
  Plus,
  Refrigerator,
  RotateCcw,
  Soup,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { CalorieArcGauge } from '@/components/CalorieArcGauge';
import { FoodLogModal } from '@/components/FoodLogModal';
import { BmiAdvisorCard } from '@/components/BmiAdvisorCard';
import type { FoodLog, NutritionTarget, Recipe, UserProfile } from '@/types/nutrifit';

interface DashboardData {
  date: string;
  profile: UserProfile;
  nutritionTargets: NutritionTarget;
  dayFoodLogs: FoodLog[];
  dayWaterMl: number;
  recipes: Recipe[];
}

export default function HomeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<FoodLog | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleAddWater = async (amountMl = 250) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'water', amountMl }),
    });
    fetchState();
  };

  const handleDeleteLog = async (log: FoodLog) => {
    const res = await fetch(`/api/food-logs?id=${encodeURIComponent(log.id)}`, { method: 'DELETE' });
    if (res.ok) {
      setLastDeleted(log);
      fetchState();
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeleted) return;
    await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastDeleted),
    });
    setLastDeleted(null);
    fetchState();
  };

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-56 rounded-2xl bg-[#EAE7EB]" />
        <div className="h-72 rounded-3xl bg-[#FAF8F5]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 rounded-3xl bg-[#DCFCE7]/50" />
          <div className="h-32 rounded-3xl bg-[#F3E8FF]/50" />
        </div>
      </div>
    );
  }

  const { profile, nutritionTargets, dayFoodLogs, dayWaterMl, recipes } = data;
  const totals = dayFoodLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      proteinG: acc.proteinG + l.proteinG,
      carbsG: acc.carbsG + l.carbsG,
      fatG: acc.fatG + l.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
  const suggestedRecipe = recipes[0];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Greeting Row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FB923C] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#554337]">
              Today • {formattedDate}
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#1B1B1E] tracking-tight mt-0.5">
            {greeting}, {profile.name}
          </h2>
        </div>

        <Link
          href="/diary"
          aria-label="Open Food Diary Calendar"
          className="w-10 h-10 rounded-full bg-[#F0EDF1] flex items-center justify-center text-[#554337] hover:text-[#1B1B1E] shadow-xs transition-transform active:scale-95"
        >
          <Calendar className="w-5 h-5" />
        </Link>
      </div>

      {/* Onboarding nudge if not yet reviewed */}
      {!profile.onboardingCompleted && (
        <Link
          href="/onboarding"
          className="block p-4 rounded-3xl bg-[#FFEDD5] border border-[#FB923C]/40 flex items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#944A00]">
              EVOLT 360 Profile Ready
            </p>
            <p className="text-sm font-semibold text-[#301400]">
              Review your 76.4 kg baseline &amp; 1,800 kcal lean-athletic plan
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#944A00] shrink-0" />
        </Link>
      )}

      {/* Hero Segmented Calorie Gauge Card */}
      <section className="relative tactile-card-white p-6 overflow-hidden">
        <div className="absolute -top-16 inset-x-0 h-32 bg-gradient-to-b from-[#FFDCC5]/35 to-transparent pointer-events-none" />
        <CalorieArcGauge consumed={totals.calories} target={nutritionTargets.caloriesKcal} />

        {/* Real-time Macro Pills */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#F0EDF1] text-center">
          <div className="p-2 rounded-2xl bg-[#DCFCE7]/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#14532D]">Protein</p>
            <p className="font-display font-bold text-sm text-[#14532D]">
              {Math.round(totals.proteinG)}g{' '}
              <span className="font-normal opacity-75">/ {nutritionTargets.proteinG}g</span>
            </p>
          </div>
          <div className="p-2 rounded-2xl bg-[#FFEDD5]/70">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C2D12]">Carbs</p>
            <p className="font-display font-bold text-sm text-[#7C2D12]">
              {Math.round(totals.carbsG)}g{' '}
              <span className="font-normal opacity-75">/ {nutritionTargets.carbsG}g</span>
            </p>
          </div>
          <div className="p-2 rounded-2xl bg-[#F3E8FF]/70">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#581C87]">Fats</p>
            <p className="font-display font-bold text-sm text-[#581C87]">
              {Math.round(totals.fatG)}g{' '}
              <span className="font-normal opacity-75">/ {nutritionTargets.fatG}g</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setLogModalOpen(true)}
          className="mt-4 w-full py-3 px-4 rounded-2xl bg-[#F5F3F6] hover:bg-[#F0EDF1] text-[#1B1B1E] flex items-center justify-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] active:scale-[0.99] transition-all cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-[#FB923C] text-[#673200] flex items-center justify-center">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </span>
          <span className="text-sm font-semibold">Log Meal or Snack</span>
        </button>
      </section>

      {/* Quick Category 4-Grid (Exact Approved Stitch Palette) */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/scanner"
          className="bg-[#DCFCE7] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-[0_8px_20px_-6px_rgba(0,108,75,0.08)] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-white/85 flex items-center justify-center text-[#14532D] shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/75 text-[#14532D] text-[11px] font-bold">
              Instant
            </span>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[#14532D]">AI Meal Scan</h3>
            <p className="text-[11px] text-[#14532D]/80 mt-0.5">Photo calories &amp; macros</p>
          </div>
        </Link>

        <Link
          href="/explore"
          className="bg-[#F3E8FF] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-[0_8px_20px_-6px_rgba(103,75,181,0.08)] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-white/85 flex items-center justify-center text-[#581C87] shadow-xs">
              <Soup className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/75 text-[#581C87] text-[11px] font-bold">
              Pure Veg
            </span>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[#581C87]">Desi Nutrition</h3>
            <p className="text-[11px] text-[#581C87]/80 mt-0.5">Thali, dal, roti database</p>
          </div>
        </Link>

        <Link
          href="/planner"
          className="bg-[#E0F2FE] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-[0_8px_20px_-6px_rgba(3,105,161,0.08)] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-white/85 flex items-center justify-center text-[#0369A1] shadow-xs">
              <Refrigerator className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/75 text-[#0369A1] text-[11px] font-bold">
              7 / 30 Day
            </span>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[#0369A1]">Meal Planner</h3>
            <p className="text-[11px] text-[#0369A1]/80 mt-0.5">Auto recipes &amp; grocery</p>
          </div>
        </Link>

        <Link
          href="/coach"
          className="bg-[#FEF08A] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-[0_8px_20px_-6px_rgba(180,83,9,0.08)] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-white/85 flex items-center justify-center text-[#78350F] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/75 text-[#78350F] text-[11px] font-bold">
              Online
            </span>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-[#78350F]">AI Dietitian</h3>
            <p className="text-[11px] text-[#78350F]/80 mt-0.5">Chat guidance &amp; tips</p>
          </div>
        </Link>
      </section>

      {/* Dynamic BMI Advisor & Personalized Suggestions */}
      <BmiAdvisorCard
        initialWeightKg={profile.weightKg}
        initialHeightCm={profile.heightCm}
        gender={profile.gender}
        onApplyTargets={() => fetchState()}
      />

      {/* Undo Banner */}
      {lastDeleted && (
        <div className="p-3 rounded-2xl bg-[#303033] text-white flex items-center justify-between text-xs font-semibold">
          <span>Removed &ldquo;{lastDeleted.foodName}&rdquo;</span>
          <button
            onClick={handleUndoDelete}
            className="flex items-center gap-1 text-[#FB923C] font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}

      {/* Today's Meals Logged */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-[#1B1B1E]">Meals Logged</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAE7EB] text-xs font-bold text-[#554337]">
              {dayFoodLogs.length} items
            </span>
          </div>
          <Link href="/diary" className="text-xs font-bold text-[#944A00] hover:underline">
            Detailed Log
          </Link>
        </div>

        {dayFoodLogs.length === 0 ? (
          <div className="tactile-card p-6 text-center space-y-2">
            <p className="font-display font-semibold text-[#1B1B1E]">No meals logged yet today</p>
            <p className="text-xs text-[#554337]">
              Tap &ldquo;Log Meal or Snack&rdquo; above or snap a photo of your plate to see live calories &amp; protein.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayFoodLogs.map((log) => (
              <div key={log.id} className="tactile-card-white p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base capitalize text-[#1B1B1E]">
                        {log.mealSlot}
                      </span>
                      <span className="text-[11px] font-medium text-[#71717A]">
                        {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-[#554337] font-medium">
                      {log.foodName} • {log.quantity} {log.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-lg text-[#1B1B1E]">{log.calories} kcal</p>
                    <p className="text-[11px] font-semibold text-[#944A00]">
                      {Math.round((log.calories / Math.max(1, nutritionTargets.caloriesKcal)) * 100)}% of goal
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                      P: {log.proteinG}g
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFEDD5] text-[#7C2D12] text-[11px] font-bold">
                      C: {log.carbsG}g
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#581C87] text-[11px] font-bold">
                      F: {log.fatG}g
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/diary"
                      aria-label="Edit meal"
                      className="w-8 h-8 rounded-full bg-[#F5F3F6] flex items-center justify-center text-[#554337] hover:text-[#1B1B1E]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDeleteLog(log)}
                      aria-label="Delete meal"
                      className="w-8 h-8 rounded-full bg-[#FFDAD6]/60 flex items-center justify-center text-[#93000A] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggested Pure-Veg Dinner */}
      {suggestedRecipe && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-[#1B1B1E]">Suggested Dinner</h3>
              <span className="w-5 h-5 rounded-full bg-[#FB923C] text-white flex items-center justify-center">
                <Star className="w-3 h-3 fill-current" />
              </span>
            </div>
            <Link href="/explore" className="text-xs font-bold text-[#944A00] hover:underline">
              Explore More
            </Link>
          </div>

          <div className="tactile-card-white p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {suggestedRecipe.prepTimeMin} min
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#581C87] text-[11px] font-bold">
                  High Protein • Pure Veg
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#1B1B1E] text-white text-xs font-bold">
                {suggestedRecipe.caloriesPerServing} kcal • {suggestedRecipe.proteinPerServing}g P
              </span>
            </div>

            <h4 className="font-display text-xl font-bold text-[#1B1B1E]">{suggestedRecipe.name}</h4>
            <p className="text-xs text-[#554337] leading-relaxed">{suggestedRecipe.description}</p>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-[#554337]">
                Level: {suggestedRecipe.difficulty}
              </span>
              <Link
                href={`/recipes/${suggestedRecipe.id}`}
                className="px-4 py-2 rounded-full bg-[#944A00] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#713700] transition-colors"
              >
                <span>View Recipe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Hydration Tracker Quick Card */}
      <section className="tactile-card-white p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-[#1B1B1E]">Hydration Tracker</p>
            <p className="text-xs text-[#554337]">
              {(dayWaterMl / 1000).toFixed(2)}L of {(nutritionTargets.waterMl / 1000).toFixed(1)}L reached
            </p>
          </div>
        </div>

        <button
          onClick={() => handleAddWater(250)}
          className="px-3.5 py-2 rounded-full bg-[#E0F2FE] hover:bg-[#bae6fd] text-[#0369A1] text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> 250 ml
        </button>
      </section>

      <FoodLogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        onSaved={fetchState}
      />
    </div>
  );
}
