type AuthTokens = {
  token: string;
  refresh_token: string;
  user: {
    id_user: string;
    email: string;
    name?: string;
    picture?: string;
    role: string;
  };
};

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function getUser(): AuthTokens['user'] | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export async function loginWithGoogle(): Promise<void> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.PUBLIC_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleToken: response.access_token }),
          });

          if (!res.ok) {
            const err = await res.json();
            reject(new Error(err.detail || err.error || 'Error al autenticar'));
            return;
          }

          const data: AuthTokens = await res.json();
          localStorage.setItem('access_token', data.token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.user));

          window.location.reload();
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    });

    client.requestAccessToken();
  });
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);

    return data.token;
  } catch {
    logout();
    return null;
  }
}
