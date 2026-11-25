import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/api-guard';
import { updateDatabase } from '@/lib/db/local-store';
import type { GroceryItem } from '@/types/nutrifit';

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;
  return NextResponse.json({ groceryLists: guard.db.groceryLists });
}

export async function POST(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const listId = String(body.listId || guard.db.groceryLists[0]?.id || '');

    const newItem: GroceryItem = {
      id: `g-${crypto.randomBytes(4).toString('hex')}`,
      name: String(body.name || 'New Grocery Item'),
      category: String(body.category || 'Pantry'),
      quantity: String(body.quantity || '1 unit'),
      estimatedCostInr: Number(body.estimatedCostInr || 0),
      purchased: false,
      isBudgetProteinTip: Boolean(body.isBudgetProteinTip),
    };

    updateDatabase((draft) => {
      const list = draft.groceryLists.find((g) => g.id === listId) || draft.groceryLists[0];
      if (list) {
        list.items.unshift(newItem);
        list.updatedAt = new Date().toISOString();
      }
    });

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const { listId, itemId, purchased, estimatedCostInr, quantity } = body;

    updateDatabase((draft) => {
      const list = draft.groceryLists.find((g) => g.id === listId) || draft.groceryLists[0];
      if (!list) return;
      const item = list.items.find((i) => i.id === itemId);
      if (!item) return;
      if (typeof purchased === 'boolean') item.purchased = purchased;
      if (estimatedCostInr !== undefined) item.estimatedCostInr = Number(estimatedCostInr);
      if (quantity !== undefined) item.quantity = String(quantity);
      list.updatedAt = new Date().toISOString();
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
