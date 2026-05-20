import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { upsertRow } from "@/lib/admin.functions";
import { MediaUpload } from "@/components/admin/MediaUpload";

const FIELDS = [
  { key: "brand_logo_main_url", label: "Logotipo principal", hint: "Se usa por defecto en cabecera, footer y CTA final." },
  { key: "brand_logo_light_url", label: "Versión clara (sobre fondos oscuros)", hint: "Opcional." },
  { key: "brand_logo_dark_url", label: "Versión oscura (sobre fondos claros)", hint: "Opcional." },
  { key: "brand_icon_url", label: "Isotipo (icono cuadrado)", hint: "Opcional. Para apps móviles, share, etc." },
  { key: "brand_favicon_url", label: "Favicon", hint: "Recomendado 64×64 px o más, formato PNG o SVG." },
] as const;

export function BrandLogosEditor({ data, onSaved }: { data: any; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(data ?? {});
  const save = useServerFn(upsertRow);
  const mut = useMutation({
    mutationFn: () => save({ data: { table: "site_settings", values } }),
    onSuccess: () => { toast.success("✓ Logotipos actualizados en toda la web"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  const reset = () => {
    if (!confirm("¿Quitar todos los logos y volver al texto DUALITY por defecto?")) return;
    const cleared: Record<string, any> = { ...values };
    FIELDS.forEach((f) => (cleared[f.key] = null));
    setValues(cleared);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-5 md:p-6">
      <header className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold">🏷️ Logotipo global de marca</h2>
          <p className="text-xs text-white/50 mt-1">
            Sube tu logo una sola vez. Se aplicará automáticamente en cabecera, footer, CTA final, panel de administración, login y favicon de la pestaña.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30"
        >
          <RotateCcw className="h-3 w-3" /> Restaurar por defecto
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <MediaUpload
              label={f.label}
              bucket="general-assets"
              kind="image"
              pathPrefix={`brand/${f.key.replace("brand_", "")}`}
              value={values[f.key]}
              onChange={(v) => setValues({ ...values, [f.key]: v })}
            />
            {f.hint && <p className="text-xs text-white/40 mt-1">{f.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-5 py-2.5 text-xs uppercase tracking-widest"
        >
          <Save className="h-4 w-4" /> {mut.isPending ? "Guardando…" : "Aplicar a toda la web"}
        </button>
      </div>
    </section>
  );
}
