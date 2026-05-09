'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

interface Master {
  id: string;
  full_name: string;
  profession: string;
  category?: string | null;
  phone?: string | null;
  location?: string | null;
  description?: string | null;
  photo_url?: string | null;
  price_note?: string | null;
  service_area?: string | null;
  rating_avg: number | null;
  ratings_count: number | null;
}

export default function MasterCard({ master }: { master: Master }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRating = async () => {
    if (stars < 1 || stars > 5) return alert('აირჩიეთ 1-5 ვარსკვლავი');
    if (!master.id) return alert('სერვისის ID არ არის');

    setSubmitting(true);
    try {
      const fingerprint = typeof window !== 'undefined' ? (localStorage.getItem('fingerprint') || (Math.random().toString(36).slice(2))) : 'web';
      localStorage.setItem('fingerprint', fingerprint);

      console.log('Submitting rating:', { masterId: master.id, stars, comment, fingerprint });

      // First check if this user has already rated this master
      const { data: existingRating, error: checkError } = await (supabase as any)
        .from('master_ratings')
        .select('id')
        .eq('master_id', master.id)
        .eq('rater_fingerprint', fingerprint)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
        throw checkError;
      }

      if (existingRating) {
        alert('თქვენ უკვე შეაფასეთ ეს სერვისი');
        return;
      }

      const { error: rateErr } = await (supabase as any).from('master_ratings').insert({
        master_id: master.id,
        stars,
        comment,
        rater_fingerprint: fingerprint
      });
      if (rateErr) throw rateErr;

      // Note: Skipping masters table update due to RLS restrictions
      // Ratings will be calculated on-demand when fetching masters
      // TODO: Implement proper rating aggregation (database function or view)

      alert('მიმოხილვა დამატებულია!');
      setStars(0); setComment('');
    } catch (e: unknown) {
      // Handle Supabase errors specifically
      let message = 'შეცდომა შეფასების დამატებისას';
      if (e && typeof e === 'object' && 'message' in e) {
        message = String((e as any).message);
      } else if (e instanceof Error) {
        message = e.message;
      }

      console.error('Master rating submission error:', {
        error: e,
        masterId: master.id,
        stars,
        comment,
        fingerprint: typeof window !== 'undefined' ? localStorage.getItem('fingerprint') : 'web',
        errorType: typeof e,
        errorMessage: message,
        supabaseDetails: e && typeof e === 'object' && 'details' in e ? (e as any).details : 'no details',
        supabaseHint: e && typeof e === 'object' && 'hint' in e ? (e as any).hint : 'no hint',
        supabaseCode: e && typeof e === 'object' && 'code' in e ? (e as any).code : 'no code'
      });
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasOnCall = Boolean(master.service_area?.includes('გამოძახებით'));

  return (
    <div className="overflow-hidden bg-white/5 rounded-2xl border border-white/10">
      {master.photo_url && (
        <div className="relative h-40 w-full bg-white/5">
          <Image src={master.photo_url} alt={master.full_name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
        </div>
      )}
      <div className="p-5 flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-black text-white text-base italic">{master.full_name}</h3>
              <p className="text-[11px] text-amber-400 uppercase font-black">{master.profession}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
          </div>
          {master.category && (<p className="text-[11px] text-white/50">მომსახურების ტიპი: {master.category}</p>)}
          {master.location && (<p className="text-[11px] text-white/50">ლოკაცია: {master.location}</p>)}
          <p className="text-[11px] text-white/50">ფასი: {master.price_note || 'შეთანხმებით'}</p>
          {hasOnCall && (<p className="text-[11px] text-emerald-300/80">გამოძახებით მომსახურება</p>)}
          {master.phone && (<p className="text-[11px] text-white/50">ტელ: {master.phone}</p>)}
          {master.service_area && (<p className="text-[11px] text-white/50">{master.service_area}</p>)}
          {master.description && (<p className="mt-2 whitespace-pre-line text-sm text-white/80">{master.description}</p>)}
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-black">⭐ {master.rating_avg?.toFixed(1) || '0.0'}</div>
          <div className="text-[10px] text-white/40">{master.ratings_count} შეფასება</div>
        </div>
      </div>

      <div className="border-t border-white/10 p-5 pt-3">
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
