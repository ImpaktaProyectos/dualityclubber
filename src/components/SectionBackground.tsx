import { ReactNode, useMemo } from "react";

export type BgConfig = {
  background_type?: string | null;
  background_color?: string | null;
  background_secondary_color?: string | null;
  background_image_url?: string | null;
  background_video_url?: string | null;
  background_position?: string | null;
  background_size?: string | null;
  background_repeat?: boolean | null;
  background_fixed?: boolean | null;
  image_opacity?: number | null;
  overlay_color?: string | null;
  overlay_opacity?: number | null;
  blur_amount?: number | null;
  saturation?: number | null;
  contrast?: number | null;
  glow_intensity?: string | null;
  texture_type?: string | null;
  texture_opacity?: number | null;
  motion_type?: string | null;
  motion_enabled?: boolean | null;
  motion_speed?: string | null;
  readability_mode?: string | null;
};

/** Merge per-section config with global config. Section overrides only when use_global_background=false */
export function resolveSectionBg(
  sectionKey: string,
  global: BgConfig | null | undefined,
  sectionBgs: (BgConfig & { section_key: string; use_global_background: boolean })[] | undefined,
): BgConfig {
  const sec = sectionBgs?.find((s) => s.section_key === sectionKey);
  if (!sec || sec.use_global_background) return global ?? {};
  // Fill missing fields from global so editor can override partially
  return { ...(global ?? {}), ...stripNulls(sec) };
}

function stripNulls<T extends Record<string, any>>(o: T): Partial<T> {
  const out: any = {};
  for (const k in o) if (o[k] !== null && o[k] !== undefined) out[k] = o[k];
  return out;
}

const speedMap: Record<string, string> = { slow: "30s", medium: "18s", fast: "9s" };
const glowAlpha: Record<string, number> = { off: 0, low: 0.15, medium: 0.35, high: 0.6 };

