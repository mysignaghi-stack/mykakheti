'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../../types/supabase';
import { useSearchParams } from 'next/navigation';

type LFItem = Database['public']['Tables']['lost_found']['Row'];

function LostFoundPageContent() {
  const [items, setItems] = useState<LFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selectedId');

  const CATEGORY_LABELS: Record<string, string> = {
    document: 'დოკუმენტები',
    pet: 'შინაური ცხოველი',
    keys_items: 'გასაღები/ნივთები',
    other: 'სხვა',
  };

  const FILTER_LABELS: Record<'lost'|'found', string> = {
    lost: 'დაკარგული',
    found: 'ნაპოვნი',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('lost_found')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as LFItem[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(`lost-found-${selectedId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedId]);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
          <Link href="/community/lost-found/submit" className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-amber-500 hover:text-black transition">
            დამატება
          </Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">დაკარგული და ნაპოვნი</h1>
        <h2 className="text-xl font-black text-amber-500 uppercase italic mb-4">Announcement Feed</h2>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(it => (
              <Link key={it.id} href={`/community/lost-found/${it.id}`} className="block">
                <div id={`lost-found-${it.id}`} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                  <div className="flex gap-3 items-start">
                    {it.image_url && (
                      <Image src={it.image_url} alt="" width={80} height={80} className="rounded-2xl object-contain shadow-lg ring-1 ring-amber-400/20" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-white text-base italic line-clamp-1">{it.title}</h3>
                        <div className="flex items-center gap-2">
                          {it.category && (<span className="text-[10px] font-black uppercase text-white/40">{CATEGORY_LABELS[it.category as keyof typeof CATEGORY_LABELS] ?? it.category}</span>)}
                          <span className={`text-[10px] font-black uppercase ${it.kind==='lost'?'text-red-400':'text-green-400'}`}>{it.kind ? FILTER_LABELS[it.kind as 'lost'|'found'] : ''}</span>
                        </div>
                      </div>
                      {it.location && (<p className="text-[11px] text-white/50">ლოკაცია: {it.location}</p>)}
                      {it.event_date && (<p className="text-[11px] text-white/50">თარიღი: {new Date(it.event_date).toLocaleDateString()}</p>)}
                      {it.contact && (<p className="text-[11px] text-white/50">კონტაქტი: {it.contact}</p>)}
                      {it.description && (<p className="mt-2 text-sm text-white/80 line-clamp-3">{it.description}</p>)}
                      {it.kind==='lost' && it.reward && (
                        <div className="mt-2 text-[12px] text-amber-400 font-black">მპოვნელს დავასაჩუქრებ {it.reward_note ? `— ${it.reward_note}`:''}</div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function LostFoundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LostFoundPageContent />
    </Suspense>
  );
}
