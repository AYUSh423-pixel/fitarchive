import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { updateDatabase } from '@/lib/db/local-store';
import type { FoodItem, Recipe } from '@/types/nutrifit';

export async function GET(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  const { db } = guard;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const category = (searchParams.get('category') || '').trim();
  const tag = (searchParams.get('tag') || '').trim().toLowerCase();

  let foods = db.foods.filter((f) => f.isVegetarian && !f.hasEgg);
  if (q) {
    foods = foods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.regionalName && f.regionalName.toLowerCase().includes(q)) ||
        f.category.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (category && category !== 'All') {
    foods = foods.filter((f) => f.category === category);
  }
  if (tag) {
    foods = foods.filter((f) => f.tags.some((t) => t.toLowerCase().includes(tag)));
  }

  let recipes = db.recipes.filter((r) => r.isVegetarian && !r.hasEgg);
  if (q) {
    recipes = recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({ foods, recipes });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    if (body.type === 'recipe') {
      const recipe: Recipe = {
        id: `rec-${crypto.randomBytes(4).toString('hex')}`,
        userId: guard.session.userId,
        name: String(body.name || 'Custom Homemade Recipe'),
        description: String(body.description || 'Custom pure-vegetarian Indian homemade dish'),
        category: String(body.category || 'Homemade Custom'),
        prepTimeMin: Number(body.prepTimeMin || 20),
        servings: Number(body.servings || 1),
        caloriesPerServing: Number(body.caloriesPerServing || 0),
        proteinPerServing: Number(body.proteinPerServing || 0),
        carbsPerServing: Number(body.carbsPerServing || 0),
        fatPerServing: Number(body.fatPerServing || 0),
        ingredients: body.ingredients || [],
        instructions: body.instructions || ['Prepare fresh at home with measured oil/ghee.'],
        oilGheeNotes: String(body.oilGheeNotes || 'Cooking oil/ghee accounted in totals.'),
        difficulty: body.difficulty === 'Medium' ? 'Medium' : 'Easy',
        tags: ['custom', 'homemade', 'pure-veg'],
        isVegetarian: true,
        hasEgg: false,
      };
      updateDatabase((draft) => {
        draft.recipes.unshift(recipe);
      });
      return NextResponse.json({ recipe }, { status: 201 });
    }

    const food: FoodItem = {
      id: `food-${crypto.randomBytes(4).toString('hex')}`,
      userId: guard.session.userId,
      name: String(body.name || 'Custom Indian Food'),
      regionalName: body.regionalName ? String(body.regionalName) : undefined,
      category: body.category || 'Gujarati & Regional',
      calories: Number(body.calories || 0),
      proteinG: Number(body.proteinG || 0),
      carbsG: Number(body.carbsG || 0),
      fatG: Number(body.fatG || 0),
      fiberG: Number(body.fiberG || 0),
      servingSize: Number(body.servingSize || 1),
      servingUnit: body.servingUnit || 'bowl',
      weightGrams: Number(body.weightGrams || 100),
      state: body.state || 'cooked',
      source: 'User Custom Recipe / Homemade',
      confidence: body.confidence === 'verified' ? 'verified' : 'estimate',
      isVegetarian: true,
      hasEgg: false,
      oilOrGheeIncludedG: Number(body.oilOrGheeIncludedG || 0),
      tags: ['custom', 'homemade'],
    };

    updateDatabase((draft) => {
      draft.foods.unshift(food);
    });
    return NextResponse.json({ food }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
