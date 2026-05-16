'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ANIMAL_SALE_CATEGORIES, ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_CATEGORY_GROUPS, LOCATIONS } from '../lib/constants';

// Flatten nested municipalities → cities → villages into unique label strings for select options.
const LOCATION_OPTIONS = Array.from(new Set(
  LOCATIONS.flatMap(m => [
    m.municipality,
    ...m.cities.flatMap(city => [
      city.name,
      ...city.villages.map(village => `${city.name} - ${village}`),
    ]),
  ])
));
const AUTH_LANDING_PATH = '/';

type AnnouncementFormData = {
  title: string;
  description: string;
  price: string;
  phone: string;
  location: string;
  category: string;
  currency: string;
  itemName: string;
  whatsappViber: string;
  condition: string;
  quantity: string;
  delivery: string;
  animalKind: string;
  breed: string;
  age: string;
  gender: string;
  vetInfo: string;
  documentInfo: string;
};

const CATEGORY_SEARCH_KEYWORDS: Record<string, string[]> = {
  'გოჭი': ['გოჭები', 'პატარა ღორი'],
  'ღორი': ['ღორები'],
  'ძროხა': ['საქონელი', 'ფური'],
  'ხბო': ['ხბოები'],
  'ქათამი': ['ქათმები'],
  'წიწილა': ['წიწილები'],
  'ლეკვი': ['ლეკვები'],
  'ძაღლი': ['ძაღლები'],
  'კატა': ['კატები'],
  'კნუტი': ['კნუტები'],
  'ფუტკრის ოჯახი': ['ფუტკარი', 'ფუტკრები'],
  'საბურავები': ['საბურავი'],
  'თესლი': ['თესლები'],
  'ნერგი': ['ნერგები'],
  'სამშენებლო ხელსაწყო': ['ხელსაწყო', 'ინსტრუმენტი'],
  'ელექტრო ხელსაწყო': ['ელექტროხელსაწყო', 'დრელი', 'ბარგალკა'],
  'ავეჯი': ['მაგიდა', 'სკამი', 'კარადა', 'საწოლი'],
  'სახლი': ['სახლები', 'ეზოიანი სახლი'],
  'ბინა': ['ბინები'],
  'აგარაკი': ['დასასვენებელი სახლი'],
  'მიწის ნაკვეთი': ['ნაკვეთი', 'მიწა'],
  'სასოფლო-სამეურნეო მიწა': ['სასოფლო მიწა', 'სავარგული'],
  'სამშენებლო მიწა': ['სამშენებლო ნაკვეთი'],
  'ვენახი': ['ვენახები', 'ყურძნის ვენახი'],
  'ბაღი / ხეხილის ნაკვეთი': ['ბაღი', 'ხეხილი', 'ხეხილის ბაღი'],
  'ფერმა': ['მეურნეობა'],
  'კომერციული ფართი': ['ფართი', 'მაღაზია', 'ბიზნეს ფართი'],
  'გარაჟი': ['ავტოფარეხი'],
};

