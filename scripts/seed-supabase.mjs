import { Client } from 'pg';
import { SEED_INDIAN_FOODS, SEED_RECIPES } from '../src/lib/indian-foods-seed.ts';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgres://postgres.eyzgtnahyzgotyqxgwhm:YmdsftXNPLP5Wv8q@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function seed() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let foodCount = 0;
  for (const f of SEED_INDIAN_FOODS) {
    try {
      await client.query(`
        INSERT INTO public.foods (
          name, category, calories, protein_g, carbs_g, fat_g, fiber_g,
          serving_size, serving_unit, weight_grams, state, source,
          confidence, is_vegetarian, has_egg, oil_or_ghee_included_g, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT DO NOTHING
      `, [
        f.name,
        f.category,
        f.calories,
        f.proteinG,
        f.carbsG,
        f.fatG,
        f.fiberG || 0,
        f.servingSize || 1,
        f.servingUnit,
        f.weightGrams,
        f.state,
        f.source,
        f.confidence,
        f.isVegetarian !== false,
        Boolean(f.hasEgg),
        f.oilOrGheeIncludedG || 0,
        f.tags || []
      ]);
      foodCount++;
    } catch (e) {
      console.error('Error inserting food:', f.name, e.message);
    }
  }
  console.log(`✅ Seeded ${foodCount} verified Indian vegetarian foods!`);

  let recipeCount = 0;
  for (const r of SEED_RECIPES) {
    try {
      await client.query(`
        INSERT INTO public.recipes (
          name, description, category, prep_time_min, servings,
          calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving,
          ingredients, instructions, oil_ghee_notes, difficulty, tags, is_vegetarian, has_egg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT DO NOTHING
      `, [
        r.name,
        r.description,
        r.category,
        r.prepTimeMin,
        r.servings,
        r.caloriesPerServing,
        r.proteinPerServing,
        r.carbsPerServing,
        r.fatPerServing,
        JSON.stringify(r.ingredients),
        r.instructions,
        r.oilGheeNotes,
        r.difficulty,
        r.tags,
        r.isVegetarian !== false,
        Boolean(r.hasEgg)
      ]);
      recipeCount++;
    } catch (e) {
      console.error('Error inserting recipe:', r.name, e.message);
    }
  }
  console.log(`✅ Seeded ${recipeCount} recipes!`);

  await client.end();
}

seed().catch(console.error);
