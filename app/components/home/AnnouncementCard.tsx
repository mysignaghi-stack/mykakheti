'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatGeorgianDate } from '@/app/lib/utils';
import type { Tables } from '@/types/helpers';

type Announcement = Tables<'announcements'>;

interface AnnouncementCardProps {
  announcement: Announcement;
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const images = Array.isArray(announcement.all_images) ? announcement.all_images : [];
  const mainImage = images[0] || announcement.image_url || null;
  const currencySymbol = announcement.currency === 'USD' ? '$' : '₾';

  return (
    <Link
      href={`/announcements/${announcement.id}`}
      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-xl transition-all duration-300 hover:shadow-[0_0_35px_rgba(230,126,34,0.25)] hover:-translate-y-0.5 hover:scale-[1.01]"
    >
      {/* Media */}
      <div className="relative h-44 w-full overflow-hidden">
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
            <a
              href={`tel:${announcement.phone}`}
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#e67e22]/15 text-[#e67e22] text-xs font-black border border-[#e67e22]/30 hover:bg-[#e67e22]/25 transition"
            >
              📞 {announcement.phone}
            </a>
          </div>
        )}
      </div>
    </Link>
  );
}
