'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import SubmissionAuthGate from '@/app/components/auth/SubmissionAuthGate';
import { SERVICE_CATALOG } from '@/app/lib/serviceCatalog';

const MUNICIPALITIES = [
  'თელავი',
  'გურჯაანი',
  'სიღნაღი',
  'ყვარელი',
  'ლაგოდეხი',
  'ახმეტა',
  'დედოფლისწყარო',
  'საგარეჯო',
];

export default function ServiceRequestSubmitPage() {
  const [selectedCategory, setSelectedCategory] = useState(SERVICE_CATALOG[0]?.label ?? '');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [requester, setRequester] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [settlement, setSettlement] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeServices = useMemo(
    () => SERVICE_CATALOG.find((group) => group.label === selectedCategory)?.services ?? [],
    [selectedCategory]
  );

  const toggleService = (service: string) => {
    setSelectedServices((current) => (
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    ));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCategory || selectedServices.length === 0 || !municipality || !phone || !description) {
      alert('აირჩიეთ კატეგორია, მინიმუმ ერთი სერვისი და შეავსეთ ლოკაცია, ტელეფონი და აღწერა.');
      return;
    }

    setSubmitting(true);
    try {
      const location = [municipality, settlement].filter(Boolean).join(', ');
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          services: selectedServices,
          location,
          phone,
          budget,
          requester,
          urgency,
          description,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'მოთხოვნის გაგზავნა ვერ მოხერხდა');
      }

      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'უცნობი შეცდომა';
      alert('შეცდომა: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#050510] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-cyan-300/20 bg-cyan-500/10 p-6 text-center shadow-2xl sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">გაგზავნილია</p>
          <h1 className="mt-3 text-2xl font-black uppercase italic text-white">მოთხოვნა გადავიდა მოდერაციაზე</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            დამტკიცების შემდეგ სერვისის მაძიებლების ჩარჩოში გამოჩნდება და სერვისის მიმწოდებლები შეძლებენ თქვენთან დაკავშირებას.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl border border-cyan-300/35 bg-cyan-500/15 px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25"
          >
            მთავარი გვერდი
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white">
            ← მთავარი გვერდი
          </Link>
          <Link href="/community/masters/submit" className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200/70 transition hover:text-amber-100">
            სერვისის მიწოდება
          </Link>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.035] shadow-2xl">
          <div className="relative border-b border-white/10 p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-12 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">სერვისის მაძიებელი</p>
              <h1 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl">
                მიუთითეთ რა მომსახურება გჭირდებათ
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
                აირჩიეთ კატეგორია, აღწერეთ დავალება და დატოვეთ საკონტაქტო ნომერი. მოთხოვნა გამოქვეყნდება მხოლოდ ადმინისტრატორის დამტკიცების შემდეგ.
              </p>
            </div>
          </div>

          <SubmissionAuthGate redirectPath="/community/service-requests/submit" heading="სერვისის მოთხოვნის გამოსაქვეყნებლად საჭიროა ავტორიზაცია.">
            {() => (
              <form onSubmit={submit} className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-[#0b0b15]/80 p-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">
                      კატეგორია
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(event) => {
                        setSelectedCategory(event.target.value);
                        setSelectedServices([]);
                      }}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#050510] px-4 py-3 text-sm font-bold text-white outline-none"
                    >
                      {SERVICE_CATALOG.map((group) => (
                        <option key={group.label} value={group.label}>{group.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#0b0b15]/80 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">
                        რომელი სერვისი გჭირდებათ
                      </label>
                      {selectedServices.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedServices([])}
                          className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-cyan-100"
                        >
                          გასუფთავება
                        </button>
                      ) : null}
                    </div>
                    <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {activeServices.map((service) => {
                        const checked = selectedServices.includes(service);
                        return (
                          <label
                            key={service}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                              checked
                                ? 'border-cyan-300/45 bg-cyan-500/15 text-cyan-50'
                                : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(service)}
                              className="h-4 w-4 flex-none accent-cyan-400"
                            />
                            <span>{service}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="აღწერეთ რა სამუშაოა შესასრულებელი, რა მოცულობაა და რა დეტალებია მნიშვნელოვანი"
                    className="min-h-36 w-full rounded-3xl border border-white/10 bg-[#0b0b15]/80 px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25"
                  />
                </div>

                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <input
                    value={requester}
                    onChange={(event) => setRequester(event.target.value)}
                    placeholder="სახელი და გვარი"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                  />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <select
                      value={municipality}
                      onChange={(event) => setMunicipality(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">მუნიციპალიტეტი</option>
                      {MUNICIPALITIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <input
                      value={settlement}
                      onChange={(event) => setSettlement(event.target.value)}
                      placeholder="ქალაქი / სოფელი"
                      className="w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="საკონტაქტო ტელეფონი"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                  />
                  <input
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="ბიუჯეტი ან შეთანხმებით"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                  />
                  <input
                    value={urgency}
                    onChange={(event) => setUrgency(event.target.value)}
                    placeholder="სასურველი დრო / ვადა"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b0b15] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                  />

                  {selectedCategory === 'ჯანმრთელობა და კეთილდღეობა' ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-amber-100/80">
                      საიტზე განთავსებული ინფორმაცია არ წარმოადგენს სამედიცინო რეკომენდაციას. მომსახურების მიღებამდე გადაამოწმეთ სპეციალისტის კვალიფიკაცია.
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl border border-cyan-300/35 bg-cyan-500/20 px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-50 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'იგზავნება...' : 'მოთხოვნის გაგზავნა'}
                  </button>
                </div>
              </form>
            )}
          </SubmissionAuthGate>
        </section>
      </div>
    </main>
  );
}
