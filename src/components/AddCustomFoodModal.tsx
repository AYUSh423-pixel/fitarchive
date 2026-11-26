'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import type { FoodItem, FoodUnit } from '@/types/nutrifit';

interface AddCustomFoodModalProps {
  open: boolean;
  onClose: () => void;
  onFoodCreated: (food: FoodItem) => void;
  mealItems?: Array<{
    food: FoodItem;
    quantity: number;
    unit: FoodUnit;
    weightGrams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    oilGheeGrams: number;
  }>;
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

const CATEGORIES = [
  'Roti & Breads',
  'Rice & Grains',
  'Dal & Legumes',
  'Paneer, Soya & Dairy',
  'Gujarati & Regional',
  'South Indian',
  'Snacks & Street',
  'Fruits & Veggies',
  'Nuts, Seeds & Fats',
  'Protein & Drinks',
  'Homemade Custom',
] as const;

export function AddCustomFoodModal({
  open,
  onClose,
  onFoodCreated,
  mealItems = [],
}: AddCustomFoodModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    regionalName: '',
    category: 'Homemade Custom' as FoodItem['category'],
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
    servingSize: '1',
    servingUnit: 'bowl' as FoodUnit,
    weightGrams: '',
    state: 'cooked' as 'raw' | 'cooked' | 'packaged',
    oilOrGheeIncludedG: '0',
    tags: '',
  });

  // Compute meal totals
  const mealTotals = mealItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      proteinG: acc.proteinG + item.proteinG,
      carbsG: acc.carbsG + item.carbsG,
      fatG: acc.fatG + item.fatG,
      weightGrams: acc.weightGrams + item.weightGrams,
      oilGheeGrams: acc.oilGheeGrams + item.oilGheeGrams,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, weightGrams: 0, oilGheeGrams: 0 }
  );

  // Preview calculation for the custom food being created
  const previewCalories = formData.calories ? Number(formData.calories) : 0;
  const previewProtein = formData.proteinG ? Number(formData.proteinG) : 0;
  const previewCarbs = formData.carbsG ? Number(formData.carbsG) : 0;
  const previewFat = formData.fatG ? Number(formData.fatG) : 0;

  const combinedTotals = {
    calories: mealTotals.calories + previewCalories,
    proteinG: mealTotals.proteinG + previewProtein,
    carbsG: mealTotals.carbsG + previewCarbs,
    fatG: mealTotals.fatG + previewFat,
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Food name is required');
      return;
    }
    if (!formData.calories || Number(formData.calories) <= 0) {
      setError('Calories must be greater than 0');
      return;
    }
    if (!formData.weightGrams || Number(formData.weightGrams) <= 0) {
      setError('Weight (grams) must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const newFood: FoodItem = {
        id: `food-custom-${Date.now()}`,
        userId: 'local',
        name: formData.name.trim(),
        regionalName: formData.regionalName.trim() || undefined,
        category: formData.category,
        calories: Number(formData.calories),
        proteinG: Number(formData.proteinG || 0),
        carbsG: Number(formData.carbsG || 0),
        fatG: Number(formData.fatG || 0),
        fiberG: Number(formData.fiberG || 0),
        servingSize: Number(formData.servingSize),
        servingUnit: formData.servingUnit,
        weightGrams: Number(formData.weightGrams),
        state: formData.state,
        source: 'User Custom Entry',
        confidence: 'estimate',
        isVegetarian: true,
        hasEgg: false,
        oilOrGheeIncludedG: Number(formData.oilOrGheeIncludedG || 0),
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : ['custom', 'homemade'],
      };

      onFoodCreated(newFood);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-[#FAF8F5] w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col shadow-2xl border border-[#E4E0D8]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E0D8]">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1B1B1E]">Add Custom Food</h2>
            <p className="text-xs text-[#554337]">Enter nutrition info per serving</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F2EFE9] flex items-center justify-center text-[#554337]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Summary Bar (if items exist) */}
        {mealItems.length > 0 && (
          <div className="px-6 py-3 bg-[#F0FDF4] border-b border-[#E4E0D8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[#16A34A] tracking-wider">
                Current Meal Total ({mealItems.length} items)
              </span>
              <span className="text-xs font-bold text-[#16A34A]">
                {Math.round(mealTotals.calories)} kcal • {mealTotals.proteinG.toFixed(1)}g P • {mealTotals.carbsG.toFixed(1)}g C • {mealTotals.fatG.toFixed(1)}g F
              </span>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex-1">
                <p className="text-[#554337] font-semibold">With this item:</p>
                <p className="font-display font-bold text-[#1B1B1E]">
                  {Math.round(combinedTotals.calories)} kcal • {combinedTotals.proteinG.toFixed(1)}g P • {combinedTotals.carbsG.toFixed(1)}g C • {combinedTotals.fatG.toFixed(1)}g F
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-[#FFDAD6] text-[#93000A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#554337]">Basic Info</h3>
              
              <div>
                <label className="text-xs font-semibold text-[#554337] block mb-1">Food Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Mom's Aloo Gobi, Homemade Chana Masala"
                  className="tactile-input w-full px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#554337] block mb-1">Regional Name (Optional)</label>
                <input
                  type="text"
                  value={formData.regionalName}
                  onChange={(e) => handleChange('regionalName', e.target.value)}
                  placeholder="e.g., आलू गोभी, ચણા મસાલા"
                  className="tactile-input w-full px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#554337] block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="tactile-input w-full px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#554337] block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="e.g., homemade, dinner, high-protein, comfort"
                  className="tactile-input w-full px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Nutrition per Serving */}
            <div className="space-y-3 pt-2 border-t border-[#E4E0D8]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#554337]">Nutrition per Serving</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#554337] block mb-1">Calories (kcal) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.calories}
                    onChange={(e) => handleChange('calories', e.target.value)}
                    placeholder="250"
                    className="tactile-input w-full px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#006C4B] block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.proteinG}
                    onChange={(e) => handleChange('proteinG', e.target.value)}
                    placeholder="10"
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#D97706] block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.carbsG}
                    onChange={(e) => handleChange('carbsG', e.target.value)}
                    placeholder="30"
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#7C3AED] block mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.fatG}
                    onChange={(e) => handleChange('fatG', e.target.value)}
                    placeholder="8"
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B7280] block mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.fiberG}
                    onChange={(e) => handleChange('fiberG', e.target.value)}
                    placeholder="2"
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Serving Details */}
            <div className="space-y-3 pt-2 border-t border-[#E4E0D8]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#554337]">Serving Details</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#554337] block mb-1">Serving Size *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={formData.servingSize}
                    onChange={(e) => handleChange('servingSize', e.target.value)}
                    placeholder="1"
                    className="tactile-input w-full px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#554337] block mb-1">Serving Unit *</label>
                  <select
                    value={formData.servingUnit}
                    onChange={(e) => handleChange('servingUnit', e.target.value)}
                    className="tactile-input w-full px-3 py-2 text-sm"
                    required
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#554337] block mb-1">Weight per Serving (g) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.weightGrams}
                    onChange={(e) => handleChange('weightGrams', e.target.value)}
                    placeholder="150"
                    className="tactile-input w-full px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#554337] block mb-1">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value as 'raw' | 'cooked' | 'packaged')}
                    className="tactile-input w-full px-3 py-2 text-sm"
                  >
                    <option value="cooked">Cooked</option>
                    <option value="raw">Raw</option>
                    <option value="packaged">Packaged</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-[#944A00] block mb-1">Oil/Ghee Included in Serving (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.oilOrGheeIncludedG}
                    onChange={(e) => handleChange('oilOrGheeIncludedG', e.target.value)}
                    placeholder="5"
                    className="tactile-input w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="p-4 rounded-2xl bg-[#F5F3F6] border border-[#E4E0D8]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#554337] mb-3">Preview (per serving)</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white">
                  <p className="text-[10px] font-bold uppercase text-[#944A00]">Calories</p>
                  <p className="font-display font-bold text-base text-[#944A00]">{previewCalories}</p>
                </div>
                <div className="p-2 rounded-xl bg-white">
                  <p className="text-[10px] font-bold uppercase text-[#006C4B]">Protein</p>
                  <p className="font-display font-bold text-base text-[#006C4B]">{previewProtein.toFixed(1)}g</p>
                </div>
                <div className="p-2 rounded-xl bg-white">
                  <p className="text-[10px] font-bold uppercase text-[#D97706]">Carbs</p>
                  <p className="font-display font-bold text-base text-[#D97706]">{previewCarbs.toFixed(1)}g</p>
                </div>
                <div className="p-2 rounded-xl bg-white">
                  <p className="text-[10px] font-bold uppercase text-[#7C3AED]">Fat</p>
                  <p className="font-display font-bold text-base text-[#7C3AED]">{previewFat.toFixed(1)}g</p>
                </div>
              </div>
            </div>

            {/* Quick Fill Buttons */}
            <div className="pt-2 border-t border-[#E4E0D8]">
              <p className="text-xs text-[#554337] mb-2">Quick fill from common Indian foods:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Roti (1 pc)', calories: 85, protein: 3, carbs: 17.5, fat: 0.5, weight: 30, unit: 'piece' as FoodUnit },
                  { name: 'Rice (1 bowl)', calories: 175, protein: 3.6, carbs: 38.5, fat: 0.4, weight: 140, unit: 'bowl' as FoodUnit },
                  { name: 'Dal (1 bowl)', calories: 145, protein: 8, carbs: 22, fat: 2.5, weight: 150, unit: 'bowl' as FoodUnit },
                  { name: 'Paneer (100g)', calories: 265, protein: 18, carbs: 6, fat: 20, weight: 100, unit: 'g' as FoodUnit },
                  { name: 'Curd (1 bowl)', calories: 100, protein: 6, carbs: 4.7, fat: 6, weight: 150, unit: 'bowl' as FoodUnit },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        name: preset.name,
                        calories: String(preset.calories),
                        proteinG: String(preset.protein),
                        carbsG: String(preset.carbs),
                        fatG: String(preset.fat),
                        weightGrams: String(preset.weight),
                        servingUnit: preset.unit,
                        servingSize: '1',
                      }));
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F2EFE9] text-[#554337] hover:bg-[#E8E0D4] transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-full bg-[#FB923C] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Adding...' : 'Add Food to Database'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}