'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatGeorgianDate } from '@/app/lib/utils';
type AnnouncementLike = {
  id: string;
  title?: string | null;
  description?: string | null;
  price?: string | null;
  currency?: string | null;
  location?: string | null;
  image_url?: string | null;
  all_images?: string[] | null;
  phone?: string | null;
  created_at?: string | null;
};

interface AnnouncementCardProps {
  announcement: AnnouncementLike;
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const images = Array.isArray(announcement.all_images) ? announcement.all_images : [];
  const mainImage = images[0] || announcement.image_url || null;
  const currencySymbol = announcement.currency === 'USD' ? '$' : '₾';
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/announcements/${announcement.id}`
    : '';

  const handleFBShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const url = shareUrl || `/announcements/${announcement.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 'fb-share', 'width=600,height=400');
  };

  const isMobileDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
    return Boolean(uaData?.mobile) || /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  };

  const handleTikTokShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const url = shareUrl || `/announcements/${announcement.id}`;
    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share({ url, title: announcement.title || undefined });
        return;
      } catch {
        // Fall back to copy on share failure or cancel.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      window.alert('ბმული კოპირებულია! ✅');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.alert('ბმული კოპირებულია! ✅');
    }
  };

  return (
    <Link
      href={`/announcements/${announcement.id}`}
      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl transition-all duration-300 hover:shadow-[0_0_35px_rgba(230,126,34,0.25)] hover:-translate-y-0.5 hover:scale-[1.01]"
    >
      {/* Media */}
      <div className="relative h-44 w-full overflow-hidden">
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleFBShare}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-200 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition"
            aria-label="Facebook გაზიარება"
          >
            f
          </button>
          <button
            type="button"
            onClick={handleTikTokShare}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white/90 border border-white/20 hover:bg-white hover:text-black transition"
            aria-label="ბმულის გაზიარება"
          >
            🔗
          </button>
        </div>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={announcement.title || 'Announcement'}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <span className="text-4xl text-white/30">📷</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm sm:text-base font-black text-white line-clamp-2">
            {announcement.title || '—'}
          </h3>
          <div className="text-right">
            <div className="text-[10px] text-white/50">
              {announcement.created_at ? formatGeorgianDate(announcement.created_at) : ''}
            </div>
            {announcement.price && (
              <div className="text-sm font-black text-[#e67e22]">
                {announcement.price} {currencySymbol}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>📍</span>
          <span className="truncate">{announcement.location || '—'}</span>
        </div>

        <p className="text-xs sm:text-sm text-white/70 line-clamp-3">
          {announcement.description || 'აღწერა არ არის'}
        </p>

        {announcement.phone && (
          <div className="pt-2">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `tel:${announcement.phone}`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `tel:${announcement.phone}`;
                }
              }}
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#e67e22]/15 text-[#e67e22] text-xs font-black border border-[#e67e22]/30 hover:bg-[#e67e22]/25 transition"
            >
              📞 {announcement.phone}
            </span>
          </div>
        )}

      </div>
    </Link>
  );
}
