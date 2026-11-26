'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, CalendarDays, Dumbbell, TrendingUp, Droplets, ShoppingCart, BarChart3, ChevronRight, X, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import type { FoodItem, Recipe, MealSlot } from '@/types/nutrifit';

const TOOLS = [
  { label: 'Meal planner', icon: <CalendarDays className="w-5 h-5 text-[#B45309]" />, href: '/planner' },
  { label: 'Gym & workouts', icon: <Dumbbell className="w-5 h-5 text-[#B45309]" />, href: '/workouts' },
  { label: 'Transformation', icon: <TrendingUp className="w-5 h-5 text-[#B45309]" />, href: '/progress' },
  { label: 'Water & habits', icon: <Droplets className="w-5 h-5 text-[#B45309]" />, href: '/habits' },
  { label: 'Grocery & budget', icon: <ShoppingCart className="w-5 h-5 text-[#B45309]" />, href: '/grocery' },
  { label: 'Analytics', icon: <BarChart3 className="w-5 h-5 text-[#B45309]" />, href: '/analytics' },
];

export default function IndianFoodExplorePage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mealSlot, setMealSlot] = useState<MealSlot>('lunch');
  const [addingToMeal, setAddingToMeal] = useState(false);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (activeFilter !== 'All') params.set('category', activeFilter);
      const res = await fetch(`/api/foods?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const d = (await res.json()) as { foods: FoodItem[]; recipes: Recipe[] };
        setFoods(d.foods || []);
        // Extract unique categories from foods if we don't have them yet
        if (categories.length <= 1 && d.foods && d.foods.length > 0) {
          const uniqueCats = [...new Set(d.foods.map((f) => f.category))].sort();
          setCategories(['All', ...uniqueCats]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [query, activeFilter, categories.length]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/foods?limit=0', { cache: 'no-store' });
        if (res.ok) {
          const d = (await res.json()) as { foods: FoodItem[]; recipes: Recipe[] };
          if (d.foods && d.foods.length > 0) {
            const uniqueCats = [...new Set(d.foods.map((f) => f.category))].sort();
            setCategories(['All', ...uniqueCats]);
          }
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => { loadFoods(); }, [loadFoods]);

  const handleAddToMeal = async () => {
    if (!selectedFood) return;
    setAddingToMeal(true);
    try {
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealSlot,
          items: [{
            foodName: selectedFood.name,
            quantity,
            unit: selectedFood.servingUnit,
            weightGrams: Math.round(selectedFood.weightGrams * quantity),
            calories: Math.round(selectedFood.calories * quantity),
            proteinG: Math.round(selectedFood.proteinG * quantity * 10) / 10,
            carbsG: Math.round(selectedFood.carbsG * quantity * 10) / 10,
            fatG: Math.round(selectedFood.fatG * quantity * 10) / 10,
            oilGheeGrams: Math.round(selectedFood.oilOrGheeIncludedG * quantity * 10) / 10,
            loggingMethod: 'manual',
          }],
        }),
      });
      if (res.ok) {
        setSelectedFood(null);
        setQuantity(1);
      }
    } finally {
      setAddingToMeal(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-6">
      {/* Search bar */}
      <div className="flex items-center gap-3 card-minimal px-4 py-3 shadow-xs animate-fade-in focus-within:ring-2 focus-within:ring-[#B45309]/20 focus-within:border-[#B45309] transition-all">
        <Search className="w-5 h-5 text-[#8C827A] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dal, paneer, roti…"
          className="flex-1 bg-transparent text-sm text-[#1C1917] placeholder-[#8C827A] focus:outline-none"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar animate-fade-in">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer tactile-press-sm ${
              activeFilter === cat
                ? 'bg-[#1C1917] text-white shadow-xs'
                : 'bg-white text-[#1C1917] border border-[#E7E3D8] hover:border-[#B45309]/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Food search results / categories */}
      {query || activeFilter !== 'All' ? (
        <div className="animate-fade-in-up">
          <h3 className="font-bold text-[#1C1917] text-sm uppercase tracking-wider mb-3">
            {loading ? 'Searching…' : `${foods.length} results`}
          </h3>
          <div className="space-y-2">
            {foods.slice(0, 20).map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="card-minimal p-3.5 flex items-center justify-between gap-3 text-left w-full cursor-pointer hover:bg-[#FAF9F6] transition-colors tactile-press-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#1C1917] truncate">{food.name}</p>
                  <p className="text-xs text-[#8C827A]">{food.calories} kcal · {food.proteinG}g P · {food.weightGrams}g serving</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C827A] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Indian food database categories */}
          <div className="animate-fade-in-up">
            <h3 className="font-bold text-[#1C1917] text-base mb-3">Indian food database</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {categories.filter(c => c !== 'All').map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className="card-minimal p-3.5 text-left w-full cursor-pointer tactile-press flex items-center justify-between hover:border-[#B45309]/30 transition-all"
                >
                  <p className="font-bold text-sm text-[#1C1917]">{cat}</p>
                  <div className="w-7 h-7 rounded-full bg-[#FFF7ED] flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-[#B45309]" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Plan & fitness tools */}
          <div className="animate-fade-in-up">
            <h3 className="font-bold text-[#1C1917] text-base mb-3">Plan & fitness</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="card-minimal p-3.5 flex items-center gap-3 hover:bg-[#FAF9F6] tactile-press w-full transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FFF7ED] border border-[#FED7AA]/40 flex items-center justify-center shrink-0">
                    {tool.icon}
                  </div>
                  <p className="font-semibold text-xs text-[#1C1917]">{tool.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add to Meal Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setSelectedFood(null)} />
          <div className="relative bg-white rounded-t-[28px] lg:rounded-[28px] w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="sticky top-0 bg-white border-b border-[#e8e4d0] p-4 flex items-center justify-between">
              <h3 className="font-bold text-[#38240d]">Add to Meal</h3>
              <button onClick={() => setSelectedFood(null)} className="w-9 h-9 rounded-full bg-[#f0ece0] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#f5f2e0] flex items-center justify-center">
                  <ChevronRight className="w-7 h-7 text-[#c05800]" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#38240d]">{selectedFood.name}</p>
                  <p className="text-xs text-[#a08a6a]">{selectedFood.calories} kcal per {selectedFood.weightGrams}g {selectedFood.servingUnit}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                    className="w-10 h-10 rounded-full bg-[#f0ece0] flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-bold text-[#38240d] w-16 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 0.5)}
                    className="w-10 h-10 rounded-full bg-[#f0ece0] flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-[#a08a6a]">{selectedFood.servingUnit}(s)</span>
                </div>
                <p className="text-xs text-[#713600] mt-2">
                  Total: {Math.round(selectedFood.calories * quantity)} kcal · {Math.round(selectedFood.proteinG * quantity * 10) / 10}g P
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#713600] block mb-2">Meal Slot</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setMealSlot(s)}
                      className={`py-2.5 rounded-[12px] text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        mealSlot === s ? 'bg-[#c05800] text-white' : 'bg-[#f0ece0] text-[#a08a6a] hover:bg-[#e8e4d0]'
                      }`}
                    >
                      {s === 'snacks' ? 'Snack' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddToMeal}
                disabled={addingToMeal}
                className="w-full py-3.5 rounded-[16px] bg-[#c05800] text-white font-bold text-base shadow-[0_4px_16px_rgba(192,88,0,0.35)] disabled:opacity-50 active:scale-[0.98] transition-transform cursor-pointer"
              >
                {addingToMeal ? 'Adding…' : `Add ${quantity} × ${selectedFood.name} to ${mealSlot}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}