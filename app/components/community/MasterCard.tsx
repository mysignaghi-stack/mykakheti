'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

type Rating = {
  id: string;
  master_id: string;
  stars: number;
  comment: string | null;
  created_at: string | null;
  rater_fingerprint: string | null;
};

export default function MasterCard({ master, showDetailsLink = true }: { master: Master; showDetailsLink?: boolean }) {
  const [currentMaster, setCurrentMaster] = useState(master);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRatings, setLoadingRatings] = useState(false);

  useEffect(() => {
    setCurrentMaster(master);
  }, [master]);

  useEffect(() => {
    let active = true;
    const fetchRatings = async () => {
      setLoadingRatings(true);
      try {
        const response = await fetch(`/api/masters/${master.id}/ratings`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (active && response.ok) setRatings(payload.ratings ?? []);
      } finally {
        if (active) setLoadingRatings(false);
      }
    };
    fetchRatings();
    return () => {
      active = false;
    };
  }, [master.id]);

  const submitRating = async () => {
    if (stars < 1 || stars > 5) return alert('აირჩიეთ 1-5 ვარსკვლავი');
    if (!master.id) return alert('სერვისის ID არ არის');

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('შეფასებისა და კომენტარის დასამატებლად საჭიროა რეგისტრაცია/შესვლა.');
        return;
      }

      const response = await fetch(`/api/masters/${master.id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        stars,
        comment,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'შეფასების დამატება ვერ მოხერხდა');

      if (payload.master) setCurrentMaster(payload.master);
      if (payload.rating) {
        setRatings((current) => [payload.rating, ...current.filter((rating) => rating.id !== payload.rating.id)]);
      }
      alert('შეფასება დამატებულია!');
      setStars(0);
      setComment('');
    } catch (e: unknown) {
      let message = 'შეცდომა შეფასების დამატებისას';
      if (e && typeof e === 'object' && 'message' in e) {
        message = String((e as any).message);
      } else if (e instanceof Error) {
        message = e.message;
      }
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasOnCall = Boolean(currentMaster.service_area?.includes('გამოძახებით'));

  return (
    <div className="overflow-hidden bg-white/5 rounded-2xl border border-white/10">
      {currentMaster.photo_url && (
        <div className="relative h-40 w-full bg-white/5">
          <Image src={currentMaster.photo_url} alt={currentMaster.full_name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-contain p-2" />
        </div>
      )}
      <div className="p-5 flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-black text-white text-base italic">{currentMaster.full_name}</h3>
              <p className="text-[11px] text-amber-400 uppercase font-black">{currentMaster.profession}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
          </div>
          {currentMaster.category && (<p className="text-[11px] text-white/50">მომსახურების ტიპი: {currentMaster.category}</p>)}
          {currentMaster.location && (<p className="text-[11px] text-white/50">ლოკაცია: {currentMaster.location}</p>)}
          <p className="text-[11px] text-white/50">ფასი: {currentMaster.price_note || 'შეთანხმებით'}</p>
          {hasOnCall && (<p className="text-[11px] text-emerald-300/80">გამოძახებით მომსახურება</p>)}
          {currentMaster.phone && (<p className="text-[11px] text-white/50">ტელ: {currentMaster.phone}</p>)}
          {currentMaster.service_area && (<p className="text-[11px] text-white/50">{currentMaster.service_area}</p>)}
          {currentMaster.description && (<p className="mt-2 whitespace-pre-line text-sm text-white/80">{currentMaster.description}</p>)}
          {showDetailsLink && (
            <Link href={`/community/masters/${currentMaster.id}`} className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase text-white/65 transition hover:border-amber-300/35 hover:text-amber-100">
              დეტალურად ნახვა
            </Link>
          )}
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-black">⭐ {currentMaster.rating_avg?.toFixed(1) || '0.0'}</div>
          <div className="text-[10px] text-white/40">{currentMaster.ratings_count ?? 0} შეფასება</div>
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
        <div className="mt-4 space-y-2">
          {loadingRatings ? (
            <div className="text-xs text-white/35">კომენტარები იტვირთება...</div>
          ) : ratings.length > 0 ? (
            ratings.slice(0, 3).map((rating) => (
              <div key={rating.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="mb-1 text-[10px] font-black text-amber-300">{'★'.repeat(rating.stars)}{'☆'.repeat(5 - rating.stars)}</div>
                {rating.comment ? <p className="text-xs leading-relaxed text-white/70">{rating.comment}</p> : null}
              </div>
            ))
          ) : (
            <div className="text-xs text-white/35">კომენტარები ჯერ არ არის.</div>
          )}
        </div>
      </div>
    </div>
  );
}
