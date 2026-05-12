'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../lib/supabase';
import SubmissionAuthGate from '../../../components/auth/SubmissionAuthGate';

const SERVICE_GROUPS = [
  {
    label: 'სარემონტო და სამშენებლო მომსახურება',
    services: ['სახლის რემონტი', 'ბინის რემონტი', 'კოსმეტიკური რემონტი', 'კაპიტალური რემონტი', 'მშენებლობა', 'სახურავის შეკეთება', 'ფასადის სამუშაოები', 'კედლის გალესვა', 'კაფელ-მეტლახის დაგება', 'იატაკის დაგება', 'ლამინატის დაგება', 'პარკეტის დაგება', 'თაბაშირ-მუყაოს სამუშაოები', 'შპალერის გაკვრა', 'შეღებვა', 'კარ-ფანჯრის მონტაჟი', 'ლითონის კონსტრუქციები', 'ჭიშკარი / მოაჯირი / კიბე', 'შედუღების სამუშაოები'],
  },
  {
    label: 'ელექტროობა და ტექნიკური სამუშაოები',
    services: ['ელექტრიკოსი', 'ელექტროგაყვანილობის მონტაჟი', 'ელექტროგაყვანილობის შეკეთება', 'მრიცხველის / ავტომატის მონტაჟი', 'განათების მონტაჟი', 'კამერების მონტაჟი', 'სიგნალიზაციის მონტაჟი', 'ინტერნეტ-ქსელის გაყვანა', 'ჭკვიანი სახლის მოწყობილობები'],
  },
  {
    label: 'სანტექნიკა და გათბობა',
    services: ['სანტექნიკოსი', 'წყლის მილის შეკეთება', 'კანალიზაციის გაწმენდა', 'ონკანის / უნიტაზის / ნიჟარის მონტაჟი', 'წყლის გამაცხელებლის მონტაჟი', 'გათბობის სისტემის მონტაჟი', 'რადიატორების მონტაჟი', 'ქვაბის შეკეთება', 'გაზის გამათბობლის მონტაჟი', 'იატაკქვეშა გათბობა'],
  },
  {
    label: 'საყოფაცხოვრებო ტექნიკის შეკეთება',
    services: ['მაცივრის შეკეთება', 'სარეცხი მანქანის შეკეთება', 'ჭურჭლის სარეცხი მანქანის შეკეთება', 'ტელევიზორის შეკეთება', 'გაზქურის შეკეთება', 'ელექტროქურის შეკეთება', 'წყლის გამაცხელებლის შეკეთება', 'კონდიციონერის შეკეთება', 'მტვერსასრუტის შეკეთება', 'მცირე საყოფაცხოვრებო ტექნიკის შეკეთება'],
  },
  {
    label: 'კომპიუტერი, ტელეფონი და ელექტრონიკა',
    services: ['კომპიუტერის შეკეთება', 'ლეპტოპის შეკეთება', 'ტელეფონის შეკეთება', 'პლანშეტის შეკეთება', 'პროგრამების დაყენება', 'Windows-ის დაყენება', 'მონაცემების აღდგენა', 'პრინტერის შეკეთება', 'ქსელის გამართვა', 'კამერების / DVR-ის გამართვა', 'ვებგვერდის შექმნა', 'სოციალური ქსელების მართვა'],
  },
  {
    label: 'ავტოსერვისი',
    services: ['ავტომობილის შეკეთება', 'ძრავის შეკეთება', 'სავალი ნაწილის შეკეთება', 'ელექტრიკოსი ავტომობილებისთვის', 'დიაგნოსტიკა', 'ზეთის შეცვლა', 'საბურავების შეცვლა', 'ვულკანიზაცია', 'ავტომობილის ევაკუატორი', 'ავტოსამრეცხაო', 'ქიმწმენდა', 'ავტო-კონდიციონერის შეკეთება', 'ავტო-მღებავი', 'ავტო-ჟეშტი', 'მინის შეცვლა'],
  },
  {
    label: 'ტრანსპორტი და გადაზიდვები',
    services: ['ტაქსი', 'კერძო მძღოლი', 'ტვირთის გადაზიდვა', 'ავეჯის გადაზიდვა', 'სამშენებლო მასალის გადაზიდვა', 'სოფლის მეურნეობის პროდუქტის გადაზიდვა', 'მიკროავტობუსით მომსახურება', 'მგზავრთა გადაყვანა', 'ევაკუატორი', 'ტრაქტორი / სპეციალური ტექნიკა', 'მიწის დამუშავების ტექნიკა'],
  },
  {
    label: 'დასუფთავება და მოვლა',
    services: ['სახლის დასუფთავება', 'ოფისის დასუფთავება', 'ეზოს დასუფთავება', 'სამშენებლო ნარჩენების გატანა', 'ავეჯის ქიმწმენდა', 'ხალიჩის წმენდა', 'ფანჯრების წმენდა', 'სადარბაზოს დასუფთავება', 'დეზინფექცია', 'მწერებისა და მღრღნელების საწინააღმდეგო მომსახურება'],
  },
  {
    label: 'ეზო, ბაღი და სოფლის მეურნეობა',
    services: ['ბაღის მოვლა', 'ეზოს მოწყობა', 'ხეების გასხვლა', 'ვენახის მოვლა', 'ვენახის შეწამვლა', 'მიწის დამუშავება', 'ბალახის გაკრეჭა', 'სარწყავი სისტემის მონტაჟი', 'ჭის ამოწმენდა', 'ჭაბურღილის მოწყობა', 'სათბურის მოწყობა', 'აგრონომის მომსახურება', 'ვეტერინარის მომსახურება'],
  },
  {
    label: 'სილამაზე და თავის მოვლა',
    services: ['თმის სტილისტი', 'დალაქი', 'ვიზაჟისტი', 'მანიკური / პედიკური', 'კოსმეტოლოგი', 'მასაჟი', 'წარბების კორექცია', 'წამწამების დაგრძელება', 'ტატუ / პირსინგი', 'სახლში გამოძახებით სილამაზის მომსახურება'],
  },
  {
    label: 'ჯანმრთელობა და კეთილდღეობა',
    services: ['ექთნის მომსახურება', 'მომვლელი', 'ხანდაზმულის მოვლა', 'ბავშვის მოვლა', 'რეაბილიტაციის სპეციალისტი', 'მასაჟისტი', 'ფსიქოლოგი', 'ლოგოპედი', 'დიეტოლოგი'],
  },
  {
    label: 'განათლება და რეპეტიტორები',
    services: ['დაწყებითი კლასების მომზადება', 'ქართული ენა და ლიტერატურა', 'მათემატიკა', 'ინგლისური ენა', 'რუსული ენა', 'ისტორია', 'ქიმია', 'ფიზიკა', 'ბიოლოგია', 'კომპიუტერული უნარები', 'მუსიკა', 'ცეკვა', 'ხატვა', 'აბიტურიენტების მომზადება', 'ონლაინ გაკვეთილები'],
  },
  {
    label: 'იურიდიული, საბუღალტრო და საოფისე მომსახურება',
    services: ['იურიდიული კონსულტაცია', 'ხელშეკრულების შედგენა', 'განცხადებების / საჩივრების მომზადება', 'ბუღალტრული მომსახურება', 'საგადასახადო კონსულტაცია', 'დოკუმენტების აკრეფა', 'თარგმნა', 'ნოტარიული მომსახურების მოძიება', 'საბანკო / სადაზღვევო კონსულტაცია'],
  },
  {
    label: 'ღონისძიებები და ფოტო-ვიდეო მომსახურება',
    services: ['ფოტოგრაფი', 'ვიდეოგადაღება', 'დრონით გადაღება', 'მონტაჟი', 'ქორწილის ორგანიზება', 'დაბადების დღის ორგანიზება', 'მუსიკოსი / დიჯეი', 'წამყვანი', 'დეკორაცია', 'ტორტი / ტკბილეული', 'ქეითერინგი', 'დარბაზის გაფორმება', 'მანქანის მორთვა'],
  },
  {
    label: 'საკვები, კულინარია და ქეითერინგი',
    services: ['სახლში მომზადებული საჭმელი', 'ტორტები', 'ხაჭაპური / ლობიანი', 'ტრადიციული კერძები', 'ქეითერინგი', 'სადღესასწაულო სუფრა', 'ღვინის დეგუსტაცია', 'მარანი / მასპინძლობა', 'კულინარიული მომსახურება გამოძახებით'],
  },
  {
    label: 'ტურიზმი და მასპინძლობა',
    services: ['გიდის მომსახურება', 'საოჯახო სასტუმრო', 'დღიური ბინა', 'ტურების ორგანიზება', 'მძღოლი ტურისტებისთვის', 'ღვინის ტური', 'ცხენით გასეირნება', 'პიკნიკის სივრცე', 'კემპინგი', 'ლაშქრობა', 'კახეთის ღირსშესანიშნაობების ტური'],
  },
  {
    label: 'ბავშვებთან დაკავშირებული მომსახურება',
    services: ['ძიძა', 'ბავშვის მოვლა', 'საბავშვო ღონისძიებები', 'ანიმატორი', 'ბავშვთა ფოტოგრაფი', 'რეპეტიტორი', 'ლოგოპედი', 'საბავშვო ტორტი', 'საბავშვო სივრცე'],
  },
  {
    label: 'ცხოველები',
    services: ['ვეტერინარი', 'ცხოველების მოვლა', 'ძაღლის გაწვრთნა', 'ცხოველის დაბანა / გაკრეჭა', 'დროებითი დატოვება', 'დაკარგული ცხოველის მოძიებაში დახმარება', 'საკვების / აქსესუარების მიწოდება'],
  },
  {
    label: 'უძრავ ქონებასთან დაკავშირებული მომსახურება',
    services: ['მაკლერი', 'ბინის გაქირავებაში დახმარება', 'მიწის ნაკვეთის შეფასება', 'აზომვითი სამუშაოები', 'საკადასტრო ნახაზები', 'მშენებლობის კონსულტაცია', 'ინტერიერის დიზაინი', 'არქიტექტურული მომსახურება'],
  },
  {
    label: 'სხვა მომსახურება',
    services: ['სხვადასხვა სერვისი', 'ერთჯერადი დახმარება', 'ხელით სამუშაო', 'დამხმარე მუშა', 'ნივთების აწყობა', 'მცირე საყოფაცხოვრებო საქმეები', 'დროებითი მომსახურება', 'სხვა სერვისი'],
  },
];

