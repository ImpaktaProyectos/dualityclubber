import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type ScrollBehavior =
  | "normal"
  | "fixed"
  | "parallax"
  | "reveal"
  | "zoom-pan"
  | "sticky-section";

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
  // Scroll behavior (Fase 7)
  background_scroll_behavior?: string | null;
  background_scroll_intensity?: number | null;
};

/** Merge per-section config with global config. Section overrides only when use_global_background=false */
export function resolveSectionBg(
  sectionKey: string,
  global: BgConfig | null | undefined,
  sectionBgs: (BgConfig & { section_key: string; use_global_background: boolean })[] | undefined,
): BgConfig {
  const sec = sectionBgs?.find((s) => s.section_key === sectionKey);
  if (!sec || sec.use_global_background) return global ?? {};
  return { ...(global ?? {}), ...stripNulls(sec) };
}

function stripNulls<T extends Record<string, any>>(o: T): Partial<T> {
  const out: any = {};
  for (const k in o) if (o[k] !== null && o[k] !== undefined) out[k] = o[k];
  return out;
}

const speedMap: Record<string, string> = { slow: "30s", medium: "18s", fast: "9s" };
const glowAlpha: Record<string, number> = { off: 0, low: 0.15, medium: 0.35, high: 0.6 };

export function SectionBackground({
  cfg,
  className = "",
  /** When true, behaviors like "fixed"/"parallax"/"reveal"/"zoom-pan" are ignored. Useful when caller already wraps in a fixed layer (continuous mode). */
  disableScrollBehavior = false,
}: {
  cfg: BgConfig | null | undefined;
  className?: string;
  disableScrollBehavior?: boolean;
}) {
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

  const behavior: ScrollBehavior = disableScrollBehavior
    ? "normal"
    : ((cfg.background_scroll_behavior as ScrollBehavior) ?? "normal");
  const intensity = Math.max(0, Math.min(100, cfg.background_scroll_intensity ?? 30));

  const hasMedia = (type === "image" && cfg.background_image_url) || (type === "video" && cfg.background_video_url);
  const autoOverlay = hasMedia ? Math.max(overlayOp, readability === "high" ? 0.7 : readability === "medium" ? 0.55 : 0.35) : overlayOp;

  const baseStyle = useMemo(() => {
    if (type === "gradient") return { background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` };
    return { background: c1 };
  }, [type, c1, c2]);

  // Parallax (translateY on media layer based on container offset)
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (behavior !== "parallax" || !hasMedia) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const factor = intensity / 100; // 0..1
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapperRef.current;
        const m = mediaRef.current;
        if (!el || !m) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // progress: -1 (below) .. 1 (above)
        const center = rect.top + rect.height / 2 - vh / 2;
        const offset = Math.max(-300, Math.min(300, center * 0.25 * factor * -1));
        m.style.transform = `translate3d(0, ${offset}px, 0) scale(1.1)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [behavior, hasMedia, intensity]);

  // Reveal (IntersectionObserver)
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (behavior !== "reveal" || !hasMedia) return;
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setRevealed(true)),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [behavior, hasMedia]);

  // Wrapper positioning depends on behavior
  // - sticky-section: render media inside a sticky h-screen child so it stays as the section scrolls
  // - everything else: classic absolute fill
  const wrapperClass =
    behavior === "sticky-section"
      ? `pointer-events-none absolute inset-0 ${className}`
      : `pointer-events-none absolute inset-0 overflow-hidden ${className}`;

  // Media layer classes/styles depending on behavior
  const mediaExtraClass =
    behavior === "zoom-pan" ? "bg-zoompan" :
    behavior === "parallax" ? "bg-parallax-layer" :
    behavior === "reveal" ? `bg-reveal ${revealed ? "is-visible" : ""}` :
    "";
  const useFixedAttachment = behavior === "fixed" && type === "image" && !!cfg.background_image_url;

  const mediaFilter = `blur(${blur}px) saturate(${sat}%) contrast(${con}%)`;

  // Inner content that holds media + textures + motion + glow + overlay
  const inner = (
    <>
      {/* Base */}
      <div className="absolute inset-0" style={baseStyle} />

      {/* Media layer */}
      {type === "image" && cfg.background_image_url && (
        useFixedAttachment ? (
          <div
            className={`absolute inset-0 bg-fixed-attachment ${mediaExtraClass}`}
            style={{
              backgroundImage: `url("${cfg.background_image_url}")`,
              opacity: imgOp,
              filter: mediaFilter,
              ["--reveal-target-opacity" as any]: imgOp,
            }}
          />
        ) : (
          <div
            ref={mediaRef}
            className={`absolute inset-0 ${mediaExtraClass}`}
            style={{
              backgroundImage: `url("${cfg.background_image_url}")`,
              backgroundSize: (cfg.background_size as any) || "cover",
              backgroundPosition: cfg.background_position || "center",
              backgroundRepeat: cfg.background_repeat ? "repeat" : "no-repeat",
              opacity: imgOp,
              filter: mediaFilter,
              ["--reveal-target-opacity" as any]: imgOp,
            }}
          />
        )
      )}
      {type === "video" && cfg.background_video_url && (
        <video
          key={cfg.background_video_url}
          src={cfg.background_video_url}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${mediaExtraClass}`}
          style={{
            opacity: imgOp,
            filter: mediaFilter,
            ["--reveal-target-opacity" as any]: imgOp,
          }}
        />
      )}

      {tex !== "none" && <TextureLayer kind={tex} opacity={texOp} c1={c1} c2={c2} />}
      {motion !== "none" && <MotionLayer kind={motion} speed={speed} c1={c1} c2={c2} />}

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

      {autoOverlay > 0 && (
        <div className="absolute inset-0" style={{ background: overlayColor, opacity: autoOverlay }} />
      )}
    </>
  );

  if (behavior === "sticky-section") {
    return (
      <div ref={wrapperRef} className={wrapperClass} aria-hidden>
        <div className="sticky top-0 h-screen w-full overflow-hidden">{inner}</div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={wrapperClass} aria-hidden>
      {inner}
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
