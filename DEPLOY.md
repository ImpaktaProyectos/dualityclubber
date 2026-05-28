# Despliegue en Cloudflare Workers

Este proyecto (TanStack Start + Vite + `@cloudflare/vite-plugin`) está
listo para correr en **Cloudflare Workers**. Sigue estos pasos.

## 1. Requisitos

- Cuenta en Cloudflare.
- Node 20+ y `bun` (o npm).
- Wrangler CLI:
  ```bash
  npm i -g wrangler
  wrangler login
  ```

## 2. Variables públicas (`.env`)

Vite **inlinea** las `VITE_*` en el bundle del cliente **durante el build**.
Crea un `.env` en la raíz (copia desde `.env.example`):

```
VITE_SUPABASE_URL="https://wlypzqzfeyxykuwdlyst.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
VITE_SUPABASE_PROJECT_ID="wlypzqzfeyxykuwdlyst"
SUPABASE_URL="https://wlypzqzfeyxykuwdlyst.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<anon key>"
```

⚠️ Estas claves son **públicas** (anon), no rompen seguridad.
El `.env` está en `.gitignore`: o lo añades en tu CI, o lo
generas en cada build.

## 3. Secretos (server-only, NUNCA en el repo)

En Cloudflare Workers los secretos se configuran con `wrangler secret put`:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_PUBLISHABLE_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put LOVABLE_API_KEY   # solo si usas Lovable AI Gateway
```

Pega el valor cuando te lo pida. Quedan cifrados en Cloudflare.

> El `SUPABASE_SERVICE_ROLE_KEY` se usa en server functions (bypass RLS).
> NUNCA lo expongas al cliente ni lo pongas como `VITE_*`.

## 4. Build + despliegue

```bash
bun install
bun run cf:deploy        # = vite build && wrangler deploy
```

Wrangler te dará una URL `https://tanstack-start-app.<tu-subdominio>.workers.dev`.

## 5. Preview local (opcional)

```bash
bun run cf:preview       # corre el worker en local con runtime de CF
bun run cf:logs          # tail de logs en producción
```

## 6. Dominio personalizado

En el dashboard de Cloudflare → Workers & Pages → tu worker →
Settings → Triggers → **Add Custom Domain**.

## 7. Storage de Supabase

Los buckets ya son públicos y se sirven por CDN directa de Supabase.
No requieren configuración adicional en Cloudflare.

## Notas técnicas

- El entry SSR es `src/server.ts` (wrapper de errores h3 → ver
  `tanstack-ssr-error-handling`). Está fijado en `vite.config.ts` y
  `wrangler.jsonc`.
- `compatibility_flags: ["nodejs_compat"]` ya activado.
- Observability activado en `wrangler.jsonc` (logs en el dashboard).
- NO uses Vercel/Netlify sin cambiar el adapter — `@cloudflare/vite-plugin`
  compila específicamente para `workerd`.
