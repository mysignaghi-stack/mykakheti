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

const ALL_SERVICES_LABEL = 'ყველა სერვისი';

export default function ServiceRequestSubmitPage() {
  const [selectedAllCategories, setSelectedAllCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [requester, setRequester] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [settlement, setSettlement] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const normalizedServiceSearch = serviceSearch.toLowerCase().replace(/\s+/g, ' ').trim();
  const filteredServiceGroups = useMemo(
    () => normalizedServiceSearch
      ? SERVICE_CATALOG
          .map((group) => {
            const groupMatches = group.label.toLowerCase().includes(normalizedServiceSearch);
            const services = groupMatches
              ? group.services
              : group.services.filter((service) => service.toLowerCase().includes(normalizedServiceSearch));
            return { ...group, services };
          })
          .filter((group) => group.services.length > 0)
      : SERVICE_CATALOG,
    [normalizedServiceSearch]
  );

  const findServiceGroup = (service: string) => (
    SERVICE_CATALOG.find((group) => group.services.includes(service))?.label ?? ''
  );

  const selectedCategoryLabels = useMemo(() => Array.from(new Set([
    ...selectedAllCategories,
    ...selectedServices.map(findServiceGroup).filter(Boolean),
  ])), [selectedAllCategories, selectedServices]);

  const category = selectedCategoryLabels.join(', ');
  const servicesForSubmit = selectedServices.length > 0
    ? selectedServices
    : selectedAllCategories.length > 0
      ? selectedAllCategories.map((group) => `${ALL_SERVICES_LABEL} (${group})`)
      : [];

  const toggleService = (service: string) => {
    const groupLabel = findServiceGroup(service);
    setSelectedServices((current) => (
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    ));
    if (groupLabel) {
      setSelectedAllCategories((current) => current.filter((item) => item !== groupLabel));
    }
  };

  const toggleAllCategoryServices = (groupLabel: string) => {
    const groupServices = SERVICE_CATALOG.find((group) => group.label === groupLabel)?.services ?? [];
    setSelectedAllCategories((current) => (
      current.includes(groupLabel)
        ? current.filter((item) => item !== groupLabel)
        : [...current, groupLabel]
    ));
    setSelectedServices((current) => current.filter((service) => !groupServices.includes(service)));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category || servicesForSubmit.length === 0 || !municipality || !phone || !description) {
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
          category,
          services: servicesForSubmit,
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
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">აირჩიეთ კატეგორია და სერვისი</span>
                      {selectedServices.length > 0 || selectedAllCategories.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServices([]);
                            setSelectedAllCategories([]);
                          }}
                          className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-cyan-100"
                        >
                          გასუფთავება
                        </button>
                      ) : null}
                    </div>
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0b15] px-3 py-2">
                      <span className="text-sm text-cyan-300/70">🔎</span>
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(event) => setServiceSearch(event.target.value)}
                        placeholder="მოძებნე კატეგორია ან სერვისი..."
                        className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/30"
                      />
                      {serviceSearch ? (
                        <button
                          type="button"
                          onClick={() => setServiceSearch('')}
                          className="text-xs font-black text-white/35 transition hover:text-white"
                          aria-label="სერვისების ძიების გასუფთავება"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                      {filteredServiceGroups.length > 0 ? filteredServiceGroups.map((group) => {
                        const allSelected = selectedAllCategories.includes(group.label);
                        return (
                          <div key={group.label} className="rounded-xl border border-white/10 bg-[#0b0b15]/80 p-3">
                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                              {group.label}
                            </div>
                            <label
                              className={`mb-2 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-bold transition ${
                                allSelected
                                  ? 'border-cyan-300/45 bg-cyan-500/15 text-cyan-50'
                                  : 'border-cyan-300/20 bg-cyan-500/8 text-cyan-100/80 hover:border-cyan-300/35 hover:bg-cyan-500/12'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={() => toggleAllCategoryServices(group.label)}
                                className="h-4 w-4 flex-none accent-cyan-400"
                              />
                              <span>{ALL_SERVICES_LABEL}</span>
                            </label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {group.services.map((service) => {
                                const checked = selectedServices.includes(service);
                                return (
                                  <label
                                    key={`${group.label}-${service}`}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-bold transition ${
                                      checked
                                        ? 'border-cyan-300/45 bg-cyan-500/15 text-cyan-50'
                                        : allSelected
                                          ? 'border-white/5 bg-white/[0.02] text-white/30'
                                          : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleService(service)}
                                      disabled={allSelected}
                                      className="h-4 w-4 flex-none accent-cyan-400"
                                    />
                                    <span>{service}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="rounded-xl border border-white/10 bg-[#0b0b15]/80 px-3 py-4 text-center text-xs font-bold text-white/45">
                          ამ სიტყვით კატეგორია ან სერვისი ვერ მოიძებნა.
                        </div>
                      )}
                    </div>
                  </div>

                  <input value={category} readOnly placeholder="მომსახურების ტიპი" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70" />

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

                  {selectedCategoryLabels.includes('ჯანმრთელობა და კეთილდღეობა') ? (
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
