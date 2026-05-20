# Plan de cambios prioritarios DUALITY

Es un bloque grande de trabajo (9 áreas, web + admin + BD). Lo divido en fases para que puedas revisar el orden y validar antes de empezar.

## Fase 1 — Base de datos (1 migración)

Añadir a `site_settings`:
- `ticket_mode` text default `'iframe'` (valores: `iframe`, `external`, `both`)
- `countdown_subtitle` text (segunda línea premium)
- `font_button` text
- `background_scroll_behavior` text default `'normal'` (`normal`, `fixed`, `parallax`, `reveal`, `zoom-pan`, `sticky-section`)
- `background_scroll_intensity` int default 30

No se tocan `visual_settings` ni `artists` (ya tienen lo necesario).

## Fase 2 — Entradas / Fourvenues (sección + admin)

- Reescribir bloque Entradas en `src/routes/index.tsx`:
  - `iframe` con `src` directo a `ticket_iframe_url`, `allow="payment *; fullscreen; clipboard-write; encrypted-media"`, `referrerPolicy`, alturas mínimas (780 desktop / 860 móvil), sin sandbox restrictivo, sin proxy interno.
  - Detección de fallo (timeout `onLoad` + error) → muestra card fallback con botón a `ticket_fallback_url` (`target="_blank" rel="noopener noreferrer"`).
  - Soporte de los 3 modos: `iframe`, `external`, `both`.
- Admin: nuevo campo selector "Modo de venta" en el grupo Entradas.

## Fase 3 — Carga rápida de artistas (admin)

Nuevo componente `BulkArtistsImporter.tsx` dentro del tab Artistas:
- Textarea + instrucciones.
- Parser que acepta:
  - `NOMBRE | ESCENARIO`
  - `NOMBRE - ESCENARIO`
  - Bloques con cabecera `ESCENARIO:` seguidos de nombres
- Tabla de previsualización (orden, artista, escenario, estado: Nuevo / Duplicado / Sin escenario).
- Botones: Importar solo nuevos · Actualizar duplicados · Reemplazar todos · Cancelar.
- Usa `upsertRow`/`bulkInsert` server fn existente (o nuevo `bulkUpsertArtists`).

## Fase 4 — Artistas público (galería + filtro + favoritos)

- Sección Artistas: siempre lista de cards. Si no hay imagen, card premium solo con nombre (gradiente brand, glow hover).
- Filtro por escenario: chips derivados de los `stage` únicos. "Todos" por defecto. Scroll horizontal móvil. Chip activo con glow.
- Botón corazón en cada card → `useFavorites(eventKey)` existente.
- Hover desktop: iluminación + glow azul/rojo (paleta activa).

## Fase 5 — Horarios con favoritos sincronizados

- Añadir botón corazón a cada `schedule_item`. Clave de favorito = `artist_id ?? custom_artist_name`.
- Compartir hook `useFavorites` con sección Artistas.
- Contador global "Mi Planning" visible.

## Fase 6 — Mi Planning (parrilla)

Nueva sección/componente `MyPlanning.tsx`:
- Construye grid: filas = franjas horarias (de `start_time` de los favoritos), columnas = escenarios.
- Cada celda apila los favoritos de esa hora+escenario.
- Bloque inferior "Favoritos sin horario confirmado".
- Estado vacío con CTA "Ver artistas".
- CTA final "Comprar entrada".
- Móvil: scroll horizontal con columna de horas fija (sticky `left-0`).

## Fase 7 — Fondos con comportamiento de scroll (admin + frontend)

- Admin `AtmosphereEditor`: nuevo selector "Comportamiento del fondo" con 6 modos + slider de intensidad + posición (top/center/bottom).
- Frontend `index.tsx` / `SectionBackground`: aplicar cada modo:
  - `fixed`: `background-attachment: fixed` desktop, fallback `position: fixed` en móvil.
  - `parallax`: translateY ligado al scroll (rAF, desactivado en `prefers-reduced-motion`).
  - `reveal`: sección alta + sticky inner que cambia `background-position` según progreso.
  - `zoom-pan`: animación CSS keyframes muy lenta de scale+translate.
  - `sticky-section`: fondo sticky por sección.
- Respeta el `background_scroll_mode` global existente (continuous / per-section).

## Fase 8 — Selector visual de tipografías (admin)

- Componente `FontPicker.tsx`:
  - Carga dinámica de Google Fonts solo para el preview activo del admin.
  - Cards con nombre + titular "AQUA OPEN AIR" + texto pequeño en esa fuente.
  - Tres selectores: `font_display`, `font_body`, `font_button`.
  - Fuentes: Orbitron, Exo 2, Bebas Neue, Oswald, Montserrat, Rajdhani, Space Grotesk, Anton, Archivo Black, Inter (fallback).
- Frontend público: solo carga las 2–3 fuentes seleccionadas.

## Fase 9 — Rediseño Cuenta Atrás premium

- Nuevo `Countdown` premium:
  - Desktop: pieza horizontal única con separadores técnicos, glow azul/rojo según paleta, glassmorphism, textura noise sutil.
  - Móvil: grid 2x2.
  - Pulso suave en segundos (framer-motion `key` change).
  - Línea superior técnica "T-MINUS" + título + subtítulo + CTA.

---

## Notas técnicas

- Stack: TanStack Start + serverFn (`upsertRow`, `bulkInsert` ya existen en `admin.functions.ts`).
- Favoritos: `localStorage` con `useFavorites(eventKey)` — sin Supabase.
- Cero cambios a `src/integrations/supabase/client.ts` ni `types.ts` (los regenera la migración).
- Todos los nuevos componentes en `src/components/` y `src/components/admin/`.
- Ningún color hardcodeado fuera de tokens existentes (`--brand-blue`, `--brand-red`, `--dark-panel`).

## Orden de ejecución sugerido

1. Migración (Fase 1) — requiere tu aprobación.
2. Fases 2, 8, 9 (entradas, tipografías, countdown) — alto impacto visible rápido.
3. Fases 3, 4, 5, 6 (artistas + planning) — bloque coherente.
4. Fase 7 (scroll de fondo) — capa atmosférica final.

¿Apruebas el plan tal cual, o quieres que reordene/recorte algo antes de empezar? Si quieres, puedo arrancar directamente por la **Fase 1 (migración)** + **Fase 2 (fix iframe Fourvenues)** que es lo más urgente.
