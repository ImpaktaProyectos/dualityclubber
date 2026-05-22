import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAdminData, upsertRow, deleteRow, isCurrentUserAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  LogOut, Plus, Trash2, Save, Eye, EyeOff, Settings, Layers, Mic2, Clock, Info,
  Bus, Image as ImageIcon, HelpCircle, Sparkles, ExternalLink, MapPin, Ticket, ShoppingBag,
} from "lucide-react";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { AtmosphereEditor } from "@/components/admin/AtmosphereEditor";
import { BulkArtistsImporter } from "@/components/admin/BulkArtistsImporter";
import { FontPicker } from "@/components/admin/FontPicker";
import { BrandLogosEditor } from "@/components/admin/BrandLogosEditor";
import { SectionsReorder } from "@/components/admin/SectionsReorder";
import { StagesManager } from "@/components/admin/StagesManager";
import { BulkScheduleImporter } from "@/components/admin/BulkScheduleImporter";
import { ArtistsScheduleMatrix } from "@/components/admin/ArtistsScheduleMatrix";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Panel admin · DUALITY" }] }),
  component: AdminPage,
});

const TABS = [
  { key: "settings",   label: "Evento",         icon: Settings,    hint: "Datos básicos, hero, entradas, marca, tipografía y redes sociales." },
  { key: "tickets",    label: "Entradas",       icon: Ticket,      hint: "Tiquetera visual: tramos, alerta y mini cuenta atrás. Alternativa al iframe de Fourvenues." },
  { key: "sections",   label: "Secciones",      icon: Layers,      hint: "Arrastra las secciones para reordenar la landing." },
  { key: "stages",     label: "Escenarios",     icon: MapPin,      hint: "Gestiona los escenarios internos (Open Air, Main Room…)." },
  { key: "artists",    label: "Artistas",       icon: Mic2,        hint: "Añade DJs y artistas con foto, hora y redes." },
  { key: "schedule",   label: "Horarios",       icon: Clock,       hint: "Define el line-up por hora y escenario." },
  { key: "quickInfo",  label: "Info rápida",    icon: Info,        hint: "Tarjetas con fecha, edad mínima, ubicación, etc." },
  { key: "buses",      label: "Autobuses",      icon: Bus,         hint: "Rutas de bus, horarios y precios." },
  { key: "gallery",    label: "Galería",        icon: ImageIcon,   hint: "Fotos y vídeos de ediciones anteriores." },
  { key: "shop",       label: "Tienda",          icon: ShoppingBag, hint: "Productos de merchandising con CTA por WhatsApp." },
  { key: "faqs",       label: "FAQ",            icon: HelpCircle,  hint: "Preguntas frecuentes para tus asistentes." },
  { key: "atmosphere", label: "Atmósfera",      icon: Sparkles,    hint: "Fondos, colores y texturas de la web." },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchData = useServerFn(getAdminData);
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const [tab, setTab] = useState<TabKey>("settings");
  const [adminOk, setAdminOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdmin().then((r) => setAdminOk(r.isAdmin)).catch(() => setAdminOk(false));
  }, [checkAdmin]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-data"],
    queryFn: () => fetchData(),
    enabled: adminOk === true,
  });

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-data"] });

  if (adminOk === null) return <div className="p-8 text-white/60">Cargando…</div>;
  if (!adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Sin permisos</h1>
          <p className="text-white/60 mb-6">Tu cuenta no tiene rol de administrador.</p>
          <button onClick={logout} className="px-4 py-2 rounded-full bg-white/10">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <div className="text-display text-xl font-black tracking-widest flex items-center gap-2">
            {(data?.settings?.brand_logo_light_url || data?.settings?.brand_logo_main_url) ? (
              <img
                src={(data.settings.brand_logo_light_url || data.settings.brand_logo_main_url) as string}
                alt={data?.settings?.event_name ?? "DUALITY"}
                className="object-contain"
                style={{ height: "32px" }}
              />
            ) : (
              <>DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY</>
            )}
            <span className="text-white/40 text-xs ml-2 font-normal tracking-normal">Panel del organizador</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs uppercase tracking-widest text-white/70 hover:text-white border border-white/10 rounded-full px-3 py-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver la web
            </a>
            <button onClick={logout} className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-white/60 hover:text-white">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold border transition-colors ${
                    active
                      ? "bg-[var(--brand-blue)] text-black border-transparent shadow-[0_0_24px_var(--blue-glow)]"
                      : "border-white/10 text-white/70 hover:border-white/40 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Intro card per tab — non-technical guidance */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--brand-blue)]/10 via-transparent to-[var(--brand-red)]/10 p-5">
          <div className="flex items-start gap-3">
            <activeTab.icon className="h-6 w-6 text-[var(--brand-blue)] shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold">{activeTab.label}</h1>
              <p className="text-sm text-white/60 mt-1">{activeTab.hint}</p>
            </div>
          </div>
        </div>

        {isLoading || !data ? (
          <p className="text-white/60">Cargando datos…</p>
        ) : (
          <>
            {tab === "settings" && (
              <div className="space-y-6">
                <BrandLogosEditor data={data.settings} onSaved={refresh} />
                <SettingsEditor data={data.settings} onSaved={refresh} />
              </div>
            )}
            {tab === "tickets" && (
              <TicketsAdminPanel
                settings={data.settings}
                tiers={(data as any).ticketTiers ?? []}
                onSaved={refresh}
              />
            )}
            {tab === "sections" && <SectionsReorder rows={data.sections as any} onSaved={refresh} />}
            {tab === "stages" && <StagesManager rows={(data as any).stages ?? []} onSaved={refresh} />}
            {tab === "artists" && (
              <div className="space-y-6">
                <BulkArtistsImporter existingArtists={data.artists} stages={(data as any).stages ?? []} onSaved={refresh} />
                <ListEditor table="artists" rows={data.artists} fields={buildArtistFields((data as any).stages ?? [])} onSaved={refresh} />
              </div>
            )}
            {tab === "schedule" && (
              <div className="space-y-6">
                <ArtistsScheduleMatrix
                  artists={data.artists as any}
                  stages={(data as any).stages ?? []}
                  schedule={data.schedule as any}
                  onSaved={refresh}
                />
                <BulkScheduleImporter
                  stages={(data as any).stages ?? []}
                  artists={data.artists as any}
                  existingSchedule={data.schedule as any}
                  onSaved={refresh}
                />
                <ListEditor table="schedule_items" rows={data.schedule} fields={buildScheduleFields((data as any).stages ?? [])} onSaved={refresh} />
              </div>
            )}
            {tab === "quickInfo" && <ListEditor table="quick_info_items" rows={data.quickInfo} fields={QUICK_INFO_FIELDS} onSaved={refresh} />}
            {tab === "buses" && <ListEditor table="bus_routes" rows={data.buses} fields={BUS_FIELDS} onSaved={refresh} />}
            {tab === "gallery" && <ListEditor table="gallery_items" rows={data.gallery} fields={GALLERY_FIELDS} onSaved={refresh} />}
            {tab === "faqs" && <ListEditor table="faqs" rows={data.faqs} fields={FAQ_FIELDS} onSaved={refresh} />}
            {tab === "atmosphere" && (
              <AtmosphereEditor atmosphere={data.atmosphere} sectionBackgrounds={data.sectionBackgrounds} onSaved={refresh} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ====================== Settings ======================
type SettingField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "number" | "select" | "font";
  rows?: number;
  hint?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
  role?: "display" | "body" | "both";
};

const FONT_OPTIONS = [
  "Space Grotesk", "Inter", "Bebas Neue", "Anton", "Oswald", "Montserrat", "Poppins",
  "Raleway", "Archivo Black", "Barlow Condensed", "DM Sans", "Manrope", "Sora",
  "Outfit", "Urbanist", "Syne", "Space Mono", "JetBrains Mono", "Playfair Display",
  "Cormorant Garamond", "Bodoni Moda", "Lora", "Abril Fatface", "Bebas Kai",
].map((f) => ({ value: f, label: f }));

const SETTING_GROUPS: { title: string; description?: string; fields: SettingField[] }[] = [
  {
    title: "🎉 Datos del evento",
    description: "Información básica que aparece en toda la web.",
    fields: [
      { key: "current_event_key", label: "Clave del evento (slug)", hint: "Identificador interno · ej: aqua-2025" },
      { key: "event_name", label: "Nombre del evento" },
      { key: "event_subtitle", label: "Subtítulo" },
      { key: "event_date", label: "Fecha (texto visible)", hint: "Ej: Sábado 12 julio · 22:00" },
      { key: "opening_time", label: "Apertura de puertas" },
      { key: "venue_name", label: "Nombre del recinto" },
      { key: "venue_location", label: "Localidad" },
    ],
  },
  {
    title: "🏷️ Marca · Logotipo en la cabecera",
    description: "Sube tu logo. Si lo dejas vacío, se mostrará el texto “DUALITY”.",
    fields: [
      { key: "header_logo_url", label: "Logotipo (imagen PNG/SVG con fondo transparente)" },
      { key: "header_logo_height", label: "Altura del logo (px)", type: "number", min: 20, max: 80, hint: "Recomendado: 36 px" },
    ],
  },
  {
    title: "🔤 Tipografía",
    description: "Mira cómo se ve cada fuente y elige la que mejor pegue con tu marca. Los cambios se aplican al guardar.",
    fields: [
      { key: "font_display", label: "Fuente para títulos", type: "font", role: "display", hint: "Carácter, impacto, identidad." },
      { key: "font_body", label: "Fuente para textos", type: "font", role: "body", hint: "Legibilidad, neutralidad." },
      { key: "font_button", label: "Fuente para botones (opcional)", type: "font", role: "both", hint: "Si la dejas vacía se usa la de títulos." },
    ],
  },
  {
    title: "🎬 Hero (cabecera grande)",
    description: "La primera pantalla del usuario. Imagen, vídeo o flyer.",
    fields: [
      { key: "hero_title", label: "Título" },
      { key: "hero_subtitle", label: "Subtítulo" },
      { key: "hero_cta_primary_text", label: "Botón principal · texto" },
      { key: "hero_cta_primary_url", label: "Botón principal · enlace" },
      { key: "hero_cta_secondary_text", label: "Botón secundario · texto" },
      { key: "hero_cta_secondary_url", label: "Botón secundario · enlace" },
      { key: "hero_image_desktop_url", label: "Imagen para ordenador" },
      { key: "hero_image_mobile_url", label: "Imagen para móvil" },
      { key: "hero_video_desktop_url", label: "Vídeo para ordenador" },
      { key: "hero_video_mobile_url", label: "Vídeo para móvil" },
      { key: "hero_flyer_enabled", label: "Mostrar flyer sobre el banner", type: "checkbox" },
      { key: "hero_flyer_url", label: "Flyer del evento" },
    ],
  },
  {
    title: "⏱️ Cuenta atrás",
    fields: [
      { key: "countdown_enabled", label: "Activada", type: "checkbox" },
      { key: "countdown_datetime", label: "Fecha y hora (formato ISO)", hint: "Ej: 2025-07-12T22:00:00+02:00" },
      { key: "countdown_title", label: "Título" },
      { key: "countdown_subtitle", label: "Subtítulo premium (línea técnica)", hint: "Ej: Cada segundo te acerca a la noche." },
      { key: "countdown_subtext", label: "Subtexto" },
      { key: "countdown_cta_text", label: "Botón · texto" },
      { key: "countdown_cta_url", label: "Botón · enlace" },
    ],
  },
  {
    title: "🖼️ Galería · Estilo de visualización",
    description: "Elige cómo se muestran las fotos en la sección Galería de la web.",
    fields: [
      { key: "gallery_layout", label: "Tipo de galería", type: "select", options: [
        { value: "grid", label: "Cuadrícula clásica (todas a la vez)" },
        { value: "carousel_auto", label: "Carrusel automático (pasando solo)" },
        { value: "carousel_manual", label: "Carrusel con botones (◀ ▶ manual)" },
        { value: "mosaic", label: "Mosaico creativo (tamaños mixtos)" },
      ], hint: "Se aplica al guardar y se ve en la landing." },
    ],
  },
  // Nota: la configuración de Entradas vive en su propia pestaña "Entradas" para evitar duplicidad.


  {
    title: "📍 Ubicación",
    fields: [
      { key: "location_name", label: "Nombre del lugar" },
      { key: "location_address", label: "Dirección" },
      { key: "location_city", label: "Ciudad" },
      { key: "location_maps_url", label: "Enlace a Google Maps" },
      { key: "location_embed_url", label: "Iframe del mapa" },
      { key: "location_button_text", label: "Texto del botón" },
      { key: "location_parking_text", label: "Parking" },
      { key: "location_access_text", label: "Acceso" },
    ],
  },
  {
    title: "📝 Autorización de menores",
    fields: [
      { key: "authorization_title", label: "Título" },
      { key: "authorization_description", label: "Descripción", rows: 2 },
      { key: "authorization_pdf_url", label: "PDF descargable" },
      { key: "authorization_button_text", label: "Texto del botón" },
    ],
  },
  {
    title: "🚀 Llamada a la acción final",
    fields: [
      { key: "final_cta_title", label: "Título" },
      { key: "final_cta_text", label: "Texto" },
      { key: "final_cta_button_text", label: "Botón · texto" },
      { key: "final_cta_button_url", label: "Botón · enlace" },
      { key: "final_cta_background_url", label: "Imagen de fondo" },
    ],
  },
  {
    title: "📱 Redes sociales",
    description: "Aparecen como iconos en el footer. Deja en blanco las que no uses.",
    fields: [
      { key: "footer_instagram_url", label: "Instagram", placeholder: "https://instagram.com/..." },
      { key: "footer_tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@..." },
      { key: "footer_facebook_url", label: "Facebook", placeholder: "https://facebook.com/..." },
      { key: "footer_youtube_url", label: "YouTube", placeholder: "https://youtube.com/@..." },
      { key: "footer_twitter_url", label: "Twitter / X", placeholder: "https://twitter.com/..." },
      { key: "footer_spotify_url", label: "Spotify", placeholder: "https://open.spotify.com/..." },
      { key: "footer_soundcloud_url", label: "SoundCloud", placeholder: "https://soundcloud.com/..." },
      { key: "footer_whatsapp_url", label: "WhatsApp", placeholder: "https://wa.me/..." },
      { key: "footer_telegram_url", label: "Telegram", placeholder: "https://t.me/..." },
    ],
  },
  {
    title: "🦶 Footer · textos y enlaces legales",
    fields: [
      { key: "footer_copyright", label: "Aviso de copyright" },
      { key: "footer_email", label: "Email de contacto" },
      { key: "footer_legal_url", label: "Aviso legal · URL" },
      { key: "footer_privacy_url", label: "Política de privacidad · URL" },
      { key: "footer_cookies_url", label: "Política de cookies · URL" },
      { key: "footer_logo_url", label: "Logo grande del footer (opcional)" },
    ],
  },
  {
    title: "🎨 Apariencia (colores rápidos)",
    description: "Para cambios profundos usa la pestaña “Atmósfera”.",
    fields: [
      { key: "primary_color", label: "Color primario (hex)" },
      { key: "secondary_color", label: "Color secundario (hex)" },
      { key: "background_color", label: "Color de fondo (hex)" },
      { key: "glow_color", label: "Color del glow (rgba)" },
    ],
  },
];


function SettingsEditor({ data, onSaved }: { data: any; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(data ?? {});
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const save = useServerFn(upsertRow);
  const mut = useMutation({
    mutationFn: () => save({ data: { table: "site_settings", values } }),
    onSuccess: () => { toast.success("✓ Cambios guardados"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {SETTING_GROUPS.map((g) => {
        const isOpen = openGroup === g.title;
        return (
        <section key={g.title} className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenGroup(isOpen ? null : g.title)}
            className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate">{g.title}</h2>
              {g.description && <p className="text-xs text-white/50 mt-1">{g.description}</p>}
            </div>
            <span className={`shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/15 text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          {isOpen && (
            <div className="px-5 md:px-6 pb-6 grid md:grid-cols-2 gap-4 border-t border-white/5 pt-5">
              {g.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValues({ ...values, [f.key]: v })} />
              ))}
            </div>
          )}
        </section>
        );
      })}

      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-6 py-3 text-sm uppercase tracking-widest shadow-[0_0_32px_var(--blue-glow)] hover:scale-105 transition-transform"
        >
          <Save className="h-4 w-4" /> {mut.isPending ? "Guardando…" : "Guardar todos los cambios"}
        </button>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: SettingField; value: any; onChange: (v: any) => void }) {
  // Media upload override based on field key
  const mediaConfig = getMediaConfig(field.key);
  if (mediaConfig) {
    return (
      <div className="md:col-span-2">
        <MediaUpload
          label={field.label}
          bucket={mediaConfig.bucket}
          kind={mediaConfig.kind}
          pathPrefix={mediaConfig.prefix}
          value={value}
          onChange={onChange}
        />
        {field.hint && <p className="text-xs text-white/40 mt-1">{field.hint}</p>}
      </div>
    );
  }
  if (field.type === "font") {
    return (
      <div className="md:col-span-2">
        <FontPicker label={field.label} value={value} onChange={onChange} role={field.role ?? "both"} />
        {field.hint && <p className="text-xs text-white/40 mt-1">{field.hint}</p>}
      </div>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 text-sm cursor-pointer rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 hover:border-white/20">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[var(--brand-blue)]"
        />
        <span className="flex-1">{field.label}</span>
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="text-xs uppercase tracking-widest text-white/50">{field.label}</label>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
          style={field.key.startsWith("font_") ? { fontFamily: `"${value}", system-ui, sans-serif` } : undefined}
        >
          <option value="">— elegir —</option>
          {field.options?.map((o) => (
            <option
              key={o.value}
              value={o.value}
              style={field.key.startsWith("font_") ? { fontFamily: `"${o.value}", system-ui, sans-serif` } : undefined}
            >
              {o.label}
            </option>
          ))}
        </select>
        {field.key.startsWith("font_") && value && (
          <div
            className="mt-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-base"
            style={{ fontFamily: `"${value}", system-ui, sans-serif` }}
          >
            DUALITY · Aa Bb 123 — vista previa
          </div>
        )}
        {field.hint && <p className="text-xs text-white/40 mt-1">{field.hint}</p>}
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <div>
        <label className="text-xs uppercase tracking-widest text-white/50">{field.label}</label>
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
        />
        {field.hint && <p className="text-xs text-white/40 mt-1">{field.hint}</p>}
      </div>
    );
  }
  if (field.rows && field.rows > 1) {
    return (
      <div className="md:col-span-2">
        <label className="text-xs uppercase tracking-widest text-white/50">{field.label}</label>
        <textarea
          rows={field.rows}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
        />
        {field.hint && <p className="text-xs text-white/40 mt-1">{field.hint}</p>}
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50">{field.label}</label>
      <input
        type="text"
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none placeholder:text-white/20"
      />
      {field.hint && <p className="text-xs text-white/40 mt-1">{field.hint}</p>}
    </div>
  );
}

function getMediaConfig(key: string): { bucket: string; kind: "image" | "video" | "pdf"; prefix: string } | null {
  if (key === "hero_video_desktop_url") return { bucket: "hero-media", kind: "video", prefix: "video-desktop" };
  if (key === "hero_video_mobile_url") return { bucket: "hero-media", kind: "video", prefix: "video-mobile" };
  if (key === "hero_image_desktop_url") return { bucket: "hero-media", kind: "image", prefix: "image-desktop" };
  if (key === "hero_image_mobile_url") return { bucket: "hero-media", kind: "image", prefix: "image-mobile" };
  if (key === "hero_flyer_url") return { bucket: "hero-media", kind: "image", prefix: "flyer" };
  if (key === "final_cta_background_url") return { bucket: "general-assets", kind: "image", prefix: "final-cta" };
  if (key === "footer_logo_url") return { bucket: "general-assets", kind: "image", prefix: "logo" };
  if (key === "header_logo_url") return { bucket: "general-assets", kind: "image", prefix: "header-logo" };
  if (key === "authorization_pdf_url") return { bucket: "authorization-pdfs", kind: "pdf", prefix: "auth" };
  if (key === "image_url") return { bucket: "artist-images", kind: "image", prefix: "artist" };
  if (key === "media_url" || key === "thumbnail_url") return { bucket: "gallery", kind: "image", prefix: "item" };
  return null;
}

// ====================== Sections toggles ======================
function SectionsEditor({ rows, onSaved }: { rows: any[]; onSaved: () => void }) {
  const save = useServerFn(upsertRow);
  const toggle = async (row: any, patch: Partial<{ is_enabled: boolean; display_mode: string }>) => {
    try {
      await save({ data: { table: "page_sections", values: { ...row, ...patch } } });
      toast.success("Actualizado");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] divide-y divide-white/5">
      {rows.map((r) => (
        <div key={r.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <div className="font-bold">{r.section_name}</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">{r.section_key}</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={r.display_mode}
              onChange={(e) => toggle(r, { display_mode: e.target.value })}
              className="rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-sm"
            >
              <option value="visible">Visible</option>
              <option value="coming_soon">Próximamente</option>
              <option value="hidden">Oculta</option>
            </select>
            <button
              onClick={() => toggle(r, { is_enabled: !r.is_enabled })}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border ${
                r.is_enabled ? "bg-[var(--brand-blue)]/20 border-[var(--brand-blue)]/50" : "border-white/10 text-white/50"
              }`}
            >
              {r.is_enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {r.is_enabled ? "Activa" : "Inactiva"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ====================== Generic List Editor ======================
type ListField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "number" | "select";
  options?: { value: string; label: string }[];
  hint?: string;
};

function buildArtistFields(stages: any[]): ListField[] {
  const stageOpts = (stages ?? []).map((s: any) => ({ value: s.id, label: s.name }));
  return [
    { key: "name", label: "Nombre" },
    { key: "stage_id", label: "Escenario", type: "select", options: stageOpts, hint: "Selecciona el escenario desde el desplegable." },
    { key: "stage", label: "Stage (texto legacy, opcional)" },
    { key: "performance_time", label: "Horario" },
    { key: "image_url", label: "Imagen URL" },
    { key: "instagram_url", label: "Instagram URL" },
    { key: "music_url", label: "Música URL" },
    { key: "is_featured", label: "Destacado", type: "checkbox" },
    { key: "is_visible", label: "Visible", type: "checkbox" },
    { key: "sort_order", label: "Orden", type: "number" },
  ];
}

function buildScheduleFields(stages: any[]): ListField[] {
  const stageOpts = (stages ?? []).map((s: any) => ({ value: s.id, label: s.name }));
  return [
    { key: "stage_id", label: "Escenario", type: "select", options: stageOpts },
    { key: "stage", label: "Stage (texto legacy)" },
    { key: "custom_artist_name", label: "Artista (nombre)" },
    { key: "start_time", label: "Inicio" },
    { key: "end_time", label: "Fin" },
    { key: "description", label: "Descripción", type: "textarea" },
    { key: "is_visible", label: "Visible", type: "checkbox" },
    { key: "sort_order", label: "Orden", type: "number" },
  ];
}
const QUICK_INFO_FIELDS: ListField[] = [
  { key: "label", label: "Etiqueta" },
  { key: "value", label: "Valor" },
  { key: "icon", label: "Icono (nombre lucide)" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];
const BUS_FIELDS: ListField[] = [
  { key: "town", label: "Localidad" },
  { key: "departure_point", label: "Punto salida" },
  { key: "departure_time", label: "Hora salida" },
  { key: "return_time", label: "Hora regreso" },
  { key: "price", label: "Precio" },
  { key: "status", label: "Estado (available/sold_out)" },
  { key: "booking_url", label: "URL reserva" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];
const GALLERY_FIELDS: ListField[] = [
  { key: "title", label: "Título" },
  { key: "media_url", label: "URL media" },
  { key: "thumbnail_url", label: "Thumbnail URL" },
  { key: "media_type", label: "Tipo (image/video)" },
  { key: "is_featured", label: "Destacado", type: "checkbox" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];
const FAQ_FIELDS: ListField[] = [
  { key: "question", label: "Pregunta" },
  { key: "answer", label: "Respuesta", type: "textarea" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];

function ListEditor({ table, rows, fields, onSaved }: { table: string; rows: any[]; fields: ListField[]; onSaved: () => void }) {
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);

  const blank = useMemo(() => {
    const o: Record<string, any> = {};
    fields.forEach((f) => (o[f.key] = f.type === "checkbox" ? true : f.type === "number" ? 0 : ""));
    return o;
  }, [fields]);

  const onSave = async (row: Record<string, any>) => {
    try {
      await save({ data: { table, values: row } });
      toast.success("Guardado");
      setEditing(null);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    try {
      await del({ data: { table, id } });
      toast.success("Eliminado");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...blank })}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-4 py-2 text-xs uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>
      <div className="grid gap-3">
        {rows.length === 0 && <p className="text-white/40 text-sm">Sin elementos.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-[var(--dark-panel)] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-bold">{r[fields[0].key] || "(sin título)"}</div>
              <div className="text-white/40 text-xs">
                {fields.slice(1, 3).map((f) => r[f.key]).filter(Boolean).join(" · ")}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...r })} className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30">Editar</button>
              <button onClick={() => onDelete(r.id)} className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 text-red-300 hover:border-red-400">
                <Trash2 className="h-3 w-3 inline" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--dark-panel)] border border-white/10 rounded-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="font-bold mb-4">{editing.id ? "Editar" : "Crear"}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {fields.map((f) => (
                <FieldInput
                  key={f.key}
                  field={{
                    key: f.key,
                    label: f.label,
                    type: f.type === "checkbox" ? "checkbox" : f.type === "select" ? "select" : undefined,
                    options: f.options,
                    rows: f.type === "textarea" ? 3 : undefined,
                    hint: f.hint,
                  }}
                  value={editing[f.key]}
                  onChange={(v) => setEditing({ ...editing, [f.key]: f.type === "number" ? Number(v) : v })}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-full border border-white/10 text-sm">Cancelar</button>
              <button onClick={() => onSave(editing)} className="px-4 py-2 rounded-full bg-[var(--brand-blue)] text-black font-bold text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== TICKETS ADMIN ======================
const TIER_STATUSES = [
  { value: "available",    label: "Disponible" },
  { value: "last_tickets", label: "Últimas entradas" },
  { value: "sold_out",     label: "Agotado" },
  { value: "coming_soon",  label: "Próximamente" },
  { value: "hidden",       label: "Oculto" },
];

function TicketsAdminPanel({ settings, tiers, onSaved }: { settings: any; tiers: any[]; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(settings ?? {});
  const save = useServerFn(upsertRow);
  const saveSettings = useMutation({
    mutationFn: () => save({ data: { table: "site_settings", values } }),
    onSuccess: () => { toast.success("✓ Ajustes guardados"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  const mode = values.ticket_mode ?? "visual_tiers";
  const visibleTiers = (tiers ?? []).filter((t) => t.is_visible && t.status !== "hidden");

  return (
    <div className="space-y-6">
      {/* 🎫 Visual tiers editor — MOVED TO TOP with distinct preview styling */}
      <section className="rounded-2xl border border-[var(--brand-blue)]/40 bg-gradient-to-br from-[var(--brand-blue)]/8 via-[var(--dark-panel)] to-[var(--brand-red)]/8 p-5 md:p-6 space-y-4 shadow-[0_0_40px_rgba(0,174,239,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-wider">🎫 Tramos de entradas</h2>
            <p className="text-xs text-[var(--brand-blue)] mt-1 font-semibold uppercase tracking-widest">Esto es lo que verá el público en la web</p>
          </div>
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] border border-[var(--brand-blue)]/30">Preview visual</span>
        </div>

        {mode === "visual_tiers" && visibleTiers.length === 0 && (
          <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            ⚠️ No hay tramos de entradas visibles. La sección quedará vacía en la landing.
          </div>
        )}

        <TicketTiersList tiers={tiers} onSaved={onSaved} />
      </section>

      {/* Mode selector */}
      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold">🎟️ Modo de venta</h2>
          <p className="text-xs text-white/50 mt-1">Elige cómo se muestran las entradas en la landing.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { value: "visual_tiers", label: "Tiquetera visual + enlace externo", desc: "Tramos editables. Cada botón abre el enlace oficial en una pestaña nueva." },
            { value: "external", label: "Solo botón externo", desc: "Botón único a la venta oficial (sin tramos)." },
          ].map((opt) => {
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setValues({ ...values, ticket_mode: opt.value })}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 shadow-[0_0_20px_var(--blue-glow)]"
                    : "border-white/10 hover:border-white/30 bg-black/30"
                }`}
              >
                <div className="font-bold text-sm">{opt.label}</div>
                <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-200/80">
          ⚠️ Fourvenues bloquea la carga embebida (ERR_BLOCKED_BY_RESPONSE). Por eso ya no ofrecemos modos iframe/script.
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldInput field={{ key: "ticket_title", label: "Título de la sección" }} value={values.ticket_title} onChange={(v) => setValues({ ...values, ticket_title: v })} />
          <FieldInput field={{ key: "ticket_trust_text", label: "Mensaje de confianza" }} value={values.ticket_trust_text} onChange={(v) => setValues({ ...values, ticket_trust_text: v })} />
          <FieldInput field={{ key: "ticket_text", label: "Subtítulo / descripción", rows: 2 }} value={values.ticket_text} onChange={(v) => setValues({ ...values, ticket_text: v })} />
          <FieldInput field={{ key: "ticket_fallback_url", label: "URL oficial de respaldo", placeholder: "https://www.fourvenues.com/..." }} value={values.ticket_fallback_url} onChange={(v) => setValues({ ...values, ticket_fallback_url: v })} />
        </div>
      </section>

      {/* Global url & alert */}
      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold">🌐 Enlace global & alerta</h2>
          <p className="text-xs text-white/50 mt-1">Opciones que aplican a la tiquetera visual.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldInput field={{ key: "ticket_global_url", label: "Enlace global de compra", placeholder: "https://www.fourvenues.com/..." }} value={values.ticket_global_url} onChange={(v) => setValues({ ...values, ticket_global_url: v })} />
          <FieldInput field={{ key: "use_global_ticket_url", label: "Usar mismo enlace para todos los tramos", type: "checkbox" }} value={values.use_global_ticket_url} onChange={(v) => setValues({ ...values, use_global_ticket_url: v })} />
          <FieldInput field={{ key: "ticket_alert_enabled", label: "Mostrar alerta de entradas", type: "checkbox" }} value={values.ticket_alert_enabled} onChange={(v) => setValues({ ...values, ticket_alert_enabled: v })} />
          <FieldInput field={{ key: "ticket_alert_type", label: "Tipo de alerta", type: "select", options: [
            { value: "info", label: "Informativa" },
            { value: "urgency", label: "Urgencia" },
            { value: "last_tickets", label: "Últimas entradas" },
            { value: "price_change", label: "Cambio de precio" },
          ]}} value={values.ticket_alert_type} onChange={(v) => setValues({ ...values, ticket_alert_type: v })} />
          <FieldInput field={{ key: "ticket_alert_text", label: "Texto de la alerta", rows: 2 }} value={values.ticket_alert_text} onChange={(v) => setValues({ ...values, ticket_alert_text: v })} />
          <FieldInput field={{ key: "ticket_alert_url", label: "Enlace opcional de la alerta" }} value={values.ticket_alert_url} onChange={(v) => setValues({ ...values, ticket_alert_url: v })} />
        </div>
      </section>

      {/* Tier countdown */}
      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 md:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold">⏳ Mini cuenta atrás de cambio de tramo</h2>
          <p className="text-xs text-white/50 mt-1">Aparece dentro de la sección Entradas, más pequeña que la cuenta atrás principal.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <FieldInput field={{ key: "tier_countdown_enabled", label: "Activar mini cuenta atrás", type: "checkbox" }} value={values.tier_countdown_enabled} onChange={(v) => setValues({ ...values, tier_countdown_enabled: v })} />
          <FieldInput field={{ key: "tier_countdown_datetime", label: "Fecha/hora del cambio (ISO)", placeholder: "2026-07-01T22:00:00+02:00" }} value={values.tier_countdown_datetime} onChange={(v) => setValues({ ...values, tier_countdown_datetime: v })} />
          <FieldInput field={{ key: "tier_countdown_text", label: "Texto", placeholder: "Cambio de precio en…" }} value={values.tier_countdown_text} onChange={(v) => setValues({ ...values, tier_countdown_text: v })} />
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={() => saveSettings.mutate()}
          disabled={saveSettings.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-6 py-3 text-sm uppercase tracking-widest shadow-[0_0_32px_var(--blue-glow)] hover:scale-105 transition-transform"
        >
          <Save className="h-4 w-4" /> {saveSettings.isPending ? "Guardando…" : "Guardar ajustes de entradas"}
        </button>
      </div>
    </div>
  );
}

const TIER_FIELDS: ListField[] = [
  { key: "name", label: "Nombre del tramo" },
  { key: "description", label: "Descripción corta" },
  { key: "price", label: "Precio (ej: 18)" },
  { key: "previous_price", label: "Precio anterior (opcional)" },
  { key: "currency", label: "Moneda (ej: €)" },
  { key: "status", label: "Estado", type: "select", options: TIER_STATUSES },
  { key: "badge_text", label: "Etiqueta visual (ej: Más vendida)" },
  { key: "button_text", label: "Texto del botón" },
  { key: "purchase_url", label: "Enlace de compra (https://...)" },
  { key: "open_in_new_tab", label: "Abrir en nueva pestaña", type: "checkbox" },
  { key: "is_featured", label: "Tramo destacado", type: "checkbox" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];

function TicketTiersList({ tiers, onSaved }: { tiers: any[]; onSaved: () => void }) {
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);

  const blank = {
    name: "Nuevo tramo",
    description: "",
    price: "",
    previous_price: "",
    currency: "€",
    status: "available",
    badge_text: "",
    button_text: "Comprar entrada",
    purchase_url: "",
    open_in_new_tab: true,
    is_featured: false,
    is_visible: true,
    sort_order: (tiers?.length ?? 0),
  };

  const onSave = async (row: Record<string, any>) => {
    if (row.purchase_url && !/^https:\/\//i.test(row.purchase_url)) {
      toast.warning("El enlace debería empezar por https://");
    }
    if (row.status === "available" && !row.purchase_url && !row.use_global) {
      toast.warning("Tramo 'Disponible' sin enlace de compra.");
    }
    try {
      await save({ data: { table: "ticket_tiers", values: row } });
      toast.success("Guardado");
      setEditing(null);
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este tramo?")) return;
    try {
      await del({ data: { table: "ticket_tiers", id } });
      toast.success("Eliminado"); onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const onDuplicate = async (row: any) => {
    const { id, created_at, updated_at, ...rest } = row;
    setEditing({ ...rest, name: `${row.name} (copia)`, sort_order: (tiers?.length ?? 0) });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...blank })}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-4 py-2 text-xs uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" /> Nuevo tramo
        </button>
      </div>

      {tiers.length === 0 && <p className="text-white/40 text-sm">Sin tramos todavía.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {tiers.map((t) => {
          const statusLabel = TIER_STATUSES.find((s) => s.value === t.status)?.label ?? t.status;
          return (
            <div key={t.id} className={`rounded-xl border p-4 bg-black/30 ${t.is_featured ? "border-[var(--brand-blue)] shadow-[0_0_18px_var(--blue-glow)]" : "border-white/10"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-white/50">{t.price ? `${t.price}${t.currency ?? "€"}` : "—"} · {statusLabel}</div>
                  {t.badge_text && <div className="inline-block mt-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--brand-red)]/20 text-[var(--brand-red)]">{t.badge_text}</div>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {!t.is_visible && <span className="text-[10px] uppercase text-white/40">Oculto</span>}
                  {t.is_featured && <span className="text-[10px] uppercase text-[var(--brand-blue)]">★ Destacado</span>}
                </div>
              </div>
              {t.description && <p className="text-xs text-white/60 mt-2 line-clamp-2">{t.description}</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => setEditing({ ...t })} className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30">Editar</button>
                <button onClick={() => onDuplicate(t)} className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30">Duplicar</button>
                <button onClick={() => onDelete(t.id)} className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 text-red-300 hover:border-red-400">
                  <Trash2 className="h-3 w-3 inline" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--dark-panel)] border border-white/10 rounded-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="font-bold mb-4">{editing.id ? "Editar tramo" : "Crear tramo"}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {TIER_FIELDS.map((f) => (
                <FieldInput
                  key={f.key}
                  field={{
                    key: f.key,
                    label: f.label,
                    type: f.type === "checkbox" ? "checkbox" : f.type === "select" ? "select" : f.type === "number" ? "number" : undefined,
                    options: f.options,
                  }}
                  value={editing[f.key]}
                  onChange={(v) => setEditing({ ...editing, [f.key]: f.type === "number" ? Number(v) : v })}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-full border border-white/10 text-sm">Cancelar</button>
              <button onClick={() => onSave(editing)} className="px-4 py-2 rounded-full bg-[var(--brand-blue)] text-black font-bold text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
