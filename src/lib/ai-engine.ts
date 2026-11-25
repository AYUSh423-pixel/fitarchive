import type {
  AiConfig,
  DatabaseState,
  FoodItem,
  FoodLog,
  FoodUnit,
  MealPlanDay,
  MealSlot,
} from '@/types/nutrifit';
import { todayIsoDate } from '@/lib/db/local-store';

export interface ScannedCandidateItem {
  tempId: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: FoodUnit;
  weightGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  oilGheeGrams: number;
  confidence: 'high' | 'medium' | 'low';
  sharePct: number;
}

export interface PhotoScanResult {
  mode: string;
  dishTitle: string;
  cuisineLabel: string;
  items: ScannedCandidateItem[];
  clarifyingQuestions: string[];
  disclaimer: string;
}

// Vidhyantra custom API: POST /api/v1/chat/ → { model, reply }
// Response field is "reply" not choices[0].message.content
const VIDHYANTRA_HOST = 'vidhyantra.online';

function isVidhyantraUrl(baseUrl: string) {
  try { return new URL(baseUrl).hostname.includes(VIDHYANTRA_HOST); } catch { return false; }
}

export async function callVidhyantraChat(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<string | null> {
  // Vidhyantra format: last user message goes as prompt, uses POST /chat/
  const chatUrl = baseUrl.replace(/\/+$/, '') + '/chat/';
  // Supported models: chatgpt56, code, quick, sol, terra, ultra
  // Default to 'ultra' (most capable)
  const vidhyantraModel = model && ['chatgpt56','code','quick','sol','terra','ultra'].includes(model)
    ? model : 'ultra';

  // Build a single prompt by combining system + user messages
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsg = messages.filter(m => m.role === 'user').pop();
  const combined = systemMsg
    ? `${systemMsg.content}\n\nUser: ${userMsg?.content || ''}`
    : (userMsg?.content || '');

  const res = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: vidhyantraModel,
      messages: [{ role: 'user', content: combined }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  // Vidhyantra returns { model, reply, created_at }
  return data?.reply || data?.choices?.[0]?.message?.content || null;
}

export function resolveAiCredentials(config?: AiConfig) {
  const provider = config?.provider || (process.env.AI_PROVIDER as any) || (process.env.AI_API_KEY ? 'custom' : process.env.OPENAI_API_KEY ? 'openai' : 'gemini');
  let apiKey = config?.apiKey || process.env.AI_API_KEY || '';

  if (!apiKey) {
    if (provider === 'gemini') apiKey = process.env.GEMINI_API_KEY || '';
    else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY || '';
    else if (provider === 'groq') apiKey = process.env.GROQ_API_KEY || '';
  }

  let model = config?.model || process.env.AI_MODEL || '';
  if (!model) {
    if (provider === 'gemini') model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    else if (provider === 'groq') model = 'llama-3.3-70b-versatile';
    else if (provider === 'openrouter') model = 'google/gemini-2.0-flash-001';
    else if (provider === 'custom') model = 'ultra'; // default for Vidhyantra
    else model = 'gpt-4o-mini';
  }

  let baseUrl = config?.baseUrl || process.env.AI_BASE_URL || '';
  if (!baseUrl) {
    if (provider === 'openai') baseUrl = 'https://api.openai.com/v1';
    else if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
    else if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';
  }

  return { provider, apiKey, model, baseUrl };
}

export async function analyzeFoodPhoto(
  base64Image: string,
  mimeType: string,
  foods: FoodItem[],
  hintText?: string,
  config?: AiConfig
): Promise<PhotoScanResult> {
  const { provider, apiKey, model, baseUrl } = resolveAiCredentials(config);

  if (apiKey) {
    try {
      const prompt = `You are a pure-vegetarian Indian nutritionist AI. Analyze this food photo${hintText ? ` (user hint: "${hintText}")` : ''}.
Identify each visible Indian food item, estimate serving size, weight in grams, calories, proteinG, carbsG, fatG, and likely oil/ghee in grams.
Respond ONLY in valid JSON with this exact shape:
{
  "dishTitle": "short title",
  "cuisineLabel": "e.g. Homemade North-Indian / Gujarati Thali",
  "items": [
    {
      "name": "Food Name",
      "quantity": 1,
      "unit": "bowl|piece|g|cup|tbsp|tsp|serving",
      "weightGrams": 150,
      "calories": 200,
      "proteinG": 10,
      "carbsG": 25,
      "fatG": 6,
      "oilGheeGrams": 4,
      "confidence": "high|medium|low",
      "sharePct": 35
    }
  ],
  "clarifyingQuestions": ["question about ghee/oil or portion size"]
}`;

      let jsonText: string | null = null;

      if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Image } },
                  ],
                },
              ],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        }
      } else if (isVidhyantraUrl(baseUrl)) {
        // Vidhyantra doesn't support image input — fall through to text-based hint
        // but still try text analysis with the hint
        if (hintText) {
          jsonText = await callVidhyantraChat(
            [{ role: 'user', content: `${prompt}\nFood description: ${hintText}` }],
            apiKey, baseUrl, model
          );
        }
      } else {
        // OpenAI / Groq / OpenRouter / Custom vision endpoint
        const targetUrl = `${(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://nutrifit.app', 'X-Title': 'NutriFit AI' } : {}),
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}` },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          jsonText = data?.choices?.[0]?.message?.content;
        }
      }

      if (jsonText) {
        const cleaned = jsonText.replace(/^```json/m, '').replace(/```$/m, '').trim();
        const parsed = JSON.parse(cleaned);
        const items: ScannedCandidateItem[] = (parsed.items || []).map((it: ScannedCandidateItem, idx: number) => ({
          ...it,
          tempId: `scan-${Date.now()}-${idx}`,
        }));
        return {
          mode: provider,
          dishTitle: parsed.dishTitle || 'Scanned Indian Meal',
          cuisineLabel: parsed.cuisineLabel || 'Homemade Indian • Estimated',
          items,
          clarifyingQuestions: parsed.clarifyingQuestions || [
            'Was extra ghee or butter added on top of the roti/dal?',
          ],
          disclaimer:
            'Photo-based nutrition values are AI estimates, not exact lab measurements. Please review and adjust before saving.',
        };
      }
    } catch {
      // Fall through cleanly to labelled local fallback
    }
  }

  // Labelled local fallback based on hintText or standard balanced veg thali
  const lower = (hintText || '').toLowerCase();
  if (lower) {
    const parsed = parseNaturalLanguageFood(hintText || '', foods);
    if (parsed.items.length > 0) {
      const totalCal = parsed.items.reduce((s, i) => s + i.calories, 0) || 1;
      return {
        mode: 'local_estimate',
        dishTitle: parsed.items.map((i) => i.name.split('(')[0].trim()).slice(0, 2).join(' & '),
        cuisineLabel: 'Local Estimate Mode (Add GEMINI_API_KEY for live vision)',
        items: parsed.items.map((it, idx) => ({
          tempId: `scan-local-${idx}`,
          foodId: it.foodId,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          weightGrams: it.weightGrams,
          calories: it.calories,
          proteinG: it.proteinG,
          carbsG: it.carbsG,
          fatG: it.fatG,
          oilGheeGrams: it.oilGheeGrams,
          confidence: 'medium',
          sharePct: Math.round((it.calories / totalCal) * 100),
        })),
        clarifyingQuestions: parsed.clarifyingQuestions,
        disclaimer:
          'Running in Local Estimate Mode (no GEMINI_API_KEY configured). Please confirm or edit each item and ghee/oil quantity before saving.',
      };
    }
  }

  // Default recognizable Indian veg thali candidate set for user confirmation
  return {
    mode: 'local_estimate',
    dishTitle: 'Paneer & Jeera Rice Thali',
    cuisineLabel: 'Local Estimate Mode • Confirm & Edit Items',
    items: [
      {
        tempId: 'scan-1',
        foodId: 'food-grilled-paneer-tikka',
        name: 'Paneer Curry / Grilled Paneer',
        quantity: 1,
        unit: 'bowl',
        weightGrams: 150,
        calories: 255,
        proteinG: 19,
        carbsG: 8,
        fatG: 16,
        oilGheeGrams: 5,
        confidence: 'medium',
        sharePct: 35,
      },
      {
        tempId: 'scan-2',
        foodId: 'food-jeera-rice',
        name: 'Jeera Basmati Rice',
        quantity: 1,
        unit: 'bowl',
        weightGrams: 140,
        calories: 185,
        proteinG: 3.8,
        carbsG: 38,
        fatG: 2.5,
        oilGheeGrams: 2.5,
        confidence: 'medium',
        sharePct: 28,
      },
      {
        tempId: 'scan-3',
        foodId: 'food-kachumber',
        name: 'Greens & Kachumber Salad',
        quantity: 1,
        unit: 'bowl',
        weightGrams: 100,
        calories: 40,
        proteinG: 1.5,
        carbsG: 7.5,
        fatG: 0.3,
        oilGheeGrams: 0,
        confidence: 'high',
        sharePct: 22,
      },
      {
        tempId: 'scan-4',
        foodId: 'food-ghee',
        name: 'Cooking Oil / Ghee Estimate',
        quantity: 1,
        unit: 'tsp',
        weightGrams: 5,
        calories: 45,
        proteinG: 0,
        carbsG: 0,
        fatG: 5,
        oilGheeGrams: 5,
        confidence: 'low',
        sharePct: 15,
      },
    ],
    clarifyingQuestions: [
      'Local Estimate Mode is active (configure GEMINI_API_KEY in .env.local for live photo vision). Do these items match your plate?',
      'How much ghee or cooking oil was used? (1 tsp adds ~45 kcal)',
      'Is your bowl small (~150g) or large (~250g)?',
    ],
    disclaimer:
      'Photo-based estimates are never exact. Unconfirmed estimates are never saved automatically—edit and tap Confirm & Log.',
  };
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  half: 0.5,
  quarter: 0.25,
};

