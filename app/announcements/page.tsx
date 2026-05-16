'use client';

import { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { formatGeorgianDate } from '../lib/utils';
import { ANNOUNCEMENT_CATEGORY_GROUPS } from '../lib/constants';
import { isAgroSubmission, isCommunityAnnouncement } from '../lib/specialAnnouncements';
import AnnouncementCard from '../components/home/AnnouncementCard';

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: string;
  currency: string;
  image_url?: string | null;
  all_images?: string[] | null;
  created_at: string;
  is_archived?: boolean | null;
  publish_at?: string | null;
}

const ITEMS_PER_PAGE = 24;

const CATEGORY_ICONS: Record<string, string> = {
  'უძრავი ქონება': '🏠',
  'ავტო': '🚗',
  'დასაქმება': '💼',
  'სოფლის მეურნეობა': '🌾',
  'ღვინო და მარნები': '🍷',
  'აგრო-მიწები': '🌱',
  'აგრო-ტექნიკა': '🚜',
  'გადაზიდვები': '🚛',
  'გიდის მომსახურება': '🗺️',
  'განათლება': '🎓',
  'ელექტრონიკა': '📱',
  'ვაკანსიები': '👔',
  'ადგილობრივი პროდუქტები': '🧺',
  'სამშენებლო': '🏗️',
  'სამედიცინო': '🏥',
  'სასტუმროები': '🏨',
  'ტურიზმი': '✈️',
  'ტურისტული': '🌄',
  'ცხოველები': '🐾',
  'სახლი': '🏠',
  'ბინა': '🏢',
  'აგარაკი': '🏡',
  'კოტეჯი': '🏡',
  'მიწის ნაკვეთი': '📍',
  'სასოფლო-სამეურნეო მიწა': '🌾',
  'სამშენებლო მიწა': '🏗️',
  'ვენახი': '🍇',
  'ბაღი / ხეხილის ნაკვეთი': '🌳',
  'ფერმა': '🚜',
  'საწყობი': '🏚️',
  'კომერციული ფართი': '🏬',
  'ოფისი': '🏢',
  'გარაჟი': '🚗',
  'დასაქირავებელი ფართი': '🔑',
  'დღიური ბინა': '🛏️',
  'სასტუმრო / საოჯახო სასტუმრო': '🏨',
  'ავეჯი': '🪑',
  'საყოფაცხოვრებო ტექნიკა': '🔌',
  'სამშენებლო ხელსაწყო': '🛠️',
  'ელექტრო ხელსაწყო': '🔧',
  'თესლი': '🌱',
  'ნერგი': '🌿',
  'აგროქიმია': '🧪',
  'ავტონაწილები': '⚙️',
  'საბურავები': '🛞',
  'ძაღლი': '🐕',
  'ლეკვი': '🐕',
  'კატა': '🐈',
  'კნუტი': '🐈',
  'ძროხა': '🐄',
  'ხბო': '🐄',
  'ცხენი': '🐎',
  'ცხვარი': '🐑',
  'თხა': '🐐',
  'ღორი': '🐖',
  'ქათამი': '🐔',
  'ინდაური': '🦃',
  'იხვი': '🦆',
  'ფუტკრის ოჯახი': '🐝',
  'სკა': '🐝',
  'სხვა': '📦',
};

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';
type Layout = 'grid' | 'list';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & sort
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [layout, setLayout] = useState<Layout>('grid');
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      const now = Date.now();
      const visible = ((data || []) as Announcement[]).filter((item) => {
        if (item.is_archived || isAgroSubmission(item) || isCommunityAnnouncement(item)) return false;
        const publishAt = item.publish_at ? new Date(item.publish_at).getTime() : null;
        return !publishAt || publishAt <= now;
      });
      setItems(visible);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let prev: ScrollRestoration | undefined;
    try {
      if ('scrollRestoration' in history) {
        prev = history.scrollRestoration;
        history.scrollRestoration = 'manual';
      }
    } catch {}
    return () => {
      try { if (prev !== undefined) history.scrollRestoration = prev; } catch {}
    };
  }, []);

  useLayoutEffect(() => {
    try {
      const pos = sessionStorage.getItem('announcements-scroll');
      if (pos) { window.scrollTo({ top: Number(pos), behavior: 'auto' }); sessionStorage.removeItem('announcements-scroll'); }
    } catch {}
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [selectedCategory, search, sort, priceMin, priceMax]);

  const filtered = useMemo(() => {
    let result = [...items];

    if (selectedCategory !== 'all') {
      result = result.filter(i => (i.category || '').trim() === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q)
      );
    }

    if (priceMin) {
      const min = parseFloat(priceMin);
      result = result.filter(i => parseFloat(i.price || '0') >= min);
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      result = result.filter(i => parseFloat(i.price || '0') <= max);
    }

    result.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'price_asc') return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      if (sort === 'price_desc') return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      return 0;
    });

    return result;
  }, [items, selectedCategory, search, sort, priceMin, priceMax]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cat = (item.category || '').trim();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [items]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearch('');
    setPriceMin('');
    setPriceMax('');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilter = selectedCategory !== 'all' || search || priceMin || priceMax;

  return (
    <main className="min-h-screen bg-[#050510] text-white overflow-x-hidden">

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#050510]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-3 flex items-center gap-4">
        <Link href="/" className="text-lg font-black italic tracking-tight flex-shrink-0">
          mykakheti<span className="text-amber-500">.ge</span>
        </Link>
        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ძებნა განცხადებებში..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition pr-9"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <Link href="/add" className="hidden sm:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-bold transition flex-shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14"/></svg>
          განცხადება
        </Link>
      </nav>

      <div className="flex">

        {/* ── Sidebar ── */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed lg:sticky top-0 lg:top-[53px] z-40 lg:z-auto h-screen lg:h-[calc(100vh-53px)] w-64 lg:w-56 xl:w-64 bg-[#07071a] lg:bg-transparent border-r border-white/5 overflow-y-auto transition-transform duration-300 flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 space-y-1">
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">კატეგორიები</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <span className="hidden lg:block text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 pb-2">კატეგორიები</span>
            {/* All */}
            <button
              onClick={() => { setSelectedCategory('all'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === 'all' ? 'bg-amber-500/15 text-amber-300 border border-amber-400/25' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="flex items-center gap-2"><span>📋</span> ყველა</span>
              <span className="text-[10px] text-white/30">{items.length}</span>
            </button>
            {/* Categories */}
            {ANNOUNCEMENT_CATEGORY_GROUPS.map((group) => {
              const visibleCategories = group.categories.filter((cat) => (categoryCounts[cat] || 0) > 0);
              if (visibleCategories.length === 0) return null;
              return (
                <div key={group.title} className="pt-2">
                  <div className="px-2 pb-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-200/45">
                    {group.title === 'საყოფაცხოვრებო ნივთები' ? 'გასაყიდი საქონელი' : group.title}
                  </div>
                  {visibleCategories.map(cat => {
                    const count = categoryCounts[cat] || 0;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setSidebarOpen(false); setPage(1); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === cat ? 'bg-amber-500/15 text-amber-300 border border-amber-400/25' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className="flex items-center gap-2 text-left">
                          <span className="text-base">{CATEGORY_ICONS[cat] || '📦'}</span>
                          <span className="line-clamp-1">{cat}</span>
                        </span>
                        <span className="text-[10px] text-white/30 flex-shrink-0 ml-1">{count}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 px-4 md:px-6 py-4 space-y-4">

          {/* ── Header row: All Announcements (left) + All Categories (right) ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="inline-flex h-8 items-center justify-center rounded-full border border-amber-300/40 bg-amber-500/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-500/20 whitespace-nowrap"
              >
                ყველა განცხადება
              </button>
              <span className="text-[10px] text-white/30">{items.length}</span>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-8 items-center justify-center rounded-full border border-amber-300/30 bg-amber-500/10 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200 transition hover:bg-amber-500/20 whitespace-nowrap lg:hidden"
            >
              ყველა კატეგორია
            </button>
          </div>

          {/* Filter / Sort bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile sidebar toggle — hidden, replaced by header button above */}

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-400/50 cursor-pointer"
            >
              <option value="newest">უახლესი</option>
              <option value="oldest">ძველი</option>
              <option value="price_asc">ფასი: ზრდადი</option>
              <option value="price_desc">ფასი: კლებადი</option>
            </select>

            {/* Price range */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                placeholder="ფასი დან"
                className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50"
              />
              <span className="text-white/30 text-sm">—</span>
              <input
                type="number"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                placeholder="მდე"
                className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Clear */}
            {hasActiveFilter && (
              <button onClick={clearFilters} className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition">
                გასუფთავება
              </button>
            )}

            {/* Layout toggle */}
            <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setLayout('grid')}
                title="ბარათები"
                className={`p-1.5 rounded-lg transition ${layout === 'grid' ? 'bg-amber-500/20 text-amber-300' : 'text-white/30 hover:text-white'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>
              </button>
              <button
                onClick={() => setLayout('list')}
                title="სია"
                className={`p-1.5 rounded-lg transition ${layout === 'list' ? 'bg-amber-500/20 text-amber-300' : 'text-white/30 hover:text-white'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              </button>
            </div>
          </div>

          {/* Result count + breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/35">
            <Link href="/" className="hover:text-white/60 transition">მთავარი</Link>
            <span>/</span>
            <span>განცხადებები</span>
            {selectedCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="text-amber-400/70">{selectedCategory}</span>
              </>
            )}
            <span className="ml-auto">{filtered.length} განცხადება</span>
          </div>

          {/* Cards */}
          {loading ? (
            <div className={layout === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-2'}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`bg-white/5 rounded-xl animate-pulse ${layout === 'grid' ? 'aspect-[3/4]' : 'h-20'}`} />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="text-5xl">🔍</div>
              <p className="text-white/40 text-sm">განცხადებები ვერ მოიძებნა</p>
              {hasActiveFilter && (
                <button onClick={clearFilters} className="text-amber-400 text-sm underline underline-offset-2">ფილტრები გაასუფთავე</button>
              )}
            </div>
          ) : layout === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {paginated.map(item => (
                <AnnouncementCard key={item.id} announcement={item} layout="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map(item => (
                <AnnouncementCard key={item.id} announcement={item} layout="list" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4 pb-8 flex-wrap">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ← წინა
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="px-2 text-white/30 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${page === p ? 'bg-amber-500 text-black font-bold' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                შემდეგი →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
