'use client';

import React, { useEffect, useState } from 'react';
import { Check, IndianRupee, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import type { GroceryList } from '@/types/nutrifit';

export default function GroceryPage() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('500 g');
  const [newItemCost, setNewItemCost] = useState(100);

  const loadGrocery = async () => {
    const res = await fetch('/api/grocery', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setLists(d.groceryLists || []);
    }
  };

  useEffect(() => {
    loadGrocery();
  }, []);

  const activeList = lists[0] || null;

  const togglePurchased = async (itemId: string, purchased: boolean) => {
    if (!activeList) return;
    await fetch('/api/grocery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: activeList.id, itemId, purchased }),
    });
    loadGrocery();
  };

  const updatePrice = async (itemId: string, estimatedCostInr: number) => {
    if (!activeList) return;
    await fetch('/api/grocery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId: activeList.id, itemId, estimatedCostInr }),
    });
    loadGrocery();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await fetch('/api/grocery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listId: activeList?.id,
        name: newItemName,
        quantity: newItemQty,
        estimatedCostInr: newItemCost,
      }),
    });
    setNewItemName('');
    loadGrocery();
  };

  const totalCost = activeList?.items.reduce((s, i) => s + (i.estimatedCostInr || 0), 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <section className="tactile-card-white p-5 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#944A00]">
            {activeList?.period || 'Weekly'} Shopping List
          </span>
          <h2 className="font-display text-xl font-bold text-[#1B1B1E]">Grocery &amp; Budget</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#554337]">Estimated Total</p>
          <p className="font-display text-2xl font-bold text-[#006C4B] flex items-center justify-end">
            <IndianRupee className="w-5 h-5" />
            {totalCost.toLocaleString('en-IN')}
          </p>
        </div>
      </section>

      <div className="p-4 rounded-3xl bg-[#FEF08A]/70 border border-[#FB923C]/30 text-xs text-[#78350F] space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Budget-Friendly Pure-Veg Protein Tips
        </p>
        <p>
          • <strong>Soya Chunks (~₹95 / 500g):</strong> Gives ~260g pure protein — cheapest high-protein staple!
        </p>
        <p>
          • <strong>Moong / Masoor Dal + Homemade Hung Curd:</strong> High-satiety, affordable daily protein.
        </p>
      </div>

      <form onSubmit={handleAddItem} className="tactile-card-white p-4 grid grid-cols-12 gap-2">
        <input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add item (e.g. Besan, Tofu)"
          className="col-span-6 tactile-input px-3 py-2 text-xs"
        />
        <input
          value={newItemQty}
          onChange={(e) => setNewItemQty(e.target.value)}
          placeholder="Qty"
          className="col-span-3 tactile-input px-2.5 py-2 text-xs"
        />
        <button
          type="submit"
          className="col-span-3 rounded-2xl bg-[#FB923C] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </form>

      {activeList && (
        <div className="space-y-2.5">
          {activeList.items.map((item) => (
            <div
              key={item.id}
              className={`tactile-card-white p-4 flex items-center justify-between gap-3 ${
                item.purchased ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => togglePurchased(item.id, !item.purchased)}
                className="flex items-center gap-3 text-left cursor-pointer"
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    item.purchased
                      ? 'bg-[#006C4B] border-[#006C4B] text-white'
                      : 'bg-white border-[#887365]'
                  }`}
                >
                  {item.purchased && <Check className="w-3.5 h-3.5" />}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${item.purchased ? 'line-through' : ''}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-[#554337]">
                    {item.quantity} • {item.category}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-[#554337]">₹</span>
                <input
                  type="number"
                  value={item.estimatedCostInr}
                  onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                  aria-label={`Price for ${item.name}`}
                  className="tactile-input w-20 px-2.5 py-1 text-xs font-bold text-right"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
