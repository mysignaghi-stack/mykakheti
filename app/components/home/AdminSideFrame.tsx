'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { Navigation, Pagination, EffectFade, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';
import { supabase } from '../../lib/supabase';
import { renderAdminPostContent, stripAdminPostContent } from '@/app/lib/adminPostContent';
// წავშალეთ AdminPost იმპორტი lib/types-დან კონფლიქტის თავიდან ასაცილებლად
import type { Database } from '@/types/supabase';

// ტიპებს ვიღებთ პირდაპირ ბაზის სტრუქტურიდან, რომ 100% ზუსტი იყოს
type AdminPost = Database['public']['Tables']['admin_posts']['Row'];
type AdminPostInsertPayload = Database['public']['Tables']['admin_posts']['Insert'];

interface AdminSideFrameProps {
  post: AdminPost | undefined;
  position: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

export default function AdminSideFrame({ post, position, isAdmin, onRefresh }: AdminSideFrameProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 0,
    link: '',
    files: [] as File[],
    mediaType: null as 'image' | 'video' | 'gallery' | null,
    videoBackground: false
  });
  const [loading, setLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; media: string[]; currentIndex: number; isVideo: boolean } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Reset states when the displayed admin post changes
  useEffect(() => {
    setLightbox(null);
    setShowFullContent(false);
  }, [post]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '', priority: 0, link: '', files: [], mediaType: null, videoBackground: false });
    setEditingPost(null);
    setShowForm(false);
  };

  const startEdit = (post: AdminPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content || '',
      category: post.category || '',
      priority: post.priority || 0,
      link: post.link || '',
      files: [],
      mediaType: (post.media_type as 'image' | 'video' | 'gallery' | null) || null,
      videoBackground: post.video_background || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    setLoading(true);
    try {
      const mediaUrls: string[] = editingPost?.media_urls ? [...editingPost.media_urls] : [];
      let mediaType = editingPost?.media_type || null;

      if (formData.files.length > 0) {
        mediaUrls.length = 0;
        for (const file of formData.files) {
          let processedFile: File | Blob = file;
          if (file.type.startsWith('image/')) {
            try {
              // Sanitize file name to avoid Unicode issues with browser-image-compression
              const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
              const sanitizedFile = new File([file], sanitizedName, { type: file.type });
              processedFile = await imageCompression(sanitizedFile, {
                maxSizeMB: 1,
                maxWidthOrHeight: 800,
                useWebWorker: true,
              });
            } catch (compressionError) {
              console.warn('Image compression failed, using original file:', compressionError);
              processedFile = file;
            }
          }

          const fileName = `${position}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { error } = await supabase.storage.from('admin-media').upload(fileName, processedFile);
          if (error) throw error;

          const { data } = supabase.storage.from('admin-media').getPublicUrl(fileName);
          mediaUrls.push(data.publicUrl);
        }

        if (formData.files.length === 1) {
          mediaType = formData.files[0].type.startsWith('video/') ? 'video' : 'image';
        } else {
          mediaType = 'gallery';
        }
      }

      // ვქმნით ობიექტს, რომელიც ზუსტად ემთხვევა ბაზის ტიპებს
      const postData: AdminPostInsertPayload = {
        title: formData.title,
        content: formData.content,
        category: formData.category || null,
        priority: formData.priority,
        link: formData.link || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        position: position,
        video_background: formData.videoBackground && mediaType === 'video'
      };

      if (editingPost) {
        const res = await fetch('/api/admin/posts/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id, payload: postData }),
          credentials: 'same-origin'
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Update failed');
      } else {
        const res = await fetch('/api/admin/posts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
          credentials: 'same-origin'
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Insert failed');
      }

      resetForm();
      onRefresh();
      alert(editingPost ? 'პოსტი განახლდა! ✅' : 'პოსტი დაემატა! ✅');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('შეცდომა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;

    try {
      const postToDelete = editingPost || post;
      if (postToDelete) {
        // @ts-ignore: Handle potential singular/plural mismatch legacy
        const urlsToDelete = postToDelete.media_urls || (postToDelete.media_url ? [postToDelete.media_url] : []);
        for (const url of urlsToDelete) {
          const fileName = url.split('/').pop();
          if (fileName) {
            await supabase.storage.from('admin-media').remove([fileName]);
          }
        }
      }

      const res = await fetch('/api/admin/posts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
        credentials: 'same-origin'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');

      resetForm();
      onRefresh();
      alert('პოსტი წაიშალა! ✅');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('შეცდომა წაშლისას: ' + message);
    }
  };

  const handleHide = async (postId: number) => {
    try {
      const res = await fetch('/api/admin/posts/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, payload: { priority: -1 } }),
        credentials: 'same-origin'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      onRefresh();
    } catch (error) {
      console.error('Failed to hide post:', error);
    }
  };

  // Safely access post properties with optional chaining
  const postCategory = post?.category;
  const postLink = post?.link;
  const postMediaUrls = post?.media_urls;
  const postMediaType = post?.media_type;
  const postVideoBackground = post?.video_background;
  const hasPostMedia = Boolean(post && ((post.media_urls && post.media_urls.length > 0) || (post as any).media_url));

  const isVideoUrl = (url?: string | null) => !!url && /\.(mp4|mov|avi|webm|m4v)$/i.test(url);

  const InlineVideo = ({ src, className, onClick }: { src: string; className?: string; onClick?: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => undefined);
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(video);
      return () => observer.disconnect();
    }, [src]);

    return (
      <div
        className={`relative rounded-[20px] overflow-hidden ${className || ''} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover pointer-events-none rounded-[20px] block"
          style={{ transform: 'translateZ(0)', borderRadius: '20px' }}
        />
      </div>
    );
  };

  const videoWrapperClassName = postVideoBackground
    ? 'relative w-full h-[180px] md:h-[200px] flex items-center justify-center overflow-hidden rounded-[20px]'
    : 'relative w-full h-[180px] md:h-[200px] flex items-center justify-center overflow-hidden rounded-[20px]';
  const videoOverlayClassName = postVideoBackground
    ? 'absolute inset-0 bg-black/20 rounded-[20px] pointer-events-none'
    : 'absolute inset-0 bg-gradient-to-br from-amber-600/20 via-yellow-400/10 to-amber-600/20 rounded-[20px] backdrop-blur-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pointer-events-none';
  const videoFrameClassName = postVideoBackground
    ? 'relative z-10 w-full h-full object-cover rounded-[20px]'
    : 'relative z-10 w-full h-full object-cover rounded-[20px] shadow-2xl shadow-indigo-900/40 border-2 border-amber-500/40 cursor-pointer hover:border-amber-500/60 transition-all duration-300';
  const galleryVideoFrameClassName = postVideoBackground
    ? 'relative z-10 w-full h-32 object-cover rounded-[20px]'
    : 'relative z-10 w-full h-32 object-cover rounded-[20px] shadow-2xl shadow-indigo-900/50 border-2 border-amber-500/40 hover:border-amber-500/60 transition-all duration-300';

  // Fixed height based on position
  const heightClass = position === 'left_top' || position === 'right_top' ? 'h-full' : 'h-auto';

  const openLightbox = (url: string, isVideo: boolean) => {
    setLightbox({ open: true, media: [url], currentIndex: 0, isVideo });
  };

  const getPrimaryMediaUrl = () => post?.media_urls?.[0] || (post as any)?.media_url || '';

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    if (post?.id) return `${window.location.origin}/admin-posts/${post.id}`;
    if (post?.link) {
      if (/^https?:\/\//.test(post.link)) return post.link;
      return `${window.location.origin}${post.link.startsWith('/') ? post.link : `/${post.link}`}`;
    }
    return `${window.location.origin}${window.location.pathname}#admin-${position}`;
  };

  const shareToFacebook = () => {
    const url = getShareUrl();
    if (!url) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 'fb-share', 'width=600,height=400');
  };

  const sharePost = async () => {
    const url = getShareUrl();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title ?? 'MyKakheti', url });
        return;
      } catch {
        // fall back to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
  };

  const openPostPreview = () => {
    const url = getPrimaryMediaUrl();
    if (!url) {
      setShowFullContent(true);
      return;
    }
    openLightbox(url, post?.media_type === 'video' || isVideoUrl(url));
  };

  return (
    <div id={`admin-${position}`} className={`w-full ${heightClass} bg-gradient-to-br from-slate-900/80 via-black/60 to-slate-800/80 backdrop-blur-xl rounded-[24px] border border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.12),0_14px_28px_-12px_rgba(0,0,0,0.5)] p-2 ring-1 ring-white/10 relative animate-in fade-in duration-700`}>
      {/* Badge removed per request */}
      {/* Header with controls */}
      <div className="flex justify-end items-center mb-1">
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
              title="ახალი კონტენტის დამატება"
            >
              {showForm ? '✕' : '+'}
            </button>
          )}
        </div>
      </div>

      {/* Media Display - Moved to top */}
      {post && hasPostMedia ? (
        <div className="mb-1 mt-1">
          {/* Decorative rounded frame with gradient border and inner dark panel */}
          <div className="relative w-full h-[150px] rounded-[20px] p-[2px] bg-gradient-to-br from-amber-500/20 via-pink-400/10 to-violet-500/10 overflow-hidden">
            <div className="absolute inset-0 bg-[#06060b] rounded-[18px] overflow-hidden flex items-center justify-center">
              {/* media area */}
              {post.media_type === 'video' ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openLightbox((post.media_urls?.[0] || (post as any).media_url)!, true)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox((post.media_urls?.[0] || (post as any).media_url)!, true); } }}
                  className="w-full h-full rounded-[18px] overflow-hidden relative cursor-pointer"
                >
                  <video src={(post.media_urls?.[0] || (post as any).media_url)!} className="w-full h-full object-cover" playsInline autoPlay muted loop />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              ) : post.media_type === 'gallery' ? (
                <div className="w-full h-full">
                  <Swiper
                    modules={[Navigation, Pagination, EffectFade, Autoplay]}
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation
                    pagination={{ clickable: true }}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                  className="w-full h-full rounded-[18px] overflow-hidden"
                  >
                    {(post.media_urls || [(post as any).media_url]).filter(Boolean).map((url: string, idx: number) => (
                      <SwiperSlide key={idx} className="w-full h-full rounded-[18px] overflow-hidden">
                        {isVideoUrl(url) ? (
                          <video src={url} className="w-full h-full object-cover" playsInline autoPlay muted loop />
                        ) : (
                          <Image src={url!} alt="" fill loading="eager" sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
                        )}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className="w-full h-full rounded-[18px] overflow-hidden relative cursor-pointer" onClick={() => openLightbox((post.media_urls?.[0] || (post as any).media_url)!, isVideoUrl((post.media_urls?.[0] || (post as any).media_url)!))}>
                  {isVideoUrl((post.media_urls?.[0] || (post as any).media_url)!) ? (
                    <video src={(post.media_urls?.[0] || (post as any).media_url)!} className="w-full h-full object-cover" playsInline autoPlay muted loop />
                  ) : (
                    <Image src={(post.media_urls?.[0] || (post as any).media_url)!} alt="" fill loading="eager" sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          </div>
          {isAdmin && post && (
            <div className="mt-2 flex justify-end gap-1">
              <button
                onClick={() => startEdit(post)}
                className="text-blue-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-blue-600/20 transition-all"
                title="რედაქტირება"
              >
                ✏️
              </button>
              <button
                onClick={() => handleHide(post.id)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-600/20 transition-all"
                title="დამალვა"
              >
                👁️
              </button>
            </div>
          )}
          {post && (
            <div className="mt-2 flex flex-wrap justify-end gap-1">
              <button
                type="button"
                onClick={openPostPreview}
                className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase text-amber-100 hover:bg-amber-500/20 transition"
              >
                ნახვა
              </button>
              <button
                type="button"
                onClick={shareToFacebook}
                className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-100 hover:bg-blue-500/20 transition"
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={sharePost}
                className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase text-white/75 hover:text-white transition"
              >
                გაზიარება
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Admin Form */}
      {isAdmin && showForm && (
        <div className="mb-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="სათაური"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 font-bold placeholder:text-white/30"
                required
              />
              <input
                type="text"
                placeholder="კატეგორია"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-purple-500 font-bold placeholder:text-white/30"
              />
              <input
                type="number"
                placeholder="პრიორიტეტი"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-green-500 font-bold placeholder:text-white/30"
                min="0" max="10"
              />
              <input
                type="url"
                placeholder="ბმული"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-cyan-500 font-bold placeholder:text-white/30"
              />
            </div>
            <textarea
              placeholder="შინაარსი"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 min-h-[80px] placeholder:text-white/30 resize-none"
              required
            />
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/60 cursor-pointer hover:text-white flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setFormData(prev => ({ ...prev, files }));
                  }}
                />
                <span>{formData.files.length > 0 ? `${formData.files.length} ფაილი არჩეულია` : '📎 ფოტოები/ვიდეო დართვა'}</span>
              </label>
              {formData.files.length === 1 && formData.files[0].type.startsWith('video/') && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.videoBackground}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoBackground: e.target.checked }))}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-xs text-white/60">ვიდეო ფონზე გაშვება</span>
                </label>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-blue-500 transition-all"
                >
                  {loading ? '...' : editingPost ? 'განახლება' : 'დამატება'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Content Display */}
      {post && !hasPostMedia ? (
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h4 className="text-amber-500 font-black text-base italic flex-1">{post.title}</h4>
            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => startEdit(post)}
                  className="text-blue-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-blue-600/20 transition-all"
                  title="რედაქტირება"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleHide(post.id)}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-600/20 transition-all"
                  title="დამალვა"
                >
                  👁️
                </button>
              </div>
            )}
          </div>
          
          {/* Content Preview */}
          <div className="relative">
            <p className="text-white/80 text-xs leading-relaxed">
              {(() => {
                const fullContent = post.content || '';
                const plainContent = stripAdminPostContent(fullContent);
                const isLong = plainContent.length > 150;
                if (showFullContent || !isLong) {
                  return renderAdminPostContent(fullContent);
                }
                return renderAdminPostContent(`${plainContent.substring(0, 150)}...`);
              })()}
            </p>
            {post.content && stripAdminPostContent(post.content).length > 150 && !showFullContent && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl flex items-end justify-center pb-1">
                <button
                  onClick={() => setShowFullContent(true)}
                  className="text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors"
                >
                  ვრცლად ▼
                </button>
              </div>
            )}
            {showFullContent && post.content && stripAdminPostContent(post.content).length > 150 && (
              <div className="text-center mt-1">
                <button
                  onClick={() => setShowFullContent(false)}
                  className="text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors"
                >
                  ნაკლები ▲
                </button>
              </div>
            )}
          </div>
          {post.category && (
            <span className="inline-block px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-bold">{post.category}</span>
          )}
          {post.link && (
            <a href={post.link} target="_blank" rel="noopener noreferrer" className="inline-block px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs font-bold hover:bg-cyan-600 hover:text-white transition-all">🔗 ბმული</a>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={openPostPreview}
              className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase text-amber-100 hover:bg-amber-500/20 transition"
            >
              ნახვა
            </button>
            <button
              type="button"
              onClick={shareToFacebook}
              className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-100 hover:bg-blue-500/20 transition"
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={sharePost}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase text-white/75 hover:text-white transition"
            >
              გაზიარება
            </button>
          </div>
        </div>
      ) : !post ? (
        <div className="text-white/50 text-sm italic text-center py-8">
          <span className="text-2xl block mb-2">📄</span>
          <p>კონტენტი არ არის დამატებული</p>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-1 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
            >
              + დაამატე კონტენტი
            </button>
          )}
        </div>
      ) : null}
      
      {/* Lightbox Modal */}
      {isMounted && lightbox?.open
        ? createPortal(
            <div
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-4 text-left backdrop-blur-md animate-in fade-in duration-300 sm:p-6"
              onClick={() => setLightbox(null)}
              role="dialog"
              aria-modal="true"
              aria-label="მედია ნახვა"
            >
              <div
                className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-amber-400/20 bg-white/[0.04] text-left shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setLightbox(null)}
                  className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/70 text-xl font-black text-white/60 transition hover:border-white/35 hover:text-white"
                  aria-label="დახურვა"
                >
                  ✕
                </button>
                <div className="relative flex h-[320px] items-center justify-center bg-black md:h-[520px]">
                  {lightbox.isVideo ? (
                    <video
                      src={lightbox.media[lightbox.currentIndex]}
                      controls
                      playsInline
                      preload="auto"
                      autoPlay
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Image
                      src={lightbox.media[lightbox.currentIndex]}
                      alt=""
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  )}
                </div>
                {post && (
                  <div className="space-y-3 p-5 md:p-7">
                    {post.category && (
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/70">{post.category}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black uppercase text-amber-200 md:text-4xl">{post.title}</h3>
                      {post.category && (
                        <span className="rounded-full bg-purple-600/20 px-2 py-1 text-[10px] font-bold text-purple-300 md:hidden">{post.category}</span>
                      )}
                    </div>
                    {post.content && (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/75 md:text-base">
                        {renderAdminPostContent(post.content)}
                      </p>
                    )}
                    {post.link && (
                      <a href={post.link} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-amber-300/35 bg-amber-500/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-500/25">
                        ბმულზე გადასვლა
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
