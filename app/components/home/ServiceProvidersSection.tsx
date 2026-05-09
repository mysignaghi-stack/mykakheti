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

export default function ServiceProvidersSection({ count = 0 }: ServiceProvidersSectionProps) {
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
    </section>
  );
}
