'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabase';
import AuthForm from '@/app/components/auth/AuthForm';
import type { Ad } from '@/app/lib/types';

type SiteSettingRow = { key: string; value: string | null };

const DEFAULT_BANNER_TEXT = '';
const DEFAULT_BANNER_MODE = 'blink';
const DEFAULT_BANNER_COLOR = '#ef4444';
const DEFAULT_BANNER_SIZE = 'md';
const DEFAULT_BANNER_SPEED = 18;
const DEFAULT_BANNER_ENABLED = true;
const DEFAULT_BANNER_DIRECTION = 'left';
const DEFAULT_BANNER_BG = '';
const DEFAULT_BANNER_BG_OPACITY = 0.2;

const getUserDisplayName = (user: User | null) => {
  if (!user) return '';
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name || metadata.name;
  const firstName = metadata.first_name;
  const lastName = metadata.last_name;

  if (typeof fullName === 'string' && fullName.trim()) return fullName;
  if (typeof firstName === 'string' || typeof lastName === 'string') {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }
  return user.email ?? 'პროფილი';
};

export default function Navbar({
  searchTerm,
  setSearchTerm,
  filteredAds,
}: {
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  filteredAds?: Ad[];
}) {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBannerReady, setIsBannerReady] = useState(false);
  const [bannerText, setBannerText] = useState(DEFAULT_BANNER_TEXT);
  const [bannerMode, setBannerMode] = useState(DEFAULT_BANNER_MODE);
  const [bannerColor, setBannerColor] = useState(DEFAULT_BANNER_COLOR);
  const [bannerSize, setBannerSize] = useState(DEFAULT_BANNER_SIZE);
  const [bannerSpeed, setBannerSpeed] = useState(DEFAULT_BANNER_SPEED);
  const [bannerEnabled, setBannerEnabled] = useState(DEFAULT_BANNER_ENABLED);
  const [bannerDirection, setBannerDirection] = useState(DEFAULT_BANNER_DIRECTION);
  const [bannerBg, setBannerBg] = useState(DEFAULT_BANNER_BG);
  const [bannerBgOpacity, setBannerBgOpacity] = useState(DEFAULT_BANNER_BG_OPACITY);
  const [authUser, setAuthUser] = useState<User | null>(null);

  const bannerSizeClass = useMemo(() => {
    switch (bannerSize) {
      case 'sm':
        return 'text-xs sm:text-sm';
      case 'lg':
        return 'text-base sm:text-lg';
      case 'xl':
        return 'text-lg sm:text-xl';
      default:
        return 'text-sm sm:text-base';
    }
  }, [bannerSize]);

  useEffect(() => {
    setIsMounted(true);
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key,value')
          .in('key', [
            'header_text',
            'header_mode',
            'header_color',
            'header_size',
            'header_speed',
            'header_enabled',
            'header_direction',
            'header_bg',
            'header_bg_opacity',
          ]);

        if (error) throw error;

        const settings = (data as SiteSettingRow[] | null) ?? [];
        const text = settings.find((item) => item.key === 'header_text')?.value;
        const mode = settings.find((item) => item.key === 'header_mode')?.value;
        const color = settings.find((item) => item.key === 'header_color')?.value;
        const size = settings.find((item) => item.key === 'header_size')?.value;
        const speed = settings.find((item) => item.key === 'header_speed')?.value;
        const enabled = settings.find((item) => item.key === 'header_enabled')?.value;
        const direction = settings.find((item) => item.key === 'header_direction')?.value;
        const bg = settings.find((item) => item.key === 'header_bg')?.value;
        const bgOpacity = settings.find((item) => item.key === 'header_bg_opacity')?.value;

        setBannerText((text ?? DEFAULT_BANNER_TEXT).trim());
        setBannerMode((mode ?? DEFAULT_BANNER_MODE).trim());
        setBannerColor((color ?? DEFAULT_BANNER_COLOR).trim());
        setBannerSize((size ?? DEFAULT_BANNER_SIZE).trim());
        const parsedSpeed = Number.parseFloat((speed ?? '').toString());
        setBannerSpeed(Number.isFinite(parsedSpeed) ? parsedSpeed : DEFAULT_BANNER_SPEED);
        const enabledValue = (enabled ?? '').toString().trim();
        setBannerEnabled(enabledValue === '' ? DEFAULT_BANNER_ENABLED : enabledValue === 'true');
        setBannerDirection((direction ?? DEFAULT_BANNER_DIRECTION).trim());
        setBannerBg((bg ?? DEFAULT_BANNER_BG).trim());
        const parsedOpacity = Number.parseFloat((bgOpacity ?? '').toString());
        setBannerBgOpacity(Number.isFinite(parsedOpacity) ? parsedOpacity : DEFAULT_BANNER_BG_OPACITY);
        setIsBannerReady(true);
      } catch (error) {
        console.log('Error fetching header banner settings:', error);
        setIsBannerReady(true);
      }
    };

    fetchBanner();

    const channel = supabase
      .channel('site_settings_header_banner')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, () => {
        fetchBanner();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthUser(data.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        setShowLogin(false);
        setShowRegister(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const searchRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const showSearch = searchTerm !== undefined && setSearchTerm !== undefined;
  const showResults = showSearch && Boolean(searchTerm) && (searchFocused || Boolean(searchTerm));

  const bannerStyle = { color: bannerColor };
  const showBanner = isBannerReady && Boolean(bannerText) && bannerEnabled;

  const hexToRgba = (hex: string, opacity: number) => {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 3 && normalized.length !== 6) return '';
    const full = normalized.length === 3
      ? normalized.split('').map((ch) => ch + ch).join('')
      : normalized;
    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return '';
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const bannerBgStyle = bannerBg
    ? {
        background: hexToRgba(bannerBg, bannerBgOpacity) || bannerBg,
      }
    : undefined;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-3 sm:px-4 md:px-8 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
      <div className="relative flex flex-col items-center sm:items-start shrink-0 w-full sm:w-auto">
        <Link href="/" className="text-xl md:text-2xl font-black italic tracking-tighter">
          mykakheti<span className="text-amber-500">.ge</span>
        </Link>
        {!authUser && (
          <button
            type="button"
            onClick={() => {
              setShowRegister((prev) => !prev);
              setShowLogin(false);
            }}
            className="mt-1 inline-flex items-center justify-center rounded-full border border-amber-300/40 bg-white/5 px-2.5 py-0.5 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-amber-300 shadow-[0_6px_16px_rgba(0,0,0,0.2)] backdrop-blur hover:border-amber-200/60 hover:text-amber-200 transition"
          >
            რეგისტრაცია
          </button>
        )}
        {isMounted && showRegister
          ? createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" role="dialog" aria-modal="true">
                <div
                  className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                  onClick={() => setShowRegister(false)}
                  role="presentation"
                />
                <div className="relative w-full max-w-sm">
                  <AuthForm initialMode="signup" compact onClose={() => setShowRegister(false)} />
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
      
      {/* Center: Search + Banner */}
      <div className="w-full sm:flex-1 flex flex-col justify-center items-center px-2 sm:px-6 gap-1 relative" ref={searchRef}>
        {/* Search bar */}
        {showSearch && (
          <div className="w-full max-w-xl relative">
            <div className={`flex items-center bg-white/[0.06] border rounded-2xl px-4 py-2 gap-2 transition-colors duration-200 ${
              searchFocused ? 'border-amber-400/40 bg-white/[0.09]' : 'border-white/10'
            }`}>
              <span className="text-amber-400/60 shrink-0 text-sm">🔍</span>
              <input
                type="text"
                placeholder="რას ეძებთ კახეთში?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                className="w-full bg-transparent text-[11px] sm:text-xs font-black uppercase italic tracking-[0.12em] text-white placeholder:text-white/20 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="shrink-0 text-white/40 hover:text-white text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Results dropdown */}
            {showResults && filteredAds && (
              <div className="absolute top-full left-0 right-0 mt-2 z-[9999] bg-[#0a0a1f]/97 backdrop-blur-3xl border border-white/10 rounded-[22px] shadow-[0_20px_70px_rgba(0,0,0,0.9)] max-h-[380px] overflow-y-auto animate-in zoom-in-95 fade-in duration-150">
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                      ნაპოვნია {filteredAds.length} შედეგი
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-[9px] font-black uppercase text-amber-500 hover:text-white transition-colors"
                    >
                      ✕ გასუფთავება
                    </button>
                  </div>
                  {filteredAds.length > 0 ? (
                    filteredAds.slice(0, 8).map((ad) => (
                      <Link
                        key={ad.id}
                        href={`/announcements/${ad.id}`}
                        onClick={() => setSearchTerm('')}
                        className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all group/item"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          {ad.image_url ? (
                            <Image
                              src={ad.image_url}
                              alt=""
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">📷</div>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-[11px] font-black uppercase italic text-white group-hover/item:text-amber-400 transition-colors line-clamp-1">
                            {ad.title}
                          </h4>
                          <div className="flex gap-2 items-center mt-0.5">
                            {ad.price && ad.price !== '0' && (
                              <span className="text-amber-500 font-black text-xs">
                                {ad.price} {ad.currency === 'USD' ? '$' : '₾'}
                              </span>
                            )}
                            {ad.location && (
                              <span className="text-[9px] font-black text-white/25 uppercase tracking-widest truncate">
                                {ad.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-white/20 group-hover/item:text-amber-400 group-hover/item:translate-x-0.5 transition-all text-sm shrink-0">➔</span>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center text-white/30 text-xs font-black uppercase italic tracking-widest">
                      შედეგი ვერ მოიძებნა
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Banner (shown below search if both exist) */}
        {showBanner && (
          <div className="text-center">
            {bannerMode === 'marquee' ? (
              <div
                className="w-full max-w-full sm:max-w-[480px] marquee-outer rounded-full px-3 py-0.5"
                style={bannerBgStyle}
              >
                <span
                  className={`marquee-inner font-black uppercase tracking-widest ${bannerSizeClass}`}
                  style={{
                    ...bannerStyle,
                    animationDuration: `${bannerSpeed}s`,
                    animationDirection: bannerDirection === 'right' ? 'reverse' : 'normal',
                  }}
                >
                  {bannerText}
                </span>
              </div>
            ) : (
              <div
                className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 font-black uppercase tracking-widest ${bannerSizeClass} ${
                  bannerMode === 'blink' ? 'animate-pulse' : ''
                }`}
                style={{ ...bannerStyle, ...bannerBgStyle }}
              >
                {bannerText}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="relative flex flex-col items-center sm:items-start gap-1 shrink-0 w-full sm:w-auto">
        <Link href="/add" className="bg-amber-600 text-white px-4 sm:px-6 py-2 rounded-xl font-black uppercase text-[10px] md:text-[11px] italic shadow-2xl hover:scale-105 transition-all">
          განცხადება +
        </Link>
        {authUser ? (
          <Link
            href="/profile"
            className="mx-auto max-w-[170px] truncate rounded-full border border-amber-300/40 bg-white/5 px-2.5 py-0.5 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-amber-300 shadow-[0_6px_16px_rgba(0,0,0,0.2)] backdrop-blur transition hover:border-amber-200/60 hover:text-amber-200"
            title={getUserDisplayName(authUser)}
          >
            {getUserDisplayName(authUser)}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowLogin((prev) => !prev);
              setShowRegister(false);
            }}
            className="mx-auto inline-flex items-center justify-center rounded-full border border-amber-300/40 bg-white/5 px-2.5 py-0.5 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-amber-300 shadow-[0_6px_16px_rgba(0,0,0,0.2)] backdrop-blur hover:border-amber-200/60 hover:text-amber-200 transition"
          >
            ავტორიზაცია
          </button>
        )}
        {isMounted && showLogin
          ? createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" role="dialog" aria-modal="true">
                <div
                  className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                  onClick={() => setShowLogin(false)}
                  role="presentation"
                />
                <div className="relative w-full max-w-sm">
                  <AuthForm initialMode="login" compact onClose={() => setShowLogin(false)} />
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    </nav>
  );
}
