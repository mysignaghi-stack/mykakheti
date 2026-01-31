'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Reset states when the displayed admin post changes
  useEffect(() => {
    setLightbox(null);
    setShowFullContent(false);
  }, [post]);

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
      // @ts-ignore: Supabase types might be slightly out of sync regarding arrays vs nulls
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
        const { error } = await (supabase
          .from('admin_posts') as any)
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
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

      const { error } = await supabase
        .from('admin_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

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
      const { error } = await (supabase
        .from('admin_posts') as any)
        .update({ priority: -1 })
        .eq('id', postId);

      if (error) throw error;
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
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onClick={onClick}
        className={className}
      />
    );
  };

  // Fixed height based on position
  const heightClass = position === 'left_top' || position === 'right_top' ? 'h-[400px]' : 'h-auto';

  return (
    <div className={`w-full ${heightClass} bg-gradient-to-br from-slate-900/80 via-black/60 to-slate-800/80 backdrop-blur-xl rounded-[32px] border-2 border-amber-500/30 shadow-[inset_0_0_30px_rgba(245,158,11,0.15),0_20px_40px_-10px_rgba(0,0,0,0.5)] p-5 ring-1 ring-white/10 relative animate-in fade-in duration-700`}>
      {/* Badge */}
      <div className="absolute top-1 left-4 z-10">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-sm px-4 py-1 rounded-full shadow-lg border-2 border-amber-300 animate-pulse">
          🏛️ {post?.badge_text || 'ოფიციალური განცხადება'}
        </div>
      </div>
      {/* Header with controls */}
      <div className="flex justify-end items-center mb-2 pt-2">
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
      {post && ((post.media_urls && post.media_urls.length > 0) || (post as any).media_url) ? (
        <div className="mb-1 mt-4">
          {post.media_type === 'video' ? (
            <div className="relative w-full h-[200px] p-0.5 flex items-center justify-center overflow-hidden rounded-[20px]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-yellow-400/10 to-amber-600/20 rounded-[20px] backdrop-blur-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></div>
              <InlineVideo
                src={(post.media_urls?.[0] || (post as any).media_url)!}
                onClick={() => setLightbox({ open: true, media: [(post.media_urls?.[0] || (post as any).media_url)!], currentIndex: 0, isVideo: true })}
                className="relative z-10 w-full h-full object-contain rounded-[20px] shadow-2xl shadow-indigo-900/40 border-2 border-amber-500/40 cursor-pointer hover:border-amber-500/60 transition-all duration-300"
              />
            </div>
          ) : post.media_type === 'gallery' ? (
             <div className="mt-1">
              <Swiper
                modules={[Navigation, Pagination, EffectFade, Autoplay]}
                spaceBetween={10}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="w-full h-32 rounded-[20px] shadow-xl backdrop-blur-lg"
              >
                {(post.media_urls || [(post as any).media_url]).filter(Boolean).map((url: string, idx: number) => (
                  <SwiperSlide key={idx}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-yellow-400/10 to-amber-600/20 rounded-[20px] backdrop-blur-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></div>
                      {isVideoUrl(url) ? (
                        <InlineVideo
                          src={url}
                          onClick={() => setLightbox({ open: true, media: [url], currentIndex: 0, isVideo: true })}
                          className="relative z-10 w-full h-32 object-contain rounded-[20px] shadow-2xl shadow-indigo-900/50 border-2 border-amber-500/40 hover:border-amber-500/60 transition-all duration-300"
                        />
                      ) : (
                        <Image
                          src={url!}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 800px"
                          className="object-contain rounded-[20px] shadow-xl border-2 border-amber-500/40"
                        />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
             <div className="relative w-full h-32 cursor-pointer" onClick={() => setLightbox({ open: true, media: [(post.media_urls?.[0] || (post as any).media_url)!], currentIndex: 0, isVideo: (post.media_urls?.[0] || (post as any).media_url)!.includes('.mp4') || (post.media_urls?.[0] || (post as any).media_url)!.includes('.mov') || (post.media_urls?.[0] || (post as any).media_url)!.includes('.avi') || (post.media_urls?.[0] || (post as any).media_url)!.includes('.webm') })}>
              {isVideoUrl((post.media_urls?.[0] || (post as any).media_url)!) ? (
                <div className="relative w-full h-full p-0.5 flex items-center justify-center overflow-hidden rounded-[20px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-yellow-400/10 to-amber-600/20 rounded-[20px] backdrop-blur-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"></div>
                  <InlineVideo
                    src={(post.media_urls?.[0] || (post as any).media_url)!}
                    className="relative z-10 w-full h-full object-contain rounded-[20px] shadow-2xl shadow-indigo-900/40 border-2 border-amber-500/40"
                  />
                </div>
              ) : (
                <Image
                  src={(post.media_urls?.[0] || (post as any).media_url)!}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-contain rounded-[20px] shadow-xl border-2 border-amber-500/40"
                />
              )}
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
      {post ? (
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
              {showFullContent || !post.content || post.content.length <= 150 
                ? post.content 
                : `${post.content.substring(0, 150)}...`}
            </p>
            {post.content && post.content.length > 150 && !showFullContent && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl flex items-end justify-center pb-1">
                <button
                  onClick={() => setShowFullContent(true)}
                  className="text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors"
                >
                  ვრცლად ▼
                </button>
              </div>
            )}
            {showFullContent && post.content && post.content.length > 150 && (
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
        </div>
      ) : (
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
      )}
      
      {/* Lightbox Modal */}
      {lightbox?.open && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {lightbox.isVideo ? (
              <video
                src={lightbox.media[lightbox.currentIndex]}
                controls
                playsInline
                preload="metadata"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <Image
                src={lightbox.media[lightbox.currentIndex]}
                alt=""
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 text-white text-2xl font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}