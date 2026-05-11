'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '@/types/supabase';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminNav from '../../components/admin/AdminNav';
import { isAgroSubmission } from '../../lib/specialAnnouncements';

type Announcement = Database['public']['Tables']['announcements']['Row'];

export default function AdminAnnouncements() {
  const [pendingAds, setPendingAds] = useState<Announcement[]>([]);
  const [liveAds, setLiveAds] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishDrafts, setPublishDrafts] = useState<Record<string, string>>({});
  const [expireDrafts, setExpireDrafts] = useState<Record<string, string>>({});
  const [bulkFrom, setBulkFrom] = useState<string>('');
  const [bulkTo, setBulkTo] = useState<string>('');
  const [bulkPublishAt, setBulkPublishAt] = useState<string>('');
  const [bulkExpireAt, setBulkExpireAt] = useState<string>('');
  const { isAdmin, loading: authLoading } = useAdminAuth();

  const getAnnouncementImages = (ad: Announcement) => {
    const allImages = Array.isArray((ad as Announcement & { all_images?: string[] | null }).all_images)
      ? (ad as Announcement & { all_images?: string[] | null }).all_images!.filter(Boolean)
      : [];
    const primary = (ad as Announcement & { image_url?: string | null }).image_url ?? null;
    const combined = primary ? [primary, ...allImages] : allImages;
    return Array.from(new Set(combined));
  };

  const toInputValue = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (!isAdmin || authLoading) return;
    fetchAllAds();
  }, [isAdmin, authLoading]);

  async function fetchAllAds() {
    setLoading(true);
    try {
      const [pendingRes, liveRes] = await Promise.all([
        (supabase as any).from('announcements').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
        (supabase as any).from('announcements').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
      ]);

      if (pendingRes.error) console.error('Pending ads fetch error', pendingRes.error);
      if (liveRes.error) console.error('Live ads fetch error', liveRes.error);

      if (pendingRes.data) setPendingAds(pendingRes.data.filter((ad: Announcement) => !isAgroSubmission(ad)));
      if (liveRes.data) setLiveAds(liveRes.data.filter((ad: Announcement) => !isAgroSubmission(ad)));
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveAd( id: string) {
    const response = await fetch('/api/admin/announcements/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      alert(payload?.error ?? 'დადასტურება ვერ მოხერხდა');
      return;
    }

    const adToApprove = pendingAds.find(a => a.id === id);
    setPendingAds(prev => prev.filter(a => a.id !== id));
    if (adToApprove && !isAgroSubmission(adToApprove)) setLiveAds(prev => [{ ...adToApprove, is_approved: true }, ...prev]);
  }

  async function deleteAd(id: string) {
    if (!confirm('ნამდვილად გსურთ ამ განცხადების წაშლა?')) return;
    const response = await fetch('/api/admin/announcements/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      alert(`შეცდომა წაშლისას: ${payload?.error ?? 'უცნობი შეცდომა'}`);
      return;
    }

    setPendingAds(prev => prev.filter(a => a.id !== id));
    setLiveAds(prev => prev.filter(a => a.id !== id));
  }

  async function saveSchedule(id: string, approveOnSave: boolean) {
    const publishValue = publishDrafts[id];
    const expireValue = expireDrafts[id];
    if (!publishValue && !expireValue) return alert('აირჩიეთ თარიღი');

    const payload: Record<string, string | boolean | null> = {};
    if (publishValue) payload.publish_at = new Date(publishValue).toISOString();
    
    // Only archive if the date is in the past (soft expiration)
    // Future expiration requires cron/triggers or expires_at column
    if (expireValue && new Date(expireValue).getTime() <= Date.now()) {
      payload.is_archived = true;
    }
    
    if (approveOnSave) payload.is_approved = true;

    const { error } = await (supabase as any)
      .from('announcements')
      .update(payload)
      .eq('id', id);

    if (!error) {
      if (approveOnSave) {
        const adToApprove = pendingAds.find(a => a.id === id);
        setPendingAds(prev => prev.filter(a => a.id !== id));
        if (adToApprove && !isAgroSubmission(adToApprove)) setLiveAds(prev => [adToApprove, ...prev]);
      } else {
        fetchAllAds();
      }
    } else {
      alert('დაგეგმვა ვერ მოხერხდა');
    }
  }

  async function applyBulkSchedule() {
    if (!bulkFrom || !bulkTo) return alert('აირჩიეთ პერიოდი');
    if (!bulkPublishAt && !bulkExpireAt) return alert('აირჩიეთ გამოქვეყნების ან წაშლის დრო');

    const fromTime = new Date(bulkFrom).getTime();
    const toTime = new Date(bulkTo).getTime();
    const targetIds = [...pendingAds, ...liveAds]
      .filter((ad) => {
        const createdTime = new Date(ad.created_at ?? '').getTime();
        return Number.isFinite(createdTime) && createdTime >= fromTime && createdTime <= toTime && !isAgroSubmission(ad);
      })
      .map((ad) => ad.id);

    if (targetIds.length === 0) return alert('ამ პერიოდში ჩვეულებრივი განცხადებები ვერ მოიძებნა');

    const payload: Record<string, string | boolean> = {};

    if (bulkPublishAt) payload.publish_at = new Date(bulkPublishAt).toISOString();
    // Only archive if date is passed
    if (bulkExpireAt && new Date(bulkExpireAt).getTime() <= Date.now()) {
      payload.is_archived = true;
    }
    if (bulkPublishAt) payload.is_approved = true;

    const { error } = await (supabase as any)
      .from('announcements')
      .update(payload)
      .in('id', targetIds);

    if (error) {
      alert('მასიური დაგეგმვა ვერ მოხერხდა');
    } else {
      fetchAllAds();
      alert('მასიური დაგეგმვა დასრულდა');
    }
  }

  return (
    authLoading ? (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-white/20 uppercase italic tracking-widest animate-pulse">ავტორიზაცია მოწმდება...</p>
      </div>
    ) : !isAdmin ? (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center gap-4 text-white text-center px-6">
        <p className="text-lg font-black uppercase italic tracking-widest">მხოლოდ ადმინებისთვის</p>
        <Link href="/login" className="px-4 py-2 rounded-xl bg-amber-600 text-black font-black uppercase text-xs">ავტორიზაცია</Link>
      </div>
    ) : (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 font-sans text-white">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl gap-6">
          <div>
            <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter leading-none">
              მომხმარებლების განცხადებების მართვა
            </h1>
            <p className="text-white/40 font-bold text-xs mt-2 uppercase tracking-[0.2em] italic">
              Digital Kakheti Hub • მოდერაცია
            </p>
          </div>
          <AdminNav />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-white/20 uppercase italic tracking-widest animate-pulse">იტვირთება მონაცემები...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
              <h2 className="text-sm font-black text-white/60 uppercase mb-4">მასიური დაგეგმვა</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[10px] text-white/40 uppercase">დან (created_at)</label>
                  <input
                    type="datetime-local"
                    value={bulkFrom}
                    onChange={(e) => setBulkFrom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase">მდე (created_at)</label>
                  <input
                    type="datetime-local"
                    value={bulkTo}
                    onChange={(e) => setBulkTo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase">გამოქვეყნება</label>
                  <input
                    type="datetime-local"
                    value={bulkPublishAt}
                    onChange={(e) => setBulkPublishAt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase">წაშლა</label>
                  <input
                    type="datetime-local"
                    value={bulkExpireAt}
                    onChange={(e) => setBulkExpireAt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={applyBulkSchedule}
                  className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-5 py-2 font-black text-xs uppercase"
                >
                  მასიური დაგეგმვა
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-amber-400">მოლოდინში ({pendingAds.length})</h2>
                  <button onClick={fetchAllAds} className="text-xs font-bold text-white/60 hover:text-white">↻ განახლება</button>
                </div>
                {pendingAds.length === 0 ? (
                  <p className="text-white/40 text-sm">მოლოდინში განცხადებები არ არის.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingAds.map(ad => {
                      const images = getAnnouncementImages(ad);
                      return (
                        <div key={ad.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                          {images.length > 0 && (
                            <div className="flex items-center gap-3">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                                <Image
                                  src={images[0]}
                                  alt={ad.title ?? ''}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {images.slice(1, 4).map((url, idx) => (
                                  <div key={`${ad.id}-thumb-${idx}`} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                    <Image
                                      src={url}
                                      alt={ad.title ?? ''}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                                {images.length > 4 && (
                                  <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/60 font-black">
                                    +{images.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm uppercase tracking-wide text-white/50">{ad.category}</p>
                              <h3 className="text-lg font-black text-white">{ad.title}</h3>
                              <p className="text-white/60 text-sm">{ad.location}</p>
                            </div>
                            <div className="text-right text-sm text-white/50">
                              <p>{new Date(ad.created_at ?? '').toLocaleString('ka-GE')}</p>
                              <p className="font-black text-amber-400">{ad.price} {ad.currency}</p>
                            </div>
                          </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-white/40 uppercase">გამოქვეყნება</label>
                            <input
                              type="datetime-local"
                              value={publishDrafts[ad.id] ?? ''}
                              onChange={(e) => setPublishDrafts(prev => ({ ...prev, [ad.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 uppercase">წაშლა</label>
                            <input
                              type="datetime-local"
                              value={expireDrafts[ad.id] ?? ''}
                              onChange={(e) => setExpireDrafts(prev => ({ ...prev, [ad.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => approveAd(ad.id)}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                          >
                            დამტკიცება
                          </button>
                          <button
                            onClick={() => saveSchedule(ad.id, true)}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                          >
                            დაგეგმვა
                          </button>
                          <button
                            onClick={() => deleteAd(ad.id)}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                          >
                            წაშლა
                          </button>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-green-400">აქტიური ({liveAds.length})</h2>
                  <button onClick={fetchAllAds} className="text-xs font-bold text-white/60 hover:text-white">↻ განახლება</button>
                </div>
                {liveAds.length === 0 ? (
                  <p className="text-white/40 text-sm">აქტიური განცხადებები არ არის.</p>
                ) : (
                  <div className="space-y-3">
                    {liveAds.map(ad => {
                      const images = getAnnouncementImages(ad);
                      return (
                        <div key={ad.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                          {images.length > 0 && (
                            <div className="flex items-center gap-3">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                                <Image
                                  src={images[0]}
                                  alt={ad.title ?? ''}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {images.slice(1, 4).map((url, idx) => (
                                  <div key={`${ad.id}-thumb-${idx}`} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                    <Image
                                      src={url}
                                      alt={ad.title ?? ''}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                                {images.length > 4 && (
                                  <div className="w-12 h-12 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/60 font-black">
                                    +{images.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm uppercase tracking-wide text-white/50">{ad.category}</p>
                              <h3 className="text-lg font-black text-white">{ad.title}</h3>
                              <p className="text-white/60 text-sm">{ad.location}</p>
                            </div>
                            <div className="text-right text-sm text-white/50">
                              <p>{new Date(ad.created_at ?? '').toLocaleString('ka-GE')}</p>
                              <p className="font-black text-amber-400">{ad.price} {ad.currency}</p>
                            </div>
                          </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-white/40 uppercase">გამოქვეყნება</label>
                            <input
                              type="datetime-local"
                              defaultValue={toInputValue((ad as Announcement & { publish_at?: string | null }).publish_at)}
                              onChange={(e) => setPublishDrafts(prev => ({ ...prev, [ad.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 uppercase">წაშლა</label>
                            <input
                              type="datetime-local"
                              defaultValue={toInputValue((ad as Announcement & { expires_at?: string | null }).expires_at)}
                              onChange={(e) => setExpireDrafts(prev => ({ ...prev, [ad.id]: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Link
                            href={`/announcements/${ad.id}`}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-2 font-black uppercase text-xs text-center"
                          >
                            ნახვა
                          </Link>
                          <button
                            onClick={() => saveSchedule(ad.id, false)}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                          >
                            დაგეგმვა
                          </button>
                          <button
                            onClick={() => deleteAd(ad.id)}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                          >
                            წაშლა
                          </button>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
    )
  );
}
