import type { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getAnnouncementPath } from '@/app/lib/seo';

const SITE_URL = 'https://mykakheti.ge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/announcements',
    '/community',
    '/community/masters',
    '/community/lost-found',
    '/contact',
    '/rules',
    '/privacy',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const supabase = getSupabaseAdmin();
  if (!supabase) return staticRoutes;

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id,title,location,updated_at,created_at,is_approved,is_archived,publish_at')
    .eq('is_approved', true)
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false })
    .limit(1000);

  const currentTime = Date.now();
  const announcementRoutes: MetadataRoute.Sitemap = (announcements ?? [])
    .filter((ad: any) => !ad.publish_at || new Date(ad.publish_at).getTime() <= currentTime)
    .map((ad: any) => ({
      url: `${SITE_URL}${getAnnouncementPath(ad)}`,
      lastModified: ad.updated_at || ad.created_at || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const { data: masters } = await supabase
    .from('masters')
    .select('id,created_at,is_approved')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(500);

  const masterRoutes: MetadataRoute.Sitemap = (masters ?? []).map((master: any) => ({
    url: `${SITE_URL}/community/masters/${master.id}`,
    lastModified: master.created_at || now,
    changeFrequency: 'weekly',
    priority: 0.65,
  }));

  return [...staticRoutes, ...announcementRoutes, ...masterRoutes];
}
