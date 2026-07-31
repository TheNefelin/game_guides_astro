export interface Platform {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Screenshot {
  id: number;
  game_id: number;
  image_url: string;
  alt_text: string | null;
  created_at: string;
}

export interface Map {
  id: number;
  game_id: number;
  image_url: string;
  alt_text: string | null;
  created_at: string;
}

export interface Source {
  id: number;
  game_id: number;
  name: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: number;
  game_id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_playable: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  screenshots: Screenshot[];
  maps: Map[];
  sources: Source[];
  characters: Character[];
}
