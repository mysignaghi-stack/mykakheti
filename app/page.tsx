// Type for agro details
interface AgroDetail {
  place: string;
  rate: string | number;
}

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdsData } from './hooks/useAdsData';
import { useAgroData } from './hooks/useAgroData';
import { useWeatherData } from './hooks/useWeatherData';
import { supabase } from './lib/supabase';
import { Ad, AdminPost } from './lib/types';
import { KAKHETI_FACTS, TRANSPORT_SCHEDULE } from './lib/constants';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SnackbarWrapper from './components/layout/SnackbarWrapper';
import ConfirmModal from './components/layout/ConfirmModal';
import EditAgroModal from './components/layout/EditAgroModal';
import HeroSection from './components/home/HeroSection';
import ServiceWidgets from './components/home/ServiceWidgets';
import RightSidebar from './components/home/RightSidebar';
import AdsSection from './components/home/AdsSection';
import KakhetianSquare from './components/features/KakhetianSquare';
import TransportModal from './components/features/transport/TransportModal';
import AdminSideFrame from './components/home/AdminSideFrame';
import ChatPopup from './components/features/ChatPopup';
import CongratulationsSection from './components/home/CongratulationsSection';

// Helpers
const getSeasonalContent = () => {
  const month = new Date().getMonth();
  if (month === 0 || month === 1) return { tag: "ზამთარი", text: "ვენახის გასხვლის დროა.", icon: "✂️" };
  if (month >= 2 && month <= 4) return { tag: "გაზაფხული", text: "ვენახის წამლობის სეზონია.", icon: "🌱" };
  if (month >= 5 && month <= 7) return { tag: "ზაფხული", text: "აქტიური ტურიზმია.", icon: "☀️" };
  if (month >= 8 && month <= 10) return { tag: "შემოდგომა", text: "კახური რთველი მოვიდა!", icon: "🍇" };
  return { tag: "რჩევა", text: "დაგეგმეთ საქმიანობა.", icon: "📅" };
};


