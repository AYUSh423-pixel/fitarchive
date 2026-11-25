'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Droplet,
  Dumbbell,
  Leaf,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
} from 'lucide-react';
import type { MealSlot } from '@/types/nutrifit';
import type { PhotoScanResult, ScannedCandidateItem } from '@/lib/ai-engine';

export default function MealScannerPage() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [hintText, setHintText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<PhotoScanResult | null>(null);
  const [items, setItems] = useState<ScannedCandidateItem[]>([]);
  const [servingMultiplier, setServingMultiplier] = useState(1.0);
  const [mealSlot, setMealSlot] = useState<MealSlot>('lunch');
  const [viewMode, setViewMode] = useState<'petal' | 'items'>('petal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const saveMealBtnRef = React.useRef<HTMLElementTagNameMap['sakuga-button'] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');

    // Use Image + Canvas to compress large phone camera photos (prevent 413 Payload Too Large / HTML response errors)
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImagePreview(compressedDataUrl);
          setImageBase64(compressedDataUrl.split(',')[1] || '');
          setMimeType('image/jpeg');
        } else {
          setImagePreview(rawDataUrl);
          setImageBase64(rawDataUrl.split(',')[1] || '');
        }
      };
      img.onerror = () => {
        setImagePreview(rawDataUrl);
        setImageBase64(rawDataUrl.split(',')[1] || '');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, hintText }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response. If using photo, please add a short description below to assist the AI.');
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Scan analysis failed. Please try again.');
      }

      setScanResult(data);
      setItems(data.items || []);
      setServingMultiplier(1.0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (items.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealSlot,
          items: items.map((it) => ({
            foodId: it.foodId || null,
            foodName: it.name,
            quantity: Number((it.quantity * servingMultiplier).toFixed(2)),
            unit: it.unit,
            weightGrams: Math.round(it.weightGrams * servingMultiplier),
            calories: Math.round(it.calories * servingMultiplier),
            proteinG: Number((it.proteinG * servingMultiplier).toFixed(1)),
            carbsG: Number((it.carbsG * servingMultiplier).toFixed(1)),
            fatG: Number((it.fatG * servingMultiplier).toFixed(1)),
            loggingMethod: 'ai_photo',
            confidence: 'ai_confirmed_estimate',
            oilGheeGrams: Number((it.oilGheeGrams * servingMultiplier).toFixed(1)),
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to save confirmed meal');
      saveMealBtnRef.current?.done();
      setTimeout(() => {
        router.push('/diary');
      }, 750);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totalCalories = Math.round(items.reduce((s, i) => s + i.calories, 0) * servingMultiplier);
  const totalProtein = Number((items.reduce((s, i) => s + i.proteinG, 0) * servingMultiplier).toFixed(1));
  const totalCarbs = Number((items.reduce((s, i) => s + i.carbsG, 0) * servingMultiplier).toFixed(1));
  const totalFat = Number((items.reduce((s, i) => s + i.fatG, 0) * servingMultiplier).toFixed(1));
  const totalGrams = Math.round(items.reduce((s, i) => s + i.weightGrams, 0) * servingMultiplier);

  const macroCalTotal = Math.max(1, totalProtein * 4 + totalCarbs * 4 + totalFat * 9);
  const pPct = Math.round(((totalProtein * 4) / macroCalTotal) * 100);
  const cPct = Math.round(((totalCarbs * 4) / macroCalTotal) * 100);
  const fPct = Math.round(((totalFat * 9) / macroCalTotal) * 100);

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Top Status Pills (Matching Stitch AI Scanner) */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E4E0D8] text-xs font-bold tracking-wider uppercase text-[#1B1B1E]">
          <span className="w-2 h-2 rounded-full bg-[#34D399]" />
          AI LIVE VISION
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'petal' ? 'items' : 'petal')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFEDD5] text-[#944A00] text-xs font-bold cursor-pointer"
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>{viewMode === 'petal' ? 'Petal View' : 'Edit Items'}</span>
          </button>
        </div>
      </div>

      {/* Upload / Capture Card */}
      <section className="tactile-card-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <label className="flex-1 w-full border-2 border-dashed border-[#DBC1B2] rounded-3xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#FB923C] bg-[#FAF8F5] transition-colors">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Uploaded meal preview"
                className="max-h-44 rounded-2xl object-cover"
              />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#944A00] flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="font-display font-semibold text-sm text-[#1B1B1E]">
                  Upload or Capture Food Photo
                </p>
                <p className="text-xs text-[#554337] mt-0.5">
                  Thali, bowl, roti, dal, paneer, snacks
                </p>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#554337] block">
            Optional note (helps estimate hidden ghee/oil or dish name):
          </label>
          <input
            type="text"
            value={hintText}
            onChange={(e) => setHintText(e.target.value)}
            placeholder="e.g. 2 phulka rotis, 1 bowl moong dal, 100g paneer"
            className="tactile-input w-full px-4 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-3 rounded-full bg-[#FB923C] hover:bg-[#f97316] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{analyzing ? 'Analyzing plate...' : 'Analyze Food Photo'}</span>
        </button>

        {error && <p className="text-xs font-semibold text-[#BA1A1A]">{error}</p>}
      </section>

      {/* Results & Confirmation (Never auto-saved!) */}
      {scanResult && (
        <>
          {/* Petal View Visualization (Matching Stitch Design) */}
          {viewMode === 'petal' ? (
            <section className="tactile-card-white p-6 relative overflow-hidden">
              <div className="relative h-64 flex items-center justify-center">
                {/* Top Petal */}
                <div className="absolute top-2 flex flex-col items-center">
                  <span className="font-display text-lg font-bold text-[#006C4B]">
                    {items[0]?.sharePct ?? 35}%
                  </span>
                  <span className="text-xs font-semibold text-[#554337] max-w-[110px] truncate">
                    {items[0]?.name.split(' ')[0] || 'Protein'}
                  </span>
                  <div className="w-6 h-12 rounded-full bg-gradient-to-b from-[#64f9bc]/70 to-transparent mt-1" />
                </div>

                {/* Left Petal */}
                <div className="absolute left-3 sm:left-8 flex items-center gap-2">
                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-[#674BB5] block">
                      {items[2]?.sharePct ?? 22}%
                    </span>
                    <span className="text-xs font-semibold text-[#554337]">
                      {items[2]?.name.split(' ')[0] || 'Greens'}
                    </span>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-gradient-to-r from-[#b69dff]/70 to-transparent" />
                </div>

                {/* Center Utensils Pod */}
                <div className="w-16 h-16 rounded-full bg-white shadow-lg border border-[#E4E0D8] flex items-center justify-center text-[#944A00] z-10">
                  <Utensils className="w-6 h-6" />
                </div>

                {/* Right Petal */}
                <div className="absolute right-3 sm:right-8 flex items-center gap-2">
                  <div className="w-12 h-6 rounded-full bg-gradient-to-l from-[#FB923C]/65 to-transparent" />
                  <div>
                    <span className="font-display text-lg font-bold text-[#944A00] block">
                      {items[1]?.sharePct ?? 28}%
                    </span>
                    <span className="text-xs font-semibold text-[#554337]">
                      {items[1]?.name.split(' ')[0] || 'Grains'}
                    </span>
                  </div>
                </div>

                {/* Bottom Petal */}
                <div className="absolute bottom-2 flex flex-col items-center">
                  <div className="w-6 h-12 rounded-full bg-gradient-to-t from-[#ffb783]/70 to-transparent mb-1" />
                  <span className="font-display text-lg font-bold text-[#944A00]">
                    {items[3]?.sharePct ?? 15}%
                  </span>
                  <span className="text-xs font-semibold text-[#554337]">Fats / Ghee</span>
                </div>
              </div>
              <p className="text-center text-xs font-medium text-[#554337] mt-1">
                Tap &ldquo;Edit Items&rdquo; above to adjust individual foods before saving
              </p>
            </section>
          ) : (
            <section className="tactile-card-white p-5 space-y-3">
              <h3 className="font-display font-bold text-sm">Identified Items (Editable)</h3>
              {items.map((it) => (
                <div
                  key={it.tempId}
                  className="p-3 rounded-2xl bg-[#F5F3F6] flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((x) => (x.tempId === it.tempId ? { ...x, name: e.target.value } : x))
                        )
                      }
                      className="font-semibold text-sm bg-transparent border-b border-transparent focus:border-[#FB923C] outline-none w-full"
                    />
                    <p className="text-xs text-[#554337]">
                      {it.quantity} {it.unit} ({it.weightGrams}g) • P: {it.proteinG}g • Confidence: {it.confidence}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{it.calories} kcal</span>
                    <button
                      onClick={() => setItems((prev) => prev.filter((x) => x.tempId !== it.tempId))}
                      className="p-1.5 text-[#BA1A1A] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Clarifying Questions + Disclaimer */}
          <div className="p-4 rounded-3xl bg-[#FFEDD5]/80 border border-[#FB923C]/40 space-y-2 text-xs text-[#7C2D12]">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Please Confirm Before Saving</span>
            </div>
            <p>{scanResult.disclaimer}</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {scanResult.clarifyingQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>

          {/* Summary Confirmation Card (Matching Stitch Bottom Card) */}
          <section className="tactile-card-white p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#1B1B1E]">{scanResult.dishTitle}</h2>
                <p className="text-xs text-[#554337] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006C4B]" />
                  <span>
                    {scanResult.cuisineLabel} • {totalCalories} kcal total
                  </span>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F5F3F6] text-xs font-bold text-[#1B1B1E] shrink-0">
                {totalGrams} g
              </span>
            </div>

            {/* 3 Macro Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FAF8F5] text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#64f9bc]/50 text-[#006C4B] flex items-center justify-center mx-auto">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <p className="font-display font-bold text-lg">{totalProtein}g</p>
                <p className="text-[11px] font-semibold text-[#006C4B]">Protein ({pPct}%)</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#FFDCC5] text-[#944A00] flex items-center justify-center mx-auto">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="font-display font-bold text-lg">{totalCarbs}g</p>
                <p className="text-[11px] font-semibold text-[#944A00]">Carbs ({cPct}%)</p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF8F5] text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-[#FFDAD6] text-[#BA1A1A] flex items-center justify-center mx-auto">
                  <Droplet className="w-4 h-4" />
                </div>
                <p className="font-display font-bold text-lg">{totalFat}g</p>
                <p className="text-[11px] font-semibold text-[#BA1A1A]">Fats ({fPct}%)</p>
              </div>
            </div>

            {/* Serving Size Stepper + Meal Slot */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2EFE9]">
              <span className="text-xs font-semibold text-[#1B1B1E]">Serving Size</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServingMultiplier((v) => Math.max(0.25, Number((v - 0.25).toFixed(2))))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-display font-bold text-base w-10 text-center">
                  {servingMultiplier.toFixed(1)}
                </span>
                <button
                  onClick={() => setServingMultiplier((v) => Number((v + 0.25).toFixed(2)))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 bg-[#F2EFE9] p-1 rounded-full">
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setMealSlot(slot)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer ${
                    mealSlot === slot ? 'bg-[#FB923C] text-white' : 'text-[#554337]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <sakuga-button
                variant="secondary"
                onClick={() => setScanResult(null)}
              >
                Cancel
              </sakuga-button>
              <sakuga-button
                ref={saveMealBtnRef}
                disabled={saving || items.length === 0}
                onClick={handleConfirmAndSave}
              >
                Confirm
              </sakuga-button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
