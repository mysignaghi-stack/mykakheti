'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

interface LFItem {
  id: string;
  kind: 'lost' | 'found';
  title: string;
  description: string | null;
  location: string | null;
  event_date: string | null;
  contact: string | null;
  image_url?: string | null;
  category?: 'document'|'pet'|'keys_items'|'other'|null;
  reward?: boolean | null;
  reward_note?: string | null;
  expires_at?: string | null;
  resolved?: boolean | null;
}

export default function LostFoundPage() {
  const [items, setItems] = useState<LFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'lost'|'found'>('all');
  const [cat, setCat] = useState<'all'|'document'|'pet'|'keys_items'|'other'>('all');

  const CATEGORY_LABELS: Record<string, string> = {
    all: 'ყველა კატეგორია',
    document: 'დოკუმენტები',
    pet: 'შინაური ცხოველი',
    keys_items: 'გასაღები/ნივთები',
    other: 'სხვა',
  };

  const FILTER_LABELS: Record<'all'|'lost'|'found', string> = {
    all: 'ყველა',
    lost: 'დაკარგული',
    found: 'ნაპოვნი',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase
        .from('lost_found')
        .select('*')
        .eq('is_approved', true)
        .eq('resolved', false)
        .or('expires_at.is.null,expires_at.gt.'+new Date().toISOString())
        .order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('kind', filter);
      if (cat !== 'all') query = query.eq('category', cat);
      const { data } = await query;
      setItems((data || []) as LFItem[]);
      setLoading(false);
    };
    fetchData();
  }, [filter, cat]);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-amber-500 uppercase italic">დაკარგული და ნაპოვნი</h1>
          <div className="flex gap-2">
            {(['all','lost','found'] as const).map(k => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-xl text-xs border ${filter===k?'bg-amber-600 text-white border-amber-600':'bg-white/5 text-white border-white/10'}`}>{FILTER_LABELS[k]}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {(['all','document','pet','keys_items','other'] as const).map(c => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded-xl text-xs border ${cat===c?'bg-white/20 text-white border-white/20':'bg-white/5 text-white border-white/10'}`}>{CATEGORY_LABELS[c]}</button>
          ))}
        </div>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(it => (
              <div key={it.id} className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex gap-3 items-start">
                  {it.image_url && (
                    <Image src={it.image_url} alt="" width={80} height={80} className="rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-white text-base italic line-clamp-1">{it.title}</h3>
                      <div className="flex items-center gap-2">
                        {it.category && (<span className="text-[10px] font-black uppercase text-white/40">{CATEGORY_LABELS[it.category] ?? it.category}</span>)}
                        <span className={`text-[10px] font-black uppercase ${it.kind==='lost'?'text-red-400':'text-green-400'}`}>{FILTER_LABELS[it.kind]}</span>
                      </div>
                    </div>
                    {it.location && (<p className="text-[11px] text-white/50">ლოკაცია: {it.location}</p>)}
                    {it.event_date && (<p className="text-[11px] text-white/50">თარიღი: {new Date(it.event_date).toLocaleDateString()}</p>)}
                    {it.contact && (<p className="text-[11px] text-white/50">კონტაქტი: {it.contact}</p>)}
                    {it.description && (<p className="mt-2 text-sm text-white/80 line-clamp-3">{it.description}</p>)}
                    {it.kind==='lost' && it.reward && (
                      <div className="mt-2 text-[12px] text-amber-400 font-black">მპოვნელს დავასაჩუქრებ {it.reward_note ? `— ${it.reward_note}`:''}</div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => window.open(`/community/lost-found/${it.id}`, '_blank')} className="bg-white/5 text-white px-3 py-1 rounded-xl text-xs border border-white/10">ვრცლად</button>
                      <button onClick={() => {
                        const url = `${window.location.origin}/community/lost-found/${it.id}`;
                        const share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                        window.open(share, '_blank', 'noopener');
                      }} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-xl text-xs hover:bg-blue-600 hover:text-white">გაზიარება</button>
                      <button onClick={async () => {
                        if (!confirm('მონიშვნა როგორც ნაპოვნი/დახურული?')) return;
                        await (supabase as any).from('lost_found').update({ resolved: true }).eq('id', it.id);
                        setItems(prev => prev.filter(p => p.id !== it.id));
                      }} className="bg-green-600/20 text-green-400 px-3 py-1 rounded-xl text-xs hover:bg-green-600 hover:text-white">ნაპოვნია</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
