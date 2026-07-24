export interface Platform {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Game {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  release_year: number | null;
  rating: number | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  platforms: Platform[];
  genres: Genre[];
}
