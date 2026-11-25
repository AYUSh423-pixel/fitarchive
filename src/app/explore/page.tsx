'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Clock,
  Flame,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { FoodItem, FoodUnit, Recipe } from '@/types/nutrifit';

const CATEGORIES = [
  'All',
  'High Protein',
  'Gujarati & Regional',
  'Paneer, Soya & Dairy',
  'Dal & Legumes',
  'Roti & Breads',
  'Rice & Grains',
  'South Indian',
  'Snacks & Street',
  'Nuts, Seeds & Fats',
];

export default function IndianFoodExplorePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [customOpen, setCustomOpen] = useState(false);

  // Custom food form
  const [customName, setCustomName] = useState('');
  const [customCat, setCustomCat] = useState<FoodItem['category']>('Gujarati & Regional');
  const [customCal, setCustomCal] = useState(180);
  const [customPro, setCustomPro] = useState(8);
  const [customCarbs, setCustomCarbs] = useState(24);
  const [customFat, setCustomFat] = useState(5);
  const [customGrams, setCustomGrams] = useState(150);
  const [customUnit, setCustomUnit] = useState<FoodUnit>('bowl');
  const [customState, setCustomState] = useState<'cooked' | 'raw'>('cooked');
  const [customOilG, setCustomOilG] = useState(4);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category === 'High Protein') params.set('tag', 'high-protein');
      else if (category !== 'All') params.set('category', category);

      const res = await fetch(`/api/foods?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setFoods(d.foods || []);
        setRecipes(d.recipes || []);
      }
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const handleQuickLogFood = async (food: FoodItem) => {
    const res = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealSlot: 'lunch',
        foodId: food.id,
        foodName: food.name,
        quantity: food.servingSize,
        unit: food.servingUnit,
        weightGrams: food.weightGrams,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        loggingMethod: 'manual',
        confidence: food.confidence === 'verified' ? 'verified' : 'ai_confirmed_estimate',
        oilGheeGrams: food.oilOrGheeIncludedG,
      }),
    });
    if (res.ok) {
      setToast(`Logged ${food.name} (${food.calories} kcal) to Today's Lunch!`);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const res = await fetch('/api/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customName,
        category: customCat,
        calories: customCal,
        proteinG: customPro,
        carbsG: customCarbs,
        fatG: customFat,
        weightGrams: customGrams,
        servingSize: 1,
        servingUnit: customUnit,
        state: customState,
        oilOrGheeIncludedG: customOilG,
      }),
    });
    if (res.ok) {
      setCustomOpen(false);
      setCustomName('');
      setToast('Added custom homemade food to your database!');
      loadFoods();
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Search Pill */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#887365] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roti, dal, paneer, soya, thepla, dhokla..."
            className="tactile-input w-full pl-11 pr-4 py-3 text-sm"
          />
        </div>
        <button
          onClick={() => setCustomOpen(true)}
          className="px-4 py-3 rounded-2xl bg-[#FFEDD5] text-[#944A00] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Custom Food
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? cat === 'High Protein'
                    ? 'bg-[#FB923C] text-white'
                    : 'bg-[#1B1B1E] text-white'
                  : 'bg-white text-[#554337] border border-[#E4E0D8]'
              }`}
            >
              {cat === 'High Protein' && <Flame className="w-3.5 h-3.5 inline mr-1" />}
              {cat}
            </button>
          );
        })}
      </div>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#1B1B1E] text-white text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-[#34D399]" /> {toast}
        </div>
      )}

      {/* Mint Green AI Coach Recommendation Banner (Matches Stitch Explore Design) */}
      <section className="rounded-3xl p-5 bg-[#64f9bc]/55 border border-[#34D399]/40 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#1B1B1E] text-[#64f9bc] flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#005137]">
            AI Coach Recommendation • Pure Veg (No Eggs)
          </p>
          <h2 className="font-display text-xl font-bold text-[#002114] mt-0.5">
            Meal Suggestions for Today
          </h2>
          <p className="text-xs text-[#002114]/85 mt-1 leading-relaxed">
            Curated homemade Indian &amp; Gujarati dishes to help you hit your{' '}
            <strong>130g protein target</strong> while staying within <strong>1,800 kcal</strong>.
          </p>
        </div>
      </section>

      {/* Curated High-Protein Recipes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1B1B1E]">Curated High Protein Recipes</h3>
            <p className="text-xs text-[#554337]">Traditional Indian recipes with verified macros</p>
          </div>
          <span className="text-xs font-bold text-[#944A00]">{recipes.length} recipes</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {recipes.map((rec) => (
            <Link
              key={rec.id}
              href={`/recipes/${rec.id}`}
              className="tactile-card-white p-4 flex items-center justify-between gap-3 hover:border-[#FB923C] transition-all"
            >
              <div className="space-y-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[10px] font-bold">
                  Pure Veg • No Egg
                </span>
                <h4 className="font-display font-bold text-sm text-[#1B1B1E]">{rec.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#554337]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {rec.prepTimeMin}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {rec.servings} serv
                  </span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#7C2D12] text-[11px] font-bold">
                    {rec.caloriesPerServing} kcal
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                    {rec.proteinPerServing}g Protein
                  </span>
                </div>
              </div>
              <span className="w-9 h-9 rounded-full bg-[#F5F3F6] flex items-center justify-center text-[#1B1B1E] shrink-0">
                <Plus className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Searchable Indian Food Database */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1B1B1E]">
            Indian Food Database ({foods.length})
          </h3>
          <span className="text-[11px] text-[#554337]">Tap + to quick-log</span>
        </div>

        {loading ? (
          <div className="h-40 rounded-3xl bg-white animate-pulse" />
        ) : foods.length === 0 ? (
          <div className="tactile-card p-6 text-center text-sm text-[#554337]">
            No matching pure-vegetarian foods found. Try adding a custom homemade food!
          </div>
        ) : (
          <div className="space-y-2.5">
            {foods.map((f) => (
              <div
                key={f.id}
                className="tactile-card-white p-4 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-display font-bold text-sm text-[#1B1B1E]">{f.name}</span>
                    {f.regionalName && (
                      <span className="text-xs text-[#554337]">({f.regionalName})</span>
                    )}
                  </div>
                  <p className="text-xs text-[#554337]">
                    {f.servingSize} {f.servingUnit} ({f.weightGrams}g • {f.state}) •{' '}
                    <span className="font-semibold text-[#006C4B]">P: {f.proteinG}g</span> • C: {f.carbsG}g • F:{' '}
                    {f.fatG}g
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#F5F3F6] text-[10px] font-semibold text-[#554337]">
                      {f.source}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        f.confidence === 'verified'
                          ? 'bg-[#DCFCE7] text-[#14532D]'
                          : 'bg-[#FFEDD5] text-[#7C2D12]'
                      }`}
                    >
                      {f.confidence}
                    </span>
                    {f.oilOrGheeIncludedG > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF08A]/70 text-[#78350F] text-[10px] font-semibold">
                        Incl. {f.oilOrGheeIncludedG}g oil/ghee
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-[#FFEDD5] text-[#944A00] text-xs font-bold">
                    {f.calories} kcal
                  </span>
                  <button
                    onClick={() => handleQuickLogFood(f)}
                    aria-label={`Quick log ${f.name}`}
                    className="w-9 h-9 rounded-full bg-[#1B1B1E] hover:bg-[#FB923C] text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom Homemade Food Modal */}
      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreateCustomFood}
            className="bg-[#FAF8F5] w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-[#E4E0D8]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Add Custom Homemade Food</h3>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F2EFE9] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#554337]">
              Homemade recipes vary by oil, ghee, butter, and sugar. Enter your household&apos;s values.
            </p>
            <div>
              <label className="text-xs font-semibold block mb-1">Food Name</label>
              <input
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Mom's Dudhi Chana Dal"
                className="tactile-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Category</label>
                <select
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value as FoodItem['category'])}
                  className="tactile-input w-full px-3 py-2 text-xs font-semibold"
                >
                  {CATEGORIES.filter((c) => c !== 'All' && c !== 'High Protein').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">State</label>
                <select
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value as 'cooked' | 'raw')}
                  className="tactile-input w-full px-3 py-2 text-xs font-semibold"
                >
                  <option value="cooked">Cooked</option>
                  <option value="raw">Raw</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Kcal</label>
                <input type="number" value={customCal} onChange={(e) => setCustomCal(Number(e.target.value))} className="tactile-input w-full px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Prot (g)</label>
                <input type="number" value={customPro} onChange={(e) => setCustomPro(Number(e.target.value))} className="tactile-input w-full px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Carb (g)</label>
                <input type="number" value={customCarbs} onChange={(e) => setCustomCarbs(Number(e.target.value))} className="tactile-input w-full px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Fat (g)</label>
                <input type="number" value={customFat} onChange={(e) => setCustomFat(Number(e.target.value))} className="tactile-input w-full px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Weight (g)</label>
                <input type="number" value={customGrams} onChange={(e) => setCustomGrams(Number(e.target.value))} className="tactile-input w-full px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Unit</label>
                <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value as FoodUnit)} className="tactile-input w-full px-2 py-1.5 text-xs">
                  <option value="bowl">bowl</option>
                  <option value="piece">piece</option>
                  <option value="g">g</option>
                  <option value="cup">cup</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Oil/Ghee (g)</label>
                <input type="number" value={customOilG} onChange={(e) => setCustomOilG(Number(e.target.value))} className="tactile-input w-full px-2 py-1.5 text-sm" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#FB923C] text-white font-semibold text-sm cursor-pointer"
            >
              Save to Database
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
