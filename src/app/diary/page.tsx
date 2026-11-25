'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Coffee, Sun, Utensils, CalendarDays, Camera } from 'lucide-react';
import { FoodLogModal } from '@/components/FoodLogModal';
import type { FavoriteMeal, FoodLog, MealSlot, NutritionTarget } from '@/types/nutrifit';

function getWeekDays(centerIso: string) {
  const base = new Date(centerIso + 'T00:00:00');
  // Show Sun..Sat of the week containing center, or at least 7 days around today
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    const iso = d.toISOString().slice(0, 10);
    return {
      iso,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
    };
  });
}

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

const MEAL_META: Record<MealSlot, { label: string; icon: React.ReactNode }> = {
  breakfast: { label: 'Breakfast', icon: <Sun className="w-4 h-4 text-[#B45309]" /> },
  lunch: { label: 'Lunch', icon: <Utensils className="w-4 h-4 text-[#B45309]" /> },
  snacks: { label: 'Snack', icon: <Coffee className="w-4 h-4 text-[#B45309]" /> },
  dinner: { label: 'Dinner', icon: <Moon className="w-4 h-4 text-[#B45309]" /> },
};
const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export default function FoodDiaryPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [targets, setTargets] = useState<NutritionTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<MealSlot>('lunch');
  const [statusMsg, setStatusMsg] = useState('');

  const loadDiary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/state?date=${selectedDate}`, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setLogs(d.dayFoodLogs || []);
        setTargets(d.nutritionTargets);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadDiary(); }, [loadDiary]);

  const days = getWeekDays(selectedDate);
  const totals = logs.reduce(
    (acc, l) => ({ calories: acc.calories + l.calories, protein: acc.protein + l.proteinG }),
    { calories: 0, protein: 0 }
  );
  const calTarget = targets?.caloriesKcal ?? 1800;
  const calLeft = Math.max(0, calTarget - totals.calories);

  // dot-progress: 24 dots
  const DOT_COUNT = 24;
  const filledDots = Math.round(Math.min(1, totals.calories / calTarget) * DOT_COUNT);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#6B5F4E]">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}, {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}
          </p>
          <h2 className="font-display text-[26px] font-bold text-[#1a1a1a] tracking-tight leading-tight">
            Diary
          </h2>
        </div>
        <button
          onClick={() => setSelectedDate(todayStr())}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#6B5F4E] shadow-sm border border-[#E5E0D8]"
        >
          <CalendarDays className="w-5 h-5" />
        </button>
      </div>

      {/* Week date strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {days.map((d) => {
          const isActive = d.iso === selectedDate;
          return (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(d.iso)}
              className={`flex flex-col items-center justify-center min-w-[52px] py-2.5 px-2 rounded-[16px] transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1C3A2B] text-white shadow-sm'
                  : 'bg-white text-[#1a1a1a] shadow-sm'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{d.dayName}</span>
              <span className={`font-bold text-lg leading-tight ${isActive ? 'text-white' : 'text-[#1a1a1a]'}`}>{d.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Daily summary card */}
      <div className="bg-white rounded-[20px] p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">EATEN</p>
            <p className="font-bold text-[28px] text-[#1a1a1a] leading-tight">{Math.round(totals.calories)} <span className="text-sm font-normal text-[#9CA3AF]">kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">LEFT OF {calTarget.toLocaleString()}</p>
            <p className="font-bold text-[28px] text-[#B45309] leading-tight">{calLeft.toLocaleString()}</p>
          </div>
        </div>

        {/* Dot progress bar */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {Array.from({ length: DOT_COUNT }, (_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full min-w-[8px] ${i < filledDots ? 'bg-[#B45309]' : 'bg-[#EDE9E0]'}`} />
          ))}
        </div>

        {/* Macro row */}
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">PROTEIN</p>
            <p className="font-semibold text-sm text-[#1a1a1a]">{Math.round(totals.protein)} / {targets?.proteinG ?? 130}g</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider">CARBS</p>
            <p className="font-semibold text-sm text-[#1a1a1a]">
              {Math.round(logs.reduce((s, l) => s + l.carbsG, 0))} / {targets?.carbsG ?? 155}g
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider">FATS</p>
            <p className="font-semibold text-sm text-[#1a1a1a]">
              {Math.round(logs.reduce((s, l) => s + l.fatG, 0))} / {targets?.fatG ?? 65}g
            </p>
          </div>
        </div>
      </div>

      {/* Meal slot cards */}
      {loading ? (
        <div className="space-y-3">
          {SLOT_ORDER.map((s) => <div key={s} className="h-16 rounded-[20px] bg-white/80 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {SLOT_ORDER.map((slotKey) => {
            const meta = MEAL_META[slotKey];
            const slotLogs = logs.filter((l) => l.mealSlot === slotKey);
            const slotCals = slotLogs.reduce((s, l) => s + l.calories, 0);

            return (
              <div key={slotKey} className="bg-white rounded-[20px] shadow-sm overflow-hidden">
                {/* Slot header row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] text-sm">{meta.label}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {slotLogs.length > 0 ? `${slotCals} kcal` : 'Nothing logged yet'}
                    </p>
                  </div>
                  {/* Camera quick-scan */}
                  <button
                    onClick={() => { setModalSlot(slotKey); setModalOpen(true); }}
                    className="w-9 h-9 rounded-full border-2 border-[#E5E0D8] flex items-center justify-center text-[#9CA3AF] hover:border-[#B45309] hover:text-[#B45309] transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  {/* + add */}
                  <button
                    onClick={() => { setModalSlot(slotKey); setModalOpen(true); }}
                    className="w-9 h-9 rounded-full bg-[#B45309] flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="text-lg leading-none">+</span>
                  </button>
                </div>

                {/* Logged food items */}
                {slotLogs.length > 0 && (
                  <div className="border-t border-[#F3F0EB] divide-y divide-[#F3F0EB]">
                    {slotLogs.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a1a1a] truncate">{item.foodName}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {item.quantity} {item.unit} · {item.proteinG}g protein
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[#1a1a1a] shrink-0 ml-3">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {statusMsg && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}

      <FoodLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultMealSlot={modalSlot}
        defaultDate={selectedDate}
        onSaved={loadDiary}
      />
    </div>
  );
}
