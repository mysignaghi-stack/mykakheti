'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import AnnouncementCard from './AnnouncementCard';
import { Ad } from '@/app/lib/types';
import { ANNOUNCEMENT_CATEGORIES, LOCATIONS } from '@/app/lib/constants';

const COMMUNITY_CATEGORIES = ['სამძიმარი', 'დაკარგული/ნაპოვნი', 'ოსტატი', 'მილოცვა'] as const;
const PAGE_SIZE = 12;

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';
type Layout = 'grid' | 'list';

interface Props {
  ads: Ad[];
}

export default function RecentAnnouncementsSection({ ads }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ყველა');
  const [selectedLocation, setSelectedLocation] = useState('ყველა კახეთი');
  const [sort, setSort] = useState<SortOption>('newest');
  const [layout, setLayout] = useState<Layout>('grid');
  const [page, setPage] = useState(1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedLocation, sort]);

  const baseAds = useMemo(
    () =>
      ads.filter(
        (ad) =>
          !ad.is_archived &&
          !COMMUNITY_CATEGORIES.includes(ad.category as typeof COMMUNITY_CATEGORIES[number])
      ),
    [ads]
  );

  const availableCategories = useMemo(() => {
    const derived = Array.from(
      new Set(baseAds.map((a) => a.category).filter(Boolean))
    );
    const fallback = ANNOUNCEMENT_CATEGORIES.filter(
      (c) => !COMMUNITY_CATEGORIES.includes(c as typeof COMMUNITY_CATEGORIES[number])
    );
    return ['ყველა', ...derived, ...fallback.filter((c) => !derived.includes(c))];
  }, [baseAds]);

  const flatLocations = useMemo(() => {
    const set = new Set<string>();
    for (const municipality of LOCATIONS) {
      if (typeof municipality === 'string') { set.add(municipality); continue; }
      for (const city of (municipality as any).cities ?? []) {
        if (typeof city === 'string') { set.add(city); continue; }
        if (city.name) set.add(city.name);
        if (Array.isArray(city.villages)) city.villages.forEach((v: string) => set.add(v));
      }
    }
    return ['ყველა კახეთი', ...Array.from(set)];
  }, []);

  const normalizeText = (s: string | null | undefined) =>
    (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

  const filtered = useMemo(() => {
    let result = [...baseAds];

    if (selectedCategory !== 'ყველა') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (selectedLocation !== 'ყველა კახეთი') {
      const loc = normalizeText(selectedLocation);
      result = result.filter((a) => normalizeText(a.location).includes(loc));
    }

    if (search.trim()) {
      const q = normalizeText(search);
      result = result.filter(
        (a) =>
          normalizeText(a.title).includes(q) ||
          normalizeText(a.description).includes(q) ||
          normalizeText(a.location).includes(q)
      );
    }

    result.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      if (sort === 'oldest') return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      if (sort === 'price_asc') return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      if (sort === 'price_desc') return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      return 0;
    });

    return result;
  }, [baseAds, selectedCategory, selectedLocation, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="w-full mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-black uppercase tracking-[0.25em] text-amber-200">
            ახალი განცხადებები
          </h2>
          <p className="text-[10px] text-white/40 mt-0.5 tracking-widest uppercase">
            {filtered.length} განცხადება
          </p>
        </div>
        {/* Layout toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLayout('grid')}
            aria-label="ბარათები"
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
              layout === 'grid'
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setLayout('list')}
            aria-label="სია"
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
              layout === 'list'
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
              <rect x="1" y="2" width="14" height="3" rx="1" />
              <rect x="1" y="7" width="14" height="3" rx="1" />
              <rect x="1" y="12" width="14" height="3" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#0b0b15] border border-white/10 rounded-2xl px-4 py-2.5">
          <span className="text-amber-300/70 text-base">🔎</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="მოძებნე განცხადება..."
            className="w-full bg-transparent text-xs font-bold uppercase tracking-[0.15em] text-amber-100 placeholder:text-white/30 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-white/40 hover:text-white text-xs transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category dropdown */}
        <div ref={categoryDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCategoryDropdown((p) => !p);
              setShowLocationDropdown(false);
            }}
            className="h-full w-full sm:w-[180px] bg-[#0b0b15] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-amber-200 text-left whitespace-nowrap"
          >
            {selectedCategory === 'ყველა' ? 'ყველა კატეგ.' : selectedCategory}
          </button>
          {showCategoryDropdown && (
            <div className="absolute z-20 top-full mt-2 w-56 bg-[#0b0b15] border border-white/10 rounded-[22px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <div className="max-h-52 overflow-y-auto space-y-1">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition ${
                      selectedCategory === cat
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-300/40'
                        : 'text-white/80 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location dropdown */}
        <div ref={locationDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLocationDropdown((p) => !p);
              setShowCategoryDropdown(false);
            }}
            className="h-full w-full sm:w-[180px] bg-[#0b0b15] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-cyan-200 text-left whitespace-nowrap"
          >
            {selectedLocation === 'ყველა კახეთი' ? 'ყველა კახეთი' : selectedLocation}
          </button>
          {showLocationDropdown && (
            <div className="absolute z-20 top-full mt-2 right-0 w-56 bg-[#0b0b15] border border-white/10 rounded-[22px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <div className="max-h-52 overflow-y-auto space-y-1">
                {flatLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setShowLocationDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition ${
                      selectedLocation === loc
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-300/40'
                        : 'text-white/80 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="bg-[#0b0b15] border border-white/10 rounded-2xl px-3 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-white/70 outline-none cursor-pointer"
        >
          <option value="newest">ახალი → ძველი</option>
          <option value="oldest">ძველი → ახალი</option>
          <option value="price_asc">ფასი ↑</option>
          <option value="price_desc">ფასი ↓</option>
        </select>
      </div>

      {/* Active filter chips */}
      {(selectedCategory !== 'ყველა' || selectedLocation !== 'ყველა კახეთი' || search) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory !== 'ყველა' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[11px] font-black text-amber-200 uppercase tracking-[0.15em]">
              {selectedCategory}
              <button type="button" onClick={() => setSelectedCategory('ყველა')} className="text-amber-300/60 hover:text-amber-200 ml-0.5">✕</button>
            </span>
          )}
          {selectedLocation !== 'ყველა კახეთი' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-black text-cyan-200 uppercase tracking-[0.15em]">
              {selectedLocation}
              <button type="button" onClick={() => setSelectedLocation('ყველა კახეთი')} className="text-cyan-300/60 hover:text-cyan-200 ml-0.5">✕</button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-black text-white/70 uppercase tracking-[0.15em]">
              "{search}"
              <button type="button" onClick={() => setSearch('')} className="text-white/40 hover:text-white ml-0.5">✕</button>
            </span>
          )}
        </div>
      )}

      {/* Cards */}
      {paginated.length > 0 ? (
        layout === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {paginated.map((ad) => (
              <AnnouncementCard key={ad.id} announcement={ad} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {paginated.map((ad) => (
              <AnnouncementCard key={ad.id} announcement={ad} layout="list" />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 text-white/40 text-sm tracking-widest uppercase">
          განცხადებები ვერ მოიძებნა
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-9 h-9 rounded-xl border border-white/20 bg-white/5 text-white text-sm hover:bg-amber-500/20 hover:border-amber-400/40 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`dots-${idx}`} className="text-white/30 text-xs px-1">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item as number)}
                  className={`w-9 h-9 rounded-xl border text-xs font-black transition ${
                    safePage === item
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              )
            )}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-9 h-9 rounded-xl border border-white/20 bg-white/5 text-white text-sm hover:bg-amber-500/20 hover:border-amber-400/40 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
