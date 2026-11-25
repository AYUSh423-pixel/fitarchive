import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { todayIsoDate, updateDatabase } from '@/lib/db/local-store';
import { generateMealPlanDays } from '@/lib/ai-engine';
import type { GroceryItem, MealPlan, MealSlot } from '@/types/nutrifit';

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  return NextResponse.json({
    mealPlans: guard.db.mealPlans,
    targets: guard.db.nutritionTargets,
  });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();

    if (body.action === 'substitute') {
      const { planId, dayNumber, mealSlot, replacementTitle, replacementCalories, replacementProteinG } = body;
      let updatedPlan: MealPlan | null = null;
      updateDatabase((draft) => {
        const plan = draft.mealPlans.find((p) => p.id === planId);
        if (!plan) return;
        const day = plan.days.find((d) => d.dayNumber === Number(dayNumber));
        if (!day) return;
        const slot = mealSlot as MealSlot;
        day.meals[slot] = {
          title: String(replacementTitle),
          items: [
            {
              name: String(replacementTitle),
              quantity: '1 serving',
              calories: Number(replacementCalories),
              proteinG: Number(replacementProteinG),
              carbsG: 35,
              fatG: 12,
            },
          ],
          totalCalories: Number(replacementCalories),
          totalProteinG: Number(replacementProteinG),
          prepNotes: 'Substituted while keeping daily calorie & protein targets aligned.',
        };
        updatedPlan = plan;
      });
      return NextResponse.json({ mealPlan: updatedPlan });
    }

    const planType = (body.planType || '7_day') as MealPlan['planType'];
    const targetCalories = guard.db.nutritionTargets.caloriesKcal;
    const targetProteinG = guard.db.nutritionTargets.proteinG;
    const days = generateMealPlanDays(planType, targetCalories, targetProteinG);

    const newPlan: MealPlan = {
      id: `plan-${crypto.randomBytes(4).toString('hex')}`,
      userId: guard.session.userId,
      planType,
      startDate: todayIsoDate(),
      days,
      targetCalories,
      targetProteinG,
      createdAt: new Date().toISOString(),
    };

    // Also auto-sync a grocery list if requested
    let generatedGroceryItems: GroceryItem[] | null = null;
    if (body.generateGrocery) {
      const period = planType === '30_day' ? 'monthly' : 'weekly';
      const mult = period === 'monthly' ? 4 : 1;
      generatedGroceryItems = [
        { id: `g-${Date.now()}-1`, name: 'Low-Fat Paneer', category: 'Protein', quantity: `${1 * mult} kg`, estimatedCostInr: 420 * mult, purchased: false },
        { id: `g-${Date.now()}-2`, name: 'Soya Chunks (Budget Protein)', category: 'Budget Protein', quantity: `${500 * mult} g`, estimatedCostInr: 95 * mult, purchased: false, isBudgetProteinTip: true },
        { id: `g-${Date.now()}-3`, name: 'Yellow Moong Dal & Toor Dal', category: 'Dal & Legumes', quantity: `${1 * mult} kg`, estimatedCostInr: 150 * mult, purchased: false, isBudgetProteinTip: true },
        { id: `g-${Date.now()}-4`, name: 'Hung Curd / Toned Milk', category: 'Dairy', quantity: `${3.5 * mult} L`, estimatedCostInr: 210 * mult, purchased: false, isBudgetProteinTip: true },
        { id: `g-${Date.now()}-5`, name: 'Whole Wheat Atta & Basmati Rice', category: 'Grains', quantity: `${2.5 * mult} kg`, estimatedCostInr: 170 * mult, purchased: false },
        { id: `g-${Date.now()}-6`, name: 'Fresh Greens, Cucumber, Tomato, Onion', category: 'Vegetables', quantity: `${2.5 * mult} kg`, estimatedCostInr: 180 * mult, purchased: false },
        { id: `g-${Date.now()}-7`, name: 'Bananas & Apples', category: 'Fruits', quantity: `${12 * mult} pcs`, estimatedCostInr: 160 * mult, purchased: false },
      ];
    }

    updateDatabase((draft) => {
      draft.mealPlans.unshift(newPlan);
      if (generatedGroceryItems) {
        draft.groceryLists.unshift({
          id: `groc-${crypto.randomBytes(4).toString('hex')}`,
          userId: guard.session.userId,
          period: planType === '30_day' ? 'monthly' : 'weekly',
          items: generatedGroceryItems,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return NextResponse.json({ mealPlan: newPlan }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
