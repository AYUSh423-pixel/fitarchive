'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, Clock, Plus, ShoppingCart, Utensils } from 'lucide-react';
import type { Recipe } from '@/types/nutrifit';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { SkeletonRecipeCard } from '@/components/ui/Skeleton';

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
    return <SkeletonRecipeCard />;
  }

  if (!recipe) {
    return (
      <Card variant="default" padding="xl" className="text-center max-w-xl mx-auto space-y-3">
        <p className="font-display font-bold text-lg">Recipe not found</p>
        <Link href="/explore" className="text-sm font-semibold text-[#c05800] underline">
          Back to Indian Food Explore
        </Link>
      </Card>
    );
  }

  const macroCal = Math.max(
    1,
    recipe.proteinPerServing * 4 + recipe.carbsPerServing * 4 + recipe.fatPerServing * 9
  );
  const pPct = Math.round(((recipe.proteinPerServing * 4) / macroCal) * 100);
  const cPct = Math.round(((recipe.carbsPerServing * 4) / macroCal) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-20">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#713600] hover:text-[#38240d]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <Card variant="white" padding="lg" className="space-y-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#713600]" />
            <h1 className="font-display text-2xl font-bold text-[#38240d]">{recipe.name}</h1>
          </div>
        </div>

        <p className="text-sm text-[#713600] leading-relaxed">{recipe.description}</p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="default" size="sm" leftIcon={<Clock className="w-3.5 h-3.5" />}>
            {recipe.prepTimeMin} mins • {recipe.difficulty}
          </Badge>
          <Badge variant="secondary" size="sm">
            {recipe.servings} Serving • Pure Veg (No Egg)
          </Badge>
        </div>

        {/* Macro Impact Bar */}
        <div className="space-y-3 pt-3 border-t border-[#f0ece0]">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-[#713600]">Macro Impact</span>
            <div className="text-right">
              <span className="font-display text-2xl font-bold text-[#38240d]">
                {recipe.caloriesPerServing} kcal
              </span>
              <span className="block text-xs font-bold text-[#713600]">
                {recipe.proteinPerServing}g Protein
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#f0ece0]">
            <div className="bg-[#713600]" style={{ width: `${pPct}%` }} />
            <div className="bg-[#c05800]" style={{ width: `${cPct}%` }} />
            <div className="bg-[#5d4037]" style={{ width: `${fPct}%` }} />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-[#a08a6a]">
            <span>{pPct}% Protein</span>
            <span>{cPct}% Carbs</span>
            <span>{fPct}% Fat</span>
          </div>
        </div>

        {/* Ingredients Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-[#38240d]">Ingredients</h2>
            <span className="text-xs font-bold text-[#713600]">
              {checkedCount} of {recipe.ingredients.length} Ready
            </span>
          </div>

          {addedMsg && (
            <div className="p-2.5 rounded-2xl bg-[#f5f2e0] text-[#713600] text-xs font-semibold flex items-center gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <ShoppingCart className="w-3.5 h-3.5" /> {addedMsg}
            </div>
          )}

          <div className="space-y-2">
            {recipe.ingredients.map((ing, idx) => {
              const checked = Boolean(checkedIngredients[idx]);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#f5f2e0] flex items-center justify-between gap-2 transition-colors hover:bg-[#e8e4d0]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className="flex items-center gap-2.5 text-left cursor-pointer flex-1"
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        checked
                          ? 'bg-[#c05800] border-[#c05800] text-white'
                          : 'bg-white border-[#e8e4d0] hover:border-[#c05800]'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-xs font-semibold text-[#38240d]">{ing.name}</span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-[#713600]">{ing.quantity}</span>
                    {!checked && (
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<Plus className="w-3 h-3" />}
                        onClick={() => handleAddToGrocery(ing.name, ing.quantity)}
                        className="text-[#c05800]"
                      >
                        Add to list
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Oil / Ghee Transparency Note */}
        <div className="p-4 rounded-2xl bg-[#fff3e0] text-xs text-[#a04800] border border-[#ffe0b2]">
          <strong>Cooking Fat Note:</strong> {recipe.oilGheeNotes}
        </div>

        {/* Preparation Instructions */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-sm text-[#38240d]">Preparation Instructions</h2>
          <ol className="space-y-3 list-decimal pl-5 text-xs text-[#713600] leading-relaxed">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="relative pl-2">{step}</li>
            ))}
          </ol>
        </div>

        <Button
          onClick={handleLogToDiary}
          className="w-full"
          size="lg"
          leftIcon={<Utensils className="w-4 h-4 text-[#c05800]" />}
        >
          Add to Today's Diary (+{recipe.caloriesPerServing} kcal)
        </Button>
      </Card>
    </div>
  );
}