export function parseNaturalLanguageFood(
  transcript: string,
  foods: FoodItem[]
): {
  items: Array<{
    foodId?: string;
    name: string;
    quantity: number;
    unit: FoodUnit;
    weightGrams: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    oilGheeGrams: number;
  }>;
  clarifyingQuestions: string[];
} {
  const cleaned = transcript.toLowerCase().trim();
  const segments = cleaned
    .split(/,|\band\b|\bwith\b|\bplus\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const keywordMap: Array<{ keywords: string[]; foodId: string; ambiguousHint?: string }> = [
    { keywords: ['roti', 'rotis', 'chapati', 'chapatis', 'phulka', 'rotli'], foodId: 'food-phulka-roti', ambiguousHint: 'Did your rotis have ghee on them?' },
    { keywords: ['paratha', 'parathas'], foodId: 'food-plain-paratha', ambiguousHint: 'Was it plain paratha or stuffed aloo paratha?' },
    { keywords: ['thepla', 'theplas'], foodId: 'food-methi-thepla' },
    { keywords: ['moong dal', 'yellow dal'], foodId: 'food-moong-dal' },
    { keywords: ['toor dal', 'gujarati dal'], foodId: 'food-gujarati-dal' },
    { keywords: ['dal', 'lentil'], foodId: 'food-moong-dal', ambiguousHint: 'Which dal did you have (Moong, Toor, or Masoor)?' },
    { keywords: ['paneer tikka'], foodId: 'food-grilled-paneer-tikka' },
    { keywords: ['palak paneer'], foodId: 'food-palak-paneer' },
    { keywords: ['paneer'], foodId: 'food-paneer-raw', ambiguousHint: 'Was the paneer raw/grilled or cooked in a creamy gravy?' },
    { keywords: ['soya', 'soybean', 'meal maker'], foodId: 'food-soya-curry' },
    { keywords: ['jeera rice'], foodId: 'food-jeera-rice' },
    { keywords: ['rice', 'chawal', 'bhat'], foodId: 'food-steamed-rice' },
    { keywords: ['poha'], foodId: 'food-poha' },
    { keywords: ['upma'], foodId: 'food-upma' },
    { keywords: ['khichdi'], foodId: 'food-moong-khichdi' },
    { keywords: ['rajma'], foodId: 'food-rajma' },
    { keywords: ['chole', 'chana'], foodId: 'food-chole' },
    { keywords: ['curd', 'dahi', 'yogurt'], foodId: 'food-curd-dahi' },
    { keywords: ['greek yogurt', 'hung curd'], foodId: 'food-greek-yogurt' },
    { keywords: ['milk', 'doodh'], foodId: 'food-milk-toned' },
    { keywords: ['chaas', 'buttermilk'], foodId: 'food-chaas' },
    { keywords: ['besan chilla', 'chilla'], foodId: 'food-besan-chilla' },
    { keywords: ['moong chilla', 'moong dal chilla'], foodId: 'food-moong-chilla' },
    { keywords: ['dhokla'], foodId: 'food-dhokla' },
    { keywords: ['idli'], foodId: 'food-idli' },
    { keywords: ['dosa'], foodId: 'food-plain-dosa' },
    { keywords: ['banana'], foodId: 'food-banana' },
    { keywords: ['apple'], foodId: 'food-apple' },
    { keywords: ['salad', 'kachumber'], foodId: 'food-kachumber' },
    { keywords: ['whey', 'protein shake'], foodId: 'food-whey-protein' },
    { keywords: ['ghee'], foodId: 'food-ghee' },
    { keywords: ['makhana'], foodId: 'food-roasted-makhana' },
    { keywords: ['chai', 'tea'], foodId: 'food-masala-chai' },
  ];

  const items: ReturnType<typeof parseNaturalLanguageFood>['items'] = [];
  const clarifyingQuestions: string[] = [];

  for (const seg of segments) {
    const matchEntry = keywordMap.find((m) => m.keywords.some((kw) => seg.includes(kw)));
    if (!matchEntry) continue;
    const food = foods.find((f) => f.id === matchEntry.foodId);
    if (!food) continue;

    // Extract numeric quantity
    let qty = 1;
    let unit: FoodUnit = food.servingUnit;
    const numMatch = seg.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      qty = parseFloat(numMatch[1]);
    } else {
      for (const [word, val] of Object.entries(NUMBER_WORDS)) {
        if (new RegExp(`\\b${word}\\b`).test(seg)) {
          qty = val;
          break;
        }
      }
    }

    // Check if grams/ml specified
    let multiplier = qty / (food.servingSize || 1);
    if (/\b(g|gm|gms|gram|grams)\b/.test(seg)) {
      unit = 'g';
      multiplier = qty / food.weightGrams;
    } else if (/\b(ml|millilitre|millilitres)\b/.test(seg)) {
      unit = 'ml';
      multiplier = qty / food.weightGrams;
    } else if (/\b(bowl|katori)\b/.test(seg)) {
      unit = 'bowl';
      multiplier = food.servingUnit === 'bowl' ? qty : (qty * 150) / food.weightGrams;
    } else if (/\bcup\b/.test(seg)) {
      unit = 'cup';
      multiplier = food.servingUnit === 'cup' ? qty : (qty * 200) / food.weightGrams;
    } else if (/\b(tbsp|tablespoon)\b/.test(seg)) {
      unit = 'tbsp';
      multiplier = (qty * 15) / food.weightGrams;
    } else if (/\b(tsp|teaspoon)\b/.test(seg)) {
      unit = 'tsp';
      multiplier = (qty * 5) / food.weightGrams;
    }

    items.push({
      foodId: food.id,
      name: food.name,
      quantity: qty,
      unit,
      weightGrams: Math.round(food.weightGrams * multiplier),
      calories: Math.round(food.calories * multiplier),
      proteinG: Number((food.proteinG * multiplier).toFixed(1)),
      carbsG: Number((food.carbsG * multiplier).toFixed(1)),
      fatG: Number((food.fatG * multiplier).toFixed(1)),
      oilGheeGrams: Number((food.oilOrGheeIncludedG * multiplier).toFixed(1)),
    });

    if (matchEntry.ambiguousHint && !clarifyingQuestions.includes(matchEntry.ambiguousHint)) {
      clarifyingQuestions.push(matchEntry.ambiguousHint);
    }
  }

  if (items.length === 0) {
    clarifyingQuestions.push(
      'I could not match specific foods from that phrase. Try something like "2 rotis, 1 bowl moong dal, and 100g paneer".'
    );
  }

  return { items, clarifyingQuestions };
}

