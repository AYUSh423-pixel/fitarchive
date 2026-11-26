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
import {
  Activity,
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Info,
  Plus,
  Scale,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { BodyMeasurement, BodyScan, ProgressPhoto, UserProfile } from '@/types/nutrifit';
import { calculateBmi } from '@/lib/nutrition-engine';

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
  const [loading, setLoading] = useState(true);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    const res = await fetch('/api/progress', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setData(d);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
        <div className="h-10 w-48 rounded-2xl bg-white/60" />
        <div className="h-48 rounded-[20px] bg-white/80" />
        <div className="h-48 rounded-[20px] bg-white/80" />
      </div>
    );
  }

  const { profile, bodyScans, measurements, progressPhotos, weeklyEvaluation } = data;
  const latestScan = bodyScans[0];
  const latestMeasurement = measurements[0];

  // Weight trend chart data
  const weightChartData = bodyScans
    .slice()
    .reverse()
    .map((s) => ({ date: s.scanDate, weight: s.weightKg }));

  const bmi = latestScan ? calculateBmi(latestScan.weightKg, profile.heightCm) : null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#a08a6a]">
            BODY TRANSFORMATION
          </p>
          <h2 className="font-display text-[26px] font-bold text-[#38240d] tracking-tight leading-tight">
            Progress
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a08a6a] shadow-sm border border-[#e8e4d0]"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* EVOLT Baseline Card */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#713600] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#713600]">EVOLT 360 BASELINE</p>
            <p className="font-bold text-[#38240d]">Lean-Athletic Plan</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#f5f2e0]">
            <p className="text-2xl font-bold text-[#713600]">{profile.weightKg} kg</p>
            <p className="text-[10px] text-[#a08a6a]">Start Weight</p>
          </div>
          <div className="p-3 rounded-xl bg-[#fff3e0]">
            <p className="text-2xl font-bold text-[#c05800]">{bmi?.toFixed(1) || '--'}</p>
            <p className="text-[10px] text-[#a08a6a]">BMI</p>
          </div>
          <div className="p-3 rounded-xl bg-[#efebe9]">
            <p className="text-2xl font-bold text-[#5d4037]">Target kg</p>
            <p className="text-[10px] text-[#a08a6a]">Target Weight</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#713600]">
            {profile.bodyFatPct ? `Body Fat: ${profile.bodyFatPct}%` : 'Body Fat: Not set'} •
            {profile.skeletalMuscleMassKg ? `Muscle: ${profile.skeletalMuscleMassKg} kg` : 'Muscle: Not set'}
          </p>
        </div>
      </div>

      {/* Latest Scan / Weekly Evaluation */}
      {latestScan && (
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
          <h3 className="font-display font-bold text-base mb-3">Latest Body Scan</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#f5f2e0] text-center">
              <p className="text-2xl font-bold text-[#713600]">{latestScan.weightKg} kg</p>
              <p className="text-[10px] text-[#a08a6a]">Weight</p>
            </div>
            <div className="p-3 rounded-xl bg-[#fff3e0] text-center">
              <p className="text-2xl font-bold text-[#c05800">{latestScan.bodyFatPct}%</p>
              <p className="text-[10px] text-[#a08a6a]">Body Fat</p>
            </div>
            <div className="p-3 rounded-xl bg-[#efebe9] text-center">
              <p className="text-2xl font-bold text-[#5d4037">{latestScan.skeletalMuscleMassKg} kg</p>
              <p className="text-[10px] text-[#a08a6a]">Muscle Mass</p>
            </div>
          </div>
          <p className="text-xs text-[#a08a6a] mt-3">Scanned: {latestScan.scanDate}</p>
        </div>
      )}

      {/* Weekly Evaluation */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
        <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#c05800]" /> Weekly Evaluation
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#713600]">This week avg</span>
            <span className="font-semibold text-[#38240d]">
              {weeklyEvaluation.thisWeekAvgKg !== null
                ? `${weeklyEvaluation.thisWeekAvgKg.toFixed(1)} kg`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#713600]">Last week avg</span>
            <span className="font-semibold text-[#38240d]">
              {weeklyEvaluation.lastWeekAvgKg !== null
                ? `${weeklyEvaluation.lastWeekAvgKg.toFixed(1)} kg`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#713600]">Weekly change</span>
            <span
              className={`font-semibold ${
                weeklyEvaluation.weeklyDeltaKg !== null && weeklyEvaluation.weeklyDeltaKg < 0
                  ? 'text-[#c05800]'
                  : 'text-[#5d4037]'
              }`}
            >
              {weeklyEvaluation.weeklyDeltaKg !== null
                ? `${weeklyEvaluation.weeklyDeltaKg > 0 ? '+' : ''}${weeklyEvaluation.weeklyDeltaKg.toFixed(1)} kg`
                : '—'}
            </span>
          </div>
          <div className="pt-2 border-t border-[#f0ece0]">
            <p className="text-xs text-[#713600] font-medium">{weeklyEvaluation.status}</p>
            <p className="text-xs text-[#a08a6a] mt-1">{weeklyEvaluation.recommendation}</p>
            <p className="text-xs text-[#a08a6a] mt-1">
              Suggested calories: {weeklyEvaluation.suggestedCalories} kcal
            </p>
          </div>
        </div>
      </div>

      {/* Weight Trend Chart */}
      {bodyScans.length > 1 && (
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
          <h3 className="font-display font-bold text-base mb-3">Weight Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#a08a6a' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#a08a6a' }}
                  tickFormatter={(v) => `${v} kg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#38240d',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${Number(value).toFixed(1)} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#c05800"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#c05800', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 6, fill: '#c05800', strokeWidth: 2, stroke: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Measurements */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#c05800]" /> Body Measurements
          </h3>
          <button
            onClick={() => setMeasurementModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#c05800] text-white text-xs font-semibold cursor-pointer"
          >
            + Add Measurement
          </button>
        </div>
        {measurements.length === 0 ? (
          <p className="text-xs text-[#a08a6a]">No measurements yet. Tap + Add Measurement to start tracking.</p>
        ) : (
          <div className="space-y-2">
            {measurements.slice(0, 3).map((m) => (
              <div key={m.id} className="p-3 rounded-xl bg-[#f5f2e0] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-[#38240d]">{m.waistCm ? 'Waist' : m.chestCm ? 'Chest' : m.armCm ? 'Arm' : m.thighCm ? 'Thigh' : 'Measurement'}</p>
                  <p className="text-xs text-[#a08a6a]">{m.measuredDate}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-[#713600] text-xs font-bold">
                  {m.waistCm || m.chestCm || m.armCm || m.thighCm || 0} cm
                </span>
              </div>
            ))}
            {measurements.length > 3 && (
              <p className="text-xs text-[#a08a6a] text-center mt-2">
                +{measurements.length - 3} more measurements
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress Photos */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#c05800]" /> Progress Photos
          </h3>
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#c05800] text-white text-xs font-semibold cursor-pointer"
          >
            + Add Photo
          </button>
        </div>
        {progressPhotos.length === 0 ? (
          <p className="text-xs text-[#a08a6a]">No progress photos yet. Tap + Add Photo to start your visual journey.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {progressPhotos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="aspect-square rounded-xl overflow-hidden relative">
                <img src={photo.url} alt={`Progress ${photo.photoDate}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-xs text-white font-semibold">{photo.photoDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log New Body Scan */}
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#e8e4d0]">
        <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#c05800]" /> Log New EVOLT Scan
        </h3>
        <button
          onClick={() => setScanModalOpen(true)}
          className="w-full py-3 rounded-full bg-[#c05800] text-white font-semibold text-sm cursor-pointer"
        >
          Log Body Scan
        </button>
      </div>
    </div>
  );
}