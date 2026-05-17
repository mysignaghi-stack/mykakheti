import { supabase } from '../../lib/supabase';
import { createClient } from '../../lib/supabase-server';
import { Metadata } from 'next';
import AnnouncementDetailsClient from './AnnouncementDetailsClient';
import { buildAnnouncementSeoDescription, extractAnnouncementId, formatAnnouncementPrice, getAnnouncementPath } from '@/app/lib/seo';

// ✅ ტიპების განახლება: params ახლა არის Promise
type Props = {
  params: Promise<{ id: string }>;
};

// ✅ დინამიური SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ხარვეზის გასწორება: ჯერ ველოდებით params-ს
  const { id } = await params;
  const announcementId = extractAnnouncementId(id);

  const supabaseServer = await createClient();
  const { data: ad } = await (supabaseServer as any)
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single();

  if (!ad) return { title: 'განცხადება | MYKAKHETI.GE' };

  const price = formatAnnouncementPrice(ad);
  const location = ad.location ? ` ${ad.location}` : '';
  const title = `${ad.title}${location} | MyKakheti.ge`;
  const description = buildAnnouncementSeoDescription(ad);
  const canonicalPath = getAnnouncementPath(ad);
  const canonicalUrl = `https://mykakheti.ge${canonicalPath}`;

  // Pick best available image: all_images first, then image_url, then no image
  const allImages: string[] = Array.isArray(ad.all_images) ? ad.all_images.filter(Boolean) : [];
  const mainImage: string | null = allImages[0] || ad.image_url || null;

  const ogImages = mainImage
    ? [{ url: mainImage, width: 1200, height: 630, alt: ad.title }]
    : [];

  return {
    title,
    description: description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: title,
      description: description,
      url: canonicalUrl,
      siteName: 'MYKAKHETI.GE',
      images: ogImages,
      locale: 'ka_GE',
      type: 'article',
    },
    other: {
      'product:price:amount': ad.price ? String(ad.price) : '',
      'product:price:currency': ad.currency === 'USD' ? 'USD' : 'GEL',
      'announcement:category': ad.category ?? '',
      'announcement:location': ad.location ?? '',
      'announcement:price': price,
    },
    twitter: {
      card: mainImage ? 'summary_large_image' : 'summary',
      title: title,
      description: description,
      images: mainImage ? [mainImage] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  // ხარვეზის გასწორება: აქაც ველოდებით params-ს
  const { id } = await params;
  const announcementId = extractAnnouncementId(id);

  // მონაცემების წამოღება სერვერზე
  const supabaseServer = await createClient();
  const { data: ad } = await (supabaseServer as any)
    .from('announcements')
    .select('*')
    .eq('id', announcementId)
    .single();

  return <AnnouncementDetailsClient initialAd={ad} />;
}
