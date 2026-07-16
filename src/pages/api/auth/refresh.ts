import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  if (!body?.refresh_token) {
    return new Response(JSON.stringify({ error: 'Falta refresh_token' }), { status: 400 });
  }

  const apiUrl = import.meta.env.API_URL;
  const apiKey = import.meta.env.API_KEY;

  const response = await fetch(`${apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'X-API-Key': apiKey 
    },
    body: JSON.stringify({ refresh_token: body.refresh_token }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
