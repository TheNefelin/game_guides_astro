import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body?.googleToken) {
      return new Response(JSON.stringify({ error: 'Falta googleToken' }), { status: 400 });
    }

    const apiUrl = import.meta.env.API_URL;
    const apiKey = import.meta.env.API_KEY;

    const response = await fetch(`${apiUrl}/auth/google`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-API-Key': apiKey 
      },
      body: JSON.stringify({ googleToken: body.googleToken }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
