import {
  FRESHMART_CATEGORIES,
  FRESHMART_BRANDS,
  FRESHMART_PRODUCTS,
  COUPONS,
  ADMIN_STATS,
  ADMIN_TOP_PRODUCTS,
  ADMIN_RECENT_ORDERS,
  ADMIN_INVENTORY_ALERTS
} from './freshMartData';

export const RECIPES_DATA = [
  {
    id: 'chicken-biryani',
    title: 'Aromatic Chicken Dum Biryani',
    cookTime: '45 mins',
    servings: '4-5 People',
    difficulty: 'Medium',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80',
    description: 'Fragrant aged Basmati rice layered with spiced tender chicken, saffron, and caramelized onions.',
    ingredientProductIds: ['chicken-1kg', 'basmati-rice-5kg', 'cooking-oil-1l', 'tomatoes-1kg']
  },
  {
    id: 'banana-milkshake',
    title: 'Creamy High-Energy Banana Shake',
    cookTime: '5 mins',
    servings: '2 Glasses',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    description: 'Wholesome natural energy drink made with fresh bananas, full cream milk, and Californian almonds.',
    ingredientProductIds: ['bananas-1kg', 'olpers-milk-1l', 'almonds-250g']
  },
  {
    id: 'healthy-breakfast-oats',
    title: 'Fresh Apple & Honey Morning Oats Bowl',
    cookTime: '10 mins',
    servings: '1 Person',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
    description: 'Wholesome warm Quaker whole oats topped with crisp Royal Gala apple slices and toasted nuts.',
    ingredientProductIds: ['quaker-oats-500g', 'fresh-apples-1kg', 'nestle-milk-1l']
  }
];
