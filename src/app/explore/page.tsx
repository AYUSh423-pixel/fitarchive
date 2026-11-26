'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, CalendarDays, Dumbbell, TrendingUp, Droplets, ShoppingCart, BarChart3, ChevronRight, X, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import type { FoodItem, Recipe, MealSlot } from '@/types/nutrifit';

const FOOD_CATEGORIES = [
  { label: 'Dal', color: '#f5f2e0', textColor: '#713600' },
  { label: 'Sabzi', color: '#fff3e0', textColor: '#c05800' },
  { label: 'Roti & rice', color: '#fff3e0', textColor: '#a04800' },
  { label: 'Paneer', color: '#efebe9', textColor: '#5d4037' },
  { label: 'Snacks', color: '#f5f2e0', textColor: '#713600' },
  { label: 'Sweets', color: '#ffe0b2', textColor: '#c05800' },
];

const TOOLS = [
  { label: 'Meal planner', icon: <CalendarDays className="w-5 h-5 text-[#c05800]" />, href: '/planner' },
  { label: 'Gym & workouts', icon: <Dumbbell className="w-5 h-5 text-[#c05800]" />, href: '/workouts' },
  { label: 'Transformation', icon: <TrendingUp className="w-5 h-5 text-[#c05800]" />, href: '/progress' },
  { label: 'Water & habits', icon: <Droplets className="w-5 h-5 text-[#c05800]" />, href: '/habits' },
  { label: 'Grocery & budget', icon: <ShoppingCart className="w-5 h-5 text-[#c05800]" />, href: '/grocery' },
  { label: 'Analytics', icon: <BarChart3 className="w-5 h-5 text-[#c05800]" />, href: '/analytics' },
];

const FILTER_CHIPS = ['All', 'Dal', 'Sabzi', 'Roti & rice', 'Paneer'];

export default function IndianFoodExplorePage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [foods, setFoods] = useState<FoodItem[]>([]);
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
        const d = await res.json();
        setFoods(d.foods || []);
      }
    } finally {
      setLoading(false);
    }
  }, [query, activeFilter]);

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
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Search bar */}
      <div className="flex items-center gap-3 bg-white rounded-[16px] px-4 py-3 shadow-sm border border-[#e8e4d0]">
        <Search className="w-5 h-5 text-[#a08a6a] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dal, paneer, roti…"
          className="flex-1 bg-transparent text-sm text-[#38240d] placeholder-[#a08a6a] focus:outline-none"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeFilter === chip
                ? 'bg-[#38240d] text-white'
                : 'bg-white text-[#38240d] border border-[#e8e4d0] shadow-sm hover:border-[#c05800]'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Food search results / categories */}
      {query || activeFilter !== 'All' ? (
        <div>
          <h3 className="font-bold text-[#38240d] text-base mb-3">
            {loading ? 'Searching…' : `${foods.length} results`}
          </h3>
          <div className="space-y-2">
            {foods.slice(0, 20).map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="bg-white rounded-[16px] p-3.5 shadow-sm flex items-center justify-between gap-3 text-left w-full cursor-pointer hover:bg-[#faf9f5] transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#38240d] truncate">{food.name}</p>
                  <p className="text-xs text-[#a08a6a]">{food.calories} kcal · {food.proteinG}g P · {food.weightGrams}g serving</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#a08a6a] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Indian food database categories - single column ascending */}
          <div>
            <h3 className="font-bold text-[#38240d] text-base mb-3">Indian food database</h3>
            <div className="space-y-2.5">
              {FOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveFilter(cat.label)}
                  className="rounded-[16px] p-4 text-left w-full cursor-pointer active:scale-[0.97] transition-transform flex items-center gap-3"
                  style={{ backgroundColor: cat.color }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                    <ChevronRight className="w-5 h-5" style={{ color: cat.textColor }} />
                  </div>
                  <p className="font-bold text-base" style={{ color: cat.textColor }}>{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Plan & fitness tools - single column ascending */}
          <div>
            <h3 className="font-bold text-[#38240d] text-base mb-3">Plan & fitness</h3>
            <div className="space-y-2.5">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="bg-white rounded-[16px] p-4 shadow-sm flex items-center gap-3 hover:bg-[#faf9f5] active:scale-[0.97] transition-transform w-full"
                >
                  <div className="w-12 h-12 rounded-full bg-[#fff3e0] flex items-center justify-center shrink-0">
                    {tool.icon}
                  </div>
                  <p className="font-semibold text-base text-[#38240d]">{tool.label}</p>
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