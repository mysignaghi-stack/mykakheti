"use client";
import { useEffect, useState } from 'react';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import type { Database } from '@/types/supabase';
import { supabase } from '../../lib/supabase';
import { ANNOUNCEMENT_CATEGORY_GROUPS, ANNOUNCEMENT_CATEGORIES, LOCATIONS } from '@/app/lib/constants';
import FavoriteButton from '@/app/components/announcements/FavoriteButton';
import ClientButtons from './ClientButtons';
import { CommunitySideWidget } from '../../components/community/CommunityWidgets';
import { extractAnnouncementId } from '@/app/lib/seo';

type Announcement = Database['public']['Tables']['announcements']['Row'];

const LOCATION_OPTIONS = Array.from(new Set(
  LOCATIONS.flatMap((municipality) => [
    municipality.municipality,
    ...municipality.cities.flatMap((city) => [
      city.name,
      ...city.villages.map((village) => `${city.name} - ${village}`),
    ]),
  ])
));

export default function AnnouncementDetailsClient({ initialAd }: { initialAd: Announcement | null }) {
  const { id } = useParams<{ id: string }>();
  const announcementId = extractAnnouncementId(id);
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editImages, setEditImages] = useState<string[]>(getImages(initialAd));
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    title: initialAd?.title ?? '',
    description: initialAd?.description ?? '',
    category: initialAd?.category ?? ANNOUNCEMENT_CATEGORIES[0],
    location: initialAd?.location ?? LOCATION_OPTIONS[0] ?? '',
    price: initialAd?.price ?? '',
    currency: initialAd?.currency ?? 'GEL',
    phone: initialAd?.phone ?? '',
  });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isOwner = Boolean(ad?.user_id && currentUserId && ad.user_id === currentUserId);
  const description = ad?.description ?? '';
  const shouldCollapseDescription = description.length > 260 || description.split(/\r?\n/).length > 5;

  // Share URL-ის დაყენება კლიენტის მხარეს
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setCurrentUserId(data.user?.id ?? null);
    };
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialAd) {
      const fetchAd = async () => {
        const { data } = await (supabase as any).from('announcements').select('*').eq('id', announcementId).single();
        if (data) {
          setAd(data);
          setActiveImg(getImages(data)[0] ?? null);
          setEditImages(getImages(data));
          setEditForm({
            title: data.title ?? '',
            description: data.description ?? '',
            category: data.category ?? ANNOUNCEMENT_CATEGORIES[0],
            location: data.location ?? LOCATION_OPTIONS[0] ?? '',
            price: data.price ?? '',
            currency: data.currency ?? 'GEL',
            phone: data.phone ?? '',
          });
        }
      };
      fetchAd();
    }
  }, [announcementId, initialAd]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [ad?.id]);

  const saveEdit = async () => {
    if (!ad || savingEdit) return;
    if (!editForm.title || !editForm.category || !editForm.location || !editForm.price) {
      alert('გთხოვთ შეავსოთ სათაური, კატეგორია, ლოკაცია და ფასი.');
      return;
    }

    setSavingEdit(true);
    try {
      let nextImages = [...editImages];
      if (editNewImages.length > 0) {
        const formData = new FormData();
        for (const file of editNewImages) {
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.35,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            initialQuality: 0.6,
          });
          formData.append('file', compressed, file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'announcement.jpg');
        }
        formData.append('bucket', 'announcements');
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploadResult?.error || 'ფოტოების ატვირთვა ვერ მოხერხდა');
        const uploaded = Array.isArray(uploadResult.urls)
          ? uploadResult.urls.filter((url: unknown): url is string => typeof url === 'string' && Boolean(url))
          : uploadResult.url ? [uploadResult.url] : [];
        nextImages = [...nextImages, ...uploaded];
      }

      if (nextImages.length === 0) {
        alert('გთხოვთ დატოვოთ ან დაამატოთ მინიმუმ ერთი ფოტო.');
        setSavingEdit(false);
        return;
      }

      const response = await fetch(`/api/announcements/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: {
            ...editForm,
            image_url: nextImages[0] ?? null,
            all_images: nextImages,
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || 'განცხადების რედაქტირება ვერ მოხერხდა');
      setAd(result.announcement);
      setEditImages(getImages(result.announcement));
      editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setEditNewImages([]);
      setEditImagePreviews([]);
      setActiveImg(getImages(result.announcement)[0] ?? null);
      setIsEditing(false);
      alert('განცხადება განახლდა და გადაგზავნილია მოდერაციაზე.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'უცნობი შეცდომა';
      alert('შეცდომა: ' + message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditImageUpload = (files: FileList | null) => {
    const nextFiles = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!nextFiles.length) return;
    if (editImages.length + editNewImages.length + nextFiles.length > 5) {
      alert('შეგიძლიათ დატოვოთ მაქსიმუმ 5 ფოტო.');
      return;
    }
    setEditNewImages((current) => [...current, ...nextFiles]);
    setEditImagePreviews((current) => [...current, ...nextFiles.map((file) => URL.createObjectURL(file))]);
  };

  const removeExistingEditImage = (url: string) => {
    setEditImages((current) => current.filter((item) => item !== url));
  };

  const removeNewEditImage = (index: number) => {
    setEditNewImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setEditImagePreviews((current) => {
      const preview = current[index];
      if (preview) URL.revokeObjectURL(preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

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
      <nav className="px-6 md:px-10 py-2 md:py-3 border-b border-white/5 flex justify-between items-center bg-slate-950/60 backdrop-blur-3xl sticky top-0 z-[100]">
        <Link href="/" className="text-xl md:text-2xl font-black italic tracking-tighter">
          mykakheti<span className="text-amber-500">.ge</span>
        </Link>

        <Link href="/" className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase italic hover:bg-white hover:text-black transition-all">
          ← უკან
        </Link>
      </nav>

      <div ref={contentRef} className="max-w-7xl mx-auto mt-0 md:mt-2 px-3 md:px-6 relative z-10">
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
                      className="object-contain object-top transition-all duration-700 group-hover:scale-105 rounded-2xl cursor-zoom-in"
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
                        <Image src={img} alt="" width={96} height={96} className="w-full h-full object-contain object-top" />
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
                    <div className="flex flex-col items-end gap-2">
                      <FavoriteButton announcementId={ad.id} />
                      <span className="text-amber-500 font-black uppercase italic text-[10px] md:text-xs tracking-wider drop-shadow-md">
                        {ad.location}
                      </span>
                    </div>
                  </div>

                  <h1 className="text-xl md:text-2xl font-black uppercase italic leading-tight mb-2 md:mb-3 relative z-10 drop-shadow-2xl">
                    {ad.title}
                  </h1>

                  <div className="text-xl md:text-2xl font-black text-amber-500 italic mb-4 md:mb-5 relative z-10 tracking-tight drop-shadow-xl">
                    {ad.price} {ad.currency === 'USD' ? '$' : '₾'}
                  </div>

                  <div className="mb-4 md:mb-5 relative z-10">
                    <div className="relative">
                      <p
                        className={`text-white/75 leading-relaxed italic text-xs md:text-sm whitespace-pre-wrap font-medium transition-[max-height] duration-300 ${
                          shouldCollapseDescription && !isDescriptionExpanded
                            ? 'max-h-36 overflow-hidden md:max-h-44'
                            : 'max-h-none'
                        }`}
                      >
                        {description}
                      </p>
                      {shouldCollapseDescription && !isDescriptionExpanded && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent via-[#071126]/75 to-[#071126]" />
                      )}
                    </div>

                    {shouldCollapseDescription && (
                      <button
                        type="button"
                        onClick={() => setIsDescriptionExpanded((value) => !value)}
                        className="mt-3 rounded-xl border border-amber-300/35 bg-amber-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-500/25"
                      >
                        {isDescriptionExpanded ? 'ნაკლების ნახვა' : 'სრულად ნახვა'}
                      </button>
                    )}
                  </div>

                  {/* ✅ აქ ვიყენებთ ClientButtons კომპონენტს, რომელსაც უკვე გადავეცით დიზაინი */}
                  <ClientButtons ad={ad} shareUrl={shareUrl} />

                  {isOwner && (
                    <div className="mt-4 relative z-10">
                      <button
                        type="button"
                        onClick={() => setIsEditing((value) => !value)}
                        className="rounded-xl border border-amber-300/35 bg-amber-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25"
                      >
                        {isEditing ? 'რედაქტირების დახურვა' : 'ჩემი განცხადების რედაქტირება'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {isOwner && isEditing && (
        <div className="fixed inset-0 z-[115] overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b15] p-5 shadow-2xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase text-amber-300">განცხადების რედაქტირება</h2>
                <p className="mt-1 text-xs text-white/45">შენახვის შემდეგ განცხადება ხელახლა გაივლის მოდერაციას.</p>
              </div>
              <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-black uppercase text-white/45 hover:text-white">დახურვა ✕</button>
            </div>

            <div className="space-y-3">
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" placeholder="სათაური" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="rounded-xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none focus:border-amber-400">
                  {ANNOUNCEMENT_CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.title} label={group.title === 'საყოფაცხოვრებო ნივთები' ? 'გასაყიდი საქონელი — საყოფაცხოვრებო ნივთები' : group.title}>
                      {group.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </optgroup>
                  ))}
                </select>
                <select value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="rounded-xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none focus:border-amber-400">
                  {LOCATION_OPTIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" placeholder="ფასი" />
                <select value={editForm.currency ?? 'GEL'} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} className="rounded-xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none focus:border-amber-400">
                  <option value="GEL">₾</option>
                  <option value="USD">$</option>
                </select>
                <input value={editForm.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" placeholder="ტელეფონი" />
              </div>
              <textarea value={editForm.description ?? ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={5} className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400" placeholder="აღწერა" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">ფოტოები</span>
                  <span className="text-[10px] font-bold text-white/35">{editImages.length + editNewImages.length} / 5</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {editImages.map((img) => (
                    <div key={img} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      <Image src={img} alt="" fill sizes="160px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingEditImage(img)}
                        className="absolute right-2 top-2 rounded-lg bg-red-600/90 px-2 py-1 text-[10px] font-black uppercase text-white"
                      >
                        წაშლა
                      </button>
                    </div>
                  ))}
                  {editImagePreviews.map((preview, index) => (
                    <div key={preview} className="relative aspect-square overflow-hidden rounded-xl border border-amber-300/30 bg-black/30">
                      <Image src={preview} alt="" fill sizes="160px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewEditImage(index)}
                        className="absolute right-2 top-2 rounded-lg bg-red-600/90 px-2 py-1 text-[10px] font-black uppercase text-white"
                      >
                        წაშლა
                      </button>
                      <span className="absolute bottom-2 left-2 rounded-lg bg-amber-500/90 px-2 py-1 text-[9px] font-black uppercase text-black">
                        ახალი
                      </span>
                    </div>
                  ))}
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:border-amber-300/40 hover:text-amber-100">
                  ფოტოს დამატება
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      handleEditImageUpload(event.target.files);
                      event.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="w-full rounded-2xl bg-amber-600 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEdit ? 'ინახება...' : 'ცვლილებების შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}
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
