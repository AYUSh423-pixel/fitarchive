'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Zap, Minus, Plus, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import type { MealSlot } from '@/types/nutrifit';
import type { PhotoScanResult, ScannedCandidateItem } from '@/lib/ai-engine';

const SCAN_MODES = ['Photo', 'Barcode', 'Describe'] as const;
type ScanMode = typeof SCAN_MODES[number];

export default function MealScannerPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [hintText, setHintText] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('Photo');
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null);
  const [items, setItems] = useState<ScannedCandidateItem[]>([]);
  const [mealSlot, setMealSlot] = useState<MealSlot>('lunch');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const saveMealBtnRef = React.useRef<HTMLButtonElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setImagePreview(compressed);
          setImageBase64(compressed.split(',')[1] || '');
          setMimeType('image/jpeg');
        } else {
          setImagePreview(rawDataUrl);
          setImageBase64(rawDataUrl.split(',')[1] || '');
        }
      };
      img.onerror = () => { setImagePreview(rawDataUrl); setImageBase64(rawDataUrl.split(',')[1] || ''); };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true); setError('');
    try {
      const res = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, hintText }),
      });
      const text = await res.text();
      let data: { error?: string; result?: PhotoScanResult };
      try { data = JSON.parse(text); } catch {
        throw new Error('Server returned an invalid response. Please add a description to assist the AI.');
      }
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed');
      if (data.result) {
        setScanResult(data.result);
        setItems(data.result.items.map((it, i) => ({ ...it, tempId: `t${i}` })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!items.length) return;
    setSaving(true);
    try {
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealSlot,
          items: items.map((it) => ({
            foodName: it.name, quantity: it.quantity, unit: it.unit,
            weightGrams: it.weightGrams, calories: it.calories,
            proteinG: it.proteinG, carbsG: it.carbsG, fatG: it.fatG,
            oilGheeGrams: it.oilGheeGrams, loggingMethod: 'ai_scan',
            confidence: it.confidence === 'high' ? 'ai_confirmed_estimate' : 'ai_estimate',
          })),
        }),
      });
      if (res.ok) {
        setTimeout(() => router.push('/diary'), 400);
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Results view ---
  if (scanResult && items.length > 0) {
    const totalCals = items.reduce((s, i) => s + i.calories, 0);
    const totalPro = items.reduce((s, i) => s + i.proteinG, 0);
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => { setScanResult(null); setItems([]); }} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#E5E0D8]">
            <X className="w-5 h-5 text-[#6B5F4E]" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-[#1a1a1a]">{scanResult.dishTitle}</h2>
            <p className="text-xs text-[#9CA3AF]">{scanResult.cuisineLabel}</p>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="font-bold text-2xl text-[#1a1a1a]">{Math.round(totalCals)}</p>
            <p className="text-xs text-[#9CA3AF]">kcal</p>
          </div>
          <div className="w-px h-10 bg-[#F0EBE3]" />
          <div className="text-center flex-1">
            <p className="font-bold text-2xl text-[#16A34A]">{Math.round(totalPro)}g</p>
            <p className="text-xs text-[#9CA3AF]">protein</p>
          </div>
          <div className="w-px h-10 bg-[#F0EBE3]" />
          <div className="text-center flex-1">
            <p className="font-bold text-2xl text-[#D97706]">{Math.round(items.reduce((s, i) => s + i.carbsG, 0))}g</p>
            <p className="text-xs text-[#9CA3AF]">carbs</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.tempId} className="bg-white rounded-[16px] p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1a1a1a]">{item.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{item.weightGrams}g · {item.calories} kcal · {item.proteinG}g P</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(0.5, +(it.quantity - 0.5).toFixed(1)) } : it))}
                    className="w-7 h-7 rounded-full bg-[#F3F0EB] flex items-center justify-center cursor-pointer"
                  ><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: +(it.quantity + 0.5).toFixed(1) } : it))}
                    className="w-7 h-7 rounded-full bg-[#F3F0EB] flex items-center justify-center cursor-pointer"
                  ><Plus className="w-3 h-3" /></button>
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="w-7 h-7 rounded-full bg-[#FEE2E2] flex items-center justify-center cursor-pointer"
                  ><Trash2 className="w-3 h-3 text-[#DC2626]" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Meal slot */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <p className="text-xs font-bold text-[#6B5F4E] uppercase tracking-wider mb-2.5">Log to meal slot</p>
          <div className="grid grid-cols-4 gap-2">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((s) => (
              <button
                key={s}
                onClick={() => setMealSlot(s)}
                className={`py-2 rounded-[12px] text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  mealSlot === s ? 'bg-[#B45309] text-white' : 'bg-[#F3F0EB] text-[#6B5F4E] hover:bg-[#EDE9E0]'
                }`}
              >
                {s === 'snacks' ? 'Snack' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-2xl p-3">{error}</p>}

        <button
          ref={saveMealBtnRef}
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className="w-full py-4 rounded-[20px] bg-[#B45309] text-white font-bold text-base shadow-[0_4px_16px_rgba(180,83,9,0.35)] disabled:opacity-50 active:scale-[0.98] transition-transform cursor-pointer"
        >
          {saving ? 'Saving…' : `Save ${items.length} item${items.length !== 1 ? 's' : ''} to ${mealSlot}`}
        </button>
      </div>
    );
  }

  // --- Scanner / upload view (dark background, matches design) ---
  return (
    <div className="-mx-4 -mt-5 min-h-screen bg-[#0D1F18] flex flex-col" style={{ marginBottom: '-9rem' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="text-white font-semibold text-base">Scan meal</p>
        <div className="w-10" />
      </div>

      {/* Camera frame / upload area */}
      <div className="flex-1 flex flex-col items-center px-5">
        <label className="w-full aspect-[3/4] max-h-[52vh] rounded-[24px] border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Food preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center px-6">
              <p className="text-white/60 text-sm font-medium">Place your thali or plate inside the frame</p>
            </div>
          )}
          <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="sr-only" />
        </label>

        <p className="text-white/40 text-xs mt-3">Best in daylight, one plate at a time</p>

        {/* Mode pills */}
        <div className="flex gap-2 mt-4">
          {SCAN_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                scanMode === mode ? 'bg-white text-[#0D1F18]' : 'bg-white/15 text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Describe field (shows in Describe mode or always for hint) */}
        <div className="w-full mt-4">
          <input
            value={hintText}
            onChange={(e) => setHintText(e.target.value)}
            placeholder={scanMode === 'Describe' ? 'Describe your meal, e.g. 2 rotis, 1 bowl rajma…' : 'Add a hint (optional)'}
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-white/20"
          />
        </div>

        {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-10 pb-8 pt-4">
        {/* Gallery */}
        <label className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer">
          <ImageIcon className="w-5 h-5 text-white" />
          <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
        </label>

        {/* Shutter / Analyze */}
        <button
          onClick={imageBase64 || hintText ? handleAnalyze : undefined}
          disabled={analyzing}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            imageBase64 || hintText
              ? 'bg-[#B45309] shadow-[0_4px_20px_rgba(180,83,9,0.6)] active:scale-95 cursor-pointer'
              : 'bg-white/20 cursor-default'
          }`}
        >
          {analyzing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Flash placeholder */}
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white/60" />
        </div>
      </div>
    </div>
  );
}
