# NutriFit AI — Personal AI Dietitian & Body Transformation App

A complete, beginner-friendly, **pure-vegetarian (no-egg)** Indian nutrition, AI food scanning, workout, and body transformation web application built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, and **Recharts**, styled in the **Modern Tactile Wellness** design system.

---

## Key Features Implemented

1. **EVOLT 360 Pre-Seeded Body Profile & Onboarding** (`/onboarding`, `/profile`)
   - Age 20, Male, 164 cm, 76.4 kg, BMI 28.4, Body Fat 29.7%, Skeletal Muscle Mass 29.6 kg, Waist 96.7 cm, Visceral Fat 11, BMR 1,529 kcal, TEE 2,354 kcal.
   - Pure vegetarian (no eggs), gym 4–5 days/week, homemade Indian food, lean athletic physique goal.
   - Non-medical BIA disclaimer included.
2. **Personalized Nutrition Engine** (`src/lib/nutrition-engine.ts`)
   - Starting targets: ~1,800 kcal, 130g protein, 155g carbs, 65g fat, 3.0L water.
   - Supports fat loss, lean athletic, maintenance, and muscle gain goals, manual overrides, and 7-day rolling average progress checks (never drops calories after a single weight fluctuation).
3. **Pure-Veg Indian Food Database & Custom Recipes** (`/explore`, `/recipes/[id]`)
   - 45+ Indian vegetarian staples (roti, phulka, paratha, methi thepla, poha, upma, khichdi, moong/toor/masoor/Gujarati dal, rajma, chole, paneer, tofu, soya chunks, besan/moong chilla, idli, dosa, dhokla, curd, Greek yogurt, chaas, makhana, ghee, cooking oils) with raw/cooked states, sources, and confidence badges.
4. **3-Way Food Logging** (`/diary`, `/scanner`, `src/components/FoodLogModal.tsx`)
   - **Manual Entry:** 9 units (`g`, `ml`, `bowl`, `cup`, `slice`, `piece`, `tbsp`, `tsp`, `serving`), extra ghee/oil selector, and beginner portion-size guide.
   - **AI Food Photo Scanner (`/scanner`):** Live Gemini Vision when `GEMINI_API_KEY` is set, or clearly-labelled Local Estimate Mode fallback. Always requires user confirmation before saving.
   - **Voice / Natural Language Logging:** Parses phrases like `"I ate two rotis, one bowl of dal and 100 grams of paneer"` into editable entries.
5. **Real-Time Home Dashboard & Food Diary** (`/`, `/diary`)
   - 7-segment radial calorie gauge, live macro bars, undo delete, copy yesterday's meals, and saved favorite meals.
6. **AI Personal Dietitian** (`/coach`)
   - Connected to your real profile, today's logged meals, remaining calories/protein, and water intake.
7. **Personalized Meal Planner & Grocery List** (`/planner`, `/grocery`)
   - Daily, 7-day, and 30-day pure-veg Indian meal plans with food swaps and INR (₹) grocery budgeting.
8. **Gym & Workout Tracker** (`/workouts`)
   - 5-day customizable split + recovery days, exercise library, sets/reps/weight/cardio logging, and Personal Records.
9. **Body Transformation, Habits, Analytics & Privacy** (`/progress`, `/habits`, `/analytics`, `/settings`)
   - Recharts progress charts, Day 1–90 milestones, private progress photo storage, water/sleep/steps consistency score, JSON backup/export, and account reset.

---

## Architecture Note

- **Database & Storage:** Full 18-table PostgreSQL + Row Level Security (RLS) schema is provided in `supabase/migrations/001_initial_schema.sql`. When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not configured, NutriFit automatically runs on a zero-config, authenticated server-side JSON & private file store in `./data/` so you can run the app immediately.
- **AI Integration:** Server-side API routes (`/api/ai/scan`, `/api/ai/chat`, `/api/ai/voice-parse`) use `GEMINI_API_KEY` when configured and fall back to a clearly-labelled local nutrition & Indian food parser when no API key is present.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure environment variables
cp .env.example .env.local
# Add GEMINI_API_KEY or Supabase credentials if desired

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and click **Continue as Ayush (Personal Profile)** (or sign in with `personal@nutrifit.local` / `nutrifit123`).

## Production Build

```bash
npm run build
npm run start
```
