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

  const title = `${ad.title} - ${ad.price} ₾`;
  const description = ad.description?.substring(0, 160) || 'იპოვე საუკეთესო შეთავაზებები კახეთში';

  return {
    title: `${title} | MYKAKHETI.GE`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://mykakheti.ge/announcements/${id}`,
      siteName: 'MYKAKHETI.GE',
      images: [{ url: ad.image_url || '/images/default-og.jpg', width: 1200, height: 630 }],
      locale: 'ka_GE',
      type: 'article',
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