const findServiceGroup = (service: string) => (
  SERVICE_GROUPS.find((group) => group.services.includes(service))?.label ?? ''
);

export default function MastersSubmit() {
  const [full_name, setFullName] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [municipality, setMunicipality] = useState('');
  const [settlement, setSettlement] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [description, setDescription] = useState('');
  const [photo_url, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [service_area, setServiceArea] = useState('');
  const [price_note, setPriceNote] = useState('');
  const [messenger, setMessenger] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [hasOnCall, setHasOnCall] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const profession = selectedServices.join(', ');
  const category = Array.from(new Set(selectedServices.map(findServiceGroup).filter(Boolean))).join(', ');

  const toggleService = (service: string) => {
    setSelectedServices((current) => (
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    ));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!full_name || selectedServices.length === 0) return alert('სახელი, გვარი და მინიმუმ ერთი სერვისის არჩევა აუცილებელია');
    if (notifyByEmail && !email.trim()) return alert('შეტყობინებების მისაღებად მიუთითეთ ელფოსტა.');
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('სერვისის დასამატებლად გაიარეთ ავტორიზაცია.');
      setSubmitting(false);
      return;
    }
    try {
      let uploadedPhotoUrl = photo_url || null;

      if (photoFile) {
        const sanitizedName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const sanitizedFile = new File([photoFile], sanitizedName, { type: photoFile.type });
        const compressed = await imageCompression(sanitizedFile, {
          maxSizeMB: 0.25,
          maxWidthOrHeight: 900,
          useWebWorker: true,
          initialQuality: 0.55,
        });
        const fileName = `master-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const formData = new FormData();
        formData.append('file', compressed, fileName);
        formData.append('fileName', fileName);
        formData.append('bucket', 'announcements');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult?.error || 'ფოტოს ატვირთვა ვერ მოხერხდა');
        }
        uploadedPhotoUrl = uploadResult.urls?.[0] || uploadResult.url || null;
      }

      const location = [municipality, settlement].filter(Boolean).join(', ');
      const details = [
        description,
        messenger ? `WhatsApp/Viber: ${messenger}` : '',
        workHours ? `სამუშაო დღეები/საათები: ${workHours}` : '',
      ].filter(Boolean).join('\n\n');
      const areaDetails = [
        hasOnCall ? 'გამოძახებით მომსახურება' : '',
        service_area ? `მომსახურების არეალი: ${service_area}` : '',
      ].filter(Boolean).join(' · ');
      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'masters',
          values: {
            full_name,
            profession,
            category,
            email: email.trim() || null,
            notify_by_email: notifyByEmail,
            phone: phone || null,
            location: location || null,
            description: details || null,
            photo_url: uploadedPhotoUrl,
            service_area: areaDetails || null,
            price_note: price_note || null,
            is_approved: false,
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return alert('შეცდომა: ' + (payload?.error ?? 'უცნობი შეცდომა'));
      }
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'უცნობი შეცდომა';
      alert('შეცდომა: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-4">გმადლობთ!</h1>
        <p className="text-white/80">ჩანაწერი გაიგზავნა მოდერაციაზე და გამოჩნდება დამტკიცების შემდეგ.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-start mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-3">სერვისის დამატება</h1>
        <p className="mb-6 text-sm leading-relaxed text-white/60">
          მიუთითეთ რას სთავაზობთ მომხმარებელს, რომელ მუნიციპალიტეტში მუშაობთ, გაქვთ თუ არა გამოძახებით მომსახურება, საკონტაქტო ნომერი და საჭიროების შემთხვევაში ფოტოები.
        </p>
        <SubmissionAuthGate redirectPath="/community/masters/submit" heading="განცხადებების გამოქვეყნება შესაძლებელია გამარტივებული ავტორიზაციის დასრულების შემდეგ.">
          {() => (
            <form className="space-y-3" onSubmit={submit}>
              <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder="სერვისის მიმწოდებლის სახელი და გვარი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">აირჩიეთ ერთი ან რამდენიმე სერვისი</span>
                  {selectedServices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedServices([])}
                      className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40 transition hover:text-amber-200"
                    >
                      გასუფთავება
                    </button>
                  )}
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {SERVICE_GROUPS.map((group) => (
                    <div key={group.label} className="rounded-xl border border-white/10 bg-[#0b0b15]/80 p-3">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                        {group.label}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {group.services.map((service) => {
                          const isChecked = selectedServices.includes(service);
                          return (
                            <label
                              key={`${group.label}-${service}`}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-bold text-white/80 transition ${
                                isChecked
                                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-100'
                                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleService(service)}
                                className="h-4 w-4 flex-none accent-amber-500"
                              />
                              <span>{service}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <input value={category} readOnly placeholder="მომსახურების ტიპი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={municipality} onChange={e=>setMunicipality(e.target.value)} placeholder="მუნიციპალიტეტი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <input value={settlement} onChange={e=>setSettlement(e.target.value)} placeholder="ქალაქი/სოფელი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="მომსახურების აღწერა" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={price_note} onChange={e=>setPriceNote(e.target.value)} placeholder="ფასი ან შეთანხმებით" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="საკონტაქტო ტელეფონი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-3">
                <input
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  placeholder="ელფოსტა შეტყობინებებისთვის"
                  className="w-full rounded-xl border border-white/10 bg-[#0b0b15] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
                />
                <label className="mt-3 flex items-start gap-3 text-sm font-bold leading-relaxed text-white/75">
                  <input
                    type="checkbox"
                    checked={notifyByEmail}
                    onChange={e=>setNotifyByEmail(e.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-none accent-amber-500"
                  />
                  <span>მსურს მივიღო შეტყობინება, როცა მომხმარებელი „ვეძებ სერვისს“ მოთხოვნას ჩემს კატეგორიაში დაამატებს.</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={messenger} onChange={e=>setMessenger(e.target.value)} placeholder="WhatsApp/Viber" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/40">ფოტოს ატვირთვა</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setPhotoFile(file);
                      if (file) setPhotoUrl('');
                    }}
                    className="mt-1 w-full text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-amber-100"
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                <input type="checkbox" checked={hasOnCall} onChange={e=>setHasOnCall(e.target.checked)} className="h-4 w-4 accent-amber-500" />
                გამოძახებით მომსახურება
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={service_area} onChange={e=>setServiceArea(e.target.value)} placeholder="მომსახურების არეალი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <input value={workHours} onChange={e=>setWorkHours(e.target.value)} placeholder="სამუშაო დღეები/საათები" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end"><button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2 font-bold">{submitting ? 'იგზავნება...' : 'სერვისის დამატება'}</button></div>
            </form>
          )}
        </SubmissionAuthGate>
      </div>
    </main>
  );
}
