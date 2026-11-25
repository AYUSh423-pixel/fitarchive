'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Camera,
  Copy,
  Flame,
  Mic,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  Coffee,
} from 'lucide-react';
import { FoodLogModal } from '@/components/FoodLogModal';
import type { FavoriteMeal, FoodLog, MealSlot, NutritionTarget } from '@/types/nutrifit';

function getRecentDates(centerIso: string) {
  const base = new Date(centerIso + 'T00:00:00');
  return [-2, -1, 0, 1, 2].map((offset) => {
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

export default function FoodDiaryPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [targets, setTargets] = useState<NutritionTarget | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<MealSlot>('lunch');
  const [modalMode, setModalMode] = useState<'manual' | 'voice'>('manual');
  const [statusMsg, setStatusMsg] = useState('');
  const [lastDeleted, setLastDeleted] = useState<FoodLog | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const loadDiary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/state?date=${selectedDate}`, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setLogs(d.dayFoodLogs || []);
        setTargets(d.nutritionTargets);
        setFavorites(d.favoriteMeals || []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDiary();
  }, [loadDiary]);

  const handleDelete = async (log: FoodLog) => {
    const res = await fetch(`/api/food-logs?id=${encodeURIComponent(log.id)}`, { method: 'DELETE' });
    if (res.ok) {
      setLastDeleted(log);
      loadDiary();
    }
  };

  const handleUndo = async () => {
    if (!lastDeleted) return;
    await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastDeleted),
    });
    setLastDeleted(null);
    loadDiary();
  };

  const handleCopyYesterday = async () => {
    const res = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'copy_yesterday', logDate: selectedDate }),
    });
    const d = await res.json();
    if (res.ok) {
      setStatusMsg(`Copied ${d.logs.length} items from yesterday!`);
      loadDiary();
    } else {
      setStatusMsg(d.error || 'No meals found yesterday.');
    }
  };

  const handleLogFavorite = async (fav: FavoriteMeal) => {
    await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: selectedDate,
        mealSlot: fav.mealSlot,
        items: fav.items.map((it) => ({ ...it, loggingMethod: 'quick_copy', confidence: 'verified' })),
      }),
    });
    setShowFavorites(false);
    setStatusMsg(`Logged favorite "${fav.name}"!`);
    loadDiary();
  };

  const handleQuickLogCoachSuggestion = async () => {
    await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: selectedDate,
        mealSlot: 'dinner',
        foodId: 'food-soya-curry',
        foodName: 'Soya Chunk Masala Curry + Kachumber Salad',
        quantity: 1,
        unit: 'bowl',
        weightGrams: 300,
        calories: 285,
        proteinG: 29,
        carbsG: 26,
        fatG: 5.5,
        loggingMethod: 'meal_plan',
        confidence: 'verified',
        oilGheeGrams: 5,
      }),
    });
    setStatusMsg('Logged Coach high-protein dinner suggestion!');
    loadDiary();
  };

  const dates = getRecentDates(selectedDate);
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.proteinG,
      carbs: acc.carbs + l.carbsG,
      fat: acc.fat + l.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calTarget = targets?.caloriesKcal ?? 1800;
  const proTarget = targets?.proteinG ?? 130;
  const carbTarget = targets?.carbsG ?? 155;
  const fatTarget = targets?.fatG ?? 65;
  const calLeft = Math.round(calTarget - totals.calories);
  const calPct = Math.min(100, Math.round((totals.calories / Math.max(1, calTarget)) * 100));

  const mealSlots: Array<{ key: MealSlot; title: string; subtitle: string; icon: React.ReactNode; badgeBg: string }> = [
    { key: 'breakfast', title: 'Breakfast', subtitle: 'Morning Fuel', icon: <Sun className="w-5 h-5" />, badgeBg: 'bg-[#FFDCC5] text-[#301400]' },
    { key: 'lunch', title: 'Lunch', subtitle: 'Peak Midday Fuel', icon: <Utensils className="w-5 h-5" />, badgeBg: 'bg-[#DCFCE7] text-[#14532D]' },
    { key: 'snacks', title: 'Evening Snack', subtitle: 'Pre / Post-Gym', icon: <Coffee className="w-5 h-5" />, badgeBg: 'bg-[#E8DDFF] text-[#21005E]' },
    { key: 'dinner', title: 'Dinner', subtitle: 'Light & High Protein', icon: <Moon className="w-5 h-5" />, badgeBg: 'bg-[#F0EDF1] text-[#554337]' },
  ];

  const remainingPro = Math.max(0, Math.round(proTarget - totals.protein));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Horizontal Tactile Date Selector Strip */}
      <section className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        {dates.map((d) => {
          const active = d.iso === selectedDate;
          return (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(d.iso)}
              className={`flex flex-col items-center justify-center min-w-[58px] py-2.5 rounded-2xl transition-all cursor-pointer ${
                active
                  ? 'bg-[#FB923C] text-[#673200] shadow-md scale-105'
                  : 'bg-white text-[#1B1B1E] shadow-xs hover:bg-[#F5F3F6]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.dayName}</span>
              <span className="font-display text-lg font-bold mt-0.5">{d.dayNum}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#673200] mt-0.5" />}
            </button>
          );
        })}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Pick custom date"
          className="tactile-input px-3 py-2 text-xs font-semibold shrink-0"
        />
      </section>

      {/* Daily Macro Summary Pebble Card */}
      <section className="tactile-card-white p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#944A00]">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Daily Calorie Budget</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display text-3xl font-bold text-[#1B1B1E]">
                {Math.round(totals.calories).toLocaleString()}
              </span>
              <span className="text-sm text-[#554337]">/ {calTarget.toLocaleString()} kcal</span>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-[#FFDCC5] text-[#301400] text-xs font-bold inline-block">
              {calLeft >= 0 ? `${calLeft} kcal left` : `${Math.abs(calLeft)} kcal over`}
            </span>
            <p className="text-[11px] font-semibold text-[#554337] mt-1">{calPct}% reached</p>
          </div>
        </div>

        {/* Interactive Macro Gauges */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006C4B]" /> Protein
              </span>
              <span>
                <strong>{Math.round(totals.protein)}g</strong> / {proTarget}g
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F0EDF1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#006C4B] rounded-full transition-all"
                style={{ width: `${Math.min(100, (totals.protein / proTarget) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#674BB5]" /> Carbs
              </span>
              <span>
                <strong>{Math.round(totals.carbs)}g</strong> / {carbTarget}g
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F0EDF1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#674BB5] rounded-full transition-all"
                style={{ width: `${Math.min(100, (totals.carbs / carbTarget) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FB923C]" /> Fats
              </span>
              <span>
                <strong>{Math.round(totals.fat)}g</strong> / {fatTarget}g
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F0EDF1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FB923C] rounded-full transition-all"
                style={{ width: `${Math.min(100, (totals.fat / fatTarget) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0EDF1]">
          <button
            onClick={handleCopyYesterday}
            className="px-3.5 py-2 rounded-full bg-[#F5F3F6] hover:bg-[#EAE7EB] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Yesterday
          </button>
          <button
            onClick={() => setShowFavorites((v) => !v)}
            className="px-3.5 py-2 rounded-full bg-[#F5F3F6] hover:bg-[#EAE7EB] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" /> Favorites ({favorites.length})
          </button>
          {lastDeleted && (
            <button
              onClick={handleUndo}
              className="px-3.5 py-2 rounded-full bg-[#303033] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FB923C]" /> Undo Delete
            </button>
          )}
        </div>
      </section>

      {statusMsg && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {showFavorites && (
        <div className="tactile-card p-4 space-y-2">
          <h3 className="font-display font-bold text-sm">Saved Pure-Veg Favorite Meals</h3>
          {favorites.map((fav) => (
            <div key={fav.id} className="p-3 rounded-2xl bg-white flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{fav.name}</p>
                <p className="text-xs text-[#554337]">
                  {fav.totalCalories} kcal • {fav.totalProteinG}g protein
                </p>
              </div>
              <button
                onClick={() => handleLogFavorite(fav)}
                className="px-3 py-1.5 rounded-full bg-[#FB923C] text-white text-xs font-semibold cursor-pointer"
              >
                + Log
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Meal Slot Cards */}
      {loading ? (
        <div className="h-48 rounded-3xl bg-white animate-pulse" />
      ) : (
        <div className="space-y-4">
          {mealSlots.map((slot) => {
            const slotLogs = logs.filter((l) => l.mealSlot === slot.key);
            const slotCals = slotLogs.reduce((s, l) => s + l.calories, 0);
            return (
              <article key={slot.key} className="tactile-card-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${slot.badgeBg}`}>
                      {slot.icon}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-[#1B1B1E]">{slot.title}</h2>
                      <p className="text-xs text-[#554337]">{slot.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg">{slotCals}</p>
                    <p className="text-[11px] text-[#554337]">kcal</p>
                  </div>
                </div>

                {slotLogs.length > 0 && (
                  <div className="space-y-2">
                    {slotLogs.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[#F5F3F6] flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1B1B1E]">{item.foodName}</p>
                          <p className="text-xs text-[#554337]">
                            {item.quantity} {item.unit} ({item.weightGrams}g) • {item.proteinG}g Protein •{' '}
                            {item.confidence === 'ai_confirmed_estimate' ? 'AI Estimate' : 'Verified'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-[#1B1B1E]">{item.calories} kcal</span>
                          <button
                            onClick={() => handleDelete(item)}
                            aria-label="Remove food item"
                            className="p-1.5 rounded-full hover:bg-[#FFDAD6] text-[#93000A] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pure-Veg Coach Suggestion inside Dinner if empty */}
                {slot.key === 'dinner' && slotLogs.length === 0 && (
                  <div className="p-4 rounded-2xl bg-[#E8DDFF]/55 border border-[#B69DFF]/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[#482995] text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Coach Suggestion (Pure Veg)
                    </div>
                    <p className="text-xs text-[#21005E] leading-relaxed">
                      &ldquo;Try <strong>Soya Chunk Masala Curry</strong> or{' '}
                      <strong>Grilled Paneer Tikka Salad</strong> to hit your remaining{' '}
                      <strong>{remainingPro}g protein target</strong> without overshooting fats.&rdquo;
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleQuickLogCoachSuggestion}
                        className="px-3.5 py-1.5 rounded-full bg-[#FB923C] text-white text-xs font-semibold cursor-pointer"
                      >
                        Quick Log Recommendation
                      </button>
                      <Link
                        href="/explore"
                        className="px-3.5 py-1.5 rounded-full bg-white text-[#1B1B1E] text-xs font-semibold"
                      >
                        Swap
                      </Link>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setModalSlot(slot.key);
                    setModalMode('manual');
                    setModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#F5F3F6] hover:bg-[#EAE7EB] text-xs font-semibold text-[#1B1B1E] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Dual Quick Triggers (Voice Log & Snap Meal) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => {
            setModalSlot('lunch');
            setModalMode('voice');
            setModalOpen(true);
          }}
          className="py-3.5 px-4 rounded-full bg-white border border-[#E4E0D8] text-[#1B1B1E] text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Mic className="w-4 h-4 text-[#944A00]" /> Voice Log
        </button>
        <Link
          href="/scanner"
          className="py-3.5 px-4 rounded-full bg-[#944A00] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
        >
          <Camera className="w-4 h-4" /> Snap Meal
        </Link>
      </div>

      <FoodLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultMealSlot={modalSlot}
        defaultDate={selectedDate}
        initialMode={modalMode}
        onSaved={loadDiary}
      />
    </div>
  );
}
