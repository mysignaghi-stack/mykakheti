import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import NativeVideoShareButton from "@/app/components/share/NativeVideoShareButton";
import StableVideoPlayer from "@/app/components/media/StableVideoPlayer";

type Props = {
  params: Promise<{ id: string }>;
};

const SITE_URL = "https://mykakheti.ge";

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
const toAbsoluteUrl = (url: string) => (
  /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`
);

const getVideoMimeType = (url: string) => {
  if (/\.webm(\?|#|$)/i.test(url)) return "video/webm";
  if (/\.ogg(\?|#|$)/i.test(url)) return "video/ogg";
  if (/\.mov(\?|#|$)/i.test(url)) return "video/quicktime";
  return "video/mp4";
};

const getPrimaryMedia = (post: {
  media_url?: string | null;
  media_urls?: string[] | null;
  media_type?: string | null;
}) => {
  const media = (post.media_urls ?? []).filter(Boolean);
  const first = media[0] || post.media_url || "";
  const firstImage = media.find((url) => !isVideoUrl(url));
  const firstVideo = media.find((url) => isVideoUrl(url)) || (isVideoUrl(first) ? first : "");

  return {
    first,
    image: firstImage || (!isVideoUrl(first) && post.media_type !== "video" ? first : ""),
    video: firstVideo || (post.media_type === "video" ? first : ""),
  };
};

const cleanDescription = (value?: string | null) => (
  value?.replace(/\s+/g, " ").trim().slice(0, 160) || "ადმინისტრაციის განცხადება MYKAKHETI.GE-ზე"
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: post } = supabase
    ? await supabase.from("admin_posts").select("*").eq("id", Number(id)).single()
    : { data: null };

  if (!post) {
    return {
      title: "განცხადება | MYKAKHETI.GE",
      openGraph: {
        title: "განცხადება | MYKAKHETI.GE",
        url: `${SITE_URL}/admin-posts/${id}`,
        siteName: "MYKAKHETI.GE",
        locale: "ka_GE",
        type: "article",
      },
    };
  }

  const media = getPrimaryMedia(post);
  const imageUrl = media.image ? toAbsoluteUrl(media.image) : "";
  const videoUrl = media.video ? toAbsoluteUrl(media.video) : "";
  const title = post.title || "ადმინისტრაციის განცხადება";
  const description = cleanDescription(post.content || post.category);
  const openGraphBase = {
    title,
    description,
    url: `${SITE_URL}/admin-posts/${post.id}`,
    siteName: "MYKAKHETI.GE",
    images: imageUrl ? [{ url: imageUrl, secureUrl: imageUrl, width: 1200, height: 630, alt: title }] : [],
    locale: "ka_GE",
  };

  return {
    title: `${title} | MYKAKHETI.GE`,
    description,
    openGraph: videoUrl
      ? {
          ...openGraphBase,
          type: "video.other",
          videos: [{
            url: videoUrl,
            secureUrl: videoUrl,
            type: getVideoMimeType(videoUrl),
            width: 1280,
            height: 720,
          }],
        }
      : {
          ...openGraphBase,
          type: "article",
        },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function AdminPostSharePage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: post } = supabase
    ? await supabase.from("admin_posts").select("*").eq("id", Number(id)).single()
    : { data: null };

  if (!post) notFound();

  const media = getPrimaryMedia(post);

  return (
    <main className="min-h-screen bg-[#050510] p-6 text-white md:p-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 transition hover:text-white">
          ← მთავარი გვერდი
        </Link>
        <div className="overflow-hidden rounded-[28px] border border-amber-400/20 bg-white/[0.04] shadow-2xl">
          {media.first && (
            <div className="relative flex h-[320px] items-center justify-center bg-black md:h-[520px]">
              {media.video ? (
                <StableVideoPlayer src={media.video} />
              ) : (
                <Image src={media.image || media.first} alt={post.title} fill sizes="100vw" className="object-contain" />
              )}
            </div>
          )}
          <div className="space-y-3 p-5 md:p-7">
            {post.category && (
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/70">{post.category}</p>
            )}
            <h1 className="text-2xl font-black uppercase text-amber-200 md:text-4xl">{post.title}</h1>
            {post.content && <p className="whitespace-pre-line text-sm leading-relaxed text-white/75 md:text-base">{post.content}</p>}
            {post.link && (
              <a
                href={post.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-amber-300/35 bg-amber-500/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-500/25"
              >
                ბმულზე გადასვლა
              </a>
            )}
            {media.video && (
              <NativeVideoShareButton
                videoUrl={media.video}
                fallbackUrl={`${SITE_URL}/admin-posts/${post.id}`}
                title={post.title}
                description={post.content}
                category={post.category}
                className="inline-flex rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-60"
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
