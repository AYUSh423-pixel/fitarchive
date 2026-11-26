'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, RefreshCw, ShoppingCart, Sparkles, ArrowRightLeft } from 'lucide-react';
import type { MealPlan, MealSlot } from '@/types/nutrifit';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SkeletonMealCard } from '@/components/ui/Skeleton';

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
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    const res = await fetch('/api/meal-plans', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setPlans(d.mealPlans || []);
    }
    setLoading(false);
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

  const planTypeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: '7_day', label: '7-Day' },
    { value: '30_day', label: '30-Day' },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20">
      {/* Generator Controls */}
      <Card variant="white" padding="lg" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="secondary" size="xs" className="mb-2">
              100% Pure Vegetarian • No Eggs
            </Badge>
          </div>

          <div className="bg-[#f0ece0] p-1 rounded-full" role="radiogroup" aria-label="Plan duration">
            {planTypeOptions.map((option) => (
              <Chip
                key={option.value}
                variant="default"
                size="xs"
                selected={planType === option.value}
                onSelect={() => setPlanType(option.value as 'daily' | '7_day' | '30_day')}
                role="radio"
                aria-checked={planType === option.value}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            isLoading={generating}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            size="sm"
          >
            Generate Plan
          </Button>
          <Button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            variant="secondary"
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            size="sm"
          >
            Generate Plan + Grocery List
          </Button>
          <Link href="/grocery" className="flex items-center">
            <Button variant="ghost" size="sm" leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}>
              View Grocery List
            </Button>
          </Link>
        </div>
      </Card>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonMealCard key={i} />
          ))}
        </div>
      ) : !activePlan ? (
        <Card variant="default" padding="xl" className="text-center space-y-3">
          <CalendarDays className="w-12 h-12 text-[#c05800] mx-auto" />
          <h3 className="font-display font-bold text-lg">No Meal Plan Generated Yet</h3>
          <p className="text-xs text-[#713600] max-w-md mx-auto">
            Click &ldquo;Generate Plan + Grocery List&rdquo; above to create a personalized 1,800 kcal / 130g protein
            Indian vegetarian meal plan with exact homemade quantities.
          </p>
        </Card>
      ) : (
        <>
          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1" role="tablist" aria-label="Meal plan days">
            {activePlan.days.map((d, idx) => (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDayIdx(idx)}
                role="tab"
                aria-selected={idx === selectedDayIdx}
                className={`
                  px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all
                  ${idx === selectedDayIdx
                    ? 'bg-[#c05800] text-white shadow-lg shadow-[#c05800]/30'
                    : 'bg-white text-[#713600] border border-[#e8e4d0] hover:bg-[#f5f2e0]'
                  }
                `}
              >
                {d.label}
              </button>
            ))}
          </div>

          {activeDay && (
            <div className="space-y-3" role="tabpanel" aria-label={`Day ${selectedDayIdx + 1} meals`}>
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((slot) => {
                const m = activeDay.meals[slot];
                return (
                  <Card key={slot} variant="white" padding="lg" className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="secondary" size="xs" className="mb-1.5">
                          {slot.charAt(0).toUpperCase() + slot.slice(1)}
                        </Badge>
                        <h3 className="font-display font-bold text-base text-[#38240d]">{m.title}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="secondary" size="sm">
                          {m.totalCalories} kcal • {m.totalProteinG}g P
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {m.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs text-[#713600] bg-[#f5f2e0] px-3 py-2 rounded-2xl"
                        >
                          <span className="font-semibold text-[#38240d]">
                            {it.name} ({it.quantity})
                          </span>
                          <span>{it.calories} kcal • {it.proteinG}g P</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-[#713600] italic flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#c05800]" /> {m.prepNotes}
                      </p>
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<ArrowRightLeft className="w-3 h-3" />}
                        onClick={() => setSubTarget({ dayNumber: activeDay.dayNumber, slot })}
                      >
                        Swap Food
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Substitution Modal */}
      <Modal
        isOpen={!!subTarget}
        onClose={() => setSubTarget(null)}
        title={subTarget ? `Swap ${subTarget.slot.charAt(0).toUpperCase() + subTarget.slot.slice(1)} (Pure Veg)` : 'Swap Meal'}
        description="Pick an alternative you enjoy — your daily protein & calorie goals stay balanced:"
        size="md"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setSubTarget(null)} className="w-full">
            Cancel
          </Button>
        }
      >
        <div className="space-y-2">
          {VEG_SUBSTITUTES.map((sub, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="w-full justify-between text-left hover:border-[#c05800] hover:bg-[#fff3e0]"
              onClick={() => handleSubstitute(sub)}
            >
              <span className="text-xs font-semibold text-[#38240d]">{sub.title}</span>
              <Badge variant="secondary" size="xs">
                {sub.calories} kcal • {sub.proteinG}g P
              </Badge>
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  );
}