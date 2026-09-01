import React from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { TESTIMONIALS } from '../../data/groceryData';

export const Testimonials = () => {
  return (
    <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
          Customer Satisfaction
        </span>
        <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
          Loved by 45,000+ Happy Families
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hear why our customers choose Grocery Shop for their daily meals and nutrition.
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>

              {/* Text */}
              <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                "{t.text}"
              </p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 mt-4 border-t border-slate-100">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover border border-emerald-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-800">{t.name}</h4>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-400">
                  {t.role} • {t.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
