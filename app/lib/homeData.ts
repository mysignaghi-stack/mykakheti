import { DEFAULT_AGRO_DATA, WEATHER_POINTS } from './constants';
import { getSupabaseAdmin } from './supabaseAdmin';
import type { Ad, AgroItem, WeatherItem } from './types';
import type { Tables } from '@/types/helpers';

type AnnouncementRow = Tables<'announcements'> & { publish_at?: string | null; expires_at?: string | null };
type AdminPostRow = Tables<'admin_posts'>;
type AgroRow = Tables<'agro_prices'>;
type WeatherRow = {
  name?: string | null;
  lat?: number | null;
  lon?: number | null;
  temp?: number | null;
  icon?: string | null;
  glow?: string | null;
  created_at?: string | null;
};
type ObituaryRow = Tables<'obituaries'>;
type LostFoundRow = Tables<'lost_found'>;
type MasterRow = Tables<'masters'>;
type CongratsRow = Tables<'congratulations'>;
type SiteSettingRow = Tables<'site_settings'>;

type SettledResponse<T> = PromiseSettledResult<{ data: T[] | null; error: unknown }>;

const FALLBACK_MARQUEE = 'საიტი მუშაობს სატესტო რეჟიმში';

const extractData = <T>(result: SettledResponse<T>, label: string): T[] => {
  if (result.status === 'fulfilled') {
    const { data, error } = result.value;
    if (error) {
      // Silence missing-table noise until those tables are created
      if ((error as any)?.code === 'PGRST205') return [];
      console.error(`[homeData] ${label} query error`, error);
      return [];
    }
    return data ?? [];
  }
  console.error(`[homeData] ${label} query rejected`, result.reason);
  return [];
};

const mapAnnouncementRow = (row: AnnouncementRow): Ad => ({
  id: row.id,
  title: row.title ?? '',
  description: row.description ?? null,
  price: row.price ? String(row.price) : '',
  currency: row.currency ?? null,
  location: row.location ?? '',
  category: row.category ?? 'სხვა',
  image_url: row.image_url ?? null,
  all_images: Array.isArray(row.all_images) ? row.all_images : null,
  contact_info: row.contact_info ?? null,
  phone: row.phone ?? null,
  is_approved: row.is_approved ?? null,
  is_archived: row.is_archived ?? null,
  created_at: row.created_at ?? null,
  expires_at: (row as AnnouncementRow & { expires_at?: string | null }).expires_at ?? null,
  user_id: (row as AnnouncementRow & { user_id?: string | null }).user_id ?? null,
});

const mapAgroRow = (row: AgroRow): AgroItem => ({
  id: row.id,
  name: row.name ?? '',
  unit: row.unit ?? '',
  price: row.price !== null && row.price !== undefined ? String(row.price) : '',
  color: row.color ?? 'text-amber-400',
  icon: row.icon ?? '🍇',
  category: row.category ?? 'other',
  details: Array.isArray(row.details) ? row.details : null,
});

const mapWeatherRow = (row: WeatherRow): WeatherItem => ({
  name: row.name ?? '',
  lat: row.lat ?? 0,
  lon: row.lon ?? 0,
  temp: row.temp ?? 0,
  icon: row.icon ?? '☀️',
  glow: row.glow ?? 'text-yellow-400',
});

const buildFallbackWeather = (): WeatherItem[] => (
  WEATHER_POINTS.map((point, index) => ({
    name: point.name,
    lat: point.lat,
    lon: point.lon,
    temp: 18 + index * 2,
    icon: '☀️',
    glow: 'text-yellow-400',
  }))
);

export interface CommunityDataset {
  obituaries: ObituaryRow[];
  lostFound: LostFoundRow[];
  masters: MasterRow[];
  congratulations: CongratsRow[];
}

export interface HomePageData {
  ads: Ad[];
  agroData: AgroItem[];
  weatherData: WeatherItem[];
  adminPosts: AdminPostRow[];
  backgroundUrl: string | null;
  marqueeText: string;
  community: CommunityDataset;
}