export default function HomePage() {
  const {
    ads,
    setAds,
    loading: adsLoading,
    fetchAds,
    archiveAd,
    restoreAd,
    deleteAd,
  } = useAdsData();
  const {
    weatherData,
    setWeatherData,
    loading: weatherLoading,
    fetchWeatherData,
  } = useWeatherData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['ყველა']);
  const [selectedLocation, setSelectedLocation] = useState('ყველა კახეთი');
  const [bgImage, setBgImage] = useState<string | null>(null);
  // Marquee text state
  const [marqueeText, setMarqueeText] = useState<string>('');

  // Fetch background image and marquee text from site_settings
  const fetchBG = async () => {
    try {
      const { data: bgData } = await supabase.from('site_settings').select('value').eq('key', 'background_url').single();
      if (bgData?.value) setBgImage(bgData.value);
      // Fetch marquee text
      const { data: marqueeData } = await supabase.from('site_settings').select('value').eq('key', 'marquee_text').single();
      if (marqueeData?.value) setMarqueeText(marqueeData.value);
      else setMarqueeText('');
    } catch (error) {
      console.log('Error fetching site settings:', error);
      setMarqueeText('საიტი მუშაობს სატესტო რეჟიმში');
    }
  };

  // Agro hook
  const {
    agroData,
    setAgroData,
    loading: agroLoading,
    fetchAgroData,
    editAgroItem,
    setEditAgroItem,
    selectedAgro,
    setSelectedAgro,
    newPrice,
    setNewPrice,
  } = useAgroData();

  const [editDetails, setEditDetails] = useState<AgroDetail[]>([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '', type: 'info' });
  // Loading state for editAgroItem modal
  const [editLoading, setEditLoading] = useState(false);
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => setSnackbar({ open: true, message, type });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  // Snackbar-enabled price update
  const handleUpdatePrice = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAgroItem) return;
    const { error } = await supabase.from('agro_prices').update({ price: newPrice, details: editDetails }).eq('id', editAgroItem.id);
    if (!error) {
      setAgroData(prev => prev.map(item => item.id === editAgroItem.id ? { ...item, price: newPrice, details: editDetails } : item));
      setEditAgroItem(null);
      setEditDetails([]);
      showSnackbar('ფასი განახლდა! ✅', 'success');
    } else {
      showSnackbar('შეცდომა განახლებისას: ' + error.message, 'error');
    }
  }, [editAgroItem, newPrice, editDetails, setAgroData, setEditAgroItem, showSnackbar]);
  
  const {
    isAdmin,
    handleAdminLogout,
  } = useAdminAuth();
  
  const [factIndex, setFactIndex] = useState(0);
  const [isLocOpen, setIsLocOpen] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);
  
  const [showTransport, setShowTransport] = useState(false);
  
  // ...moved to useAgroData
  const [controlToken, setControlToken] = useState<string>('');

  const [adminPosts, setAdminPosts] = useState<AdminPost[]>([]);
  // Use separate refs for desktop and mobile KakhetianSquare
  const chatScrollRefDesktop = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const chatScrollRefMobile = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const [frameContentTypes, setFrameContentTypes] = useState({
    left_top: 'post' as 'post' | 'announcement',
    left_bottom: 'post' as 'post' | 'announcement',
    right_top: 'post' as 'post' | 'announcement',
    right_bottom: 'post' as 'post' | 'announcement',
  });

  useEffect(() => {
    setFactIndex(Math.floor(Math.random() * KAKHETI_FACTS.length));
    const factTimer = setInterval(() => setFactIndex((p) => (p + 1) % KAKHETI_FACTS.length), 8000);

    const initSecurity = () => {
      let storedToken = localStorage.getItem('mykakheti_session_id');
      if (!storedToken) {
        storedToken = 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('mykakheti_session_id', storedToken);
      }
      setControlToken(storedToken);
    };
    initSecurity();

    fetchAds();
    fetchBG(); // Fetch initial background
    // ...existing code for chat scroll, channel, cleanup, etc...
    // სესიის შემოწმება Supabase-ში
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        console.log('Supabase User UUID:', data.user?.id);
      } catch (error) {
        console.log('Auth session missing or error:', error);
      }
    })();
  }, []);

  // Poll for background changes (reduced frequency and only when visible)
  useEffect(() => {
    const tick = () => { if (typeof document === 'undefined' || !document.hidden) fetchBG(); };
    const interval = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => clearInterval(interval);
  }, []);

  const fetchAdminPosts = async () => {
    const { data } = await supabase.from('admin_posts').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });
    if (data) setAdminPosts(data);
  };

  const getPostByPos = (pos: string) => adminPosts.find(p => p.position === pos);

  const changeFrameContentType = (position: string, type: 'post' | 'announcement') => {
    setFrameContentTypes(prev => ({ ...prev, [position]: type }));
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleAdminPostDelete = (id: number) => {
    setConfirmModal({
      open: true,
      message: 'ნამდვილად გსურთ პოსტის წაშლა?',
      onConfirm: async () => {
        setConfirmLoading(true);
        await supabase.from('admin_posts').delete().eq('id', id);
        fetchAdminPosts();
        showSnackbar('პოსტი წაიშალა', 'success');
        setConfirmLoading(false);
      },
    });
  };

  const handleMapSearch = (service: string) => {
    const query = encodeURIComponent(service);
    const mapUrl = `https://www.google.com/maps/search/${query}+კახეთი/`; 
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => window.open(`https://www.google.com/maps/search/${query}/@${pos.coords.latitude},${pos.coords.longitude},15z`, '_blank'),
        () => window.open(mapUrl, '_blank')
      );
    } else { window.open(mapUrl, '_blank'); }
  };

  const handleFBShare = (e: React.MouseEvent<HTMLButtonElement>, ad: Ad) => {
    e.preventDefault(); e.stopPropagation();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/announcements/${ad.id}`)}`, 'fb-share', 'width=600,height=400');
  };

  const handleCopyShare = async (e: React.MouseEvent<HTMLButtonElement>, ad: Ad) => {
    e.preventDefault(); e.stopPropagation();
    await navigator.clipboard.writeText(`${window.location.origin}/announcements/${ad.id}`);
    showSnackbar('ბმული კოპირებულია! ✅', 'success');
  };

  const handleArchiveAd = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setConfirmModal({
      open: true,
      message: 'გადავიტანოთ განცხადება არქივში?',
      onConfirm: async () => {
        setConfirmLoading(true);
        await archiveAd(id);
        showSnackbar('განცხადება გადატანილია არქივში', 'success');
        setConfirmLoading(false);
      },
    });
  };

  const handleRestoreAd = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setConfirmModal({
      open: true,
      message: 'აღვადგინოთ განცხადება?',
      onConfirm: async () => {
        setConfirmLoading(true);
        await restoreAd(id);
        showSnackbar('განცხადება აღდგენილია', 'success');
        setConfirmLoading(false);
      },
    });
  };

  const handlePermanentDelete = (e: React.MouseEvent<HTMLButtonElement>, ad: Ad) => {
    e.preventDefault(); e.stopPropagation();
    setConfirmModal({
      open: true,
      message: 'ყურადღება! ეს წაშლის ფოტოებსაც და ინფორმაციასაც სამუდამოდ. დარწმუნებული ხართ?',
      onConfirm: async () => {
        setConfirmLoading(true);
        await deleteAd(ad);
        showSnackbar('განცხადება სამუდამოდ წაიშალა', 'success');
        setConfirmLoading(false);
      },
    });
  };
  // Confirmation Modal UI
  // Accessibility: focus trap and aria-modal for modal
  const confirmModalRef = useRef<HTMLDivElement>(null);
  // Escape key support for modals
  useEffect(() => {
    if (confirmModal?.open && confirmModalRef.current) {
      confirmModalRef.current.focus();
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmModal(null);
    };
    if (confirmModal?.open) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [confirmModal?.open]);

  // Escape key for editAgroItem modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditAgroItem(null);
    };
    if (editAgroItem) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [editAgroItem]);

  // Remove inline ConfirmModal, use component below

  // ...admin auth logic now comes from useAdminAuth

    // ...moved to useAgroData

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      if (ad.is_archived) return false;
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes('ყველა') || selectedCategories.includes(ad.category);
      const matchLoc = selectedLocation === 'ყველა კახეთი' || ad.location.includes(selectedLocation);
      const matchSearch = (ad.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchLoc && matchSearch;
    });
  }, [ads, selectedCategories, selectedLocation, searchTerm]);

  const seasonal = getSeasonalContent();

  const firstAnnouncement = ads.find(ad => ad.is_approved && !ad.is_archived);


  return (
    <main className="min-h-screen relative flex flex-col bg-[#050510] overflow-x-hidden text-left selection:bg-amber-500 selection:text-white text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {bgImage && <img src={bgImage} className="w-full h-full object-cover opacity-7 transition-opacity duration-500" alt="" />}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f]/30 via-[#050510]/10 to-[#050510]/40 backdrop-blur-[2px]" />
      </div>

      <Navbar />

      {/* Header section only */}
      <header className="relative z-20 pt-2 sm:pt-4 pb-6 w-full px-4 sm:px-6 md:px-10 max-w-[1800px] mx-auto text-left">
        {/* Community Section with Congratulations - Direct on page */}
        <div className="bg-black/70 backdrop-blur-3xl rounded-[30px] p-4 shadow-3xl border border-white/10">
          <h4 className="text-white font-black uppercase tracking-[0.4em] mb-1 w-full text-center">სათემო ჩართულობა</h4>
          <p className="w-full text-white font-bold uppercase tracking-[0.2em] mb-1 leading-tight text-center">გამოაქვეყნეთ, გააზიარეთ და მიულოცეთ</p>
          <div className="grid grid-cols-4 gap-2 w-full">
            <div className="flex flex-col gap-0.5">
              <Link href="/community/obituaries/submit" className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all">
                <span className="text-2xl mb-0.5">🕊️</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">სამძიმრის გამოცხადება</span>
              </Link>
              <Link href="/community/obituaries" className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold">📄 ნახვა</Link>
            </div>
            <div className="flex flex-col gap-0.5">
              <Link href="/community/lost-found/submit" className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all">
                <span className="text-2xl mb-0.5">🔎</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">დაკარგული/ნაპოვნი</span>
              </Link>
              <Link href="/community/lost-found" className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold">📄 ნახვა</Link>
            </div>
            <div className="flex flex-col gap-0.5">
              <Link href="/community/masters/submit" className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all">
                <span className="text-2xl mb-0.5">🛠️</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">ოსტატის დამატება</span>
              </Link>
              <Link href="/community/masters" className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold">📄 ნახვა</Link>
            </div>
            <div className="flex flex-col gap-0.5">
              <Link href="/community/congratulations/submit" className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2 flex flex-col items-center hover:bg-black/80 transition-all">
                <span className="text-2xl mb-0.5">🎉</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center text-white">მისალოცი ბარათი</span>
              </Link>
              <Link href="/community/congratulations" className="text-[9px] px-1 py-0.5 rounded-full border border-white/5 text-white bg-black/60 hover:text-white hover:border-white/10 hover:bg-black/80 text-center font-semibold">📄 ნახვა</Link>
            </div>
          </div>
          
          {/* Congratulations Section */}
          <div className="mt-2">
            <CongratulationsSection />
          </div>
        </div>
      </header>

      {/* Informational grid section, now outside header for independent styling */}
      <section className="relative z-10 w-full px-4 sm:px-6 md:px-10 max-w-[1800px] mx-auto -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_1fr_minmax(260px,340px)] gap-4 md:gap-8 xl:gap-12 items-start text-white bg-black/70 backdrop-blur-2xl rounded-[30px] border border-white/10 p-4 sm:p-8 shadow-xl">
          {/* --- მარცხენა სვეტი (Desktop Only) --- */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-24 order-1 min-w-[280px]">
            {/* კახური მოედანი (სქროლით) */}
            <div 
              ref={chatScrollRefDesktop}
              className="w-full h-[450px] overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 relative"
            >
               <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} scrollRef={chatScrollRefDesktop} />
            </div>
            {/* მარცხენა პოსტები */}
            <div className="flex flex-col gap-4 w-full">
               <div className="h-auto">
                 <AdminSideFrame 
                   post={getPostByPos('left_top')} 
                   position="left_top" 
                   isAdmin={isAdmin} 
                   onRefresh={fetchAdminPosts}
                   contentType={frameContentTypes.left_top}
                   announcement={frameContentTypes.left_top === 'announcement' ? firstAnnouncement : null}
                   onContentTypeChange={(type) => changeFrameContentType('left_top', type)}
                 />
               </div>
               <div className="h-auto">
                 <AdminSideFrame 
                   post={getPostByPos('left_bottom')} 
                   position="left_bottom" 
                   isAdmin={isAdmin} 
                   onRefresh={fetchAdminPosts}
                   contentType={frameContentTypes.left_bottom}
                   announcement={frameContentTypes.left_bottom === 'announcement' ? firstAnnouncement : null}
                   onContentTypeChange={(type) => changeFrameContentType('left_bottom', type)}
                 />
               </div>
            </div>
          </div>

          {/* --- ცენტრალური სვეტი --- */}
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000 w-full order-1 lg:order-2">
             {/* მობილური ვერსია (მხოლოდ პატარა ეკრანებზე) */}
             <div className="flex flex-col gap-4 w-full lg:hidden">
                 <div className="h-[450px] bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5">
                   <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} scrollRef={chatScrollRefMobile} />
                 </div>
                {/* CommunityHub removed: community entry moved to navbar center */}
                <div className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2">
                  <AdminSideFrame post={getPostByPos('left_top')} position="left_top" isAdmin={isAdmin} onRefresh={fetchAdminPosts} />
                </div>
                <div className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2">
                  <AdminSideFrame post={getPostByPos('left_bottom')} position="left_bottom" isAdmin={isAdmin} onRefresh={fetchAdminPosts} />
                </div>
             </div>

             <HeroSection 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} filteredAds={filteredAds}
                selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation}
                isLocOpen={isLocOpen} setIsLocOpen={setIsLocOpen} locRef={locRef as React.RefObject<HTMLDivElement>} onMapSearch={handleMapSearch}
             />

            {/* --- Announcement/Marquee Bar (center column, in the middle) --- */}
            <div className="w-full my-1">
              <div className="w-full bg-gradient-to-r from-amber-600/80 via-black/80 to-amber-600/80 rounded-full border border-amber-400/30 shadow px-2 py-0.5 marquee-outer">
                {/* True infinite marquee */}
                <span className="marquee-inner text-sm sm:text-base font-bold italic tracking-widest text-amber-100 drop-shadow-lg">
                  {marqueeText || 'საიტი მუშაობს სატესტო რეჟიმში'}
                </span>
              </div>
            </div>

            {/* CommunityHub removed: community entry moved to navbar center */}

            <ServiceWidgets 
              agroData={agroData} isAdmin={isAdmin} 
              onEditAgro={(item) => { setEditAgroItem(item); setNewPrice(item.price); setEditDetails(item.details || []); }} 
              onSelectAgro={setSelectedAgro} onMapSearch={handleMapSearch} 
            />

             {/* მობილური ვერსია - მარჯვენა მხარე */}
             <div className="flex flex-col gap-4 w-full lg:hidden text-left">
               <div className="h-[450px] bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5">
                 <RightSidebar weatherData={weatherData} seasonal={seasonal} fact={KAKHETI_FACTS[factIndex]} onShowTransport={() => setShowTransport(true)} />
               </div>
               <div className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2">
                <AdminSideFrame post={getPostByPos('right_top')} position="right_top" isAdmin={isAdmin} onRefresh={fetchAdminPosts} />
               </div>
               <div className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-2">
                <AdminSideFrame post={getPostByPos('right_bottom')} position="right_bottom" isAdmin={isAdmin} onRefresh={fetchAdminPosts} />
               </div>
             </div>
          </div>

          {/* --- მარჯვენა სვეტი (Desktop Only) --- */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-24 order-3 min-w-[280px]">
            {/* ჰაბი */}
            <div className="w-full h-[450px] overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 relative">
              <div className="p-1">
                <RightSidebar weatherData={weatherData} seasonal={seasonal} fact={KAKHETI_FACTS[factIndex]} onShowTransport={() => setShowTransport(true)} />
              </div>
            </div>
            {/* მარჯვენა პოსტები */}
            <div className="flex flex-col gap-4 w-full">
               <div className="h-auto">
                 <AdminSideFrame 
                   post={getPostByPos('right_top')} 
                   position="right_top" 
                   isAdmin={isAdmin} 
                   onRefresh={fetchAdminPosts}
                   contentType={frameContentTypes.right_top}
                   announcement={frameContentTypes.right_top === 'announcement' ? firstAnnouncement : null}
                   onContentTypeChange={(type) => changeFrameContentType('right_top', type)}
                 />
               </div>
               <div className="h-auto">
                 <AdminSideFrame 
                   post={getPostByPos('right_bottom')} 
                   position="right_bottom" 
                   isAdmin={isAdmin} 
                   onRefresh={fetchAdminPosts}
                   contentType={frameContentTypes.right_bottom}
                   announcement={frameContentTypes.right_bottom === 'announcement' ? firstAnnouncement : null}
                   onContentTypeChange={(type) => changeFrameContentType('right_bottom', type)}
                 />
               </div>
            </div>
          </div>
        </div>
      </section>

      <AdsSection 
        ads={ads} filteredAds={filteredAds} isAdmin={isAdmin} showArchive={false}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
        onArchive={handleArchiveAd} onRestore={handleRestoreAd} onDelete={handlePermanentDelete} onFBShare={handleFBShare} onCopyShare={handleCopyShare}
      />

      {showTransport && <TransportModal isAdmin={isAdmin} onClose={() => setShowTransport(false)} staticSchedule={TRANSPORT_SCHEDULE} />}

      {selectedAgro && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300 text-left" role="dialog" aria-modal="true" aria-label="აგრო დეტალები">
          <div className="bg-[#0a0a1f] p-8 sm:p-10 rounded-[40px] sm:rounded-[50px] border border-white/10 w-full max-w-lg shadow-2xl relative text-center">
            <button onClick={() => setSelectedAgro(null)} className="absolute top-6 right-6 sm:top-8 sm:right-8 text-white/30 hover:text-white transition-colors text-xl sm:text-2xl font-black" aria-label="დახურვა">✕</button>
            <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
               <span className="text-5xl sm:text-6xl mb-4 drop-shadow-2xl">{selectedAgro.icon}</span>
               <h2 className={`text-3xl sm:text-4xl font-black uppercase italic tracking-tighter ${selectedAgro.color} drop-shadow-lg text-center`}>{selectedAgro.name}</h2>
            <p className="text-[10px] sm:text-[11px] font-black text-white/40 uppercase tracking-[0.5em] mt-3 text-center">მიმღები პუნქტები</p>
            <p className="text-[11px] sm:text-[12px] text-white/50 font-semibold mt-2 leading-snug">ფასები არის საორიენტაციო ხასიათის და შეიძლება შეიცვალოს; დეტალები ასახავს ბოლო დაფიქსირებულ ობიექტებს.</p>
            </div>
            <div className="space-y-4">
               {(selectedAgro.details || []).map((d: AgroDetail, idx: number) => (
                 <div key={idx} className="flex justify-between items-center bg-white/[0.04] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all shadow-xl text-left">
                    <span className="text-[13px] sm:text-[15px] font-black italic tracking-tight drop-shadow-sm text-left">{d.place}</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-500 italic text-right">{d.rate}</span>
                 </div>
               ))}
               {(!selectedAgro.details || selectedAgro.details.length === 0) && (
                   <div className="flex justify-between items-center bg-white/[0.04] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all shadow-xl text-left">
                      <span className="text-[13px] sm:text-[15px] font-black italic tracking-tight drop-shadow-sm text-left">საშუალო საბაზრო ფასი</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-500 italic text-right">{selectedAgro.price}</span>
                   </div>
               )}
            </div>
          <p className="mt-6 text-[11px] sm:text-[12px] text-white/40 leading-relaxed">ინფორმაცია განახლდება რეგულარულად; კონკრეტული შეთავაზებები შეიძლება მერყეობდეს ადგილმდებარეობისა და მოცულობის მიხედვით.</p>
          </div>
        </div>
      )}


        <EditAgroModal
          open={!!editAgroItem}
          item={editAgroItem}
          newPrice={newPrice}
          details={editDetails}
          onChange={setNewPrice}
          onChangeDetails={setEditDetails}
          onClose={() => setEditAgroItem(null)}
          loading={editLoading}
          onSubmit={async (e) => {
            e.preventDefault();
            setEditLoading(true);
            await handleUpdatePrice(e);
            setEditLoading(false);
          }}
        />

      <ChatPopup isAdmin={isAdmin} controlToken={controlToken} />

      <ConfirmModal 
        open={!!confirmModal?.open}
        message={confirmModal?.message || ''}
        onConfirm={confirmModal?.onConfirm || (async () => {})}
        onClose={() => setConfirmModal(null)}
        loading={confirmLoading}
      />

      {/* Snackbar: modular and accessible */}
      <SnackbarWrapper open={snackbar.open} message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <Footer />
    </main>
  );
}