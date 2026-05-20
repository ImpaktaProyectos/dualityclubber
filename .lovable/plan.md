# Plan de cambios admin DUALITY — Bloque 2

Bloque grande con 4 áreas. Lo divido en fases para revisión y aprobación.

## Fase 1 — Base de datos (1 migración)

**Nueva tabla `stages`:**
- `id`, `name`, `slug` (unique), `color`, `sort_order`, `is_visible`, `created_at`, `updated_at`

**`artists`:**
- Añadir `stage_id uuid` (FK opcional a `stages.id`, nullable, on delete set null)
- Mantener `stage` (texto) temporalmente para retrocompatibilidad

**`schedule_items`:**
- Añadir `stage_id uuid` (FK opcional)

**`page_sections`:**
- Añadir `is_locked boolean default false`

**`site_settings`:** (consolido marca aquí en vez de crear `site_branding`, ya existe `header_logo_url` y `footer_logo_url`)
- Añadir `brand_logo_main_url`, `brand_logo_light_url`, `brand_logo_dark_url`, `brand_icon_url`, `brand_favicon_url`

**Seed inicial:** insertar stages por defecto (`Open Air`, `Main Room`, `Area Club`) y migrar valores de `artists.stage` → `stage_id` cuando coincida por nombre normalizado.

**Marcar `is_locked = true`** en `page_sections` para `header`, `footer`, `hero`.

## Fase 2 — Logotipo global de marca

- Nuevo bloque "Marca / Logotipo global" en el tab Apariencia del admin con 5 subidas (`MediaUpload`): principal, claro, oscuro, isotipo, favicon. Vista previa + reemplazar + eliminar + restaurar.
- Helper `resolveBrandLogo(settings, variant)` con cascada: `brand_logo_*` → `header_logo_url`/`footer_logo_url` legacy → default text.
- Aplicar en: header, footer, CTA final, hero (si procede), admin sidebar/topbar, login. El favicon se inyecta vía `<link rel="icon">` en `__root.tsx`.

## Fase 3 — Drag & drop de secciones

- Instalar `@dnd-kit/core` + `@dnd-kit/sortable`.
- Nuevo componente `SectionsReorder.tsx` en admin (tab "Secciones"):
  - Lista ordenable por `sort_order`.
  - Card por sección: nombre, estado (Completa/Incompleta/Oculta/Próximamente), switch visible, handle drag, botón editar, resumen.
  - Secciones con `is_locked = true` (header/footer/hero) no se pueden arrastrar y muestran candado.
  - Botón "Restaurar orden recomendado" (orden 1–13 del brief).
  - Aviso si Entradas se mueve por debajo de la 6ª posición.
- Backend: nuevo `reorderSections` server fn que recibe `[{id, sort_order}]` y hace bulk update.
- Frontend público `index.tsx`: ya renderiza por `page_sections.sort_order`; verificar y ajustar si hace falta.

## Fase 4 — Gestión interna de Stages

- Nuevo tab "Stages" en admin con CRUD básico: crear, renombrar, color, ordenar (drag), activar/desactivar, eliminar (con validación de FK).
- Server fns: `listStages`, `upsertStage`, `deleteStage` (bloquea si hay artistas/horarios vinculados).
- Incluir en `getAdminData` y `getLandingData`.

## Fase 5 — Artistas con dropdown de stages

- Editor de artistas: reemplazar input `stage` por `<Select>` poblado desde `stages`.
- Guardar `stage_id` (y opcionalmente espejo en `stage` con el nombre para retrocompatibilidad del frontend público actual).
- Actualizar filtros de la galería pública para usar `stage_id` (con fallback al texto si la migración no asignó stage).
- `BulkArtistsImporter` existente: parsear el stage de texto → buscar `stages` por slug normalizado, crear si falta (opcional vía checkbox).

## Fase 6 — Carga rápida de horarios

- Nuevo componente `BulkScheduleImporter.tsx` en el tab Horarios.
- Parser que detecta los 3 formatos del brief:
  - `HH:MM - HH:MM | ARTISTA | STAGE`
  - Bloques con header `STAGE:` seguidos de filas `HH:MM - HH:MM ARTISTA`
  - `HH:MM ARTISTA STAGE` (sin fin)
- Normalización de stages por slug (sugiere coincidencia fuzzy: `MAINROOM` → `Main Room`).
- Tabla de previsualización con columnas: orden, inicio, fin, artista, stage, estado (Nuevo / Artista existe / Artista se creará / Stage no existe / Duplicado / Error de formato / Solapamiento).
- Acciones: editar fila, eliminar fila, elegir stage manual, vincular artista existente.
- Opciones globales:
  - Checkbox "Crear artistas que no existan" (default ON)
  - Modo: añadir / reemplazar todos / actualizar duplicados
  - Política de stage del artista: mantener / actualizar / solo en horario (default: actualizar si vacío, avisar si conflicto)
- Validaciones: formato de hora, hora fin > inicio, duplicados (artista+hora+stage), solapamientos dentro del mismo stage (warning, no bloquea).
- Server fn `bulkUpsertSchedule` que crea/actualiza artistas + schedule_items en una transacción lógica.

## Notas técnicas

- Stack: TanStack Start + `createServerFn` (extiendo `admin.functions.ts`).
- No tocar `client.ts` ni `types.ts` (los regenera la migración).
- Todos los componentes nuevos bajo `src/components/admin/`.
- Reutilizar `MediaUpload`, `FontPicker`, patrones existentes.
- Cero colores hardcodeados; usar tokens `--brand-*`.

## Orden de ejecución sugerido

1. **Fase 1** (migración) — requiere tu aprobación antes de seguir.
2. **Fase 2** (logo global) — alto impacto visible inmediato.
3. **Fase 3** (drag & drop secciones) — control de landing.
4. **Fases 4 + 5** (stages + dropdown en artistas) — bloque coherente.
5. **Fase 6** (carga rápida horarios) — la más grande, al final.

¿Apruebas el plan tal cual, o quieres reordenar/recortar algo antes de empezar? Si lo apruebas, arranco directamente por la **Fase 1 (migración)**.
