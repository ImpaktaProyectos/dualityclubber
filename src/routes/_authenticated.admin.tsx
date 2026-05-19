import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAdminData, upsertRow, deleteRow, isCurrentUserAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { LogOut, Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { AtmosphereEditor } from "@/components/admin/AtmosphereEditor";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Panel admin · DUALITY" }] }),
  component: AdminPage,
});

const TABS = [
  { key: "settings", label: "Evento & Settings" },
  { key: "sections", label: "Secciones" },
  { key: "artists", label: "Artistas" },
  { key: "schedule", label: "Horarios" },
  { key: "quickInfo", label: "Info rápida" },
  { key: "buses", label: "Autobuses" },
  { key: "gallery", label: "Galería" },
  { key: "faqs", label: "FAQ" },
  { key: "atmosphere", label: "Fondos y atmósfera" },
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <div className="text-display text-xl font-black tracking-widest">
            DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY <span className="text-white/40 text-xs ml-2">ADMIN</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="text-xs uppercase tracking-widest text-white/60 hover:text-white">Ver web</a>
            <button onClick={logout} className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-white/60 hover:text-white">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-1 overflow-x-auto scrollbar-hide pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold border transition-colors ${
                tab === t.key ? "bg-[var(--brand-blue)] text-black border-transparent" : "border-white/10 text-white/70 hover:border-white/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isLoading || !data ? (
          <p className="text-white/60">Cargando datos…</p>
        ) : (
          <>
            {tab === "settings" && <SettingsEditor data={data.settings} onSaved={refresh} />}
            {tab === "sections" && <SectionsEditor rows={data.sections} onSaved={refresh} />}
            {tab === "artists" && <ListEditor table="artists" rows={data.artists} fields={ARTIST_FIELDS} onSaved={refresh} />}
            {tab === "schedule" && <ListEditor table="schedule_items" rows={data.schedule} fields={SCHEDULE_FIELDS} onSaved={refresh} />}
            {tab === "quickInfo" && <ListEditor table="quick_info_items" rows={data.quickInfo} fields={QUICK_INFO_FIELDS} onSaved={refresh} />}
            {tab === "buses" && <ListEditor table="bus_routes" rows={data.buses} fields={BUS_FIELDS} onSaved={refresh} />}
            {tab === "gallery" && <ListEditor table="gallery_items" rows={data.gallery} fields={GALLERY_FIELDS} onSaved={refresh} />}
            {tab === "faqs" && <ListEditor table="faqs" rows={data.faqs} fields={FAQ_FIELDS} onSaved={refresh} />}
          </>
        )}
      </main>
    </div>
  );
}

