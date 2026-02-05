'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import AnnouncementCard from '@/app/components/home/AnnouncementCard';
import type { CommunityDataset } from '@/app/lib/homeData';

type AdminPost = Tables<'admin_posts'>;
type SiteSettingRow = Tables<'site_settings'>;

// Type for agro details
interface AgroDetail {
  place: string;
  rate: string | number;
}

const FALLBACK_MARQUEE = 'საიტი მუშაობს სატესტო რეჟიმში';

const ANNOUNCEMENT_CATEGORIES = [
  'უძრავი ქონება',
  'ავტო',
  'დასაქმება',
  'სოფლის მეურნეობა',
  'ღვინო და მარნები',
  'აგრო-მიწები',
  'აგრო-ტექნიკა',
  'გადაზიდვები',
  'გიდის მომსახურება',
  'განათლება',
  'დრიური საწოლი',
  'ელექტრონიკა',
  'ვაკანსიები',
  'ვენახის მოვლა',
  'ვეტერინარია',
  'ადგილობრივი პროდუქტები',
  'კულტურა',
  'მომსახურება',
  'მეფუტკრეობა',
  'ნერგები და თესლები',
  'რესტორნები',
  'რთველი',
  'სამშენებლო',
  'სამუშაო ჯგუფი',
  'სამედიცინო',
  'სარიტუალო მომსახურება',
  'სასუქები და ქიმიკატები',
  'სასტუმროები',
  'სპორტი',
  'ტექნიკა',
  'ტრადიციული რეწვა',
  'ტურიზმი',
  'ტურისტული',
  'ცხოველები',
  'შეშა და სათბობი',
  'ღვინის ინვენტარი',
  'სხვა'
];

const formatAgroPrice = (value?: string | null) => {
  if (!value) return '';
  return value.includes('₾') ? value : `${value} ₾`;
};

