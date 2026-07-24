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
