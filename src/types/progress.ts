export interface GuideCheck {
  guide_id: number;
}

export interface AdventureCheck {
  adventure_id: number;
}

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export type RequestBody = GuideCheck | AdventureCheck;

export interface UserGuideResponse {
  guide_id: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface UserAdventureResponse {
  adventure_id: number;
  is_completed: boolean;
  completed_at: string | null;
}
