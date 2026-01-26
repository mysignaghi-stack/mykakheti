'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { formatGeorgianDate } from '@/app/lib/utils';
import type { Tables } from '@/types/helpers';

type Announcement = any;

// Main categories for the horizontal bar
const MAIN_CATEGORIES = [
  { id: 'all', name: 'ყველა', icon: '📋', color: 'from-gray-500/20 to-gray-600/20' },
  { id: 'უძრავი ქონება', name: 'უძრავი ქონება', icon: '🏠', color: 'from-blue-500/20 to-blue-600/20' },
  { id: 'ავტო', name: 'ავტო', icon: '🚗', color: 'from-red-500/20 to-red-600/20' },
  { id: 'დასაქმება', name: 'დასაქმება', icon: '💼', color: 'from-green-500/20 to-green-600/20' },
  { id: 'სერვისები', name: 'სერვისები', icon: '🛠️', color: 'from-purple-500/20 to-purple-600/20' },
  { id: 'სოფლის მეურნეობა', name: 'სოფლის მეურნეობა', icon: '🌾', color: 'from-yellow-500/20 to-yellow-600/20' }
];

// All available categories for the modal
const ALL_CATEGORIES = [
  { id: 'უძრავი ქონება', name: 'უძრავი ქონება', icon: '🏠' },
  { id: 'ავტო', name: 'ავტო', icon: '🚗' },
  { id: 'დასაქმება', name: 'დასაქმება', icon: '💼' },
  { id: 'სერვისები', name: 'სერვისები', icon: '🛠️' },
  { id: 'სოფლის მეურნეობა', name: 'სოფლის მეურნეობა', icon: '🌾' },
  { id: 'სამშენებლო', name: 'სამშენებლო', icon: '🏗️' },
  { id: 'განათლება', name: 'განათლება', icon: '📚' },
  { id: 'სამედიცინო', name: 'სამედიცინო', icon: '🏥' },
  { id: 'ვაკანსიები', name: 'ვაკანსიები', icon: '👔' },
  { id: 'ღვინო და მარნები', name: 'ღვინო და მარნები', icon: '🍷' },
  { id: 'ადგილობრივი პროდუქტები', name: 'ადგილობრივი პროდუქტები', icon: '🧀' },
  { id: 'გადაზიდვები', name: 'გადაზიდვები', icon: '🚛' }
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

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white/90 mb-2">
          განცხადებების ბაზარი
        </h2>
        <p className="text-white/60 text-sm">
          იპოვე რაც გჭირდება ან გაყიდე რაც გაქვს
        </p>
      </div>

      {/* Categories Bar */}
      <div className="w-full">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar w-full max-w-full">
          {MAIN_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
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

          {/* All Categories Button */}
          <button
            onClick={() => setShowAllCategories(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-white/10 text-white/70 hover:border-white/20 hover:bg-orange-500/30 transition-all duration-300 whitespace-nowrap"
          >
            <span className="text-lg">📂</span>
            <span className="text-sm font-medium">ყველა</span>
          </button>
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
            <div
              key={announcement.id}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer w-full max-w-full"
              onClick={() => window.open(`/announcements/${announcement.id}`, '_blank')}
            >
              {/* Main Image */}
              <div className="relative h-40 overflow-hidden">
                {announcement.media_urls && announcement.media_urls.length > 0 ? (
                  <Image
                    src={announcement.media_urls[0]}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-[24px] p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">ყველა კატეგორია</h3>
              <button
                onClick={() => setShowAllCategories(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ALL_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setShowAllCategories(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left"
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-sm text-white/90 font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}