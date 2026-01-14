import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ad } from '../lib/types';

export function useAdsData() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    const { data } = await supabase.from('announcements').select('*').eq('is_approved', true).order('created_at', { ascending: false });
    if (data) setAds(data);
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
    setAds,
    loading,
    fetchAds,
    archiveAd,
    restoreAd,
    deleteAd,
  };
}
