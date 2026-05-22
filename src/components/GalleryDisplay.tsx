import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Item = { id: string; media_url: string; media_type?: string; thumbnail_url?: string | null; title?: string | null };

function Media({ g, className }: { g: Item; className?: string }) {
  if (g.media_type === "video") {
    return <video src={g.media_url} poster={g.thumbnail_url || undefined} className={className} muted loop playsInline autoPlay />;
  }
  return <img src={g.media_url} alt={g.title || "Galería"} className={className} loading="lazy" />;
}

export function GalleryDisplay({ items, layout }: { items: Item[]; layout?: string }) {
  const mode = layout || "grid";

  if (mode === "carousel_auto") {
    const loop = [...items, ...items];
    return (
      <div className="relative overflow-hidden group" style={{ maskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)" }}>
        <div className="flex gap-4 animate-[gallery-scroll_40s_linear_infinite] group-hover:[animation-play-state:paused]" style={{ width: "max-content" }}>
          {loop.map((g, i) => (
            <div key={`${g.id}-${i}`} className="relative w-64 h-64 md:w-80 md:h-80 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-[var(--dark-panel)]">
              <Media g={g} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <style>{`@keyframes gallery-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>
    );
  }

  if (mode === "carousel_manual") {
    return <ManualCarousel items={items} />;
  }

  if (mode === "mosaic") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px] gap-3 md:gap-4">
        {items.map((g, i) => {
          const big = i % 6 === 0;
          const tall = i % 5 === 2;
          const wide = i % 5 === 4;
          const cls = big ? "col-span-2 row-span-2" : tall ? "row-span-2" : wide ? "col-span-2" : "";
          return (
            <div key={g.id} className={`relative rounded-xl overflow-hidden border border-white/10 bg-[var(--dark-panel)] group ${cls}`}>
              <Media g={g} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          );
        })}
      </div>
    );
  }

  // grid (default)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((g) => (
        <div key={g.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[var(--dark-panel)] group">
          <Media g={g} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      ))}
    </div>
  );
}

function ManualCarousel({ items }: { items: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const scrollTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    setIdx(clamped);
    const child = el.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      setIdx(Math.round(el.scrollLeft / (w * 0.8)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4" style={{ scrollbarWidth: "none" }}>
        {items.map((g) => (
          <div key={g.id} className="relative shrink-0 snap-center w-[85%] md:w-[60%] lg:w-[50%] aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[var(--dark-panel)]">
            <Media g={g} className="w-full h-full object-cover" />
            {g.title && <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm">{g.title}</div>}
          </div>
        ))}
      </div>
      <button onClick={() => scrollTo(idx - 1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur border border-white/15 flex items-center justify-center text-white">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => scrollTo(idx + 1)} aria-label="Siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur border border-white/15 flex items-center justify-center text-white">
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="flex justify-center gap-1.5 mt-2">
        {items.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} aria-label={`Ir a ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}
