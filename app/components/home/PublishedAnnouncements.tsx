'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { Tables } from '@/types/helpers';
import { isAgroSubmission, isCommunityAnnouncement } from '@/app/lib/specialAnnouncements';

type Announcement = Tables<'announcements'>;

interface CategoryStats {
  [category: string]: {
    count: number;
    latest: Announcement;
  };
}

// Main categories to show initially
const MAIN_CATEGORIES = [
  { id: 'უძრავი ქონება', name: 'უძრავი ქონება', icon: '🏠', color: 'from-blue-500/20 to-blue-600/20' },
  { id: 'ავტო', name: 'ავტო', icon: '🚗', color: 'from-red-500/20 to-red-600/20' },
  { id: 'დასაქმება', name: 'დასაქმება', icon: '💼', color: 'from-green-500/20 to-green-600/20' }
];

// All available categories
const ALL_CATEGORIES = [
  { id: 'უძრავი ქონება', name: 'უძრავი ქონება', icon: '🏠', color: 'from-blue-500/20 to-blue-600/20' },
  { id: 'ავტო', name: 'ავტო', icon: '🚗', color: 'from-red-500/20 to-red-600/20' },
  { id: 'დასაქმება', name: 'დასაქმება', icon: '💼', color: 'from-green-500/20 to-green-600/20' },
  { id: 'სოფლის მეურნეობა', name: 'სოფლის მეურნეობა', icon: '🌾', color: 'from-yellow-500/20 to-yellow-600/20' },
  { id: 'სამშენებლო', name: 'სამშენებლო', icon: '🏗️', color: 'from-gray-500/20 to-gray-600/20' },
  { id: 'მომსახურება', name: 'მომსახურება', icon: '🛠️', color: 'from-purple-500/20 to-purple-600/20' },
  { id: 'განათლება', name: 'განათლება', icon: '📚', color: 'from-indigo-500/20 to-indigo-600/20' },
  { id: 'სამედიცინო', name: 'სამედიცინო', icon: '🏥', color: 'from-pink-500/20 to-pink-600/20' },
  { id: 'ვაკანსიები', name: 'ვაკანსიები', icon: '👔', color: 'from-teal-500/20 to-teal-600/20' },
  { id: 'ღვინო და მარნები', name: 'ღვინო და მარნები', icon: '🍷', color: 'from-amber-500/20 to-amber-600/20' },
  { id: 'ადგილობრივი პროდუქტები', name: 'ადგილობრივი პროდუქტები', icon: '🧀', color: 'from-emerald-500/20 to-emerald-600/20' },
  { id: 'გადაზიდვები', name: 'გადაზიდვები', icon: '🚛', color: 'from-orange-500/20 to-orange-600/20' }
];

export default function PublishedAnnouncements() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({});
  const [loading, setLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      setLoading(true);
      try {
        const { data } = await (supabase as any)
          .from('announcements')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (data) {
          // Group announcements by category and get stats
          const stats: CategoryStats = {};
          data
            .filter((announcement: Announcement) => !isAgroSubmission(announcement) && !isCommunityAnnouncement(announcement))
            .forEach((announcement: Announcement) => {
            const category = announcement.category;
            if (!stats[category]) {
              stats[category] = {
                count: 0,
                latest: announcement
              };
            }
            stats[category].count++;
            // Keep the latest announcement
            if (announcement.created_at && stats[category].latest.created_at &&
                new Date(announcement.created_at) > new Date(stats[category].latest.created_at)) {
              stats[category].latest = announcement;
            }
          });
          setCategoryStats(stats);
        }
      } catch (error) {
        console.error('Error fetching category stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryStats();
  }, []);

  const displayedCategories = showAllCategories ? ALL_CATEGORIES : MAIN_CATEGORIES;

  const formatPrice = (price: string | null, currency: string | null) => {
    if (!price) return null;
    return `${price} ${currency || '₾'}`;
  };

  return (
    <div className="w-full space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="text-white/60 text-sm">იტვირთება...</div>
        </div>
      ) : (
        <>
          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedCategories.map(category => {
              const stats = categoryStats[category.id];
              const hasAnnouncements = stats && stats.count > 0;

              return (
                <div
                  key={category.id}
                  className={`relative overflow-hidden rounded-[16px] p-4 bg-gradient-to-br ${category.color} backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] ${hasAnnouncements ? 'cursor-pointer' : 'opacity-50'}`}
                  onClick={hasAnnouncements ? () => window.open(`/announcements?category=${encodeURIComponent(category.id)}`, '_self') : undefined}
                >
                  {/* Category Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-3xl">{category.icon}</div>
                    {hasAnnouncements && (
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full text-white font-bold">
                        {stats.count}
                      </div>
                    )}
                  </div>

                  {/* Category Name */}
                  <h3 className="text-base font-bold text-white mb-2">
                    {category.name}
                  </h3>

                  {/* Latest Announcement Preview */}
                  {hasAnnouncements && stats.latest && (
                    <div className="space-y-2">
                      <div className="text-xs text-white/70 line-clamp-2">
                        {stats.latest.title}
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/60">
                        <div className="flex items-center gap-1">
                          <span>📍</span>
                          <span className="truncate">{stats.latest.location}</span>
                        </div>
                        {stats.latest.price && (
                          <div className="font-bold text-white/80">
                            {formatPrice(stats.latest.price, stats.latest.currency)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-white/50">
                        {stats.latest.created_at ? new Date(stats.latest.created_at).toLocaleDateString('ka-GE') : 'უცნობი თარიღი'}
                      </div>
                    </div>
                  )}

                  {/* No announcements message */}
                  {!hasAnnouncements && (
                    <div className="text-xs text-white/30">
                      -
                    </div>
                  )}

                  {/* Hover indicator */}
                  {hasAnnouncements && (
                    <div className="absolute bottom-2 right-2 text-white/30 text-xs">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show All Categories Button */}
          <div className="text-center">
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 rounded-lg text-sm font-bold text-white hover:border-white/30 transition-all duration-300"
            >
              {showAllCategories ? 'ნაკლები კატეგორიები' : `ყველა კატეგორია (${ALL_CATEGORIES.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
