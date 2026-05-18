'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
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
    mediaType: null as 'image' | 'gallery' | null,
  });
  const [loading, setLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; media: string[]; currentIndex: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset states when the displayed admin post changes
  useEffect(() => {
    setLightbox(null);
    setShowFullContent(false);
  }, [post]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetForm = () => {
    setFormData({ title: '', content: '', category: '', priority: 0, link: '', files: [], mediaType: null });
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
      mediaType: post.media_type === 'gallery' ? 'gallery' : post.media_type === 'image' ? 'image' : null,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    setLoading(true);
    try {
      const mediaUrls: string[] = editingPost?.media_urls
        ? editingPost.media_urls.filter((url) => Boolean(url) && !isVideoUrl(url))
        : [];
      let mediaType: 'image' | 'gallery' | null = mediaUrls.length > 1 ? 'gallery' : mediaUrls.length === 1 ? 'image' : null;

      if (formData.files.length > 0) {
        const nonImageFile = formData.files.find((file) => !file.type.startsWith('image/'));
        if (nonImageFile) {
          alert('VIP განცხადებებში ვიდეო აღარ იტვირთება. გთხოვთ აირჩიოთ მხოლოდ ფოტოები.');
          return;
        }

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
          mediaType = 'image';
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
        media_url: mediaUrls[0] ?? null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        position: position,
        video_background: false
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
  const isVideoUrl = (url?: string | null) => !!url && /\.(mp4|mov|avi|webm|m4v)$/i.test(url);
  const getImageMediaUrls = () => {
    const urls = [
      ...(Array.isArray(post?.media_urls) ? post?.media_urls ?? [] : []),
      (post as any)?.media_url,
    ].filter(Boolean) as string[];
    return Array.from(new Set(urls)).filter((url) => !isVideoUrl(url));
  };
  const postImageMediaUrls = getImageMediaUrls();
  const hasPostMedia = Boolean(post && postImageMediaUrls.length > 0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [post?.id, postImageMediaUrls.length]);

  useEffect(() => {
    if (postImageMediaUrls.length <= 1) return;
    const slideDelay = position === 'left_top' ? 3100 : 4700;
    const intervalId = window.setInterval(() => {
      setActiveImageIndex((index) => (index + 1) % postImageMediaUrls.length);
    }, slideDelay);
    return () => window.clearInterval(intervalId);
  }, [position, postImageMediaUrls.length]);

  // Fixed height based on position
  const heightClass = position === 'left_top' || position === 'right_top' ? 'h-full' : 'h-auto';

  const openLightbox = (index = 0) => {
    const media = postImageMediaUrls.length > 0 ? postImageMediaUrls : [];
    if (media.length === 0) return;
    setLightbox({ open: true, media, currentIndex: Math.min(Math.max(index, 0), media.length - 1) });
  };

  const getPrimaryMediaUrl = () => postImageMediaUrls[0] || '';

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    if (post?.id) return `${window.location.origin}/admin-posts/${post.id}`;
    if (post?.link) {
      if (/^https?:\/\//.test(post.link)) return post.link;
      return `${window.location.origin}${post.link.startsWith('/') ? post.link : `/${post.link}`}`;
    }
    return `${window.location.origin}${window.location.pathname}#admin-${position}`;
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

  const sharePostToFacebook = () => {
    const url = getShareUrl();
    if (!url || typeof window === 'undefined') return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer,width=720,height=520'
    );
  };

  const openPostPreview = () => {
    const url = getPrimaryMediaUrl();
    if (!url) {
      setShowFullContent(true);
      return;
    }
    openLightbox(0);
  };

  const goLightboxPrev = () => {
    setLightbox((current) => current
      ? { ...current, currentIndex: Math.max(0, current.currentIndex - 1) }
      : current
    );
  };

  const goLightboxNext = () => {
    setLightbox((current) => current
      ? { ...current, currentIndex: Math.min(current.media.length - 1, current.currentIndex + 1) }
      : current
    );
  };

  return (
    <div id={`admin-${position}`} className={`w-full ${heightClass} overflow-hidden bg-gradient-to-br from-[#1a1205]/95 via-[#07070d]/90 to-[#121827]/95 backdrop-blur-xl rounded-[24px] border border-amber-300/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_45px_-24px_rgba(245,158,11,0.65)] p-2 ring-1 ring-amber-200/10 relative animate-in fade-in duration-700`}>
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="absolute inset-x-4 top-4 z-30 flex justify-between items-center">
        <span className="rounded-full border border-amber-300/35 bg-black/65 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-100 shadow-lg backdrop-blur-md">
          VIP
        </span>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-2 py-1 bg-black/65 text-blue-300 rounded text-xs font-bold shadow-lg backdrop-blur-md hover:bg-blue-600 hover:text-white transition-all"
              title="ახალი კონტენტის დამატება"
            >
              {showForm ? '✕' : '+'}
            </button>
          )}
        </div>
      </div>

      {/* Media Display - Moved to top */}
      {post && hasPostMedia ? (
        <div className={showForm ? 'mb-1 h-[150px]' : 'mb-1 h-full'}>
          {/* Decorative rounded frame with gradient border and inner dark panel */}
          <div className="relative h-full w-full rounded-[20px] p-[2px] bg-gradient-to-br from-amber-300/55 via-white/10 to-cyan-300/20 overflow-hidden shadow-[0_16px_35px_-24px_rgba(251,191,36,0.85)]">
            <div className="absolute inset-0 bg-[#06060b] rounded-[18px] overflow-hidden flex items-center justify-center">
              {postImageMediaUrls.length > 1 ? (
                <div className="relative h-full w-full cursor-pointer rounded-[18px] overflow-hidden" onClick={() => openLightbox(activeImageIndex)}>
                  <Image
                    key={postImageMediaUrls[activeImageIndex]}
                    src={postImageMediaUrls[activeImageIndex]}
                    alt=""
                    fill
                    loading={activeImageIndex === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="vip-slide-image rounded-[16px] object-contain"
                  />
                  <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.12),transparent_34%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_48%,transparent_58%)] opacity-70 mix-blend-screen" />
                  <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-1">
                    {postImageMediaUrls.map((url, idx) => (
                      <button
                        key={`${url}-dot`}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveImageIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeImageIndex ? 'w-4 bg-amber-300' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`ფოტო ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full rounded-[18px] overflow-hidden relative cursor-pointer" onClick={() => openLightbox(0)}>
                  <Image src={postImageMediaUrls[0]} alt="" fill loading="lazy" sizes="(max-width: 768px) 100vw, 420px" className="rounded-[16px] object-contain" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-amber-200/5 pointer-events-none" />
              <div className="absolute bottom-2 left-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap justify-start gap-1">
                <button
                  type="button"
                  onClick={openPostPreview}
                  className="rounded-md border border-amber-300/40 bg-black/70 px-2 py-1 text-[9px] font-black uppercase text-amber-100 shadow-lg backdrop-blur-md transition hover:bg-amber-500/25"
                >
                  ნახვა
                </button>
                <button
                  type="button"
                  onClick={sharePost}
                  className="rounded-md border border-white/20 bg-black/70 px-2 py-1 text-[9px] font-black uppercase text-white/85 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:text-white"
                >
                  გაზიარება
                </button>
                <button
                  type="button"
                  onClick={sharePostToFacebook}
                  className="rounded-md border border-blue-300/30 bg-black/70 px-2 py-1 text-[9px] font-black uppercase text-blue-100 shadow-lg backdrop-blur-md transition hover:bg-blue-500/25"
                >
                  Facebook
                </button>
              </div>
              {isAdmin && post && (
                <div className="absolute bottom-2 right-2 z-20 flex gap-1">
                  <button
                    onClick={() => startEdit(post)}
                    className="rounded-md border border-blue-300/25 bg-black/70 px-1.5 py-1 text-[11px] text-blue-200 shadow-lg backdrop-blur-md transition hover:bg-blue-600 hover:text-white"
                    title="რედაქტირება"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleHide(post.id)}
                    className="rounded-md border border-white/15 bg-black/70 px-1.5 py-1 text-[11px] text-white/70 shadow-lg backdrop-blur-md transition hover:bg-white/15 hover:text-white"
                    title="დამალვა"
                  >
                    👁️
                  </button>
                </div>
              )}
            </div>
          </div>
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
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'));
                    setFormData(prev => ({ ...prev, files }));
                  }}
                />
                <span>{formData.files.length > 0 ? `${formData.files.length} ფოტო არჩეულია` : '📎 VIP ფოტოები დართვა'}</span>
              </label>
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
              onClick={sharePost}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-black uppercase text-white/75 hover:text-white transition"
            >
              გაზიარება
            </button>
            <button
              type="button"
              onClick={sharePostToFacebook}
              className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase text-blue-100 transition hover:bg-blue-500/20"
            >
              Facebook
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
                  <Image
                    src={lightbox.media[lightbox.currentIndex]}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                  {lightbox.media.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goLightboxPrev}
                        disabled={lightbox.currentIndex === 0}
                        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-2xl text-white/80 transition hover:bg-black disabled:opacity-30"
                        aria-label="წინა ფოტო"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={goLightboxNext}
                        disabled={lightbox.currentIndex >= lightbox.media.length - 1}
                        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 text-2xl text-white/80 transition hover:bg-black disabled:opacity-30"
                        aria-label="შემდეგი ფოტო"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                {post && (
                  <div className="space-y-3 p-5 md:p-7">
                    {lightbox.media.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {lightbox.media.map((url, index) => (
                          <button
                            key={`${url}-${index}`}
                            type="button"
                            onClick={() => setLightbox((current) => current ? { ...current, currentIndex: index } : current)}
                            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                              lightbox.currentIndex === index ? 'border-amber-300' : 'border-white/15 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={sharePost}
                        className="inline-flex rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        გაზიარება
                      </button>
                      <button
                        type="button"
                        onClick={sharePostToFacebook}
                        className="inline-flex rounded-xl border border-blue-300/35 bg-blue-500/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-blue-100 transition hover:bg-blue-500/25"
                      >
                        Facebook
                      </button>
                    </div>
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
