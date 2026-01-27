'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import type { Database } from '@/types/supabase';
import AdminNav from '../../components/admin/AdminNav';

type AdminPost = Database['public']['Tables']['admin_posts']['Row'];

export default function AdminPosts() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>('');
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'archived'>('all');
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

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchPosts();
    }
  }, [authLoading, isAdmin]);

  const fetchPosts = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await (supabase as any)
        .from('admin_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;
      setPosts(data || []);
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

    try {
      const hasMedia = formData.media_urls.length > 0 || !!formData.media_url;
      const mediaTypeFromUrls = (() => {
        const allUrls = [...formData.media_urls, formData.media_url].filter(Boolean) as string[];
        if (allUrls.length === 0) return null;
        const isVideo = allUrls.some((url) => /\.(mp4|mov|avi|webm)$/i.test(url));
        if (allUrls.length > 1) return 'gallery';
        return isVideo ? 'video' : 'image';
      })();
      const mediaTypeFromFiles = (() => {
        if (selectedFiles.length === 0) return null;
        if (selectedFiles.length > 1) return 'gallery';
        return selectedFiles[0].type.startsWith('video/') ? 'video' : 'image';
      })();

      const data = {
        ...formData,
        media_urls: formData.media_urls.length > 0 ? formData.media_urls : null,
        publish_at: formData.publish_at ? new Date(formData.publish_at).toISOString() : null,
        media_type: mediaTypeFromFiles ?? mediaTypeFromUrls ?? (hasMedia ? 'image' : null),
      };

      console.log('Data to insert/update:', data);

      if (editingPost) {
        console.log('Updating post with id:', editingPost.id);
        const { error } = await (supabase as any)
          .from('admin_posts')
          .update(data)
          .eq('id', editingPost.id);

        if (error) {
          console.error('Update error details:', JSON.stringify(error));
          throw error;
        }
        setEditingPost(null);
      } else {
        console.log('Inserting new post');
        const { error } = await (supabase as any)
          .from('admin_posts')
          .insert(data);

        if (error) {
          console.error('Insert error details:', JSON.stringify(error));
          throw error;
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

      fetchPosts();
    } catch (error) {
      console.error('Submit error:', JSON.stringify(error));
      alert('შეცდომა შენახვისას');
    }
  };

  const deletePost = async (id: number) => {
    if (!confirm('ნამდვილად გსურთ პოსტის წაშლა?')) return;

    try {
      const { error } = await (supabase as any)
        .from('admin_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('შეცდომა წაშლისას');
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return alert('აირჩიეთ ფაილები');

    setUploading(true);
    try {
      const oversized = selectedFiles.find((file) => file.size > 10 * 1024 * 1024);
      if (oversized) {
        alert('ვიდეოს მაქსიმალური ზომაა 10MB. ამჟამად მხოლოდ მცირე ფაილების ატვირთვაა შესაძლებელი.');
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
          alert(`ფაილი "${file.name}" ძალიან დიდია. მაქსიმალური ზომაა 10MB. ამჟამად მხოლოდ მცირე ფაილების ატვირთვაა შესაძლებელი.`);
          continue;
        }

        const safeName = buildSafeFileName(file.name);
        const fileName = `admin-posts/${Date.now()}-${safeName}`;

        const uploadData = new FormData();
        uploadData.append('file', file, file.name);
        uploadData.append('fileName', fileName);
        uploadData.append('bucket', 'admin-media');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            const contentType = response.headers.get('content-type');
            console.log('Response content-type:', contentType);
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              console.log('Error data:', errorData);
              errorMessage = errorData.error || errorMessage;
            } else {
              const textResponse = await response.text();
              console.log('Non-JSON response:', textResponse.substring(0, 500));
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
          } catch (e) {
            console.error('Error parsing response:', e);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Success result:', result);

        uploadedUrls.push(result.url);
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

  const startEdit = (post: AdminPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      category: post.category || '',
      media_urls: post.media_urls || [],
      media_url: post.media_url || '',
      video_background: post.video_background || false,
      priority: post.priority || 0,
      link: post.link || '',
      position: post.position || '',
      badge_text: post.badge_text || '',
      is_published: (post as any).is_published ?? true,
      publish_at: (post as any).publish_at ? new Date((post as any).publish_at).toISOString().slice(0, 16) : '',
      is_archived: (post as any).is_archived ?? false,
    });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const getPostMedia = (post: AdminPost) => {
    const allImages = Array.isArray(post.media_urls) ? post.media_urls.filter(Boolean) : [];
    const primary = post.media_url ?? null;
    const combined = primary ? [primary, ...allImages] : allImages;
    return Array.from(new Set(combined));
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

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black text-red-400 mb-4">წვდომა აკრძალულია</h1>
          <p className="text-white/60 mb-6">ამ გვერდზე წვდომისთვის საჭიროა ადმინისტრატორის უფლებები.</p>
          <Link href="/admin/login" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase">
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

  const filteredPosts = posts.filter((post) => {
    const matchesText = `${post.title ?? ''} ${post.category ?? ''}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    if (!matchesText) return false;
    if (statusFilter === 'archived') return (post as any).is_archived ?? false;
    if (statusFilter === 'published') return ((post as any).is_published ?? true) && !((post as any).is_archived ?? false);
    if (statusFilter === 'hidden') return ((post as any).is_published === false) && !((post as any).is_archived ?? false);
    return true;
  });

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
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white h-32"
                  required
                />
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
                <label className="block text-sm font-bold text-white/60 mb-2">მედია URL</label>
                <input
                  type="url"
                  value={formData.media_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ფოტოების და ვიდეოების ატვირთვა</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
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
                    checked={formData.video_background}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_background: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-white/60">ვიდეო ფონი</span>
                </label>
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

            <div className="mb-4 space-y-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ძებნა სათაურით ან კატეგორიით"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
              />
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
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-black/40 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{post.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(post)} className="text-xs bg-blue-600 px-2 py-1 rounded">რედაქტირება</button>
                      <button onClick={() => deletePost(post.id)} className="text-xs bg-red-600 px-2 py-1 rounded">წაშლა</button>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{post.category}</p>
                  {(() => {
                    const media = getPostMedia(post);
                    return media.length > 0 ? (
                      <div className="mb-3 flex items-center gap-3 overflow-hidden">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                          <Image
                            src={media[0]}
                            alt={post.title ?? ''}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-hidden">
                          {media.slice(1, 3).map((url, idx) => (
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
                          {media.length > 3 && (
                            <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[8px] text-white/60 font-black shrink-0">
                              +{media.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  <p className="text-white/80 text-sm line-clamp-2">{post.content}</p>
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
          </div>
        </div>
      </div>
    </main>
  );
}