export async function runDietitianChat(
  userMessage: string,
  db: DatabaseState
): Promise<{ reply: string; mode: string }> {
  const today = todayIsoDate();
  const todayLogs = db.foodLogs.filter((l) => l.logDate === today);
  const consumed = todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      proteinG: acc.proteinG + l.proteinG,
      carbsG: acc.carbsG + l.carbsG,
      fatG: acc.fatG + l.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const target = db.nutritionTargets;
  const remCal = Math.round(target.caloriesKcal - consumed.calories);
  const remPro = Math.round(target.proteinG - consumed.proteinG);
  const todayWater = db.waterLogs
    .filter((w) => w.logDate === today)
    .reduce((s, w) => s + w.amountMl, 0);

  const { provider, apiKey, model, baseUrl } = resolveAiCredentials(db.aiConfig);

  if (apiKey) {
    try {
      const systemContext = `You are NutriFit AI, a warm, encouraging, practical personal Indian vegetarian dietitian.
STRICT RULES:
1. User is PURE VEGETARIAN, ABSOLUTELY NO EGGS, NO MEAT, NO FISH. Never suggest eggs or non-veg.
2. User prefers affordable homemade Indian food (especially Gujarati & North Indian staples).
3. Never shame, guilt, or suggest starvation/extreme deficits.
4. Distinguish clearly between verified logged data and estimates. Never fabricate logged meals.
5. User Profile: Age ${db.profile.age}, ${db.profile.heightCm}cm, ${db.profile.weightKg}kg, Body Fat ${db.profile.bodyFatPct}%, Muscle ${db.profile.skeletalMuscleMassKg}kg, Waist ${db.profile.waistCm}cm, Gym 4-5x/wk, Goal: Lean Athletic Physique.
6. Daily Targets: ${target.caloriesKcal} kcal, ${target.proteinG}g protein, ${target.carbsG}g carbs, ${target.fatG}g fat.
7. Today's Actual Logged Totals (${today}): ${Math.round(consumed.calories)} kcal, ${Math.round(consumed.proteinG)}g protein, ${Math.round(consumed.carbsG)}g carbs, ${Math.round(consumed.fatG)}g fat. Water: ${todayWater} ml.
8. Today's Logged Foods: ${todayLogs.length ? todayLogs.map((l) => `${l.mealSlot}: ${l.foodName} (${l.calories} kcal, ${l.proteinG}g P)`).join('; ') : 'Nothing logged yet today.'}`;

      let replyText: string | null = null;

      if (provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemContext}\n\nUser asks: ${userMessage}` }] }],
              generationConfig: { temperature: 0.6 },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        }
      } else if (isVidhyantraUrl(baseUrl)) {
        // Vidhyantra custom API — does NOT use OpenAI format
        replyText = await callVidhyantraChat(
          [
            { role: 'system', content: systemContext },
            { role: 'user', content: userMessage },
          ],
          apiKey, baseUrl, model
        );
      } else {
        // OpenAI / Groq / OpenRouter / Custom compatible completion endpoint
        const targetUrl = `${(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://nutrifit.app', 'X-Title': 'NutriFit AI' } : {}),
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: userMessage },
            ],
            temperature: 0.6,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          replyText = data?.choices?.[0]?.message?.content;
        }
      }

      if (replyText) return { reply: replyText, mode: provider };
    } catch {
      // Fallback to local engine
    }
  }

  // Context-aware Local Dietitian Engine using real DB numbers
  const q = userMessage.toLowerCase();
  const statusLine = `Based on your actual diary today: **${Math.round(consumed.calories)} / ${target.caloriesKcal} kcal** used (**${remCal} kcal remaining**) and **${Math.round(consumed.proteinG)}g / ${target.proteinG}g protein** (**${remPro > 0 ? `${remPro}g still needed` : 'protein target hit!'}**).`;

  if (q.includes('protein')) {
    return {
      mode: 'local_engine',
      reply: `${statusLine}\n\nTo close your remaining **${Math.max(0, remPro)}g protein** cleanly (pure veg, no eggs):\n• **50g Soya Chunks Curry** → ~27g protein, ~245 kcal (most affordable option)\n• **150g Grilled Low-Fat Paneer Tikka** → ~30g protein, ~250 kcal\n• **150g Hung Curd / Greek Yogurt + 1 tbsp roasted peanuts** → ~18g protein, ~180 kcal\n• **1 scoop Whey Protein in water** → ~24g protein, ~120 kcal\n\nPick 1–2 of these depending on your remaining ${remCal} kcal!`,
    };
  }

  if (q.includes('gujarati')) {
    return {
      mode: 'local_engine',
      reply: `${statusLine}\n\nHere is a **High-Protein Homemade Gujarati Meal** (~540 kcal, ~31g protein):\n• **2 Methi Theplas** (made with minimal oil, ~270 kcal, 7g protein)\n• **1 bowl Gujarati Toor Dal** (~175 kcal, 8g protein)\n• **100g Low-Fat Paneer Bhurji** (~175 kcal, 18g protein) — or swap for **50g Soya Granules Sabzi** for even lower fat!\n• **1 bowl Kachumber Salad + 1 glass Masala Chaas** (~90 kcal, 4g protein)\n\nTip: Keeping ghee to 1/2 tsp on the theplas saves ~90 kcal without losing flavor.`,
    };
  }

  if (q.includes('before gym') || q.includes('pre-workout') || q.includes('pre workout')) {
    return {
      mode: 'local_engine',
      reply: `For your 4–5 day gym sessions, eat a **light, fast-digesting carb + small protein meal 45–60 minutes before training**:\n• **1 medium Banana + 10 soaked Almonds** (~175 kcal, 4g protein) — easy energy, zero heaviness\n• OR **1 bowl Poha (without heavy sev)** (~220 kcal, 5g protein)\n• OR **1 cup Black Coffee / Chai + 1 slice Toast with 1 tsp Peanut Butter** (~140 kcal)\n\nAvoid heavy fried snacks or large bowls of dal right before lifting so your stomach feels light.`,
    };
  }

  if (q.includes('after gym') || q.includes('post-workout') || q.includes('post workout')) {
    return {
      mode: 'local_engine',
      reply: `${statusLine}\n\nAfter gym, prioritize **25–35g pure-veg protein + moderate carbs** to repair muscle:\n• **Option A (Quick):** 1 scoop Whey Protein in water + 1 Banana (~225 kcal, 25g protein)\n• **Option B (Homemade Meal):** 2 Paneer-stuffed Moong Dal Chillas + Mint Chutney (~380 kcal, 24g protein)\n• **Option C (Budget):** 50g Soya Chunk Masala + 1 bowl Steamed Rice (~420 kcal, 31g protein)`,
    };
  }

  if (q.includes('dinner') || q.includes('500')) {
    return {
      mode: 'local_engine',
      reply: `${statusLine}\n\nHere are **pure-veg dinners under 500 kcal** that protect your muscle:\n1. **Grilled Paneer Tikka Salad (150g low-fat paneer + veggies + mint chutney)** → ~365 kcal, 32g protein\n2. **Soya Chunk Bhurji (40g dry soya) + 2 Phulka Rotis (no ghee) + Cucumber Salad** → ~395 kcal, 28g protein\n3. **2 Moong Dal Chillas + 1 bowl Hung Curd** → ~400 kcal, 25g protein`,
    };
  }

  if (q.includes('pizza') || q.includes('too much') || q.includes('missed breakfast')) {
    return {
      mode: 'local_engine',
      reply: `${statusLine}\n\nNo guilt at all — one meal never ruins your transformation!\n• **If you want pizza or ate a heavy lunch:** Enjoy 2 thin-crust veg slices (~450 kcal) and keep dinner light and protein-focused (like 150g Grilled Paneer Salad or 1 bowl Soya Curry + Salad, ~260 kcal) so your weekly average stays on track.\n• **If you missed breakfast:** Don't starve or punish yourself. Combine a protein-rich lunch (e.g., Rajma/Chole + 100g Paneer + 2 Rotis) and add an evening Greek Yogurt or Moong Chilla snack.`,
    };
  }

  if (q.includes('weight') && (q.includes('not changed') || q.includes('stuck') || q.includes('plateau'))) {
    return {
      mode: 'local_engine',
      reply: `Your latest logged weight is **${db.profile.weightKg} kg** (Waist: **${db.profile.waistCm} cm**). Remember:\n1. **Single-day scale fluctuations are normal** — extra salt, carbs, sore muscles after leg day, or late dinner hold water weight.\n2. We look at your **7-day average weight** and **waist circumference** together.\n3. Common hidden calories in homemade Indian food: extra spoons of cooking oil in sabzi/dal (1 tbsp = 120 kcal) or ghee on rotis. Try measuring oil/ghee with a teaspoon for 7 days and hitting 8,000 steps/day before lowering calories.`,
    };
  }

  if (q.includes('lunch')) {
    return {
      mode: 'local_engine',
      reply: `${statusLine}\n\nFor a balanced **pure-veg homemade lunch** (~520–560 kcal, ~30g protein):\n• **2 Whole Wheat Phulkas** (170 kcal, 6g protein)\n• **1 bowl Moong or Toor Dal** (170 kcal, 9g protein)\n• **100g Paneer Bhurji or 40g Soya Chunk Sabzi** (180 kcal, 18g protein)\n• **1 bowl Kachumber Salad + 1 glass Chaas** (90 kcal, 4g protein)`,
    };
  }

  return {
    mode: 'local_engine',
    reply: `${statusLine}\n\nYou're currently at **${todayWater} ml / ${target.waterMl} ml** water today. Because your goal is a **lean athletic physique** on a **pure vegetarian (no-egg) Indian diet**, focus on anchoring every meal with paneer, soya chunks, dal, or hung curd so you reach **${target.proteinG}g protein** within **${target.caloriesKcal} kcal**.\n\nTry asking me:\n• "What should I eat for lunch?"\n• "Suggest a vegetarian dinner under 500 calories"\n• "Suggest a high-protein Gujarati meal"\n• "What should I eat before/after gym?"`,
  };
}

