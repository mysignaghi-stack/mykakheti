export interface Ad {
  id: string;
  title: string;
  description: string | null;
  price: string;
  currency: string | null;
  location: string;
  category: string;
  image_url: string | null;
  all_images: string[] | null;
  contact_info: string | null;
  phone: string | null;
  is_approved: boolean | null;
  is_archived: boolean | null;
  created_at: string | null;
  expires_at: string | null;
  user_id: string | null;
}

export interface WeatherItem {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  icon: string;
  glow: string;
}

export interface TransportRoute {
  from: string;
  to: string;
  time: string;
  price: string;
  station: string;
}

export interface AgroItem {
  id: string;
  name: string;
  unit: string;
  price: string;
  color: string;
  icon: string;
  category: string;
  details: { place: string; rate: string | number; phone?: string }[] | string[] | null;
}

// 👇 განახლებული ტიპი ადმინისტრაციის პოსტებისთვის
export interface AdminPost {
  id: number;
  title: string;
  content: string;
  media_urls?: string[] | null; // მრავალი ფოტოსთვის
  media_url?: string | null; // უკუთავსობისთვის
  // ✅ media_type მოიცავს 'gallery'-ს
  media_type?: 'image' | 'video' | 'gallery' | null;
  // ✅ position აუცილებელია, რომ პოსტი კონკრეტულ ჩარჩოში ჩავსვათ
  position?: string; 
  category?: string; // არასავალდებულო კატეგორია
  priority?: number; // პრიორიტეტი (უფრო მაღალი = უფრო მაღლა)
  link?: string; // არასავალდებულო ბმული
  video_background?: boolean; // ვიდეო ფონზე გაშვება
  badge_text?: string; // ბეიჯის ტექსტი
  created_at: string;
}

// 👇 ტიპები განრიგისთვის (ადმინ პანელი)
export interface AdminRoute {
  id: number;
  origin: string;
  destination: string;
  price: number;
  stops?: string;
}

export interface AdminSchedule {
  id: number;
  routeId: number;
  departTime: string;
  status: 'Active' | 'Delayed' | 'Canceled';
}