'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { formatGeorgianDate } from '@/app/lib/utils';
import type { Tables } from '@/types/helpers';

type Announcement = Tables<'announcements'>;
type CategoryItem = {
  id: string;
  name: string;
  group: string;
  glow: string;
  accent: string;
};

// Main categories for the horizontal bar
const MAIN_CATEGORIES = [
  { id: 'უძრავი ქონება', name: 'უძრავი ქონება', icon: '🏠', color: 'from-blue-500/20 to-blue-600/20' },
  { id: 'ავტო', name: 'ავტო', icon: '🚗', color: 'from-red-500/20 to-red-600/20' },
  { id: 'დასაქმება', name: 'დასაქმება', icon: '💼', color: 'from-green-500/20 to-green-600/20' },
  { id: 'სერვისები', name: 'სერვისები', icon: '🛠️', color: 'from-purple-500/20 to-purple-600/20' },
  { id: 'სოფლის მეურნეობა', name: 'სოფლის მეურნეობა', icon: '🌾', color: 'from-yellow-500/20 to-yellow-600/20' },
  { id: 'all', name: 'ყველა', icon: '📋', color: 'from-gray-500/20 to-gray-600/20' }
];

// All available categories for the modal
const ALL_CATEGORIES: CategoryItem[] = [
  { id: 'ავტო', name: 'ავტო', group: 'ტრანსპორტი', glow: 'hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] hover:border-red-300/40', accent: 'hover:border-rose-300/50 hover:bg-rose-500/10' },
  { id: 'გადაზიდვები', name: 'გადაზიდვები', group: 'ტრანსპორტი', glow: 'hover:shadow-[0_0_35px_rgba(99,102,241,0.35)] hover:border-indigo-300/40', accent: 'hover:border-indigo-300/50 hover:bg-indigo-500/10' },

  { id: 'უძრავი ქონება', name: 'უძრავი ქონება', group: 'სახლი და გარემო', glow: 'hover:shadow-[0_0_35px_rgba(59,130,246,0.35)] hover:border-blue-300/40', accent: 'hover:border-sky-300/50 hover:bg-sky-500/10' },
  { id: 'სამშენებლო', name: 'სამშენებლო', group: 'სახლი და გარემო', glow: 'hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] hover:border-amber-300/40', accent: 'hover:border-amber-300/50 hover:bg-amber-500/10' },

  { id: 'დასაქმება', name: 'დასაქმება', group: 'სერვისები და დასაქმება', glow: 'hover:shadow-[0_0_35px_rgba(34,197,94,0.35)] hover:border-green-300/40', accent: 'hover:border-emerald-300/50 hover:bg-emerald-500/10' },
  { id: 'ვაკანსიები', name: 'ვაკანსიები', group: 'სერვისები და დასაქმება', glow: 'hover:shadow-[0_0_35px_rgba(20,184,166,0.35)] hover:border-teal-300/40', accent: 'hover:border-teal-300/50 hover:bg-teal-500/10' },
  { id: 'სერვისები', name: 'სერვისები', group: 'სერვისები და დასაქმება', glow: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.35)] hover:border-purple-300/40', accent: 'hover:border-purple-300/50 hover:bg-purple-500/10' },
  { id: 'ოსტატები', name: 'ოსტატები', group: 'სერვისები და დასაქმება', glow: 'hover:shadow-[0_0_35px_rgba(250,204,21,0.35)] hover:border-amber-300/40', accent: 'hover:border-orange-300/50 hover:bg-orange-500/10' },

  { id: 'სოფლის მეურნეობა', name: 'სოფლის მეურნეობა', group: 'აგრო და პროდუქტები', glow: 'hover:shadow-[0_0_35px_rgba(132,204,22,0.35)] hover:border-lime-300/40', accent: 'hover:border-lime-300/50 hover:bg-lime-500/10' },
  { id: 'ღვინო და მარნები', name: 'ღვინო და მარნები', group: 'აგრო და პროდუქტები', glow: 'hover:shadow-[0_0_35px_rgba(244,63,94,0.35)] hover:border-rose-300/40', accent: 'hover:border-red-300/50 hover:bg-red-500/10' },
  { id: 'ადგილობრივი პროდუქტები', name: 'ადგილობრივი პროდუქტები', group: 'აგრო და პროდუქტები', glow: 'hover:shadow-[0_0_35px_rgba(234,179,8,0.35)] hover:border-yellow-300/40', accent: 'hover:border-yellow-300/50 hover:bg-yellow-500/10' },

  { id: 'განათლება', name: 'განათლება', group: 'განათლება და ჯანდაცვა', glow: 'hover:shadow-[0_0_35px_rgba(56,189,248,0.35)] hover:border-cyan-300/40', accent: 'hover:border-cyan-300/50 hover:bg-cyan-500/10' },
  { id: 'სამედიცინო', name: 'სამედიცინო', group: 'განათლება და ჯანდაცვა', glow: 'hover:shadow-[0_0_35px_rgba(248,113,113,0.35)] hover:border-red-300/40', accent: 'hover:border-pink-300/50 hover:bg-pink-500/10' },

  { id: 'სათემო ჩართულობა', name: 'სათემო ჩართულობა', group: 'თემი', glow: 'hover:shadow-[0_0_35px_rgba(148,163,184,0.35)] hover:border-slate-300/40', accent: 'hover:border-amber-300/50 hover:bg-amber-500/10' },
];

