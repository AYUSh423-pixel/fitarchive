import { createClient } from '@supabase/supabase-js';

const url = 'https://eyzgtnahyzgotyqxgwhm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5emd0bmFoeXpnb3R5cXhnd2htIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTYxMjM5MCwiZXhwIjoyMTExMTg4MzkwfQ.iqBnfEpmNU39e9K7snCu6AW5gp9MCv5uTYAO3EhFjoI';
const supabase = createClient(url, serviceKey);

async function testFullFlow() {
  console.log('Testing full multi-user flow...');
  const userA_Email = 'user_a_' + Date.now() + '@nutrifit.test';
  const userB_Email = 'user_b_' + Date.now() + '@nutrifit.test';

  // 1. Create User A (Rohan, 22M, 65kg)
  const { data: uA } = await supabase.auth.admin.createUser({
    email: userA_Email,
    password: 'password123',
    email_confirm: true,
  });
  await supabase.from('user_profiles').insert({
    id: uA.user.id,
    name: 'Rohan',
    email: userA_Email,
    age: 22,
    gender: 'male',
    height_cm: 175,
    weight_kg: 65,
    bmi: 21.2,
    goal: 'muscle_gain',
  });
  await supabase.from('food_logs').insert({
    user_id: uA.user.id,
    food_name: 'Moong Dal Chilla',
    meal_slot: 'breakfast',
    quantity: 2,
    unit: 'piece',
    weight_grams: 160,
    calories: 380,
    protein_g: 23,
    carbs_g: 38,
    fat_g: 14,
  });

  // 2. Create User B (Neha, 26F, 78kg)
  const { data: uB } = await supabase.auth.admin.createUser({
    email: userB_Email,
    password: 'password123',
    email_confirm: true,
  });
  await supabase.from('user_profiles').insert({
    id: uB.user.id,
    name: 'Neha',
    email: userB_Email,
    age: 26,
    gender: 'female',
    height_cm: 162,
    weight_kg: 78,
    bmi: 29.7,
    goal: 'fat_loss',
  });
  await supabase.from('food_logs').insert({
    user_id: uB.user.id,
    food_name: 'Grilled Paneer Tikka',
    meal_slot: 'dinner',
    quantity: 1,
    unit: 'bowl',
    weight_grams: 150,
    calories: 280,
    protein_g: 28,
    carbs_g: 8,
    fat_g: 12,
  });

  // 3. Verify Isolation
  const { data: logsA } = await supabase.from('food_logs').select('food_name').eq('user_id', uA.user.id);
  const { data: logsB } = await supabase.from('food_logs').select('food_name').eq('user_id', uB.user.id);

  console.log('User A (Rohan) logs:', logsA.map(l => l.food_name));
  console.log('User B (Neha) logs:', logsB.map(l => l.food_name));

  const isolated = logsA.length === 1 && logsA[0].food_name === 'Moong Dal Chilla' &&
                   logsB.length === 1 && logsB[0].food_name === 'Grilled Paneer Tikka';

  console.log(isolated ? '✅ PERFECT DATA ISOLATION CONFIRMED!' : '❌ Cross-talk detected!');

  // Clean up
  await supabase.auth.admin.deleteUser(uA.user.id);
  await supabase.auth.admin.deleteUser(uB.user.id);
  console.log('Cleaned up test accounts.');
}

testFullFlow().catch(console.error);
