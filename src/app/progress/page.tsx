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
  const [weightKg, setWeightKg] = useState(76.4);
  const [waistCm, setWaistCm] = useState(96.7);
  const [bodyFatPct, setBodyFatPct] = useState(29.7);
  const [smmKg, setSmmKg] = useState(29.6);
  const [scanMode, setScanMode] = useState(false);
  const [toast, setToast] = useState('');

  // Assessment Upload & Review State
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [auditModalScan, setAuditModalScan] = useState<BodyScan | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'charts' | 'photos'>('overview');

  const tabsRef = React.useRef<HTMLElementTagNameMap['sakuga-tabs'] | null>(null);
  const confirmBtnRef = React.useRef<HTMLElementTagNameMap['sakuga-button'] | null>(null);

  // Review Form Fields
  const [editWeight, setEditWeight] = useState(76.4);
  const [editHeight, setEditHeight] = useState(164.0);
  const [editReportedBmi, setEditReportedBmi] = useState<number | undefined>(28.4);
  const [editBodyFat, setEditBodyFat] = useState(29.7);
  const [editSmm, setEditSmm] = useState(29.6);
  const [editWaist, setEditWaist] = useState(96.7);
  const [editDevice, setEditDevice] = useState('EVOLT 360');
  const [editFileType, setEditFileType] = useState('pdf_report');
  const [editDiscrepancyNote, setEditDiscrepancyNote] = useState('');
  const [rawExtractionSnippet, setRawExtractionSnippet] = useState<any>(null);
  const [reportFileBase64, setReportFileBase64] = useState<string | undefined>(undefined);
  const [reportMime, setReportMime] = useState('application/pdf');

  const loadProgress = async () => {
    const res = await fetch('/api/progress', { cache: 'no-store' });
    if (res.ok) {
      const d: ProgressResponse = await res.json();
      setData(d);
      setWeightKg(d.profile.weightKg);
      setWaistCm(d.profile.waistCm);
      setBodyFatPct(d.profile.bodyFatPct);
      setSmmKg(d.profile.skeletalMuscleMassKg);
      setEditHeight(d.profile.heightCm || 164.0);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const handleChange = (e: any) => {
      const val = e.detail?.value || 'overview';
      setActiveSection(val as any);
    };
    el.addEventListener('change', handleChange);
    return () => el.removeEventListener('change', handleChange);
  }, [data]);

  // Compute live BMI from currently edited values
  const currentCalculatedBmi = editHeight > 0 && editWeight > 0 ? calculateBmi(editWeight, editHeight) : 0;
  const bmiDiscrepancy =
    editReportedBmi && currentCalculatedBmi > 0
      ? Math.abs(editReportedBmi - currentCalculatedBmi)
      : 0;

  // Handler for uploading EVOLT 360 / InBody / BMI Report PDF or Photo
  const handleReportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingReport(true);
    setToast('');

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      const b64 = dataUrl.split(',')[1] || '';
      const mime = file.type || 'application/pdf';

      setReportFileBase64(b64);
      setReportMime(mime);

      try {
        const res = await fetch('/api/assessment/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: b64,
            fileName: file.name,
            mimeType: mime,
            currentHeightCm: data.profile.heightCm,
            currentWeightKg: data.profile.weightKg,
          }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData?.error || 'Extraction failed');

        const ext = resData.extraction;
        const meas = ext?.measurements || {};

        setEditWeight(meas.weightKg || data.profile.weightKg);
        setEditHeight(meas.heightCm || data.profile.heightCm);
        setEditReportedBmi(meas.reportedBmi);
        setEditBodyFat(meas.bodyFatPct ?? data.profile.bodyFatPct);
        setEditSmm(meas.skeletalMuscleMassKg ?? data.profile.skeletalMuscleMassKg);
        setEditWaist(meas.waistCm ?? data.profile.waistCm);
        setEditDevice(
          ext.documentType === 'evolt_360'
            ? 'EVOLT 360'
            : ext.documentType === 'inbody'
            ? 'InBody'
            : ext.fileType === 'photo_human'
            ? 'Photo Assessment'
            : 'Health Assessment Report'
        );
        setEditFileType(ext.fileType || 'pdf_report');
        setEditDiscrepancyNote(ext.validation?.discrepancyNote || '');
        setRawExtractionSnippet(resData);
        setReviewModalOpen(true);
      } catch (err) {
        setToast(`Extraction note: ${(err as Error).message}. You can enter values manually.`);
        setReviewModalOpen(true);
      } finally {
        setUploadingReport(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Confirm and persist the reviewed assessment
  const handleConfirmAssessment = async () => {
    if (!data) return;
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'body_scan',
          weightKg: editWeight,
          heightCm: editHeight,
          reportedBmi: editReportedBmi,
          calculatedBmi: currentCalculatedBmi,
          bmi: editReportedBmi || currentCalculatedBmi,
          bodyFatPct: editBodyFat,
          skeletalMuscleMassKg: editSmm,
          waistCm: editWaist,
          deviceName: editDevice,
          fileType: editFileType,
          reportBase64: reportFileBase64,
          reportMime,
          validationStatus: bmiDiscrepancy > 0.3 ? 'discrepancy_reviewed' : 'verified_accurate',
          rawExtractedJson: rawExtractionSnippet,
          notes: editDiscrepancyNote
            ? `Verified with note: ${editDiscrepancyNote}`
            : `Verified ${editDevice} Assessment (Formula: wt/ht² = ${currentCalculatedBmi}).`,
        }),
      });

      if (res.ok) {
        setToast(`✅ Body assessment saved! Profile updated to ${editWeight}kg & BMI ${currentCalculatedBmi}.`);
        confirmBtnRef.current?.done();
        setTimeout(() => {
          setReviewModalOpen(false);
          loadProgress();
        }, 800);
      } else {
        const err = await res.json();
        setToast(`Error: ${err?.error || 'Failed to save'}`);
      }
    } catch (e) {
      setToast(`Save error: ${(e as Error).message}`);
    }
  };

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
          muscle trends and are <strong>not medical diagnoses</strong>. Standard scientific BMI is calculated as{' '}
          <code>weight (kg) ÷ height (m)²</code>.
        </span>
      </div>

      {/* Sakuga Anime Tabs for Section Navigation */}
      <div className="flex justify-center sm:justify-start">
        <sakuga-tabs ref={tabsRef} label="Progress Sections">
          <option value="overview">Overview</option>
          <option value="history">BMI Reports</option>
          <option value="charts">Weight Chart</option>
          <option value="photos">Photos</option>
        </sakuga-tabs>
      </div>

      {/* AI Assessment Upload Banner & Reports History */}
      {(activeSection === 'overview' || activeSection === 'history') && (
        <>
          <section className="tactile-card p-5 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5]/60 border-2 border-[#FB923C]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-[#FB923C] text-white">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h2 className="font-display font-bold text-base text-[#1B1B1E]">
                    Upload BMI / EVOLT 360 / InBody Report
                  </h2>
                </div>
                <p className="text-xs text-[#554337] leading-relaxed">
                  Upload your PDF report or body photo. The AI extracts your height, weight, body fat %, and muscle mass,
                  and cross-checks printed BMI against the scientific formula before saving.
                </p>
              </div>

              <label className="shrink-0 px-4 py-2.5 rounded-full bg-[#FB923C] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#EA580C] transition-colors cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploadingReport ? 'Analyzing Report...' : 'Upload Report / Photo'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleReportFileSelect}
                  disabled={uploadingReport}
                  className="hidden"
                />
              </label>
            </div>
          </section>

      {/* Key Composition Metrics */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337]">Current Weight</p>
          <p className="font-display text-2xl font-bold mt-1">{data.profile.weightKg} kg</p>
          <p className="text-[11px] text-[#944A00]">
            Height: {data.profile.heightCm}cm • BMI {data.profile.bmi}
          </p>
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
        <div className="p-3.5 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* DEDICATED BMI REPORT & ASSESSMENT HISTORY TABLE */}
      <section className="tactile-card-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2 text-[#1B1B1E]">
              <FileCheck2 className="w-5 h-5 text-[#944A00]" />
              BMI &amp; Body Composition Reports History
            </h2>
            <p className="text-xs text-[#554337] mt-0.5">
              Accurate audit log of all your EVOLT 360, InBody, and photo assessments with scientific formula verification.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F5F3F6] text-[#554337] text-xs font-bold">
            {data.bodyScans.length} {data.bodyScans.length === 1 ? 'Report' : 'Reports'}
          </span>
        </div>

        {data.bodyScans.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F5F3F6] text-center space-y-2">
            <FileText className="w-8 h-8 text-[#944A00]/50 mx-auto" />
            <p className="text-sm font-bold text-[#1B1B1E]">No BMI or Body Composition Reports Uploaded Yet</p>
            <p className="text-xs text-[#554337] max-w-md mx-auto">
              Click &quot;Upload Report / Photo&quot; above to scan your EVOLT 360 or InBody printout. We&apos;ll automatically
              extract and verify your BMI accuracy!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E0D8] text-[11px] font-bold text-[#554337] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date &amp; Device</th>
                  <th className="py-2.5 px-3">Height / Weight</th>
                  <th className="py-2.5 px-3">Calculated BMI</th>
                  <th className="py-2.5 px-3">Reported BMI</th>
                  <th className="py-2.5 px-3">Accuracy Status</th>
                  <th className="py-2.5 px-3">Body Fat &amp; Muscle</th>
                  <th className="py-2.5 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D8]/60">
                {data.bodyScans.map((scan) => {
                  const ht = scan.heightCm || data.profile.heightCm;
                  const calc = scan.calculatedBmi || calculateBmi(scan.weightKg, ht);
                  const isMatch =
                    scan.reportedBmi && Math.abs(scan.reportedBmi - calc) <= 0.3;
                  const hasDiscrepancy =
                    scan.reportedBmi && Math.abs(scan.reportedBmi - calc) > 0.3;

                  return (
                    <tr key={scan.id} className="hover:bg-[#F9F8F6] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#1B1B1E]">
                        <div>{scan.scanDate}</div>
                        <span className="inline-block text-[10px] font-bold text-[#944A00] bg-[#FFEDD5] px-2 py-0.5 rounded-full mt-0.5">
                          {scan.deviceName}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1B1B1E]">{scan.weightKg} kg</div>
                        <div className="text-[10px] text-[#554337]">{ht} cm</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#1B1B1E]">
                        {calc}
                      </td>
                      <td className="py-3 px-3 text-[#554337]">
                        {scan.reportedBmi ? `${scan.reportedBmi}` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {isMatch ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D]">
                            <CheckCircle2 className="w-3 h-3" /> Accurate Match
                          </span>
                        ) : hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                            <AlertCircle className="w-3 h-3" /> Diff (±{Math.abs(scan.reportedBmi! - calc).toFixed(1)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#554337]">
                            Scientific Formula
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[#1B1B1E]">{scan.bodyFatPct}% Fat</div>
                        <div className="text-[10px] text-[#006C4B] font-semibold">{scan.skeletalMuscleMassKg} kg SMM</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setAuditModalScan(scan)}
                          className="px-2.5 py-1 rounded-lg bg-[#F5F3F6] hover:bg-[#E4E0D8] text-[#1B1B1E] font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Audit Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </>
      )}

      {/* Charts & Quick Log */}
      {(activeSection === 'overview' || activeSection === 'charts') && (
        <>
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
                <Scale className="w-4 h-4 text-[#944A00]" /> Manual Quick Log
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
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="tactile-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Waist (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waistCm}
                  onChange={(e) => setWaistCm(Number(e.target.value))}
                  className="tactile-input w-full px-3 py-2 text-sm"
                />
              </div>
              {scanMode && (
                <>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Body Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={bodyFatPct}
                      onChange={(e) => setBodyFatPct(Number(e.target.value))}
                      className="tactile-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1">Muscle (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={smmKg}
                      onChange={(e) => setSmmKg(Number(e.target.value))}
                      className="tactile-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#FB923C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Entry
            </button>
          </form>
        </>
      )}

      {/* Milestones & Photos */}
      {(activeSection === 'overview' || activeSection === 'photos') && (
        <>
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
        </>
      )}

      {/* REVIEW & VERIFY ASSESSMENT MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8 border border-[#E4E0D8]">
            <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#944A00]" />
                <h3 className="font-display font-bold text-lg text-[#1B1B1E]">
                  Verify Body Assessment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-full hover:bg-[#F5F3F6] text-[#554337] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scientific Accuracy & Formula Verification Box */}
            <div
              className={`p-4 rounded-2xl text-xs space-y-2 ${
                editFileType === 'photo_human'
                  ? 'bg-[#E0F2FE] text-[#0C4A6E] border border-[#BAE6FD]'
                  : bmiDiscrepancy > 0.3
                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                  : 'bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-sm">
                {editFileType === 'photo_human' ? (
                  <>
                    <Camera className="w-4 h-4" /> Photo Assessment Mode
                  </>
                ) : bmiDiscrepancy > 0.3 ? (
                  <>
                    <AlertCircle className="w-4 h-4" /> Discrepancy Detected
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Scientific Accuracy Verified
                  </>
                )}
              </div>

              {editFileType === 'photo_human' ? (
                <p>
                  <strong>Note:</strong> Photos cannot determine body weight or actual BMI. Please verify and confirm
                  your height and scale weight below before saving.
                </p>
              ) : bmiDiscrepancy > 0.3 ? (
                <p>
                  Report printed BMI is <strong>{editReportedBmi}</strong>, but the standard scientific formula (
                  <code>weight ÷ height²</code>) gives <strong>{currentCalculatedBmi}</strong> (difference of{' '}
                  {bmiDiscrepancy.toFixed(1)}). Please verify your height and weight.
                </p>
              ) : (
                <p>
                  Standard scientific calculation (<code>{editWeight}kg ÷ ({editHeight / 100}m)²</code>) yields{' '}
                  <strong>{currentCalculatedBmi}</strong>, which aligns perfectly with your report!
                </p>
              )}
            </div>

            {/* Editable Measurements */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#554337]">
                Review &amp; Edit Extracted Values
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editWeight}
                    onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Height (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editHeight}
                    onChange={(e) => setEditHeight(parseFloat(e.target.value) || 0)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Calculated BMI</label>
                  <div className="px-3 py-2 rounded-xl bg-[#F5F3F6] font-bold text-sm text-[#1B1B1E]">
                    {currentCalculatedBmi}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Report Printed BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editReportedBmi || ''}
                    placeholder="e.g. 28.4"
                    onChange={(e) => setEditReportedBmi(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Body Fat (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editBodyFat}
                    onChange={(e) => setEditBodyFat(parseFloat(e.target.value) || 0)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Muscle Mass (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editSmm}
                    onChange={(e) => setEditSmm(parseFloat(e.target.value) || 0)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Waist Circumference (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editWaist}
                    onChange={(e) => setEditWaist(parseFloat(e.target.value) || 0)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-[#554337]">Device / Source</label>
                  <input
                    type="text"
                    value={editDevice}
                    onChange={(e) => setEditDevice(e.target.value)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D8]">
              <sakuga-button
                variant="secondary"
                onClick={() => setReviewModalOpen(false)}
              >
                Cancel
              </sakuga-button>
              <sakuga-button
                ref={confirmBtnRef}
                onClick={handleConfirmAssessment}
              >
                Confirm
              </sakuga-button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT DETAILS MODAL */}
      {auditModalScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E4E0D8]">
            <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1B1B1E]">
                  Assessment Audit Details
                </h3>
                <p className="text-xs text-[#554337]">
                  {auditModalScan.deviceName} • {auditModalScan.scanDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalScan(null)}
                className="p-1 rounded-full hover:bg-[#F5F3F6] text-[#554337] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F3F6] space-y-2 text-xs">
              <p className="font-bold text-[#1B1B1E] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#006C4B]" /> BMI Formula Verification
              </p>
              <p className="text-[#554337]">
                Scientific Formula: <code>BMI = weight (kg) ÷ (height (m))²</code>
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-[#E4E0D8] font-mono text-[11px] space-y-1">
                <div>Weight: {auditModalScan.weightKg} kg</div>
                <div>Height: {auditModalScan.heightCm || data.profile.heightCm} cm</div>
                <div>
                  Calculated BMI:{' '}
                  <strong className="text-[#006C4B]">
                    {auditModalScan.calculatedBmi ||
                      calculateBmi(auditModalScan.weightKg, auditModalScan.heightCm || data.profile.heightCm)}
                  </strong>
                </div>
                {auditModalScan.reportedBmi && (
                  <div>
                    Report Printed BMI:{' '}
                    <strong>{auditModalScan.reportedBmi}</strong>
                  </div>
                )}
                <div>Status: {auditModalScan.validationStatus || 'verified'}</div>
              </div>
            </div>

            {auditModalScan.notes && (
              <div className="text-xs text-[#554337]">
                <strong>Notes:</strong> {auditModalScan.notes}
              </div>
            )}

            {auditModalScan.reportUrl && (
              <div className="pt-2">
                <a
                  href={auditModalScan.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#944A00] hover:underline"
                >
                  <FileText className="w-4 h-4" /> View Attached Source Document
                </a>
              </div>
            )}

            <div className="text-right pt-2 border-t border-[#E4E0D8]">
              <button
                type="button"
                onClick={() => setAuditModalScan(null)}
                className="px-5 py-2 rounded-full bg-[#1B1B1E] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
