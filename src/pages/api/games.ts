import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const apiUrl = import.meta.env.API_URL;
    const apiKey = import.meta.env.API_KEY;

    const params = new URLSearchParams(url.searchParams);
    const response = await fetch(`${apiUrl}/games?${params}`, {
      headers: { 'X-API-Key': apiKey },
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