export function generateMealPlanDays(
  planType: 'daily' | '7_day' | '30_day',
  targetCalories: number,
  targetProteinG: number
): MealPlanDay[] {
  const numDays = planType === 'daily' ? 1 : planType === '7_day' ? 7 : 30;
  const templates: Array<MealPlanDay['meals']> = [
    {
      breakfast: {
        title: '2 Moong Dal Chillas + Mint Chutney + 150g Greek Yogurt',
        recipeId: 'rec-moong-dal-chilla',
        items: [
          { name: 'Moong Dal Chilla (Paneer-stuffed)', quantity: '2 pcs', calories: 380, proteinG: 23, carbsG: 38, fatG: 14 },
          { name: 'Unsweetened Greek Yogurt / Hung Curd', quantity: '150 g', calories: 110, proteinG: 14, carbsG: 5.5, fatG: 3.5 },
        ],
        totalCalories: 490,
        totalProteinG: 37,
        prepNotes: 'Use a non-stick tawa with max 1.5 tsp oil total.',
      },
      lunch: {
        title: 'High-Protein Gujarati Thali (2 Thepla + Dal + Paneer + Chaas)',
        recipeId: 'rec-gujarati-protein-thali',
        items: [
          { name: 'Methi Thepla', quantity: '2 pcs', calories: 270, proteinG: 7.2, carbsG: 39, fatG: 9.6 },
          { name: 'Gujarati Toor Dal', quantity: '1 bowl', calories: 175, proteinG: 7.8, carbsG: 27.5, fatG: 3.6 },
          { name: 'Low-Fat Paneer Bhurji', quantity: '100 g', calories: 175, proteinG: 21, carbsG: 4, fatG: 8.2 },
          { name: 'Masala Chaas + Kachumber', quantity: '1 glass + 1 bowl', calories: 90, proteinG: 4.1, carbsG: 13, fatG: 2.3 },
        ],
        totalCalories: 710,
        totalProteinG: 40,
        prepNotes: 'Skip extra ghee on top of theplas to keep fats balanced.',
      },
      snacks: {
        title: 'Pre-Gym Banana + Post-Gym Whey Shake + Makhana',
        items: [
          { name: 'Medium Banana', quantity: '1 pc', calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.3 },
          { name: 'Whey Protein in Water', quantity: '1 scoop', calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5 },
        ],
        totalCalories: 225,
        totalProteinG: 25.3,
        prepNotes: 'Banana 45 mins before gym; protein shake right after.',
      },
      dinner: {
        title: 'Grilled Paneer Tikka Salad',
        recipeId: 'rec-grilled-paneer-tikka',
        items: [
          { name: 'Grilled Low-Fat Paneer Tikka', quantity: '150 g', calories: 280, proteinG: 28, carbsG: 8, fatG: 12 },
          { name: 'Kachumber & Leafy Greens', quantity: '1 large bowl', calories: 65, proteinG: 2.2, carbsG: 10, fatG: 1.5 },
        ],
        totalCalories: 345,
        totalProteinG: 30.2,
        prepNotes: 'Light, high-protein dinner that digests easily before sleep.',
      },
    },
    {
      breakfast: {
        title: 'High-Protein Besan Chilla (2 pcs) + Toned Milk',
        items: [
          { name: 'Besan Chilla (with veggies)', quantity: '2 pcs', calories: 290, proteinG: 13.6, carbsG: 35, fatG: 10 },
          { name: 'Toned Milk / Whey Coffee', quantity: '250 ml', calories: 145, proteinG: 7.5, carbsG: 11.8, fatG: 7.5 },
        ],
        totalCalories: 435,
        totalProteinG: 21.1,
        prepNotes: 'Add grated cabbage/spinach to besan batter for extra volume.',
      },
      lunch: {
        title: 'Soya Chunk Biryani + Cucumber Raita',
        recipeId: 'rec-soya-chunk-biryani',
        items: [
          { name: 'High-Protein Soya Chunk Biryani', quantity: '1 large bowl', calories: 430, proteinG: 33, carbsG: 54, fatG: 9 },
          { name: 'Homemade Curd Raita', quantity: '1 bowl (150g)', calories: 98, proteinG: 5.5, carbsG: 7.2, fatG: 5 },
        ],
        totalCalories: 528,
        totalProteinG: 38.5,
        prepNotes: 'Budget-friendly 38g protein lunch.',
      },
      snacks: {
        title: 'Sprouted Moong Salad + 10 Almonds + Whey Scoop',
        items: [
          { name: 'Sprouted Moong Salad', quantity: '1 bowl', calories: 155, proteinG: 11.5, carbsG: 24, fatG: 1 },
          { name: 'Raw Almonds', quantity: '10 pcs', calories: 70, proteinG: 2.6, carbsG: 2.6, fatG: 6 },
          { name: 'Whey Protein in Water', quantity: '1 scoop', calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5 },
        ],
        totalCalories: 345,
        totalProteinG: 38.1,
        prepNotes: 'Season sprouts with lemon juice, chaat masala & coriander.',
      },
      dinner: {
        title: '2 Phulka Rotis + Palak Paneer + Kachumber',
        items: [
          { name: 'Whole Wheat Phulka (no ghee)', quantity: '2 pcs', calories: 170, proteinG: 6, carbsG: 35, fatG: 1 },
          { name: 'Homemade Palak Paneer', quantity: '1 bowl', calories: 270, proteinG: 15.5, carbsG: 10.5, fatG: 18.5 },
          { name: 'Kachumber Salad', quantity: '1 bowl', calories: 42, proteinG: 1.6, carbsG: 8.5, fatG: 0.3 },
        ],
        totalCalories: 482,
        totalProteinG: 23.1,
        prepNotes: 'Swap heavy cream in palak paneer with 2 tbsp blended curd.',
      },
    },
    {
      breakfast: {
        title: 'Masala Oats / Poha + Hung Curd + Almonds',
        items: [
          { name: 'Kanda Poha with Peanuts', quantity: '1 bowl', calories: 250, proteinG: 5.2, carbsG: 42, fatG: 6.8 },
          { name: 'Hung Curd / Greek Yogurt', quantity: '150 g', calories: 110, proteinG: 14, carbsG: 5.5, fatG: 3.5 },
          { name: 'Raw Almonds', quantity: '10 pcs', calories: 70, proteinG: 2.6, carbsG: 2.6, fatG: 6 },
        ],
        totalCalories: 430,
        totalProteinG: 21.8,
        prepNotes: 'Great pre-morning-workout fuel.',
      },
      lunch: {
        title: 'Rajma Chawal + 100g Grilled Tofu/Paneer + Salad',
        items: [
          { name: 'Rajma Masala', quantity: '1 bowl', calories: 215, proteinG: 11.5, carbsG: 31, fatG: 4.8 },
          { name: 'Steamed Basmati Rice', quantity: '1 bowl', calories: 175, proteinG: 3.6, carbsG: 38.5, fatG: 0.4 },
          { name: 'Grilled Firm Tofu', quantity: '100 g', calories: 144, proteinG: 16.5, carbsG: 3.2, fatG: 7.5 },
        ],
        totalCalories: 534,
        totalProteinG: 31.6,
        prepNotes: 'Rajma + Rice forms a complete amino acid profile.',
      },
      snacks: {
        title: 'Khaman Dhokla + Whey Protein Shake',
        items: [
          { name: 'Khaman Dhokla', quantity: '3 pcs', calories: 165, proteinG: 6.5, carbsG: 24.5, fatG: 4.5 },
          { name: 'Whey Protein in Water', quantity: '1 scoop', calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5 },
        ],
        totalCalories: 285,
        totalProteinG: 30.5,
        prepNotes: 'Steamed Gujarati snack + fast post-gym protein.',
      },
      dinner: {
        title: 'Moong Dal Khichdi + Soya Chunk Stir-Fry + Chaas',
        items: [
          { name: 'Moong Dal Khichdi', quantity: '1 bowl', calories: 230, proteinG: 8.5, carbsG: 36, fatG: 5 },
          { name: 'Soya Chunk Masala (40g dry)', quantity: '1 bowl', calories: 205, proteinG: 22, carbsG: 17, fatG: 4.5 },
          { name: 'Masala Chaas', quantity: '250 ml', calories: 48, proteinG: 2.5, carbsG: 4.5, fatG: 2 },
        ],
        totalCalories: 483,
        totalProteinG: 33,
        prepNotes: 'Comforting, gut-friendly high-protein dinner.',
      },
    },
  ];

  return Array.from({ length: numDays }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      dayNumber: i + 1,
      label: `Day ${i + 1}`,
      meals: JSON.parse(JSON.stringify(t)),
    };
  });
}
