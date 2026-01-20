'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import SubmissionAuthGate from '../auth/SubmissionAuthGate';
import imageCompression from 'browser-image-compression';
import CongratulationsSection from './CongratulationsSection';

interface CommunityEngagementSectionProps {
  className?: string;
}

type CommunityCardConfig = {
  key: 'obituaries' | 'lost-found' | 'masters' | 'congratulations';
  icon: string;
  submitHref: string;
  submitLabel: string;
  viewHref: string;
  viewLabel: string;
};

const COMMUNITY_CARDS: CommunityCardConfig[] = [
  {
    key: 'obituaries',
    icon: '🕊️',
    submitHref: '/community/obituaries/submit',
    submitLabel: 'სამძიმრის დამატება',
    viewHref: '/community/obituaries',
    viewLabel: 'ნახვა',
  },
  {
    key: 'lost-found',
    icon: '🔎',
    submitHref: '/community/lost-found/submit',
    submitLabel: 'დაკარგული/ნაპოვნის დამატება',
    viewHref: '/community/lost-found',
    viewLabel: 'ნახვა',
  },
  {
    key: 'masters',
    icon: '🛠️',
    submitHref: '/community/masters/submit',
    submitLabel: 'ოსტატის დამატება',
    viewHref: '/community/masters',
    viewLabel: 'ნახვა',
  },
  {
    key: 'congratulations',
    icon: '🎉',
    submitHref: '/community/congratulations/submit',
    submitLabel: 'მისალოცის დამატება',
    viewHref: '/community/congratulations',
    viewLabel: 'ნახვა',
  },
];

export default function CommunityEngagementSection({ className }: CommunityEngagementSectionProps) {
  const [activeCard, setActiveCard] = useState<CommunityCardConfig | null>(null);

  const closeModal = () => setActiveCard(null);

  // Masters form state
  const [masterFullName, setMasterFullName] = useState('');
  const [masterProfession, setMasterProfession] = useState('');
  const [masterPhone, setMasterPhone] = useState('');
  const [masterLocation, setMasterLocation] = useState('');
  const [masterDescription, setMasterDescription] = useState('');
  const [masterPhotoUrl, setMasterPhotoUrl] = useState('');
  const [masterServiceArea, setMasterServiceArea] = useState('');
  const [masterPriceNote, setMasterPriceNote] = useState('');
  const [masterSubmitted, setMasterSubmitted] = useState(false);

  // Lost & Found form state
  const [lfTitle, setLfTitle] = useState('');
  const [lfDescription, setLfDescription] = useState('');
  const [lfLocation, setLfLocation] = useState('');
  const [lfContact, setLfContact] = useState('');
  const [lfImageUrl, setLfImageUrl] = useState('');
  const [lfKind, setLfKind] = useState<'lost' | 'found'>('lost');
  const [lfCategory, setLfCategory] = useState<'document' | 'pet' | 'keys_items' | 'other'>('other');
  const [lfSubmitted, setLfSubmitted] = useState(false);

  // Congratulations form state
  const [congratsSenderName, setCongratsSenderName] = useState('');
  const [congratsReceiverName, setCongratsReceiverName] = useState('');
  const [congratsMessage, setCongratsMessage] = useState('');
  const [congratsCategory, setCongratsCategory] = useState('');
  const [congratsImage, setCongratsImage] = useState<File | null>(null);
  const [congratsImageUrl, setCongratsImageUrl] = useState('');
  const [congratsSubmitted, setCongratsSubmitted] = useState(false);

  // Obituaries form state
  const [obFullName, setObFullName] = useState('');
  const [obFuneralAt, setObFuneralAt] = useState('');
  const [obFuneralPlace, setObFuneralPlace] = useState('');
  const [obImageUrl, setObImageUrl] = useState('');
  const [obSubmitted, setObSubmitted] = useState(false);

  const submitMaster = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.from('masters').insert({
      full_name: masterFullName,
      profession: masterProfession,
      phone: masterPhone,
      location: masterLocation,
      description: masterDescription,
      photo_url: masterPhotoUrl,
      service_area: masterServiceArea,
      price_note: masterPriceNote,
      is_approved: false,
    });
    if (error) alert('Error: ' + error.message);
    else {
      setMasterSubmitted(true);
      setTimeout(() => closeModal(), 2000);
    }
  };

  const submitLf = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.from('lost_found').insert({
      title: lfTitle,
      description: lfDescription,
      location: lfLocation,
      contact: lfContact,
      image_url: lfImageUrl,
      kind: lfKind,
      category: lfCategory,
      is_approved: false,
      resolved: false,
    });
    if (error) alert('Error: ' + error.message);
    else {
      setLfSubmitted(true);
      setTimeout(() => closeModal(), 2000);
    }
  };

  const submitCongrats = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let imageUrl = congratsImageUrl;
    if (congratsImage) {
      const compressedFile = await imageCompression(congratsImage, { maxSizeMB: 1, maxWidthOrHeight: 800 });
      const fileName = `congrats-${Date.now()}.jpg`;
      const { data, error: uploadError } = await supabase.storage.from('congratulations').upload(fileName, compressedFile);
      if (uploadError) {
        alert('Upload error: ' + uploadError.message);
        return;
      }
      imageUrl = supabase.storage.from('congratulations').getPublicUrl(fileName).data.publicUrl;
    }
    const { error } = await supabase.from('congratulations').insert({
      sender_name: congratsSenderName,
      receiver_name: congratsReceiverName,
      message: congratsMessage,
      category: congratsCategory,
      image_url: imageUrl,
      is_approved: false,
    });
    if (error) alert('Error: ' + error.message);
    else {
      setCongratsSubmitted(true);
      setTimeout(() => closeModal(), 2000);
    }
  };

  const submitOb = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.from('obituaries').insert({
      full_name: obFullName,
      funeral_at: obFuneralAt,
      funeral_place: obFuneralPlace,
      image_url: obImageUrl,
      is_approved: false,
    });
    if (error) alert('Error: ' + error.message);
    else {
      setObSubmitted(true);
      setTimeout(() => closeModal(), 2000);
    }
  };

  const containerClasses = [
    'bg-black/70 backdrop-blur-3xl rounded-[30px] p-4 md:p-6 shadow-3xl border border-white/10',
    className ?? '',
  ]
    .join(' ')
    .trim();

  return (
    <div className={containerClasses}>
      <h4 className="text-white font-black uppercase tracking-[0.4em] mb-1 w-full text-center">სათემო ჩართულობა</h4>
      <p className="w-full text-white font-bold uppercase tracking-[0.2em] mb-2 leading-tight text-center">
        გამოქვეყნეთ, გააზიარეთ და მიულოცეთ
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {COMMUNITY_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.submitHref}
            className="bg-black/60 backdrop-blur-xl rounded-[30px] border border-white/5 p-3 flex flex-col items-center justify-center hover:bg-black/80 transition-all text-center"
          >
            <span className="text-2xl mb-1">{card.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white block">
              {card.key === 'obituaries' ? 'სამძიმარი' : card.key === 'lost-found' ? 'დაკარგული/ნაპოვნი' : card.key === 'masters' ? 'ოსტატები' : 'მისალოცი'}
            </span>
            <span className="mt-1 text-[9px] text-white/50">დამატება</span>
          </Link>
        ))}
      </div>

      {/* <div className="mt-6">
        <CongratulationsSection />
      </div> */}
    </div>
  );
}
