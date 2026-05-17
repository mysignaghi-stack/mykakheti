'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import type { Database } from '@/types/supabase';
import AdminNav from '../../components/admin/AdminNav';
import { renderAdminPostContent } from '@/app/lib/adminPostContent';

type AdminPost = Database['public']['Tables']['admin_posts']['Row'];

export default function AdminPosts() {
  // All hooks must be called unconditionally and in the same order
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>('');
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'archived'>('all');
  const [visibleCount, setVisibleCount] = useState(30);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [availableAdminMedia, setAvailableAdminMedia] = useState<Set<string> | null>(null);
  const [mediaLookupError, setMediaLookupError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedColor, setSelectedColor] = useState('#f59e0b');
  const emojiPalette = [
    '😀', '😁', '😄', '😅', '😉', '😊', '😍', '😎',
    '🤝', '🙏', '🎉', '🔥', '✅', '⚠️',
  ];
  const vipEmojiPalette = [
    '💎VIP', '👑VIP', '⭐VIP', '🏆VIP', '🛡️VIP', '⚜️VIP'
  ];
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    media_urls: [] as string[],
    media_url: '',
    video_background: false,
    priority: 0,
    link: '',
    position: '',
    badge_text: '',
    is_published: true,
    publish_at: '',
    is_archived: false,
  });

  // All derived hooks (useMemo, useCallback, etc.) must also be before any return
  const filteredPosts = React.useMemo(() => (
    posts.filter((post) => {
      const matchesText = `${post.title ?? ''} ${post.category ?? ''}`
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());
      if (!matchesText) return false;
      if (statusFilter === 'archived') return (post as any).is_archived ?? false;
      if (statusFilter === 'published') return ((post as any).is_published ?? true) && !((post as any).is_archived ?? false);
      if (statusFilter === 'hidden') return ((post as any).is_published === false) && !((post as any).is_archived ?? false);
      return true;
    })
  ), [posts, searchTerm, statusFilter]);

  const visiblePosts = React.useMemo(
    () => filteredPosts.slice(0, visibleCount),
    [filteredPosts, visibleCount]
  );

  // Early returns after all hooks

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchPosts(true, showMediaPreview);
    }
  }, [authLoading, isAdmin, showMediaPreview]);

  useEffect(() => {
    if (!showMediaPreview) {
      setAvailableAdminMedia(null);
      setMediaLookupError('');
      return;
    }

    let isActive = true;
    const loadAdminMedia = async () => {
      try {
        const allPaths = new Set<string>();
        let offset = 0;
        const limit = 1000;

        while (true) {
          const { data, error } = await supabase.storage
            .from('admin-media')
            .list('admin-posts', { limit, offset });

          if (error) throw error;
          const items = data ?? [];
          items.forEach((item) => {
            if (item?.name) {
              allPaths.add(`admin-posts/${item.name}`);
            }
          });

          if (items.length < limit) break;
          offset += limit;
        }

        if (isActive) setAvailableAdminMedia(allPaths);
      } catch (error) {
        console.error('Failed to load admin media list:', error);
        if (isActive) {
          setMediaLookupError('მედიის სია ვერ ჩაიტვირთა');
          setAvailableAdminMedia(null);
        }
      }
    };

    loadAdminMedia();
    return () => {
      isActive = false;
    };
  }, [showMediaPreview]);

  const fetchPosts = async (reset = true, includeMedia = false) => {
    setLoading(true);
    setFetchError('');
    try {
      const page = reset ? 0 : currentPage + 1;
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const selectColumns = includeMedia
        ? '*'
        : 'id,title,content,category,video_background,priority,link,position,badge_text,is_published,publish_at,is_archived,created_at';
      const { data, error } = await (supabase as any)
        .from('admin_posts')
        .select(selectColumns)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      const nextRows = data || [];
      setHasMore(nextRows.length === pageSize);
      setCurrentPage(page);
      setPosts(prev => (reset ? nextRows : [...prev, ...nextRows]));
    } catch (error) {
      console.error('Error fetching posts:', error);
      const message = (error as { message?: string })?.message || 'ვერ ჩაიტვირთა პოსტები';
      setFetchError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('სათაური აუცილებელია');
      return;
    }

    if (formData.is_published && !formData.position) {
      alert('გამოქვეყნებისას აუცილებელია პოზიციის არჩევა (მარცხენა ზედა ან მარჯვენა ზედა).');
      return;
    }

    try {
      const mediaTypeFromUrls = (() => {
        const allUrls = [...formData.media_urls, formData.media_url].filter(Boolean) as string[];
        if (allUrls.length === 0) return null;
        const imageUrls = allUrls.filter((url) => !isVideoUrl(url));
        if (imageUrls.length === 0) return null;
        if (imageUrls.length > 1) return 'gallery';
        return 'image';
      })();
      const mediaTypeFromFiles = (() => {
        if (selectedFiles.length === 0) return null;
        const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return null;
        if (selectedFiles.length > 1) return 'gallery';
        return 'image';
      })();
      const cleanMediaUrls = formData.media_urls.filter((url) => url && !isVideoUrl(url));
      const cleanSingleMediaUrl = formData.media_url && !isVideoUrl(formData.media_url) ? formData.media_url : '';
      const hasMedia = cleanMediaUrls.length > 0 || !!cleanSingleMediaUrl;

      const data = {
        ...formData,
        media_urls: cleanMediaUrls.length > 0 ? cleanMediaUrls : null,
        media_url: cleanSingleMediaUrl || null,
        video_background: false,
        publish_at: formData.publish_at ? new Date(formData.publish_at).toISOString() : null,
        media_type: mediaTypeFromFiles ?? mediaTypeFromUrls ?? (hasMedia ? 'image' : null),
      };

      console.log('Data to insert/update:', data);

      if (editingPost) {
        console.log('Updating post with id via server route:', editingPost.id);
        const res = await fetch('/api/admin/posts/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPost.id, payload: data }),
          credentials: 'same-origin'
        });
        const json = await res.json();
        if (!res.ok) {
          console.error('Update error details:', json);
          throw new Error(json?.error || 'Update failed');
        }
        setEditingPost(null);
      } else {
        console.log('Inserting new post via server route');
        const res = await fetch('/api/admin/posts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'same-origin'
        });
        const json = await res.json();
        if (!res.ok) {
          console.error('Insert error details:', json);
          throw new Error(json?.error || 'Insert failed');
        }
      }

      setFormData({
        title: '',
        content: '',
        category: '',
        media_urls: [],
        media_url: '',
        video_background: false,
        priority: 0,
        link: '',
        position: '',
        badge_text: '',
        is_published: true,
        publish_at: '',
        is_archived: false,
      });

      fetchPosts(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('შეცდომა შენახვისას');
    }
  };

  const insertTextAtCursor = (text: string) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? formData.content.length;
    const end = el.selectionEnd ?? formData.content.length;
    const nextValue = `${formData.content.slice(0, start)}${text}${formData.content.slice(end)}`;
    setFormData(prev => ({ ...prev, content: nextValue }));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + text.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const applyColorToSelection = (color: string) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = formData.content.slice(start, end);
    const openTag = `[[color:${color}]]`;
    const closeTag = '[[/color]]';
    const insertValue = `${openTag}${selected}${closeTag}`;
    const nextValue = `${formData.content.slice(0, start)}${insertValue}${formData.content.slice(end)}`;
    setFormData(prev => ({ ...prev, content: nextValue }));
    requestAnimationFrame(() => {
      el.focus();
      if (selected.length === 0) {
        const caret = start + openTag.length;
        el.setSelectionRange(caret, caret);
      } else {
        const caret = start + insertValue.length;
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const deletePost = async (id: number) => {
    if (!confirm('ნამდვილად გსურთ პოსტის წაშლა?')) return;

    try {
      const res = await fetch('/api/admin/posts/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'same-origin'
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('Delete error details:', json);
        throw new Error(json?.error || 'Delete failed');
      }
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('შეცდომა წაშლისას');
    }
  };

  const togglePublish = async (post: AdminPost) => {
    try {
      const nextValue = !((post as any).is_published ?? true);
      try {
        const res = await fetch('/api/admin/posts/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: post.id, payload: { is_published: nextValue } }),
          credentials: 'same-origin'
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Update failed');
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: nextValue } : p));
      } catch (error) {
        console.error('Toggle publish error:', error);
        alert('სტატუსის შეცვლა ვერ მოხერხდა');
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      alert('სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  const toggleArchive = async (post: AdminPost) => {
    try {
      const nextValue = !((post as any).is_archived ?? false);
      try {
        const res = await fetch('/api/admin/posts/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: post.id, payload: { is_archived: nextValue } }),
          credentials: 'same-origin'
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Update failed');
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_archived: nextValue } : p));
      } catch (error) {
        console.error('Toggle archive error:', error);
        alert('არქივაციის შეცვლა ვერ მოხერხდა');
      }
    } catch (error) {
      console.error('Toggle archive error:', error);
      alert('არქივაციის შეცვლა ვერ მოხერხდა');
    }
  };

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    await fetchPosts(false, showMediaPreview);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return alert('აირჩიეთ ფაილები');

    setUploading(true);
    try {
      const oversized = selectedFiles.find((file) => file.size > 10 * 1024 * 1024);
      if (oversized) {
        alert('ფოტოს მაქსიმალური ზომაა 10MB.');
        return;
      }
      const nonImageFile = selectedFiles.find((file) => !file.type.startsWith('image/'));
      if (nonImageFile) {
        alert('VIP განცხადებებში ვიდეო აღარ იტვირთება. გთხოვთ აირჩიოთ მხოლოდ ფოტოები.');
        return;
      }

      const uploadedUrls: string[] = [];

      const buildSafeFileName = (originalName: string) => {
        const parts = originalName.split('.');
        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
        const base = parts.join('.');
        const safeBase = base
          .normalize('NFKD')
          .replace(/[^a-zA-Z0-9_-]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase();
        return `${safeBase || 'file'}${ext}`;
      };

      for (const file of selectedFiles) {
        // Check file size before upload (10MB limit for API routes)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          alert(`ფაილი "${file.name}" ძალიან დიდია. მაქსიმალური ზომაა 10MB.`);
          continue;
        }

        const safeName = buildSafeFileName(file.name);

        try {
          const uploadBody = new FormData();
          uploadBody.append('file', file, safeName);
          uploadBody.append('bucket', 'admin-media');

          const resp = await fetch('/api/admin/upload', {
            method: 'POST',
            body: uploadBody,
            credentials: 'same-origin',
          });

          const json = await resp.json().catch(() => ({}));
          if (!resp.ok || !json?.publicUrl) {
            throw new Error(json?.error || 'Upload failed');
          }

          uploadedUrls.push(json.publicUrl);
        } catch (err) {
          console.error('Upload failed:', err);
          throw err;
        }
      }

      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, ...uploadedUrls]
      }));

      setSelectedFiles([]);
      alert('ფაილები წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'უცნობი შეცდომა';
      alert(`შეცდომა ატვირთვისას: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const startEdit = async (post: AdminPost) => {
    try {
      let fullPost = post;
      if (post.media_urls === undefined && post.media_url === undefined) {
        const { data, error } = await (supabase as any)
          .from('admin_posts')
          .select('*')
          .eq('id', post.id)
          .single();
        if (error) throw error;
        fullPost = data as AdminPost;
      }

      setEditingPost(fullPost);
      setFormData({
        title: fullPost.title || '',
        content: fullPost.content || '',
        category: fullPost.category || '',
        media_urls: (fullPost.media_urls || []).filter((url) => Boolean(url) && !isVideoUrl(url)),
        media_url: fullPost.media_url && !isVideoUrl(fullPost.media_url) ? fullPost.media_url : '',
        video_background: false,
        priority: fullPost.priority || 0,
        link: fullPost.link || '',
        position: fullPost.position || '',
        badge_text: fullPost.badge_text || '',
        is_published: (fullPost as any).is_published ?? true,
        publish_at: (fullPost as any).publish_at ? new Date((fullPost as any).publish_at).toISOString().slice(0, 16) : '',
        is_archived: (fullPost as any).is_archived ?? false,
      });
    } catch (error) {
      console.error('Failed to load full post for edit:', error);
      alert('რედაქტირება ვერ ჩაიტვირთა');
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      media_urls: [],
      media_url: '',
      video_background: false,
      priority: 0,
      link: '',
      position: '',
      badge_text: '',
      is_published: true,
      publish_at: '',
      is_archived: false,
    });
  };

  const addMediaUrl = () => {
    setFormData(prev => ({
      ...prev,
      media_urls: [...prev.media_urls, '']
    }));
  };

  const updateMediaUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.map((url, i) => i === index ? value : url)
    }));
  };

  const extractAdminMediaPath = (url: string) => {
    const marker = '/storage/v1/object/public/admin-media/';
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
  };

  const removeMediaUrl = async (index: number) => {
    const url = formData.media_urls[index];
    if (!url) {
      setFormData(prev => ({
        ...prev,
        media_urls: prev.media_urls.filter((_, i) => i !== index),
      }));
      return;
    }

    if (!confirm('ნამდვილად გსურთ ამ ფოტოს წაშლა?')) return;

    const storagePath = extractAdminMediaPath(url);
    try {
      if (storagePath) {
        const { error } = await supabase.storage.from('admin-media').remove([storagePath]);
        if (error) throw error;
      }

      setFormData(prev => {
        const nextUrls = prev.media_urls.filter((_, i) => i !== index);
        const nextPrimary = prev.media_url === url ? (nextUrls[0] ?? '') : prev.media_url;
        return {
          ...prev,
          media_urls: nextUrls,
          media_url: nextPrimary,
        };
      });
    } catch (error) {
      console.error('Failed to remove admin media:', error);
      alert('ფოტოს წაშლა ვერ მოხერხდა');
    }
  };

  const removePrimaryMediaUrl = async () => {
    if (!formData.media_url) return;
    if (!confirm('ნამდვილად გსურთ მთავარი ფოტოს წაშლა?')) return;

    const url = formData.media_url;
    const storagePath = extractAdminMediaPath(url);
    try {
      if (storagePath) {
        const { error } = await supabase.storage.from('admin-media').remove([storagePath]);
        if (error) throw error;
      }

      setFormData(prev => ({
        ...prev,
        media_url: '',
        media_urls: prev.media_urls.filter((item) => item !== url),
      }));
    } catch (error) {
      console.error('Failed to remove primary admin media:', error);
      alert('მთავარი ფოტოს წაშლა ვერ მოხერხდა');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const isVideoUrl = (url?: string | null) => !!url && /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(url);

  const getPostMedia = (post: AdminPost) => {
    const allImages = Array.isArray(post.media_urls) ? post.media_urls.filter((url) => Boolean(url) && !isVideoUrl(url)) : [];
    const primary = post.media_url ?? null;
    const combined = primary && !isVideoUrl(primary) ? [primary, ...allImages] : allImages;
    const unique = Array.from(new Set(combined));

    if (!availableAdminMedia || availableAdminMedia.size === 0) return unique;

    const extractStoragePath = (url: string) => {
      const marker = '/storage/v1/object/public/admin-media/';
      const index = url.indexOf(marker);
      if (index === -1) return null;
      return url.slice(index + marker.length);
    };

    return unique.filter((url) => {
      const path = extractStoragePath(url);
      if (!path) return true;
      return availableAdminMedia.has(path);
    });
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <p>ავტორიზაცია...</p>
        </div>
      </main>
    );
  }

  // Early returns after all hooks
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black text-red-400 mb-4">წვდომა აკრძალულია</h1>
          <p className="text-white/60 mb-6">ამ გვერდზე წვდომისთვის საჭიროა ადმინისტრატორის უფლებები.</p>
          <Link href="/admin/login" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl ფონტ-black uppercase">
            ადმინისტრატორად შესვლა
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <p>იტვირთება...</p>
        </div>
      </main>
    );
  }

  // Early returns after all hooks
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic uppercase border-l-4 border-amber-600 pl-4">ადმინისტრატორის განცხადებები</h1>
          <AdminNav />
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">
              {editingPost ? 'პოსტის რედაქტირება' : 'ახალი პოსტი'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">სათაური</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">კატეგორია</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">შინაარსი</label>
                <div className="mb-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/50 font-bold">შრიფტის ფერი:</span>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="h-8 w-10 rounded-lg border border-white/10 bg-transparent"
                      aria-label="ფერის არჩევა"
                    />
                    <button
                      type="button"
                      onClick={() => applyColorToSelection(selectedColor)}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500"
                    >
                      ფერის გამოყენება
                    </button>
                    <span className="text-[11px] text-white/40">მონიშნე ტექსტი და დააჭირე</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/50 font-bold">სმაილები:</span>
                    {emojiPalette.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertTextAtCursor(emoji)}
                        className="px-2 py-1 rounded-lg text-sm bg-white/5 hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/50 font-bold">VIP ემოჯები:</span>
                    {vipEmojiPalette.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertTextAtCursor(emoji)}
                        className="px-2 py-1 rounded-lg text-[11px] font-black bg-white/5 hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  ref={contentRef}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white h-32"
                  required
                />
                <p className="text-[11px] text-white/40 mt-2">ფერადი ტექსტი ინახება მხოლოდ ამ ფორმატით: [[color:#hex]]ტექსტი[[/color]]</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ბმული</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">პოზიცია</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                >
                  <option value="">აირჩიეთ პოზიცია</option>
                  <option value="left_top">მარცხენა ზედა (აგრო ბირჟის დაბლა)</option>
                  <option value="right_top">მარჯვენა ზედა (მარცვლეულის დაბლა)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ბეიჯის ტექსტი</label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="ოფიციალური განცხადება"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">პრიორიტეტი</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ფოტოს URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.media_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                    className="min-w-0 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  />
                  {formData.media_url && (
                    <button
                      type="button"
                      onClick={removePrimaryMediaUrl}
                      className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-500/20"
                    >
                      წაშლა
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-white/60">ატვირთული ფოტოები</label>
                  <button
                    type="button"
                    onClick={addMediaUrl}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black text-white/70 hover:bg-white/10"
                  >
                    URL დამატება
                  </button>
                </div>
                {formData.media_urls.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {formData.media_urls.map((url, index) => (
                      <div key={`${url || 'empty'}-${index}`} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        {url && (
                          <div className="relative mb-2 h-28 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            <Image
                              src={url}
                              alt=""
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateMediaUrl(index, e.target.value)}
                            placeholder="ფოტოს URL"
                            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeMediaUrl(index)}
                            className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-500/20"
                          >
                            წაშლა
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40">
                    ატვირთული ფოტოები არ არის
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">VIP ფოტოების ატვირთვა</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white mb-2"
                />
                {selectedFiles.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-white/60">არჩეული ფაილები: {selectedFiles.length}</p>
                    <button
                      type="button"
                      onClick={uploadFiles}
                      disabled={uploading}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
                    >
                      {uploading ? 'ატვირთვა...' : 'ატვირთვა'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-white/60">გამოქვეყნებული</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">გამოქვეყნების დრო</label>
                <input
                  type="datetime-local"
                  value={formData.publish_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, publish_at: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_archived}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_archived: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-white/60">დაარქივებული</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm">
                  {editingPost ? 'განახლება' : 'შენახვა'}
                </button>
                {editingPost && (
                  <button type="button" onClick={cancelEdit} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm">
                    გაუქმება
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">არსებული პოსტები</h2>

            {fetchError && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {fetchError}
              </div>
            )}
            {showMediaPreview && mediaLookupError && (
              <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                {mediaLookupError}
              </div>
            )}

            <div className="mb-4 space-y-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ძებნა სათაურით ან კატეგორიით"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
              />
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaPreview(prev => !prev);
                    setCurrentPage(0);
                    setHasMore(true);
                    setVisibleCount(30);
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-white/5 text-white/70 hover:bg-white/10"
                >
                  {showMediaPreview ? 'მედიის გამორთვა' : 'მედიის ჩართვა'}
                </button>
                <span className="text-xs text-white/40">მეტი სისწრაფისთვის მედიის გამორთვა</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'all', label: 'ყველა' },
                  { key: 'published', label: 'გამოქვეყნებული' },
                  { key: 'hidden', label: 'დამალული' },
                  { key: 'archived', label: 'დაარქივებული' },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(item.key)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${statusFilter === item.key ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {visiblePosts.map(post => (
                <div key={post.id} className="bg-black/40 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{post.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => startEdit(post)} className="text-xs bg-blue-600 px-2 py-1 rounded">რედაქტირება</button>
                      <button
                        onClick={() => setExpandedPostId(prev => (prev === post.id ? null : post.id))}
                        className="text-xs bg-white/10 px-2 py-1 rounded"
                      >
                        {expandedPostId === post.id ? 'დახურვა' : 'დეტალები'}
                      </button>
                      <button onClick={() => togglePublish(post)} className={`text-xs px-2 py-1 rounded ${((post as any).is_published ?? true) ? 'bg-amber-600' : 'bg-green-600'}`}>
                        {((post as any).is_published ?? true) ? 'დამალვა' : 'გამოჩენა'}
                      </button>
                      <button onClick={() => toggleArchive(post)} className={`text-xs px-2 py-1 rounded ${((post as any).is_archived ?? false) ? 'bg-purple-600' : 'bg-gray-700'}`}>
                        {((post as any).is_archived ?? false) ? 'დარქივიდან ამოღება' : 'დაარქივება'}
                      </button>
                      <button onClick={() => deletePost(post.id)} className="text-xs bg-red-600 px-2 py-1 rounded">წაშლა</button>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{post.category}</p>
                  {showMediaPreview && expandedPostId === post.id && (() => {
                    const media = getPostMedia(post);
                    if (media.length === 0) return null;
                    const primary = media[0];
                    const primaryIsVideo = isVideoUrl(primary);
                    const imageThumbs = media.filter((url) => !isVideoUrl(url));
                    const extraImages = primaryIsVideo ? imageThumbs.slice(0, 2) : imageThumbs.slice(1, 3);
                    const displayedCount = 1 + extraImages.length;
                    const remainingCount = media.length - displayedCount;

                    return (
                      <div className="mb-3 flex items-center gap-3 overflow-hidden">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
                          {primaryIsVideo ? (
                            <div className="flex flex-col items-center justify-center text-[9px] font-black text-white/70">
                              <span className="text-lg">🎥</span>
                              <span>VIDEO</span>
                            </div>
                          ) : (
                            <Image
                              src={primary}
                              alt={post.title ?? ''}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-hidden">
                          {extraImages.map((url, idx) => (
                            <div key={`${post.id}-thumb-${idx}`} className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                              <Image
                                src={url}
                                alt={post.title ?? ''}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[8px] text-white/60 font-black shrink-0">
                              +{remainingCount}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <p className={`text-white/80 text-sm ${expandedPostId === post.id ? '' : 'line-clamp-2'}`}>
                    {renderAdminPostContent(post.content || '')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${(post as any).is_published ? 'bg-green-600' : 'bg-red-600'}`}>
                      {(post as any).is_published ? 'გამოქვეყნებული' : 'დამალული'}
                    </span>
                    {(post as any).is_archived && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-600">დაარქივებული</span>
                    )}
                    {(post as any).publish_at && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-600">
                        {new Date((post as any).publish_at).toLocaleString('ka-GE')}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs mt-2">{post.created_at ? new Date(post.created_at).toLocaleDateString('ka-GE') : 'თარიღი არ არის'}</p>
                </div>
              ))}
              {filteredPosts.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  პოსტები არ არის
                </div>
              )}
            </div>
            {visibleCount < filteredPosts.length && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                >
                  მეტის ნახვა ({filteredPosts.length - visibleCount})
                </button>
              </div>
            )}
            {hasMore && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={loadMorePosts}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                >
                  სერვერიდან დამატებითი პოსტები
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
