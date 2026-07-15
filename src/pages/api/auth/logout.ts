import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  if (!body?.refresh_token) {
    return new Response(JSON.stringify({ error: 'Falta refresh_token' }), { status: 400 });
  }

  const apiUrl = import.meta.env.API_URL;

  const response = await fetch(`${apiUrl}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: body.refresh_token }),
  });

  return new Response(null, { status: response.status });
};
