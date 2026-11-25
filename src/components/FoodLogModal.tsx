'use client';

import React, { useEffect, useState } from 'react';
import { Check, HelpCircle, Mic, MicOff, Plus, Search, X } from 'lucide-react';
import type { FoodItem, FoodUnit, MealSlot } from '@/types/nutrifit';

interface FoodLogModalProps {
  open: boolean;
  onClose: () => void;
  defaultMealSlot?: MealSlot;
  defaultDate?: string;
  initialMode?: 'manual' | 'voice';
  onSaved: () => void;
}

const UNITS: Array<{ value: FoodUnit; label: string }> = [
  { value: 'serving', label: 'Serving' },
  { value: 'bowl', label: 'Bowl (Katori)' },
  { value: 'piece', label: 'Piece' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'cup', label: 'Cup' },
  { value: 'slice', label: 'Slice' },
  { value: 'tbsp', label: 'Tablespoon (tbsp)' },
  { value: 'tsp', label: 'Teaspoon (tsp)' },
];

export function FoodLogModal({
  open,
  onClose,
  defaultMealSlot = 'lunch',
  defaultDate,
  initialMode = 'manual',
  onSaved,
}: FoodLogModalProps) {
  const [mode, setMode] = useState<'manual' | 'voice'>(initialMode);
  const [mealSlot, setMealSlot] = useState<MealSlot>(defaultMealSlot);
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<FoodUnit>('bowl');
  const [extraGheeTsp, setExtraGheeTsp] = useState<number>(0);
  const [showGuide, setShowGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Voice state
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceItems, setVoiceItems] = useState<
    Array<{
      foodId?: string;
      name: string;
      quantity: number;
      unit: FoodUnit;
      weightGrams: number;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      oilGheeGrams: number;
    }>
  >([]);
  const [voiceQuestions, setVoiceQuestions] = useState<string[]>([]);

  useEffect(() => {
    setMode(initialMode);
    setMealSlot(defaultMealSlot);
  }, [initialMode, defaultMealSlot, open]);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/foods?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setFoods(d.foods || []))
      .catch(() => {});
  }, [open, query]);

  if (!open) return null;

  const computeMultiplier = (food: FoodItem, qty: number, u: FoodUnit): number => {
    if (u === food.servingUnit) return qty / (food.servingSize || 1);
    if (u === 'g' || u === 'ml') return qty / Math.max(1, food.weightGrams);
    if (u === 'bowl') return (qty * 150) / Math.max(1, food.weightGrams);
    if (u === 'cup') return (qty * 200) / Math.max(1, food.weightGrams);
    if (u === 'tbsp') return (qty * 15) / Math.max(1, food.weightGrams);
    if (u === 'tsp') return (qty * 5) / Math.max(1, food.weightGrams);
    return qty / (food.servingSize || 1);
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(food.servingSize);
    setUnit(food.servingUnit);
    setExtraGheeTsp(0);
    setError('');
  };

  const handleSaveManual = async () => {
    if (!selectedFood) return;
    setSaving(true);
    setError('');
    try {
      const mult = computeMultiplier(selectedFood, quantity, unit);
      const gheeCalories = extraGheeTsp * 45;
      const gheeFat = extraGheeTsp * 5;
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: defaultDate,
          mealSlot,
          foodId: selectedFood.id,
          foodName:
            extraGheeTsp > 0
              ? `${selectedFood.name} (+${extraGheeTsp} tsp ghee/oil)`
              : selectedFood.name,
          quantity,
          unit,
          weightGrams: Math.round(selectedFood.weightGrams * mult + extraGheeTsp * 5),
          calories: Math.round(selectedFood.calories * mult + gheeCalories),
          proteinG: Number((selectedFood.proteinG * mult).toFixed(1)),
          carbsG: Number((selectedFood.carbsG * mult).toFixed(1)),
          fatG: Number((selectedFood.fatG * mult + gheeFat).toFixed(1)),
          loggingMethod: 'manual',
          confidence: selectedFood.confidence === 'verified' ? 'verified' : 'ai_confirmed_estimate',
          oilGheeGrams: Number((selectedFood.oilOrGheeIncludedG * mult + extraGheeTsp * 5).toFixed(1)),
        }),
      });
      if (!res.ok) throw new Error('Failed to save food log');
      setSelectedFood(null);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartVoice = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setError('Browser speech recognition is unavailable here. Type what you ate below and tap Parse!');
      return;
    }
    const recognition = new Rec();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    setListening(true);
    setError('');
    recognition.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      setTranscript(text);
    };
    recognition.onerror = () => {
      setListening(false);
      setError('Microphone permission denied or unavailable. You can type what you ate below.');
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleParseVoice = async () => {
    if (!transcript.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ai/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not parse speech');
      setVoiceItems(data.items || []);
      setVoiceQuestions(data.clarifyingQuestions || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVoiceItems = async () => {
    if (voiceItems.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: defaultDate,
          mealSlot,
          items: voiceItems.map((it) => ({
            foodId: it.foodId,
            foodName: it.name,
            quantity: it.quantity,
            unit: it.unit,
            weightGrams: it.weightGrams,
            calories: it.calories,
            proteinG: it.proteinG,
            carbsG: it.carbsG,
            fatG: it.fatG,
            loggingMethod: 'voice',
            confidence: 'ai_confirmed_estimate',
            oilGheeGrams: it.oilGheeGrams,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to save voice entries');
      setVoiceItems([]);
      setTranscript('');
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const previewMult = selectedFood ? computeMultiplier(selectedFood, quantity, unit) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-[#FAF8F5] w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-[#E4E0D8]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E0D8]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1B1B1E]">Log Pure-Veg Meal</h2>
            <p className="text-xs text-[#554337]">Search Indian foods or speak naturally</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F2EFE9] flex items-center justify-center text-[#554337]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Slot + Mode Switch */}
        <div className="px-6 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5 bg-[#F2EFE9] p-1 rounded-full">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((slot) => (
              <button
                key={slot}
                onClick={() => setMealSlot(slot)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                  mealSlot === slot ? 'bg-[#FB923C] text-white shadow-xs' : 'text-[#554337]'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 bg-[#F2EFE9] p-1 rounded-full">
            <button
              onClick={() => setMode('manual')}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                mode === 'manual' ? 'bg-[#1B1B1E] text-white' : 'text-[#554337]'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                mode === 'voice' ? 'bg-[#1B1B1E] text-white' : 'text-[#554337]'
              }`}
            >
              <Mic className="w-3 h-3" /> Voice
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-[#FFDAD6] text-[#93000A] text-xs font-semibold">{error}</div>
          )}

          {mode === 'manual' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#887365] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search roti, moong dal, paneer, thepla, soya..."
                    className="tactile-input w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide((v) => !v)}
                  className="px-3 py-2.5 rounded-2xl bg-[#E0F2FE] text-[#0369A1] text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Portion Guide
                </button>
              </div>

              {showGuide && (
                <div className="p-3.5 rounded-2xl bg-[#E0F2FE]/70 border border-[#38BDF8]/30 text-xs text-[#0C4A6E] space-y-1">
                  <p className="font-bold">Beginner Indian Portion Guide:</p>
                  <p>• 1 Standard Katori / Bowl = ~150 ml / 150–180g cooked dal or sabzi</p>
                  <p>• 1 Homemade Phulka Roti = ~30g (~85 kcal without ghee)</p>
                  <p>• 1 tsp Ghee or Oil = 5g (+45 kcal) • 1 tbsp = 15g (+135 kcal)</p>
                  <p>• Paneer/Tofu: 100g ≈ size of a deck of cards</p>
                </div>
              )}

              {selectedFood ? (
                <div className="tactile-card-white p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D]">
                        {selectedFood.state} • {selectedFood.confidence}
                      </span>
                      <h3 className="font-display font-bold text-base mt-1">{selectedFood.name}</h3>
                      <p className="text-xs text-[#554337]">Source: {selectedFood.source}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFood(null)}
                      className="text-xs font-semibold text-[#944A00] underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#554337] block mb-1">Quantity</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(0.25, Number(e.target.value)))}
                        className="tactile-input w-full px-3 py-2 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#554337] block mb-1">Unit</label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as FoodUnit)}
                        className="tactile-input w-full px-3 py-2 text-sm font-semibold"
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#554337] block mb-1.5">
                      Extra Ghee / Cooking Oil added? ({extraGheeTsp} tsp = +{extraGheeTsp * 45} kcal)
                    </label>
                    <div className="flex gap-2">
                      {[0, 0.5, 1, 2].map((tsp) => (
                        <button
                          key={tsp}
                          type="button"
                          onClick={() => setExtraGheeTsp(tsp)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                            extraGheeTsp === tsp
                              ? 'bg-[#FFEDD5] text-[#944A00] border border-[#FB923C]'
                              : 'bg-[#F2EFE9] text-[#554337]'
                          }`}
                        >
                          {tsp === 0 ? 'None' : `+${tsp} tsp`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#F5F3F6] text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#554337]">Calories</p>
                      <p className="font-display font-bold text-base">
                        {Math.round(selectedFood.calories * previewMult + extraGheeTsp * 45)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#006C4B]">Protein</p>
                      <p className="font-display font-bold text-base text-[#006C4B]">
                        {(selectedFood.proteinG * previewMult).toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#674BB5]">Carbs</p>
                      <p className="font-display font-bold text-base text-[#674BB5]">
                        {(selectedFood.carbsG * previewMult).toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#944A00]">Fat</p>
                      <p className="font-display font-bold text-base text-[#944A00]">
                        {(selectedFood.fatG * previewMult + extraGheeTsp * 5).toFixed(1)}g
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveManual}
                    disabled={saving}
                    className="w-full py-3 rounded-full bg-[#FB923C] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : `Add to ${mealSlot}`}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {foods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-[#E4E0D8]/80 hover:border-[#FB923C] flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#1B1B1E]">{food.name}</p>
                        <p className="text-xs text-[#554337]">
                          {food.servingSize} {food.servingUnit} ({food.weightGrams}g) • P: {food.proteinG}g • C:{' '}
                          {food.carbsG}g • F: {food.fatG}g
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-[#944A00] bg-[#FFEDD5] px-2.5 py-1 rounded-full">
                          {food.calories} kcal
                        </span>
                        <Plus className="w-4 h-4 text-[#554337]" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E4E0D8] space-y-3">
                <p className="text-xs text-[#554337]">
                  Tap the mic and say something like:{' '}
                  <strong className="text-[#1B1B1E]">
                    &ldquo;I ate two rotis, one bowl of dal and 100 grams of paneer&rdquo;
                  </strong>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartVoice}
                    className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      listening ? 'bg-[#BA1A1A] text-white animate-pulse' : 'bg-[#FB923C] text-white'
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{listening ? 'Listening...' : 'Speak Meal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleParseVoice}
                    disabled={!transcript.trim() || saving}
                    className="px-4 py-2.5 rounded-full bg-[#1B1B1E] text-white text-xs font-semibold cursor-pointer"
                  >
                    Parse Meal
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Or type: I ate two rotis, one bowl of dal and 100 grams of paneer"
                  className="tactile-input w-full p-3 text-sm"
                />
              </div>

              {voiceQuestions.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#FFEDD5] text-[#7C2D12] text-xs space-y-1">
                  <p className="font-bold">Quick Clarifications:</p>
                  {voiceQuestions.map((q, i) => (
                    <p key={i}>• {q}</p>
                  ))}
                </div>
              )}

              {voiceItems.length > 0 && (
                <div className="space-y-2">
                  {voiceItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-[#E4E0D8] flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-sm">{it.name}</p>
                        <p className="text-xs text-[#554337]">
                          {it.quantity} {it.unit} ({it.weightGrams}g) • P: {it.proteinG}g
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#944A00]">{it.calories} kcal</span>
                        <button
                          onClick={() => setVoiceItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-[#BA1A1A] font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleSaveVoiceItems}
                    disabled={saving}
                    className="w-full py-3 rounded-full bg-[#006C4B] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Log {voiceItems.length} Items</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
