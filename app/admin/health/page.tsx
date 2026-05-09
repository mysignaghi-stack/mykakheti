'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { supabase } from '../../lib/supabase';
import AdminNav from '../../components/admin/AdminNav';

type HealthCheck = {
  name: string;
  status: 'pending' | 'pass' | 'fail';
  message: string;
  details?: any;
};

type CategoryMismatch = {
  id: string;
  title: string;
  category: string;
};

type OrphanedFile = {
  name: string;
  url: string;
};

const COMMUNITY_CATEGORIES = ['დაკარგული/ნაპოვნი', 'ოსტატი'] as const;

export default function HealthPage() {
  const { isAdmin, user, loading: authLoading } = useAdminAuth();
  const [checks, setChecks] = useState<Record<string, HealthCheck>>({});
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);

  const updateCheck = (key: string, status: HealthCheck['status'], message: string, details?: any) => {
    setChecks(prev => ({
      ...prev,
      [key]: { name: key, status, message, details }
    }));
  };

  const runHealthCheck = async () => {
    setLoading(true);
    setChecks({});

    // Auth & Security
    await checkAuthSecurity();

    // Database Integrity
    await checkDatabaseIntegrity();

    // Storage & Media
    await checkStorageMedia();

    // API Routes
    await checkApiRoutes();

    setLoading(false);
  };

  const checkAuthSecurity = async () => {
    // User metadata
    if (user) {
      updateCheck('user_metadata', 'pass', 'მომხმარებელი ავტორიზებულია', {
        email: user.email,
        id: user.id,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        created_at: user.created_at,
      });
    } else {
      updateCheck('user_metadata', 'fail', 'მომხმარებელი არ არის ავტორიზებული');
    }

    // Admin status
    updateCheck('admin_status', isAdmin ? 'pass' : 'fail', isAdmin ? 'ადმინისტრატორი' : 'არ არის ადმინისტრატორი');
  };

  const checkDatabaseIntegrity = async () => {
    try {
      // Announcements stats
      const { data: pending, error: pendingError } = await supabase
        .from('announcements')
        .select('id', { count: 'exact' })
        .eq('is_approved', false);

      const { data: archived, error: archivedError } = await supabase
        .from('announcements')
        .select('id', { count: 'exact' })
        .eq('is_archived', true);

      if (pendingError || archivedError) {
        updateCheck('announcements_stats', 'fail', 'შეცდომა სტატისტიკის მიღებისას');
      } else {
        updateCheck('announcements_stats', 'pass', `მოლოდინში: ${pending?.length || 0}, არქივირებული: ${archived?.length || 0}`);
      }

      // Category mismatch
      const { data: allAnnouncements, error: catError } = await (supabase as any)
        .from('announcements')
        .select('id, title, category');

      if (catError) {
        updateCheck('category_mismatch', 'fail', 'შეცდომა კატეგორიების შემოწმებისას');
      } else {
        const mismatches = allAnnouncements?.filter((ann: any) => !COMMUNITY_CATEGORIES.includes(ann.category)) || [];
        updateCheck('category_mismatch', mismatches.length > 0 ? 'fail' : 'pass',
          mismatches.length > 0 ? `ნაპოვნია ${mismatches.length} შეუსაბამო კატეგორია` : 'ყველა კატეგორია სწორია',
          mismatches);
      }

      // Admin posts
      const { data: adminPosts, error: adminError } = await (supabase as any)
        .from('admin_posts')
        .select('id, title, media_url, publish_at');

      if (adminError) {
        updateCheck('admin_posts', 'fail', 'შეცდომა ადმინ პოსტების შემოწმებისას');
      } else {
        const invalidPosts = adminPosts?.filter((post: any) =>
          !post.media_url ||
          !post.publish_at ||
          isNaN(new Date(post.publish_at).getTime())
        ) || [];

        updateCheck('admin_posts', invalidPosts.length > 0 ? 'fail' : 'pass',
          invalidPosts.length > 0 ? `ნაპოვნია ${invalidPosts.length} არასწორი პოსტი` : 'ყველა პოსტი სწორია',
          invalidPosts);
      }
    } catch (err) {
      updateCheck('database_integrity', 'fail', `შეცდომა: ${err}`);
    }
  };

  const checkStorageMedia = async () => {
    try {
      // List files in announcements bucket
      const { data: files, error: listError } = await supabase.storage
        .from('announcements')
        .list('', { limit: 1000 });

      if (listError) {
        updateCheck('storage_files', 'fail', 'შეცდომა ფაილების სიის მიღებისას');
        return;
      }

      // Get all image URLs from database
      const { data: announcements, error: dbError } = await (supabase as any)
        .from('announcements')
        .select('all_images');

      if (dbError) {
        updateCheck('storage_files', 'fail', 'შეცდომა ბაზის მონაცემების მიღებისას');
        return;
      }

      const dbImages = new Set<string>();
      announcements?.forEach((ann: any) => {
        if (Array.isArray(ann.all_images)) {
          ann.all_images.forEach((img: string) => {
            if (typeof img === 'string') {
              const filename = img.split('/').pop();
              if (filename) dbImages.add(filename);
            }
          });
        }
      });

      const orphanedFiles = files?.filter(file =>
        file.name && !dbImages.has(file.name)
      ) || [];

      updateCheck('orphaned_files', orphanedFiles.length > 0 ? 'fail' : 'pass',
        orphanedFiles.length > 0 ? `ნაპოვნია ${orphanedFiles.length} ობოლი ფაილი` : 'ყველა ფაილი კავშირებულია',
        orphanedFiles);

      // Check all_images validity
      const invalidImages = announcements?.filter((ann: any) =>
        ann.all_images && (!Array.isArray(ann.all_images) || ann.all_images.some((img: any) => typeof img !== 'string'))
      ) || [];

      updateCheck('all_images_validity', invalidImages.length > 0 ? 'fail' : 'pass',
        invalidImages.length > 0 ? `ნაპოვნია ${invalidImages.length} არასწორი all_images` : 'ყველა all_images ვალიდურია',
        invalidImages);
    } catch (err) {
      updateCheck('storage_media', 'fail', `შეცდომა: ${err}`);
    }
  };

  const checkApiRoutes = async () => {
    // Test /api/admin/announcements/pending
    try {
      const pendingResp = await fetch('/api/admin/announcements/pending', { cache: 'no-store' });
      updateCheck('api_pending', pendingResp.ok ? 'pass' : 'fail',
        pendingResp.ok ? 'OK' : `შეცდომა: ${pendingResp.status} ${pendingResp.statusText}`);
    } catch (err) {
      updateCheck('api_pending', 'fail', `შეცდომა: ${err}`);
    }

    // Test /api/upload (this might need a POST, but for health check we can try GET)
    try {
      const uploadResp = await fetch('/api/upload', { method: 'HEAD' });
      updateCheck('api_upload', uploadResp.ok ? 'pass' : 'fail',
        uploadResp.ok ? 'OK' : `შეცდომა: ${uploadResp.status} ${uploadResp.statusText}`);
    } catch (err) {
      updateCheck('api_upload', 'fail', `შეცდომა: ${err}`);
    }
  };

  const cleanupOrphanedFiles = async () => {
    setCleanupLoading(true);
    try {
      const resp = await fetch('/api/admin/cleanup-orphaned-files', { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        alert(`წარმატებით წაიშალა ${data.deleted} ფაილი, ვერ წაიშალა ${data.failed}`);
        runHealthCheck(); // Refresh checks
      } else {
        alert('შეცდომა ფაილების წაშლისას');
      }
    } catch (err) {
      alert('შეცდომა: ' + err);
    } finally {
      setCleanupLoading(false);
    }
  };

  const fixInvalidPosts = async () => {
    setFixLoading(true);
    try {
      // Get invalid posts
      const { data: adminPosts, error } = await (supabase as any)
        .from('admin_posts')
        .select('id, title, media_url, publish_at');

      if (error) {
        alert('შეცდომა პოსტების მიღებისას');
        return;
      }

      const invalidPosts = adminPosts?.filter((post: any) =>
        !post.media_url ||
        !post.publish_at ||
        isNaN(new Date(post.publish_at).getTime())
      ) || [];

      if (invalidPosts.length === 0) {
        alert('არ არის არასწორი პოსტები');
        return;
      }

      // Fix each invalid post
      const updates = invalidPosts.map((post: any) => ({
        id: post.id,
        media_url: post.media_url || 'https://via.placeholder.com/400x300?text=No+Image',
        publish_at: post.publish_at && !isNaN(new Date(post.publish_at).getTime()) ? post.publish_at : new Date().toISOString(),
      }));

      const updatePromises = updates.map((update: any) =>
        fetch('/api/admin/posts/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: update.id, payload: { media_url: update.media_url, publish_at: update.publish_at } }),
          credentials: 'same-origin'
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      alert(`გამოსწორდა ${successful} პოსტი, ვერ გამოსწორდა ${failed}`);
      runHealthCheck(); // Refresh checks
    } catch (err) {
      alert('შეცდომა: ' + err);
    } finally {
      setFixLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      runHealthCheck();
    }
  }, [authLoading, isAdmin]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#050510] text-white p-6 flex items-center justify-center">იტვირთება...</div>;
  }

  if (!isAdmin) {
    return <div className="min-h-screen bg-[#050510] text-white p-6 flex items-center justify-center">ადმინისტრატორის უფლებები საჭიროა</div>;
  }

  return (
    <main className="min-h-screen bg-[#050510] text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminNav />
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black uppercase italic tracking-tight">სისტემური აუდიტი</h1>
          <button
            onClick={runHealthCheck}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-600 text-black hover:bg-amber-500 transition disabled:opacity-50"
          >
            {loading ? 'შემოწმება...' : 'განახლება'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth & Security */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1f] p-5 space-y-4">
            <h2 className="text-lg font-black uppercase text-amber-400">Auth & Security</h2>
            <div className="space-y-3">
              {Object.values(checks).filter(c => c.name.includes('user_metadata') || c.name.includes('admin_status')).map(check => (
                <div key={check.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${check.status === 'pass' ? 'bg-green-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <div className="font-semibold">{check.name}</div>
                    <div className="text-sm text-white/70">{check.message}</div>
                    {check.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-amber-400">დეტალები</summary>
                        <pre className="text-xs bg-black/20 p-2 rounded mt-1 overflow-auto">{JSON.stringify(check.details, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Integrity */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1f] p-5 space-y-4">
            <h2 className="text-lg font-black uppercase text-amber-400">Database Integrity</h2>
            <div className="space-y-3">
              {Object.values(checks).filter(c => c.name.includes('announcements_stats') || c.name.includes('category_mismatch') || c.name.includes('admin_posts')).map(check => (
                <div key={check.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${check.status === 'pass' ? 'bg-green-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <div className="font-semibold">{check.name.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-white/70">{check.message}</div>
                    {check.details && check.details.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-amber-400">დეტალები ({check.details.length})</summary>
                        <div className="text-xs bg-black/20 p-2 rounded mt-1 max-h-32 overflow-auto">
                          {check.details.map((item: any, idx: number) => (
                            <div key={idx} className="mb-1">
                              {item.title || item.name || item.id} - {item.category || item.url || ''}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {Object.values(checks).some(c => c.name === 'admin_posts' && c.status === 'fail') && (
              <button
                onClick={fixInvalidPosts}
                disabled={fixLoading}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition disabled:opacity-50"
              >
                {fixLoading ? 'გასწორება...' : 'Fix Invalid Posts'}
              </button>
            )}
          </div>

          {/* Storage & Media */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1f] p-5 space-y-4">
            <h2 className="text-lg font-black uppercase text-amber-400">Storage & Media</h2>
            <div className="space-y-3">
              {Object.values(checks).filter(c => c.name.includes('orphaned_files') || c.name.includes('all_images_validity')).map(check => (
                <div key={check.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${check.status === 'pass' ? 'bg-green-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <div className="font-semibold">{check.name.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-white/70">{check.message}</div>
                    {check.details && check.details.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-amber-400">დეტალები ({check.details.length})</summary>
                        <div className="text-xs bg-black/20 p-2 rounded mt-1 max-h-32 overflow-auto">
                          {check.details.map((item: any, idx: number) => (
                            <div key={idx} className="mb-1">
                              {item.name || item.id}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {Object.values(checks).some(c => c.name === 'admin_posts' && c.status === 'fail') && (
              <button
                onClick={fixInvalidPosts}
                disabled={fixLoading}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition disabled:opacity-50"
              >
                {fixLoading ? 'გასწორება...' : 'Fix Invalid Posts'}
              </button>
            )}
          </div>

          {/* API Route Monitor */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1f] p-5 space-y-4">
            <h2 className="text-lg font-black uppercase text-amber-400">API Route Monitor</h2>
            <div className="space-y-3">
              {Object.values(checks).filter(c => c.name.includes('api_')).map(check => (
                <div key={check.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${check.status === 'pass' ? 'bg-green-500' : check.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1">
                    <div className="font-semibold">{check.name.replace('api_', '/api/')}</div>
                    <div className="text-sm text-white/70">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
