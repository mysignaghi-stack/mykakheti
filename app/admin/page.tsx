'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { supabase } from '../lib/supabase';

const ADMIN_LINKS = [
  // community link removed — community moderation is available from the main cards above
  // 'მისალოცები' merged into 'ქომუნითი' to avoid duplicate panels
  { href: '/admin/messages', title: 'შეტყობინებები', desc: 'კონტაქტის ფორმის მესიჯები' },
  { href: '/admin/posts', title: 'ადმინისტრატორის განცხადებები', desc: 'ადმინის პოსტების მართვა' },
  { href: '/admin/square', title: 'კახური მოედანი', desc: 'ჩატის მესიჯების მართვა' },
  { href: '/admin/site-settings', title: 'საიტის პარამეტრები', desc: 'უკანა ფონის და სხვა პარამეტრების მართვა' },
  { href: '/admin/diagnostic', title: 'დიაგნოსტიკა', desc: 'ადმინისტრატორის სტატუსის შემოწმება' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdmin, user, loading, handleAdminLogout } = useAdminAuth();
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingAds: 0,
    pendingCongrats: 0,
    pendingObituaries: 0,
    pendingLostFound: 0,
    pendingMasters: 0,
    approvedAds: 0,
    approvedCongrats: 0,
    approvedObituaries: 0,
    approvedLostFound: 0,
    approvedMasters: 0,
  });

  const totalCommunityPending = stats.approvedObituaries + stats.approvedLostFound + stats.approvedMasters + stats.approvedCongrats;

  const loadStats = useCallback(async () => {
    if (!isAdmin) return;
    setStatsLoading(true);
    try {
      const [{ count: pendingAds }, { count: approvedAds }, { count: pendingCongrats }, { count: pendingObituaries }, { count: pendingLostFound }, { count: pendingMasters }, { count: approvedCongrats }, { count: approvedObituaries }, { count: approvedLostFound }, { count: approvedMasters }] = await Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('congratulations').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('obituaries').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('lost_found').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('masters').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('congratulations').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('obituaries').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('lost_found').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('masters').select('*', { count: 'exact', head: true }).eq('is_approved', true),
      ]);

      setStats({
        pendingAds: pendingAds ?? 0,
        approvedAds: approvedAds ?? 0,
        pendingCongrats: pendingCongrats ?? 0,
        pendingObituaries: pendingObituaries ?? 0,
        pendingLostFound: pendingLostFound ?? 0,
        pendingMasters: pendingMasters ?? 0,
        approvedCongrats: approvedCongrats ?? 0,
        approvedObituaries: approvedObituaries ?? 0,
        approvedLostFound: approvedLostFound ?? 0,
        approvedMasters: approvedMasters ?? 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin/login');
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, loadStats]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <p>იტვირთება...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-white/70 mb-4">წვდომა შეზღუდულია</p>
          <Link href="/admin/login" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">შესვლა</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase italic text-amber-500">ადმინისტრატორის პანელი</h1>
            <p className="text-white/50 text-sm">მომხმარებელი: {user?.email ?? '—'}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase">მთავარი</Link>
            <button
              onClick={loadStats}
              className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase"
            >
              {statsLoading ? 'განახლება...' : 'განახლება'}
            </button>
            <button onClick={handleAdminLogout} className="bg-red-600 px-5 py-2 rounded-xl text-xs font-black uppercase">გამოსვლა</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <Link href="/admin/announcements" className="bg-blue-600/20 border border-blue-600/40 rounded-2xl p-6 hover:bg-blue-600/30 transition-all">
            <div className="text-xs uppercase font-black text-blue-300">მომხმარებლების განცხადებები</div>
            <div className="text-3xl font-black mt-2">{stats.approvedAds}</div>
            <p className="text-white/60 text-sm mt-1">გამოქვეყნებული განცხადება</p>
          </Link>
          <Link href="/admin/community" className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition-all">
            <div className="text-xs uppercase font-black text-white/60">ქომუნითი</div>
            <div className="text-3xl font-black mt-2">{totalCommunityPending}</div>
            <p className="text-white/50 text-sm mt-1">აქტიური სამძიმარი/დაკარგული/ოსტატები/მისალოცი</p>
            <div className="text-[11px] text-white/40 mt-2">სამძიმარი: {stats.approvedObituaries} • დაკარგული: {stats.approvedLostFound} • ოსტატები: {stats.approvedMasters} • მისალოცი: {stats.approvedCongrats}</div>
          </Link>
          {/* 'მისალოცები' moved into the community page (use /admin/community) */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-white/10 transition-all">
              <h3 className="text-lg font-black uppercase italic mb-2 group-hover:text-amber-400">{link.title}</h3>
              <p className="text-white/50 text-sm">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}