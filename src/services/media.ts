import type { Screenshot, Map } from '@/types/game';
import type { Result } from '@/types/result';

export async function getScreenshots(gameId: number, origin: string): Promise<Result<Screenshot[]>> {
  try {
    const res = await fetch(`${origin}/api/proxy/screenshots?game_id=${gameId}`);
    if (!res.ok) return [[], 'Error al cargar capturas'];
    return [await res.json(), null];
  } catch {
    return [[], 'Error de conexión con el servidor'];
  }
}

export async function getMaps(gameId: number, origin: string): Promise<Result<Map[]>> {
  try {
    const res = await fetch(`${origin}/api/proxy/maps?game_id=${gameId}`);
    if (!res.ok) return [[], 'Error al cargar mapas'];
    return [await res.json(), null];
  } catch {
    return [[], 'Error de conexión con el servidor'];
  }
}
