import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ad } from '../lib/types';
import type { Tables } from '@/types/helpers';

type AnnouncementRow = Tables<'announcements'>;

const mapRowToAd = (row: AnnouncementRow): Ad => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  price: row.price,
  currency: row.currency ?? null,
  location: row.location,
  category: row.category,
  image_url: row.image_url ?? null,
  all_images: row.all_images ?? null,
  contact_info: row.contact_info ?? null,
  phone: row.phone ?? null,
  is_approved: row.is_approved ?? null,
  is_archived: row.is_archived ?? null,
  created_at: row.created_at ?? null,
  expires_at: (row as AnnouncementRow & { expires_at?: string | null }).expires_at ?? null,
  user_id: (row as AnnouncementRow & { user_id?: string | null }).user_id ?? null,
});

export function useAdsData() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    const { data } = await supabase.from('announcements').select('*').eq('is_approved', true).order('created_at', { ascending: false });
    if (data) setAds(data.map(mapRowToAd));
    setLoading(false);
  };

  const archiveAd = async (id: string) => {
    const { error } = await supabase.from('announcements').update({ is_archived: true }).eq('id', id);
    if (!error) setAds(ads => ads.map(ad => ad.id === id ? { ...ad, is_archived: true } : ad));
    return error;
  };

  const restoreAd = async (id: string) => {
    const { error } = await supabase.from('announcements').update({ is_archived: false }).eq('id', id);
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
