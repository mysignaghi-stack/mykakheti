'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '../../../types/supabase';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminNav from '../../components/admin/AdminNav';
import {
  AGRO_SUBMISSION_CATEGORY,
  GRAIN_SUBMISSION_CATEGORY,
  SERVICE_REQUEST_CATEGORY,
  isAgroSubmission,
  isCommunityAnnouncement,
} from '../../lib/specialAnnouncements';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];

export default function ModerateAds() {
  const [pendingAds, setPendingAds] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryDrafts, setExpiryDrafts] = useState<Record<string, string>>({});
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const { isAdmin, loading: authLoading } = useAdminAuth();

  const COMMUNITY_CATEGORIES = [
    { value: AGRO_SUBMISSION_CATEGORY, label: 'აგრო-ბირჟის განაცხადები' },
    { value: GRAIN_SUBMISSION_CATEGORY, label: 'მარცვლეულის განაცხადები' },
    { value: 'დაკარგული/ნაპოვნი', label: 'დაკარგული/ნაპოვნის გამოქვეყნება' },
    { value: 'ოსტატი/სპეციალისტი', label: 'სერვისის გამოქვეყნება' },
    { value: SERVICE_REQUEST_CATEGORY, label: 'სერვისის მაძიებლები' },
    { value: 'ოსტატი', label: 'ოსტატის ძველი განაცხადები' },
    { value: 'სერვისი', label: 'სერვისის ძველი განაცხადები' },
  ];

  const getAnnouncementImages = (ad: AnnouncementRow) => {
    const allImages = Array.isArray((ad as AnnouncementRow & { all_images?: string[] | null }).all_images)
      ? (ad as AnnouncementRow & { all_images?: string[] | null }).all_images!.filter(Boolean)
      : [];
    const primary = (ad as AnnouncementRow & { image_url?: string | null }).image_url ?? null;
    const combined = primary ? [primary, ...allImages] : allImages;
    return Array.from(new Set(combined));
  };

  // 1. დაუდასტურებელი განცხადებების წამოღება
  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/announcements/pending', {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pending announcements');
      }
      const result = await response.json();
      console.log('API Raw Data:', result.data);
      setPendingAds(result.data || []);
    } catch (error) {
      console.error('Pending fetch error (announcements)', error);
      setPendingAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (!isAdmin || authLoading) return;

    fetchPending(); 

    // რეალტაიმი განახლება ახალი განცხადებებისთვის
    const channel = supabase.channel('moderate_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        if (payload.new.is_approved === false) {
          setPendingAds(prev => [payload.new as AnnouncementRow, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'announcements' }, (payload) => {
        if (payload.new.is_approved === true) {
          setPendingAds(prev => prev.filter(ad => ad.id !== (payload.new as AnnouncementRow).id));
        }
      })
      .subscribe();

    // ავტო რეფრეში ყოველ 30 წამში, თუ რეალტაიმი არ მუშაობს
    const refreshInterval = setInterval(fetchPending, 30000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(refreshInterval);
    };
  }, [isAdmin, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white/20 font-black uppercase italic tracking-widest text-xs animate-pulse">ავტორიზაცია მოწმდება...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center gap-4 text-white text-center px-6">
        <p className="text-lg font-black uppercase italic tracking-widest">მხოლოდ ადმინებისთვის</p>
        <Link href="/login" className="px-4 py-2 rounded-xl bg-amber-600 text-black font-black uppercase text-xs">ავტორიზაცია</Link>
      </div>
    );
  }

  // 2. დადასტურების ფუნქცია (Optimistic Update)
  const approveAd = async (id: string) => {
    // სიიდან მაშინვე ვაქრობთ ვიზუალურად
    setPendingAds(prev => prev.filter(ad => ad.id !== id));

    const response = await fetch('/api/admin/announcements/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      alert(payload?.error ?? 'დადასტურება ვერ მოხერხდა');
      fetchPending();
    }
  };

  // 3. წაშლის ფუნქცია
  const deleteAd = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ ამ განცხადების წაშლა?')) return;

    setPendingAds(prev => prev.filter(ad => ad.id !== id));

    const response = await fetch('/api/admin/announcements/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      alert(payload?.error ?? 'წაშლა ვერ მოხერხდა');
      fetchPending();
    }
  };

  const scheduleDelete = async (id: string) => {
    const value = expiryDrafts[id];
    if (!value) return alert('აირჩიეთ თარიღი და დრო');
    
    // If date is in the future, we can't schedule it yet.
    // Prevent immediate archiving if user selects future date.
    if (new Date(value).getTime() > Date.now()) {
      return alert('სამომავლო წაშლა დროებით შეზღუდულია (expires_at ველი არ არსებობს). გთხოვთ აირჩიოთ მიმდინარე დრო ან გამოიყენოთ მყისიერი წაშლა.');
    }

    const { error } = await (supabase.from('announcements' as any) as any)
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      alert('დაგეგმვა ვერ მოხერხდა');
    } else {
      alert('განცხადება გაითიშა');
      fetchPending();
    }
  };

  const deleteByRange = async () => {
    if (!rangeFrom || !rangeTo) return alert('აირჩიეთ ორივე თარიღი');
    if (!confirm('ნამდვილად გსურთ არჩეულ პერიოდში არსებული განცხადებების წაშლა?')) return;

    const fromIso = new Date(rangeFrom).toISOString();
    const toIso = new Date(rangeTo).toISOString();

    const { error } = await (supabase as any)
      .from('announcements')
      .update({ is_archived: true })
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

    if (error) {
      alert('წაშლა ვერ მოხერხდა');
    } else {
      alert('არჩეული პერიოდის განცხადებები გაითიშა');
      fetchPending();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white/20 font-black uppercase italic tracking-widest text-xs animate-pulse">იტვირთება მოდერაცია...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050510] p-4 md:p-10 font-sans text-white relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter leading-none">
              მოდერაციის პანელი
            </h1>
            <p className="text-white/30 font-bold text-[10px] mt-2 uppercase tracking-[0.2em] italic">
              მოოდინშია: {pendingAds.length} განცხადება
            </p>
          </div>
          <AdminNav />
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl p-6 rounded-[32px] border border-white/10 shadow-xl mb-10">
          <h2 className="text-xs font-black uppercase text-white/50 mb-4 tracking-widest">კალენდარული წაშლა</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[10px] text-white/40 block mb-1 uppercase">დან (created_at)</label>
              <input
                type="datetime-local"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-1 uppercase">მდე (created_at)</label>
              <input
                type="datetime-local"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <button
              onClick={deleteByRange}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 font-black text-[10px] uppercase"
            >
              პერიოდის წაშლა
            </button>
          </div>
        </div>

        {pendingAds.length === 0 ? (
          <div className="text-center py-32 bg-white/[0.01] rounded-[60px] border border-white/5 border-dashed">
             <span className="text-6xl block mb-6 opacity-20">✨</span>
             <p className="text-white/20 italic font-black uppercase tracking-[0.3em] text-xs">ყველა განცხადება მოდერირებულია</p>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase text-white/50 tracking-[0.3em]">სპეციალური შემომავალი</h3>
              <div className="grid grid-cols-1 gap-6">
                {COMMUNITY_CATEGORIES.map(cat => {
                  const ads = pendingAds.filter(ad => ad.category === cat.value && (ad.is_approved === false || ad.is_approved === null));
                  return (
                    <div key={cat.value} className="bg-white/[0.02] border border-white/10 rounded-[28px] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-black text-amber-400 uppercase italic">{cat.label}</h4>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{ads.length} ერთეული</span>
                      </div>
                      {ads.length === 0 ? (
                        <p className="text-white/30 text-sm">ამ კატეგორიაში განცხადება არ არის.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-5">
                          {ads.map(ad => (
                            <AnnouncementCard
                              key={ad.id}
                              ad={ad}
                              getAnnouncementImages={getAnnouncementImages}
                              approveAd={approveAd}
                              deleteAd={deleteAd}
                              scheduleDelete={scheduleDelete}
                              expiryDrafts={expiryDrafts}
                              setExpiryDrafts={setExpiryDrafts}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {pendingAds.filter(ad => !isAgroSubmission(ad) && !isCommunityAnnouncement(ad)).map(ad => (
                <AnnouncementCard
                  key={ad.id}
                  ad={ad}
                  getAnnouncementImages={getAnnouncementImages}
                  approveAd={approveAd}
                  deleteAd={deleteAd}
                  scheduleDelete={scheduleDelete}
                  expiryDrafts={expiryDrafts}
                  setExpiryDrafts={setExpiryDrafts}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface AnnouncementCardProps {
  ad: AnnouncementRow;
  getAnnouncementImages: (ad: AnnouncementRow) => string[];
  approveAd: (id: string) => void;
  deleteAd: (id: string) => void;
  scheduleDelete: (id: string) => void;
  expiryDrafts: Record<string, string>;
  setExpiryDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function AnnouncementCard({ ad, getAnnouncementImages, approveAd, deleteAd, scheduleDelete, expiryDrafts, setExpiryDrafts }: AnnouncementCardProps) {
  const images = getAnnouncementImages(ad);
  return (
    <div className="group bg-white/[0.02] backdrop-blur-3xl p-6 md:p-8 rounded-[45px] border border-white/5 hover:border-amber-500/20 transition-all duration-500 shadow-2xl flex flex-col md:flex-row gap-8 items-center">
      <div className="relative w-full md:w-48 h-48 bg-black/40 rounded-[32px] overflow-hidden shrink-0 border border-white/5">
        {images[0] ? (
          <Image src={images[0]} alt="" fill sizes="192px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">ფოტო არ არის</div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-amber-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-xl">
            +{images.length - 1} ფოტო
          </div>
        )}
      </div>

      <div className="flex-grow space-y-3 text-center md:text-left">
        {images.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {images.slice(1, 5).map((img, idx) => (
              <div key={`${ad.id}-thumb-${idx}`} className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <Image src={img} alt="" fill sizes="48px" className="object-cover" />
              </div>
            ))}
            {images.length > 5 && (
              <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/60 font-black">
                +{images.length - 5}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{ad.title}</h3>
          <span className="inline-block bg-white/5 px-3 py-1 rounded-full text-[9px] font-black text-amber-500 uppercase italic">
            {ad.category}
          </span>
        </div>

        <div className="text-2xl font-black text-amber-500 italic tracking-tighter">
          {ad.price} ₾
        </div>

        <p className="text-sm text-white/50 font-medium italic line-clamp-2 leading-relaxed">
          {ad.description}
        </p>

        {ad.category === 'სერვისის მაძიებელი' && (ad as any).notification_summary && (
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-cyan-300/15 bg-cyan-500/10 p-3 text-center">
            <div>
              <div className="text-lg font-black text-cyan-100">{(ad as any).notification_summary.total ?? 0}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/35">გაგზავნა</div>
            </div>
            <div>
              <div className="text-lg font-black text-emerald-200">{(ad as any).notification_summary.sent ?? 0}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/35">წარმატებით</div>
            </div>
            <div>
              <div className="text-lg font-black text-red-200">{(ad as any).notification_summary.failed ?? 0}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/35">შეცდომა</div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/5 flex flex-wrap justify-center md:justify-start gap-4">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">📞 {ad.phone}</span>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">📍 {ad.location}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full md:w-48">
        <button 
          onClick={() => approveAd(ad.id)} 
          className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase italic transition-all shadow-lg shadow-green-900/20 active:scale-95"
        >
          დადასტურება ✅
        </button>
        <button 
          onClick={() => deleteAd(ad.id)} 
          className="w-full bg-white/5 hover:bg-red-600 text-white/40 hover:text-white py-4 rounded-2xl font-black text-[11px] uppercase italic transition-all active:scale-95"
        >
          წაშლა 🗑️
        </button>
        <div className="flex flex-col gap-2">
          <input
            type="datetime-local"
            value={expiryDrafts[ad.id] || ''}
            onChange={(e) => setExpiryDrafts(prev => ({ ...prev, [ad.id]: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-[10px] text-white"
          />
          <button
            onClick={() => scheduleDelete(ad.id)}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase italic transition-all"
          >
            დაგეგმვა ⏳
          </button>
        </div>
        <Link 
          href={`/announcements/${ad.id}`} 
          target="_blank"
          className="w-full bg-white/5 text-center py-4 rounded-2xl font-black text-[9px] uppercase italic text-white/20 hover:text-white transition-all"
        >
          სრული ნახვა
        </Link>
      </div>
    </div>
  );
}
