type AnnouncementSeoInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  price?: string | number | null;
  currency?: string | null;
};

const GEORGIAN_TO_LATIN: Record<string, string> = {
  ა: 'a',
  ბ: 'b',
  გ: 'g',
  დ: 'd',
  ე: 'e',
  ვ: 'v',
  ზ: 'z',
  თ: 't',
  ი: 'i',
  კ: 'k',
  ლ: 'l',
  მ: 'm',
  ნ: 'n',
  ო: 'o',
  პ: 'p',
  ჟ: 'zh',
  რ: 'r',
  ს: 's',
  ტ: 't',
  უ: 'u',
  ფ: 'f',
  ქ: 'q',
  ღ: 'gh',
  ყ: 'y',
  შ: 'sh',
  ჩ: 'ch',
  ც: 'ts',
  ძ: 'dz',
  წ: 'ts',
  ჭ: 'ch',
  ხ: 'kh',
  ჯ: 'j',
  ჰ: 'h',
};

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const slugifyGeorgian = (value: string | null | undefined) => {
  const transliterated = (value ?? '')
    .toLowerCase()
    .split('')
    .map((char) => GEORGIAN_TO_LATIN[char] ?? char)
    .join('');

  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80) || 'announcement';
};

export const getAnnouncementPath = (ad: AnnouncementSeoInput) => (
  `/announcements/${slugifyGeorgian(`${ad.title ?? ''} ${ad.location ?? ''}`)}-${ad.id}`
);

export const extractAnnouncementId = (segment: string) => {
  const decoded = decodeURIComponent(segment);
  const uuidMatch = decoded.match(UUID_PATTERN);
  return uuidMatch?.[0] ?? decoded;
};

export const formatAnnouncementPrice = (ad: Pick<AnnouncementSeoInput, 'price' | 'currency'>) => {
  const price = ad.price === null || ad.price === undefined ? '' : String(ad.price).trim();
  if (!price || price === '0') return 'შეთანხმებით';
  const currency = ad.currency === 'USD' ? '$' : 'ლარი';
  return `${price} ${currency}`;
};

export const buildAnnouncementSeoDescription = (ad: AnnouncementSeoInput) => {
  const title = ad.title?.trim() || 'განცხადება';
  const location = ad.location?.trim() || 'კახეთში';
  const category = ad.category?.trim() || 'განცხადება';
  const price = formatAnnouncementPrice(ad);
  const description = ad.description?.replace(/\s+/g, ' ').trim();
  const base = `${title} ${location}. კატეგორია: ${category}. ფასი: ${price}.`;
  return `${base} ${description ? `${description} ` : ''}ნახეთ მეტი განცხადება კახეთში MyKakheti.ge-ზე.`
    .slice(0, 180);
};
