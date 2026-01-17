'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Database } from '@/types/supabase';
import { supabase } from '../../lib/supabase';

type Announcement = Database['public']['Tables']['announcements']['Row'];

export default function AdminAnnouncements() {
  const [pendingAds, setPendingAds] = useState<Announcement[]>([]);
  const [liveAds, setLiveAds] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllAds(); }, []);

  async function fetchAllAds() {
    setLoading(true);
    try {
      // ერთდროულად მოთხოვნა ორივე ტიპის განცხადებაზე
      const [pendingRes, liveRes] = await Promise.all([
        (supabase as any).from('announcements').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
        (supabase as any).from('announcements').select('*').eq('is_approved', true).order('created_at', { ascending: false })
      ]);

      if (pendingRes.data) setPendingAds(pendingRes.data);
      if (liveRes.data) setLiveAds(liveRes.data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function approveAd(id: string) {
    const { error } = await (supabase as any).from('announcements').update({ is_approved: true }).eq('id', id);
    if (!error) {
      // ანიმაციური გადასვლისთვის ადგილობრივი სტეიტის განახლება
      const adToApprove = pendingAds.find(a => a.id === id);
      setPendingAds(prev => prev.filter(a => a.id !== id));
      if (adToApprove) setLiveAds(prev => [adToApprove, ...prev]);
    }
  }

  async function deleteAd(id: string) {
    if (confirm('ნამდვილად გსურთ ამ განცხადების წაშლა?')) {
      const { error } = await (supabase as any).from('announcements').delete().eq('id', id);
      if (!error) {
        setPendingAds(prev => prev.filter(a => a.id !== id));
        setLiveAds(prev => prev.filter(a => a.id !== id));
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 font-sans text-white">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl gap-6">
          <div>
            <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter leading-none">
              განცხადებების მართვა
            </h1>
            <p className="text-white/40 font-bold text-xs mt-2 uppercase tracking-[0.2em] italic">
              Digital Kakheti Hub • მოდერაცია
            </p>
          </div>
          <Link href="/admin" className="bg-white/5 text-white px-8 py-3 rounded-2xl font-black uppercase italic text-[11px] border border-white/10 hover:bg-white hover:text-black transition-all">
            ← ადმინ ჰაბი
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-white/20 uppercase italic tracking-widest animate-pulse">იტვირთება მონაცემები...</p>
          </div>
        ) : (
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
                  {pendingAds.map(ad => (
                    <div key={ad.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
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
                      <div className="flex gap-3">
                        <button
                          onClick={() => approveAd(ad.id)}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                        >
                          დამტკიცება
                        </button>
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                        >
                          წაშლა
                        </button>
                      </div>
                    </div>
                  ))}
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
                  {liveAds.map(ad => (
                    <div key={ad.id} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
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
                      <div className="flex gap-3">
                        <Link
                          href={`/announcements/${ad.id}`}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-2 font-black uppercase text-xs text-center"
                        >
                          ნახვა
                        </Link>
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2 font-black uppercase text-xs"
                        >
                          წაშლა
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
