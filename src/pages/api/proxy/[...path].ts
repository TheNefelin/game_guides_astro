// Proxy universal. Convierte llamadas Astro en llamadas al backend real.
// Frontend nunca ve API_URL ni API_KEY, todo pasa por SSR.
// Ejemplo: GET /api/proxy/games → fetch(API_URL/games)
//
// Auth (BFF): el refresh_token se guarda en una cookie HttpOnly setada por
// esta capa SSR — el navegador nunca lo ve en JS (protección ante XSS).
// En /auth/google y /auth/refresh el proxy saca el refresh_token del body
// del backend, lo guarda en la cookie y lo quita del body hacia el cliente.

import type { APIRoute, AstroCookies } from 'astro';

const API_URL = import.meta.env.API_URL;
const API_KEY = import.meta.env.API_KEY;

const REFRESH_COOKIE = 'gg_refresh';

function cookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string } {
  return { httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', path: '/' };
}

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
// - body pre-leído se puede pasar para no leer la respuesta dos veces
async function proxyResponse(response: globalThis.Response, body?: string): Promise<Response> {
  const text = body ?? (response.status === 204 ? null : await response.text());
  return new Response(text, {
    status: response.status,
    headers: text ? { 'Content-Type': 'application/json' } : undefined,
  });
}

// Respuesta JSON directa (sin pasar por el backend)
function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Si la respuesta trae refresh_token, lo guarda en la cookie HttpOnly y lo
// quita del body que ve el navegador. Devuelve el body "limpio".
async function handleAuthResponse(cookies: AstroCookies, response: globalThis.Response): Promise<Response> {
  const text = await response.text();
  if (!response.ok || !text) return proxyResponse(response, text);

  const data = JSON.parse(text);
  if (data.refresh_token) {
    cookies.set(REFRESH_COOKIE, String(data.refresh_token), cookieOptions());
    const { refresh_token: _refresh, ...rest } = data;
    return jsonResponse(rest, response.status);
  }
  return jsonResponse(data, response.status);
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
// Auth especial: /auth/google, /auth/refresh y /auth/logout usan la cookie.
export const POST: APIRoute = async ({ url, request, cookies }) => {
  const path = getPath(url);

  // Login Google: el backend devuelve refresh_token → se guarda en cookie
  if (path === 'auth/google') {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: buildHeaders(request, { 'Content-Type': 'application/json' }),
      body: await request.text(),
    });
    return handleAuthResponse(cookies, response);
  }

  // Refresh: el proxy lee el refresh_token de la cookie y lo manda al backend
  if (path === 'auth/refresh') {
    const refreshToken = cookies.get(REFRESH_COOKIE)?.value;
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: buildHeaders(request, { 'Content-Type': 'application/json' }),
      body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : '{}',
    });
    return handleAuthResponse(cookies, response);
  }

  // Logout: revoca la sesión en el backend y borra la cookie
  if (path === 'auth/logout') {
    const refreshToken = cookies.get(REFRESH_COOKIE)?.value;
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: buildHeaders(request, { 'Content-Type': 'application/json' }),
      body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : '{}',
    });
    cookies.delete(REFRESH_COOKIE, { path: '/' });
    return new Response(null, { status: response.status });
  }

  const response = await fetch(`${API_URL}/${path}${url.search}`, {
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
