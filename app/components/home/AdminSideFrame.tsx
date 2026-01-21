'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { supabase } from '../../lib/supabase';
// წავშალეთ AdminPost იმპორტი lib/types-დან კონფლიქტის თავიდან ასაცილებლად
import { Ad } from '../../lib/types'; 
import type { Database } from '@/types/supabase';

// ტიპებს ვიღებთ პირდაპირ ბაზის სტრუქტურიდან, რომ 100% ზუსტი იყოს
type AdminPost = Database['public']['Tables']['admin_posts']['Row'];
type AdminPostInsertPayload = Database['public']['Tables']['admin_posts']['Insert'];

interface AdminSideFrameProps {
  post: AdminPost | undefined;
  position: string;
  isAdmin: boolean;
  onRefresh: () => void;
  contentType?: 'post' | 'announcement';
  announcement?: Ad | null;
  onContentTypeChange?: (type: 'post' | 'announcement') => void;
}

export default function AdminSideFrame({ post, position, isAdmin, onRefresh, contentType = 'post', announcement, onContentTypeChange }: AdminSideFrameProps) {
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
          const processedFile = file.type.startsWith('image/') ? await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
          }) : file;

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
        const { error } = await (supabase
          .from('admin_posts') as any)
          .insert([postData]);
        if (error) throw error;
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

  return (
    <div className="w-full h-auto bg-gradient-to-br from-amber-900/60 via-black/40 to-amber-700/30 rounded-[36px] border-4 border-amber-400/40 shadow-[0_0_32px_8px_rgba(255,191,0,0.15)] p-5 ring-2 ring-amber-400/30 relative animate-in fade-in duration-700">
      {/* Header with controls */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-2">
          {isAdmin && onContentTypeChange && (
            <button
              onClick={() => onContentTypeChange(contentType === 'post' ? 'announcement' : 'post')}
              className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded text-xs font-bold hover:bg-amber-600 hover:text-white transition-all"
              title={contentType === 'post' ? 'განცხადებაზე გადართვა' : 'პოსტზე გადართვა'}
            >
              {contentType === 'post' ? '📢' : '📄'}
            </button>
          )}
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
      {contentType === 'announcement' && announcement ? (
        <div className="space-y-3">
          <h4 className="text-amber-500 font-black text-lg italic">{announcement.title}</h4>
          <p className="text-white/80 text-sm leading-relaxed">{announcement.description}</p>
          {announcement.image_url && (
            <div className="relative mt-4 w-full h-32 overflow-hidden rounded-xl">
              <Image
                src={announcement.image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain"
                priority
              />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-amber-600/20 text-amber-400 rounded text-xs font-bold">{announcement.category}</span>
            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-bold">{announcement.location}</span>
          </div>
        </div>
      ) : post ? (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="text-amber-500 font-black text-lg italic flex-1">{post.title}</h4>
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
            <p className="text-white/80 text-sm leading-relaxed">
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
              <div className="text-center mt-2">
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
          {(post.media_urls && post.media_urls.length > 0) || (post as any).media_url ? (
            <div className="mt-3">
              {post.media_type === 'video' ? (
                <video
                  src={(post.media_urls?.[0] || (post as any).media_url)!}
                  controls={!post.video_background}
                  autoPlay={post.video_background || false}
                  muted={post.video_background || false}
                  loop={post.video_background || false}
                  className={`w-full ${post.video_background ? 'h-48' : 'h-32'} object-contain rounded-xl`}
                />
              ) : post.media_type === 'gallery' ? (
                <div className="mt-3">
                  <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation
                    pagination={{ clickable: true }}
                    className="w-full h-32 rounded-xl"
                  >
                    {(post.media_urls || [(post as any).media_url]).filter(Boolean).map((url: string, idx: number) => (
                      <SwiperSlide key={idx}>
                        <div className="relative w-full h-full">
                          <Image
                            src={url!}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
                            className="object-contain rounded-xl"
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className="relative w-full h-32">
                  <Image
                    src={(post.media_urls?.[0] || (post as any).media_url)!}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-contain rounded-xl"
                  />
                </div>
              )}
            </div>
          ) : null}
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-white/40 font-mono">
              {new Date(post.created_at).toLocaleDateString('ka-GE')}
            </div>
            {post.priority && post.priority > 0 && (
              <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                P{post.priority}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-white/50 text-sm italic text-center py-8">
          <span className="text-2xl block mb-2">📄</span>
          <p>კონტენტი არ არის დამატებული</p>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
            >
              + დაამატე კონტენტი
            </button>
          )}
        </div>
      )}
    </div>
  );
}