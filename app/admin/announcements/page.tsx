'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import PollCreator from '../../components/admin/PollCreator';
import ChallengeCreator from '../../components/admin/ChallengeCreator';

export default function AdminAnnouncements() {
  const [pendingAds, setPendingAds] = useState<any[]>([]);
  const [liveAds, setLiveAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllAds(); }, []);

  async function fetchAllAds() {
    setLoading(true);
    try {
      // ერთდროულად მოთხოვნა ორივე ტიპის განცხადებაზე
      const [pendingRes, liveRes] = await Promise.all([
        supabase.from('announcements').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').eq('is_approved', true).order('created_at', { ascending: false })
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
    const { error } = await supabase.from('announcements').update({ is_approved: true }).eq('id', id);
    if (!error) {
      // ანიმაციური გადასვლისთვის ადგილობრივი სტეიტის განახლება
      const adToApprove = pendingAds.find(a => a.id === id);
      setPendingAds(prev => prev.filter(a => a.id !== id));
      if (adToApprove) setLiveAds(prev => [adToApprove, ...prev]);
    }
  }

  async function deleteAd(id: string) {
    if (confirm('ნამდვილად გსურთ ამ განცხადების წაშლა?')) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
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
            <div>Pending Ads</div>
            <div>Live Ads</div>
          </div>
        )}
      </div>
    </main>
  );
}