const CATEGORY_GROUPS = [
  'ტრანსპორტი',
  'სახლი და გარემო',
  'სერვისები და დასაქმება',
  'აგრო და პროდუქტები',
  'განათლება და ჯანდაცვა',
  'თემი',
];

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const { data } = await (supabase as any)
          .from('announcements')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) {
          setAnnouncements(data as any);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!showAllCategories) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAllCategories]);

  const filteredAnnouncements = selectedCategory === 'all'
    ? announcements
    : announcements.filter(announcement => announcement.category === selectedCategory);

  const formatPrice = (price: string | null, currency: string | null) => {
    if (!price) return null;
    return `${price} ${currency || '₾'}`;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = MAIN_CATEGORIES.find(cat => cat.id === categoryId);
    return category?.color || 'from-gray-500/20 to-gray-600/20';
  };

  const renderCategoryIcon = (categoryId: string) => {
    const baseProps = {
      className: 'w-7 h-7 text-amber-300/90',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.6,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    };

    switch (categoryId) {
      case 'უძრავი ქონება':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M3 10.5L12 3l9 7.5" />
            <path d="M5 10v9h14v-9" />
            <path d="M9 19v-6h6v6" />
          </svg>
        );
      case 'ავტო':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M3 13l2-6h14l2 6" />
            <path d="M5 13h14v5H5z" />
            <circle cx="7.5" cy="18" r="1.5" />
            <circle cx="16.5" cy="18" r="1.5" />
          </svg>
        );
      case 'გადაზიდვები':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M3 7h11v9H3z" />
            <path d="M14 11h4l3 3v2h-7z" />
            <circle cx="7" cy="18" r="1.5" />
            <circle cx="17" cy="18" r="1.5" />
          </svg>
        );
      case 'დასაქმება':
      case 'ვაკანსიები':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" />
            <rect x="3" y="7" width="18" height="12" rx="2" />
            <path d="M3 12h18" />
          </svg>
        );
      case 'სერვისები':
      case 'სამშენებლო':
      case 'ოსტატები':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M14 7l3 3-6 6H8v-3z" />
            <path d="M3 21l6-6" />
            <circle cx="15.5" cy="8.5" r="1.5" />
          </svg>
        );
      case 'სოფლის მეურნეობა':
      case 'ადგილობრივი პროდუქტები':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M4 19c6 0 8-4 8-10 0-2-1-4-4-4S4 7 4 9c0 6 2 10 8 10" />
            <path d="M12 9c0 6 2 10 8 10" />
          </svg>
        );
      case 'ღვინო და მარნები':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M7 3h10c0 4-2 7-5 7s-5-3-5-7z" />
            <path d="M12 10v8" />
            <path d="M9 21h6" />
          </svg>
        );
      case 'განათლება':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M3 8l9-4 9 4-9 4-9-4z" />
            <path d="M7 12v4c0 1 2.5 2 5 2s5-1 5-2v-4" />
          </svg>
        );
      case 'სამედიცინო':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <path d="M12 4v16" />
            <path d="M4 12h16" />
          </svg>
        );
      case 'სათემო ჩართულობა':
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <circle cx="8" cy="8" r="3" />
            <circle cx="16" cy="8" r="3" />
            <path d="M2 20c1.5-3 4-5 6-5" />
            <path d="M22 20c-1.5-3-4-5-6-5" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" {...baseProps}>
            <circle cx="12" cy="12" r="8" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Categories Bar */}
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-3 w-full max-w-full">
          {MAIN_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => {
                if (category.id === 'all') {
                  setShowAllCategories(true);
                  return;
                }
                setSelectedCategory(category.id);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-white/30 text-white shadow-lg'
                  : 'bg-gradient-to-r from-white/5 to-white/10 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white/90 mb-2">
          განცხადებები
        </h2>
      </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/60 text-sm">იტვირთება...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-full">
          {filteredAnnouncements.map(announcement => (
            <div
              key={announcement.id}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer w-full max-w-full"
              onClick={() => window.open(`/announcements/${announcement.id}`, '_blank')}
            >
              {/* Main Image */}
              <div className="relative h-40 overflow-hidden">
                {((announcement.all_images && announcement.all_images[0]) || announcement.image_url) ? (
                  <Image
                    src={(announcement.all_images && announcement.all_images[0]) || announcement.image_url || ''}
                    alt={announcement.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                    <span className="text-4xl text-white/30">📷</span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <div className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                    {announcement.category}
                  </div>
                </div>

                {/* Price Badge */}
                {announcement.price && (
                  <div className="absolute top-3 right-3">
                    <div className="px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-xs text-white font-bold">
                      {formatPrice(announcement.price, announcement.currency)}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 space-y-2 min-w-0">
                {/* Date */}
                <div className="text-xs text-white/50">
                  {formatGeorgianDate(announcement.created_at)}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors break-words">
                  {announcement.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/70 line-clamp-3 break-words">
                  {announcement.description || 'აღწერა არ არის'}
                </p>

                {/* Location */}
                <div className="flex items-center gap-2 text-xs text-white/60 truncate">
                  <span>📍</span>
                  <span className="truncate">{announcement.location}</span>
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="absolute bottom-3 right-3 text-white/30 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No announcements message */}
      {!loading && filteredAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-white/60 text-sm">
            {selectedCategory === 'all'
              ? 'განცხადებები არ მოიძებნა'
              : `განცხადებები არ მოიძებნა კატეგორიაში: ${selectedCategory}`
            }
          </div>
        </div>
      )}

      {/* All Categories Modal */}
      {showAllCategories && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAllCategories(false)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[30px] animate-in fade-in duration-300" />

          <button
            onClick={() => setShowAllCategories(false)}
            className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xl transition-all"
            aria-label="დახურვა"
          >
            ✕
          </button>

          <div className="relative z-10 w-full h-full p-4 sm:p-6 lg:p-10 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-full h-full rounded-none border border-white/20 bg-gradient-to-br from-white/12 via-white/6 to-white/12 shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-3xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-8">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">ყველა კატეგორია</h3>
                <p className="text-white/60 text-sm mt-1">აირჩიე სასურველი კატეგორია</p>
              </div>

              <div className="space-y-10">
                {CATEGORY_GROUPS.map(group => (
                  <div key={group} className="space-y-4">
                    <h4 className="text-sm uppercase tracking-[0.3em] text-amber-300/90 font-bold">
                      {group}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {ALL_CATEGORIES.filter(category => category.group === group).map(category => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowAllCategories(false);
                          }}
                          className={`group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 text-left ${category.glow} ${category.accent}`}
                        >
                          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-black/40 border border-white/10 group-hover:border-white/30">
                            {renderCategoryIcon(category.id)}
                          </span>
                          <span className="text-sm sm:text-base text-white/90 font-semibold">
                            {category.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}