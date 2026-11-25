'use client';

import React, { useEffect, useState } from 'react';
import { Check, Info, RefreshCw, Sparkles, User } from 'lucide-react';
import { BmiAdvisorCard } from '@/components/BmiAdvisorCard';
import type { ActivityLevel, GoalType, NutritionTarget, UserProfile } from '@/types/nutrifit';

export default function BodyProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [targets, setTargets] = useState<NutritionTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const loadProfile = async () => {
    const res = await fetch('/api/state', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setProfile(d.profile);
      setTargets(d.nutritionTargets);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (recalcTargets = false) => {
    if (!profile || !targets) return;
    setSaving(true);
    try {
      const res = await fetch('/api/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          nutritionTargets: recalcTargets ? { ...targets, isManualOverride: false } : { ...targets, isManualOverride: true },
          recalculateMetabolism: true,
          recalculateTargets: recalcTargets,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setProfile(d.profile);
        setTargets(d.nutritionTargets);
        setToast(recalcTargets ? 'Profile saved & targets recalculated!' : 'Profile & manual targets saved!');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!profile || !targets) {
    return <div className="h-64 rounded-3xl bg-white animate-pulse max-w-2xl mx-auto" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {toast && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* EVOLT 360 Summary Banner */}
      <section className="tactile-card-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#944A00] flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{profile.name}</h2>
            <p className="text-xs text-[#554337]">
              Pure Vegetarian (No Eggs) • Homemade Indian Food • Goal: {profile.goal.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-[#F5F3F6]">
            <p className="text-[10px] font-bold uppercase text-[#554337]">BMI</p>
            <p className="font-display font-bold text-lg">{profile.bmi}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F5F3F6]">
            <p className="text-[10px] font-bold uppercase text-[#554337]">Body Fat</p>
            <p className="font-display font-bold text-lg">{profile.bodyFatPct}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F5F3F6]">
            <p className="text-[10px] font-bold uppercase text-[#554337]">BMR</p>
            <p className="font-display font-bold text-lg">{profile.bmrKcal} kcal</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#F5F3F6]">
            <p className="text-[10px] font-bold uppercase text-[#554337]">Est. TEE</p>
            <p className="font-display font-bold text-lg">{profile.teeKcal} kcal</p>
          </div>
        </div>

        <p className="text-[11px] text-[#554337] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Baseline from EVOLT 360 BIA scan (Muscle: {profile.skeletalMuscleMassKg} kg, Waist: {profile.waistCm} cm, Visceral Fat: {profile.visceralFatLevel}). Not a medical diagnosis.
        </p>
      </section>

      {/* Dynamic BMI Advisor & Personalized Suggestions */}
      <BmiAdvisorCard
        initialWeightKg={profile.weightKg}
        initialHeightCm={profile.heightCm}
        gender={profile.gender}
        onApplyTargets={() => loadProfile()}
      />

      {/* Editable Profile Details */}
      <section className="tactile-card-white p-6 space-y-4">
        <h3 className="font-display text-lg font-bold">Edit Body &amp; Lifestyle Details</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Name</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Age (yrs)</label>
            <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Height (cm)</label>
            <input type="number" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Weight (kg)</label>
            <input type="number" step="0.1" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Goal</label>
            <select value={profile.goal} onChange={(e) => setProfile({ ...profile, goal: e.target.value as GoalType })} className="tactile-input w-full px-3 py-2 text-xs font-semibold">
              <option value="lean_athletic">Lean Athletic Physique</option>
              <option value="fat_loss">Steady Fat Loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="muscle_gain">Lean Muscle Gain</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Activity Level</label>
            <select value={profile.activityLevel} onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })} className="tactile-input w-full px-3 py-2 text-xs font-semibold">
              <option value="sedentary">Sedentary</option>
              <option value="light">Light (1–2x/wk)</option>
              <option value="moderate">Moderate (3x/wk)</option>
              <option value="gym_4_5_days">Gym 4–5 days/wk</option>
              <option value="athlete">Daily Athlete</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleSaveProfile(true)}
          disabled={saving}
          className="px-5 py-2.5 rounded-full bg-[#1B1B1E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Save Profile &amp; Recalculate Recommended Targets
        </button>
      </section>

      {/* Personalized Nutrition Engine & Manual Target Editor */}
      <section className="tactile-card-white p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FB923C]" /> Daily Nutrition Targets
          </h3>
          <p className="text-xs text-[#554337] mt-0.5">
            Starting estimates tailored to your body &amp; activity — never starvation diets.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFEDD5]/60 text-xs text-[#7C2D12] whitespace-pre-line leading-relaxed">
          {targets.rationale}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Calories (kcal)</label>
            <input type="number" min={1300} value={targets.caloriesKcal} onChange={(e) => setTargets({ ...targets, caloriesKcal: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Protein (g)</label>
            <input type="number" value={targets.proteinG} onChange={(e) => setTargets({ ...targets, proteinG: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Carbs (g)</label>
            <input type="number" value={targets.carbsG} onChange={(e) => setTargets({ ...targets, carbsG: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Fats (g)</label>
            <input type="number" value={targets.fatG} onChange={(e) => setTargets({ ...targets, fatG: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
        </div>

        <button
          onClick={() => handleSaveProfile(false)}
          disabled={saving}
          className="w-full py-3 rounded-full bg-[#FB923C] text-white text-sm font-semibold cursor-pointer"
        >
          Save Manual Targets
        </button>
      </section>
    </div>
  );
}
