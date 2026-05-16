import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

// 1. ფონტის ოპტიმიზაცია
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// 2. Viewport-ის პარამეტრები (Next.js Metadata API სტანდარტი)
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
  description: 'მოძებნეთ და განათავსეთ განცხადებები კახეთში — უძრავი ქონება, გასაყიდი საქონელი, შინაური ცხოველები, პირუტყვი, ფრინველი, აგრო საქონელი, ტექნიკა, საყოფაცხოვრებო ნივთები და სერვისები.',
  keywords: ['კახეთი', 'განცხადებები', 'გასაყიდი საქონელი', 'შინაური ცხოველები', 'პირუტყვი', 'ფრინველი', 'აგრო საქონელი', 'თელავი', 'სიღნაღი', 'უძრავი ქონება', 'ვაკანსიები', 'ტურები'],
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
        url: '/favicon.ico',
        width: 64,
        height: 64,
        alt: 'MYKAKHETI.GE',
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
        <Analytics />
      </body>
    </html>
  );
}
