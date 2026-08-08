import { showToast } from '@/lib/toastTrigger';

type AuthTokens = {
  token: string;
  user: {
    id_user: string;
    email: string;
    name?: string;
    picture?: string;
    role: string;
  };
};

// ---------- Tokens y sesión (localStorage) ----------

// Solo el access token vive en localStorage. El refresh_token NO: lo guarda
// el proxy (BFF) en una cookie HttpOnly, invisible para JS (ver proxy/auth).
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getUser(): AuthTokens['user'] | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// ---------- Expiración / autenticación ----------

export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
    const decoded = JSON.parse(json);
    if (typeof decoded.exp !== 'number') return true;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return !!token && !isTokenExpired(token);
}

// Al boot, si el access token venció se intenta un refresh silencioso (rotación);
// solo se hace logout si el refresh falla (refresh_token ausente o ya revocado).
export async function clearExpiredSession(): Promise<void> {
  const token = getAccessToken();
  if (!token || !isTokenExpired(token)) return;

  const refreshed = await refreshAccessToken();
  if (!refreshed) logout();
}

// ---------- Cierre de sesión ----------

// Revoca la sesión en el backend (el proxy lee la cookie HttpOnly y la borra)
// + limpia el localStorage local + notifica. Fire-and-forget: la UI no espera.
export function logout(): void {
  void fetch('/api/proxy/auth/logout', { method: 'POST' });
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('authchange'));
  showToast('Sesión finalizada', 'info');
}

// ---------- Login Google ----------

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
          const res = await fetch('/api/proxy/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleToken: response.access_token }),
          });

          if (!res.ok) {
            const err = await res.json();
            const detail = Array.isArray(err.detail)
              ? err.detail.map((e: { msg: string }) => e.msg).join(', ')
              : err.detail;
            reject(new Error(detail || err.error || 'Error al autenticar'));
            return;
          }

          const data: AuthTokens = await res.json();
          localStorage.setItem('access_token', data.token);
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

// ---------- Refresh token (rotación) ----------

// Rota el access token. El refresh_token lo lee el proxy desde la cookie
// HttpOnly (el navegador no lo envía en el body). No hace logout en fallo:
// el caller decide (apiFetch hace logout si el refresh falla).
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/proxy/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem('access_token', data.token);

    return data.token;
  } catch {
    return null;
  }
}

// ---------- Fetch autenticado con refresh+retry ----------

// Wrapper del proxy para peticiones con Bearer. En 401 hace un refresh
// silencioso (rotación) y reintenta la request UNA vez; si el refresh falla
// hace logout() (que dispara authchange → la UI se re-sincroniza sola).
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = () => {
    const headers = new Headers(init.headers);
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`/api/proxy/${path}`, { ...init, headers });
  };

  let res = await doFetch();

  if (res.status === 401) {
    const token = await refreshAccessToken();
    if (token) {
      res = await doFetch();
    } else {
      logout();
    }
  }

  return res;
}
