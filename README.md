# Game Guides - Frontend Astro

Frontend público del proyecto Game Guides desarrollado con Astro 7 + Tailwind 4 + DaisyUI 5.

---

## Requisitos + Dependencias
### Instalar pnpm

```sh
npm install -g pnpm
pnpm add -g pnpm 
pnpm self-update 
```

- **Node.js** 22.12+ (versión del proyecto)
- **pnpm** (se recomienda sobre npm por seguridad y rendimiento)
- [Astro](https://docs.astro.build/en/install-and-setup)
- [DaisyUI + Tailwind](https://daisyui.com/docs/install/astro)
- [Font Awesome](https://fontawesome.com)
- [SwiperJS](https://swiperjs.com)
- [Tailwind Animations](https://tailwind-animations.com/)
```sh
pnpm add tailwind-animations
pnpm add @fortawesome/fontawesome-free
pnpm add swiper
pnpm add @astrojs/vercel
```
- astro.config.mjs
```mjs
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: 'server',
  adapter: vercel(),
});
```
- Add @ for routes astro.config.mjs
```mjs
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
})
```
- Add @ for routes tsconfig.json (para que TypeScript reconozca el alias)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Instalación

```sh
pnpm install
```

---

## Ejecutar

```sh
pnpm dev
```

**Local:** [http://localhost:4321](http://localhost:4321)

---

## Build

```sh
pnpm build
pnpm preview
```

---

## Stack

| Capa | Tecnología |
|------|-----------|
| **Framework** | Astro 7 (SSR) |
| **Estilos** | Tailwind 4 + DaisyUI 5 |
| **API** | `game_guides_python` (FastAPI) |

---

## Estructura

```
game_guides_astro/
├── public/                  → Archivos estáticos (favicon, imágenes)
├── src/
│   ├── assets/              → Recursos (SVG, imágenes)
│   ├── components/          → Componentes Astro
│   ├── layouts/             → Layouts (Layout.astro)
│   └── pages/               → Páginas y rutas
├── astro.config.mjs         → Configuración Astro + Tailwind
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## Autenticación con Google OAuth (Frontend)

### Arquitectura

```
Browser (Google GIS popup)
    │  access_token (Google)
    ▼
Astro SSR Proxy (POST /api/auth/google)  ← solo esto vive en frontend
    │  googleToken
    ▼
FastAPI Backend (POST /api/auth/google)  ← backend propio
    │
    ▼
Response { token, refresh_token, user }  → llega al browser vía Astro
```

El frontend **nunca** conoce la API Key de FastAPI. Solo envía tokens al proxy Astro.

### 1. Google Cloud Console — Authorized JavaScript origins

Agregar `http://localhost:4321` como **Authorized JavaScript origin**. NO se necesitan redirect URIs (usamos popup).

### 2. Variables de entorno (`.env`)

| Variable | Ámbito | Descripción |
|----------|--------|-------------|
| `PUBLIC_GOOGLE_CLIENT_ID` | Público (cliente) | Client ID de Google OAuth — mismo valor que en backend |
| `API_URL` | Privado (SSR) | URL base de la API FastAPI — ej: `http://127.0.0.1:8000/api` |

Las variables sin `PUBLIC_` prefix solo existen en el servidor SSR, nunca llegan al cliente.

### 3. Estructura de archivos

```
src/
├── components/
│   └── Navbar.astro       → Botón login, avatar, theme toggle
├── lib/
│   └── auth.ts            → Lógica cliente: GIS popup + fetch a proxies + localStorage
├── pages/
│   └── api/auth/
│       ├── google.ts      → SSR proxy: recibe { googleToken }, reenvía a FastAPI
│       ├── refresh.ts     → SSR proxy: reenvía { refreshToken } a FastAPI
│       └── logout.ts      → SSR proxy: reenvía { refreshToken } a FastAPI
└── types/
    └── google.d.ts        → Declaración TypeScript para google.accounts.oauth2
```

### 4. Client-side (`src/lib/auth.ts`)

```ts
// Carga GIS dinámicamente
await loadGoogleScript();

// Inicia popup
const client = google.accounts.oauth2.initTokenClient({
  client_id: import.meta.env.PUBLIC_GOOGLE_CLIENT_ID,
  scope: 'openid email profile',
  callback: async (response) => {
    // Envía access_token al proxy Astro (no directo a FastAPI)
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleToken: response.access_token }),
    });
    const data = await res.json();
    // Guarda en localStorage
    localStorage.setItem('access_token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },
});
client.requestAccessToken();
```

### 5. Astro SSR Proxy (`src/pages/api/auth/google.ts`)

```ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const apiUrl = import.meta.env.API_URL; // solo SSR

  const response = await fetch(`${apiUrl}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ googleToken: body.googleToken }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

El proxy NO valida nada, solo reenvía. La validación la hace FastAPI.

### 6. SSR mode requerido

Sin `output: 'server'`, los endpoints POST reciben body vacío. Configuración necesaria en `astro.config.mjs`:

```js
import node from "@astrojs/node";

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});

// Dependencia: pnpm add @astrojs/node
```

### 7. Token refresh automático

```ts
const res = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});
if (res.ok) {
  const data = await res.json();
  localStorage.setItem('access_token', data.token);
} else {
  logout(); // refresh inválido → redirigir a login
}
```

### 8. Flujo completo

```
Usuario → Click "Login with Google"
         → GIS popup → selecciona cuenta
         → Callback recibe { access_token }
         → fetch POST /api/auth/google (Astro SSR)
              → fetch POST /api/auth/google (FastAPI)
              → response { token, refresh_token, user }
         → localStorage → UI actualizada (Navbar muestra avatar)
```
