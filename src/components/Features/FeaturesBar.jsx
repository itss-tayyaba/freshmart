import React from 'react';
import { Truck, ShieldCheck, Headphones, CreditCard, RotateCcw, Award } from 'lucide-react';

export const FeaturesBar = () => {
  const features = [
    {
      icon: Truck,
      title: 'Free Express Shipping',
      description: 'On all orders over $40',
      color: 'text-emerald-700 bg-emerald-50'
    },
    {
      icon: Award,
      title: '100% Organic Fresh',
      description: 'Harvested daily from farms',
      color: 'text-amber-700 bg-amber-50'
    },
    {
      icon: Headphones,
      title: '24/7 Dedicated Support',
      description: 'Call us anytime: 88 01434 65768',
      color: 'text-blue-700 bg-blue-50'
    },
    {
      icon: CreditCard,
      title: 'Secure Instant Payment',
      description: '100% encrypted & protected',
      color: 'text-purple-700 bg-purple-50'
    }
  ];

  return (
    <section className="py-6 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className={`flex items-center gap-4 ${idx > 0 ? 'pt-4 sm:pt-0 sm:pl-6' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feature.color}`}>
                <Icon className="w-6 h-6 stroke-[1.9]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  {feature.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
