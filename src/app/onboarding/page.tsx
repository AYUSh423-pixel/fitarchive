'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Leaf, Sparkles } from 'lucide-react';
import type { UserProfile } from '@/types/nutrifit';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/state', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
  }, []);

  const handleFinish = async () => {
    if (!profile) return;
    setSaving(true);
    await fetch('/api/state', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: { ...profile, onboardingCompleted: true },
        recalculateMetabolism: true,
        recalculateTargets: true,
      }),
    });
    router.push('/');
  };

  if (!profile) return <div className="h-64 rounded-3xl bg-white animate-pulse max-w-xl mx-auto" />;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-bold">
          Step {step} of 3
        </span>
        <span className="text-xs font-semibold text-[#554337]">Beginner-Friendly Setup</span>
      </div>

      {step === 1 && (
        <section className="tactile-card-white p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FB923C] text-white flex items-center justify-center">
            <Leaf className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome to NutriFit AI, {profile.name}!</h1>
          <p className="text-sm text-[#554337] leading-relaxed">
            You don&apos;t need any prior knowledge of calories or macros. Just snap a photo of your homemade Indian
            meal, or tell us what you ate—we&apos;ll guide you step by step toward a{' '}
            <strong className="text-[#1B1B1E]">lean athletic physique</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-[#F5F3F6] space-y-1 text-xs text-[#554337]">
            <p className="font-bold text-[#1B1B1E]">Pre-loaded from your EVOLT 360 Scan:</p>
            <p>• Age: {profile.age} yrs • Height: {profile.heightCm} cm • Weight: {profile.weightKg} kg</p>
            <p>• Body Fat: {profile.bodyFatPct}% • Muscle Mass: {profile.skeletalMuscleMassKg} kg • Waist: {profile.waistCm} cm</p>
            <p>• Diet: Pure Vegetarian (Absolutely No Eggs) • Homemade Indian Food</p>
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-full bg-[#FB923C] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Verify My Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="tactile-card-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold">Confirm Your Starting Measurements</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Your Name</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Weight (kg)</label>
              <input type="number" step="0.1" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Height (cm)</label>
              <input type="number" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Waist (cm)</label>
              <input type="number" step="0.1" value={profile.waistCm} onChange={(e) => setProfile({ ...profile, waistCm: Number(e.target.value) })} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-5 py-3 rounded-full bg-[#F2EFE9] text-xs font-bold cursor-pointer">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-full bg-[#FB923C] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>See My Daily Targets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="tactile-card-white p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#006C4B]">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Personalized Starting Plan</span>
          </div>
          <h2 className="font-display text-xl font-bold">Your Daily Blueprint</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#FFEDD5]">
              <p className="text-xs font-bold text-[#7C2D12]">Daily Calories</p>
              <p className="font-display text-2xl font-bold text-[#944A00]">~1,800 kcal</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#DCFCE7]">
              <p className="text-xs font-bold text-[#14532D]">Daily Protein</p>
              <p className="font-display text-2xl font-bold text-[#006C4B]">~130 g</p>
            </div>
          </div>
          <p className="text-xs text-[#554337] leading-relaxed">
            These are gentle starting estimates—not strict rules. You&apos;ll eat satisfying homemade Indian meals
            (paneer, soya, dal, roti, curd, thepla) and train 4–5x weekly.
          </p>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-3.5 rounded-full bg-[#1B1B1E] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <span>{saving ? 'Starting...' : 'Enter My Dashboard'}</span>
          </button>
        </section>
      )}
    </div>
  );
}
