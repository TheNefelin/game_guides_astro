import type { Game, GameDetail } from '@/types/game';
import type { Result } from '@/types/result';

export interface GameListResult {
  items: Game[];
  total: number;
}

export async function getGames(origin: string): Promise<Result<GameListResult>> {
  try {
    const res = await fetch(`${origin}/api/proxy/games?page=1&limit=100`);
    const body = await res.json();

    if (!res.ok) {
      const msg = body?.detail ?? body?.error ?? 'Error al cargar juegos';
      return [{ items: [], total: 0 }, msg];
    }

    return [{ items: body?.items ?? [], total: body?.total ?? 0 }, null];
  } catch {
    return [{ items: [], total: 0 }, 'Error de conexión con el servidor'];
  }
}

export async function getGameBySlug(slug: string, origin: string): Promise<Result<GameDetail | null>> {
  try {
    const res = await fetch(`${origin}/api/proxy/games/by-slug/${slug}/detail`);
    const body = await res.json();

    if (!res.ok) {
      const msg = body?.detail ?? body?.error ?? 'Error al cargar juego';
      return [null, msg];
    }

    return [body ?? null, body ? null : 'Juego no encontrado'];
  } catch {
    return [null, 'Error de conexión con el servidor'];
  }
}
