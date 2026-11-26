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

  // Handler for uploading EVOLT 360 / InBody / BMI Report (PDF or Photo)
  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setScanParsing(true);
    setScanSuccess('');
    setScanFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || '');
        const fileBase64 = dataUrl.split(',')[1] || '';

        try {
          const res = await fetch('/api/assessment/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64,
              fileName: file.name,
              mimeType: file.type || 'application/pdf',
              currentHeightCm: profile.heightCm,
              currentWeightKg: profile.weightKg,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Extraction failed');

          const ext = data.extraction;
          const meas = ext?.measurements || {};
          const updated = { ...profile };
          let foundCount = 0;

          if (meas.weightKg && meas.weightKg > 0) {
            updated.weightKg = meas.weightKg;
            foundCount++;
          }
          if (meas.heightCm && meas.heightCm > 0) {
            updated.heightCm = meas.heightCm;
            foundCount++;
          }
          if (meas.bodyFatPct && meas.bodyFatPct > 0) {
            updated.bodyFatPct = meas.bodyFatPct;
            foundCount++;
          }
          if (meas.skeletalMuscleMassKg && meas.skeletalMuscleMassKg > 0) {
            updated.skeletalMuscleMassKg = meas.skeletalMuscleMassKg;
            foundCount++;
          }
          if (meas.waistCm && meas.waistCm > 0) {
            updated.waistCm = meas.waistCm;
            foundCount++;
          }

          // Recalculate BMI, BMR, TEE
          updated.bmi = calculateBmi(updated.weightKg, updated.heightCm);
          updated.bmrKcal = calculateBmr(updated.weightKg, updated.heightCm, updated.age, updated.gender);
          updated.teeKcal = calculateTee(updated.bmrKcal, updated.activityLevel);

          setProfile(updated);
          setScanParsing(false);

          const docName = ext.documentType === 'evolt_360' ? 'EVOLT 360' : ext.documentType === 'inbody' ? 'InBody' : 'Health Report';
          const matchMsg = ext.validation?.bmiMatchesReport
            ? `(Calculated BMI: ${updated.bmi} ✅ Verified Match)`
            : ext.validation?.discrepancyNote
            ? `(${ext.validation.discrepancyNote})`
            : '';

          setScanSuccess(
            foundCount > 0
              ? `Auto-filled ${foundCount} stats from ${docName}: ${updated.weightKg}kg, ${updated.heightCm}cm, BMI ${updated.bmi} ${matchMsg}`
              : `Report attached (${file.name}). Please verify or adjust your measurements in Step 2.`
          );
        } catch (fetchErr) {
          setScanParsing(false);
          setScanSuccess(`Uploaded ${file.name}. Please confirm your stats in Step 2.`);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setScanParsing(false);
      setScanSuccess(`Uploaded ${file.name}. Please enter your stats in Step 2.`);
    }
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
        <span className="px-3 py-1 rounded-full bg-[#f5f2e0] text-[#713600] text-xs font-bold">
          Step {step} of 3
        </span>
        <span className="text-xs font-semibold text-[#a08a6a]">Personalized Health Setup</span>
      </div>

      {step === 1 && (
        <section className="tactile-card-white p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#713600] text-white flex items-center justify-center shadow-md">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c05800]">
                Smart Onboarding
              </span>
              <h1 className="font-display text-2xl font-bold text-[#38240d]">Welcome, {profile.name}!</h1>
            </div>
          </div>

          <p className="text-sm text-[#713600] leading-relaxed">
            NutriFit AI is your personal Indian vegetarian dietitian. You do not need any calorie counting experience.
          </p>

          {/* BMI / EVOLT REPORT SCANNER BOX */}
          <div className="p-5 rounded-2xl bg-[#fff3e0] border-2 border-dashed border-[#c05800]/50 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#c05800]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#c05800]">
                Have an EVOLT 360, InBody or BMI Report?
              </h3>
            </div>
            <p className="text-xs text-[#713600] leading-relaxed">
              Upload your scan file (or scan printout text) to auto-fill your weight, height, body fat, and muscle stats automatically.
            </p>

            <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#c05800] text-[#c05800] text-xs font-bold hover:bg-[#fff3e0] transition-colors cursor-pointer shadow-xs">
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
              <div className="p-3 rounded-xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#c05800]" />
                <span>{scanSuccess}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f2e0] space-y-1.5 text-xs text-[#713600]">
            <p className="font-bold text-[#38240d]">Current Starting Baseline:</p>
            <p>• Age: {profile.age} yrs • Height: {profile.heightCm} cm • Weight: {profile.weightKg} kg</p>
            <p>• BMI: {profile.bmi || calculateBmi(profile.weightKg, profile.heightCm)} • Body Fat: {profile.bodyFatPct || 25}% • Muscle: {profile.skeletalMuscleMassKg || 28} kg</p>
            <p>• Diet: Pure Vegetarian (No Eggs) • Homemade Indian Food Focus</p>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-full bg-[#c05800] hover:bg-[#a04800] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
          >
            <span>Verify & Adjust Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="tactile-card-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-[#38240d]">Confirm Your Starting Measurements</h2>
          <p className="text-xs text-[#a08a6a]">
            Adjust any value below. Your calorie and macro targets will recalculate automatically.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Full Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Age (years)</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Gender</label>
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
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Weight (kg)</label>
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
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Height (cm)</label>
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
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Body Fat % (Optional)</label>
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
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Waist (cm)</label>
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
              <label className="text-xs font-semibold block mb-1 text-[#713600]">Primary Body Goal</label>
              <select
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value as any })}
                className="tactile-input w-full px-3 py-2 text-sm"
              >
                <option value="lean_athletic">Lean Athletic Physique (Lose Fat + Build Muscle)</option>
                <option value="fat_loss">Fat Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance & Health</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#f5f2e0] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#713600]">Calculated BMI:</span>
            <span className="font-bold text-[#38240d] text-sm">{calculateBmi(profile.weightKg, profile.heightCm)}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-full bg-[#f0ece0] text-xs font-bold text-[#713600] cursor-pointer hover:bg-[#e8e4d0] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3 rounded-full bg-[#c05800] hover:bg-[#a04800] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span>See My Daily Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="tactile-card-white p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#c05800]">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Your Personalized Targets</span>
          </div>
          <h2 className="font-display text-xl font-bold text-[#38240d]">Daily Nutrition Targets for {profile.name}</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-[#fff3e0]">
              <p className="text-xs font-bold text-[#c05800]">Calories Target</p>
              <p className="font-display text-2xl font-bold text-[#38240d]">
                ~{Math.round(calculateTee(calculateBmr(profile.weightKg, profile.heightCm, profile.age, profile.gender), profile.activityLevel) * (profile.goal === 'fat_loss' || profile.goal === 'lean_athletic' ? 0.8 : 1.05))} kcal
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#f5f2e0]">
              <p className="text-xs font-bold text-[#713600]">Protein Target</p>
              <p className="font-display text-2xl font-bold text-[#38240d]">
                ~{Math.round(profile.weightKg * (profile.goal === 'muscle_gain' || profile.goal === 'lean_athletic' ? 1.8 : 1.4))} g
              </p>
            </div>
          </div>
          <p className="text-xs text-[#a08a6a] leading-relaxed">
            These are customized for your weight of <strong className="text-[#38240d]">{profile.weightKg} kg</strong>, calculated BMI, and pure vegetarian lifestyle.
          </p>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-3.5 rounded-full bg-[#38240d] hover:bg-[#4a2f10] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Setting Up...' : 'Enter My Dashboard'}</span>
          </button>
        </section>
      )}
    </div>
  );
}