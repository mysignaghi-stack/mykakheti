'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Database } from '../../../types/supabase';
import { supabase } from '../../lib/supabase';

type MasterPortfolioRow = Database['public']['Tables']['master_portfolio']['Row'];

interface Master {
  id: string;
  full_name: string;
  profession: string;
  phone?: string | null;
  location?: string | null;
  description?: string | null;
  rating_avg: number;
  ratings_count: number;
  photo_url?: string | null;
  service_area?: string | null;
  price_note?: string | null;
  verified?: boolean | null;
  admin_recommended?: boolean | null;
}

export default function MasterCard({ master }: { master: Master }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [portfolio, setPortfolio] = useState<MasterPortfolioRow[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any).from('master_portfolio').select('*').eq('master_id', master.id).limit(6);
      setPortfolio(data ?? []);
    };
    load();
  }, [master.id]);

  const submitRating = async () => {
    if (stars < 1 || stars > 5) return alert('აირჩიეთ 1-5 ვარსკვლავი');
    setSubmitting(true);
    try {
      const fingerprint = typeof window !== 'undefined' ? (localStorage.getItem('fingerprint') || (Math.random().toString(36).slice(2))) : 'web';
      localStorage.setItem('fingerprint', fingerprint);
      const { error: rateErr } = await (supabase as any).from('master_ratings').insert({
        master_id: master.id,
        stars,
        comment,
        rater_fingerprint: fingerprint
      });
      if (rateErr) throw rateErr;
      // update aggregate
      const newCount = (master.ratings_count || 0) + 1;
      const newAvg = ((master.rating_avg || 0) * (master.ratings_count || 0) + stars) / newCount;
      const { error: updErr } = await (supabase as any).from('masters').update({ rating_avg: newAvg, ratings_count: newCount }).eq('id', master.id);
      if (updErr) throw updErr;
      alert('მიმოხილვა დამატებულია!');
      setStars(0); setComment('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'შეცდომა შეფასების დამატებისას';
      console.error(e);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            {master.photo_url && (
              <Image src={master.photo_url} alt="" width={40} height={40} className="rounded-full object-cover" />
            )}
            <div>
              <h3 className="font-black text-white text-base italic">{master.full_name}</h3>
              <p className="text-[11px] text-amber-400 uppercase font-black">{master.profession}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {master.verified && (<span className="text-[10px] bg-green-700/30 text-green-300 px-2 py-0.5 rounded">შემოწმებული</span>)}
            {master.admin_recommended && (<span className="text-[10px] bg-blue-700/30 text-blue-300 px-2 py-0.5 rounded">ადმინ რეკომენდაცია</span>)}
          </div>
          {master.location && (<p className="text-[11px] text-white/50">ლოკაცია: {master.location}</p>)}
          {master.service_area && (<p className="text-[11px] text-white/50">ტერიტორია: {master.service_area}</p>)}
          {master.phone && (<p className="text-[11px] text-white/50">ტელ: {master.phone}</p>)}
          {master.price_note && (<p className="text-[11px] text-white/50">ფასი: {master.price_note}</p>)}
          {master.description && (<p className="mt-2 text-sm text-white/80">{master.description}</p>)}
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-black">⭐ {master.rating_avg?.toFixed(1) || '0.0'}</div>
          <div className="text-[10px] text-white/40">{master.ratings_count} შეფასება</div>
        </div>
      </div>

      {portfolio.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {portfolio.map(p => (
            <Image key={p.id} src={p.media_url} alt="" width={120} height={80} className="w-full h-20 object-cover rounded" />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex gap-1 mb-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setStars(n)} className={`text-xl ${stars >= n ? 'text-amber-400' : 'text-white/20'}`}>★</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="მოკლე კომენტარი" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
          <button onClick={submitRating} disabled={submitting} className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-4 py-2 font-bold">
            {submitting ? '...' : 'შეფასება'}
          </button>
        </div>
      </div>
    </div>
  );
}
