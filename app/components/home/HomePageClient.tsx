'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useAdminAuth } from '@/app/hooks/useAdminAuth';
import { useAdsData } from '@/app/hooks/useAdsData';
import { useAgroData } from '@/app/hooks/useAgroData';
import { useWeatherData } from '@/app/hooks/useWeatherData';
import { supabase } from '@/app/lib/supabase';
import { Ad, AgroItem, WeatherItem } from '@/app/lib/types';
import type { Tables } from '@/types/helpers';
import { KAKHETI_FACTS, TRANSPORT_SCHEDULE } from '@/app/lib/constants';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import SnackbarWrapper from '@/app/components/layout/SnackbarWrapper';
import ConfirmModal from '@/app/components/layout/ConfirmModal';
import EditAgroModal from '@/app/components/layout/EditAgroModal';
import HeroSection from '@/app/components/home/HeroSection';
import ServiceWidgets from '@/app/components/home/ServiceWidgets';
import RightSidebar from '@/app/components/home/RightSidebar';
import KakhetianSquare from '@/app/components/features/KakhetianSquare';
import TransportModal from '@/app/components/features/transport/TransportModal';
import AdminSideFrame from '@/app/components/home/AdminSideFrame';
import ChatPopup from '@/app/components/features/ChatPopup';
import AgroDetailsModal from '@/app/components/home/AgroDetailsModal';
import CommunityWidgets from '@/app/components/community/CommunityWidgets';
import CommunityEngagement from '../../components/home/CommunityEngagement';
import AnnouncementsSection from '../../components/home/AnnouncementsSection';
import type { CommunityDataset } from '@/app/lib/homeData';

type AdminPost = Tables<'admin_posts'>;
type SiteSettingRow = Tables<'site_settings'>;

// Type for agro details
interface AgroDetail {
  place: string;
  rate: string | number;
}

const FALLBACK_MARQUEE = 'საიტი მუშაობს სატესტო რეჟიმში';

interface HomePageClientProps {
  initialAds: Ad[];
  initialAgroData: AgroItem[];
  initialWeatherData: WeatherItem[];
  initialAdminPosts: AdminPost[];
  initialBgImage: string | null;
  initialMarqueeText: string;
  initialCommunity: CommunityDataset;
}

// Helpers
const getSeasonalContent = () => {
  const month = new Date().getMonth();
  if (month === 0 || month === 1) return { tag: "ზამთარი", text: "ვენახის გასხვლის დროა.", icon: "✂️" };
  if (month >= 2 && month <= 4) return { tag: "გაზაფხული", text: "ვენახის წამლობის სეზონია.", icon: "🌱" };
  if (month >= 5 && month <= 7) return { tag: "ზაფხული", text: "აქტიური ტურიზმია.", icon: "☀️" };
  if (month >= 8 && month <= 10) return { tag: "შემოდგომა", text: "კახური რთველი მოვიდა!", icon: "🍇" };
  return { tag: "რჩევა", text: "დაგეგმეთ საქმიანობა.", icon: "📅" };
};


