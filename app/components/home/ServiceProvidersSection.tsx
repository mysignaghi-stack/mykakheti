'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Tables } from '@/types/helpers';
import type { Ad } from '@/app/lib/types';

type MasterRow = Tables<'masters'>;

type ServiceProvidersSectionProps = {
  providers: MasterRow[];
  count?: number;
  serviceRequests?: Ad[];
  serviceRequestsCount?: number;
};

const SERVICE_DESCRIPTION = 'თუ კახეთში სთავაზობთ რაიმე სახის მომსახურებას — ხართ ხელოსანი, ტექნიკოსი, მძღოლი, მასწავლებელი, ფოტოგრაფი, გიდი, დასუფთავების სპეციალისტი ან სხვა მომსახურების მიმწოდებელი — შეგიძლიათ დარეგისტრირდეთ და განათავსოთ ინფორმაცია თქვენი სერვისის შესახებ.';
const SERVICE_HINT = 'მიუთითეთ რას სთავაზობთ მომხმარებელს, რომელ მუნიციპალიტეტში მუშაობთ, გაქვთ თუ არა გამოძახებით მომსახურება, საკონტაქტო ნომერი და საჭიროების შემთხვევაში ფოტოები.';
type ServiceSortOption = 'newest' | 'rating' | 'name';

