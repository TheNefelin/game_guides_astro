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

// Headers hacia el backend: X-API-Key (origen) + reenvío del Authorization
// entrante (JWT del usuario) cuando el cliente lo envió.
function buildHeaders(request: Request, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'X-API-Key': API_KEY, ...extra };
  const auth = request.headers.get('Authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
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
export const GET: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    headers: buildHeaders(request),
  });

  return proxyResponse(response);
};

// POST — Crear recursos. Lleva body JSON.
// Útil para: crear game, character, source.
export const POST: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'POST',
    headers: buildHeaders(request, { 'Content-Type': 'application/json' }),
    body: await request.text(),
  });

  return proxyResponse(response);
};

// PUT — Actualizar recursos completos. Lleva body JSON.
// Útil para: editar game, character, source.
export const PUT: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'PUT',
    headers: buildHeaders(request, { 'Content-Type': 'application/json' }),
    body: await request.text(),
  });

  return proxyResponse(response);
};

// DELETE — Eliminar recursos. Sin body.
// Útil para: borrar game, character, source.
// Nota: backend suele devolver 204 No Content.
export const DELETE: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'DELETE',
    headers: buildHeaders(request),
  });

  return new Response(null, { status: response.status });
};
