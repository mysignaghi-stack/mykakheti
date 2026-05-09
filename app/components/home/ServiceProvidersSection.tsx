'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Tables } from '@/types/helpers';

type MasterRow = Tables<'masters'>;

type ServiceProvidersSectionProps = {
  providers: MasterRow[];
  count?: number;
};

const SERVICE_DESCRIPTION = 'თუ კახეთში სთავაზობთ რაიმე სახის მომსახურებას — ხართ ხელოსანი, ტექნიკოსი, მძღოლი, მასწავლებელი, ფოტოგრაფი, გიდი, დასუფთავების სპეციალისტი ან სხვა მომსახურების მიმწოდებელი — შეგიძლიათ დარეგისტრირდეთ და განათავსოთ ინფორმაცია თქვენი სერვისის შესახებ.';
const SERVICE_HINT = 'მიუთითეთ რას სთავაზობთ მომხმარებელს, რომელ მუნიციპალიტეტში მუშაობთ, გაქვთ თუ არა გამოძახებით მომსახურება, საკონტაქტო ნომერი და საჭიროების შემთხვევაში ფოტოები.';

export default function ServiceProvidersSection({ providers, count = 0 }: ServiceProvidersSectionProps) {
  const visibleProviders = providers.slice(0, 4);
  const hasProviders = visibleProviders.length > 0;

  return (
    <section className="w-full mt-8">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-4xl text-left">
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
          <Link
            href="/community/masters/submit"
            className="inline-flex w-full items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/25 sm:w-auto"
          >
            დაამატე შენი სერვისი
          </Link>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-left">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">
            მომსახურების მიმწოდებლები კახეთში
          </h3>
        </div>
        {providers.length > 4 && (
          <Link href="/community/masters" className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:text-amber-200">
            ყველას ნახვა
          </Link>
        )}
      </div>

      {hasProviders ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProviders.map((provider) => (
            <ServiceProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
          <p className="text-sm text-white/60">
            მომსახურების მიმწოდებლები ჯერ არ არიან დამატებული. თუ სთავაზობთ რაიმე სერვისს კახეთში, დაამატეთ თქვენი ინფორმაცია.
          </p>
          <Link
            href="/community/masters/submit"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-500/25"
          >
            დაამატე შენი სერვისი
          </Link>
        </div>
      )}
    </section>
  );
}

function ServiceProviderCard({ provider }: { provider: MasterRow }) {
  const photo = provider.photo_url || null;
  const price = provider.price_note || 'შეთანხმებით';
  const hasOnCall = Boolean(provider.service_area?.includes('გამოძახებით'));

  return (
    <Link
      href={`/community/masters/${provider.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-amber-400/30 hover:shadow-[0_0_20px_rgba(230,126,34,0.15)]"
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden bg-white/5">
        {photo ? (
          <Image
            src={photo}
            alt={provider.full_name || provider.profession}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-white/15">🛠️</div>
        )}
        {provider.category && (
          <span className="absolute left-2 top-2 rounded-full border border-amber-400/20 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300/90 backdrop-blur-sm">
            {provider.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 text-left">
        <div>
          <h4 className="line-clamp-1 text-sm font-black text-white/90 transition-colors group-hover:text-white">
            {provider.full_name}
          </h4>
          <p className="mt-1 line-clamp-1 text-[11px] font-black uppercase text-amber-300">
            {provider.profession}
          </p>
        </div>
        <div className="space-y-1 text-[11px] text-white/50">
          {provider.location && <p>ლოკაცია: {provider.location}</p>}
          <p>ფასი: {price}</p>
          {hasOnCall && <p className="text-emerald-300/80">გამოძახებით მომსახურება</p>}
          {provider.phone && <p>ტელ: {provider.phone}</p>}
        </div>
        {provider.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-white/65">
            {provider.description}
          </p>
        )}
        <span className="mt-auto inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition group-hover:border-amber-400/30 group-hover:text-amber-200">
          დეტალურად ნახვა
        </span>
      </div>
    </Link>
  );
}
