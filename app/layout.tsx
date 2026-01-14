import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// 1. ფონტის ოპტიმიზაცია
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// 2. Viewport-ის პარამეტრები (Next.js 15 სტანდარტი)
export const viewport: Viewport = {
  themeColor: '#050510',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// 3. სრულყოფილი SEO მეტამონაცემები
export const metadata: Metadata = {
  title: {
    default: 'MYKAKHETI.GE - კახეთის ერთიანი ციფრული პლატფორმა',
    template: '%s | MYKAKHETI.GE'
  },
  description: 'იპოვე, გაყიდე და განავითარე საქმიანობა კახეთში. შენი გზამკვლევი შესაძლებლობების სამყაროში: უძრავი ქონება, მარნები, ვაკანსიები და სერვისები.',
  keywords: ['კახეთი', 'განცხადებები', 'თელავი', 'სიღნაღი', 'მარნები', 'უძრავი ქონება', 'ვაკანსიები', 'ტურები'],
  authors: [{ name: 'MYKAKHETI Team' }],
  metadataBase: new URL('https://mykakheti.ge'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MYKAKHETI.GE - კახეთის ერთიანი პლატფორმა',
    description: 'იპოვე, გაყიდე და განავითარე საქმიანობა კახეთში.',
    url: 'https://mykakheti.ge',
    siteName: 'MyKakheti',
    images: [
      {
        url: 'https://i.ibb.co/N2L6XvX/image.jpg',
        width: 1200,
        height: 630,
        alt: 'MYKAKHETI.GE Preview',
      },
    ],
    locale: 'ka_GE',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico', // დარწმუნდით, რომ ფაილი გაქვთ public საქაღალდეში
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" className={`${inter.variable} scroll-smooth`}>
      <body className="bg-[#050510] text-white antialiased selection:bg-amber-500 selection:text-white">
        {/* აქ შეგიძლიათ დაამატოთ გლობალური კომპონენტები, მაგ: Navbar ან Footer, თუ ისინი ყველა გვერდზე გინდათ */}
        {children}
      </body>
    </html>
  );
}