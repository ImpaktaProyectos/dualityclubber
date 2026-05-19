import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertRow } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";
import { MediaUpload } from "@/components/admin/MediaUpload";

// ============== Presets ==============
type Preset = {
  key: string;
  label: string;
  description: string;
  values: Record<string, any>;
};

const PRESETS: Preset[] = [
  {
    key: "aqua",
    label: "AQUA",
    description: "Azul eléctrico, ambiente acuático y limpio.",
    values: {
      atmosphere_preset: "aqua",
      background_type: "gradient",
      background_color: "#03060B",
      background_secondary_color: "#0a2b4a",
      overlay_color: "#00111f",
      overlay_opacity: 50,
      texture_type: "noise",
      texture_opacity: 18,
      motion_enabled: true,
      motion_type: "gradient-shift",
      motion_speed: "medium",
      glow_intensity: "medium",
      readability_mode: "medium",
      blur_amount: 0,
      saturation: 110,
      contrast: 105,
    },
  },
  {
    key: "red",
    label: "RED",
    description: "Rojo carmesí, intensidad y energía nocturna.",
    values: {
      atmosphere_preset: "red",
      background_type: "gradient",
      background_color: "#0a0203",
      background_secondary_color: "#3a0710",
      overlay_color: "#1a0205",
      overlay_opacity: 55,
      texture_type: "grid",
      texture_opacity: 12,
      motion_enabled: true,
      motion_type: "pulse-glow",
      motion_speed: "slow",
      glow_intensity: "high",
      readability_mode: "high",
      blur_amount: 0,
      saturation: 115,
      contrast: 110,
    },
  },
  {
    key: "cyber",
    label: "CYBER",
    description: "Neón cyan/magenta, scanlines y partículas.",
    values: {
      atmosphere_preset: "cyber",
      background_type: "gradient",
      background_color: "#04020a",
      background_secondary_color: "#1a0540",
      overlay_color: "#000010",
      overlay_opacity: 60,
      texture_type: "scanlines",
      texture_opacity: 22,
      motion_enabled: true,
      motion_type: "particles",
      motion_speed: "fast",
      glow_intensity: "high",
      readability_mode: "medium",
      blur_amount: 0,
      saturation: 130,
      contrast: 115,
    },
  },
  {
    key: "duality",
    label: "DUALITY",
    description: "Dualidad rojo + azul, identidad de marca.",
    values: {
      atmosphere_preset: "duality",
      background_type: "gradient",
      background_color: "#0b0316",
      background_secondary_color: "#150a2a",
      overlay_color: "#05010d",
      overlay_opacity: 55,
      texture_type: "noise",
      texture_opacity: 20,
      motion_enabled: true,
      motion_type: "light-sweep",
      motion_speed: "medium",
      glow_intensity: "high",
      readability_mode: "medium",
      blur_amount: 0,
      saturation: 120,
      contrast: 108,
    },
  },
  {
    key: "minimal",
    label: "MINIMAL",
    description: "Negro plano, sin texturas, máxima legibilidad.",
    values: {
      atmosphere_preset: "minimal",
      background_type: "solid",
      background_color: "#03060B",
      background_secondary_color: "#03060B",
      overlay_color: "#000000",
      overlay_opacity: 0,
      texture_type: "none",
      texture_opacity: 0,
      motion_enabled: false,
      motion_type: "none",
      motion_speed: "slow",
      glow_intensity: "low",
      readability_mode: "high",
      blur_amount: 0,
      saturation: 100,
      contrast: 100,
    },
  },
];

const TEXTURES = ["none", "noise", "grid", "scanlines", "vignette", "light-beams"];
const MOTIONS = ["none", "particles", "pulse-glow", "gradient-shift", "light-sweep"];
const BG_TYPES = ["solid", "gradient", "image", "video"];

const SECTION_KEYS = [
  { key: "hero", label: "Hero" },
  { key: "quick_info", label: "Info rápida" },
  { key: "countdown", label: "Cuenta atrás" },
  { key: "tickets", label: "Entradas" },
  { key: "artists", label: "Artistas" },
  { key: "schedule", label: "Horarios" },
  { key: "gallery", label: "Galería" },
  { key: "location", label: "Ubicación" },
  { key: "buses", label: "Buses" },
  { key: "authorization", label: "Autorización" },
  { key: "faq", label: "FAQ" },
  { key: "final_cta", label: "CTA final" },
  { key: "footer", label: "Footer" },
];

