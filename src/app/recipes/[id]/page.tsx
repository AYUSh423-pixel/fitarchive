'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, Clock, Plus, ShoppingCart, Utensils } from 'lucide-react';
import type { Recipe } from '@/types/nutrifit';

export default function RecipeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = String(params.id || '');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    fetch('/api/foods')
      .then((r) => r.json())
      .then((d) => {
        const found = (d.recipes || []).find((r: Recipe) => r.id === recipeId) || null;
        setRecipe(found);
        if (found) {
          const init: Record<number, boolean> = {};
          found.ingredients.forEach((ing: { inPantry?: boolean }, idx: number) => {
            init[idx] = ing.inPantry !== false;
          });
          setCheckedIngredients(init);
        }
      })
      .finally(() => setLoading(false));
  }, [recipeId]);

  const handleLogToDiary = async () => {
    if (!recipe) return;
    const res = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealSlot: 'dinner',
        foodName: recipe.name,
        quantity: 1,
        unit: 'serving',
        weightGrams: 250,
        calories: recipe.caloriesPerServing,
        proteinG: recipe.proteinPerServing,
        carbsG: recipe.carbsPerServing,
        fatG: recipe.fatPerServing,
        loggingMethod: 'manual',
        confidence: 'verified',
        oilGheeGrams: 5,
      }),
    });
    if (res.ok) {
      router.push('/diary');
    }
  };

  const handleAddToGrocery = async (name: string, quantity: string) => {
    const res = await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity, category: 'Recipe Ingredient', estimatedCostInr: 80 }),
    });
    if (res.ok) {
      setAddedMsg(`Added "${name}" to your Grocery List!`);
      setTimeout(() => setAddedMsg(''), 2500);
    }
  };

  if (loading) {
    return <div className="h-72 rounded-3xl bg-white animate-pulse max-w-xl mx-auto" />;
  }

  if (!recipe) {
    return (
      <div className="tactile-card p-8 text-center max-w-xl mx-auto space-y-3">
        <p className="font-display font-bold text-lg">Recipe not found</p>
        <Link href="/explore" className="text-sm font-semibold text-[#944A00] underline">
          Back to Indian Food Explore
        </Link>
      </div>
    );
  }

  const macroCal = Math.max(
    1,
    recipe.proteinPerServing * 4 + recipe.carbsPerServing * 4 + recipe.fatPerServing * 9
  );
  const pPct = Math.round(((recipe.proteinPerServing * 4) / macroCal) * 100);
  const cPct = Math.round(((recipe.carbsPerServing * 4) / macroCal) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#554337] hover:text-[#1B1B1E]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <section className="tactile-card-white p-6 space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#006C4B]" />
            <h1 className="font-display text-2xl font-bold text-[#1B1B1E]">{recipe.name}</h1>
          </div>
        </div>

        <p className="text-sm text-[#554337] leading-relaxed">{recipe.description}</p>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-xs font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {recipe.prepTimeMin} mins • {recipe.difficulty}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#E8DDFF] text-[#482995] text-xs font-bold">
            {recipe.servings} Serving • Pure Veg (No Egg)
          </span>
        </div>

        {/* Macro Impact Bar (Matching Stitch Explore Featured Card) */}
        <div className="space-y-2 pt-2 border-t border-[#F0EDF1]">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-[#554337]">Macro Impact</span>
            <div className="text-right">
              <span className="font-display text-2xl font-bold text-[#1B1B1E]">
                {recipe.caloriesPerServing} kcal
              </span>
              <span className="block text-xs font-bold text-[#006C4B]">
                {recipe.proteinPerServing}g Protein
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#F0EDF1]">
            <div className="bg-[#006C4B]" style={{ width: `${pPct}%` }} />
            <div className="bg-[#FB923C]" style={{ width: `${cPct}%` }} />
            <div className="bg-[#674BB5]" style={{ width: `${fPct}%` }} />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-[#554337]">
            <span>{pPct}% Protein</span>
            <span>{cPct}% Carbs</span>
            <span>{fPct}% Fat</span>
          </div>
        </div>

        {/* Ingredients Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-[#1B1B1E]">Ingredients</h2>
            <span className="text-xs font-bold text-[#006C4B]">
              {Object.values(checkedIngredients).filter(Boolean).length} of {recipe.ingredients.length} Ready
            </span>
          </div>

          {addedMsg && (
            <div className="p-2.5 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" /> {addedMsg}
            </div>
          )}

          <div className="space-y-2">
            {recipe.ingredients.map((ing, idx) => {
              const checked = Boolean(checkedIngredients[idx]);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#F5F3F6] flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className="flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        checked
                          ? 'bg-[#006C4B] border-[#006C4B] text-white'
                          : 'bg-white border-[#887365]'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-xs font-semibold text-[#1B1B1E]">{ing.name}</span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-[#554337]">{ing.quantity}</span>
                    {!checked && (
                      <button
                        type="button"
                        onClick={() => handleAddToGrocery(ing.name, ing.quantity)}
                        className="text-[11px] font-bold text-[#944A00] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add to list
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Oil / Ghee Transparency Note */}
        <div className="p-3.5 rounded-2xl bg-[#FFEDD5]/70 text-xs text-[#7C2D12]">
          <strong>Cooking Fat Note:</strong> {recipe.oilGheeNotes}
        </div>

        {/* Preparation Instructions */}
        <div className="space-y-2">
          <h2 className="font-display font-bold text-sm text-[#1B1B1E]">Preparation Instructions</h2>
          <ol className="space-y-2 list-decimal pl-5 text-xs text-[#554337] leading-relaxed">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <button
          onClick={handleLogToDiary}
          className="w-full py-3.5 rounded-full bg-[#1B1B1E] hover:bg-[#303033] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Utensils className="w-4 h-4 text-[#FB923C]" />
          <span>Add to Today&apos;s Diary (+{recipe.caloriesPerServing} kcal)</span>
        </button>
      </section>
    </div>
  );
}
