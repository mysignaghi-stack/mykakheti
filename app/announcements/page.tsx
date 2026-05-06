'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { CommunitySideWidget } from '../components/community/CommunityWidgets';
import { formatGeorgianDate } from '../lib/utils';

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
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as Announcement[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Prevent browser from performing its own scroll restoration (which can cause a visible jump)
  useEffect(() => {
    let prev: any = undefined;
    try {
      if ('scrollRestoration' in history) {
        prev = history.scrollRestoration;
        history.scrollRestoration = 'manual';
      }
    } catch {}
    return () => {
      try {
        if (prev !== undefined && 'scrollRestoration' in history) history.scrollRestoration = prev;
      } catch {}
    };
  }, []);

  // Restore scroll position synchronously before paint to avoid visible jump
  useLayoutEffect(() => {
    try {
      const pos = sessionStorage.getItem('announcements-scroll');
      if (pos) {
        window.scrollTo({ top: Number(pos || 0), behavior: 'auto' });
        sessionStorage.removeItem('announcements-scroll');
      }
    } catch {}
  }, []);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white overflow-x-hidden">
      <div className="layout-shell max-w-6xl">
        <div className="flex justify-start mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">განცხადებები</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)] gap-10 items-start">
          <aside className="order-2 lg:order-1 w-full max-w-[360px] lg:max-w-[240px] mx-auto lg:mx-0 lg:sticky lg:top-24 lg:mt-8">
            <CommunitySideWidget variant="lostFound" />
          </aside>

          <div className="order-1 lg:order-2">
            {loading ? (
              <div className="opacity-50">იტვირთება...</div>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <Link
                    key={item.id}
                    href={`/announcements/${item.id}`}
                    className="block"
                    onClick={() => {
                      try {
                        sessionStorage.setItem('announcements-scroll', String(window.scrollY || 0));
                      } catch (e) {
                        // ignore
                      }
                    }}
                  >
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {(item.image_url || item.all_images?.[0]) && (
                          <Image
                            src={item.image_url || item.all_images![0]}
                            alt=""
                            width={80}
                            height={80}
                            className="rounded-2xl object-contain flex-shrink-0 shadow-lg ring-1 ring-amber-400/20 w-16 h-16 sm:w-20 sm:h-20"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                            <h3 className="font-black text-white text-lg italic">{item.title}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-amber-500 text-xs font-bold uppercase px-2 py-1 bg-amber-500/10 rounded">
                                {item.category}
                              </span>
                              <span className="text-blue-400 text-xs font-bold uppercase px-2 py-1 bg-blue-400/10 rounded">
                                {item.location}
                              </span>
                            </div>
                          </div>
                          <p className="text-white/80 italic leading-relaxed line-clamp-2">{item.description}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="text-white/40 text-xs">
                              {formatGeorgianDate(item.created_at)}
                            </div>
                            <div className="text-amber-500 font-black text-lg">
                              {item.price} {item.currency === 'USD' ? '$' : '₾'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="order-3 w-full max-w-[360px] lg:max-w-[240px] mx-auto lg:mx-0 lg:sticky lg:top-24 lg:mt-8">
            <CommunitySideWidget variant="masters" />
          </aside>
        </div>
      </div>
    </main>
  );
}