const SERVICE_GROUPS = [
  {
    category: 'სარემონტო და სამშენებლო მომსახურება',
    services: ['სამშენებლო', 'სამშენებლო მომსახურება', 'სახლის რემონტი', 'ბინის რემონტი', 'კოსმეტიკური რემონტი', 'კაპიტალური რემონტი', 'მშენებლობა', 'სახურავის შეკეთება', 'ფასადის სამუშაოები', 'კედლის გალესვა', 'კაფელ-მეტლახის დაგება', 'იატაკის დაგება', 'ლამინატის დაგება', 'პარკეტის დაგება', 'თაბაშირ-მუყაოს სამუშაოები', 'შპალერის გაკვრა', 'შეღებვა', 'კარ-ფანჯრის მონტაჟი', 'ლითონის კონსტრუქციები', 'ჭიშკარი / მოაჯირი / კიბე', 'შედუღების სამუშაოები'],
  },
  {
    category: 'ელექტროობა და ტექნიკური სამუშაოები',
    services: ['ელექტრიკოსი', 'ელექტროგაყვანილობის მონტაჟი', 'ელექტროგაყვანილობის შეკეთება', 'მრიცხველის / ავტომატის მონტაჟი', 'განათების მონტაჟი', 'კამერების მონტაჟი', 'სიგნალიზაციის მონტაჟი', 'ინტერნეტ-ქსელის გაყვანა', 'ჭკვიანი სახლის მოწყობილობები'],
  },
  {
    category: 'სანტექნიკა და გათბობა',
    services: ['სანტექნიკოსი', 'წყლის მილის შეკეთება', 'კანალიზაციის გაწმენდა', 'ონკანის / უნიტაზის / ნიჟარის მონტაჟი', 'წყლის გამაცხელებლის მონტაჟი', 'გათბობის სისტემის მონტაჟი', 'რადიატორების მონტაჟი', 'ქვაბის შეკეთება', 'გაზის გამათბობლის მონტაჟი', 'იატაკქვეშა გათბობა'],
  },
  {
    category: 'საყოფაცხოვრებო ტექნიკის შეკეთება',
    services: ['მაცივრის შეკეთება', 'სარეცხი მანქანის შეკეთება', 'ჭურჭლის სარეცხი მანქანის შეკეთება', 'ტელევიზორის შეკეთება', 'გაზქურის შეკეთება', 'ელექტროქურის შეკეთება', 'წყლის გამაცხელებლის შეკეთება', 'კონდიციონერის შეკეთება', 'მტვერსასრუტის შეკეთება', 'მცირე საყოფაცხოვრებო ტექნიკის შეკეთება'],
  },
  {
    category: 'კომპიუტერი, ტელეფონი და ელექტრონიკა',
    services: ['კომპიუტერის შეკეთება', 'ლეპტოპის შეკეთება', 'ტელეფონის შეკეთება', 'პლანშეტის შეკეთება', 'პროგრამების დაყენება', 'Windows-ის დაყენება', 'მონაცემების აღდგენა', 'პრინტერის შეკეთება', 'ქსელის გამართვა', 'კამერების / DVR-ის გამართვა', 'ვებგვერდის შექმნა', 'სოციალური ქსელების მართვა'],
  },
  {
    category: 'ავტოსერვისი',
    services: ['ავტომობილის შეკეთება', 'ძრავის შეკეთება', 'სავალი ნაწილის შეკეთება', 'ელექტრიკოსი ავტომობილებისთვის', 'დიაგნოსტიკა', 'ზეთის შეცვლა', 'საბურავების შეცვლა', 'ვულკანიზაცია', 'ავტომობილის ევაკუატორი', 'ავტოსამრეცხაო', 'ქიმწმენდა', 'ავტო-კონდიციონერის შეკეთება', 'ავტო-მღებავი', 'ავტო-ჟეშტი', 'მინის შეცვლა'],
  },
  {
    category: 'ტრანსპორტი და გადაზიდვები',
    services: ['გადაზიდვები', 'ტაქსი', 'კერძო მძღოლი', 'ტვირთის გადაზიდვა', 'ავეჯის გადაზიდვა', 'სამშენებლო მასალის გადაზიდვა', 'სოფლის მეურნეობის პროდუქტის გადაზიდვა', 'მიკროავტობუსით მომსახურება', 'მგზავრთა გადაყვანა', 'ევაკუატორი', 'ტრაქტორი / სპეციალური ტექნიკა', 'მიწის დამუშავების ტექნიკა'],
  },
  {
    category: 'დასუფთავება და მოვლა',
    services: ['სახლის დასუფთავება', 'ოფისის დასუფთავება', 'ეზოს დასუფთავება', 'სამშენებლო ნარჩენების გატანა', 'ავეჯის ქიმწმენდა', 'ხალიჩის წმენდა', 'ფანჯრების წმენდა', 'სადარბაზოს დასუფთავება', 'დეზინფექცია', 'მწერებისა და მღრღნელების საწინააღმდეგო მომსახურება'],
  },
  {
    category: 'ეზო, ბაღი და სოფლის მეურნეობა',
    services: ['ბაღის მოვლა', 'ეზოს მოწყობა', 'ხეების გასხვლა', 'ვენახის მოვლა', 'ვენახის შეწამვლა', 'მიწის დამუშავება', 'ბალახის გაკრეჭა', 'სარწყავი სისტემის მონტაჟი', 'ჭის ამოწმენდა', 'ჭაბურღილის მოწყობა', 'სათბურის მოწყობა', 'აგრონომის მომსახურება', 'ვეტერინარის მომსახურება'],
  },
  {
    category: 'სილამაზე და თავის მოვლა',
    services: ['თმის სტილისტი', 'დალაქი', 'ვიზაჟისტი', 'მანიკური / პედიკური', 'კოსმეტოლოგი', 'მასაჟი', 'წარბების კორექცია', 'წამწამების დაგრძელება', 'ტატუ / პირსინგი', 'სახლში გამოძახებით სილამაზის მომსახურება'],
  },
  {
    category: 'ჯანმრთელობა და კეთილდღეობა',
    services: ['სამედიცინო', 'სამედიცინო მომსახურება', 'ექთნის მომსახურება', 'მომვლელი', 'ხანდაზმულის მოვლა', 'ბავშვის მოვლა', 'რეაბილიტაციის სპეციალისტი', 'მასაჟისტი', 'ფსიქოლოგი', 'ლოგოპედი', 'დიეტოლოგი'],
  },
  {
    category: 'განათლება და რეპეტიტორები',
    services: ['განათლება', 'დაწყებითი კლასების მომზადება', 'ქართული ენა და ლიტერატურა', 'მათემატიკა', 'ინგლისური ენა', 'რუსული ენა', 'ისტორია', 'ქიმია', 'ფიზიკა', 'ბიოლოგია', 'კომპიუტერული უნარები', 'მუსიკა', 'ცეკვა', 'ხატვა', 'აბიტურიენტების მომზადება', 'ონლაინ გაკვეთილები'],
  },
  {
    category: 'იურიდიული, საბუღალტრო და საოფისე მომსახურება',
    services: ['იურიდიული კონსულტაცია', 'ხელშეკრულების შედგენა', 'განცხადებების / საჩივრების მომზადება', 'ბუღალტრული მომსახურება', 'საგადასახადო კონსულტაცია', 'დოკუმენტების აკრეფა', 'თარგმნა', 'ნოტარიული მომსახურების მოძიება', 'საბანკო / სადაზღვევო კონსულტაცია'],
  },
  {
    category: 'ღონისძიებები და ფოტო-ვიდეო მომსახურება',
    services: ['სარიტუალო მომსახურება', 'ფოტოგრაფი', 'ვიდეოგადაღება', 'დრონით გადაღება', 'მონტაჟი', 'ქორწილის ორგანიზება', 'დაბადების დღის ორგანიზება', 'მუსიკოსი / დიჯეი', 'წამყვანი', 'დეკორაცია', 'ტორტი / ტკბილეული', 'ქეითერინგი', 'დარბაზის გაფორმება', 'მანქანის მორთვა'],
  },
  {
    category: 'საკვები, კულინარია და ქეითერინგი',
    services: ['რესტორნები', 'რესტორნის მომსახურება', 'სახლში მომზადებული საჭმელი', 'ტორტები', 'ხაჭაპური / ლობიანი', 'ტრადიციული კერძები', 'ქეითერინგი', 'სადღესასწაულო სუფრა', 'ღვინის დეგუსტაცია', 'მარანი / მასპინძლობა', 'კულინარიული მომსახურება გამოძახებით'],
  },
  {
    category: 'ტურიზმი და მასპინძლობა',
    services: ['ტურიზმი', 'ტურისტული', 'ტურისტული მომსახურება', 'სასტუმროები', 'სასტუმროს მომსახურება', 'გიდის მომსახურება', 'საოჯახო სასტუმრო', 'დღიური ბინა', 'ტურების ორგანიზება', 'მძღოლი ტურისტებისთვის', 'ღვინის ტური', 'ცხენით გასეირნება', 'პიკნიკის სივრცე', 'კემპინგი', 'ლაშქრობა', 'კახეთის ღირსშესანიშნაობების ტური'],
  },
  {
    category: 'ბავშვებთან დაკავშირებული მომსახურება',
    services: ['ძიძა', 'ბავშვის მოვლა', 'საბავშვო ღონისძიებები', 'ანიმატორი', 'ბავშვთა ფოტოგრაფი', 'რეპეტიტორი', 'ლოგოპედი', 'საბავშვო ტორტი', 'საბავშვო სივრცე'],
  },
  {
    category: 'ცხოველები',
    services: ['ვეტერინარია', 'ვეტერინარი', 'ცხოველების მოვლა', 'ძაღლის გაწვრთნა', 'ცხოველის დაბანა / გაკრეჭა', 'დროებითი დატოვება', 'დაკარგული ცხოველის მოძიებაში დახმარება', 'საკვების / აქსესუარების მიწოდება'],
  },
  {
    category: 'უძრავ ქონებასთან დაკავშირებული მომსახურება',
    services: ['მაკლერი', 'ბინის გაქირავებაში დახმარება', 'მიწის ნაკვეთის შეფასება', 'აზომვითი სამუშაოები', 'საკადასტრო ნახაზები', 'მშენებლობის კონსულტაცია', 'ინტერიერის დიზაინი', 'არქიტექტურული მომსახურება'],
  },
  {
    category: 'სხვა მომსახურება',
    services: ['მომსახურება', 'სამუშაო ჯგუფი', 'სხვადასხვა სერვისი', 'ერთჯერადი დახმარება', 'ხელით სამუშაო', 'დამხმარე მუშა', 'ნივთების აწყობა', 'მცირე საყოფაცხოვრებო საქმეები', 'დროებითი მომსახურება', 'სხვა სერვისი'],
  },
];

