// Proxy universal. Convierte llamadas Astro en llamadas al backend real.
// Frontend nunca ve API_URL ni API_KEY, todo pasa por SSR.
// Ejemplo: GET /api/proxy/games → fetch(API_URL/games)

import type { APIRoute } from 'astro';

const API_URL = import.meta.env.API_URL;
const API_KEY = import.meta.env.API_KEY;

// Extrae el path de destino: /api/proxy/games/5 → games/5
function getPath(url: URL): string {
  return url.pathname.replace('/api/proxy/', '');
}

// Convierte la respuesta del backend en Response de Astro
// - Status code se mantiene intacto (sin try/catch que lo trague)
// - 204 No Content se devuelve sin body
async function proxyResponse(response: globalThis.Response): Promise<Response> {
  const body = response.status === 204 ? null : await response.text();
  return new Response(body, {
    status: response.status,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

// GET — Obtener recursos (lista, detalle). Sin body.
// Útil para: index, detalle, búsquedas.
export const GET: APIRoute = async ({ url }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    headers: { 'X-API-Key': API_KEY },
  });

  return proxyResponse(response);
};

// POST — Crear recursos. Lleva body JSON.
// Útil para: crear game, character, source.
export const POST: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: await request.text(),
  });

  return proxyResponse(response);
};

// PUT — Actualizar recursos completos. Lleva body JSON.
// Útil para: editar game, character, source.
export const PUT: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: await request.text(),
  });

  return proxyResponse(response);
};

// DELETE — Eliminar recursos. Sin body.
// Útil para: borrar game, character, source.
// Nota: backend suele devolver 204 No Content.
export const DELETE: APIRoute = async ({ url }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': API_KEY },
  });

  return new Response(null, { status: response.status });
};
