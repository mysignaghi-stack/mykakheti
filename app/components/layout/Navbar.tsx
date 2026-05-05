'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

type SiteSettingRow = { key: string; value: string | null };

const DEFAULT_BANNER_TEXT = 'საიტი მუშაობს სატესტო რეჟიმში';
const DEFAULT_BANNER_MODE = 'blink';
const DEFAULT_BANNER_COLOR = '#ef4444';
const DEFAULT_BANNER_SIZE = 'md';
const DEFAULT_BANNER_SPEED = 18;
const DEFAULT_BANNER_ENABLED = true;
const DEFAULT_BANNER_DIRECTION = 'left';
const DEFAULT_BANNER_BG = '';
const DEFAULT_BANNER_BG_OPACITY = 0.2;

export default function Navbar() {
  const [bannerText, setBannerText] = useState(DEFAULT_BANNER_TEXT);
  const [bannerMode, setBannerMode] = useState(DEFAULT_BANNER_MODE);
  const [bannerColor, setBannerColor] = useState(DEFAULT_BANNER_COLOR);
  const [bannerSize, setBannerSize] = useState(DEFAULT_BANNER_SIZE);
  const [bannerSpeed, setBannerSpeed] = useState(DEFAULT_BANNER_SPEED);
  const [bannerEnabled, setBannerEnabled] = useState(DEFAULT_BANNER_ENABLED);
  const [bannerDirection, setBannerDirection] = useState(DEFAULT_BANNER_DIRECTION);
  const [bannerBg, setBannerBg] = useState(DEFAULT_BANNER_BG);
  const [bannerBgOpacity, setBannerBgOpacity] = useState(DEFAULT_BANNER_BG_OPACITY);

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
      } catch (error) {
        console.log('Error fetching header banner settings:', error);
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

  const bannerStyle = { color: bannerColor };
  const showBanner = Boolean(bannerText) && bannerEnabled;

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
    <nav className="relative z-[100] px-4 sm:px-6 md:px-10 py-5 sm:py-6 flex items-center bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
      <Link href="/" className="text-2xl md:text-3xl font-black italic tracking-tighter shrink-0">
        mykakheti<span className="text-amber-500">.ge</span>
      </Link>
      
      {/* Test Mode Message */}
      <div className="flex-1 flex justify-center items-center px-4">
        <div className="text-center">
          {showBanner && bannerMode === 'marquee' ? (
            <div
              className="w-full max-w-[520px] marquee-outer rounded-full px-3 py-1"
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
            showBanner && (
              <div
                className={`inline-flex items-center justify-center rounded-full px-3 py-1 font-black uppercase tracking-widest ${bannerSizeClass} ${bannerMode === 'blink' ? 'animate-pulse' : ''}`}
                style={{ ...bannerStyle, ...bannerBgStyle }}
              >
                {bannerText}
              </div>
            )
          )}
        </div>
      </div>
      
      <div className="flex gap-2 md:gap-4 items-center shrink-0 relative">
        <Link href="/add" className="bg-amber-600 text-white px-5 sm:px-10 py-3 rounded-xl font-black uppercase text-[10px] md:text-[11px] italic shadow-2xl hover:scale-105 transition-all">
          განცხადება +
        </Link>
      </div>
    </nav>
  );
}