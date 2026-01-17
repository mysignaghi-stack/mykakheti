'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdsData } from './hooks/useAdsData';
import { useAgroData } from './hooks/useAgroData';
import { useWeatherData } from './hooks/useWeatherData';
import { supabase } from './lib/supabase';
import { Ad, AdminPost } from './lib/types';
import type { Tables } from '@/types/helpers';
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
import AgroDetailsModal from './components/home/AgroDetailsModal';
import CommunityEngagementSection from './components/home/CommunityEngagementSection';

// Type for agro details
interface AgroDetail {
  place: string;
  rate: string | number;
}

type SiteSettingRow = Tables<'site_settings'>;

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
  const { isAdmin } = useAdminAuth();
  const {
    ads,
    fetchAds,
    archiveAd,
    restoreAd,
    deleteAd,
  } = useAdsData();
  const {
    weatherData,
  } = useWeatherData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['ყველა']);
  const [selectedLocation, setSelectedLocation] = useState('ყველა კახეთი');
  const [bgImage, setBgImage] = useState<string | null>(null);
  // Marquee text state
  const [marqueeText, setMarqueeText] = useState<string>('');

  // Fetch background image and marquee text from site_settings
  const fetchBG = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['background_url', 'marquee_text']);

      if (error) throw error;

      const typedData = data as unknown as SiteSettingRow[] | null;

      if (typedData) {
        const bg = typedData.find(item => item.key === 'background_url')?.value;
        const marquee = typedData.find(item => item.key === 'marquee_text')?.value;
        setBgImage(bg ?? null);
        setMarqueeText(marquee ?? '');
      }
    } catch (error) {
      console.log('Error fetching site settings:', error);
      setMarqueeText('საიტი მუშაობს სატესტო რეჟიმში');
    }
  }, []);

  useEffect(() => {
    fetchBG();

    const channel = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, () => {
        fetchBG();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBG]);

  // Agro hook
  const {
    agroData,
    setAgroData,
    editAgroItem,
    setEditAgroItem,
    selectedAgro,
    setSelectedAgro,
    newPrice,
    setNewPrice,
  } = useAgroData();
  const [editDetails, setEditDetails] = useState<{ place: string; rate: string | number }[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '', type: 'info' });

  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, type });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleUpdatePrice = useCallback(async () => {
    if (!editAgroItem) {
      showSnackbar('აირჩიეთ პოზიცია რედაქტირებისთვის', 'error');
      return;
    }

    try {
      const payload = {
        price: newPrice,
        details: editDetails,
      };

      const { error } = await supabase
        .from('agro_prices')
        .update(payload)
        .eq('id', editAgroItem.id);

      if (error) throw error;

      setAgroData(prev => prev.map(item => item.id === editAgroItem.id ? { ...item, price: newPrice, details: editDetails } : item));
      showSnackbar('ფასი განახლდა', 'success');
      setEditAgroItem(null);
    } catch (err) {
      console.error('Failed to update agro price', err);
      showSnackbar('ვერ განახლდა ფასი', 'error');
    }
  }, [editAgroItem, newPrice, editDetails, setAgroData, showSnackbar]);
  const [isLocOpen, setIsLocOpen] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);
  
  const [showTransport, setShowTransport] = useState(false);
  
  // ...moved to useAgroData
  const [controlToken, setControlToken] = useState<string>('');

  const [adminPosts, setAdminPosts] = useState<AdminPost[]>([]);
  const [factIndex, setFactIndex] = useState(0);
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
    return () => {
      clearInterval(factTimer);
    };
  }, [fetchAds]);

  const fetchAdminPosts = async () => {
    const { data } = await (supabase as any).from('admin_posts').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });
    if (data) setAdminPosts(data);
  };

  const getPostByPos = (pos: string) => adminPosts.find(p => p.position === pos);

  const changeFrameContentType = (position: string, type: 'post' | 'announcement') => {
    setFrameContentTypes(prev => ({ ...prev, [position]: type }));
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
  }, [editAgroItem, setEditAgroItem]);

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
        {bgImage && (
          <Image
            src={bgImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-7 transition-opacity duration-500"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f]/30 via-[#050510]/10 to-[#050510]/40 backdrop-blur-[2px]" />
      </div>

      <Navbar />

      {/* Community unit moved nearer to announcements */}

      {/* Informational grid section, now outside header for independent styling */}
      <section className="relative z-10 w-full px-4 sm:px-6 md:px-10 max-w-[1800px] mx-auto mt-4">
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
               isLocOpen={isLocOpen} setIsLocOpen={setIsLocOpen} locRef={locRef as React.RefObject<HTMLDivElement>}
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

      <CommunityEngagementSection />

      <AdsSection 
        ads={ads} filteredAds={filteredAds} isAdmin={isAdmin} showArchive={false}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
        onArchive={handleArchiveAd} onRestore={handleRestoreAd} onDelete={handlePermanentDelete} onFBShare={handleFBShare} onCopyShare={handleCopyShare}
      />

      {showTransport && <TransportModal isAdmin={isAdmin} onClose={() => setShowTransport(false)} staticSchedule={TRANSPORT_SCHEDULE} />}

      <AgroDetailsModal selectedAgro={selectedAgro} onClose={() => setSelectedAgro(null)} />

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
            await handleUpdatePrice();
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