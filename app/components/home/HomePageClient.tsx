'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAdminAuth } from '@/app/hooks/useAdminAuth';
import { useAdsData } from '@/app/hooks/useAdsData';
import { useAgroData } from '@/app/hooks/useAgroData';
import { useWeatherData } from '@/app/hooks/useWeatherData';
import { supabase } from '@/app/lib/supabase';
import { Ad, AgroItem, WeatherItem } from '@/app/lib/types';
import type { Tables } from '@/types/helpers';
import { ANNOUNCEMENT_CATEGORIES, KAKHETI_FACTS, LOCATIONS, TRANSPORT_SCHEDULE } from '@/app/lib/constants';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import SnackbarWrapper from '@/app/components/layout/SnackbarWrapper';
import ConfirmModal from '@/app/components/layout/ConfirmModal';
import EditAgroModal from '@/app/components/layout/EditAgroModal';
import { GuideWidget, HeritageWidget } from '@/app/components/home/ServiceWidgets';
import TransportModal from '@/app/components/features/transport/TransportModal';
import AdminSideFrame from '@/app/components/home/AdminSideFrame';
import AgroDetailsModal from '@/app/components/home/AgroDetailsModal';
import AnnouncementCard from '@/app/components/home/AnnouncementCard';
import RecentAnnouncementsSection from '@/app/components/home/RecentAnnouncementsSection';
import ServiceProvidersSection from '@/app/components/home/ServiceProvidersSection';
import FavoritesDropdown from '@/app/components/home/FavoritesDropdown';
import type { CommunityCounts, CommunityDataset } from '@/app/lib/homeData';

type AdminPost = Tables<'admin_posts'>;
type SiteSettingRow = Tables<'site_settings'>;
type AdsSortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';
type AgroSubmissionType = 'grape' | 'grain';

const ChatPopup = dynamic(() => import('@/app/components/features/ChatPopup'), {
  ssr: false,
});

// Type for agro details
interface AgroDetail {
  place: string;
  rate: string | number;
}

const FALLBACK_MARQUEE = 'საიტი მუშაობს სატესტო რეჟიმში';

