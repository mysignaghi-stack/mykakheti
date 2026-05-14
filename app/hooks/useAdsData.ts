import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ad } from '../lib/types';
import { isAgroSubmission, isCommunityAnnouncement } from '../lib/specialAnnouncements';
import type { Tables } from '@/types/helpers';

type AnnouncementRow = Tables<'announcements'>;

const mapRowToAd = (row: AnnouncementRow): Ad => {
  const allImages = Array.isArray(row.all_images)
    ? row.all_images
    : typeof row.all_images === 'string'
      ? [row.all_images]
      : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    price: row.price,
    currency: row.currency ?? null,
    location: row.location,
    category: row.category,
    image_url: row.image_url ?? null,
    all_images: allImages,
    contact_info: row.contact_info ?? null,
    phone: row.phone ?? null,
    is_approved: row.is_approved ?? null,
    is_archived: row.is_archived ?? null,
    created_at: row.created_at ?? null,
    expires_at: null, // expires_at column doesn't exist in the table
    user_id: row.user_id ?? null,
  };
};

export function useAdsData(initialAds: Ad[] = []) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [loading, setLoading] = useState(false);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        if (typeof error === 'object') {
          // @ts-ignore
          console.error('Supabase error details:', { code: error.code, message: error.message, hint: error.hint, details: error.details });
        }
        throw error;
      }

      if (data) {
        const now = Date.now();
        const filtered = data.filter((row) => {
          const extra = row as AnnouncementRow & { publish_at?: string | null };
          const publishAt = extra.publish_at;
          const publishOk = !publishAt || new Date(publishAt).getTime() <= now;
          // Note: expires_at column doesn't exist in the table, so we skip expiration filtering
          return publishOk && !isAgroSubmission(row) && !isCommunityAnnouncement(row);
        });
        setAds(filtered.map(mapRowToAd));
      }
    } catch (error) {
      console.error('Failed to fetch announcements', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAds(initialAds);
  }, [initialAds]);

  const archiveAd = async (id: string) => {
    const { error } = await (supabase.from('announcements') as any).update({ is_archived: true }).eq('id', id);
    if (!error) setAds(ads => ads.map(ad => ad.id === id ? { ...ad, is_archived: true } : ad));
    return error;
  };

  const restoreAd = async (id: string) => {
    const { error } = await (supabase.from('announcements') as any).update({ is_archived: false }).eq('id', id);
    if (!error) setAds(ads => ads.map(ad => ad.id === id ? { ...ad, is_archived: false } : ad));
    return error;
  };

  const deleteAd = async (ad: Ad) => {
    if (ad.all_images && ad.all_images.length > 0) {
      const filesToRemove = ad.all_images.map(url => url.split('/').pop()!).filter(Boolean);
      if (filesToRemove.length > 0) await supabase.storage.from('announcements').remove(filesToRemove);
    } else if (ad.image_url) {
      const fileName = ad.image_url.split('/').pop();
      if (fileName) await supabase.storage.from('announcements').remove([fileName]);
    }
    await supabase.from('announcements').delete().eq('id', ad.id);
    setAds(ads => ads.filter(a => a.id !== ad.id));
  };

  return {
    ads,
    loading,
    fetchAds,
    archiveAd,
    restoreAd,
    deleteAd,
  };
}
