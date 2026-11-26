'use client';

import React, { useEffect, useState } from 'react';
import { Check, HelpCircle, Mic, MicOff, Plus, Search, X, PlusCircle, Calculator, Trash2 } from 'lucide-react';
import type { FoodItem, FoodUnit, MealSlot } from '@/types/nutrifit';
import { AddCustomFoodModal } from '@/components/AddCustomFoodModal';

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

  // Custom food modal
  const [showCustomFood, setShowCustomFood] = useState(false);
  
  // Track items added in this session for meal summary
  const [mealItems, setMealItems] = useState<
    Array<{
      food: FoodItem;
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
      const weightGrams = Math.round(selectedFood.weightGrams * mult + extraGheeTsp * 5);
      const calories = Math.round(selectedFood.calories * mult + gheeCalories);
      const proteinG = Number((selectedFood.proteinG * mult).toFixed(1));
      const carbsG = Number((selectedFood.carbsG * mult).toFixed(1));
      const fatG = Number((selectedFood.fatG * mult + gheeFat).toFixed(1));
      const oilGheeGrams = Number((selectedFood.oilOrGheeIncludedG * mult + extraGheeTsp * 5).toFixed(1));

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
          weightGrams,
          calories,
          proteinG,
          carbsG,
          fatG,
          loggingMethod: 'manual',
          confidence: selectedFood.confidence === 'verified' ? 'verified' : 'ai_confirmed_estimate',
          oilGheeGrams,
        }),
      });
      if (!res.ok) throw new Error('Failed to save food log');

      // Track for meal summary
      setMealItems((prev) => [
        ...prev,
        {
          food: selectedFood,
          quantity,
          unit,
          weightGrams,
          calories,
          proteinG,
          carbsG,
          fatG,
          oilGheeGrams,
        },
      ]);

      setSelectedFood(null);
      setQuantity(1);
      setUnit('bowl');
      setExtraGheeTsp(0);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomFoodCreated = (food: FoodItem) => {
    // Auto-select the newly created food
    setSelectedFood(food);
    setQuantity(food.servingSize);
    setUnit(food.servingUnit);
    setExtraGheeTsp(0);
    setShowCustomFood(false);
  };

  const handleRemoveMealItem = (index: number) => {
    setMealItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearMeal = () => {
    setMealItems([]);
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

      // Track for meal summary
      setMealItems((prev) => [
        ...prev,
        ...voiceItems.map((it) => ({
          food: {
            id: it.foodId || `voice-${Date.now()}`,
            name: it.name,
            calories: it.calories,
            proteinG: it.proteinG,
            carbsG: it.carbsG,
            fatG: it.fatG,
            weightGrams: it.weightGrams,
            servingSize: it.quantity,
            servingUnit: it.unit,
            oilOrGheeIncludedG: it.oilGheeGrams,
          } as FoodItem,
          quantity: it.quantity,
          unit: it.unit,
          weightGrams: it.weightGrams,
          calories: it.calories,
          proteinG: it.proteinG,
          carbsG: it.carbsG,
          fatG: it.fatG,
          oilGheeGrams: it.oilGheeGrams,
        })),
      ]);

      setVoiceItems([]);
      setTranscript('');
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const previewMult = selectedFood ? computeMultiplier(selectedFood, quantity, unit) : 1;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-xl rounded-t-[28px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-[#E7E3D8] pb-safe animate-fade-in-up">
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-[#E7E3D8] rounded-full mx-auto mt-2.5 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#F1EFEA]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">Log Pure-Veg Meal</h2>
            <p className="text-xs text-[#8C827A]">Search Indian foods or speak naturally</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#E7E3D8] flex items-center justify-center text-[#8C827A] hover:text-[#1C1917] tactile-press-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Slot + Mode Switch */}
        <div className="px-6 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5 bg-[#FAF8F5] border border-[#E7E3D8]/60 p-1 rounded-full">
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((slot) => (
              <button
                key={slot}
                onClick={() => setMealSlot(slot)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer tactile-press-sm ${
                  mealSlot === slot ? 'bg-[#B45309] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 bg-[#FAF8F5] border border-[#E7E3D8]/60 p-1 rounded-full">
            <button
              onClick={() => setMode('manual')}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer tactile-press-sm ${
                mode === 'manual' ? 'bg-[#1C1917] text-white shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer tactile-press-sm ${
                mode === 'voice' ? 'bg-[#1C1917] text-white shadow-xs' : 'text-[#78716C]'
              }`}
            >
              <Mic className="w-3 h-3" /> Voice
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-[#fee2e2] text-[#dc2626] text-xs font-semibold">{error}</div>
          )}

          {mode === 'manual' ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#a08a6a] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  className="px-3 py-2.5 rounded-2xl bg-[#fff3e0] text-[#c05800] text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Portion Guide
                </button>
              </div>

              {showGuide && (
                <div className="p-3.5 rounded-2xl bg-[#fff3e0] border border-[#ffe0b2] text-xs text-[#a04800] space-y-1">
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f5f2e0] text-[#713600]">
                        {selectedFood.state} • {selectedFood.confidence}
                      </span>
                      <h3 className="font-display font-bold text-base mt-1 text-[#38240d]">{selectedFood.name}</h3>
                      <p className="text-xs text-[#a08a6a]">Source: {selectedFood.source}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFood(null)}
                      className="text-xs font-semibold text-[#c05800] underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#713600] block mb-1">Quantity</label>
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
                      <label className="text-xs font-semibold text-[#713600] block mb-1">Unit</label>
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
                    <label className="text-xs font-semibold text-[#713600] block mb-1.5">
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
                              ? 'bg-[#fff3e0] text-[#c05800] border border-[#c05800]'
                              : 'bg-[#f0ece0] text-[#713600]'
                          }`}
                        >
                          {tsp === 0 ? 'None' : `+${tsp} tsp`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-[#f5f2e0] text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#713600]">Calories</p>
                      <p className="font-display font-bold text-base text-[#38240d]">
                        {Math.round(selectedFood.calories * previewMult + extraGheeTsp * 45)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#713600]">Protein</p>
                      <p className="font-display font-bold text-base text-[#713600]">
                        {(selectedFood.proteinG * previewMult).toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#c05800]">Carbs</p>
                      <p className="font-display font-bold text-base text-[#c05800]">
                        {(selectedFood.carbsG * previewMult).toFixed(1)}g
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#5d4037]">Fat</p>
                      <p className="font-display font-bold text-base text-[#5d4037]">
                        {(selectedFood.fatG * previewMult + extraGheeTsp * 5).toFixed(1)}g
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveManual}
                    disabled={saving}
                    className="w-full py-3 rounded-full bg-[#c05800] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
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
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-[#e8e4d0]/80 hover:border-[#c05800] flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#38240d]">{food.name}</p>
                        <p className="text-xs text-[#a08a6a]">
                          {food.servingSize} {food.servingUnit} ({food.weightGrams}g) • P: {food.proteinG}g • C:{' '}
                          {food.carbsG}g • F: {food.fatG}g
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-[#c05800] bg-[#fff3e0] px-2.5 py-1 rounded-full">
                          {food.calories} kcal
                        </span>
                        <Plus className="w-4 h-4 text-[#a08a6a]" />
                      </div>
                    </button>
                  ))}
                  {/* Add Custom Food Button */}
                  <button
                    onClick={() => setShowCustomFood(true)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#f5f2e0] border-2 border-dashed border-[#c05800] flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#a04800]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#c05800]" />
                    <span className="font-semibold text-sm text-[#c05800]">Add Custom Food</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#e8e4d0] space-y-3">
                <p className="text-xs text-[#a08a6a]">
                  Tap the mic and say something like:{' '}
                  <strong className="text-[#38240d]">
                    &ldquo;I ate two rotis, one bowl of dal and 100 grams of paneer&rdquo;
                  </strong>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartVoice}
                    className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      listening ? 'bg-[#dc2626] text-white animate-pulse' : 'bg-[#c05800] text-white'
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{listening ? 'Listening...' : 'Speak Meal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleParseVoice}
                    disabled={!transcript.trim() || saving}
                    className="px-4 py-2.5 rounded-full bg-[#38240d] text-white text-xs font-semibold cursor-pointer"
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
                <div className="p-3 rounded-2xl bg-[#fff3e0] text-[#a04800] text-xs space-y-1">
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
                      className="p-3 rounded-2xl bg-white border border-[#e8e4d0] flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#38240d]">{it.name}</p>
                        <p className="text-xs text-[#a08a6a]">
                          {it.quantity} {it.unit} ({it.weightGrams}g) • P: {it.proteinG}g
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#c05800]">{it.calories} kcal</span>
                        <button
                          onClick={() => setVoiceItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-xs text-[#dc2626] font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleSaveVoiceItems}
                    disabled={saving}
                    className="w-full py-3 rounded-full bg-[#713600] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Log {voiceItems.length} Items</span>
                  </button>
                </div>
              )}

              {/* Meal Summary */}
              {mealItems.length > 0 && (
                <div className="pt-4 border-t border-[#e8e4d0]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-[#38240d] flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-[#c05800]" />
                      Meal Summary ({mealItems.length} items)
                    </h3>
                    <button
                      onClick={handleClearMeal}
                      className="text-xs text-[#dc2626] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {mealItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-[#e8e4d0] flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-[#38240d]">{item.food.name}</p>
                          <p className="text-xs text-[#a08a6a]">
                            {item.quantity} {item.unit} ({item.weightGrams}g) • P: {item.proteinG}g • C: {item.carbsG}g • F: {item.fatG}g
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-[#c05800] bg-[#fff3e0] px-2.5 py-1 rounded-full">
                            {item.calories} kcal
                          </span>
                          <button
                            onClick={() => handleRemoveMealItem(idx)}
                            className="text-xs text-[#dc2626] font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f5f2e0] border border-[#e8e4d0]">
                    <div className="grid grid-cols-4 gap-2 text-center mb-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#713600]">Total Calories</p>
                        <p className="font-display font-bold text-lg text-[#38240d]">
                          {mealItems.reduce((s, i) => s + i.calories, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#713600]">Total Protein</p>
                        <p className="font-display font-bold text-lg text-[#713600]">
                          {mealItems.reduce((s, i) => s + i.proteinG, 0).toFixed(1)}g
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#c05800]">Total Carbs</p>
                        <p className="font-display font-bold text-lg text-[#c05800]">
                          {mealItems.reduce((s, i) => s + i.carbsG, 0).toFixed(1)}g
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#5d4037]">Total Fat</p>
                        <p className="font-display font-bold text-lg text-[#5d4037]">
                          {mealItems.reduce((s, i) => s + i.fatG, 0).toFixed(1)}g
                        </p>
                      </div>
                    </div>
                    <div className="text-center text-xs text-[#a08a6a]">
                      Total weight: {mealItems.reduce((s, i) => s + i.weightGrams, 0)}g • Oil/Ghee: {mealItems.reduce((s, i) => s + i.oilGheeGrams, 0).toFixed(1)}g
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    <AddCustomFoodModal
      open={showCustomFood}
      onClose={() => setShowCustomFood(false)}
      onFoodCreated={handleCustomFoodCreated}
      mealItems={mealItems}
    />
  </>
  );
}