export default function HomePageClient({
  initialAds,
  initialAgroData,
  initialWeatherData,
  initialAdminPosts,
  initialBgImage,
  initialMarqueeText,
  initialCommunity,
}: HomePageClientProps) {
  const { isAdmin } = useAdminAuth();
  const {
    ads,
    fetchAds,
    archiveAd,
    restoreAd,
    deleteAd,
  } = useAdsData(initialAds);
  const {
    weatherData,
  } = useWeatherData(initialWeatherData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['ყველა']);
  const [selectedLocation, setSelectedLocation] = useState('ყველა კახეთი');
  const [bgImage, setBgImage] = useState<string | null>(initialBgImage ?? null);
  // Marquee text state
  const [marqueeText, setMarqueeText] = useState<string>(initialMarqueeText || FALLBACK_MARQUEE);

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
      setMarqueeText(FALLBACK_MARQUEE);
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
  } = useAgroData(initialAgroData);
  const [editDetails, setEditDetails] = useState<{ place: string; rate: string | number }[]>([]);
  const normalizeDetails = useCallback(
    (details: AgroItem['details'], price: string) =>
      (details ?? []).map((detail) =>
        typeof detail === 'string' ? { place: detail, rate: price } : detail
      ),
    []
  );
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

      const { error } = await (supabase
        .from('agro_prices') as any)
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

  const [adminPosts, setAdminPosts] = useState<AdminPost[]>(initialAdminPosts);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    setBgImage(initialBgImage ?? null);
  }, [initialBgImage]);

  useEffect(() => {
    setMarqueeText(initialMarqueeText || FALLBACK_MARQUEE);
  }, [initialMarqueeText]);

  useEffect(() => {
    setAdminPosts(initialAdminPosts);
  }, [initialAdminPosts]);

  const fetchAdminPosts = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_posts')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const now = Date.now();
        setAdminPosts(data.filter((post: AdminPost) => {
          const publishAt = (post as any).publish_at;
          const publishOk = !publishAt || new Date(publishAt).getTime() <= now;
          return post.priority !== -1 && ((post as any).is_published ?? true) && !((post as any).is_archived ?? false) && publishOk;
        }));
      }
    } catch (error) {
      console.error('Failed to load admin posts', error);
    }
  }, []);

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
    fetchAdminPosts();
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
  }, [fetchAds, fetchAdminPosts]);

  const getPostByPos = (pos: string) => adminPosts.find(p => p.position === pos);

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


  return (
    <main className="min-h-screen relative flex flex-col bg-[#050510] overflow-x-hidden text-left selection:bg-amber-500 selection:text-white text-white w-full max-w-full">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {bgImage && (
          bgImage.includes('.mp4') || bgImage.includes('.mov') || bgImage.includes('.avi') || bgImage.includes('.webm') ? (
            <video
              src={bgImage}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover opacity-7 transition-opacity duration-500"
              playsInline
            />
          ) : (
            <Image
              src={bgImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-7 transition-opacity duration-500"
              priority
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f]/30 via-[#050510]/10 to-[#050510]/40 backdrop-blur-[2px]" />
      </div>

      <Navbar />

      <div className="layout-shell relative z-10 w-full max-w-full xl:max-w-[1800px] px-4 sm:px-6 md:px-10 mx-auto mt-6 overflow-hidden">
        <CommunityWidgets
          initialObituaries={initialCommunity.obituaries}
          initialLostFound={initialCommunity.lostFound}
          initialMasters={initialCommunity.masters}
          initialCongrats={initialCommunity.congratulations}
        />
      </div>

      {/* Informational grid section, now outside header for independent styling */}
      <section className="layout-shell relative z-10 w-full max-w-full xl:max-w-[1800px] px-4 sm:px-6 md:px-10 mx-auto mt-10 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-4 md:gap-6 xl:gap-8 items-start text-white bg-black/70 backdrop-blur-2xl rounded-[30px] border border-white/10 p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-full overflow-hidden">
          {/* --- მარცხენა სვეტი (Desktop Only) --- */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-24 order-1 w-full max-w-[320px]">
            {/* კახური მოედანი (სქროლით) */}
            <div 
              className="w-full h-[450px] overflow-hidden bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 relative"
            >
              <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} />
            </div>
            {/* 🍇 აგრო-ბირჟა */}
            <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/30 shadow-xl">
              <div className="flex justify-between w-full items-center mb-4">
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">🍇 აგრო-ბირჟა</h4>
                {isAdmin && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded">Edit</span>}
              </div>
              <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
              <div className="w-full space-y-2">
                {agroData.filter(i => i.category === 'grape').map(item => (
                  <button key={item.id} onClick={() => isAdmin ? (() => { setEditAgroItem(item); setNewPrice(item.price); setEditDetails(normalizeDetails(item.details, item.price)); })() : setSelectedAgro(item)} className={`w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5 ${isAdmin ? 'hover:border-amber-500' : ''}`}>
                    <span className="text-xs font-black uppercase text-purple-300 flex gap-2">{item.name} {isAdmin && '✏️'}</span>
                    <span className="text-sm font-black italic">{item.price}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* 🏛️ ადმინისტრაციული განცხადება */}
            <div className="w-full bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-4 ring-1 ring-amber-400/20 relative" style={{ minWidth: '240px' }}>
              <AdminSideFrame 
                post={getPostByPos('left_top')} 
                position="left_top" 
                isAdmin={isAdmin} 
                onRefresh={fetchAdminPosts}
              />
            </div>
          </div>

          {/* --- ცენტრალური სვეტი --- */}
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000 w-full order-1 lg:order-2">
             {/* მობილური ვერსია - მარცხენა მხარე */}
             <div className="flex flex-col gap-4 w-full lg:hidden">
                 <div className="h-[450px] bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5">
                   <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} />
                 </div>
                 {/* 🍇 აგრო-ბირჟა */}
                 <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/30 shadow-xl">
                   <div className="flex justify-between w-full items-center mb-4">
                     <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">🍇 აგრო-ბირჟა</h4>
                     {isAdmin && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded">Edit</span>}
                   </div>
                   <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
                   <div className="w-full space-y-2">
                     {agroData.filter(i => i.category === 'grape').map(item => (
                       <button key={item.id} onClick={() => isAdmin ? (() => { setEditAgroItem(item); setNewPrice(item.price); setEditDetails(normalizeDetails(item.details, item.price)); })() : setSelectedAgro(item)} className={`w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5 ${isAdmin ? 'hover:border-amber-500' : ''}`}>
                         <span className="text-xs font-black uppercase text-purple-300 flex gap-2">{item.name} {isAdmin && '✏️'}</span>
                         <span className="text-sm font-black italic">{item.price}</span>
                       </button>
                     ))}
                   </div>
                 </div>
                 {/* 🏛️ ადმინისტრაციული განცხადება */}
                 <div className="-mt-8 bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-4 ring-1 ring-amber-400/20 relative">
                   <AdminSideFrame 
                     post={getPostByPos('right_bottom')} 
                     position="right_bottom" 
                     isAdmin={isAdmin} 
                       onRefresh={fetchAdminPosts}
                   />
                 </div>
                {/* CommunityHub removed: community entry moved to navbar center */}
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
              onMapSearch={handleMapSearch}
            />

            {/* Community Engagement Section */}
            <CommunityEngagement />

            {/* Announcements Section */}
            <AnnouncementsSection />
          </div>

          {/* --- მარჯვენა სვეტი (Desktop Only) --- */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-24 order-3 w-full max-w-[320px]">
            {/* ჰაბი */}
            <div className="w-full h-[450px] overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 relative">
              <div className="p-1">
                <RightSidebar weatherData={weatherData} seasonal={seasonal} fact={KAKHETI_FACTS[factIndex]} onShowTransport={() => setShowTransport(true)} />
              </div>
            </div>
            {/* 🌾 მარცვლეული */}
            <div className="w-full bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-yellow-500/30 shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent opacity-30" />
              <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-4 w-full text-left">🌾 მარცვლეული</h4>
              <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
              <div className="w-full space-y-2">
                {agroData.filter(i => i.category === 'grain').map(item => (
                  <button key={item.id} onClick={() => isAdmin ? (() => { setEditAgroItem(item); setNewPrice(item.price); setEditDetails(normalizeDetails(item.details, item.price)); })() : setSelectedAgro(item)} className={`w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5 ${isAdmin ? 'hover:border-amber-500' : ''}`}>
                    <span className="text-xs font-black uppercase text-yellow-500 flex gap-2">{item.name} {isAdmin && '✏️'}</span>
                    <span className="text-sm font-black italic">{item.price}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* 🏛️ ადმინისტრაციული განცხადებები */}
            <div className="flex flex-col gap-4 w-full">
              <div className="w-full bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-4 ring-1 ring-amber-400/20 relative">
                <AdminSideFrame 
                  post={getPostByPos('right_top')} 
                  position="right_top" 
                  isAdmin={isAdmin} 
                  onRefresh={fetchAdminPosts}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AdsSection removed - announcements now only appear on dedicated /announcements page */}
      {/* <AdsSection 
        ads={ads} filteredAds={filteredAds} isAdmin={isAdmin} showArchive={false}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
        onArchive={handleArchiveAd} onRestore={handleRestoreAd} onDelete={handlePermanentDelete} onFBShare={handleFBShare} onCopyShare={handleCopyShare}
      /> */}

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