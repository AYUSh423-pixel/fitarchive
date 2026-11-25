'use client';

import React, { useEffect, useState } from 'react';
import { Check, Droplets, Footprints, Moon, Plus, Sparkles } from 'lucide-react';
import type { HabitLog } from '@/types/nutrifit';

export default function HabitsPage() {
  const [waterMl, setWaterMl] = useState(0);
  const [waterTargetMl, setWaterTargetMl] = useState(3000);
  const [habit, setHabit] = useState<HabitLog | null>(null);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [steps, setSteps] = useState(6500);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [toast, setToast] = useState('');

  const loadHabits = async () => {
    const res = await fetch('/api/habits', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setWaterMl(d.totalWaterMl || 0);
      setWaterTargetMl(d.waterTargetMl || 3000);
      setHabit(d.habit);
      if (d.habit) {
        setSleepHours(d.habit.sleepHours ?? 7.5);
        setSteps(d.habit.steps ?? 0);
        setWorkoutCompleted(Boolean(d.habit.workoutCompleted));
      }
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const addWater = async (amountMl: number) => {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'water', amountMl }),
    });
    loadHabits();
  };

  const saveHabits = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sleepHours, steps, workoutCompleted }),
    });
    if (res.ok) {
      setToast('Daily habits & consistency score updated! Keep going at your own pace.');
      loadHabits();
    }
  };

  const waterPct = Math.min(100, Math.round((waterMl / Math.max(1, waterTargetMl)) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Water Intake Card */}
      <section className="tactile-card-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Water Intake</h2>
              <p className="text-xs text-[#554337]">
                {(waterMl / 1000).toFixed(2)}L / {(waterTargetMl / 1000).toFixed(1)}L ({waterPct}%)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] text-xs font-bold">
            {waterMl} ml
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-[#F0EDF1] overflow-hidden">
          <div className="h-full bg-[#38BDF8] rounded-full transition-all" style={{ width: `${waterPct}%` }} />
        </div>

        <div className="flex flex-wrap gap-2">
          {[250, 500, 750].map((amt) => (
            <button
              key={amt}
              onClick={() => addWater(amt)}
              className="px-4 py-2 rounded-full bg-[#E0F2FE] hover:bg-[#bae6fd] text-[#0369A1] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {amt} ml
            </button>
          ))}
        </div>
      </section>

      {/* Consistency Score */}
      <section className="rounded-3xl p-5 bg-[#DCFCE7]/70 border border-[#34D399]/40 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#14532D] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Daily Consistency Score
          </p>
          <p className="text-xs text-[#14532D]/85 mt-1">
            Progress comes from showing up most days—never perfection. Missed days never reset your journey.
          </p>
        </div>
        <div className="w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center shrink-0 shadow-xs">
          <span className="font-display text-xl font-bold text-[#006C4B]">
            {habit?.consistencyScore ?? 0}
          </span>
          <span className="text-[10px] font-bold text-[#554337]">/ 100</span>
        </div>
      </section>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Daily Habits Form */}
      <form onSubmit={saveHabits} className="tactile-card-white p-6 space-y-4">
        <h3 className="font-display text-lg font-bold">Log Sleep, Steps &amp; Check-in</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#554337] flex items-center gap-1.5 mb-1">
              <Moon className="w-3.5 h-3.5 text-[#674BB5]" /> Sleep Duration (hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="3"
              max="14"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="tactile-input w-full px-4 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#554337] flex items-center gap-1.5 mb-1">
              <Footprints className="w-3.5 h-3.5 text-[#944A00]" /> Daily Steps (manual entry)
            </label>
            <input
              type="number"
              step="500"
              min="0"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="tactile-input w-full px-4 py-2.5 text-sm font-semibold"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F5F3F6] cursor-pointer">
          <input
            type="checkbox"
            checked={workoutCompleted}
            onChange={(e) => setWorkoutCompleted(e.target.checked)}
            className="w-4 h-4 accent-[#006C4B]"
          />
          <span className="text-sm font-semibold text-[#1B1B1E]">
            Completed today&apos;s gym workout or active recovery walk
          </span>
        </label>

        <button
          type="submit"
          className="w-full py-3 rounded-full bg-[#FB923C] text-white font-semibold text-sm cursor-pointer"
        >
          Save Daily Habits
        </button>
      </form>
    </div>
  );
}
