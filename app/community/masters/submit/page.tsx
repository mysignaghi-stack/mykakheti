'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
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
  const [profession, setProfession] = useState('');
  const [category, setCategory] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [settlement, setSettlement] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photo_url, setPhotoUrl] = useState('');
  const [service_area, setServiceArea] = useState('');
  const [price_note, setPriceNote] = useState('');
  const [messenger, setMessenger] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [hasOnCall, setHasOnCall] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!full_name || !profession) return alert('სერვისის დასახელება და სერვისის არჩევა აუცილებელია');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('სერვისის დასამატებლად გაიარეთ ავტორიზაცია.');
      return;
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
          phone: phone || null,
          location: location || null,
          description: details || null,
          photo_url: photo_url || null,
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
              <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder="სერვისის დასახელება" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              <select
                value={profession}
                onChange={(e) => {
                  setProfession(e.target.value);
                  setCategory(findServiceGroup(e.target.value));
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="" className="bg-[#0b0b15] text-white">რა სერვისს სთავაზობთ?</option>
                {SERVICE_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label} className="bg-[#0b0b15] text-amber-200">
                    {group.services.map((service) => (
                      <option key={`${group.label}-${service}`} value={service} className="bg-[#0b0b15] text-white">{service}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={messenger} onChange={e=>setMessenger(e.target.value)} placeholder="WhatsApp/Viber" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <input value={photo_url} onChange={e=>setPhotoUrl(e.target.value)} placeholder="ფოტოები (URL)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
                <input type="checkbox" checked={hasOnCall} onChange={e=>setHasOnCall(e.target.checked)} className="h-4 w-4 accent-amber-500" />
                გამოძახებით მომსახურება
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={service_area} onChange={e=>setServiceArea(e.target.value)} placeholder="მომსახურების არეალი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <input value={workHours} onChange={e=>setWorkHours(e.target.value)} placeholder="სამუშაო დღეები/საათები" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end"><button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2 font-bold">სერვისის დამატება</button></div>
            </form>
          )}
        </SubmissionAuthGate>
      </div>
    </main>
  );
}
