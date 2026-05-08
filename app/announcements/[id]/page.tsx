import { supabase } from '../../lib/supabase';
import { createClient } from '../../lib/supabase-server';
import { Metadata } from 'next';
import AnnouncementDetailsClient from './AnnouncementDetailsClient';

// ✅ ტიპების განახლება: params ახლა არის Promise
type Props = {
  params: Promise<{ id: string }>;
};

// ✅ დინამიური SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ხარვეზის გასწორება: ჯერ ველოდებით params-ს
  const { id } = await params;

  const supabaseServer = await createClient();
  const { data: ad } = await (supabaseServer as any)
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (!ad) return { title: 'განცხადება | MYKAKHETI.GE' };

  const priceStr = ad.price && ad.price !== '0' ? ` - ${ad.price} ${ad.currency === 'USD' ? '$' : '₾'}` : '';
  const title = `${ad.title}${priceStr}`;
  const description = ad.description?.substring(0, 160) || `${ad.category || 'განცხადება'} კახეთში - mykakheti.ge`;

  // Pick best available image: all_images first, then image_url, then no image
  const allImages: string[] = Array.isArray(ad.all_images) ? ad.all_images.filter(Boolean) : [];
  const mainImage: string | null = allImages[0] || ad.image_url || null;

  const ogImages = mainImage
    ? [{ url: mainImage, width: 1200, height: 630, alt: ad.title }]
    : [];

  return {
    title: `${title} | MYKAKHETI.GE`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://mykakheti.ge/announcements/${id}`,
      siteName: 'MYKAKHETI.GE',
      images: ogImages,
      locale: 'ka_GE',
      type: 'article',
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

  // მონაცემების წამოღება სერვერზე
  const supabaseServer = await createClient();
  const { data: ad } = await (supabaseServer as any)
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();

  return <AnnouncementDetailsClient initialAd={ad} />;
}