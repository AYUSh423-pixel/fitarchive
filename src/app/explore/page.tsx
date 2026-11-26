'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  CalendarDays,
  Dumbbell,
  TrendingUp,
  Droplets,
  ShoppingCart,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Sparkles,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import type { FoodItem, Recipe, MealSlot } from '@/types/nutrifit';
import { getFoodVisual } from '@/lib/food-visuals';

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
        if (categories.length <= 1 && d.foods && d.foods.length > 0) {
          const uniqueCats = [...new Set(d.foods.map((f) => f.category))].sort();
          setCategories(['All', ...uniqueCats]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [query, activeFilter, categories.length]);

  // Load categories on initial mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/foods', { cache: 'no-store' });
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

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const handleAddToMeal = async () => {
    if (!selectedFood) return;
    setAddingToMeal(true);
    try {
      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealSlot,
          items: [
            {
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
            },
          ],
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
    <div className="space-y-5 max-w-2xl mx-auto pb-12">
      {/* Search bar */}
      <div className="flex items-center gap-3 card-minimal px-4 py-3 shadow-xs animate-fade-in focus-within:ring-2 focus-within:ring-[#B45309]/20 focus-within:border-[#B45309] transition-all">
        <Search className="w-5 h-5 text-[#8C827A] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dal, paneer, roti, sabzi…"
          className="flex-1 bg-transparent text-sm text-[#1C1917] placeholder-[#8C827A] focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="w-6 h-6 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#8C827A] hover:text-[#1C1917]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar animate-fade-in">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveFilter(cat);
              setQuery('');
            }}
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

      {/* When a specific category or query is active -> Show Visual Food Cards */}
      {query || activeFilter !== 'All' ? (
        <div className="animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeFilter !== 'All' && !query && (
                <button
                  onClick={() => setActiveFilter('All')}
                  className="flex items-center gap-1 text-xs font-bold text-[#B45309] hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> All Categories
                </button>
              )}
              <h3 className="font-bold text-[#1C1917] text-base">
                {activeFilter !== 'All' ? activeFilter : 'Search Results'}
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#8C827A]">
              {loading ? 'Loading…' : `${foods.length} items`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="card-minimal h-64 animate-pulse bg-white/70" />
              ))}
            </div>
          ) : foods.length === 0 ? (
            <div className="card-minimal p-8 text-center text-[#8C827A]">
              <p className="font-semibold text-sm">No dishes found matching your selection.</p>
              <button
                onClick={() => {
                  setActiveFilter('All');
                  setQuery('');
                }}
                className="mt-3 px-4 py-2 rounded-full bg-[#B45309] text-white text-xs font-bold tactile-press-sm cursor-pointer"
              >
                Browse All Foods
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {foods.map((food) => {
                const visual = getFoodVisual(food);
                return (
                  <div
                    key={food.id}
                    className="card-minimal overflow-hidden flex flex-col hover:border-[#B45309]/40 transition-all tactile-press-sm bg-white"
                  >
                    {/* Food Photo Banner */}
                    <div className="relative h-36 w-full bg-[#FAF8F5] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={visual.image}
                        alt={food.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-[#1C1917] shadow-xs flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#B45309] fill-current" />
                        <span>{food.calories} kcal</span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#1C1917]/80 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                        {food.proteinG}g Protein
                      </div>
                    </div>

                    {/* Food Details & Description */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-sm text-[#1C1917] leading-snug line-clamp-1">
                            {food.name}
                          </h4>
                        </div>
                        {food.regionalName && (
                          <p className="text-[11px] font-semibold text-[#B45309] mt-0.5">
                            {food.regionalName}
                          </p>
                        )}
                        <p className="text-xs text-[#78716C] mt-1.5 line-clamp-2 leading-relaxed">
                          {visual.description}
                        </p>
                      </div>

                      {/* Macros row & Add Button */}
                      <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between">
                        <div className="text-[11px] text-[#8C827A]">
                          <span className="font-semibold text-[#1C1917]">{food.carbsG}g</span> C ·{' '}
                          <span className="font-semibold text-[#1C1917]">{food.fatG}g</span> F
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFood(food);
                            setQuantity(food.servingSize || 1);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#B45309] hover:bg-[#9a3412] text-white text-xs font-bold shadow-xs tactile-press-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Meal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Indian food database category tiles */}
          <div className="animate-fade-in-up">
            <h3 className="font-bold text-[#1C1917] text-base mb-3">Indian food categories</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {categories
                .filter((c) => c !== 'All')
                .map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className="card-minimal p-4 text-left w-full cursor-pointer tactile-press flex items-center justify-between hover:border-[#B45309]/30 transition-all bg-white"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#1C1917]">{cat}</p>
                      <p className="text-[11px] text-[#8C827A] mt-0.5">Browse dishes</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0">
                      <ChevronRight className="w-4 h-4 text-[#B45309]" />
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Plan & fitness tools */}
          <div className="animate-fade-in-up">
            <h3 className="font-bold text-[#1C1917] text-base mb-3">Plan & fitness tools</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="card-minimal p-3.5 flex items-center gap-3 hover:bg-[#FAF9F6] tactile-press w-full transition-all bg-white"
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

      {/* Add to Meal Centered Blur Popup Box (z-[100] with backdrop-blur-md overlayering app bar) */}
      {selectedFood && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          {/* Dismiss overlay */}
          <div
            className="absolute inset-0"
            onClick={() => setSelectedFood(null)}
          />

          {/* Centered Popup Box */}
          <div className="relative bg-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl border border-[#E7E3D8] animate-scale-in flex flex-col space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EFEA]">
              <div>
                <h3 className="font-bold text-base text-[#1C1917]">Add to Meal</h3>
                <p className="text-xs text-[#8C827A]">Choose portion & meal slot</p>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E7E3D8] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] tactile-press-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Food Thumbnail + Name */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E3D8]/60">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFoodVisual(selectedFood).image}
                  alt={selectedFood.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#1C1917] truncate">{selectedFood.name}</h4>
                <p className="text-xs text-[#8C827A] mt-0.5">
                  {selectedFood.calories} kcal · {selectedFood.proteinG}g protein
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="text-xs font-bold text-[#1C1917] block mb-2">Quantity / Portions</label>
              <div className="flex items-center justify-between bg-[#FAF8F5] p-2 rounded-2xl border border-[#E7E3D8]/60">
                <button
                  onClick={() => setQuantity(Math.max(0.5, +(quantity - 0.5).toFixed(1)))}
                  className="w-9 h-9 rounded-xl bg-white border border-[#E7E3D8] flex items-center justify-center text-[#1C1917] tactile-press-sm cursor-pointer hover:border-[#B45309]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-xl font-bold text-[#1C1917]">{quantity}</span>
                  <span className="text-xs font-semibold text-[#8C827A] ml-1.5">
                    {selectedFood.servingUnit}(s)
                  </span>
                </div>
                <button
                  onClick={() => setQuantity(+(quantity + 0.5).toFixed(1))}
                  className="w-9 h-9 rounded-xl bg-white border border-[#E7E3D8] flex items-center justify-center text-[#1C1917] tactile-press-sm cursor-pointer hover:border-[#B45309]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs font-semibold text-[#B45309] bg-[#FFF7ED] border border-[#FED7AA]/50 p-2 rounded-xl flex items-center justify-between">
                <span>
                  Total: {Math.round(selectedFood.calories * quantity)} kcal ·{' '}
                  {(selectedFood.proteinG * quantity).toFixed(1)}g Protein
                </span>
                <span>{Math.round(selectedFood.weightGrams * quantity)}g</span>
              </div>
            </div>

            {/* Meal Slot Selector */}
            <div>
              <label className="text-xs font-bold text-[#1C1917] block mb-2">Meal Slot</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setMealSlot(s)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer tactile-press-sm ${
                      mealSlot === s
                        ? 'bg-[#B45309] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#78716C] border border-[#E7E3D8]/60 hover:bg-white'
                    }`}
                  >
                    {s === 'snacks' ? 'Snack' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                onClick={handleAddToMeal}
                disabled={addingToMeal}
                className="w-full py-3.5 rounded-2xl bg-[#B45309] hover:bg-[#9a3412] text-white font-bold text-sm shadow-[0_4px_16px_rgba(180,83,9,0.3)] disabled:opacity-50 tactile-press transition-all cursor-pointer"
              >
                {addingToMeal
                  ? 'Saving to Log…'
                  : `Add ${quantity} × ${selectedFood.name} to ${mealSlot}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
