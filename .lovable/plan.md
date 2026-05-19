# Plan: DUALITY — Landing + Panel Admin

## Visión general

Una sola landing pública (`/`) que muestra siempre el evento activo, y un panel privado (`/admin`) protegido por login para editar todo el contenido sin tocar código. Diseño cerrado, contenido editable. Estética premium oscura, electrónica, con identidad de doble dualidad (dos chicas con cuernos) y paleta rojo/blanco/azul sobre fondo oscuro.

## Stack

- TanStack Start (React 19) + Tailwind v4 + Framer Motion + Swiper + tokens en `src/styles.css`.
- **Lovable Cloud** para auth admin, base de datos (PostgreSQL) y storage (imágenes, vídeos, PDFs).
- Favoritos del usuario en `localStorage` (sin login público), namespaced por `current_event_key`.

## Fase 1 — Identidad visual y sistema de diseño

- Definir tokens en `src/styles.css`: `--brand-blue #00AEEF`, `--brand-red #FF1E2D`, `--brand-white`, `--dark-bg #03060B`, `--dark-panel #07111C`, glows azul/rojo.
- Tipografía display impactante (display sans condensada para titulares tipo rave) + body legible.
- Variables de tema dinámicas (`--color-primary`, `--color-secondary`, `--color-glow`) controladas por el módulo Apariencia del admin → aplicadas en `<html>` al cargar `site_settings`.
- Componente recurrente "DualityArtwork" reutilizable (silueta dos chicas con cuernos enfrentadas) usado en hero y CTA final.

## Fase 2 — Backend (Lovable Cloud)

Tablas: `site_settings`, `page_sections`, `quick_info_items`, `artists`, `schedule_items`, `gallery_items`, `bus_routes`, `authorization`, `faqs`, `final_cta`, `footer_settings` (según spec sección 37).

Buckets storage: `hero-media`, `artist-images`, `gallery`, `authorization-pdfs`, `general-assets`.

RLS:
- Lectura pública (anon) en todas las tablas de contenido publicado.
- Escritura solo a usuarios con rol `admin` (tabla separada `user_roles` + función `has_role` SECURITY DEFINER, nunca rol en `profiles`).
- Service role solo en server functions admin.

Auth: email/password (creas el primer admin manualmente vía Cloud → Users, luego le asignamos rol `admin`).

Sistema borrador/publicado: cada tabla relevante guarda un flag o duplica registros `draft`/`published`. Simplificación inicial: campo `is_published` + tabla espejo opcional. Empezar con "Guardar cambios" directo y añadir borrador en iteración posterior si hace falta.

## Fase 3 — Landing pública (`/`)

Estructura fija con render condicional desde `page_sections`:

1. `StickyHeader` (glassmorphism, nav generada solo con secciones activas) + `MobileBuyBar` fijo abajo.
2. `HeroSection` — vídeo/imagen fallback desktop+mobile, título, subtítulo, fecha, lugar, CTA1 "Comprar entradas" → `#entradas`, CTA2 "Ver artistas" → `#artistas`. Artwork de dualidad superpuesto.
3. `QuickInfoBar` — badges horizontales (scroll horizontal en móvil) con info esencial (fecha, hora, lugar, áreas, piscina, foodtruck).
4. `CountdownSection` — días/horas/min/seg + mini CTA.
5. `TicketsIframeSection` — iframe Fourvenues responsive (min-height 780/860px), `allow="payment *; fullscreen; clipboard-write; encrypted-media"`, fallback "Abrir venta oficial", badges de confianza.
6. `ArtistsSection` — marquee de nombres + filtros por área + grid de `ArtistCard` con corazón favorito (localStorage).
7. `ScheduleSection` — tabs (Todos / Open Air / Main Room / Area Club / **Mi Planning** con contador). Timeline vertical en móvil.
8. `GallerySection` — Swiper compacto (5-8 items) + lightbox.
9. `LocationSection` — embed mapa + botón "Cómo llegar" + parking/acceso.
10. `BusRoutesAccordion` — acordeones por localidad con estado y botón reservar.
11. `AuthorizationSection` — descarga PDF + CTA secundario.
12. `FAQAccordion` — 5-6 preguntas.
13. `FinalCTASection` — fondo dramático con artwork dualidad + "Vive tu dualidad".
14. `Footer`.

