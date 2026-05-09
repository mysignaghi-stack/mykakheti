'use client';

import Link from 'next/link';
import type { Tables } from '@/types/helpers';

type MasterRow = Tables<'masters'>;

type ServiceProvidersSectionProps = {
  providers: MasterRow[];
  count?: number;
};

const SERVICE_DESCRIPTION = 'თუ კახეთში სთავაზობთ რაიმე სახის მომსახურებას — ხართ ხელოსანი, ტექნიკოსი, მძღოლი, მასწავლებელი, ფოტოგრაფი, გიდი, დასუფთავების სპეციალისტი ან სხვა მომსახურების მიმწოდებელი — შეგიძლიათ დარეგისტრირდეთ და განათავსოთ ინფორმაცია თქვენი სერვისის შესახებ.';
const SERVICE_HINT = 'მიუთითეთ რას სთავაზობთ მომხმარებელს, რომელ მუნიციპალიტეტში მუშაობთ, გაქვთ თუ არა გამოძახებით მომსახურება, საკონტაქტო ნომერი და საჭიროების შემთხვევაში ფოტოები.';

function PremiumServiceIconCluster() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative hidden h-32 w-[19rem] shrink-0 md:block lg:h-36 lg:w-[21rem]"
    >
      <div className="absolute inset-3 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="absolute right-0 top-2 h-24 w-40 rounded-full bg-slate-200/5 blur-2xl" />

      <div className="service-3d-icon service-3d-icon--tool left-0 top-[3.15rem] h-10 w-10 lg:h-11 lg:w-11">
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

      <div className="service-3d-icon service-3d-icon--bolt left-[5rem] top-0 h-9 w-9 lg:left-[5.75rem] lg:h-10 lg:w-10">
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

      <div className="service-3d-icon service-3d-icon--camera left-[10rem] top-[2.15rem] h-12 w-12 lg:left-[11.4rem] lg:h-14 lg:w-14">
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

      <div className="service-3d-icon service-3d-icon--pipe bottom-0 left-[5.35rem] h-10 w-10 lg:left-[6.2rem] lg:h-11 lg:w-11">
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

      <div className="service-3d-icon service-3d-icon--home bottom-[1.15rem] right-0 h-10 w-10 lg:h-11 lg:w-11">
        <svg viewBox="0 0 64 64" role="presentation">
          <defs>
            <linearGradient id="serviceHome" x1="12" y1="15" x2="51" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F7D98B" />
              <stop offset="0.5" stopColor="#A96F1B" />
              <stop offset="1" stopColor="#2B1A08" />
            </linearGradient>
          </defs>
          <path d="M9.8 31.1 32 12.8l22.2 18.3-5.4 6.3-3.4-2.8V54H18.6V34.6l-3.4 2.8-5.4-6.3Z" fill="url(#serviceHome)" />
          <path d="M26.6 54V39.2h10.8V54H26.6Z" fill="#10151D" opacity=".72" />
          <path d="m18.4 31.8 13.5-11.1 13.8 11.2" stroke="#FFF3C9" strokeWidth="2.4" strokeLinecap="round" opacity=".48" />
        </svg>
      </div>
    </div>
  );
}

export default function ServiceProvidersSection({ count = 0 }: ServiceProvidersSectionProps) {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <PremiumServiceIconCluster />
            <Link
              href="/community/masters/submit"
              className="inline-flex w-full items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/25 sm:w-auto"
            >
              დაამატე შენი სერვისი
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
