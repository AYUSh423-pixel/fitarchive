'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, RefreshCw, ShoppingCart, Sparkles, ArrowRightLeft } from 'lucide-react';
import type { MealPlan, MealSlot } from '@/types/nutrifit';

const VEG_SUBSTITUTES: Array<{ title: string; calories: number; proteinG: number }> = [
  { title: '150g Grilled Low-Fat Paneer Tikka + Salad', calories: 345, proteinG: 30 },
  { title: '50g Soya Chunk Masala Curry + 2 Phulka Rotis', calories: 415, proteinG: 33 },
  { title: '2 Paneer-Stuffed Moong Dal Chillas + Hung Curd', calories: 490, proteinG: 37 },
  { title: 'Rajma Masala + Steamed Rice + 100g Tofu', calories: 534, proteinG: 31.6 },
  { title: '2 Methi Thepla + Gujarati Dal + 100g Paneer Bhurji', calories: 540, proteinG: 31 },
];

export default function MealPlannerPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [planType, setPlanType] = useState<'daily' | '7_day' | '30_day'>('7_day');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [subTarget, setSubTarget] = useState<{ dayNumber: number; slot: MealSlot } | null>(null);
  const [toast, setToast] = useState('');

  const loadPlans = async () => {
    const res = await fetch('/api/meal-plans', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setPlans(d.mealPlans || []);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleGenerate = async (withGrocery = false) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, generateGrocery: withGrocery }),
      });
      if (res.ok) {
        await loadPlans();
        setSelectedDayIdx(0);
        setToast(
          withGrocery
            ? `Generated ${planType.replace('_', '-')} Pure-Veg Plan & synced Grocery List!`
            : `Generated ${planType.replace('_', '-')} Pure-Veg Indian Meal Plan!`
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubstitute = async (sub: { title: string; calories: number; proteinG: number }) => {
    if (!activePlan || !subTarget) return;
    const res = await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'substitute',
        planId: activePlan.id,
        dayNumber: subTarget.dayNumber,
        mealSlot: subTarget.slot,
        replacementTitle: sub.title,
        replacementCalories: sub.calories,
        replacementProteinG: sub.proteinG,
      }),
    });
    if (res.ok) {
      setSubTarget(null);
      loadPlans();
      setToast('Meal substituted while keeping your macro targets aligned!');
    }
  };

  const activePlan = plans[0] || null;
  const activeDay = activePlan?.days?.[selectedDayIdx] || null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Generator Controls */}
      <section className="tactile-card-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006C4B]">
              100% Pure Vegetarian • No Eggs
            </span>
            <h2 className="font-display text-xl font-bold text-[#1B1B1E]">Personalized Meal Planner</h2>
          </div>

          <div className="flex gap-1.5 bg-[#F2EFE9] p-1 rounded-full">
            {(['daily', '7_day', '30_day'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPlanType(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                  planType === t ? 'bg-[#FB923C] text-white' : 'text-[#554337]'
                }`}
              >
                {t === 'daily' ? 'Daily' : t === '7_day' ? '7-Day' : '30-Day'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="px-5 py-2.5 rounded-full bg-[#1B1B1E] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating...' : 'Generate Plan'}</span>
          </button>
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="px-5 py-2.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Generate Plan + Grocery List</span>
          </button>
          <Link
            href="/grocery"
            className="px-4 py-2.5 rounded-full bg-[#F5F3F6] text-xs font-semibold text-[#1B1B1E] flex items-center gap-1.5"
          >
            View Grocery List
          </Link>
        </div>
      </section>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {!activePlan ? (
        <div className="tactile-card p-8 text-center space-y-3">
          <CalendarDays className="w-10 h-10 text-[#944A00] mx-auto" />
          <h3 className="font-display font-bold text-lg">No Meal Plan Generated Yet</h3>
          <p className="text-xs text-[#554337] max-w-md mx-auto">
            Click &ldquo;Generate Plan + Grocery List&rdquo; above to create a personalized 1,800 kcal / 130g protein
            Indian vegetarian meal plan with exact homemade quantities.
          </p>
        </div>
      ) : (
        <>
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {activePlan.days.map((d, idx) => (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
                  idx === selectedDayIdx
                    ? 'bg-[#FB923C] text-white shadow-xs'
                    : 'bg-white text-[#554337] border border-[#E4E0D8]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {activeDay && (
            <div className="space-y-3">
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((slot) => {
                const m = activeDay.meals[slot];
                return (
                  <div key={slot} className="tactile-card-white p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#944A00]">
                          {slot}
                        </span>
                        <h3 className="font-display font-bold text-base text-[#1B1B1E]">{m.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#944A00] text-xs font-bold">
                          {m.totalCalories} kcal • {m.totalProteinG}g P
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {m.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-xs text-[#554337] bg-[#F5F3F6] px-3 py-2 rounded-xl">
                          <span className="font-semibold text-[#1B1B1E]">
                            {it.name} ({it.quantity})
                          </span>
                          <span>
                            {it.calories} kcal • {it.proteinG}g P
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-[#554337] italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#944A00]" /> {m.prepNotes}
                      </p>
                      <button
                        onClick={() => setSubTarget({ dayNumber: activeDay.dayNumber, slot })}
                        className="px-3 py-1.5 rounded-full bg-[#F2EFE9] hover:bg-[#EAE7EB] text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Swap Food
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Substitution Modal */}
      {subTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl p-6 space-y-3 shadow-2xl border border-[#E4E0D8]">
            <h3 className="font-display font-bold text-lg">Swap {subTarget.slot} (Pure Veg)</h3>
            <p className="text-xs text-[#554337]">
              Pick an alternative you enjoy — your daily protein &amp; calorie goals stay balanced:
            </p>
            <div className="space-y-2">
              {VEG_SUBSTITUTES.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => handleSubstitute(sub)}
                  className="w-full text-left p-3 rounded-2xl bg-white border border-[#E4E0D8] hover:border-[#FB923C] flex justify-between items-center cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#1B1B1E]">{sub.title}</span>
                  <span className="text-[11px] font-bold text-[#006C4B] shrink-0 ml-2">
                    {sub.calories} kcal • {sub.proteinG}g P
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setSubTarget(null)}
              className="w-full py-2.5 rounded-full bg-[#F2EFE9] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