export function SectionBackground({ cfg, className = "" }: { cfg: BgConfig | null | undefined; className?: string }) {
  if (!cfg) return null;
  const type = cfg.background_type ?? "solid";
  const c1 = cfg.background_color || "#03060B";
  const c2 = cfg.background_secondary_color || c1;
  const imgOp = (cfg.image_opacity ?? 60) / 100;
  const overlayOp = (cfg.overlay_opacity ?? 55) / 100;
  const overlayColor = cfg.overlay_color || "#000000";
  const blur = cfg.blur_amount ?? 0;
  const sat = cfg.saturation ?? 100;
  const con = cfg.contrast ?? 100;
  const texOp = (cfg.texture_opacity ?? 25) / 100;
  const tex = cfg.texture_type ?? "none";
  const motion = cfg.motion_enabled ? (cfg.motion_type ?? "none") : "none";
  const speed = speedMap[cfg.motion_speed ?? "medium"];
  const glow = glowAlpha[cfg.glow_intensity ?? "medium"] ?? 0.35;
  const readability = cfg.readability_mode ?? "medium";

  // Auto readability boost if there's a heavy media background
  const hasMedia = (type === "image" && cfg.background_image_url) || (type === "video" && cfg.background_video_url);
  const autoOverlay = hasMedia ? Math.max(overlayOp, readability === "high" ? 0.7 : readability === "medium" ? 0.55 : 0.35) : overlayOp;

  const baseStyle = useMemo(() => {
    if (type === "gradient") {
      return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
    }
    return { background: c1 };
  }, [type, c1, c2]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Base layer */}
      <div className="absolute inset-0" style={baseStyle} />

      {/* Media layer */}
      {type === "image" && cfg.background_image_url && (
        <img
          src={cfg.background_image_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: (cfg.background_size as any) || "cover",
            objectPosition: cfg.background_position || "center",
            opacity: imgOp,
            filter: `blur(${blur}px) saturate(${sat}%) contrast(${con}%)`,
          }}
        />
      )}
      {type === "video" && cfg.background_video_url && (
        <video
          key={cfg.background_video_url}
          src={cfg.background_video_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imgOp, filter: `blur(${blur}px) saturate(${sat}%) contrast(${con}%)` }}
        />
      )}

      {/* Texture layer */}
      {tex !== "none" && <TextureLayer kind={tex} opacity={texOp} c1={c1} c2={c2} />}

      {/* Motion layer */}
      {motion !== "none" && <MotionLayer kind={motion} speed={speed} c1={c1} c2={c2} />}

      {/* Glow tint */}
      {glow > 0 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, var(--brand-blue) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, var(--brand-red) 0%, transparent 55%)`,
            opacity: glow,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Overlay (legibilidad) */}
      {autoOverlay > 0 && (
        <div className="absolute inset-0" style={{ background: overlayColor, opacity: autoOverlay }} />
      )}
    </div>
  );
}

function TextureLayer({ kind, opacity, c1, c2 }: { kind: string; opacity: number; c1: string; c2: string }) {
  const common = { position: "absolute", inset: 0, opacity } as React.CSSProperties;
  switch (kind) {
    case "noise":
      return (
        <div
          style={{
            ...common,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
            mixBlendMode: "overlay",
          }}
        />
      );
    case "grid":
      return (
        <div
          style={{
            ...common,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      );
    case "scanlines":
      return (
        <div
          style={{
            ...common,
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px)",
          }}
        />
      );
    case "vignette":
      return (
        <div
          style={{
            ...common,
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.85) 100%)",
          }}
        />
      );
    case "dual-split":
      return (
        <div
          style={{
            ...common,
            background: `linear-gradient(90deg, ${c1} 0%, transparent 45%, transparent 55%, ${c2} 100%)`,
            mixBlendMode: "screen",
          }}
        />
      );
    case "radial":
      return (
        <div
          style={{
            ...common,
            background: `radial-gradient(circle at 30% 30%, ${c1} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${c2} 0%, transparent 55%)`,
            mixBlendMode: "screen",
          }}
        />
      );
    case "light-beams":
      return (
        <div
          style={{
            ...common,
            background:
              "conic-gradient(from 200deg at 50% -20%, transparent 0deg, rgba(255,255,255,.08) 20deg, transparent 60deg, rgba(255,255,255,.06) 90deg, transparent 130deg)",
          }}
        />
      );
    default:
      return null;
  }
}

function MotionLayer({ kind, speed, c1, c2 }: { kind: string; speed: string; c1: string; c2: string }) {
  if (kind === "gradient-shift") {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(120deg, ${c1}, ${c2}, ${c1})`,
          backgroundSize: "300% 300%",
          animation: `dual-grad ${speed} ease-in-out infinite`,
          opacity: 0.35,
          mixBlendMode: "screen",
        }}
      />
    );
  }
  if (kind === "pulse-glow") {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, var(--brand-blue) 0%, transparent 50%)`,
          animation: `dual-pulse ${speed} ease-in-out infinite`,
          mixBlendMode: "screen",
          opacity: 0.4,
        }}
      />
    );
  }
  if (kind === "light-sweep") {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,.15) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: `dual-sweep ${speed} linear infinite`,
        }}
      />
    );
  }
  if (kind === "particles") {
    // Lightweight CSS particles via radial dots
    return (
      <div
        className="absolute inset-0 motion-particles"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,.35) 1px, transparent 1.5px) 0 0/40px 40px, radial-gradient(circle, rgba(255,255,255,.2) 1px, transparent 1.5px) 20px 20px/60px 60px",
          animation: `dual-particles ${speed} linear infinite`,
          opacity: 0.4,
        }}
      />
    );
  }
  return null;
}

export function SectionWrapper({
  id,
  cfg,
  className = "",
  children,
}: {
  id?: string;
  cfg: BgConfig;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`relative overflow-hidden ${className}`}>
      <SectionBackground cfg={cfg} />
      <div className="relative">{children}</div>
    </section>
  );
}
