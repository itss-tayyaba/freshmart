import React from 'react';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { BLOG_POSTS } from '../../data/groceryData';
import { useStore } from '../../context/StoreContext';

export const BlogSection = () => {
  const { addToast } = useStore();

  const handleReadPost = (title) => {
    addToast('Article Opened 📖', `Reading "${title}"`);
  };

  return (
    <section id="blog-section" className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              Recipes & Wellness
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            From the Fresh Living Journal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover seasonal recipes, nutritional tips, and sustainable farming stories.
          </p>
        </div>

        <button
          onClick={() => addToast('More Articles', 'Loading all recent blog posts...')}
          className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View All Articles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.id}
            onClick={() => handleReadPost(post.title)}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <span className="absolute top-3 left-3 bg-brand-green text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs">
                {post.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {post.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2 group-hover:text-brand-green transition-colors leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">
                  By {post.author}
                </span>
                <span className="text-xs font-bold text-brand-green flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
