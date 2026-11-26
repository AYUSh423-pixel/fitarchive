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
        <div className="p-3 rounded-2xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* EVOLT 360 Summary Banner */}
      <section className="tactile-card-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#fff3e0] text-[#c05800] flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#38240d]">{profile.name}</h2>
            <p className="text-xs text-[#a08a6a]">
              Pure Vegetarian (No Eggs) • Homemade Indian Food • Goal: {profile.goal.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-[#f5f2e0]">
            <p className="text-[10px] font-bold uppercase text-[#713600]">BMI</p>
            <p className="font-display font-bold text-lg text-[#38240d]">{profile.bmi}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#fff3e0]">
            <p className="text-[10px] font-bold uppercase text-[#c05800]">Body Fat</p>
            <p className="font-display font-bold text-lg text-[#38240d]">{profile.bodyFatPct}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#efebe9]">
            <p className="text-[10px] font-bold uppercase text-[#5d4037]">BMR</p>
            <p className="font-display font-bold text-lg text-[#38240d]">{profile.bmrKcal} kcal</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#f5f2e0]">
            <p className="text-[10px] font-bold uppercase text-[#713600]">Est. TEE</p>
            <p className="font-display font-bold text-lg text-[#38240d]">{profile.teeKcal} kcal</p>
          </div>
        </div>

        <p className="text-[11px] text-[#a08a6a] flex items-center gap-1.5">
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
        <h3 className="font-display text-lg font-bold">Edit Body & Lifestyle Details</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Name</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Age (yrs)</label>
            <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Height (cm)</label>
            <input type="number" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Weight (kg)</label>
            <input type="number" step="0.1" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Goal</label>
            <select value={profile.goal} onChange={(e) => setProfile({ ...profile, goal: e.target.value as GoalType })} className="tactile-input w-full px-3 py-2 text-xs font-semibold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Activity Level</label>
            <select value={profile.activityLevel} onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })} className="tactile-input w-full px-3 py-2 text-xs font-semibold" />
          </div>
        </div>

        <button
          onClick={() => handleSaveProfile(true)}
          disabled={saving}
          className="px-5 py-2.5 rounded-full bg-[#38240d] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Save Profile & Recalculate Recommended Targets
        </button>
      </section>

      {/* Personalized Nutrition Engine & Manual Target Editor */}
      <section className="tactile-card-white p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c05800]" /> Daily Nutrition Targets
          </h3>
          <p className="text-xs text-[#a08a6a] mt-0.5">
            Starting estimates tailored to your body & activity — never starvation diets.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#fff3e0] text-xs text-[#a04800] whitespace-pre-line leading-relaxed">
          {targets.rationale}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Calories (kcal)</label>
            <input type="number" min={1300} value={targets.caloriesKcal} onChange={(e) => setTargets({ ...targets, caloriesKcal: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#713600]">Protein (g)</label>
            <input type="number" value={targets.proteinG} onChange={(e) => setTargets({ ...targets, proteinG: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#c05800]">Carbs (g)</label>
            <input type="number" value={targets.carbsG} onChange={(e) => setTargets({ ...targets, carbsG: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1 text-[#5d4037]">Fats (g)</label>
            <input type="number" value={targets.fatG} onChange={(e) => setTargets({ ...targets, fatG: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm font-bold" />
          </div>
        </div>

        <button
          onClick={() => handleSaveProfile(false)}
          disabled={saving}
          className="w-full py-3 rounded-full bg-[#c05800] text-white text-sm font-semibold cursor-pointer"
        >
          Save Manual Targets
        </button>
      </section>
    </div>
  );
}