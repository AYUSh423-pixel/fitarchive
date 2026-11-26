'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, CalendarDays, Dumbbell, TrendingUp, Droplets, ShoppingCart, BarChart3, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { FoodItem, Recipe } from '@/types/nutrifit';

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

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#a08a6a]">FOOD DATABASE & TOOLS</p>
          <h2 className="font-display text-[26px] font-bold text-[#38240d] tracking-tight leading-tight">
            Explore
          </h2>
        </div>
        <Link href="/profile" className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-bold text-[#c05800] text-lg shadow-sm border border-[#e8e4d0]">
          A
        </Link>
      </div>

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

      {/* Food search results */}
      {query || activeFilter !== 'All' ? (
        <div>
          <h3 className="font-bold text-[#38240d] text-base mb-3">
            {loading ? 'Searching…' : `${foods.length} results`}
          </h3>
          <div className="space-y-2">
            {foods.slice(0, 20).map((food) => (
              <div key={food.id} className="bg-white rounded-[16px] p-3.5 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#38240d] truncate">{food.name}</p>
                  <p className="text-xs text-[#a08a6a]">{food.calories} kcal · {food.proteinG}g P · {food.weightGrams}g serving</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#a08a6a] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Indian food database categories */}
          <div>
            <h3 className="font-bold text-[#38240d] text-base mb-3">Indian food database</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {FOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveFilter(cat.label)}
                  className="rounded-[16px] p-3.5 text-left relative overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: cat.color }}
                >
                  <ChevronRight className="absolute top-2.5 right-2.5 w-3.5 h-3.5" style={{ color: cat.textColor, opacity: 0.7 }} />
                  <p className="font-bold text-sm mt-4" style={{ color: cat.textColor }}>{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Plan & fitness tools */}
          <div>
            <h3 className="font-bold text-[#38240d] text-base mb-3">Plan & fitness</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {TOOLS.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="bg-white rounded-[16px] p-4 shadow-sm flex flex-col gap-2.5 hover:bg-[#faf9f5] active:scale-[0.97] transition-transform"
                >
                  <div className="w-9 h-9 rounded-full bg-[#fff3e0] flex items-center justify-center">
                    {tool.icon}
                  </div>
                  <p className="font-semibold text-sm text-[#38240d]">{tool.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}