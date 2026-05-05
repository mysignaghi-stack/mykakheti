"use client";
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Database } from '@/types/supabase';
import { supabase } from '../../lib/supabase';
import ClientButtons from './ClientButtons';
import { CommunitySideWidget } from '../../components/community/CommunityWidgets';

type Announcement = Database['public']['Tables']['announcements']['Row'];

export default function AnnouncementDetailsClient({ initialAd }: { initialAd: Announcement | null }) {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Announcement | null>(initialAd);
  const getImages = (item: Announcement | null) => {
    if (!item) return [] as string[];
    const allImages = Array.isArray(item.all_images) ? item.all_images.filter(Boolean) : [];
    const primary = item.image_url ?? null;
    const combined = primary ? [primary, ...allImages] : allImages;
    return Array.from(new Set(combined));
  };
  const [activeImg, setActiveImg] = useState<string | null>(getImages(initialAd)[0] ?? null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Share URL-ის დაყენება კლიენტის მხარეს
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!initialAd) {
      const fetchAd = async () => {
        const { data } = await (supabase as any).from('announcements').select('*').eq('id', id).single();
        if (data) {
          setAd(data);
          setActiveImg(getImages(data)[0] ?? null);
        }
      };
      fetchAd();
    }
  }, [id, initialAd]);

  // Click outside the content area should navigate back to previous page
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (zoomOpen) return; // don't navigate while zoom modal open
      const node = contentRef.current;
      if (!node) return;
      if (node.contains(e.target as Node)) return; // clicked inside
      // clicked outside -> attempt native history.back() so browser restores previous scroll/state
      try {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          router.push('/announcements');
        }
      } catch {
        router.push('/announcements');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [router, zoomOpen]);

  if (!ad) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white font-black italic uppercase tracking-widest">
      იტვირთება...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050510] text-white font-sans pb-24 relative overflow-x-hidden">
      {/* 🏔️ Background FX */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f] via-[#050510] to-[#050510]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* 🧭 Header */}
      <nav className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 flex justify-between items-center bg-slate-950/60 backdrop-blur-3xl sticky top-0 z-[100]">
        <Link href="/" className="text-xl md:text-2xl font-black italic tracking-tighter">
          mykakheti<span className="text-amber-500">.ge</span>
        </Link>

        <Link href="/" className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase italic hover:bg-white hover:text-black transition-all">
          ← უკან
        </Link>
      </nav>

      <div ref={contentRef} className="max-w-7xl mx-auto mt-6 md:mt-10 px-3 md:px-6 relative z-10">
        <div className="grid grid-cols-1 gap-10 items-start">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-1 md:gap-2">
              {/* 📸 Gallery Section */}
              <div className="space-y-6">
                <div className="aspect-[3/2] rounded-[12px] md:rounded-[16px] overflow-hidden border border-white/10 shadow-2xl bg-black/40 group relative max-h-[420px] md:max-h-[400px]">
                  {activeImg ? (
                    <Image
                      src={activeImg}
                      alt={ad.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 700px"
                      className="object-contain transition-all duration-700 group-hover:scale-105 rounded-2xl cursor-zoom-in"
                      onClick={() => {
                        const images = getImages(ad);
                        const idx = images.findIndex((img) => img === activeImg);
                        setZoomIndex(idx >= 0 ? idx : 0);
                        setZoomImg(activeImg);
                        setZoomScale(1);
                        setZoomOffset({ x: 0, y: 0 });
                        setZoomOpen(true);
                      }}
                      onTouchStart={(e) => {
                        setTouchStartX(e.touches?.[0]?.clientX ?? null);
                      }}
                      onTouchEnd={(e) => {
                        const endX = e.changedTouches?.[0]?.clientX ?? null;
                        if (touchStartX == null || endX == null) {
                          setTouchStartX(null);
                          return;
                        }
                        const delta = endX - touchStartX;
                        const images = getImages(ad);
                        if (delta < -50 && images.length > 1) {
                          const idx = images.findIndex((img) => img === activeImg);
                          const next = (idx + 1) % images.length;
                          setActiveImg(images[next]);
                        } else if (delta > 50 && images.length > 1) {
                          const idx = images.findIndex((img) => img === activeImg);
                          const prev = (idx - 1 + images.length) % images.length;
                          setActiveImg(images[prev]);
                        }
                        setTouchStartX(null);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white/20 font-black uppercase italic">ფოტო არ არის</div>
                  )}

                  {getImages(ad).length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const images = getImages(ad);
                          const idx = images.findIndex((img) => img === activeImg);
                          const prev = (idx - 1 + images.length) % images.length;
                          setActiveImg(images[prev]);
                        }}
                        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-amber-200 text-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:bg-amber-500 hover:text-black transition items-center justify-center"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const images = getImages(ad);
                          const idx = images.findIndex((img) => img === activeImg);
                          const next = (idx + 1) % images.length;
                          setActiveImg(images[next]);
                        }}
                        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-amber-200 text-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:bg-amber-500 hover:text-black transition items-center justify-center"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {getImages(ad).length > 0 && (
                  <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2 px-2">
                    {getImages(ad).map((img: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(img)}
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${
                          activeImg === img ? 'border-amber-500 scale-105 shadow-lg shadow-amber-500/20' : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image src={img} alt="" width={96} height={96} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 📝 Content Block */}
              <div className="flex flex-col h-full md:-ml-8 lg:-ml-16">
                <div className="bg-gradient-to-br from-blue-900/40 via-slate-950/50 to-blue-950/40 backdrop-blur-3xl p-2 md:p-4 rounded-[20px] md:rounded-[28px] border border-white/10 shadow-2xl flex-grow relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 md:mb-6 relative z-10">
                    <span className="bg-amber-600 text-white px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                      {ad.category}
                    </span>
                    <span className="text-amber-500 font-black uppercase italic text-[10px] md:text-xs tracking-wider drop-shadow-md">
                      {ad.location}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-black uppercase italic leading-tight mb-3 md:mb-4 relative z-10 drop-shadow-2xl">
                    {ad.title}
                  </h1>

                  <div className="text-3xl md:text-4xl font-black text-amber-500 italic mb-6 md:mb-8 relative z-10 tracking-tighter drop-shadow-xl">
                    {ad.price} {ad.currency === 'USD' ? '$' : '₾'}
                  </div>

                  <p className="text-white/80 leading-relaxed italic text-sm md:text-lg mb-6 md:mb-8 whitespace-pre-wrap relative z-10 font-medium">
                    {ad.description}
                  </p>

                  {/* ✅ აქ ვიყენებთ ClientButtons კომპონენტს, რომელსაც უკვე გადავეცით დიზაინი */}
                  <ClientButtons ad={ad} shareUrl={shareUrl} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {zoomOpen && zoomImg && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full rounded-3xl bg-white/[0.04] border border-amber-400/30 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
              <div className="absolute -inset-1 rounded-3xl blur-2xl bg-amber-400/20 animate-pulse" />
              <div className="relative rounded-3xl p-4 md:p-6 backdrop-blur-2xl">
                <div
                  className="relative w-full max-h-[60vh] rounded-2xl overflow-hidden flex items-center justify-center bg-black/30 ring-1 ring-amber-300/30"
                  onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setZoomScale((s) => Math.min(3, Math.max(1, Number((s + delta).toFixed(2)))));
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDragging(true);
                    setDragStart({ x: e.clientX - zoomOffset.x, y: e.clientY - zoomOffset.y });
                  }}
                  onMouseMove={(e) => {
                    if (!dragging) return;
                    setZoomOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                  }}
                  onMouseUp={() => setDragging(false)}
                  onMouseLeave={() => setDragging(false)}
                >
                  <Image
                    src={zoomImg}
                    alt=""
                    width={1400}
                    height={1000}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                    style={{
                      transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomScale})`,
                      transformOrigin: 'center center',
                      transition: dragging ? 'none' : 'transform 0.15s ease',
                      cursor: zoomScale > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const images = getImages(ad);
                    const nextIndex = (zoomIndex - 1 + images.length) % images.length;
                    setZoomIndex(nextIndex);
                    setZoomImg(images[nextIndex] ?? zoomImg);
                    setZoomScale(1);
                    setZoomOffset({ x: 0, y: 0 });
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-amber-200 text-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:bg-amber-500 hover:text-black transition"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const images = getImages(ad);
                    const nextIndex = (zoomIndex + 1) % images.length;
                    setZoomIndex(nextIndex);
                    setZoomImg(images[nextIndex] ?? zoomImg);
                    setZoomScale(1);
                    setZoomOffset({ x: 0, y: 0 });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-amber-200 text-2xl font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:bg-amber-500 hover:text-black transition"
                >
                  ›
                </button>
                <div className="mt-4 flex items-center justify-between gap-4 text-xs text-white/70">
                  <span className="uppercase tracking-[0.2em] text-amber-300 font-black">
                    ფოტო {zoomIndex + 1} / {getImages(ad).length}
                  </span>
                  <span className="truncate text-white/60 font-bold">{ad.title}</span>
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomOpen(false)}
                    className="px-4 h-10 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 text-amber-100 font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_18px_rgba(245,158,11,0.35)] border border-amber-400/30 hover:bg-amber-500 hover:text-black transition inline-flex items-center justify-center"
                  >
                    უკან
                  </button>
                  <Link
                    href="/"
                    className="px-4 h-10 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 text-amber-100 font-black text-xs uppercase tracking-[0.25em] shadow-[0_0_18px_rgba(245,158,11,0.35)] border border-amber-400/30 hover:bg-amber-500 hover:text-black transition inline-flex items-center justify-center"
                  >
                    მთავარი გვერდი
                  </Link>
                </div>
                <div className="absolute right-[-90px] top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
                  {getImages(ad).map((img, i) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => {
                        setZoomIndex(i);
                        setZoomImg(img);
                      }}
                      className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                        zoomImg === img ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)]' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={img} alt="" width={64} height={64} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}