import type { FoodItem } from '@/types/nutrifit';

interface FoodVisual {
  image: string;
  description: string;
}

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'Dal & Legumes': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  'Paneer, Soya & Dairy': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  'Roti & Breads': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
  'Rice & Grains': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=600&q=80',
  'Vegetables & Sabzi': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  'Gujarati & Regional': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'Snacks & Chaat': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
  'Sweets & Desserts': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
};

const SPECIFIC_FOOD_VISUALS: Record<string, FoodVisual> = {
  'food-phulka-roti': {
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    description: 'Whole wheat phulka roti puffed over flame without ghee. Low-fat daily staple.',
  },
  'food-roti-ghee': {
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    description: 'Soft whole wheat chapati brushed with 1/2 tsp pure desi cow ghee for healthy fats.',
  },
  'food-aloo-paratha': {
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
    description: 'Crispy pan-roasted paratha stuffed with spiced mashed potatoes, ginger, and coriander.',
  },
  'food-plain-paratha': {
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
    description: 'Layered triangular whole-wheat flatbread cooked on tawa with a light smear of oil.',
  },
  'food-methi-thepla': {
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    description: 'Gujarati flatbread prepared with fresh fenugreek leaves, whole wheat, and mild spices.',
  },
  'food-yellow-moong-dal': {
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    description: 'Light, gut-friendly yellow split moong dal cooked with turmeric, cumin, and hing.',
  },
  'food-toor-dal-tadka': {
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    description: 'Comforting arhar/toor dal tempered with cumin, mustard seeds, green chillies, and ghee.',
  },
  'food-dal-makhani': {
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
    description: 'Slow-cooked whole black urad and kidney beans in a creamy tomato and butter base.',
  },
  'food-chana-masala': {
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
    description: 'White chickpeas simmered in an aromatic onion-tomato masala with amchur and garam masala.',
  },
  'food-rajma': {
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    description: 'Tender red kidney beans slow-cooked in rich North Indian gravy. High-protein comfort food.',
  },
  'food-paneer-raw': {
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh homemade cottage cheese cubes. Rich in high-biological-value protein & calcium.',
  },
  'food-palak-paneer': {
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    description: 'Nutritious smooth spinach purée gently spiced with paneer cubes. High in iron & protein.',
  },
  'food-paneer-bhurji': {
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
    description: 'Scrambled paneer sautéed with onions, tomatoes, green chillies, and turmeric.',
  },
  'food-soya-chunks': {
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    description: 'Textured defatted soy chunks in light home-style gravy. Outstanding 52% protein density.',
  },
  'food-curd-dahi': {
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    description: 'Probiotic fresh homemade set curd / dahi. Aids digestion and provides natural protein.',
  },
  'food-steamed-rice': {
    image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=600&q=80',
    description: 'Fluffy steamed basmati rice. Light, easy to digest, and pairs with every Indian dal.',
  },
  'food-jeera-rice': {
    image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=600&q=80',
    description: 'Fragrant long-grain basmati rice tempered with toasted cumin seeds and a hint of ghee.',
  },
  'food-khichdi': {
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    description: 'Wholesome one-pot blend of rice and yellow moong dal cooked with turmeric and cumin.',
  },
  'food-poha': {
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
    description: 'Flattened rice tempered with mustard seeds, curry leaves, onions, and crunchy peanuts.',
  },
  'food-idli': {
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    description: 'Steamed fermented rice and urad dal cakes. Naturally oil-free and gut-healthy.',
  },
  'food-roasted-chana': {
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
    description: 'Dry roasted black chickpeas. Crunchy, high-fiber, zero-oil afternoon snack.',
  },
};

export function getFoodVisual(food: FoodItem): FoodVisual {
  if (SPECIFIC_FOOD_VISUALS[food.id]) {
    return SPECIFIC_FOOD_VISUALS[food.id];
  }

  // Check matching by category or keywords
  const nameLower = food.name.toLowerCase();
  for (const [key, val] of Object.entries(SPECIFIC_FOOD_VISUALS)) {
    const keyPart = key.replace('food-', '').replace(/-/g, ' ');
    if (nameLower.includes(keyPart)) {
      return val;
    }
  }

  const categoryImg =
    CATEGORY_DEFAULT_IMAGES[food.category] ||
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';

  const defaultDesc = `${food.name} — authentic Indian ${food.category.toLowerCase()} prepared vegetarian style. Balanced nutrition with ${food.proteinG}g protein.`;

  return {
    image: categoryImg,
    description: defaultDesc,
  };
}