const normalizeAgroText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const removeGeorgianLariLetter = (value: string) =>
  value
    .replace(/₾/g, 'GEL')
    .replace(/\bgel\b/gi, 'GEL')
    .replace(/\s*ლ\s*(?=$|GEL|gel|₾)/g, ' ')
    .replace(/(\d)\s*ლ\b/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

const formatAgroPrice = (value?: string | number | null) => {
  const text = removeGeorgianLariLetter(normalizeAgroText(value ?? ''));
  if (!text) return '';
  return /\bGEL\b/i.test(text) ? text : `${text} GEL`;
};

const pickDetailRate = (details: AgroItem['details']) => {
  if (!Array.isArray(details)) return '';
  for (const detail of details) {
    if (detail && typeof detail === 'object' && 'rate' in detail) {
      const rateText = normalizeAgroText((detail as { rate?: string | number }).rate);
      if (rateText) return rateText;
    }
  }
  return '';
};

const getAgroDisplayPrice = (item: AgroItem) => {
  const priceText = normalizeAgroText(item.price);
  const idText = normalizeAgroText(item.id);
  if (priceText && priceText !== idText) return formatAgroPrice(priceText);
  const detailRate = pickDetailRate(item.details);
  return detailRate ? formatAgroPrice(detailRate) : formatAgroPrice(priceText);
};

const COMMUNITY_CATEGORIES = ['დაკარგული/ნაპოვნი', 'ოსტატი', 'სერვისის მაძიებელი', 'აგრო-ბირჟის განაცხადი', 'მარცვლეულის განაცხადი'] as const;
const isSpecialAgroAnnouncement = (ad: Ad) => (
  COMMUNITY_CATEGORIES.includes(ad.category as typeof COMMUNITY_CATEGORIES[number]) ||
  Boolean(ad.description?.includes('აგრო-ბირჟა:')) ||
  Boolean(ad.description?.includes('მარცვლეული:'))
);

interface HomePageClientProps {
  initialAds: Ad[];
  initialAgroData: AgroItem[];
  initialWeatherData: WeatherItem[];
  initialAdminPosts: AdminPost[];
  initialBgImage: string | null;
  initialMarqueeText: string;
  initialCommunity: CommunityDataset;
  initialCommunityCounts: CommunityCounts;
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
  initialCommunityCounts,
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
  const [adsSort, setAdsSort] = useState<AdsSortOption>('newest');
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcementsPage, setAnnouncementsPage] = useState(0);
  const [adsSliderIndex, setAdsSliderIndex] = useState(0);
  const [adsCardsPerView, setAdsCardsPerView] = useState(4);
  const adsSliderRef = useRef<HTMLDivElement>(null);
  const adsTouchStartX = useRef<number | null>(null);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [modalAnnouncementsPage, setModalAnnouncementsPage] = useState(0);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(2);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryBarRef = useRef<HTMLDivElement | null>(null);
  const categoryMeasureRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
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
    const hasInitialSettings = Boolean(initialBgImage) && Boolean(initialMarqueeText);
    if (!hasInitialSettings) {
      fetchBG();
    }

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
  const [agroSubmissionType, setAgroSubmissionType] = useState<AgroSubmissionType | null>(null);
  const [agroSubmissionLoading, setAgroSubmissionLoading] = useState(false);
  const [agroSubmissionForm, setAgroSubmissionForm] = useState({
    product: '',
    price: '',
    location: '',
    phone: '',
    note: '',
  });

  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({ open: true, message, type });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const buildShareUrl = useCallback((target: string) => {
    if (typeof window === 'undefined') return '';
    if (/^https?:\/\//.test(target)) return target;
    if (target.startsWith('#')) return `${window.location.origin}${window.location.pathname}${target}`;
    return `${window.location.origin}${target.startsWith('/') ? target : `/${target}`}`;
  }, []);

  const shareHomeSection = useCallback(async (label: string, target: string) => {
    const url = buildShareUrl(target);
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: label, url });
        return;
      } catch {
        // fall back to clipboard below
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showSnackbar('ბმული დაკოპირდა.', 'success');
    } catch {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 'fb-share', 'width=600,height=400');
    }
  }, [buildShareUrl, showSnackbar]);

  const shareHomeSectionToFacebook = useCallback((target: string) => {
    const url = buildShareUrl(target);
    if (!url) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 'fb-share', 'width=600,height=400');
  }, [buildShareUrl]);

  const openAgroSubmission = useCallback((type: AgroSubmissionType) => {
    setAgroSubmissionType(type);
    setAgroSubmissionForm({ product: '', price: '', location: '', phone: '', note: '' });
  }, []);

  const closeAgroSubmission = useCallback(() => {
    if (agroSubmissionLoading) return;
    setAgroSubmissionType(null);
  }, [agroSubmissionLoading]);

  const submitAgroSubmission = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agroSubmissionType || agroSubmissionLoading) return;

    setAgroSubmissionLoading(true);
    try {
      const response = await fetch('/api/agro-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: agroSubmissionType, ...agroSubmissionForm }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        showSnackbar('განაცხადის გასაგზავნად გაიარეთ ავტორიზაცია.', 'error');
        return;
      }
      if (!response.ok) throw new Error(payload?.error || 'განაცხადის გაგზავნა ვერ მოხერხდა');
      showSnackbar('განაცხადი გაიგზავნა მოდერაციაზე.', 'success');
      setAgroSubmissionType(null);
      setAgroSubmissionForm({ product: '', price: '', location: '', phone: '', note: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'უცნობი შეცდომა';
      showSnackbar(message, 'error');
    } finally {
      setAgroSubmissionLoading(false);
    }
  }, [agroSubmissionForm, agroSubmissionLoading, agroSubmissionType, showSnackbar]);

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
  const [showTransport, setShowTransport] = useState(false);
  
  // ...moved to useAgroData
  const [controlToken, setControlToken] = useState<string>('');
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  const [adminPosts, setAdminPosts] = useState<AdminPost[]>(initialAdminPosts);
  const [factIndex, setFactIndex] = useState(0);

  const formatAgroPrice = useCallback((price?: string | null) => {
    const text = removeGeorgianLariLetter(normalizeAgroText(price));
    if (!text) return '';
    return /\bGEL\b/i.test(text) ? text : `${text} GEL`;
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

    if (initialAds.length === 0) {
      fetchAds();
    }
    if (initialAdminPosts.length === 0) {
      fetchAdminPosts();
    }
    return () => {
      clearInterval(factTimer);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [fetchAds, fetchAdminPosts, initialAds.length, initialAdminPosts.length]);

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

  useEffect(() => {
    if (!showAllFilters) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setShowCategoryDropdown(false);
    setShowLocationDropdown(false);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAllFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const categoryNode = categoryDropdownRef.current;
      const locationNode = locationDropdownRef.current;
      const target = event.target as Node;
      if (categoryNode && !categoryNode.contains(target)) {
        setShowCategoryDropdown(false);
      }
      if (locationNode && !locationNode.contains(target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const nextAds = ads.filter(ad => {
      if (isSpecialAgroAnnouncement(ad)) return false;
      if (ad.is_archived) return false;
      const matchCat = selectedCategories.length === 0 || selectedCategories.includes('ყველა') || selectedCategories.includes(ad.category);
      const adLocation = normalizeText(ad.location);
      const matchLoc = selectedLocations.includes('ყველა კახეთი') || selectedLocs.some((loc) => adLocation.includes(loc));
      const query = normalizeText(searchTerm);
      const matchSearch = !query ||
        normalizeText(ad.title || '').includes(query) ||
        normalizeText(ad.description || '').includes(query) ||
        normalizeText(ad.location || '').includes(query);
      return matchCat && matchLoc && matchSearch;
    });

    nextAds.sort((a, b) => {
      if (adsSort === 'newest') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      if (adsSort === 'oldest') return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      if (adsSort === 'price_asc') return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      if (adsSort === 'price_desc') return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      return 0;
    });

    return nextAds;
  }, [ads, adsSort, normalizeText, selectedCategories, selectedLocations, searchTerm]);

  const headerSearchAds = useMemo(
    () => ads.filter((ad) => !ad.is_archived && !isSpecialAgroAnnouncement(ad)),
    [ads]
  );

  const selectCategory = (category: string) => {
    if (category === 'ყველა') {
      setSelectedCategories(['ყველა']);
      setShowAllAnnouncements(false);
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
    setAdsSliderIndex(0);
  };

  const pageSize = 6;

  // Carousel: cards-per-view + scroll sync
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 480) setAdsCardsPerView(2);
      else if (window.innerWidth < 640) setAdsCardsPerView(3);
      else if (window.innerWidth < 1024) setAdsCardsPerView(4);
      else if (window.innerWidth < 1280) setAdsCardsPerView(5);
      else setAdsCardsPerView(6);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const el = adsSliderRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth / adsCardsPerView;
    el.scrollTo({ left: adsSliderIndex * cardWidth, behavior: 'smooth' });
  }, [adsSliderIndex, adsCardsPerView]);
    const handleToggleLocation = (loc: string) => {
      if (loc === 'ყველა კახეთი') {
        setSelectedLocations(['ყველა კახეთი']);
        return;
      }

      setSelectedLocations((prev) => {
        const withoutAll = prev.filter((item) => item !== 'ყველა კახეთი');
        const exists = withoutAll.includes(loc);
        const next = exists ? withoutAll.filter((item) => item !== loc) : [...withoutAll, loc];
        return next.length === 0 ? ['ყველა კახეთი'] : next;
      });
    };
  const maxPage = Math.max(0, Math.ceil(filteredAds.length / pageSize) - 1);
  const safePage = Math.min(announcementsPage, maxPage);
  const visibleAds = showAllAnnouncements
    ? filteredAds
    : filteredAds.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const modalPageSize = 15;
  const modalMaxPage = Math.max(0, Math.ceil(filteredAds.length / modalPageSize) - 1);
  const modalSafePage = Math.min(modalAnnouncementsPage, modalMaxPage);
  const modalVisibleAds = filteredAds.slice(
    modalSafePage * modalPageSize,
    modalSafePage * modalPageSize + modalPageSize
  );


  const allNonCommunityCategories = useMemo(() => {
    const derivedFromAds = Array.from(
      new Set(
        ads
          .filter(ad => !ad.is_archived)
          .filter(ad => !isSpecialAgroAnnouncement(ad))
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

  useEffect(() => {
    const categoryGap = 8;
    const maxRows = 2;
    let isActive = true;

    const updateVisibleCategoryCount = () => {
      if (!isActive) return;
      const container = categoryBarRef.current;
      const containerWidth = Math.floor(container?.clientWidth ?? 0);

      if (!containerWidth) return;

      let nextCount = 0;
      let rowCount = 1;
      let currentRowWidth = 0;

      for (const category of allNonCommunityCategories) {
        const button = categoryMeasureRefs.current.get(category);
        const buttonWidth = Math.ceil(button?.getBoundingClientRect().width ?? 0);

        if (!buttonWidth) continue;

        if (buttonWidth > containerWidth) break;

        const nextRowWidth = currentRowWidth === 0
          ? buttonWidth
          : currentRowWidth + categoryGap + buttonWidth;

        if (nextRowWidth <= containerWidth) {
          currentRowWidth = nextRowWidth;
          nextCount += 1;
          continue;
        }

        rowCount += 1;

        if (rowCount > maxRows) break;

        currentRowWidth = buttonWidth;
        nextCount += 1;
      }

      setVisibleCategoryCount(nextCount);
    };

    const frameId = window.requestAnimationFrame(updateVisibleCategoryCount);
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateVisibleCategoryCount)
      : null;

    if (categoryBarRef.current) {
      resizeObserver?.observe(categoryBarRef.current);
    }

    window.addEventListener('resize', updateVisibleCategoryCount);

    if ('fonts' in document) {
      document.fonts.ready.then(updateVisibleCategoryCount);
    }

    return () => {
      isActive = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateVisibleCategoryCount);
    };
  }, [allNonCommunityCategories]);

  useEffect(() => {
    const updateVisibleCategoryCount = () => {
      const width = window.innerWidth;

      if (width < 480) {
        setVisibleCategoryCount(3);
        return;
      }

      if (width < 768) {
        setVisibleCategoryCount(4);
        return;
      }

      if (width < 1280) {
        setVisibleCategoryCount(5);
        return;
      }

      setVisibleCategoryCount(6);
    };

    updateVisibleCategoryCount();
    window.addEventListener('resize', updateVisibleCategoryCount);

    return () => window.removeEventListener('resize', updateVisibleCategoryCount);
  }, []);

  const visibleCategories = useMemo(
    () => allNonCommunityCategories.slice(0, visibleCategoryCount),
    [allNonCommunityCategories, visibleCategoryCount]
  );

  const flatLocations = useMemo(() => {
    const list = new Set<string>();
    for (const municipality of LOCATIONS) {
      if (typeof municipality === 'string') {
        list.add(municipality);
        continue;
      }
      for (const city of municipality.cities ?? []) {
        if (typeof city === 'string') {
          list.add(city);
          continue;
        }
        if (city.name) list.add(city.name);
        if (Array.isArray(city.villages)) {
          city.villages.forEach((village) => list.add(village));
        }
      }
    }
    return ['ყველა კახეთი', ...Array.from(list)];
  }, []);

  useEffect(() => {
    if (!showAllFilters) return;
    setModalAnnouncementsPage(0);
  }, [showAllFilters, selectedCategories, selectedLocations]);

  const seasonal = getSeasonalContent();


  return (
    <main className="has-fixed-mobile-nav min-h-screen relative flex flex-col bg-[#050510] overflow-x-hidden text-left selection:bg-amber-500 selection:text-white text-white w-full max-w-full pt-0">
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

      <Navbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredAds={headerSearchAds}
        serviceProviders={initialCommunity.masters}
        serviceRequests={initialCommunity.serviceRequests}
      />
      <FavoritesDropdown />


      {/* Informational grid section, now outside header for independent styling */}
      <section className="layout-shell relative z-10 w-full max-w-full xl:max-w-[1800px] px-4 sm:px-6 md:px-10 mx-auto mt-5 sm:mt-3 overflow-hidden">
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:gap-8 items-start text-white bg-black/70 backdrop-blur-2xl rounded-[30px] border border-white/10 p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-full overflow-hidden">
          {/* --- ცენტრალური სვეტი --- */}

          <div className="flex flex-col items-center text-center gap-2 lg:gap-6 animate-in fade-in duration-1000 w-full min-w-0">
            <ServiceProvidersSection
              providers={initialCommunity.masters}
              count={initialCommunityCounts.masters}
              serviceRequests={initialCommunity.serviceRequests}
              serviceRequestsCount={initialCommunityCounts.serviceRequests}
            />

            {/* ── Announcements Carousel (cards only) ── */}
            <div className="w-full mt-8 mobile-announcements-spacing">
              {filteredAds.length > 0 ? (
                <>
                  {/* Search + arrows row — shown only when carousel is active */}
                  <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-stretch">
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5">
                      <span className="text-base text-amber-300/70">🔎</span>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setAdsSliderIndex(0);
                        }}
                        placeholder="მოძებნე განცხადება..."
                        className="w-full bg-transparent text-xs font-bold uppercase tracking-[0.15em] text-amber-100 placeholder:text-white/30 outline-none"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setAdsSliderIndex(0);
                          }}
                          className="text-xs text-white/40 transition hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div ref={categoryDropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryDropdown((prev) => !prev);
                          setShowLocationDropdown(false);
                        }}
                        className="h-full w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5 text-left text-xs font-black uppercase tracking-[0.15em] text-amber-200 sm:w-[180px] whitespace-nowrap"
                      >
                        {selectedCategories.includes('ყველა')
                          ? 'ყველა კატეგ.'
                          : selectedCategories.length === 1
                            ? selectedCategories[0]
                            : `${selectedCategories.length} კატეგ.`}
                      </button>
                      {showCategoryDropdown && (
                        <div className="absolute z-20 top-full mt-2 w-full min-w-56 rounded-[22px] border border-white/10 bg-[#0b0b15] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                          <div className="max-h-52 space-y-1 overflow-y-auto">
                            {['ყველა', ...allNonCommunityCategories].map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => {
                                  setSelectedCategories(category === 'ყველა' ? ['ყველა'] : [category]);
                                  setShowCategoryDropdown(false);
                                  setShowAllAnnouncements(false);
                                  setAnnouncementsPage(0);
                                  setAdsSliderIndex(0);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.15em] transition ${
                                  selectedCategories.includes(category)
                                    ? 'border-amber-300/40 bg-amber-500/20 text-amber-200'
                                    : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div ref={locationDropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLocationDropdown((prev) => !prev);
                          setShowCategoryDropdown(false);
                        }}
                        className="h-full w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5 text-left text-xs font-black uppercase tracking-[0.15em] text-cyan-200 sm:w-[180px] whitespace-nowrap"
                      >
                        {selectedLocations.includes('ყველა კახეთი')
                          ? 'ყველა კახეთი'
                          : selectedLocations.length === 1
                            ? selectedLocations[0]
                            : `${selectedLocations.length} ლოკაცია`}
                      </button>
                      {showLocationDropdown && (
                        <div className="absolute right-0 z-20 top-full mt-2 w-full min-w-56 rounded-[22px] border border-white/10 bg-[#0b0b15] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                          <div className="max-h-52 space-y-1 overflow-y-auto">
                            {flatLocations.map((loc) => (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => {
                                  setSelectedLocations([loc]);
                                  setShowLocationDropdown(false);
                                  setShowAllAnnouncements(false);
                                  setAnnouncementsPage(0);
                                  setAdsSliderIndex(0);
                                }}
                                className={`w-full rounded-xl border px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.15em] transition ${
                                  selectedLocations.includes(loc)
                                    ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-200'
                                    : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <select
                      value={adsSort}
                      onChange={(e) => {
                        setAdsSort(e.target.value as AdsSortOption);
                        setAdsSliderIndex(0);
                      }}
                      className="rounded-2xl border border-white/10 bg-[#0b0b15] px-3 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-white/70 outline-none cursor-pointer"
                    >
                      <option value="newest">ახალი → ძველი</option>
                      <option value="oldest">ძველი → ახალი</option>
                      <option value="price_asc">ფასი ↑</option>
                      <option value="price_desc">ფასი ↓</option>
                    </select>

                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-white/30">{filteredAds.length}</span>
                      <button
                        type="button"
                        onClick={() => setAdsSliderIndex(i => Math.max(0, i - adsCardsPerView))}
                        disabled={adsSliderIndex === 0}
                        aria-label="წინა"
                        className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-amber-500/25 hover:border-amber-400/50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdsSliderIndex(i => Math.min(i + adsCardsPerView, Math.max(0, filteredAds.length - adsCardsPerView)))}
                        disabled={adsSliderIndex >= Math.max(0, filteredAds.length - adsCardsPerView)}
                        aria-label="შემდეგი"
                        className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-amber-500/25 hover:border-amber-400/50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* If few cards, use a simple grid; otherwise carousel */}
                  {filteredAds.length <= adsCardsPerView ? (
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${adsCardsPerView}, 1fr)` }}>
                      {filteredAds.map((ad) => (
                        <AnnouncementCard key={ad.id} announcement={ad} compact />
                      ))}
                    </div>
                  ) : (
                    // Scrollable track
                    <div
                      ref={adsSliderRef}
                      className="flex overflow-x-hidden"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      onTouchStart={(e) => { adsTouchStartX.current = e.touches[0].clientX; }}
                      onTouchEnd={(e) => {
                        if (adsTouchStartX.current === null) return;
                        const diff = adsTouchStartX.current - e.changedTouches[0].clientX;
                        const maxIdx = Math.max(0, filteredAds.length - adsCardsPerView);
                        if (diff > 40) setAdsSliderIndex(i => Math.min(i + adsCardsPerView, maxIdx));
                        else if (diff < -40) setAdsSliderIndex(i => Math.max(0, i - adsCardsPerView));
                        adsTouchStartX.current = null;
                      }}
                    >
                      {filteredAds.map((ad) => (
                        <div
                          key={ad.id}
                          style={{ minWidth: `calc(100% / ${adsCardsPerView})`, maxWidth: `calc(100% / ${adsCardsPerView})`, flexShrink: 0 }}
                          className="px-1"
                        >
                          <AnnouncementCard announcement={ad} compact />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-col items-stretch justify-end gap-2 sm:flex-row">
                    <Link
                      href="/add"
                      className="inline-flex items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-500/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/25"
                    >
                      განცხადების დამატება
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-white/60 text-sm">
                  ამ კატეგორიაში განცხადებები არ მოიძებნა
                </div>
              )}


            </div>

            {/* ── ახლად გამოქვეყნებული განცხადებები ── */}
            <div className="w-full">
              <RecentAnnouncementsSection ads={ads} />
            </div>

            <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 items-start">
              <div className="w-full h-[230px] overflow-hidden bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-3 ring-1 ring-amber-400/20 relative">
                <AdminSideFrame
                  post={getPostByPos('left_top')}
                  position="left_top"
                  isAdmin={isAdmin}
                  onRefresh={fetchAdminPosts}
                />
              </div>
              <div className="w-full bg-gradient-to-br from-amber-900/30 via-black/40 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/20 shadow-[0_0_18px_2px_rgba(255,191,0,0.08)] p-3 ring-1 ring-amber-400/10 relative">
                <GuideWidget onMapSearch={handleMapSearch} />
              </div>
              <div className="w-full bg-gradient-to-br from-amber-900/30 via-black/40 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/20 shadow-[0_0_18px_2px_rgba(255,191,0,0.08)] p-3 ring-1 ring-amber-400/10 relative">
                <HeritageWidget />
              </div>
              <div className="w-full h-[230px] overflow-hidden bg-gradient-to-br from-amber-900/40 via-black/50 to-amber-700/20 backdrop-blur-sm rounded-[24px] border border-amber-500/30 shadow-[0_0_20px_4px_rgba(255,191,0,0.1)] p-3 ring-1 ring-amber-400/20 relative">
                <AdminSideFrame
                  post={getPostByPos('right_top')}
                  position="right_top"
                  isAdmin={isAdmin}
                  onRefresh={fetchAdminPosts}
                />
              </div>
            </div>

            <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div id="agro-birzha" className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/30 shadow-xl h-[300px]">
                <div className="flex justify-between w-full items-center mb-4">
                  <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">🍇 აგრო-ბირჟა</h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => shareHomeSectionToFacebook('#agro-birzha')}
                      className="rounded-xl border border-blue-300/30 bg-blue-500/10 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-blue-100 hover:bg-blue-500/20 transition"
                    >
                      FB
                    </button>
                    <button
                      type="button"
                      onClick={() => shareHomeSection('აგრო-ბირჟა', '#agro-birzha')}
                      className="rounded-xl border border-white/15 bg-white/5 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/75 hover:text-white transition"
                    >
                      გაზიარება
                    </button>
                    <button
                      type="button"
                      onClick={() => openAgroSubmission('grape')}
                      className="rounded-xl border border-purple-300/30 bg-purple-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-purple-100 hover:bg-purple-500/20 transition"
                    >
                      დამატება
                    </button>
                  </div>
                </div>
                <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს</p>
                <div className="w-full flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {agroData.filter(i => i.category === 'grape').map(item => (
                    <button id={`agro-item-${item.id}`} key={item.id} onClick={() => setSelectedAgro(item)} className="w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5">
                      <span className="text-xs font-black uppercase text-purple-300">{item.name}</span>
                      <span className="text-sm font-black italic">{getAgroDisplayPrice(item)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-auto pt-3 text-[11px] text-white/70 font-black text-center tracking-wide">თქვენი განაცხადი გაიგზავნება მოდერაციაზე</p>
              </div>

              <div
                id="lost-found"
                className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-amber-500/30 shadow-xl h-[300px]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%)]" />
                <div className="relative z-10 flex h-full w-full flex-col">
                  <div className="mb-4 flex w-full items-center justify-between gap-2">
                    <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-[0.34em] text-left">🔎 დაკარგული/ნაპოვნი</h4>
                    <Link
                      href="/community/lost-found/submit"
                      className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-100 hover:bg-amber-500/20 transition"
                    >
                      დამატება
                    </Link>
                  </div>
                  <p className="text-left text-sm font-black leading-snug text-white/90">
                    დაკარგული ნივთების და ნაპოვნი ინფორმაციის რეესტრი
                  </p>
                  <p className="mt-3 text-left text-xs leading-relaxed text-white/55">
                    განათავსეთ ან მოძებნეთ განცხადება ერთ სივრცეში.
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="rounded-2xl border border-amber-400/20 bg-black/40 px-3 py-2 text-[11px] font-black text-amber-100">
                      {initialCommunityCounts.lostFound ?? 0} აქტიური
                    </span>
                    <Link href="/community/lost-found" className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">
                      ნახვა →
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => shareHomeSectionToFacebook('/community/lost-found')}
                      className="rounded-xl border border-blue-300/30 bg-blue-500/10 px-3 py-2 text-[10px] font-black uppercase text-blue-100"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => shareHomeSection('დაკარგული/ნაპოვნი', '/community/lost-found')}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black uppercase text-white/75"
                    >
                      გაზიარება
                    </button>
                  </div>
                </div>
              </div>

              <div id="grain-market" className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-yellow-500/30 shadow-xl h-[300px]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent opacity-30" />
                <div className="flex justify-between w-full items-center mb-4">
                  <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em]">🌾 მარცვლეული</h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => shareHomeSectionToFacebook('#grain-market')}
                      className="rounded-xl border border-blue-300/30 bg-blue-500/10 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-blue-100 hover:bg-blue-500/20 transition"
                    >
                      FB
                    </button>
                    <button
                      type="button"
                      onClick={() => shareHomeSection('მარცვლეული', '#grain-market')}
                      className="rounded-xl border border-white/15 bg-white/5 px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/75 hover:text-white transition"
                    >
                      გაზიარება
                    </button>
                    <button
                      type="button"
                      onClick={() => openAgroSubmission('grain')}
                      className="rounded-xl border border-yellow-300/30 bg-yellow-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-yellow-100 hover:bg-yellow-500/20 transition"
                    >
                      დამატება
                    </button>
                  </div>
                </div>
                <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს</p>
                <div className="w-full flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {agroData.filter(i => i.category === 'grain').map(item => (
                    <button id={`agro-item-${item.id}`} key={item.id} onClick={() => setSelectedAgro(item)} className="w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5">
                      <span className="text-xs font-black uppercase text-yellow-500">{item.name}</span>
                      <span className="text-sm font-black italic">{getAgroDisplayPrice(item)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-auto pt-3 text-[11px] text-yellow-200 font-black text-center tracking-wide">თქვენი განაცხადი გაიგზავნება მოდერაციაზე</p>
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

      {agroSubmissionType && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-xl">
          <form
            onSubmit={submitAgroSubmission}
            className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b0b15] p-5 text-left text-white shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">მოდერაციაზე გაგზავნა</p>
                <h3 className="mt-1 text-lg font-black uppercase italic">
                  {agroSubmissionType === 'grape' ? 'აგრო-ბირჟა' : 'მარცვლეული'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAgroSubmission}
                className="text-xs font-black uppercase text-white/45 hover:text-white"
              >
                დახურვა ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={agroSubmissionForm.product}
                onChange={(event) => setAgroSubmissionForm((form) => ({ ...form, product: event.target.value }))}
                placeholder="პროდუქტი"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={agroSubmissionForm.price}
                  onChange={(event) => setAgroSubmissionForm((form) => ({ ...form, price: event.target.value }))}
                  placeholder="ფასი GEL"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                />
                <input
                  value={agroSubmissionForm.location}
                  onChange={(event) => setAgroSubmissionForm((form) => ({ ...form, location: event.target.value }))}
                  placeholder="ლოკაცია"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>
              <input
                value={agroSubmissionForm.phone}
                onChange={(event) => setAgroSubmissionForm((form) => ({ ...form, phone: event.target.value }))}
                placeholder="ტელეფონი"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
              <textarea
                value={agroSubmissionForm.note}
                onChange={(event) => setAgroSubmissionForm((form) => ({ ...form, note: event.target.value }))}
                placeholder="დამატებითი ინფორმაცია"
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={agroSubmissionLoading}
                className="w-full rounded-2xl bg-amber-600 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {agroSubmissionLoading ? 'იგზავნება...' : 'გაგზავნა მოდერაციაზე'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {showAllFilters && (
        <div className="fixed inset-0 z-[120]" onClick={() => setShowAllFilters(false)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-[20px] animate-in fade-in duration-300" />
          <div
            className="relative max-w-5xl mx-auto mt-24 bg-[#0b0b15]/90 border border-white/10 rounded-[28px] p-6 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">ყველა განცხადება</h3>
                <p className="text-white/50 text-sm mt-1">კატეგორიები და ლოკაციები</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllFilters(false)}
                className="text-white/40 hover:text-white transition text-sm font-black uppercase"
              >
                დახურვა ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                  ძიება სათაურით
                </div>
                <div className="flex items-center gap-3 bg-[#0b0b15] border border-white/10 rounded-2xl px-4 py-3">
                  <span className="text-lg text-amber-300/80">🔎</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="მოძებნე განცხადება..."
                    className="w-full bg-transparent text-sm font-black uppercase tracking-[0.2em] text-amber-100 placeholder:text-white/30 outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-amber-200 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                  კატეგორიები
                </div>
                <div ref={categoryDropdownRef} className="relative">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown((prev) => !prev)}
                      className="flex-1 bg-[#0b0b15] border border-white/10 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-amber-200 text-left"
                    >
                      {selectedCategories.includes('ყველა')
                        ? 'ყველა'
                        : selectedCategories.length === 1
                          ? selectedCategories[0]
                          : `${selectedCategories.length} კატეგორია`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown((prev) => !prev)}
                      className="sm:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/30 transition"
                    >
                      {showCategoryDropdown ? '−' : '+'}
                    </button>
                  </div>
                  {showCategoryDropdown && (
                    <div className="absolute z-10 mt-3 w-full bg-[#0b0b15] border border-white/10 rounded-[26px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {['ყველა', ...allNonCommunityCategories].map((category) => {
                          const isActive = selectedCategories.includes(category);
                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                if (category === 'ყველა') {
                                  setSelectedCategories(['ყველა']);
                                } else {
                                  setSelectedCategories((prev) => {
                                    const withoutAll = prev.filter((c) => c !== 'ყველა');
                                    const exists = withoutAll.includes(category);
                                    const next = exists ? withoutAll.filter((c) => c !== category) : [...withoutAll, category];
                                    return next.length === 0 ? ['ყველა'] : next;
                                  });
                                }
                                setShowAllAnnouncements(false);
                                setAnnouncementsPage(0);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition ${
                                isActive
                                  ? 'bg-amber-500/20 text-amber-200 border border-amber-300/50'
                                  : 'text-white/80 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              {category}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                  ქალაქები და სოფლები
                </div>
                <div ref={locationDropdownRef} className="relative">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown((prev) => !prev)}
                      className="flex-1 bg-[#0b0b15] border border-white/10 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-200 text-left"
                    >
                      {selectedLocations.includes('ყველა კახეთი')
                        ? 'ყველა კახეთი'
                        : selectedLocations.length === 1
                          ? selectedLocations[0]
                          : `${selectedLocations.length} ლოკაცია`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown((prev) => !prev)}
                      className="sm:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/30 transition"
                    >
                      {showLocationDropdown ? '−' : '+'}
                    </button>
                  </div>
                  {showLocationDropdown && (
                    <div className="absolute z-10 mt-3 w-full bg-[#0b0b15] border border-white/10 rounded-[26px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {flatLocations.map((loc) => {
                          const isActive = selectedLocations.includes(loc);
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                if (loc === 'ყველა კახეთი') {
                                  setSelectedLocations(['ყველა კახეთი']);
                                } else {
                                  setSelectedLocations((prev) => {
                                    const withoutAll = prev.filter((item) => item !== 'ყველა კახეთი');
                                    const exists = withoutAll.includes(loc);
                                    const next = exists ? withoutAll.filter((item) => item !== loc) : [...withoutAll, loc];
                                    return next.length === 0 ? ['ყველა კახეთი'] : next;
                                  });
                                }
                                setAnnouncementsPage(0);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition ${
                                isActive
                                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-300/40'
                                  : 'text-white/80 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              {loc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                  განცხადებები
                </div>
                {modalVisibleAds.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {modalVisibleAds.map((ad) => (
                      <AnnouncementCard key={ad.id} announcement={ad} />
                    ))}
                  </div>
                ) : (
                  <div className="text-white/50 text-sm">განცხადებები ვერ მოიძებნა</div>
                )}

                {filteredAds.length > modalPageSize && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setModalAnnouncementsPage((p) => (p >= modalMaxPage ? 0 : p + 1))}
                      className="px-4 py-2 rounded-full border border-amber-300/50 bg-amber-500/20 text-amber-200 font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-500/30 transition"
                    >
                      შემდეგი
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
