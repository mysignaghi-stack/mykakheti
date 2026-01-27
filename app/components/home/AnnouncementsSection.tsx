'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { Tables } from '@/types/helpers';
import { ANNOUNCEMENT_CATEGORIES } from '@/app/lib/constants';
import AnnouncementCard from './AnnouncementCard';

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
  { id: 'სამშენებლო', name: 'სამშენებლო', icon: '🏗️', color: 'from-amber-500/20 to-amber-600/20' },
  { id: 'დასაქმება', name: 'დასაქმება', icon: '💼', color: 'from-green-500/20 to-green-600/20' },
  { id: 'სოფლის მეურნეობა', name: 'სოფლის მეურნეობა', icon: '🌾', color: 'from-yellow-500/20 to-yellow-600/20' },
  { id: 'ღვინო და მარნები', name: 'ღვინო და მარნები', icon: '🍷', color: 'from-rose-500/20 to-rose-600/20' },
  { id: 'all', name: 'ყველა', icon: '📋', color: 'from-gray-500/20 to-gray-600/20' }
];

// All available categories for the modal (aligned with upload categories)
const ALL_CATEGORIES: CategoryItem[] = ANNOUNCEMENT_CATEGORIES.map((category) => ({
  id: category,
  name: category,
  group: 'ყველა',
  glow: 'hover:shadow-[0_0_35px_rgba(230,126,34,0.25)] hover:border-amber-300/40',
  accent: 'hover:border-amber-300/50 hover:bg-amber-500/10',
}));

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
          const now = Date.now();
          const visible = (data as Announcement[]).filter((announcement) => {
            const isArchived = announcement.is_archived ?? false;
            const publishAt = announcement.publish_at ? new Date(announcement.publish_at).getTime() : null;
            const isPublished = !publishAt || publishAt <= now;
            return !isArchived && isPublished;
          });
          setAnnouncements(visible);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const visibleAnnouncements = announcements.filter(
    (announcement) => announcement.category !== 'სათემო ჩართულობა'
  );

  const filteredAnnouncements = selectedCategory === 'all'
    ? visibleAnnouncements
    : visibleAnnouncements.filter(announcement => announcement.category === selectedCategory);

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
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white/90 mb-2">
          განცხადებები
        </h2>
      </div>

      {/* Categories Bar */}
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-3 w-full max-w-full">
          {MAIN_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => {
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

      {/* All Categories (inline, clickable) */}
      <div className="w-full space-y-4">
        <h3 className="text-sm uppercase tracking-[0.3em] text-amber-300/90 font-bold">
          ყველა კატეგორია
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALL_CATEGORIES.filter(category => category.id !== 'სათემო ჩართულობა').map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
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

      {/* Announcements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/60 text-sm">იტვირთება...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-full">
          {filteredAnnouncements.map(announcement => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
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

    </div>
  );
}