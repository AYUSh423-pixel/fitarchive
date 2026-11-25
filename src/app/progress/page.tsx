'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Camera, Check, Info, Plus, Scale, Upload } from 'lucide-react';
import type { BodyMeasurement, BodyScan, ProgressPhoto, UserProfile } from '@/types/nutrifit';

interface ProgressResponse {
  profile: UserProfile;
  bodyScans: BodyScan[];
  measurements: BodyMeasurement[];
  progressPhotos: ProgressPhoto[];
  weeklyEvaluation: {
    status: string;
    thisWeekAvgKg: number | null;
    lastWeekAvgKg: number | null;
    weeklyDeltaKg: number | null;
    recommendation: string;
    suggestedCalories: number;
  };
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [weightKg, setWeightKg] = useState(76.4);
  const [waistCm, setWaistCm] = useState(96.7);
  const [bodyFatPct, setBodyFatPct] = useState(29.7);
  const [smmKg, setSmmKg] = useState(29.6);
  const [scanMode, setScanMode] = useState(false);
  const [toast, setToast] = useState('');

  const loadProgress = async () => {
    const res = await fetch('/api/progress', { cache: 'no-store' });
    if (res.ok) {
      const d: ProgressResponse = await res.json();
      setData(d);
      setWeightKg(d.profile.weightKg);
      setWaistCm(d.profile.waistCm);
      setBodyFatPct(d.profile.bodyFatPct);
      setSmmKg(d.profile.skeletalMuscleMassKg);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleLogEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: scanMode ? 'body_scan' : 'measurement',
        weightKg,
        waistCm,
        bodyFatPct: scanMode ? bodyFatPct : undefined,
        skeletalMuscleMassKg: scanMode ? smmKg : undefined,
        deviceName: scanMode ? 'EVOLT 360' : undefined,
      }),
    });
    if (res.ok) {
      setToast(scanMode ? 'New EVOLT 360 / BIA body scan saved!' : 'Weight & waist logged!');
      loadProgress();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = String(reader.result || '').split(',')[1] || '';
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'progress_photo', imageBase64: b64, pose: 'front' }),
      });
      if (res.ok) {
        setToast('Private progress photo saved securely!');
        loadProgress();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!data) {
    return <div className="h-64 rounded-3xl bg-white animate-pulse max-w-3xl mx-auto" />;
  }

  const chartData = [...data.measurements]
    .reverse()
    .map((m) => ({
      date: m.measuredDate.slice(5),
      weight: m.weightKg,
      waist: m.waistCm ?? null,
    }));

  const day1 = data.measurements[data.measurements.length - 1];
  const latest = data.measurements[0];
  const milestones = [1, 7, 15, 30, 60, 90];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Non-medical Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-[#E0F2FE] text-[#0C4A6E] text-xs flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Informational Estimate Only:</strong> EVOLT 360 &amp; BIA body composition scans estimate fat and
          muscle trends and are <strong>not medical diagnoses</strong>. Never judge progress by a single day&apos;s scale weight.
        </span>
      </div>

      {/* Key Composition Metrics */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337]">Current Weight</p>
          <p className="font-display text-2xl font-bold mt-1">{data.profile.weightKg} kg</p>
          <p className="text-[11px] text-[#944A00]">BMI {data.profile.bmi}</p>
        </div>
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337]">Waist</p>
          <p className="font-display text-2xl font-bold mt-1">{data.profile.waistCm} cm</p>
          <p className="text-[11px] text-[#006C4B]">Target: &lt; 86 cm</p>
        </div>
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337]">Body Fat %</p>
          <p className="font-display text-2xl font-bold mt-1">{data.profile.bodyFatPct}%</p>
          <p className="text-[11px] text-[#554337]">Visceral: {data.profile.visceralFatLevel}</p>
        </div>
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337]">Muscle Mass</p>
          <p className="font-display text-2xl font-bold mt-1">{data.profile.skeletalMuscleMassKg} kg</p>
          <p className="text-[11px] text-[#006C4B]">Preserve &amp; Build</p>
        </div>
      </section>

      {/* Weekly Average Evaluation */}
      <section className="tactile-card p-5 space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#944A00] flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> Weekly Average Check
        </p>
        <p className="text-sm font-medium text-[#1B1B1E]">{data.weeklyEvaluation.recommendation}</p>
      </section>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Charts */}
      <section className="tactile-card-white p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">Weight &amp; Waist Over Time</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#FB923C" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="waist" name="Waist (cm)" stroke="#006C4B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Log Weight / Waist / Body Scan */}
      <form onSubmit={handleLogEntry} className="tactile-card-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#944A00]" /> Log Measurement or Body Scan
          </h3>
          <button
            type="button"
            onClick={() => setScanMode((v) => !v)}
            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
              scanMode ? 'bg-[#674BB5] text-white' : 'bg-[#F2EFE9] text-[#554337]'
            }`}
          >
            {scanMode ? 'EVOLT 360 Scan Mode' : 'Quick Weight/Waist'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1">Weight (kg)</label>
            <input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Waist (cm)</label>
            <input type="number" step="0.1" value={waistCm} onChange={(e) => setWaistCm(Number(e.target.value))} className="tactile-input w-full px-3 py-2 text-sm" />
          </div>
          {scanMode && (
            <>
              <div>
                <label className="text-xs font-semibold block mb-1">Body Fat (%)</label>
                <input type="number" step="0.1" value={bodyFatPct} onChange={(e) => setBodyFatPct(Number(e.target.value))} className="tactile-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Muscle (kg)</label>
                <input type="number" step="0.1" value={smmKg} onChange={(e) => setSmmKg(Number(e.target.value))} className="tactile-input w-full px-3 py-2 text-sm" />
              </div>
            </>
          )}
        </div>

        <button type="submit" className="px-6 py-2.5 rounded-full bg-[#FB923C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4" /> Save Entry
        </button>
      </form>

      {/* Day 1, 7, 15, 30, 60, 90 Comparisons */}
      <section className="tactile-card-white p-5 space-y-3">
        <h3 className="font-display font-bold text-base">Transformation Milestones (Day 1 → Day 90)</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {milestones.map((dayNum) => {
            const reached = data.measurements.length >= dayNum || dayNum === 1;
            const ref = dayNum === 1 ? day1 : latest;
            return (
              <div
                key={dayNum}
                className={`p-3 rounded-2xl text-center ${
                  reached ? 'bg-[#DCFCE7]/70 text-[#14532D]' : 'bg-[#F5F3F6] text-[#71717A]'
                }`}
              >
                <p className="text-[10px] font-bold uppercase">Day {dayNum}</p>
                <p className="font-display font-bold text-sm mt-1">
                  {reached && ref ? `${ref.weightKg}kg` : '—'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Private Progress Photos */}
      <section className="tactile-card-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base">Private Progress Photos</h3>
            <p className="text-xs text-[#554337]">Stored privately — never publicly exposed</p>
          </div>
          <label className="px-4 py-2 rounded-full bg-[#1B1B1E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
            <Camera className="w-3.5 h-3.5" /> Upload Photo
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        {data.progressPhotos.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#F5F3F6] text-center text-xs text-[#554337]">
            No progress photos uploaded yet. Take a Day 1 front/side photo in consistent lighting!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.progressPhotos.map((p) => (
              <div key={p.id} className="rounded-2xl overflow-hidden bg-[#F5F3F6] border border-[#E4E0D8]">
                <img src={p.url} alt={`Progress ${p.photoDate}`} className="w-full h-36 object-cover" />
                <p className="p-2 text-[11px] font-semibold text-center text-[#554337]">{p.photoDate}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
