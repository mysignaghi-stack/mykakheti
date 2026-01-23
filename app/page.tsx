import HomePageClient from './components/home/HomePageClient';
import { fetchHomePageData } from './lib/homeData';

export const revalidate = 30;

export default async function HomePage() {
  const data = await fetchHomePageData();

  return (
    <HomePageClient
      initialAds={data.ads}
      initialAgroData={data.agroData}
      initialWeatherData={data.weatherData}
      initialAdminPosts={data.adminPosts}
      initialBgImage={data.backgroundUrl}
      initialMarqueeText={data.marqueeText}
      initialCommunity={data.community}
    />
  );
}
