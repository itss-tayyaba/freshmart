import React from 'react';
import { ArrowRight, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CASE_VALUE_TOP_DEALS = [
  {
    id: 'casevalue-topdeal-oranges',
    name: 'Fresh Juicy Valencia Oranges (1kg)',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 240,
    originalPrice: 300,
    discountPercent: 20,
    unit: '1kg Net Bag',
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=500&q=80',
    tenantId: 'tenant-chasevalue'
  },
  {
    id: 'casevalue-topdeal-milk',
    name: 'Pure Chilled Farm Fresh Whole Milk (1L)',
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 195,
    originalPrice: 230,
    discountPercent: 15,
    unit: '1L Glass Bottle',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
    tenantId: 'tenant-chasevalue'
  },
  {
    id: 'casevalue-topdeal-potatoes',
    name: 'Fresh Harvest Russet Potatoes (2kg)',
    category: 'fruits-veg',
    categoryLabel: 'Fruits & Vegetables',
    price: 150,
    originalPrice: 200,
    discountPercent: 25,
    unit: '2kg Mesh Sack',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    tenantId: 'tenant-chasevalue'
  },
  {
    id: 'casevalue-topdeal-eggs',
    name: 'Golden Farm Fresh Eggs (12 Pcs Carton)',
    category: 'dairy-eggs',
    categoryLabel: 'Dairy & Eggs',
    price: 320,
    originalPrice: 390,
    discountPercent: 18,
    unit: '12 Pcs Carton',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80',
    tenantId: 'tenant-chasevalue'
  },
  {
    id: 'casevalue-topdeal-chicken',
    name: 'Farm Dressed Fresh Whole Chicken (1kg)',
    category: 'meat-poultry',
    categoryLabel: 'Meat & Seafood',
    price: 650,
    originalPrice: 920,
    discountPercent: 30,
    unit: '1kg Clean Cut',
    image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=500&q=80',
    tenantId: 'tenant-chasevalue'
  }
];

export const CaseValueTopDeals = () => {
  const { navigateTo, addToCart, cart, updateCartQuantity, currency } = useStore();

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4 space-y-4">
      
      {/* Header Row matching screenshot */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#3d2314] tracking-tight">
            Top Deals
          </h2>
          <p className="text-xs text-[#78604d] font-medium hidden sm:block">
            Best factory wholesale savings on daily farm-fresh essentials
          </p>
        </div>

        <button
          onClick={() => navigateTo('deals')}
          className="text-xs sm:text-sm font-bold text-[#8c532b] hover:text-[#5c3417] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5-Card Responsive Grid matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
        {CASE_VALUE_TOP_DEALS.map((item) => {
          const cartItem = (cart || []).find((c) => (c.id || c._id) === item.id);
          const quantity = cartItem ? cartItem.quantity : 0;

          return (
            <div
              key={item.id}
              className="bg-[#fdfaf4] border border-[#ebdcc7] rounded-3xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
            >
              {/* Discount Percentage Badge matching screenshot */}
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-[#8c532b] text-white text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 rounded-full shadow-2xs">
                  -{item.discountPercent}%
                </span>
              </div>

              {/* Product Photo matching screenshot */}
              <div className="w-full h-32 sm:h-36 flex items-center justify-center p-2 mb-2 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Details & Pricing */}
              <div className="space-y-1 text-left">
                <span className="text-[10px] text-[#8c7462] font-semibold block">
                  {item.unit}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#3d2314] line-clamp-1 group-hover:text-[#8c532b] transition-colors">
                  {item.name}
                </h3>

                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="text-sm sm:text-base font-black text-[#5c3417]">
                    {currency?.symbol || 'Rs. '}{item.price}
                  </span>
                  <span className="text-[11px] text-[#a08875] line-through font-semibold">
                    {currency?.symbol || 'Rs. '}{item.originalPrice}
                  </span>
                </div>
              </div>

              {/* Add to Cart Button / Quantity adder */}
              <div className="pt-3">
                {quantity === 0 ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full py-2 bg-[#5c3417] hover:bg-[#43230c] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-[#f4ebe0] border border-[#ebdcc7] rounded-xl px-2 py-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white text-[#5c3417] hover:bg-[#eedec8] flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-[#3d2314]">{quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-[#5c3417] text-white hover:bg-[#43230c] flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};
