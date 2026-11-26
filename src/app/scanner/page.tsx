'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Zap, Minus, Plus, Trash2, Camera, Image as ImageIcon, RotateCcw } from 'lucide-react';
import type { MealSlot } from '@/types/nutrifit';
import type { PhotoScanResult, ScannedCandidateItem } from '@/lib/ai-engine';
import { CalmLoader, CalmLoaderCompact } from '@/components/CalmLoader';

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

  // Live Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera not supported directly in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraActive(false);
      setCameraError('Camera permission not granted. Use file upload below.');
    }
  }, [stopCamera]);

  // Start camera when on Photo mode and no photo taken yet
  useEffect(() => {
    if (scanMode === 'Photo' && !imagePreview && !scanResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanMode, imagePreview, scanResult, startCamera, stopCamera]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    stopCamera();

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let { width, height } = img;
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
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setImagePreview(compressed);
          setImageBase64(compressed.split(',')[1] || '');
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

  const analyzePhoto = async (b64: string, mime: string, hint: string) => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mimeType: mime, hintText: hint }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response. Please add a description to assist the AI.');
      }
      if (!res.ok || data.error) throw new Error(data.error || 'Analysis failed');

      // The API returns PhotoScanResult directly or wrapped in data.result
      const scanResultData: PhotoScanResult = (data.result || data) as PhotoScanResult;
      if (scanResultData && Array.isArray(scanResultData.items) && scanResultData.items.length > 0) {
        setScanResult(scanResultData);
        setItems(scanResultData.items.map((it, i) => ({ ...it, tempId: `t${i}` })));
        
        // Show warning if using local estimates
        if (scanResultData.mode === 'local_estimate') {
          setError('⚠️ AI vision unavailable (add GEMINI_API_KEY to .env.local for live photo analysis). Showing local estimates - please review and adjust each item before saving.');
        }
      } else {
        throw new Error('Could not identify food items. Please add a brief description below and try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCaptureSnapshot = () => {
    // 1. If camera is active, take snapshot from video element
    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const b64 = capturedDataUrl.split(',')[1] || '';
        setImagePreview(capturedDataUrl);
        setImageBase64(b64);
        setMimeType('image/jpeg');
        stopCamera();
        analyzePhoto(b64, 'image/jpeg', hintText);
        return;
      }
    }

    // 2. If image already chosen or describe mode
    if (imageBase64 || hintText) {
      analyzePhoto(imageBase64, mimeType, hintText);
      return;
    }

    // 3. Fallback: trigger file input
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setImagePreview(null);
    setImageBase64('');
    setScanResult(null);
    setItems([]);
    setError('');
    startCamera();
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
            foodName: it.name,
            quantity: it.quantity,
            unit: it.unit,
            weightGrams: it.weightGrams,
            calories: it.calories,
            proteinG: it.proteinG,
            carbsG: it.carbsG,
            fatG: it.fatG,
            oilGheeGrams: it.oilGheeGrams,
            loggingMethod: 'ai_scan',
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

  // --- Results view (with items) ---
  if (scanResult && items.length > 0) {
    const totalCals = items.reduce((s, i) => s + i.calories, 0);
    const totalPro = items.reduce((s, i) => s + i.proteinG, 0);
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetake}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#e8e4d0]"
            >
              <X className="w-5 h-5 text-[#a08a6a]" />
            </button>
            <div>
              <h2 className="font-display font-bold text-xl text-[#38240d]">{scanResult.dishTitle}</h2>
              <p className="text-xs text-[#a08a6a]">{scanResult.cuisineLabel}</p>
            </div>
          </div>
          <button
            onClick={handleRetake}
            className="px-3.5 py-1.5 rounded-full bg-white border border-[#e8e4d0] text-xs font-semibold text-[#c05800] flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake
          </button>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="font-bold text-2xl text-[#38240d]">{Math.round(totalCals)}</p>
            <p className="text-xs text-[#a08a6a]">kcal</p>
          </div>
          <div className="w-px h-10 bg-[#f0ece0]" />
          <div className="text-center flex-1">
            <p className="font-bold text-2xl text-[#713600]">{Math.round(totalPro)}g</p>
            <p className="text-xs text-[#a08a6a]">protein</p>
          </div>
          <div className="w-px h-10 bg-[#f0ece0]" />
          <div className="text-center flex-1">
            <p className="font-bold text-2xl text-[#c05800]">{Math.round(items.reduce((s, i) => s + i.carbsG, 0))}g</p>
            <p className="text-xs text-[#a08a6a]">carbs</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.tempId} className="bg-white rounded-[16px] p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#38240d]">{item.name}</p>
                  <p className="text-xs text-[#a08a6a]">
                    {item.weightGrams}g · {item.calories} kcal · {item.proteinG}g P
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, i) =>
                          i === idx ? { ...it, quantity: Math.max(0.5, +(it.quantity - 0.5).toFixed(1)) } : it
                        )
                      )
                    }
                    className="w-7 h-7 rounded-full bg-[#f0ece0] flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, quantity: +(it.quantity + 0.5).toFixed(1) } : it))
                      )
                    }
                    className="w-7 h-7 rounded-full bg-[#f0ece0] flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="w-7 h-7 rounded-full bg-[#fee2e2] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-[#dc2626]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Meal slot */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <p className="text-xs font-bold text-[#a08a6a] uppercase tracking-wider mb-2.5">Log to meal slot</p>
          <div className="grid grid-cols-4 gap-2">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((s) => (
              <button
                key={s}
                onClick={() => setMealSlot(s)}
                className={`py-2 rounded-[12px] text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  mealSlot === s ? 'bg-[#c05800] text-white' : 'bg-[#f0ece0] text-[#a08a6a] hover:bg-[#e8e4d0]'
                }`}
              >
                {s === 'snacks' ? 'Snack' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 rounded-2xl p-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className="w-full py-4 rounded-[20px] bg-[#c05800] text-white font-bold text-base shadow-[0_4px_16px_rgba(192,88,0,0.35)] disabled:opacity-50 active:scale-[0.98] transition-transform cursor-pointer"
        >
          {saving ? 'Saving…' : `Save ${items.length} item${items.length !== 1 ? 's' : ''} to ${mealSlot}`}
        </button>
      </div>
    );
  }

  // --- Results view (AI response with no items but has clarifying questions) ---
  if (scanResult && items.length === 0 && scanResult.clarifyingQuestions?.length > 0) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetake}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#e8e4d0]"
            >
              <X className="w-5 h-5 text-[#a08a6a]" />
            </button>
            <div>
              <h2 className="font-display font-bold text-xl text-[#38240d]">{scanResult.dishTitle}</h2>
              <p className="text-xs text-[#a08a6a]">{scanResult.cuisineLabel}</p>
            </div>
          </div>
          <button
            onClick={handleRetake}
            className="px-3.5 py-1.5 rounded-full bg-white border border-[#e8e4d0] text-xs font-semibold text-[#c05800] flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retake
          </button>
        </div>

        <div className="bg-white rounded-[20px] p-4 shadow-sm">
          <p className="text-sm text-[#38240d] mb-3">{scanResult.disclaimer}</p>
          <div className="space-y-2">
            {scanResult.clarifyingQuestions.map((q, i) => (
              <div key={i} className="bg-[#fff3e0] border border-[#ffe0b2] rounded-xl p-3">
                <p className="text-sm text-[#c05800]">💡 {q}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleRetake}
            className="w-full mt-4 py-3 rounded-[16px] bg-[#c05800] text-white font-bold cursor-pointer"
          >
            Retake Photo / Add Description
          </button>
        </div>
      </div>
    );
  }

  // --- Live Camera & Scanning view (dark background matching design) ---
  return (
    <div className="min-h-screen bg-[#38240d] flex flex-col pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <button
          onClick={() => {
            stopCamera();
            router.back();
          }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="text-white font-semibold text-base">Scan meal</p>
        <div className="w-10" />
      </div>

      {/* Camera frame / Live viewfinder */}
      <div className="flex-1 flex flex-col items-center px-5">
        <div className="w-full aspect-[3/4] max-h-[50vh] rounded-[24px] border-2 border-dashed border-white/40 flex flex-col items-center justify-center overflow-hidden relative bg-black/40">
          {imagePreview ? (
            // Photo taken/uploaded view
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Food snapshot" className="w-full h-full object-cover" />
          ) : (
            // Live Video stream from camera
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />
              {!cameraActive && (
                <div className="text-center px-6 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 mb-1">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-white font-medium text-sm">Place your thali or plate inside the frame</p>
                  {cameraError && <p className="text-white/50 text-xs mt-1">{cameraError}</p>}
                  <button
                    onClick={startCamera}
                    className="mt-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Enable Camera
                  </button>
                </div>
              )}
            </>
          )}

          {/* Overlay viewfinder guidelines */}
          {cameraActive && !imagePreview && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
              <span className="text-[11px] font-semibold text-white/80 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
                Center your plate
              </span>
              <div className="w-48 h-48 rounded-full border border-white/25 border-dashed" />
              <div />
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        <p className="text-white/50 text-xs mt-3">Best in daylight, one plate at a time</p>

        {/* Mode pills */}
        <div className="flex gap-2 mt-3">
          {SCAN_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setScanMode(mode);
                if (mode !== 'Photo') stopCamera();
                else startCamera();
              }}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                scanMode === mode ? 'bg-white text-[#38240d]' : 'bg-white/15 text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Describe field */}
        <div className="w-full mt-3">
          <input
            value={hintText}
            onChange={(e) => setHintText(e.target.value)}
            placeholder={
              scanMode === 'Describe'
                ? 'Describe your meal (e.g. 2 rotis, 1 bowl dal, 100g paneer)…'
                : 'Add a hint, e.g. "homemade Gujarati dal" (optional)'
            }
            className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:bg-white/20 border border-white/10"
          />
        </div>

        {error && <p className="text-red-400 text-xs mt-2 text-center bg-red-950/40 px-3 py-1.5 rounded-xl">{error}</p>}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 pb-6 pt-3 relative z-30 w-full max-w-sm mx-auto">
        {/* Gallery picker */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Pick from gallery"
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors shrink-0"
        >
          <ImageIcon className="w-5 h-5 text-white" />
        </button>

        {/* Center action button */}
        {imagePreview ? (
          <div className="flex-1 flex flex-col items-center px-3">
            <button
              onClick={() => analyzePhoto(imageBase64, mimeType, hintText)}
              disabled={analyzing}
              className="w-full py-3.5 px-5 rounded-full bg-[#c05800] hover:bg-[#a04800] text-white font-bold text-sm shadow-[0_4px_20px_rgba(192,88,0,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <CalmLoader size={72} text="Analyzing Meal…" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Analyze Meal</span>
                </>
              )}
            </button>
            <button
              onClick={handleRetake}
              className="text-white/60 hover:text-white text-xs mt-1.5 underline cursor-pointer"
            >
              Retake photo
            </button>
          </div>
        ) : (scanMode === 'Describe' && hintText.trim() ? (
          <div className="flex-1 flex flex-col items-center px-3">
            <button
              onClick={() => analyzePhoto('', 'text/plain', hintText)}
              disabled={analyzing}
              className="w-full py-3.5 px-5 rounded-full bg-[#c05800] hover:bg-[#a04800] text-white font-bold text-sm shadow-[0_4px_20px_rgba(192,88,0,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <CalmLoader size={72} text="Analyzing Description…" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Analyze Description</span>
                </>
              )}
            </button>
            <button
              onClick={() => setHintText('')}
              className="text-white/60 hover:text-white text-xs mt-1.5 underline cursor-pointer"
            >
              Clear description
            </button>
          </div>
        ) : (
          <button
            onClick={handleCaptureSnapshot}
            disabled={analyzing || !cameraActive}
            aria-label={cameraActive ? "Snap photo and analyze" : "Start camera"}
            className="w-[72px] h-[72px] rounded-full bg-[#c05800] border-4 border-white/80 shadow-[0_0_24px_rgba(192,88,0,0.7)] flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {analyzing ? (
              <CalmLoaderCompact size={56} />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#c05800] flex items-center justify-center">
                <Camera className="w-7 h-7 text-white stroke-[2.2]" />
              </div>
            )}
          </button>
        ))}

        {/* Helper / Retake button */}
        <div className="w-12 flex justify-end shrink-0">
          {imagePreview ? (
            <button
              onClick={handleRetake}
              aria-label="Retake photo"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={startCamera}
              aria-label="Restart camera"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}