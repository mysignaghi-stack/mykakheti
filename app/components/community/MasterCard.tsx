'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Database } from '../../../types/supabase';
import { supabase } from '../../lib/supabase';

interface Master {
  id: string;
  full_name: string;
  profession: string;
  phone?: string | null;
  location?: string | null;
  description?: string | null;
  rating_avg: number | null;
  ratings_count: number | null;
}

export default function MasterCard({ master }: { master: Master }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
            <div>
              <h3 className="font-black text-white text-base italic">{master.full_name}</h3>
              <p className="text-[11px] text-amber-400 uppercase font-black">ოსტატი - {master.profession}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
          </div>
          {master.location && (<p className="text-[11px] text-white/50">ლოკაცია: {master.location}</p>)}
          {master.phone && (<p className="text-[11px] text-white/50">ტელ: {master.phone}</p>)}
          {master.description && (<p className="mt-2 text-sm text-white/80">{master.description}</p>)}
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-black">⭐ {master.rating_avg?.toFixed(1) || '0.0'}</div>
          <div className="text-[10px] text-white/40">{master.ratings_count} შეფასება</div>
        </div>
      </div>

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
