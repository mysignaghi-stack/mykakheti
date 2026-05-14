'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { Tables } from '@/types/helpers';
import { ANNOUNCEMENT_CATEGORIES } from '@/app/lib/constants';
import { isAgroSubmission, isCommunityAnnouncement } from '@/app/lib/specialAnnouncements';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else if (window.innerWidth < 1280) setCardsPerView(3);
      else setCardsPerView(4);
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  // Sync scrollLeft whenever currentIndex changes
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth / cardsPerView;
    el.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
  }, [currentIndex, cardsPerView]);

  const normalizeCategory = (value: string | null | undefined) =>
    (value ?? '').trim();

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
            return !isArchived && isPublished && !isAgroSubmission(announcement) && !isCommunityAnnouncement(announcement);
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
    (announcement) => normalizeCategory(announcement.category) !== 'სათემო ჩართულობა'
  );

  const filteredAnnouncements = selectedCategory === 'all'
    ? visibleAnnouncements
    : visibleAnnouncements.filter(
        announcement => normalizeCategory(announcement.category) === normalizeCategory(selectedCategory)
      );

  const maxIndex = Math.max(0, filteredAnnouncements.length - cardsPerView);
  const goNext = useCallback(() => setCurrentIndex(prev => Math.min(prev + 1, maxIndex)), [maxIndex]);
  const goPrev = useCallback(() => setCurrentIndex(prev => Math.max(prev - 1, 0)), []);

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
                setSelectedCategory(normalizeCategory(category.id));
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
          <button
            onClick={() => setSelectedCategory('all')}
            className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
              selectedCategory === 'all'
                ? 'bg-amber-500/15 border-amber-300/50 text-white shadow-[0_0_25px_rgba(230,126,34,0.25)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-black/40 border border-white/10 group-hover:border-white/30">
              {renderCategoryIcon('all')}
            </span>
            <span className="text-sm sm:text-base text-white/90 font-semibold">ყველა</span>
          </button>
          {ALL_CATEGORIES.filter(category => category.id !== 'სათემო ჩართულობა').map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(normalizeCategory(category.id))}
              className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
                selectedCategory === category.id
                  ? 'bg-amber-500/15 border-amber-300/50 text-white shadow-[0_0_25px_rgba(230,126,34,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10'
              } ${category.glow} ${category.accent}`}
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

      {/* Announcements Slider */}
      {/* Slider header: counter + arrows side-by-side */}
      {!loading && filteredAnnouncements.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-white/35">
            {filteredAnnouncements.length} განცხადება
          </span>
          <div className="flex items-center gap-2">
            {/* Dot indicators inline */}
            {filteredAnnouncements.length > cardsPerView && (
              <div className="hidden sm:flex items-center gap-1 mr-2">
                {Array.from({ length: Math.min(maxIndex + 1, 8) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-5 h-1.5 bg-amber-400'
                        : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
            {/* Left arrow */}
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="წინა"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white/50 hover:bg-amber-500/25 hover:border-amber-400/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {/* Right arrow */}
            <button
              onClick={goNext}
              disabled={currentIndex >= maxIndex}
              aria-label="შემდეგი"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white/50 hover:bg-amber-500/25 hover:border-amber-400/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/60 text-sm">იტვირთება...</div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-white/60 text-sm">
            {selectedCategory === 'all'
              ? 'განცხადებები არ მოიძებნა'
              : `განცხადებები არ მოიძებნა კატეგორიაში: ${selectedCategory}`
            }
          </div>
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="w-full flex overflow-x-auto gap-0 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredAnnouncements.map(announcement => (
            <div
              key={announcement.id}
              style={{ minWidth: `calc(100% / ${cardsPerView})`, flexShrink: 0 }}
              className="px-1.5"
            >
              <AnnouncementCard announcement={announcement} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