const SERVICE_CATEGORY_FALLBACKS = SERVICE_GROUPS.map((group) => group.category);
const SERVICE_FALLBACKS = SERVICE_GROUPS.flatMap((group) => group.services);
const HEALTH_SERVICE_WARNING = 'საიტზე განთავსებული ინფორმაცია არ წარმოადგენს სამედიცინო რეკომენდაციას. მომსახურების მიღებამდე გადაამოწმეთ სპეციალისტის კვალიფიკაცია.';

const SERVICE_LOCATION_FALLBACKS = [
  'თელავი',
  'გურჯაანი',
  'სიღნაღი',
  'ყვარელი',
  'ლაგოდეხი',
  'ახმეტა',
  'დედოფლისწყარო',
  'საგარეჯო',
];

const normalizeServiceText = (value: string | null | undefined) => (
  (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
);

const splitStoredList = (value: string | null | undefined) => (
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

const buildOptions = (values: Array<string | null | undefined>, fallbacks: string[]) => {
  return Array.from(new Set(
    [
      ...values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)),
      ...fallbacks,
    ]
  ));
};

function PremiumServiceIconCluster() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto h-20 w-full max-w-[15.5rem] shrink md:mx-0 md:h-28 md:w-[16rem] md:max-w-none xl:h-32 xl:w-[18rem] 2xl:h-36 2xl:w-[21rem]"
    >
      <div className="absolute inset-x-8 inset-y-2 rounded-full bg-amber-400/10 blur-2xl md:inset-3" />
      <div className="absolute right-4 top-3 h-16 w-28 rounded-full bg-slate-200/5 blur-2xl md:right-0 md:top-2 md:h-24 md:w-40" />

      <div className="service-3d-icon service-3d-icon--tool left-1 top-8 h-8 w-8 md:left-0 md:top-[3.15rem] md:h-10 md:w-10 lg:h-11 lg:w-11">
        <svg viewBox="0 0 64 64" role="presentation">
          <defs>
            <linearGradient id="serviceToolMetal" x1="14" y1="9" x2="51" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F8E7BC" />
              <stop offset="0.48" stopColor="#B8862B" />
              <stop offset="1" stopColor="#493013" />
            </linearGradient>
            <linearGradient id="serviceToolEdge" x1="17" y1="11" x2="47" y2="55" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F3F7FA" />
              <stop offset="1" stopColor="#697580" />
            </linearGradient>
          </defs>
          <path d="M44.7 9.8 54 19.1l-8.2 8.2-4.4-4.4-7.9 7.9 4.9 4.9-20 20-9.3-9.3 20-20 4.9 4.9 7.9-7.9-5.4-5.4 8.2-8.2Z" fill="url(#serviceToolMetal)" />
          <path d="m17.8 51.4-5.1-5.1 16.7-16.8 5.1 5.2-16.7 16.7Z" fill="url(#serviceToolEdge)" opacity=".9" />
          <path d="m45.3 14 4.5 4.5-4.5 4.5-4.5-4.5 4.5-4.5Z" fill="#FFF3CA" opacity=".45" />
        </svg>
      </div>

      <div className="service-3d-icon service-3d-icon--bolt left-[4.3rem] top-1 h-7 w-7 md:left-[5rem] md:top-0 md:h-9 md:w-9 lg:left-[5.75rem] lg:h-10 lg:w-10">
        <svg viewBox="0 0 64 64" role="presentation">
          <defs>
            <linearGradient id="serviceBolt" x1="23" y1="6" x2="42" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF5CE" />
              <stop offset="0.45" stopColor="#F5B82E" />
              <stop offset="1" stopColor="#6D430A" />
            </linearGradient>
          </defs>
          <path d="M36.6 5.6 17.8 35h13.7l-4 23.4L46.2 28H32.8l3.8-22.4Z" fill="url(#serviceBolt)" />
          <path d="M31.4 34.9h-8l10-15.6-2.1 12.6h8.2l-7.4 12 1.7-9Z" fill="#FFF7DD" opacity=".36" />
        </svg>
      </div>

      <div className="service-3d-icon service-3d-icon--camera left-[8.65rem] top-6 h-9 w-9 md:left-[10rem] md:top-[2.15rem] md:h-12 md:w-12 lg:left-[11.4rem] lg:h-14 lg:w-14">
        <svg viewBox="0 0 64 64" role="presentation">
          <defs>
            <linearGradient id="serviceCameraBody" x1="12" y1="16" x2="55" y2="55" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38424E" />
              <stop offset="0.5" stopColor="#151A22" />
              <stop offset="1" stopColor="#05070B" />
            </linearGradient>
            <radialGradient id="serviceCameraLens" cx="0" cy="0" r="1" gradientTransform="translate(34 37) rotate(90) scale(14)">
              <stop stopColor="#FFF1BD" />
              <stop offset="0.46" stopColor="#C99735" />
              <stop offset="1" stopColor="#111820" />
            </radialGradient>
          </defs>
          <path d="M18.2 20.3h9.1l3.2-4.5h13.1l3 4.5h4.5c4 0 7.1 3.1 7.1 7.1V47c0 4-3.1 7.1-7.1 7.1H18.2c-4 0-7.1-3.1-7.1-7.1V27.4c0-4 3.1-7.1 7.1-7.1Z" fill="url(#serviceCameraBody)" />
          <circle cx="34.7" cy="37.7" r="12.4" fill="url(#serviceCameraLens)" />
          <circle cx="34.7" cy="37.7" r="6.4" fill="#080B10" opacity=".82" />
          <path d="M18.7 25.6h7.4" stroke="#F3C766" strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
        </svg>
      </div>

      <div className="service-3d-icon service-3d-icon--pipe bottom-0 left-[4.7rem] h-8 w-8 md:left-[5.35rem] md:h-10 md:w-10 lg:left-[6.2rem] lg:h-11 lg:w-11">
        <svg viewBox="0 0 64 64" role="presentation">
          <defs>
            <linearGradient id="servicePipe" x1="14" y1="13" x2="51" y2="51" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EEF4F8" />
              <stop offset="0.44" stopColor="#8C9AA7" />
              <stop offset="1" stopColor="#27313A" />
            </linearGradient>
          </defs>
          <path d="M15 18.5h22.5c6.1 0 11 4.9 11 11V46H38.3V29.8c0-1-.8-1.8-1.8-1.8H15V18.5Z" fill="url(#servicePipe)" />
          <path d="M11.3 15h9.8v16.5h-9.8V15Zm23.2 28.2h17.4v10.3H34.5V43.2Z" fill="#D9A13A" />
          <path d="M19.7 21h17.8c4.6 0 8.4 3.7 8.4 8.4v12" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity=".25" />
        </svg>
      </div>

    </div>
  );
}

