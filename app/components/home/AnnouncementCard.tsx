'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatGeorgianDate } from '@/app/lib/utils';
import FavoriteButton from '@/app/components/announcements/FavoriteButton';

type AnnouncementLike = {
  id: string;
  title?: string | null;
  description?: string | null;
  price?: string | null;
  currency?: string | null;
  location?: string | null;
  category?: string | null;
  image_url?: string | null;
  all_images?: string[] | null;
  phone?: string | null;
  created_at?: string | null;
};

interface AnnouncementCardProps {
  announcement: AnnouncementLike;
  layout?: 'grid' | 'list';
}

export default function AnnouncementCard({ announcement, layout = 'grid' }: AnnouncementCardProps) {
  const images = Array.isArray(announcement.all_images) ? announcement.all_images.filter(Boolean) : [];
  const mainImage = images[0] || announcement.image_url || null;
  const hasPrice = Boolean(announcement.price && announcement.price !== '0');
  const currencySymbol = announcement.currency === 'USD' ? '$' : '₾';

  if (layout === 'list') {
    return (
      <Link
        href={`/announcements/${announcement.id}`}
        className="group flex gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-amber-400/30 transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden bg-white/5">
          {mainImage ? (
            <Image src={mainImage} alt={announcement.title || ''} fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-white/20">📷</div>
          )}
          {images.length > 1 && (
            <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white/80 px-1 rounded">{images.length} 📷</span>
          )}
          <FavoriteButton announcementId={announcement.id} compact className="absolute right-1 top-1 z-10" />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">{announcement.title || '—'}</h3>
            {announcement.description && (
              <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{announcement.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-3">
              {announcement.location && (
                <span className="text-[10px] text-white/45 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  {announcement.location}
                </span>
              )}
              {announcement.created_at && (
                <span className="text-[10px] text-white/30">{formatGeorgianDate(announcement.created_at)}</span>
              )}
            </div>
            {hasPrice && (
              <span className="text-sm font-black text-amber-400 whitespace-nowrap">
                {announcement.price} {currencySymbol}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // grid layout (default)
  return (
    <Link
      href={`/announcements/${announcement.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/30 hover:shadow-[0_0_20px_rgba(230,126,34,0.15)] transition-all duration-200"
    >
      {/* Image */}
      <div className="relative w-full aspect-[5/3] overflow-hidden bg-white/5">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={announcement.title || ''}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-white/15">📷</div>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white/80 px-1.5 py-0.5 rounded-full">📷 {images.length}</span>
        )}
        <FavoriteButton announcementId={announcement.id} compact className="absolute right-2 top-2 z-10" />
        {announcement.category && (
          <span className="absolute top-2 left-2 max-w-[calc(100%-3rem)] truncate text-[9px] font-bold uppercase bg-black/60 text-amber-300/90 px-2 py-0.5 rounded-full border border-amber-400/20 backdrop-blur-sm">
            {announcement.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 p-1.5 flex-1">
        <h3 className="text-[11px] font-bold text-white/90 line-clamp-1 leading-snug group-hover:text-white transition-colors">
          {announcement.title || '—'}
        </h3>

        <div className="mt-auto pt-1 flex items-end justify-between gap-1">
          <div className="flex flex-col gap-0">
            {announcement.location && (
              <span className="text-[9px] text-white/40 flex items-center gap-0.5">
                <svg className="w-2 h-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span className="truncate max-w-[70px]">{announcement.location}</span>
              </span>
            )}
          </div>
          {hasPrice ? (
            <span className="text-[11px] font-black text-amber-400 whitespace-nowrap">
              {announcement.price} {currencySymbol}
            </span>
          ) : (
            <span className="text-[10px] text-white/30 italic">ფასი შეთანხმებით</span>
          )}
        </div>
      </div>
    </Link>
  );
}
