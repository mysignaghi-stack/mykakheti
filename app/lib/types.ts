export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'GEL' | 'USD';
  location: string;
  category: string;
  image_url: string | null;
  all_images: string[];
  contact: string;
  is_approved: boolean;
  is_archived: boolean;
  created_at: string;
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
  id: number;
  name: string;
  unit: string;
  price: string;
  color: string;
  icon: string;
  category: 'grape' | 'grain' | 'other';
  details: { place: string; rate: string | number }[];
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