// ====================== Settings ======================
const SETTING_GROUPS: { title: string; fields: { key: string; label: string; type?: string; rows?: number }[] }[] = [
  {
    title: "Evento",
    fields: [
      { key: "current_event_key", label: "Clave del evento (slug)" },
      { key: "event_name", label: "Nombre del evento" },
      { key: "event_subtitle", label: "Subtítulo" },
      { key: "event_date", label: "Fecha (texto)" },
      { key: "opening_time", label: "Apertura puertas" },
      { key: "venue_name", label: "Recinto" },
      { key: "venue_location", label: "Localidad" },
    ],
  },
  {
    title: "Hero",
    fields: [
      { key: "hero_title", label: "Título" },
      { key: "hero_subtitle", label: "Subtítulo" },
      { key: "hero_cta_primary_text", label: "CTA primario · texto" },
      { key: "hero_cta_primary_url", label: "CTA primario · URL" },
      { key: "hero_cta_secondary_text", label: "CTA secundario · texto" },
      { key: "hero_cta_secondary_url", label: "CTA secundario · URL" },
      { key: "hero_image_desktop_url", label: "Imagen desktop URL" },
      { key: "hero_image_mobile_url", label: "Imagen móvil URL" },
      { key: "hero_video_desktop_url", label: "Vídeo desktop URL" },
      { key: "hero_video_mobile_url", label: "Vídeo móvil URL" },
      { key: "hero_flyer_enabled", label: "Mostrar flyer sobre el hero", type: "checkbox" },
      { key: "hero_flyer_url", label: "Flyer del evento (imagen)" },
    ],
  },
  {
    title: "Cuenta atrás",
    fields: [
      { key: "countdown_enabled", label: "Activada", type: "checkbox" },
      { key: "countdown_datetime", label: "Fecha/hora (ISO)" },
      { key: "countdown_title", label: "Título" },
      { key: "countdown_subtext", label: "Subtexto" },
      { key: "countdown_cta_text", label: "CTA texto" },
      { key: "countdown_cta_url", label: "CTA URL" },
    ],
  },
  {
    title: "Entradas",
    fields: [
      { key: "ticket_status", label: "Estado (available/coming_soon/sold_out)" },
      { key: "ticket_title", label: "Título" },
      { key: "ticket_text", label: "Descripción", rows: 2 },
      { key: "ticket_iframe_url", label: "Fourvenues iframe URL" },
      { key: "ticket_fallback_url", label: "URL fallback" },
      { key: "ticket_show_fallback", label: "Mostrar fallback", type: "checkbox" },
      { key: "ticket_trust_text", label: "Texto de confianza" },
    ],
  },
  {
    title: "Ubicación",
    fields: [
      { key: "location_name", label: "Nombre" },
      { key: "location_address", label: "Dirección" },
      { key: "location_city", label: "Ciudad" },
      { key: "location_maps_url", label: "Google Maps URL" },
      { key: "location_embed_url", label: "Embed iframe URL" },
      { key: "location_button_text", label: "Texto botón" },
      { key: "location_parking_text", label: "Parking" },
      { key: "location_access_text", label: "Acceso" },
    ],
  },
  {
    title: "Autorización menores",
    fields: [
      { key: "authorization_title", label: "Título" },
      { key: "authorization_description", label: "Descripción", rows: 2 },
      { key: "authorization_pdf_url", label: "PDF URL" },
      { key: "authorization_button_text", label: "Texto botón" },
    ],
  },
  {
    title: "CTA final",
    fields: [
      { key: "final_cta_title", label: "Título" },
      { key: "final_cta_text", label: "Texto" },
      { key: "final_cta_button_text", label: "Botón texto" },
      { key: "final_cta_button_url", label: "Botón URL" },
      { key: "final_cta_background_url", label: "Fondo URL" },
    ],
  },
  {
    title: "Footer",
    fields: [
      { key: "footer_copyright", label: "Copyright" },
      { key: "footer_email", label: "Email" },
      { key: "footer_instagram_url", label: "Instagram" },
      { key: "footer_tiktok_url", label: "TikTok" },
      { key: "footer_facebook_url", label: "Facebook" },
      { key: "footer_legal_url", label: "Aviso legal URL" },
      { key: "footer_privacy_url", label: "Privacidad URL" },
      { key: "footer_cookies_url", label: "Cookies URL" },
      { key: "footer_logo_url", label: "Logo URL" },
    ],
  },
  {
    title: "Apariencia",
    fields: [
      { key: "primary_color", label: "Color primario (hex)" },
      { key: "secondary_color", label: "Color secundario (hex)" },
      { key: "background_color", label: "Color fondo (hex)" },
      { key: "glow_color", label: "Glow color (rgba)" },
      { key: "appearance_preset", label: "Preset" },
      { key: "appearance_particles", label: "Partículas", type: "checkbox" },
      { key: "appearance_texture", label: "Textura", type: "checkbox" },
    ],
  },
];

function SettingsEditor({ data, onSaved }: { data: any; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(data ?? {});
  const save = useServerFn(upsertRow);
  const mut = useMutation({
    mutationFn: () => save({ data: { table: "site_settings", values } }),
    onSuccess: () => { toast.success("Guardado"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      {SETTING_GROUPS.map((g) => (
        <section key={g.title} className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5">
          <h2 className="text-sm uppercase tracking-widest text-white/60 mb-4">{g.title}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {g.fields.map((f) => (
              <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValues({ ...values, [f.key]: v })} />
            ))}
          </div>
        </section>
      ))}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-6 py-3 text-sm uppercase tracking-widest shadow-lg"
        >
          <Save className="h-4 w-4" /> {mut.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: { key: string; label: string; type?: string; rows?: number }; value: any; onChange: (v: any) => void }) {
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
      </div>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.rows && field.rows > 1) {
    return (
      <div>
        <label className="text-xs uppercase tracking-widest text-white/50">{field.label}</label>
        <textarea
          rows={field.rows}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50">{field.label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
      />
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
type ListField = { key: string; label: string; type?: "text" | "textarea" | "checkbox" | "number" };

const ARTIST_FIELDS: ListField[] = [
  { key: "name", label: "Nombre" },
  { key: "stage", label: "Stage" },
  { key: "performance_time", label: "Horario" },
  { key: "image_url", label: "Imagen URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "music_url", label: "Música URL" },
  { key: "is_featured", label: "Destacado", type: "checkbox" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];
const SCHEDULE_FIELDS: ListField[] = [
  { key: "stage", label: "Stage" },
  { key: "custom_artist_name", label: "Artista (nombre)" },
  { key: "start_time", label: "Inicio" },
  { key: "end_time", label: "Fin" },
  { key: "description", label: "Descripción", type: "textarea" },
  { key: "is_visible", label: "Visible", type: "checkbox" },
  { key: "sort_order", label: "Orden", type: "number" },
];
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
                  field={{ key: f.key, label: f.label, type: f.type === "checkbox" ? "checkbox" : undefined, rows: f.type === "textarea" ? 3 : undefined }}
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
