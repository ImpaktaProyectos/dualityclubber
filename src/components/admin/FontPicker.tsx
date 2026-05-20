import { useEffect } from "react";
import { Check } from "lucide-react";

export const ADMIN_FONTS = [
  { name: "Orbitron", weights: "400;600;700;900", role: "display" },
  { name: "Exo 2", weights: "300;400;600;800", role: "both" },
  { name: "Bebas Neue", weights: "400", role: "display" },
  { name: "Oswald", weights: "300;500;700", role: "display" },
  { name: "Anton", weights: "400", role: "display" },
  { name: "Archivo Black", weights: "400", role: "display" },
  { name: "Rajdhani", weights: "400;600;700", role: "both" },
  { name: "Space Grotesk", weights: "400;500;700", role: "both" },
  { name: "Montserrat", weights: "300;400;600;800", role: "body" },
  { name: "Inter", weights: "300;400;500;700", role: "body" },
  { name: "DM Sans", weights: "400;500;700", role: "body" },
  { name: "Manrope", weights: "400;500;700", role: "body" },
  { name: "Sora", weights: "400;600;800", role: "body" },
  { name: "Barlow Condensed", weights: "400;600;800", role: "both" },
] as const;

function ensureFontLoaded(family: string, weights: string) {
  if (typeof document === "undefined") return;
  const id = `admin-font-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

export function FontPicker({
  label,
  value,
  onChange,
  role = "both",
  eventName = "AQUA OPEN AIR",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  role?: "display" | "body" | "both";
  eventName?: string;
}) {
  const options = ADMIN_FONTS.filter(
    (f) => role === "both" || f.role === "both" || f.role === role,
  );

  useEffect(() => {
    options.forEach((f) => ensureFontLoaded(f.name, f.weights));
  }, [options]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-widest text-white/60">{label}</label>
        {value && <span className="text-[10px] uppercase tracking-widest text-white/40">Actual: {value}</span>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {options.map((f) => {
          const active = value === f.name;
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => onChange(f.name)}
              className={`relative text-left rounded-xl border p-3 transition-colors ${
                active
                  ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10"
                  : "border-white/10 hover:border-white/30 bg-black/30"
              }`}
            >
              {active && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-[var(--brand-blue)]" />
              )}
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{f.name}</div>
              <div
                className="text-2xl font-black leading-tight"
                style={{ fontFamily: `"${f.name}", system-ui, sans-serif` }}
              >
                {eventName}
              </div>
              <div
                className="text-xs text-white/60 mt-1.5"
                style={{ fontFamily: `"${f.name}", system-ui, sans-serif` }}
              >
                Compra tus entradas para vivir la noche.
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