export const fetchHomePageData = async (): Promise<HomePageData> => {
  const supabase = getSupabaseAdmin();

  const results = await Promise.allSettled([
    supabase
      .from('announcements')
      .select('id,title,description,price,currency,location,category,image_url,all_images,contact_info,phone,is_approved,is_archived,created_at,publish_at,user_id')
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('admin_posts')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('agro_prices')
      .select('*'),
    supabase
      .from('weather' as any)
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('site_settings')
      .select('key,value')
      .in('key', ['background_url', 'marquee_text']),
    supabase
      .from('obituaries')
      .select('id,full_name,funeral_at,funeral_place,image_url,is_approved,created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('lost_found')
      .select('id,title,location,image_url,kind,is_approved,created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('masters')
      .select('id,full_name,profession,location,description,rating_avg,is_approved,created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('congratulations')
      .select('id,sender_name,recipient_name,message,image_url,occasion,created_at,is_approved')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  const [
    announcementsResult,
    adminPostsResult,
    agroResult,
    weatherResult,
    siteSettingsResult,
    obituariesResult,
    lostFoundResult,
    mastersResult,
    congratsResult,
  ] = results;

  const rawAnnouncements: AnnouncementRow[] = extractData<AnnouncementRow>(
    announcementsResult as SettledResponse<AnnouncementRow>,
    'announcements'
  );
  const adminPosts: AdminPostRow[] = extractData<AdminPostRow>(
    adminPostsResult as SettledResponse<AdminPostRow>,
    'admin_posts'
  ).filter((post) => post.priority !== -1);
  const agroRows: AgroRow[] = extractData<AgroRow>(agroResult as SettledResponse<AgroRow>, 'agro_prices');
  const weatherRows: WeatherRow[] = extractData<WeatherRow>(weatherResult as any, 'weather');
  const siteSettings: SiteSettingRow[] = extractData<SiteSettingRow>(
    siteSettingsResult as SettledResponse<SiteSettingRow>,
    'site_settings'
  );
  const obituaries: ObituaryRow[] = extractData<ObituaryRow>(obituariesResult as SettledResponse<ObituaryRow>, 'obituaries');
  const lostFound: LostFoundRow[] = extractData<LostFoundRow>(
    lostFoundResult as SettledResponse<LostFoundRow>,
    'lost_found'
  );
  const masters: MasterRow[] = extractData<MasterRow>(mastersResult as SettledResponse<MasterRow>, 'masters');
  const congratulations: CongratsRow[] = extractData<CongratsRow>(
    congratsResult as SettledResponse<CongratsRow>,
    'congratulations'
  );

  const now = Date.now();
  const ads = rawAnnouncements
    .filter((row) => {
      const publishAt = (row as AnnouncementRow & { publish_at?: string | null }).publish_at;
      const expiresAt = (row as AnnouncementRow & { expires_at?: string | null }).expires_at;
      const publishOk = !publishAt || new Date(publishAt).getTime() <= now;
      const expiresOk = !expiresAt || new Date(expiresAt).getTime() > now;
      return (row.is_approved ?? false) && !(row.is_archived ?? false) && publishOk && expiresOk;
    })
    .map(mapAnnouncementRow);

  const agroData = agroRows.length > 0 ? agroRows.map(mapAgroRow) : DEFAULT_AGRO_DATA;
  const weatherData = weatherRows.length > 0 ? weatherRows.map(mapWeatherRow) : buildFallbackWeather();

  const backgroundUrl = siteSettings.find((row) => row.key === 'background_url')?.value ?? null;
  const marqueeText = siteSettings.find((row) => row.key === 'marquee_text')?.value ?? FALLBACK_MARQUEE;

  return {
    ads,
    agroData,
    weatherData,
    adminPosts,
    backgroundUrl,
    marqueeText,
    community: {
      obituaries,
      lostFound,
      masters,
      congratulations,
    },
  };
};
