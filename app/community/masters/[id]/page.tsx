import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import MasterDetailsClient from "./MasterDetailsClient";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL = "https://mykakheti.ge";

const cleanDescription = (value?: string | null) => (
  value?.replace(/\s+/g, " ").trim().slice(0, 160) || "სერვისის განცხადება კახეთში - MYKAKHETI.GE"
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: service } = supabase
    ? await supabase.from("masters").select("*").eq("id", id).single()
    : { data: null };

  if (!service) {
    return {
      title: "სერვისი | MYKAKHETI.GE",
      openGraph: {
        title: "სერვისი | MYKAKHETI.GE",
        url: `${SITE_URL}/community/masters/${id}`,
        siteName: "MYKAKHETI.GE",
        locale: "ka_GE",
        type: "article",
      },
    };
  }

  const title = `${service.full_name ?? "სერვისი"} - ${service.profession ?? "მომსახურება"}`;
  const description = cleanDescription(service.description || service.category || service.location);
  const images = service.photo_url
    ? [{ url: service.photo_url, width: 1200, height: 630, alt: title }]
    : [];

  return {
    title: `${title} | MYKAKHETI.GE`,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/community/masters/${id}`,
      siteName: "MYKAKHETI.GE",
      images,
      locale: "ka_GE",
      type: "article",
    },
    twitter: {
      card: service.photo_url ? "summary_large_image" : "summary",
      title,
      description,
      images: service.photo_url ? [service.photo_url] : [],
    },
  };
}

export default function MasterDetailsPage() {
  return <MasterDetailsClient />;
}