// ============== Component ==============
export function AtmosphereEditor({
  atmosphere,
  sectionBackgrounds,
  onSaved,
}: {
  atmosphere: any;
  sectionBackgrounds: any[];
  onSaved: () => void;
}) {
  const [view, setView] = useState<"global" | "sections">("global");
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setView("global")}
          className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold border ${
            view === "global" ? "bg-[var(--brand-blue)] text-black border-transparent" : "border-white/10 text-white/70"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setView("sections")}
          className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold border ${
            view === "sections" ? "bg-[var(--brand-blue)] text-black border-transparent" : "border-white/10 text-white/70"
          }`}
        >
          Por sección
        </button>
      </div>

      {view === "global" ? (
        <GlobalEditor atmosphere={atmosphere} onSaved={onSaved} />
      ) : (
        <SectionsEditor sectionBackgrounds={sectionBackgrounds} onSaved={onSaved} />
      )}
    </div>
  );
}

// ============== Global ==============
function GlobalEditor({ atmosphere, onSaved }: { atmosphere: any; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(
    atmosphere ?? { is_singleton: true, background_type: "solid", background_color: "#03060B" },
  );
  const save = useServerFn(upsertRow);
  const mut = useMutation({
    mutationFn: () => save({ data: { table: "visual_settings", values: { ...values, is_singleton: true } } }),
    onSuccess: () => { toast.success("Atmósfera global guardada"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  const applyPreset = (p: Preset) => {
    setValues((prev) => ({ ...prev, ...p.values }));
    toast.success(`Preset ${p.label} aplicado · recuerda guardar`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5">
        <h3 className="text-sm uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Presets
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p)}
              className={`text-left rounded-xl border p-3 transition-colors ${
                values.atmosphere_preset === p.key
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="text-display font-black tracking-widest">{p.label}</div>
              <div className="text-xs text-white/50 mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 space-y-3">
        <h3 className="text-sm uppercase tracking-widest text-white/60">Modo de scroll del fondo</h3>
        <p className="text-xs text-white/50">
          <strong>Continuo</strong>: la imagen / atmósfera se mantiene fija mientras el usuario hace scroll por toda la web (efecto cinemático, favorece la lectura).{" "}
          <strong>Por secciones</strong>: cada sección pinta su propio fondo y se desplaza con el contenido.
        </p>
        <div className="flex gap-2">
          {[
            { v: "continuous", label: "Continuo (fijo en scroll)" },
            { v: "per-section", label: "Por secciones" },
          ].map((opt) => {
            const active = (values.background_scroll_mode ?? "continuous") === opt.v;
            return (
              <button
                key={opt.v}
                onClick={() => setValues({ ...values, background_scroll_mode: opt.v })}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold border ${
                  active ? "bg-[var(--brand-blue)] text-black border-transparent" : "border-white/10 text-white/70"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-white/40">
          Aunque elijas modo continuo, cualquier sección puede tener su propio fondo activando un override en la pestaña “Por sección”.
        </p>
      </section>

      <AtmosphereFields values={values} setValues={setValues} mediaPrefix="global" />

      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-6 py-3 text-sm uppercase tracking-widest shadow-lg"
        >
          <Save className="h-4 w-4" /> {mut.isPending ? "Guardando…" : "Guardar global"}
        </button>
      </div>
    </div>
  );
}

// ============== Per section ==============
function SectionsEditor({ sectionBackgrounds, onSaved }: { sectionBackgrounds: any[]; onSaved: () => void }) {
  const byKey = useMemo(() => {
    const m: Record<string, any> = {};
    for (const r of sectionBackgrounds) m[r.section_key] = r;
    return m;
  }, [sectionBackgrounds]);

  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {SECTION_KEYS.map((s) => {
        const row = byKey[s.key];
        const useGlobal = !row || row.use_global_background;
        return (
          <div key={s.key} className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] overflow-hidden">
            <button
              onClick={() => setOpen(open === s.key ? null : s.key)}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-bold">{s.label}</div>
                <div className="text-xs text-white/40 uppercase tracking-widest">
                  {useGlobal ? "Usa atmósfera global" : `Override · ${row?.background_type ?? "solid"}`}
                </div>
              </div>
              <span className="text-xs text-white/40">{open === s.key ? "−" : "+"}</span>
            </button>
            {open === s.key && (
              <div className="p-4 border-t border-white/10">
                <SectionForm sectionKey={s.key} initial={row} onSaved={onSaved} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionForm({ sectionKey, initial, onSaved }: { sectionKey: string; initial: any; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(
    initial ?? { section_key: sectionKey, use_global_background: true, background_type: "solid" },
  );
  const save = useServerFn(upsertRow);
  const mut = useMutation({
    mutationFn: () => save({ data: { table: "section_backgrounds", values: { ...values, section_key: sectionKey } } }),
    onSuccess: () => { toast.success(`${sectionKey} guardado`); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!values.use_global_background}
          onChange={(e) => setValues({ ...values, use_global_background: e.target.checked })}
        />
        <span>Usar atmósfera global (recomendado)</span>
      </label>

      {!values.use_global_background && (
        <AtmosphereFields values={values} setValues={setValues} mediaPrefix={`section-${sectionKey}`} />
      )}

      <div className="flex justify-end">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-5 py-2.5 text-xs uppercase tracking-widest"
        >
          <Save className="h-4 w-4" /> {mut.isPending ? "Guardando…" : "Guardar sección"}
        </button>
      </div>
    </div>
  );
}

// ============== Shared field group ==============
function AtmosphereFields({
  values,
  setValues,
  mediaPrefix,
}: {
  values: Record<string, any>;
  setValues: (v: Record<string, any>) => void;
  mediaPrefix: string;
}) {
  const set = (k: string, v: any) => setValues({ ...values, [k]: v });
  const bgType = values.background_type ?? "solid";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-widest text-white/60">Capa base</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Tipo de fondo" value={bgType} options={BG_TYPES} onChange={(v) => set("background_type", v)} />
          <Color label="Color base" value={values.background_color} onChange={(v) => set("background_color", v)} />
          {bgType === "gradient" && (
            <Color label="Color secundario (gradiente)" value={values.background_secondary_color} onChange={(v) => set("background_secondary_color", v)} />
          )}
        </div>

        {bgType === "image" && (
          <MediaUpload
            label="Imagen de fondo"
            bucket="background-images"
            kind="image"
            pathPrefix={mediaPrefix}
            value={values.background_image_url}
            onChange={(v) => set("background_image_url", v)}
          />
        )}
        {bgType === "video" && (
          <MediaUpload
            label="Vídeo de fondo"
            bucket="background-videos"
            kind="video"
            pathPrefix={mediaPrefix}
            value={values.background_video_url}
            onChange={(v) => set("background_video_url", v)}
          />
        )}

        {(bgType === "image" || bgType === "video") && (
          <div className="grid md:grid-cols-2 gap-4">
            <Range label={`Opacidad imagen (${values.image_opacity ?? 60}%)`} min={0} max={100} value={values.image_opacity ?? 60} onChange={(v) => set("image_opacity", v)} />
            <Range label={`Desenfoque (${values.blur_amount ?? 0}px)`} min={0} max={40} value={values.blur_amount ?? 0} onChange={(v) => set("blur_amount", v)} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-widest text-white/60">Overlay (legibilidad)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Color label="Color overlay" value={values.overlay_color ?? "#000000"} onChange={(v) => set("overlay_color", v)} />
          <Range label={`Opacidad overlay (${values.overlay_opacity ?? 55}%)`} min={0} max={100} value={values.overlay_opacity ?? 55} onChange={(v) => set("overlay_opacity", v)} />
          <Select
            label="Modo legibilidad"
            value={values.readability_mode ?? "medium"}
            options={["low", "medium", "high"]}
            onChange={(v) => set("readability_mode", v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-widest text-white/60">Textura</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Select label="Tipo de textura" value={values.texture_type ?? "none"} options={TEXTURES} onChange={(v) => set("texture_type", v)} />
          <Range label={`Opacidad textura (${values.texture_opacity ?? 25}%)`} min={0} max={100} value={values.texture_opacity ?? 25} onChange={(v) => set("texture_opacity", v)} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 space-y-4">
        <h3 className="text-sm uppercase tracking-widest text-white/60">Movimiento</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!values.motion_enabled} onChange={(e) => set("motion_enabled", e.target.checked)} />
          <span>Activar movimiento sutil</span>
        </label>
        {values.motion_enabled && (
          <div className="grid md:grid-cols-3 gap-4">
            <Select label="Tipo de movimiento" value={values.motion_type ?? "none"} options={MOTIONS} onChange={(v) => set("motion_type", v)} />
            <Select label="Velocidad" value={values.motion_speed ?? "medium"} options={["slow", "medium", "fast"]} onChange={(v) => set("motion_speed", v)} />
            <Select label="Intensidad glow" value={values.glow_intensity ?? "medium"} options={["low", "medium", "high"]} onChange={(v) => set("glow_intensity", v)} />
          </div>
        )}
      </section>
    </div>
  );
}

// ============== Inputs ==============
function Color({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded bg-transparent border border-white/10"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

function Range({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