Modos por sección: **visible / hidden / coming_soon**. Si `hidden` → no renderiza, no aparece en menú, no aparece en accesos rápidos. Si `coming_soon` → card compacta con mensaje.

**Mi Planning**: hook `useFavorites(currentEventKey)` con clave `duality:favorites:{current_event_key}`. Tab dentro de Horarios ordena favoritos por hora, separa "sin horario confirmado", estado vacío con CTA "Ver artistas", botón "Borrar planning", CTA final "Comprar entrada", botón opcional "Compartir mi planning" (Web Share API + fallback portapapeles). Feedback toast al añadir/quitar.

Datos cargados vía `createServerFn` + TanStack Query (admin client en server, RLS-safe lectura pública). Loader del root carga `site_settings` + `page_sections` para SSR del shell.

## Fase 4 — Panel Admin (`/admin`)

- Ruta `_authenticated` con `beforeLoad` que redirige a `/admin/login` si no hay sesión + chequeo de rol `admin` vía server fn.
- Dashboard con grid de `SectionCard`: nombre, estado (Completa/Incompleta/Oculta/Próximamente), switch "Visible en landing", resumen, botón Editar, alerta si activa pero incompleta.
- Top bar: Vista previa · Guardar cambios (borrador/publicar en v2).
- Editores por módulo (todos los campos listados en spec secciones 21-33):
  - `AppearanceEditor` (presets Aqua/Red/Blue/Purple/Custom, intensidad glow, partículas, textura).
  - `HeroEditor`, `QuickInfoEditor` (CRUD badges), `CountdownEditor`, `TicketsEditor` (con validación URL iframe + warning desactivar), `ArtistsManager` (CRUD + drag&drop orden + upload foto), `ScheduleManager` (CRUD + áreas editables), `GalleryManager` (upload múltiple + drag&drop), `LocationEditor`, `BusRoutesManager`, `AuthorizationEditor` (upload PDF), `FAQManager`, `FinalCTAEditor`, `FooterEditor`.
- Drag & drop con `@dnd-kit/sortable`.
- Validaciones: si Tickets ON sin iframe URL → incompleta + alerta. Si se intenta desactivar Tickets → confirm modal.

## Fase 5 — Vista previa, performance, accesibilidad

- Modo preview: query param `?preview=1` que renderiza la landing con datos draft + barra superior "Vista previa · Volver al admin · Publicar".
- Performance: lazy load imágenes/vídeos, poster en hero, reservar altura iframe (evita CLS), Swiper lazy, no autoplay pesado en móvil, formatos webm/mp4 + AVIF/WebP.
- Accesibilidad: alt text obligatorio en uploads, contraste AA, focus visible, labels en formularios, navegación teclado.

## Detalles técnicos clave

- Tokens dinámicos: en root layout, inyectar `<style>` con CSS vars desde `site_settings` para que Apariencia tenga efecto inmediato en SSR.
- `current_event_key` vive en `site_settings`. Al cambiarlo, los favoritos del navegador del usuario quedan ligados a la fiesta anterior y no contaminan la nueva.
- Toda nav (header desktop, hamburguesa móvil, accesos rápidos) se genera con `page_sections.filter(s => s.is_enabled && s.display_mode === 'visible')` → cero enlaces rotos.
- Iframe Fourvenues: contenedor con `aspect-ratio` reservado + skeleton mientras carga.
- Uploads: server functions con `supabaseAdmin` validan mime/tamaño antes de subir al bucket.

## Cosas que pediré confirmar antes de empezar (en build mode)

1. ¿El primer admin lo creas tú vía Cloud → Users, o quieres que añada un script seed para tu email?
2. ¿Empiezo con "Guardar cambios" directo (sin borrador) y añadimos publish/draft después, o lo quieres desde el día uno?
3. ¿Tienes ya assets reales (vídeo hero, fotos artistas, artwork dualidad) o genero placeholders premium con IA para el primer pase?

## Orden de entrega sugerido

1. Tokens + identidad visual + componente DualityArtwork.
2. Lovable Cloud: schema + RLS + roles + buckets.
3. Landing pública con datos seed.
4. Auth admin + dashboard + módulos editores (en 2-3 iteraciones por bloques de secciones).
5. Vista previa + pulido + QA responsive.
