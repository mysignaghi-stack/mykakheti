'use client';
import { useState, useEffect, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';
import Link from 'next/link';
import type { Database } from '../../types/supabase';
import { supabase } from '../lib/supabase';
import { useAdminAuth } from '../hooks/useAdminAuth';

type AnnouncementRow = Database['public']['Tables']['announcements']['Row'];
type AdminTab = 'moderate' | 'live' | 'community' | 'business' | 'congratulations' | 'visuals';
const BIZ_CATEGORIES = ['მარნები და ღვინო', 'სასტუმროები', 'რესტორნები და კაფეები', 'ტურისტული მარშრუტები', 'სახელოსნოები', 'სხვა'];

export default function AdminHub() {
  const { isAdmin, loading: authLoading, handleAdminLogout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('moderate');
  const [ads, setAds] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  
  const [bizData, setBizData] = useState({ name: '', category: BIZ_CATEGORIES[0], address: '', phone: '', description: '' });
  const [bizFile, setBizFile] = useState<File | null>(null);

  // Announcement/Marquee text state
  const [marqueeText, setMarqueeText] = useState('');
  const [marqueeLoading, setMarqueeLoading] = useState(false);

  // Fetch current marquee text from site_settings
  const fetchMarqueeText = async () => {
    setMarqueeLoading(true);
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'marquee_text').single();
    if (data?.value) setMarqueeText(data.value);
    setMarqueeLoading(false);
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'visuals') {
      fetchMarqueeText();
    }
  }, [isAdmin, activeTab]);

  // Update marquee text in site_settings
  const handleMarqueeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarqueeLoading(true);
    const { error } = await supabase.from('site_settings').upsert({ key: 'marquee_text', value: marqueeText }, { onConflict: 'key' });
    setMarqueeLoading(false);
    if (!error) {
      alert('მოძრავი სტრიქონი განახლდა!');
    } else {
      alert('შეცდომა: ' + error.message);
    }
  };

  // 🔄 მონაცემების წამოღება
  const fetchAds = useCallback(async () => {
    setLoading(true);
    setAds([]); // ძველი მონაცემების გასუფთავება
    const isApproved = activeTab === 'live';
    
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_approved', isApproved)
      .order('created_at', { ascending: false });
      
    if (error) console.error(error);
    if (data) setAds(data);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { 
    if (isAdmin && (activeTab === 'moderate' || activeTab === 'live')) {
      fetchAds();
    }
  }, [isAdmin, activeTab, fetchAds]);

  // ✅ მოქმედებები
  const approveAd = async (id: string) => {
    const { error } = await supabase.from('announcements').update({ is_approved: true }).eq('id', id);
    if (!error) {
      setAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  const deleteAd = async (id: string) => {
    if(confirm('ნამდვილად გსურთ წაშლა?')) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) {
        alert('შეცდომა წაშლისას: ' + error.message);
      } else {
        setAds(prev => prev.filter(ad => ad.id !== id));
      }
    }
  };

  // 📅 ვადის განახლების ფუნქცია (ახალი)
  const updateExpiry = async (id: string, date: string) => {
    const { error } = await supabase
      .from('announcements')
      .update({ expires_at: date })
      .eq('id', id);
    if (!error) {
      setAds(prev => prev.map(ad => ad.id === id ? { ...ad, expires_at: date } : ad));
    }
  };

  // 🧹 ავტომატური გასუფთავების ფუნქცია (ახალი)
  const runAutoCleanup = async () => {
    const now = new Date().toISOString();
    if(confirm('ნამდვილად გსურთ ყველა ვადაგასული განცხადების წაშლა?')) {
        const { error, count } = await supabase
          .from('announcements')
          .delete()
          .lt('expires_at', now);
        
        if (!error) {
          alert(`წაიშალა ${count || 0} ძველი განცხადება.`);
          fetchAds();
        }
    }
  };

  // 🏨 ბიზნესის დამატება
  const handleBizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let url = '';
      if (bizFile) {
        const compressed = await imageCompression(bizFile, { maxSizeMB: 0.4, maxWidthOrHeight: 1200 });
        const name = `biz-${Date.now()}.jpg`;
        await supabase.storage.from('announcements').upload(name, compressed);
        const { data } = supabase.storage.from('announcements').getPublicUrl(name);
        url = data.publicUrl;
      }
      const { error } = await supabase.from('businesses').insert([{ ...bizData, image_url: url }]);
      if (error) throw error;
      
      alert('ბიზნესი დაემატა! 🚀');
      setBizData({ name: '', category: BIZ_CATEGORIES[0], address: '', phone: '', description: '' });
      setBizFile(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('შეცდომა: ' + message);
    }
    setLoading(false);
  };

  // 🌅 ფონის შეცვლა
  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('ფაილი არ არის არჩეული');
      return;
    }
    setBgUploading(true);
    try {
      const fileName = `main-bg-${Date.now()}.jpg`;
      console.log('ვცდილობთ ფონის ატვირთვას:', fileName, file);
      const { error: upErr } = await supabase.storage.from('site-assets').upload(fileName, file);
      if (upErr) {
        console.error('ფონის ატვირთვის შეცდომა:', upErr);
        throw upErr;
      }

      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      console.log('ფონის publicUrl:', publicUrl);
      const { error: dbErr, data: upsertData, status, statusText } = await supabase.from('site_settings').upsert({ key: 'background_url', value: publicUrl }, { onConflict: 'key' });
      console.log('upsert შედეგი:', { dbErr, upsertData, status, statusText });

      if (dbErr) {
        console.error('site_settings-ში upsert-ის შეცდომა:', dbErr);
        throw dbErr;
      }
      alert('საიტის ფონი შეიცვალა! 🌅');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('ფონის შეცვლის სრული შეცდომა:', err);
      alert('შეცდომა: ' + message);
    }
    setBgUploading(false);
  }

  const inputStyle = "w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/20";

  if (!isAdmin || authLoading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-white/[0.03] backdrop-blur-3xl p-12 rounded-[50px] border border-white/10 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-600" />
          <h1 className="text-3xl font-black uppercase italic mb-8 tracking-tighter text-white">ADMIN <span className="text-amber-500">CORE</span></h1>
          <div className="space-y-6">
            <p className="text-white/60 font-bold">გთხოვთ გაიაროთ ავტორიზაცია...</p>
            {authLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>}
            <Link href="/admin/login" className="w-full py-5 bg-amber-600 rounded-[24px] font-black uppercase italic text-xs tracking-widest shadow-xl hover:bg-amber-500 transition-all inline-block text-center">შესვლა</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] text-white font-sans pb-20 selection:bg-amber-500 selection:text-white">
      {/* Header */}
      <nav className="bg-slate-950/40 backdrop-blur-3xl py-6 px-10 border-b border-white/5 flex justify-between items-center sticky top-0 z-[100] shadow-2xl">
        <div className="flex flex-col">
           <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">ADMIN<span className="text-amber-500">HUB</span></h1>
           <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em] mt-1">Management Console</span>
        </div>
        <div className="flex gap-4 items-center">
           <button onClick={runAutoCleanup} className="bg-red-600/20 text-red-500 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">🧹 ვადაგასულების გაწმენდა</button>
           <Link href="/" className="bg-white/5 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase border border-white/10 hover:bg-white hover:text-black transition-all">საიტზე გადასვლა</Link>
           <button onClick={handleAdminLogout} className="bg-red-500/10 text-red-500 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase border border-red-500/20">გამოსვლა</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto mt-12 px-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-16 bg-white/[0.02] p-2 rounded-[35px] border border-white/5 w-fit backdrop-blur-3xl shadow-2xl">
          {[
            {id: 'moderate', label: '📢 მოდერაცია', color: 'bg-amber-600'},
            {id: 'live', label: '✅ LIVE', color: 'bg-green-600'},
            {id: 'community', label: '👥 საზოგადოება', color: 'bg-cyan-600'},
            {id: 'business', label: '🏨 ბიზნესები', color: 'bg-blue-600'},
            {id: 'congratulations', label: '🎉 მისალოცი', color: 'bg-pink-600'},
            {id: 'visuals', label: '🖼️ ვიზუალი', color: 'bg-purple-600'}
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)} 
              className={`px-8 py-4 rounded-[28px] font-black uppercase italic text-[10px] tracking-widest transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-xl scale-105` : 'text-white/30 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(activeTab === 'moderate' || activeTab === 'live') && (
            <div className="grid grid-cols-1 gap-6">
              {loading ? <p className="text-center py-20 animate-pulse">იტვირთება...</p> : (
                <>
                  {ads.map(ad => (
                    <div key={ad.id} className="bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[48px] border border-white/5 flex flex-col md:flex-row gap-8 items-center group hover:border-white/10 transition-all shadow-2xl text-left">
                      <div className="relative w-44 h-44 bg-black/40 rounded-[36px] overflow-hidden shrink-0 border border-white/10">
                        {ad.image_url && (
                          <Image src={ad.image_url} alt="" fill sizes="176px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        )}
                      </div>
                      <div className="flex-grow space-y-3">
                        <h3 className="text-2xl font-black uppercase italic leading-tight">{ad.title}</h3>
                        <div className="flex flex-wrap gap-2">
                           <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest bg-white/5 w-fit px-4 py-1.5 rounded-full border border-amber-500/10">
                             {ad.category} • {ad.location} • {ad.price} ₾
                           </p>
                           {/* ვადაგასულის ინდიკატორი */}
                           {ad.expires_at && new Date(ad.expires_at) < new Date() && (
                             <span className="text-[10px] bg-red-600 text-white px-4 py-1.5 rounded-full font-black uppercase animate-pulse">⚠️ ვადაგასულია</span>
                           )}
                        </div>
                        <p className="text-sm text-white/40 italic line-clamp-2 font-medium">{ad.description}</p>
                        
                        {/* ვადის კალენდარი (ახალი) */}
                        <div className="pt-4 flex flex-col gap-2">
                           <label className="text-[9px] font-black uppercase text-white/20 tracking-widest ml-2">აქტიურია (მდე):</label>
                           <input 
                              type="date" 
                              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-black text-white outline-none focus:border-amber-500 w-fit"
                              value={ad.expires_at ? ad.expires_at.split('T')[0] : ''}
                              onChange={(e) => updateExpiry(ad.id, e.target.value)}
                           />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 w-full md:w-56">
                        {activeTab === 'moderate' && (
                          <button onClick={() => approveAd(ad.id)} className="w-full bg-green-600 text-white py-5 rounded-[22px] font-black uppercase italic text-[10px] tracking-widest hover:bg-green-500 shadow-xl transition-all active:scale-95">დამტკიცება ✅</button>
                        )}
                        <button onClick={() => deleteAd(ad.id)} className="w-full bg-red-600/10 text-red-500 py-5 rounded-[22px] font-black uppercase italic text-[10px] tracking-widest border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">წაშლა 🗑️</button>
                        <Link href={`/announcements/${ad.id}`} className="text-center text-[9px] font-black uppercase text-white/20 hover:text-white transition-all underline decoration-white/5">სრული ნახვა</Link>
                      </div>
                    </div>
                  ))}
                  {ads.length === 0 && <div className="text-center py-32 opacity-20 italic font-black uppercase tracking-[0.4em]">მონაცემები არ არის</div>}
                </>
              )}
            </div>
          )}

          {activeTab === 'business' && (
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[50px] p-10 md:p-16 border border-white/5 max-w-3xl shadow-2xl relative overflow-hidden mx-auto">
               <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
               <h2 className="text-3xl font-black uppercase italic mb-10 text-blue-500 tracking-tighter text-center">ბიზნესის რეგისტრაცია</h2>
               <form onSubmit={handleBizSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required className={inputStyle} placeholder="დასახელება" value={bizData.name} onChange={e => setBizData({...bizData, name: e.target.value})} />
                    <select className={`${inputStyle} appearance-none cursor-pointer`} value={bizData.category} onChange={e => setBizData({...bizData, category: e.target.value})}>
                       {BIZ_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input className={inputStyle} placeholder="მისამართი" value={bizData.address} onChange={e => setBizData({...bizData, address: e.target.value})} />
                    <input className={inputStyle} placeholder="ტელეფონი" value={bizData.phone} onChange={e => setBizData({...bizData, phone: e.target.value})} />
                 </div>
                 <textarea rows={5} className={`${inputStyle} resize-none font-medium`} placeholder="დაწვრილებითი აღწერა..." value={bizData.description} onChange={e => setBizData({...bizData, description: e.target.value})} />
                 <div className="p-10 border-2 border-dashed border-white/5 rounded-[36px] text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer relative group">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setBizFile(e.target.files?.[0] || null)} />
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-4xl group-hover:scale-110 transition-transform">📸</span>
                       <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">{bizFile ? bizFile.name : 'ობიექტის მთავარი ფოტო'}</span>
                    </div>
                 </div>
                 <button type="submit" disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black uppercase italic shadow-2xl hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-30">ბიზნესის დამატება 🚀</button>
               </form>
            </div>
          )}

          {activeTab === 'visuals' && (
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[50px] p-16 border border-white/5 max-w-2xl shadow-2xl text-center relative overflow-hidden mx-auto">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-600" />
              <h2 className="text-3xl font-black uppercase italic mb-4 text-purple-500 tracking-tighter">სისტემური ვიზუალი</h2>
              <p className="text-white/30 text-[10px] italic mb-12 uppercase tracking-widest font-bold">მთავარი ფონის შეცვლა</p>
              <label className={`block w-full py-28 border-4 border-dashed border-white/5 rounded-[48px] cursor-pointer transition-all hover:border-purple-600 hover:bg-white/5 group ${bgUploading ? 'opacity-30 cursor-wait' : ''}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} disabled={bgUploading} />
                <div className="flex flex-col items-center gap-6">
                   <div className="w-24 h-24 bg-purple-600/10 rounded-full flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">🌅</div>
                   <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-colors">
                     {bgUploading ? 'იტვირთება...' : 'ატვირთეთ ფონი'}
                   </span>
                </div>
              </label>
              {/* Marquee/Announcement Text Editor */}
              <div className="mt-16">
                <h3 className="text-xl font-black uppercase italic mb-4 text-amber-400 tracking-tighter">მოძრავი სტრიქონის ტექსტი</h3>
                <form onSubmit={handleMarqueeSubmit} className="flex flex-col gap-4 items-center">
                  <textarea
                    className="w-full max-w-xl p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/20 resize-none text-center text-lg"
                    rows={2}
                    placeholder="შეიყვანეთ ტექსტი, რომელიც გამოჩნდება მთავარ მოძრავ სტრიქონში..."
                    value={marqueeText}
                    onChange={e => setMarqueeText(e.target.value)}
                    disabled={marqueeLoading}
                  />
                  <button type="submit" disabled={marqueeLoading} className="px-10 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase italic shadow-xl hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-30">{marqueeLoading ? 'შენახვა...' : 'ტექსტის შენახვა'}</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[50px] p-16 border border-white/5 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600" />
              <h2 className="text-3xl font-black uppercase italic mb-8 text-cyan-500 tracking-tighter">საზოგადოების მართვა</h2>
              <p className="text-white/30 text-[10px] italic mb-12 uppercase tracking-widest font-bold">ობიტუარები, დაკარგული/ნაპოვნი, ოსტატები</p>
              
              <div className="flex justify-center">
                <Link 
                  href="/admin/community" 
                  className="px-12 py-6 bg-cyan-600 text-white rounded-[28px] font-black uppercase italic shadow-2xl hover:bg-cyan-500 transition-all active:scale-95"
                >
                  საზოგადოების მოდერაციაზე გადასვლა 👥
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'congratulations' && (
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[50px] p-16 border border-white/5 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-pink-600" />
              <h2 className="text-3xl font-black uppercase italic mb-8 text-pink-500 tracking-tighter">მისალოცი ბარათები</h2>
              <p className="text-white/30 text-[10px] italic mb-12 uppercase tracking-widest font-bold">მისალოცი ბარათების მოდერაცია</p>
              
              <div className="flex justify-center">
                <Link 
                  href="/admin/congratulations" 
                  className="px-12 py-6 bg-pink-600 text-white rounded-[28px] font-black uppercase italic shadow-2xl hover:bg-pink-500 transition-all active:scale-95"
                >
                  მისალოცი ბარათების მართვა 🎉
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}