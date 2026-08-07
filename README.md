# Game Guides - Frontend Astro

Frontend público del proyecto Game Guides desarrollado con Astro 7 + Tailwind 4 + DaisyUI 5.

---

## Requisitos + Dependencias
- [Google Auth](https://console.cloud.google.com)

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
Astro SSR Proxy universal (POST /api/proxy/auth/google)  ← solo esto vive en frontend
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
│   └── auth.ts            → Lógica cliente: GIS popup + fetch a proxy universal + localStorage
├── pages/
│   └── api/
│       └── proxy/[...path].ts → Proxy SSR universal: reenvía a FastAPI; auth (google/refresh) va por esta misma ruta
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
    // Envía access_token al proxy universal (no directo a FastAPI)
    const res = await fetch('/api/proxy/auth/google', {
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

### 5. Proxy universal (`src/pages/api/proxy/[...path].ts`)

```ts
// POST /api/proxy/{path} → fetch(`${API_URL}/{path}`, { method, headers, body })
export const POST: APIRoute = async ({ url, request }) => {
  const response = await fetch(`${API_URL}/${getPath(url)}${url.search}`, {
    method: 'POST',
    headers: buildHeaders(request, { 'Content-Type': 'application/json' }),
    body: await request.text(),
  });
  return proxyResponse(response);
};
```

`buildHeaders(request, extra)` agrega `X-API-Key` (privado, solo SSR) y reenvía el `Authorization` entrante. El proxy NO valida nada, solo reenvía. La validación la hace FastAPI. El login (`google`), `refresh` y `logout` del backend van por esta misma ruta (`/api/proxy/auth/*`), sin archivos dedicados.

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
const res = await fetch('/api/proxy/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token }),
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
         → fetch POST /api/proxy/auth/google (Astro SSR proxy universal)
              → fetch POST /api/auth/google (FastAPI)
              → response { token, refresh_token, user }
         → localStorage → UI actualizada (Navbar muestra avatar)
```
