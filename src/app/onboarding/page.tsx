'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Leaf,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { UserProfile } from '@/types/nutrifit';
import { calculateBmi, calculateBmr, calculateTee } from '@/lib/nutrition-engine';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanParsing, setScanParsing] = useState(false);
  const [scanSuccess, setScanSuccess] = useState('');
  const [scanFileName, setScanFileName] = useState('');

  useEffect(() => {
    fetch('/api/state', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
  }, []);

  // Handler for uploading EVOLT 360 / InBody / BMI Report
  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setScanParsing(true);
    setScanSuccess('');
    setScanFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');

      // Regex patterns for EVOLT 360 & InBody standard text outputs
      const weightMatch = text.match(/weight[:\s]+(\d+(?:\.\d+)?)\s*kg/i) || text.match(/(\d{2,3}(?:\.\d+)?)\s*kg/i);
      const heightMatch = text.match(/height[:\s]+(\d+(?:\.\d+)?)\s*cm/i) || text.match(/(\d{3}(?:\.\d+)?)\s*cm/i);
      const fatMatch = text.match(/(?:body\s*fat|bfp|fat\s*%|fat\s*percent)[:\s]+(\d+(?:\.\d+)?)\s*%/i) || text.match(/(\d{1,2}(?:\.\d+)?)\s*%\s*(?:fat)/i);
      const muscleMatch = text.match(/(?:skeletal\s*muscle|smm|muscle\s*mass)[:\s]+(\d+(?:\.\d+)?)\s*kg/i);
      const waistMatch = text.match(/waist[:\s]+(\d+(?:\.\d+)?)\s*cm/i);
      const ageMatch = text.match(/age[:\s]+(\d{1,2})/i);

      const updated = { ...profile };
      let foundCount = 0;

      if (weightMatch) {
        updated.weightKg = parseFloat(weightMatch[1]);
        foundCount++;
      }
      if (heightMatch) {
        updated.heightCm = parseFloat(heightMatch[1]);
        foundCount++;
      }
      if (fatMatch) {
        updated.bodyFatPct = parseFloat(fatMatch[1]);
        foundCount++;
      }
      if (muscleMatch) {
        updated.skeletalMuscleMassKg = parseFloat(muscleMatch[1]);
        foundCount++;
      }
      if (waistMatch) {
        updated.waistCm = parseFloat(waistMatch[1]);
        foundCount++;
      }
      if (ageMatch) {
        updated.age = parseInt(ageMatch[1], 10);
        foundCount++;
      }

      // Automatically recalculate BMI, BMR, TEE
      updated.bmi = calculateBmi(updated.weightKg, updated.heightCm);
      updated.bmrKcal = calculateBmr(updated.weightKg, updated.heightCm, updated.age, updated.gender);
      updated.teeKcal = calculateTee(updated.bmrKcal, updated.activityLevel);

      setProfile(updated);
      setScanParsing(false);
      setScanSuccess(
        foundCount > 0
          ? `Auto-filled ${foundCount} stats from report: ${updated.weightKg}kg, ${updated.heightCm}cm, BMI ${updated.bmi}!`
          : `Report attached (${file.name}). Please verify or adjust your measurements in Step 2.`
      );
    };

    reader.onerror = () => {
      setScanParsing(false);
      setScanSuccess(`Report attached (${file.name}). Enter your stats in Step 2.`);
    };

    reader.readAsText(file);
  };

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
        <span className="text-xs font-semibold text-[#554337]">Personalized Health Setup</span>
      </div>

      {step === 1 && (
        <section className="tactile-card-white p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FB923C] text-white flex items-center justify-center shadow-md">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#944A00]">
                Smart Onboarding
              </span>
              <h1 className="font-display text-2xl font-bold">Welcome, {profile.name}!</h1>
            </div>
          </div>

          <p className="text-sm text-[#554337] leading-relaxed">
            NutriFit AI is your personal Indian vegetarian dietitian. You do not need any calorie counting experience.
          </p>

          {/* BMI / EVOLT REPORT SCANNER BOX */}
          <div className="p-5 rounded-2xl bg-[#FFEDD5]/40 border-2 border-dashed border-[#FB923C]/50 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#944A00]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#944A00]">
                Have an EVOLT 360, InBody or BMI Report?
              </h3>
            </div>
            <p className="text-xs text-[#554337] leading-relaxed">
              Upload your scan file (or scan printout text) to auto-fill your weight, height, body fat, and muscle stats automatically.
            </p>

            <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#FB923C] text-[#944A00] text-xs font-bold hover:bg-[#FFEDD5]/60 transition-colors cursor-pointer shadow-xs">
              <Upload className="w-4 h-4" />
              <span>{scanParsing ? 'Scanning Report...' : scanFileName ? `Uploaded: ${scanFileName}` : 'Upload EVOLT 360 / BMI Report'}</span>
              <input
                type="file"
                accept=".txt,.pdf,.csv,.json,image/*"
                onChange={handleReportUpload}
                className="hidden"
              />
            </label>

            {scanSuccess && (
              <div className="p-3 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>{scanSuccess}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F3F6] space-y-1.5 text-xs text-[#554337]">
            <p className="font-bold text-[#1B1B1E]">Current Starting Baseline:</p>
            <p>• Age: {profile.age} yrs • Height: {profile.heightCm} cm • Weight: {profile.weightKg} kg</p>
            <p>• BMI: {profile.bmi || calculateBmi(profile.weightKg, profile.heightCm)} • Body Fat: {profile.bodyFatPct || 25}% • Muscle: {profile.skeletalMuscleMassKg || 28} kg</p>
            <p>• Diet: Pure Vegetarian (No Eggs) • Homemade Indian Food Focus</p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-full bg-[#FB923C] hover:bg-[#f97316] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
          >
            <span>Verify &amp; Adjust Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="tactile-card-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold">Confirm Your Starting Measurements</h2>
          <p className="text-xs text-[#554337]">
            Adjust any value below. Your calorie and macro targets will recalculate automatically.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1">Full Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Age (years)</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                className="tactile-input w-full px-3 py-2 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profile.weightKg}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setProfile({
                    ...profile,
                    weightKg: w,
                    bmi: calculateBmi(w, profile.heightCm),
                  });
                }}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Height (cm)</label>
              <input
                type="number"
                value={profile.heightCm}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setProfile({
                    ...profile,
                    heightCm: h,
                    bmi: calculateBmi(profile.weightKg, h),
                  });
                }}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Body Fat % (Optional)</label>
              <input
                type="number"
                step="0.1"
                value={profile.bodyFatPct || ''}
                placeholder="e.g. 25"
                onChange={(e) => setProfile({ ...profile, bodyFatPct: Number(e.target.value) })}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                value={profile.waistCm || ''}
                placeholder="e.g. 85"
                onChange={(e) => setProfile({ ...profile, waistCm: Number(e.target.value) })}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1">Primary Body Goal</label>
              <select
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value as any })}
                className="tactile-input w-full px-3 py-2 text-sm"
              >
                <option value="lean_athletic">Lean Athletic Physique (Lose Fat + Build Muscle)</option>
                <option value="fat_loss">Fat Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance &amp; Health</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#F5F2EB] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#554337]">Calculated BMI:</span>
            <span className="font-bold text-[#1B1B1E] text-sm">{calculateBmi(profile.weightKg, profile.heightCm)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-full bg-[#F2EFE9] text-xs font-bold cursor-pointer hover:bg-[#E4E0D8] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-full bg-[#FB923C] hover:bg-[#f97316] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>See My Daily Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="tactile-card-white p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#006C4B]">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Your Personalized Targets</span>
          </div>
          <h2 className="font-display text-xl font-bold">Daily Nutrition Targets for {profile.name}</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#FFEDD5]">
              <p className="text-xs font-bold text-[#7C2D12]">Calories Target</p>
              <p className="font-display text-2xl font-bold text-[#944A00]">
                ~{Math.round(calculateTee(calculateBmr(profile.weightKg, profile.heightCm, profile.age, profile.gender), profile.activityLevel) * (profile.goal === 'fat_loss' || profile.goal === 'lean_athletic' ? 0.8 : 1.05))} kcal
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#DCFCE7]">
              <p className="text-xs font-bold text-[#14532D]">Protein Target</p>
              <p className="font-display text-2xl font-bold text-[#006C4B]">
                ~{Math.round(profile.weightKg * (profile.goal === 'muscle_gain' || profile.goal === 'lean_athletic' ? 1.8 : 1.4))} g
              </p>
            </div>
          </div>
          <p className="text-xs text-[#554337] leading-relaxed">
            These are customized for your weight of <strong>{profile.weightKg} kg</strong>, calculated BMI, and pure vegetarian lifestyle.
          </p>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-3.5 rounded-full bg-[#1B1B1E] hover:bg-[#333] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
            <span>{saving ? 'Setting Up...' : 'Enter My Dashboard'}</span>
          </button>
        </section>
      )}
    </div>
  );
}
