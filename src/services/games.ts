import type { Game } from '@/types/game';
import type { Result } from '@/types/result';

export async function getGames(origin: string): Promise<Result<Game[]>> {
  try {
    const res = await fetch(`${origin}/api/proxy/games?page=1&limit=10`);
    const body = await res.json();

    if (!res.ok) {
      const msg = body?.detail ?? body?.error ?? 'Error al cargar juegos';
      return [[], msg];
    }

    return [body?.items ?? [], null];
  } catch {
    return [[], 'Error de conexión con el servidor'];
  }
}

export async function getGameBySlug(slug: string, origin: string): Promise<Result<Game | null>> {
  try {
    const res = await fetch(`${origin}/api/proxy/games?page=1&limit=100`);
    const body = await res.json();

    if (!res.ok) {
      const msg = body?.detail ?? body?.error ?? 'Error al cargar juego';
      return [null, msg];
    }

    const game = body?.items?.find((g: Game) => g.slug === slug) ?? null;
    return [game, game ? null : 'Juego no encontrado'];
  } catch {
    return [null, 'Error de conexión con el servidor'];
  }
}