const COMMUNITY_CATEGORIES = ['სამძიმარი', 'დაკარგული/ნაპოვნი', 'ოსტატი', 'მილოცვა'] as const;

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
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['ყველა კახეთი']);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcementsPage, setAnnouncementsPage] = useState(0);
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
    fetchAgroData,
    editAgroItem,
    setEditAgroItem,
    selectedAgro,
    setSelectedAgro,
    newPrice,
    setNewPrice,
  } = useAgroData(initialAgroData);
  const [editDetails, setEditDetails] = useState<{ place: string; rate: string | number; phone?: string }[]>([]);
  const normalizeDetails = useCallback(
    (details: AgroItem['details'], price: string) =>
      (details ?? []).map((detail) =>
        typeof detail === 'string' ? { place: detail, rate: price, phone: '' } : { phone: '', ...detail }
      ),
    []
  );
  const [editLoading, setEditLoading] = useState(false);
  const closeEditAgroModal = useCallback(() => setEditAgroItem(null), []);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '', type: 'info' });
  const [showAllCategories, setShowAllCategories] = useState(false);

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

      // Ensure id type matches DB (numeric ids) when possible
      const targetId = !isNaN(Number((editAgroItem as any).id)) ? Number((editAgroItem as any).id) : (editAgroItem as any).id;

      const { error } = await (supabase
        .from('agro_prices') as any)
        .update(payload)
        .eq('id', targetId);

      if (error) throw error;

      // Refresh authoritative data from DB to avoid client-only drift
      try {
        if (typeof fetchAgroData === 'function') await fetchAgroData();
      } catch (e) {
        console.warn('fetchAgroData failed after update', e);
      }

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
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  const [adminPosts, setAdminPosts] = useState<AdminPost[]>(initialAdminPosts);
  const [factIndex, setFactIndex] = useState(0);

  const formatAgroPrice = useCallback((price?: string | null) => {
    if (!price) return '';
    return price.includes('₾') ? price : `${price} ₾`;
  }, []);

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

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleMediaChange = () => setIsDesktop(mediaQuery.matches);
    handleMediaChange();
    mediaQuery.addEventListener('change', handleMediaChange);

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
      mediaQuery.removeEventListener('change', handleMediaChange);
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

  useEffect(() => {
    if (!showAllCategories) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAllCategories]);

  // Remove inline ConfirmModal, use component below

  // ...admin auth logic now comes from useAdminAuth

    // ...moved to useAgroData

  const normalizeText = useCallback((value: string | null | undefined) => {
    return (value ?? '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const filteredAds = useMemo(() => {
    const selectedLocs = selectedLocations
      .filter((loc) => loc !== 'ყველა კახეთი')
      .map((loc) => normalizeText(loc));
    return ads.filter(ad => {
      if (COMMUNITY_CATEGORIES.includes(ad.category as typeof COMMUNITY_CATEGORIES[number])) return false;
      if (ad.is_archived) return false;
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes('ყველა') || selectedCategories.includes(ad.category);
      const adLocation = normalizeText(ad.location);
      const matchLoc = selectedLocations.includes('ყველა კახეთი') || selectedLocs.some((loc) => adLocation.includes(loc));
      const matchSearch = normalizeText(ad.title || '').includes(normalizeText(searchTerm));
      return matchCat && matchLoc && matchSearch;
    });
  }, [ads, normalizeText, selectedCategories, selectedLocations, searchTerm]);

  const selectCategory = (category: string) => {
    if (category === 'ყველა') {
      setSelectedCategories(['ყველა']);
      setShowAllAnnouncements(true);
      setAnnouncementsPage(0);
      return;
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== 'ყველა');
      const exists = withoutAll.includes(category);
      const next = exists ? withoutAll.filter((c) => c !== category) : [...withoutAll, category];
      return next.length === 0 ? ['ყველა'] : next;
    });
    setShowAllAnnouncements(false);
    setAnnouncementsPage(0);
  };

  const pageSize = 8;
  const maxPage = Math.max(0, Math.ceil(filteredAds.length / pageSize) - 1);
  const safePage = Math.min(announcementsPage, maxPage);
  const visibleAds = showAllAnnouncements
    ? filteredAds
    : filteredAds.slice(safePage * pageSize, safePage * pageSize + pageSize);


  const allNonCommunityCategories = useMemo(() => {
    const derivedFromAds = Array.from(
      new Set(
        ads
          .filter(ad => !ad.is_archived)
          .map(ad => ad.category)
          .filter((category): category is string => Boolean(category))
          .filter(category => !COMMUNITY_CATEGORIES.includes(category as typeof COMMUNITY_CATEGORIES[number]))
      )
    );

    const fallback = ANNOUNCEMENT_CATEGORIES.filter(
      category => !COMMUNITY_CATEGORIES.includes(category as typeof COMMUNITY_CATEGORIES[number])
    );

    return [
      ...derivedFromAds,
      ...fallback.filter(category => !derivedFromAds.includes(category)),
    ];
  }, [ads]);

  const visibleCategories = useMemo(
    () => allNonCommunityCategories.slice(0, 6),
    [allNonCommunityCategories]
  );

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


      <div className="layout-shell relative z-10 w-full max-w-full xl:max-w-[1800px] px-4 sm:px-6 md:px-10 mx-auto mt-6 mb-3 overflow-hidden">
        <CommunityWidgets
          initialObituaries={initialCommunity.obituaries}
          initialLostFound={initialCommunity.lostFound}
          initialMasters={initialCommunity.masters}
          initialCongrats={initialCommunity.congratulations}
        />
      </div>

      {/* Informational grid section, now outside header for independent styling */}
      <section className="layout-shell relative z-10 w-full max-w-full xl:max-w-[1800px] px-4 sm:px-6 md:px-10 mx-auto mt-10 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)] xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,300px)] gap-4 md:gap-6 xl:gap-8 items-start text-white bg-black/70 backdrop-blur-2xl rounded-[30px] border border-white/10 p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-full overflow-hidden">
          {/* --- მარცხენა სვეტი (Desktop Only) --- */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-24 order-1 w-full max-w-full min-w-0">
            {/* კახური მოედანი (სქროლით) */}
            {isDesktop !== false && (
              <div 
                className="w-full h-[450px] overflow-hidden bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 relative"
              >
                <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} />
              </div>
            )}
            {/* 🍇 აგრო-ბირჟა */}
            <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/30 shadow-xl h-[360px]">
              <div className="flex justify-between w-full items-center mb-4">
                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">🍇 აგრო-ბირჟა</h4>
              </div>
              <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
              <div className="w-full flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {agroData.filter(i => i.category === 'grape').map(item => (
                  <button key={item.id} onClick={() => setSelectedAgro(item)} className="w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5">
                    <span className="text-xs font-black uppercase text-purple-300 flex gap-2">{item.name}</span>
                    <span className="text-sm font-black italic">{formatAgroPrice(item.price)}</span>
                  </button>
                ))}
              </div>
              <p className="mt-auto pt-3 text-[12px] text-white/90 font-black text-center tracking-wide">თქვენი ფასი და საკონტაქტო ნომერი გამოჩნდება ამ ფანჯარაში</p>
            </div>
            {/* 🏛️ ადმინისტრაციული განცხადება */}
            <div className="w-full min-w-[260px] xl:min-w-[300px] bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-4 ring-1 ring-amber-400/20 relative">
              <AdminSideFrame 
                post={getPostByPos('left_top')} 
                position="left_top" 
                isAdmin={isAdmin} 
                onRefresh={fetchAdminPosts}
              />
            </div>
          </div>

          {/* --- ცენტრალური სვეტი --- */}
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000 w-full min-w-0 order-1 lg:order-2">
             {/* მობილური ვერსია - მარცხენა მხარე */}
             <div className="flex flex-col gap-4 w-full lg:hidden">
                 {isDesktop !== true && (
                   <div className="h-[450px] bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5">
                     <KakhetianSquare isAdmin={isAdmin} controlToken={controlToken} />
                   </div>
                 )}
                 {/* 🍇 აგრო-ბირჟა */}
                 <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/30 shadow-xl h-[360px]">
                   <div className="flex justify-between w-full items-center mb-4">
                     <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">🍇 აგრო-ბირჟა</h4>
                   </div>
                   <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
                   <div className="w-full flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                     {agroData.filter(i => i.category === 'grape').map(item => (
                       <button key={item.id} onClick={() => setSelectedAgro(item)} className="w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5">
                         <span className="text-xs font-black uppercase text-purple-300 flex gap-2">{item.name}</span>
                         <span className="text-sm font-black italic">{formatAgroPrice(item.price)}</span>
                       </button>
                     ))}
                   </div>
                   <p className="mt-auto pt-3 text-[12px] text-white/90 font-black text-center tracking-wide">თქვენი ფასი და საკონტაქტო ნომერი გამოჩნდება ამ ფანჯარაში</p>
                 </div>
                  {/* 🌾 მარცვლეული */}
                  <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-yellow-500/30 shadow-xl h-[360px]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent opacity-30" />
                    <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-4 w-full text-left">🌾 მარცვლეული</h4>
                    <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
                    <div className="w-full flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                      {agroData.filter(i => i.category === 'grain').map(item => (
                        <button key={item.id} onClick={() => setSelectedAgro(item)} className="w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5">
                          <span className="text-xs font-black uppercase text-yellow-500 flex gap-2">{item.name}</span>
                          <span className="text-sm font-black italic">{formatAgroPrice(item.price)}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-auto pt-3 text-[12px] text-yellow-200 font-black text-center tracking-wide">თქვენი ფასი და საკონტაქტო ნომერი გამოჩნდება ამ ფანჯარაში</p>
                  </div>
                 {/* 🏛️ ადმინისტრაციული განცხადება */}
                 <div className="mt-2 bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-4 ring-1 ring-amber-400/20 relative">
                   <AdminSideFrame 
                     post={getPostByPos('left_top')} 
                     position="left_top" 
                     isAdmin={isAdmin} 
                     onRefresh={fetchAdminPosts}
                   />
                 </div>
                 <div className="bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-4 ring-1 ring-amber-400/20 relative">
                   <AdminSideFrame 
                     post={getPostByPos('right_top')} 
                     position="right_top" 
                     isAdmin={isAdmin} 
                     onRefresh={fetchAdminPosts}
                   />
                 </div>
                {/* CommunityHub removed: community entry moved to navbar center */}
             </div>

             <HeroSection 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} filteredAds={filteredAds}
               selectedLocations={selectedLocations} setSelectedLocations={setSelectedLocations}
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

          </div>

          {/* --- მარჯვენა სვეტი (Desktop Only) --- */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-24 order-3 w-full max-w-full min-w-0">
            {/* ჰაბი */}
            <div className="w-full h-[450px] overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 relative">
              <div className="p-1">
                <RightSidebar weatherData={weatherData} seasonal={seasonal} fact={KAKHETI_FACTS[factIndex]} onShowTransport={() => setShowTransport(true)} />
              </div>
            </div>
            {/* 🌾 მარცვლეული */}
            <div className="w-full bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-yellow-500/30 shadow-xl h-[360px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent opacity-30" />
              <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-4 w-full text-left">🌾 მარცვლეული</h4>
              <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
              <div className="w-full flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {agroData.filter(i => i.category === 'grain').map(item => (
                  <button key={item.id} onClick={() => setSelectedAgro(item)} className="w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5">
                    <span className="text-xs font-black uppercase text-yellow-500 flex gap-2">{item.name}</span>
                    <span className="text-sm font-black italic">{formatAgroPrice(item.price)}</span>
                  </button>
                ))}
              </div>
              <p className="mt-auto pt-3 text-[12px] text-yellow-200 font-black text-center tracking-wide">თქვენი ფასი და საკონტაქტო ნომერი გამოჩნდება ამ ფანჯარაში</p>
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
          onClose={closeEditAgroModal}
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

      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 mt-8 mb-10">
        <div className="relative bg-black/50 border border-amber-500/30 rounded-2xl px-5 py-5 min-h-[64px] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="absolute top-3 left-4 right-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] md:text-xs font-extrabold uppercase tracking-[0.2em] text-white/90">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories(['ყველა']);
                  setShowAllAnnouncements(true);
                }}
                className="px-3 py-1 rounded-full border border-amber-300/40 bg-amber-500/10 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 hover:bg-amber-500/20 transition"
              >
                ყველა განცხადება
              </button>
            </div>
            <span className="text-amber-400 text-base md:text-lg tracking-normal">{ads.length}</span>
            <div className="hidden md:flex flex-wrap items-center gap-2">
              {visibleCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => selectCategory(category)}
                    className={`px-2.5 py-1 rounded-full border text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition ${
                      selectedCategories.includes(category)
                        ? 'border-amber-300/50 bg-amber-500/20 text-amber-200'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAllCategories(true)}
            className="absolute top-3 right-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 hover:text-amber-200 transition"
          >
            ყველა კატეგორია
          </button>
        </div>
      </div>


      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 mt-6">
        {visibleAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleAds.map((ad) => (
              <AnnouncementCard key={ad.id} announcement={ad} />
            ))}
            {filteredAds.length > 0 && (
              <div className="relative rounded-2xl border border-transparent min-h-[180px]">
                <button
                  type="button"
                  onClick={() => setAnnouncementsPage((p) => (p >= maxPage ? 0 : p + 1))}
                  className="absolute bottom-3 left-3 px-4 py-2 rounded-full border border-amber-300/50 bg-amber-500/20 text-amber-200 font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-500/30 transition"
                >
                  შემდეგი
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-white/60 text-sm">
            ამ კატეგორიაში განცხადებები არ მოიძებნა
          </div>
        )}
      </div>

      {showAllCategories && (
        <div className="fixed inset-0 z-[120]" onClick={() => setShowAllCategories(false)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[20px] animate-in fade-in duration-300" />
          <div
            className="relative max-w-4xl mx-auto mt-24 bg-[#0b0b15]/90 border border-white/10 rounded-[28px] p-6 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">ყველა კატეგორია</h3>
                <p className="text-white/50 text-sm mt-1">სათემო ჩართულობის გარდა არსებული კატეგორიები</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCategories(false)}
                className="text-white/40 hover:text-white transition text-sm font-black uppercase"
              >
                დახურვა ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allNonCommunityCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    selectCategory(category);
                  }}
                  className={`px-3 py-3 rounded-2xl border text-[11px] md:text-xs font-black uppercase tracking-[0.2em] transition text-center ${
                    selectedCategories.includes(category)
                      ? 'border-amber-300/50 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}