export default function AddPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authError, setAuthError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [registerData, setRegisterData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const categoryPickerRef = useRef<HTMLDivElement | null>(null);
  const locationPickerRef = useRef<HTMLDivElement | null>(null);
  
  // ✨ Added 'currency' to form state (default: GEL)
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    description: '',
    price: '',
    phone: '',
    location: LOCATION_OPTIONS[0] ?? '',
    category: ANNOUNCEMENT_CATEGORIES[0],
    currency: 'GEL',
    itemName: '',
    whatsappViber: '',
    condition: '',
    quantity: '',
    delivery: '',
    animalKind: '',
    breed: '',
    age: '',
    gender: '',
    vetInfo: '',
    documentInfo: '',
  });
  const isAuthenticated = Boolean(session);
  const isAnimalSaleCategory = ANIMAL_SALE_CATEGORIES.includes(formData.category as typeof ANIMAL_SALE_CATEGORIES[number]);
  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const visibleCategoryGroups = ANNOUNCEMENT_CATEGORY_GROUPS
    .map((group) => ({
      ...group,
      categories: group.categories.filter((category) => {
        if (!normalizedCategorySearch) return true;
        const keywords = CATEGORY_SEARCH_KEYWORDS[category] ?? [];
        return category.toLowerCase().includes(normalizedCategorySearch) ||
          group.title.toLowerCase().includes(normalizedCategorySearch) ||
          keywords.some((keyword) => keyword.toLowerCase().includes(normalizedCategorySearch));
      }),
    }))
    .filter((group) => group.categories.length > 0);
  const categorySuggestions = visibleCategoryGroups.flatMap((group) =>
    group.categories.map((category) => ({ category, groupTitle: group.title }))
  ).slice(0, 10);
  const normalizedLocationSearch = locationSearch.trim().toLowerCase();
  const visibleLocationOptions = LOCATION_OPTIONS.filter((location) =>
    !normalizedLocationSearch || location.toLowerCase().includes(normalizedLocationSearch)
  );
  const locationSuggestions = visibleLocationOptions.slice(0, 10);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && categoryPickerRef.current && !categoryPickerRef.current.contains(target)) {
        setShowCategorySuggestions(false);
      }
      if (target && locationPickerRef.current && !locationPickerRef.current.contains(target)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const setAuthRedirectCookie = useCallback((target: string) => {
    try {
      document.cookie = `auth_redirect=${encodeURIComponent(target)}; path=/; max-age=600`;
    } catch {
      // ignore
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        return;
      }

      const { data: refreshed } = await supabase.auth.refreshSession();
      setSession(refreshed.session ?? null);
    } catch {
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'უცნობი შეცდომა';
    }
  };

  useEffect(() => {
    async function fetchBG() {
      const { data }: any = await ((supabase as any).from('site_settings')).select('value').eq('key', 'background_url').single();
      if (data && 'value' in data) setBgImage(data.value as string);
    }
    fetchBG();
  }, []);

  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('focus', refreshSession);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', refreshSession);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (session) return;
    let active = true;
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(async () => {
      if (!active) return;
      attempts += 1;
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setLoadingSession(false);
          clearInterval(interval);
          return;
        }

        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed.session) {
          setSession(refreshed.session);
          setLoadingSession(false);
          clearInterval(interval);
          return;
        }
      } catch {
        setSession(null);
      }

      if (attempts >= maxAttempts) {
        setLoadingSession(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [session]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    const onMessage = (payload: MessageEvent) => {
      if (!payload?.data || payload.data.type !== 'auth-complete') return;
      refreshSession();
    };

    try {
      channel = new BroadcastChannel('mykakheti-auth');
      channel.onmessage = (event) => {
        if (event?.data?.type === 'auth-complete') {
          refreshSession();
        }
      };
    } catch {
      // BroadcastChannel may be unavailable in older browsers.
    }

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
      if (channel) channel.close();
    };
  }, [refreshSession]);

  const handleOAuth = async (provider: 'google') => {
    setAuthError('');
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${AUTH_LANDING_PATH}` },
    });
    if (error) setAuthError('Social ავტორიზაცია ვერ შესრულდა, სცადეთ თავიდან.');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.refresh();
  };

  const handleEmailActivation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterMessage('');

    if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.phone || !registerData.password) {
      setRegisterError('გთხოვთ შეავსოთ ყველა ველი.');
      return;
    }

    setRegisterLoading(true);
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    try {
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            phone: registerData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${AUTH_LANDING_PATH}`,
        },
      });

      if (error) throw error;
      setRegisterMessage('აქტივაციის ბმული გაიგზავნა თქვენს მითითებულ ელფოსტაზე. გთხოვთ შეამოწმოთ საფოსტო ყუთი.');
      setRegisterData({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setRegisterError(`ვერ გაიგზავნა ბმული: ${message}`);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleInlineLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('გთხოვთ შეავსოთ ელფოსტა და პაროლი.');
      return;
    }

    setLoginLoading(true);
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setLoginEmail('');
      setLoginPassword('');
      router.push(AUTH_LANDING_PATH);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    setResetError('');
    setResetMessage('');

    if (!email) {
      setResetError('გთხოვთ შეიყვანოთ ელფოსტა პაროლის აღსადგენად.');
      return;
    }

    setResetLoading(true);
    setAuthRedirectCookie(AUTH_LANDING_PATH);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset?redirect=${AUTH_LANDING_PATH}`,
      });
      if (error) throw error;
      setResetMessage('პაროლის აღდგენის ბმული გაიგზავნა ელფოსტაზე.');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  };


  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // ✅ 5 ფოტოს მკაცრი ლიმიტი
    if (images.length + files.length > 5) {
      return alert('შეგიძლიათ ატვირთოთ მაქსიმუმ 5 ფოტო მეხსიერების დასაზოგად.');
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImages(prev => [...prev, file]);
        setPreviews(prev => [...prev, URL.createObjectURL(file)]);
      }
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handlePost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (!formData.title) {
      alert('გთხოვთ მიუთითოთ სათაური');
      return;
    }

    if (images.length === 0) {
      alert('გთხოვთ ატვირთოთ მინიმუმ ერთი ფოტო');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = new FormData();
      images.forEach((file) => data.append('file', file));
      data.append('title', formData.title);
      const extraDetails = [
        formData.itemName ? `რას ყიდით: ${formData.itemName}` : '',
        formData.whatsappViber ? `WhatsApp/Viber: ${formData.whatsappViber}` : '',
        formData.condition ? `მდგომარეობა: ${formData.condition}` : '',
        formData.quantity ? `რაოდენობა: ${formData.quantity}` : '',
        formData.delivery ? `მიწოდება/ტრანსპორტირება: ${formData.delivery}` : '',
        isAnimalSaleCategory ? 'ცხოველების უსაფრთხოების გაფრთხილება: საიტზე დასაშვებია მხოლოდ კანონიერად ნებადართული შინაური ცხოველებისა და სასოფლო-სამეურნეო პირუტყვის განთავსება. აკრძალულია დაცული, ველური ან უკანონოდ მოპოვებული სახეობების გაყიდვა.' : '',
        isAnimalSaleCategory && formData.animalKind ? `ცხოველის / ფრინველის სახეობა: ${formData.animalKind}` : '',
        isAnimalSaleCategory && formData.breed ? `ჯიში: ${formData.breed}` : '',
        isAnimalSaleCategory && formData.age ? `ასაკი: ${formData.age}` : '',
        isAnimalSaleCategory && formData.gender ? `სქესი: ${formData.gender}` : '',
        isAnimalSaleCategory && formData.vetInfo ? `აცრები / ვეტერინარული ინფორმაცია: ${formData.vetInfo}` : '',
        isAnimalSaleCategory && formData.documentInfo ? `დოკუმენტი / პასპორტი: ${formData.documentInfo}` : '',
      ].filter(Boolean).join('\n');
      const description = [formData.description, extraDetails].filter(Boolean).join('\n\n');

      data.append('description', description);
      data.append('category', formData.category);
      data.append('location', formData.location);
      data.append('price', formData.price);
      data.append('currency', formData.currency);
      data.append('phone', formData.phone);
      data.append('userId', session?.user?.id || '');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setIsSubmitted(true);
    } catch (err: any) {
      alert(`შეცდომა: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col bg-[#050510] text-white font-sans">
      <div className="fixed inset-0 z-0">
         {bgImage && (
           <Image
             src={bgImage}
             alt=""
             fill
             sizes="100vw"
             className="object-cover opacity-40 transition-opacity duration-1000"
             priority
           />
         )}
         <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-[10px]" />
      </div>

      <nav className="relative z-50 px-4 sm:px-6 md:px-10 py-4 sm:py-6 border-b border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-black/40 backdrop-blur-xl">
        <Link href="/" className="text-xl font-black italic tracking-tighter">mykakheti<span className="text-amber-500">.ge</span></Link>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          <Link href="/" className="text-[10px] font-black uppercase italic text-white/40 hover:text-white transition-all">← მთავარზე დაბრუნება</Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[10px] font-black uppercase italic text-white/70 hover:text-white transition-all bg-white/5 border border-white/10 rounded-full px-3 py-1"
            >
              გამოსვლა
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="bg-slate-950/60 backdrop-blur-3xl p-8 md:p-12 rounded-[45px] border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black uppercase italic tracking-widest text-amber-500 drop-shadow-lg">განცხადების დამატება</h1>
          </div>

          {loadingSession && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              იტვირთება ავტორიზაცია...
            </div>
          )}

          {!isAuthenticated && !loadingSession && (
            <div className="mb-8 space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-50">
              <div className="text-center space-y-2">
                <p className="font-black uppercase tracking-wide text-[11px]">საწყის ეტაპზე საჭიროა ავტორიზაცია ან რეგისტრაცია.</p>
                <p className="text-[11px] text-white/70">რეგისტრაციის დასრულების შემდეგ ავტომატურად გამოჩნდება განცხადების ფორმა.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wide text-white/70">სწრაფი სოც. ავტორიზაცია</h3>
                    <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOAuth('google')}
                      className="rounded-xl bg-white text-slate-900 font-black py-3 uppercase text-[11px] hover:bg-amber-50 transition"
                    >
                      Google ავტორიზაცია
                    </button>
                    {/* Facebook ავტორიზაცია დროებით შეჩერებულია */}
                  </div>
                  <form onSubmit={handleInlineLogin} className="space-y-2 pt-2">
                    <input
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                      placeholder="ელფოსტა"
                      type="email"
                      value={loginEmail}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                    />
                    <div className="relative">
                      <input
                        className="w-full p-3 pr-16 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                        placeholder="პაროლი"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white/60 hover:text-white transition"
                      >
                        {showLoginPassword ? 'დამალვა' : 'ჩვენება'}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full rounded-xl bg-white/90 text-slate-900 font-black py-3 uppercase text-[11px] hover:bg-white transition disabled:opacity-60"
                    >
                      {loginLoading ? 'იტვირთება...' : 'შესვლა'}
                    </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetModal(true);
                          setResetError('');
                          setResetMessage('');
                          setResetEmail('');
                        }}
                        className="w-full rounded-xl border border-white/20 text-white/80 font-black py-2 uppercase text-[10px] hover:text-white hover:border-white/40 transition"
                      >
                        პაროლის აღდგენა
                      </button>
                    {loginError && <p className="text-red-300 text-xs font-semibold">{loginError}</p>}
                      {resetError && <p className="text-red-300 text-xs font-semibold">{resetError}</p>}
                      {resetMessage && <p className="text-emerald-300 text-xs font-semibold">{resetMessage}</p>}
                  </form>
                    {showResetModal && (
                      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b15]/95 p-5 shadow-2xl">
                          <div className="text-center mb-3">
                            <h4 className="text-sm font-black uppercase tracking-wide text-white">პაროლის აღდგენა</h4>
                            <p className="text-[11px] text-white/60">შეიყვანეთ ელფოსტა ბმულის მისაღებად</p>
                          </div>
                          <input
                            className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                            placeholder="ელფოსტა"
                            type="email"
                            value={resetEmail}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
                          />
                          <div className="mt-3 space-y-2">
                            <button
                              type="button"
                              onClick={() => handlePasswordReset(resetEmail)}
                              disabled={resetLoading}
                              className="w-full rounded-xl bg-amber-600 text-white font-black py-2.5 uppercase text-[11px] hover:bg-amber-500 transition disabled:opacity-60"
                            >
                              {resetLoading ? 'იგზავნება...' : 'ბმულის გაგზავნა'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowResetModal(false)}
                              className="w-full rounded-xl border border-white/20 text-white/70 font-black py-2 uppercase text-[10px] hover:text-white hover:border-white/40 transition"
                            >
                              დახურვა
                            </button>
                            {resetError && <p className="text-red-300 text-xs font-semibold">{resetError}</p>}
                            {resetMessage && <p className="text-emerald-300 text-xs font-semibold">{resetMessage}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  {authError && <p className="text-red-300 text-xs font-semibold">{authError}</p>}
                </div>

                <form onSubmit={handleEmailActivation} className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wide text-white/70">სწრაფი რეგისტრაცია (Email ლინკი)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                      placeholder="სახელი"
                      value={registerData.firstName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    />
                    <input
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                      placeholder="გვარი"
                      value={registerData.lastName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, lastName: e.target.value })}
                    />
                  </div>
                  <input
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                    placeholder="ელფოსტა"
                    type="email"
                    value={registerData.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                  <input
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                    placeholder="ტელეფონი"
                    value={registerData.phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, phone: e.target.value })}
                  />
                  <div className="relative">
                    <input
                      className="w-full p-3 pr-16 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                      placeholder="პაროლი"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white/60 hover:text-white transition"
                    >
                      {showRegisterPassword ? 'დამალვა' : 'ჩვენება'}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/60">პაროლი: მინ. 6 სიმბოლო</p>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full rounded-xl bg-amber-600 text-white font-black py-3 uppercase text-[11px] hover:bg-amber-500 transition disabled:opacity-60"
                  >
                    {registerLoading ? 'იგზავნება...' : 'მიიღე აქტივაციის ბმული'}
                  </button>
                  {registerError && <p className="text-red-300 text-xs font-semibold">{registerError}</p>}
                  {registerMessage && <p className="text-emerald-300 text-xs font-semibold">{registerMessage}</p>}
                </form>
              </div>
            </div>
          )}

          {isAuthenticated && !isSubmitted && (
          <form onSubmit={handlePost} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
               {previews.map((src, i) => (
                 <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/20 relative shadow-xl group">
                   <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                   <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase">წაშლა</button>
                 </div>
               ))}
               {images.length < 5 && (
                 <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-white/10 transition-all group">
                   <span className="text-2xl text-white/20 group-hover:text-amber-500 transition-colors">+</span>
                   <span className="text-[8px] font-black uppercase text-white/20 mt-1">ფოტო</span>
                   <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                 </label>
               )}
            </div>
            
            <div className="text-[9px] text-white/20 uppercase font-bold text-center mb-6 tracking-widest bg-white/5 py-2 rounded-full">
               ატვირთულია: {images.length} / 5 (ფოტოები ავტომატურად ოპტიმიზირდება)
            </div>

            <div className="space-y-4">
              <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/20" placeholder="განცხადების სათაური" onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, title: e.target.value})} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div ref={categoryPickerRef} className="space-y-2">
                  <input
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/25"
                    placeholder="რას ყიდით? მაგ: გოჭი, საბურავი, თესლი..."
                    value={categorySearch}
                    onFocus={() => setShowCategorySuggestions(true)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setCategorySearch(e.target.value);
                      setShowCategorySuggestions(true);
                    }}
                  />
                  {showCategorySuggestions && categorySearch.trim() && categorySuggestions.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-amber-300/20 bg-black/80 p-2 shadow-2xl">
                      {categorySuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.groupTitle}-${suggestion.category}`}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, category: suggestion.category });
                            setCategorySearch(suggestion.category);
                            setShowCategorySuggestions(false);
                          }}
                          className={`mb-1 w-full rounded-xl px-3 py-2 text-left transition last:mb-0 ${
                            formData.category === suggestion.category ? 'bg-amber-500/20 text-amber-100' : 'bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-amber-200/55">
                            {suggestion.groupTitle === 'საყოფაცხოვრებო ნივთები' ? 'გასაყიდი საქონელი' : suggestion.groupTitle}
                          </span>
                          <span className="mt-0.5 block text-sm font-black">{suggestion.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <select required className="w-full p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" value={formData.category} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setFormData({...formData, category: e.target.value});
                    setShowCategorySuggestions(false);
                  }}>
                    <option value="">აირჩიეთ კატეგორია...</option>
                    {visibleCategoryGroups.map((group) => (
                      <optgroup key={group.title} label={group.title === 'საყოფაცხოვრებო ნივთები' ? 'გასაყიდი საქონელი — საყოფაცხოვრებო ნივთები' : group.title}>
                        {group.categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  {visibleCategoryGroups.length === 0 && (
                    <p className="text-[11px] font-bold text-amber-200/80">კატეგორია ვერ მოიძებნა.</p>
                  )}
                </div>
                <div ref={locationPickerRef} className="space-y-2">
                  <input
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/25"
                    placeholder="ადგილმდებარეობის ძებნა..."
                    value={locationSearch}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setLocationSearch(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                  />
                  {showLocationSuggestions && locationSearch.trim() && locationSuggestions.length > 0 && (
                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-amber-300/20 bg-black/80 p-2 shadow-2xl">
                      {locationSuggestions.map((location) => (
                        <button
                          key={location}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, location });
                            setLocationSearch(location);
                            setShowLocationSuggestions(false);
                          }}
                          className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm font-black transition last:mb-0 ${
                            formData.location === location ? 'bg-amber-500/20 text-amber-100' : 'bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                  <select className="w-full p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" value={formData.location} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setFormData({...formData, location: e.target.value});
                    setShowLocationSuggestions(false);
                  }}>
                    {visibleLocationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                  {visibleLocationOptions.length === 0 && (
                    <p className="text-[11px] font-bold text-amber-200/80">ლოკაცია ვერ მოიძებნა.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ✨ განახლებული ფასის ველი ვალუტის არჩევით */}
                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500 transition-all overflow-hidden">
                   <input 
                     required
                     type="text"
                     className="w-full p-5 bg-transparent outline-none font-bold text-white placeholder:text-white/20" 
                     placeholder="ფასი ან შეთანხმებით"
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, price: e.target.value})} 
                   />
                   <div className="flex bg-black/30 p-1 m-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, currency: 'GEL'})}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${formData.currency === 'GEL' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                      >
                        ₾
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, currency: 'USD'})}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${formData.currency === 'USD' ? 'bg-green-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                      >
                        $
                      </button>
                   </div>
                </div>

                <input required className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/20" placeholder="ტელეფონი" onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/20" placeholder="რას ყიდით?" value={formData.itemName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, itemName: e.target.value})} />
                <input className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/20" placeholder="WhatsApp/Viber" value={formData.whatsappViber} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, whatsappViber: e.target.value})} />
                <select className="p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" value={formData.condition} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, condition: e.target.value})}>
                  <option value="">მდგომარეობა</option>
                  <option value="ახალი">ახალი</option>
                  <option value="მეორადი">მეორადი</option>
                  <option value="სხვა">სხვა</option>
                </select>
                <input className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/20" placeholder="რაოდენობა, თუ საჭიროა" value={formData.quantity} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, quantity: e.target.value})} />
                <select className="p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none sm:col-span-2" value={formData.delivery} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, delivery: e.target.value})}>
                  <option value="">მიწოდება/ტრანსპორტირება</option>
                  <option value="კი">კი</option>
                  <option value="არა">არა</option>
                  <option value="შეთანხმებით">შეთანხმებით</option>
                </select>
              </div>

              {isAnimalSaleCategory && (
                <div className="space-y-4 rounded-[28px] border border-amber-300/25 bg-amber-500/10 p-5">
                  <p className="text-[11px] font-bold leading-relaxed text-amber-50">
                    საიტზე დასაშვებია მხოლოდ კანონიერად ნებადართული შინაური ცხოველებისა და სასოფლო-სამეურნეო პირუტყვის განთავსება. აკრძალულია დაცული, ველური ან უკანონოდ მოპოვებული სახეობების გაყიდვა.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input className="p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/25" placeholder="ცხოველის / ფრინველის სახეობა" value={formData.animalKind} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, animalKind: e.target.value})} />
                    <input className="p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/25" placeholder="ჯიში, თუ ცნობილია" value={formData.breed} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, breed: e.target.value})} />
                    <input className="p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/25" placeholder="ასაკი" value={formData.age} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, age: e.target.value})} />
                    <select className="p-4 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" value={formData.gender} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, gender: e.target.value})}>
                      <option value="">სქესი</option>
                      <option value="მდედრი">მდედრი</option>
                      <option value="მამრობითი">მამრობითი</option>
                      <option value="უცნობია">უცნობია</option>
                    </select>
                    <input className="p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/25" placeholder="აცრები / ვეტერინარული ინფორმაცია" value={formData.vetInfo} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, vetInfo: e.target.value})} />
                    <input className="p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/25" placeholder="დოკუმენტი / პასპორტი" value={formData.documentInfo} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, documentInfo: e.target.value})} />
                  </div>
                </div>
              )}
              
              <textarea rows={5} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 italic text-white placeholder:text-white/20 resize-none" placeholder="აღწერეთ დეტალურად..." onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})} />
            </div>

            <button type="submit" disabled={loading || !isAuthenticated} className="w-full py-6 bg-amber-600 text-white rounded-[30px] font-black uppercase italic shadow-[0_20px_40px_-10px_rgba(217,119,6,0.4)] hover:bg-amber-500 transition-all active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed">
              {loading ? 'მიმდინარეობს ატვირთვა...' : isAuthenticated ? 'გამოქვეყნება 🚀' : 'ავტორიზაცია სჭირდება'}
            </button>
          </form>
          )}

          {isSubmitted && (
            <div className="text-center py-8 space-y-4">
              <p className="text-emerald-300 text-lg font-semibold">თქვენი განცხადება წარმატებით გაიგზავნა მოდერაციაზე! 🚀</p>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase text-[12px] hover:bg-white/10 transition"
                >
                  ← უკან
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-5 py-3 rounded-xl bg-amber-600 text-white font-black uppercase text-[12px] hover:bg-amber-500 transition"
                >
                  მთავარი გვერდი
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* -- fix_announcements_storage_policies.sql
-- Fix storage policies for the 'announcements' bucket
-- Run this in Supabase SQL Editor

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete announcements" ON storage.objects;

-- Allow public read
CREATE POLICY "Anyone can view announcements" ON storage.objects
FOR SELECT USING (bucket_id = 'announcements');

-- Allow any authenticated user to upload/delete in this bucket
CREATE POLICY "Authenticated can upload announcements" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'announcements'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can delete announcements" ON storage.objects
FOR DELETE USING (
  bucket_id = 'announcements'
  AND auth.uid() IS NOT NULL
);
*/