export default function ServiceProvidersSection({
  providers = [],
  count = 0,
  serviceRequests = [],
  serviceRequestsCount = 0,
}: ServiceProvidersSectionProps) {
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('ყველა კატეგ.');
  const [selectedService, setSelectedService] = useState('ყველა სერვისი');
  const [selectedServiceLocation, setSelectedServiceLocation] = useState('ყველა კახეთი');
  const [serviceSort, setServiceSort] = useState<ServiceSortOption>('newest');
  const [serviceSliderIndex, setServiceSliderIndex] = useState(0);
  const [serviceCardsPerView, setServiceCardsPerView] = useState(3);
  const [requestPage, setRequestPage] = useState(0);
  const [requestCardsPerPage, setRequestCardsPerPage] = useState(4);
  const [showServiceCategoryDropdown, setShowServiceCategoryDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showServiceLocationDropdown, setShowServiceLocationDropdown] = useState(false);
  const serviceCategoryRef = useRef<HTMLDivElement | null>(null);
  const serviceRef = useRef<HTMLDivElement | null>(null);
  const serviceLocationRef = useRef<HTMLDivElement | null>(null);
  const serviceSliderRef = useRef<HTMLDivElement | null>(null);
  const serviceTouchStartX = useRef<number | null>(null);
  const requestTouchStartX = useRef<number | null>(null);
  const buildServiceShareUrl = (providerId: string) => {
    if (typeof window === 'undefined') return `/community/masters/${providerId}`;
    return `${window.location.origin}/community/masters/${providerId}`;
  };

  const shareServiceProvider = async (provider: MasterRow) => {
    const url = buildServiceShareUrl(provider.id);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: provider.full_name ?? 'სერვისი', url });
        return;
      } catch {
        // Fall back to clipboard below.
      }
    }
    await navigator.clipboard.writeText(url);
  };

  const shareServiceProviderToFacebook = (providerId: string) => {
    const url = buildServiceShareUrl(providerId);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, 'fb-share', 'width=600,height=400');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (serviceCategoryRef.current && !serviceCategoryRef.current.contains(target)) {
        setShowServiceCategoryDropdown(false);
      }
      if (serviceRef.current && !serviceRef.current.contains(target)) {
        setShowServiceDropdown(false);
      }
      if (serviceLocationRef.current && !serviceLocationRef.current.contains(target)) {
        setShowServiceLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setServiceSliderIndex(0);
  }, [selectedService, selectedServiceCategory, selectedServiceLocation, serviceSearch, serviceSort]);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 480) setServiceCardsPerView(1);
      else if (window.innerWidth < 640) setServiceCardsPerView(2);
      else if (window.innerWidth < 1024) setServiceCardsPerView(3);
      else if (window.innerWidth < 1280) setServiceCardsPerView(4);
      else setServiceCardsPerView(5);
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    const updateRequestCardsPerPage = () => {
      if (window.innerWidth < 640) setRequestCardsPerPage(1);
      else if (window.innerWidth < 1024) setRequestCardsPerPage(2);
      else setRequestCardsPerPage(4);
    };
    updateRequestCardsPerPage();
    window.addEventListener('resize', updateRequestCardsPerPage);
    return () => window.removeEventListener('resize', updateRequestCardsPerPage);
  }, []);

  useEffect(() => {
    setRequestPage(0);
  }, [serviceRequests.length, requestCardsPerPage]);

  useEffect(() => {
    const el = serviceSliderRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth / serviceCardsPerView;
    el.scrollTo({ left: serviceSliderIndex * cardWidth, behavior: 'smooth' });
  }, [serviceSliderIndex, serviceCardsPerView]);

  const serviceCategories = useMemo(
    () => ['ყველა კატეგ.', ...buildOptions(providers.flatMap((provider) => splitStoredList(provider.category)), SERVICE_CATEGORY_FALLBACKS)],
    [providers]
  );

  const serviceOptions = useMemo(() => {
    const categoryServices = SERVICE_GROUPS.find((group) => group.category === selectedServiceCategory)?.services;
    const providerServices = providers
      .filter((provider) => selectedServiceCategory === 'ყველა კატეგ.' || splitStoredList(provider.category).includes(selectedServiceCategory))
      .flatMap((provider) => splitStoredList(provider.profession));

    return [
      'ყველა სერვისი',
      ...buildOptions(providerServices, categoryServices ?? SERVICE_FALLBACKS),
    ];
  }, [providers, selectedServiceCategory]);

  const serviceLocations = useMemo(
    () => ['ყველა კახეთი', ...buildOptions(providers.map((provider) => provider.location), SERVICE_LOCATION_FALLBACKS)],
    [providers]
  );

  const filteredProviders = useMemo(() => {
    const query = normalizeServiceText(serviceSearch);
    const nextProviders = providers.filter((provider) => {
      const matchesSearch = !query ||
        normalizeServiceText(provider.full_name).includes(query) ||
        normalizeServiceText(provider.profession).includes(query) ||
        normalizeServiceText(provider.category).includes(query) ||
        normalizeServiceText(provider.location).includes(query) ||
        normalizeServiceText(provider.description).includes(query);
      const matchesCategory = selectedServiceCategory === 'ყველა კატეგ.' || splitStoredList(provider.category).includes(selectedServiceCategory);
      const matchesService = selectedService === 'ყველა სერვისი' || splitStoredList(provider.profession).includes(selectedService);
      const matchesLocation = selectedServiceLocation === 'ყველა კახეთი' || normalizeServiceText(provider.location).includes(normalizeServiceText(selectedServiceLocation));

      return matchesSearch && matchesCategory && matchesService && matchesLocation;
    });

    nextProviders.sort((a, b) => {
      if (serviceSort === 'rating') return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
      if (serviceSort === 'name') return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'ka');
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });

    return nextProviders;
  }, [providers, selectedService, selectedServiceCategory, selectedServiceLocation, serviceSearch, serviceSort]);

  const showHealthWarning = selectedServiceCategory === 'ჯანმრთელობა და კეთილდღეობა' ||
    SERVICE_GROUPS.find((group) => group.category === 'ჯანმრთელობა და კეთილდღეობა')?.services.includes(selectedService);
  const serviceMaxSliderIndex = Math.max(0, filteredProviders.length - serviceCardsPerView);
  const requestMaxPage = Math.max(0, Math.ceil(serviceRequests.length / requestCardsPerPage) - 1);
  const safeRequestPage = Math.min(requestPage, requestMaxPage);
  const visibleServiceRequests = serviceRequests.slice(
    safeRequestPage * requestCardsPerPage,
    safeRequestPage * requestCardsPerPage + requestCardsPerPage
  );

  return (
    <section className="w-full mt-8">
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-xl sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-12 h-44 w-44 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-4xl text-left lg:pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-[0.18em] text-amber-200">
                სერვისები / მომსახურების მიმწოდებლები
              </h2>
              <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">
                {count} სერვისი
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {SERVICE_DESCRIPTION}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/50">
              {SERVICE_HINT}
            </p>
          </div>
          <div className="flex min-w-0 max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-[34rem] xl:max-w-[36rem] 2xl:max-w-none">
            <PremiumServiceIconCluster />
            <Link
              href="/community/masters/submit"
              className="inline-flex w-full max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-3 text-[10px] font-black uppercase tracking-[0.05em] text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/25 sm:w-auto sm:text-[10px] 2xl:px-5 2xl:text-[11px] 2xl:tracking-[0.08em]"
            >
              დაამატე შენი სერვისი
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-3 shadow-xl sm:p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5">
            <span className="text-base text-amber-300/70">🔎</span>
            <input
              type="text"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
              placeholder="მოძებნე სერვისი..."
              className="w-full bg-transparent text-xs font-bold uppercase tracking-[0.15em] text-amber-100 placeholder:text-white/30 outline-none"
            />
            {serviceSearch && (
              <button
                type="button"
                onClick={() => setServiceSearch('')}
                className="text-xs text-white/40 transition hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div ref={serviceCategoryRef} className="relative min-w-0">
            <button
              type="button"
              onClick={() => {
                setShowServiceCategoryDropdown((prev) => !prev);
                setShowServiceDropdown(false);
                setShowServiceLocationDropdown(false);
              }}
              className="flex h-full w-full max-w-full min-w-0 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5 text-left text-xs font-black uppercase leading-5 tracking-[0.15em] text-amber-200 lg:w-[210px]"
              title={selectedServiceCategory}
            >
              <span className="block w-full min-w-0 truncate">
                {selectedServiceCategory}
              </span>
            </button>
            {showServiceCategoryDropdown && (
              <div className="absolute z-20 top-full mt-2 w-full min-w-64 rounded-[22px] border border-white/10 bg-[#0b0b15] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <div className="max-h-52 space-y-1 overflow-y-auto">
                  {serviceCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedServiceCategory(category);
                        setSelectedService('ყველა სერვისი');
                        setShowServiceCategoryDropdown(false);
                      }}
                      title={category}
                      className={`block w-full truncate rounded-xl border px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.15em] transition ${
                        selectedServiceCategory === category
                          ? 'border-amber-300/40 bg-amber-500/20 text-amber-200'
                          : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={serviceRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowServiceDropdown((prev) => !prev);
                setShowServiceCategoryDropdown(false);
                setShowServiceLocationDropdown(false);
              }}
              className="h-full w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5 text-left text-xs font-black uppercase tracking-[0.15em] text-emerald-200 lg:w-[190px] whitespace-nowrap"
            >
              {selectedService}
            </button>
            {showServiceDropdown && (
              <div className="absolute z-20 top-full mt-2 w-full min-w-56 rounded-[22px] border border-white/10 bg-[#0b0b15] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <div className="max-h-52 space-y-1 overflow-y-auto">
                  {serviceOptions.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => {
                        setSelectedService(service);
                        setShowServiceDropdown(false);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.15em] transition ${
                        selectedService === service
                          ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
                          : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={serviceLocationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowServiceLocationDropdown((prev) => !prev);
                setShowServiceCategoryDropdown(false);
                setShowServiceDropdown(false);
              }}
              className="h-full w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-2.5 text-left text-xs font-black uppercase tracking-[0.15em] text-cyan-200 lg:w-[180px] whitespace-nowrap"
            >
              {selectedServiceLocation}
            </button>
            {showServiceLocationDropdown && (
              <div className="absolute right-0 z-20 top-full mt-2 w-full min-w-56 rounded-[22px] border border-white/10 bg-[#0b0b15] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <div className="max-h-52 space-y-1 overflow-y-auto">
                  {serviceLocations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => {
                        setSelectedServiceLocation(location);
                        setShowServiceLocationDropdown(false);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.15em] transition ${
                        selectedServiceLocation === location
                          ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-200'
                          : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <select
            value={serviceSort}
            onChange={(event) => setServiceSort(event.target.value as ServiceSortOption)}
            className="rounded-2xl border border-white/10 bg-[#0b0b15] px-3 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-white/70 outline-none cursor-pointer"
          >
            <option value="newest">ახალი → ძველი</option>
            <option value="rating">რეიტინგი</option>
            <option value="name">სახელი A-Z</option>
          </select>

          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] text-white/30">{filteredProviders.length}</span>
            <button
              type="button"
              onClick={() => setServiceSliderIndex((index) => Math.max(0, index - serviceCardsPerView))}
              disabled={serviceSliderIndex === 0}
              aria-label="წინა"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-amber-500/25 hover:border-amber-400/50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setServiceSliderIndex((index) => Math.min(index + serviceCardsPerView, serviceMaxSliderIndex))}
              disabled={serviceSliderIndex >= serviceMaxSliderIndex}
              aria-label="შემდეგი"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-amber-500/25 hover:border-amber-400/50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-left text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            ნაპოვნია {filteredProviders.length} სერვისი
          </p>
          <Link
            href="/community/masters"
            className="inline-flex items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/20"
          >
            ყველა სერვისის ნახვა
          </Link>
        </div>

        {showHealthWarning && (
          <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-left text-[11px] font-bold leading-relaxed text-amber-100/80">
            {HEALTH_SERVICE_WARNING}
          </div>
        )}

        {filteredProviders.length > 0 && (
          filteredProviders.length <= serviceCardsPerView ? (
          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${serviceCardsPerView}, minmax(0, 1fr))` }}>
            {filteredProviders.map((provider) => (
              <article
                key={provider.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b15]/80 text-left transition hover:border-amber-300/35 hover:bg-white/[0.06]"
              >
                <Link href={`/community/masters/${provider.id}`} className="block">
                  {provider.photo_url && (
                    <div className="relative h-28 w-full bg-white/5">
                      <Image
                        src={provider.photo_url}
                        alt={provider.full_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-white">{provider.full_name}</h3>
                        <p className="mt-1 line-clamp-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-300">
                          {provider.profession}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-black text-amber-300">⭐ {provider.rating_avg?.toFixed(1) || '0.0'}</span>
                    </div>
                    {provider.category && (
                      <p className="mt-2 line-clamp-1 text-[11px] text-white/45">{provider.category}</p>
                    )}
                    {provider.location && (
                      <p className="mt-1 text-[11px] text-white/45">{provider.location}</p>
                    )}
                    {provider.phone && (
                      <p className="mt-2 text-[11px] font-bold text-white/65">ტელ: {provider.phone}</p>
                    )}
                  </div>
                </Link>
                <div className="flex flex-wrap gap-2 px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => shareServiceProviderToFacebook(provider.id)}
                    className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase text-blue-100 transition hover:bg-blue-500/20"
                  >
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => shareServiceProvider(provider)}
                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase text-white/75 transition hover:text-white"
                  >
                    გაზიარება
                  </button>
                </div>
              </article>
            ))}
          </div>
          ) : (
          <div
            ref={serviceSliderRef}
            className="mt-4 flex overflow-x-hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={(event) => { serviceTouchStartX.current = event.touches[0].clientX; }}
            onTouchEnd={(event) => {
              if (serviceTouchStartX.current === null) return;
              const diff = serviceTouchStartX.current - event.changedTouches[0].clientX;
              if (diff > 40) setServiceSliderIndex((index) => Math.min(index + serviceCardsPerView, serviceMaxSliderIndex));
              else if (diff < -40) setServiceSliderIndex((index) => Math.max(0, index - serviceCardsPerView));
              serviceTouchStartX.current = null;
            }}
          >
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                style={{
                  minWidth: `calc(100% / ${serviceCardsPerView})`,
                  maxWidth: `calc(100% / ${serviceCardsPerView})`,
                  flexShrink: 0,
                }}
                className="px-1"
              >
                <article className="group h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b15]/80 text-left transition hover:border-amber-300/35 hover:bg-white/[0.06]">
                  <Link href={`/community/masters/${provider.id}`} className="block">
                    {provider.photo_url && (
                      <div className="relative h-28 w-full bg-white/5">
                        <Image
                          src={provider.photo_url}
                          alt={provider.full_name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-white">{provider.full_name}</h3>
                          <p className="mt-1 line-clamp-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-300">
                            {provider.profession}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-black text-amber-300">⭐ {provider.rating_avg?.toFixed(1) || '0.0'}</span>
                      </div>
                      {provider.category && (
                        <p className="mt-2 line-clamp-1 text-[11px] text-white/45">{provider.category}</p>
                      )}
                      {provider.location && (
                        <p className="mt-1 text-[11px] text-white/45">{provider.location}</p>
                      )}
                      {provider.phone && (
                        <p className="mt-2 text-[11px] font-bold text-white/65">ტელ: {provider.phone}</p>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 px-4 pb-4">
                    <button
                      type="button"
                      onClick={() => shareServiceProviderToFacebook(provider.id)}
                      className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase text-blue-100 transition hover:bg-blue-500/20"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => shareServiceProvider(provider)}
                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase text-white/75 transition hover:text-white"
                    >
                      გაზიარება
                    </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
          )
        )}
        <div className="mt-3 flex flex-col items-stretch justify-end gap-2 sm:flex-row">
          <Link
            href="/community/masters/submit"
            className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-500/12 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/20"
          >
            სერვისის დამატება
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-cyan-300/15 bg-gradient-to-br from-cyan-500/10 via-white/[0.035] to-amber-500/5 p-4 text-left shadow-xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">
                სერვისის მაძიებლები
              </h3>
              <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                {serviceRequestsCount} მოთხოვნა
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
              თუ კონკრეტულ მომსახურებას ეძებთ, განათავსეთ მოკლე მოთხოვნა კატეგორიით, ლოკაციით და საკონტაქტო ნომრით. სერვისის მიმწოდებლებს მარტივად ექნებათ შესაძლებლობა დაგიკავშირდნენ.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            {serviceRequests.length > requestCardsPerPage ? (
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                  {safeRequestPage + 1}/{requestMaxPage + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setRequestPage((page) => Math.max(0, page - 1))}
                  disabled={safeRequestPage === 0}
                  aria-label="წინა სერვისის მოთხოვნები"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all duration-200 hover:border-cyan-300/50 hover:bg-cyan-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestPage((page) => Math.min(requestMaxPage, page + 1))}
                  disabled={safeRequestPage >= requestMaxPage}
                  aria-label="შემდეგი სერვისის მოთხოვნები"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-all duration-200 hover:border-cyan-300/50 hover:bg-cyan-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            ) : null}
            <Link
              href="/community/service-requests/submit"
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-500/25"
            >
              ვეძებ სერვისს
            </Link>
          </div>
        </div>

        {serviceRequests.length > 0 ? (
          <div
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
            onTouchStart={(event) => { requestTouchStartX.current = event.touches[0].clientX; }}
            onTouchEnd={(event) => {
              if (requestTouchStartX.current === null) return;
              const diff = requestTouchStartX.current - event.changedTouches[0].clientX;
              if (diff > 40) setRequestPage((page) => Math.min(requestMaxPage, page + 1));
              else if (diff < -40) setRequestPage((page) => Math.max(0, page - 1));
              requestTouchStartX.current = null;
            }}
          >
            {visibleServiceRequests.map((request) => (
              <Link
                key={request.id}
                href={`/announcements/${request.id}`}
                className="group rounded-2xl border border-white/10 bg-[#0b0b15]/75 p-4 transition hover:border-cyan-300/35 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/80">ეძებს</p>
                    <h4 className="mt-1 line-clamp-2 text-sm font-black text-white group-hover:text-cyan-100">{request.title}</h4>
                  </div>
                  <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-black text-cyan-100">
                    მოთხოვნა
                  </span>
                </div>
                {request.description && (
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/55">{request.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-white/45">
                  {request.location ? <span>{request.location}</span> : null}
                  {request.price ? (
                    <span className="text-amber-200">
                      {request.price}{request.price === 'შეთანხმებით' ? '' : ` ${request.currency === 'USD' ? '$' : '₾'}`}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-bold text-white/45">
            სერვისის ძიების მოთხოვნები დამტკიცების შემდეგ აქ გამოჩნდება.
          </div>
        )}
      </div>
    </section>
  );
}
