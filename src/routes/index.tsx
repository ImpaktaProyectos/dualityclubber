import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Instagram, MapPin, Music, ShoppingBag, ChevronDown } from "lucide-react";
import { getLandingData } from "@/lib/site.functions";
import { useFavorites } from "@/hooks/useFavorites";
import heroArt from "@/assets/duality-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DUALITY · AQUA OPEN AIR" },
      { name: "description", content: "Una noche. Dos energías. Un mismo destino. Vive DUALITY." },
      { property: "og:title", content: "DUALITY · AQUA OPEN AIR" },
      { property: "og:description", content: "Una noche. Dos energías. Un mismo destino." },
    ],
  }),
  loader: () => getLandingData(),
  component: Landing,
});

type Section = { section_key: string; is_enabled: boolean; display_mode: string };

function Landing() {
  const data = Route.useLoaderData();
  const s = data.settings;
  const isOn = (key: string) => {
    const sec = (data.sections as Section[]).find((x) => x.section_key === key);
    return sec?.is_enabled && sec?.display_mode === "visible";
  };
  const eventKey = s?.current_event_key ?? "default";
  const { favorites, toggle, clear, isFavorite } = useFavorites(eventKey);

  // Apply dynamic colors
  useEffect(() => {
    if (!s) return;
    const root = document.documentElement;
    if (s.primary_color) root.style.setProperty("--brand-blue", s.primary_color);
    if (s.secondary_color) root.style.setProperty("--brand-red", s.secondary_color);
  }, [s]);

  const navItems = [
    { key: "tickets", label: "Entradas", href: "#entradas" },
    { key: "artists", label: "Artistas", href: "#artistas" },
    { key: "schedule", label: "Horarios", href: "#horarios" },
    { key: "location", label: "Ubicación", href: "#ubicacion" },
    { key: "faq", label: "FAQ", href: "#faq" },
  ].filter((n) => isOn(n.key));

  return (
    <div className="min-h-screen text-foreground pb-24 md:pb-0">
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <a href="#top" className="text-display text-2xl font-black tracking-widest">
            DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY
          </a>
          <nav className="hidden md:flex gap-7 text-sm uppercase tracking-widest">
            {navItems.map((n) => (
              <a key={n.key} href={n.href} className="hover:text-[var(--brand-blue)] transition-colors">{n.label}</a>
            ))}
          </nav>
          {isOn("tickets") && (
            <a href="#entradas" className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--brand-blue)] text-black font-bold text-sm uppercase tracking-wider hover:scale-105 transition-transform glow-blue">
              Comprar entradas
            </a>
          )}
        </div>
      </header>

      {/* Mobile sticky buy */}
      {isOn("tickets") && (
        <a href="#entradas" className="md:hidden fixed bottom-4 inset-x-4 z-50 flex items-center justify-center gap-2 py-4 rounded-full bg-[var(--brand-blue)] text-black font-black uppercase tracking-wider glow-blue">
          <ShoppingBag className="w-5 h-5" /> Comprar entradas
        </a>
      )}

      {/* HERO */}
      {isOn("hero") && (
        <section id="top" className="relative min-h-[100svh] flex items-center overflow-hidden pt-16">
          <div className="absolute inset-0">
            <img src={s?.hero_image_desktop_url || heroArt} alt="DUALITY" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--dark-bg)]/40 to-[var(--dark-bg)]" />
            <div className="absolute inset-0 grain" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 w-full grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="text-xs uppercase tracking-[0.4em] text-[var(--brand-blue)] mb-4">{s?.event_subtitle}</div>
              <h1 className="text-display text-6xl md:text-8xl font-black leading-[0.9] mb-6">
                {s?.hero_title?.split(" ").map((w: string, i: number) => (
                  <span key={i} className="block">{w}</span>
                ))}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-2">{s?.event_date}</p>
              <p className="text-base text-white/60 mb-8">{s?.venue_name} · {s?.venue_location}</p>
              <div className="flex flex-wrap gap-3">
                <a href={s?.hero_cta_primary_url || "#entradas"} className="px-7 py-3 rounded-full bg-[var(--brand-blue)] text-black font-bold uppercase tracking-wider glow-blue hover:scale-105 transition-transform">
                  {s?.hero_cta_primary_text}
                </a>
                <a href={s?.hero_cta_secondary_url || "#artistas"} className="px-7 py-3 rounded-full border border-white/20 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] font-bold uppercase tracking-wider transition-colors">
                  {s?.hero_cta_secondary_text}
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="hidden md:block">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glow-blue">
                <img src={heroArt} alt="" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
          <ChevronDown className="absolute bottom-6 left-1/2 -translate-x-1/2 w-6 h-6 text-white/40 animate-bounce" />
        </section>
      )}

      {/* QUICK INFO */}
      {isOn("quick_info") && data.quickInfo.length > 0 && (
        <section className="border-y border-white/5 bg-[var(--dark-panel)]/60 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide">
            {data.quickInfo.map((q: any) => (
              <div key={q.id} className="shrink-0 px-4 py-2 rounded-full border border-white/10 text-xs md:text-sm uppercase tracking-widest font-bold text-white/90 whitespace-nowrap">
                {q.label}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COUNTDOWN */}
      {isOn("countdown") && s?.countdown_datetime && (
        <Countdown
          targetIso={s.countdown_datetime}
          title={s.countdown_title}
          subtext={s.countdown_subtext}
          ctaText={s.countdown_cta_text}
          ctaUrl={s.countdown_cta_url}
        />
      )}

      {/* TICKETS */}
      {isOn("tickets") && (
        <section id="entradas" className="py-20 md:py-28 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <SectionLabel>Entradas</SectionLabel>
            <h2 className="text-display text-4xl md:text-6xl font-black mb-3">{s?.ticket_title}</h2>
            <p className="text-white/70 mb-8">{s?.ticket_text}</p>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[var(--dark-panel)] glow-blue/30" style={{ minHeight: 780 }}>
              {s?.ticket_iframe_url ? (
                <iframe
                  src={s.ticket_iframe_url}
                  title="Compra de entradas DUALITY"
                  allow="payment *; fullscreen; clipboard-write; encrypted-media"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full"
                  style={{ minHeight: 780, border: 0 }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 min-h-[780px] gap-4">
                  <div className="text-sm uppercase tracking-widest text-[var(--brand-blue)]">Próximamente</div>
                  <p className="text-white/70 max-w-md">El módulo oficial de venta se publicará pronto. Configura la URL del iframe Fourvenues desde el panel admin.</p>
                </div>
              )}
            </div>
            {s?.ticket_show_fallback && s?.ticket_fallback_url && (
              <div className="mt-6 text-center">
                <a href={s.ticket_fallback_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-[var(--brand-blue)] font-bold uppercase tracking-wider">
                  Abrir venta oficial
                </a>
              </div>
            )}
            <p className="text-center mt-6 text-xs uppercase tracking-widest text-white/50">{s?.ticket_trust_text}</p>
          </div>
        </section>
      )}

      {/* ARTISTS */}
      {isOn("artists") && data.artists.length > 0 && (
        <section id="artistas" className="py-20 md:py-28 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <SectionLabel>Line Up</SectionLabel>
            <h2 className="text-display text-4xl md:text-6xl font-black mb-3">Artistas</h2>
            <p className="text-white/70 mb-10">Marca tus artistas favoritos y crea tu planning de la noche.</p>
            <div className="overflow-hidden mb-10 border-y border-white/5 py-4">
              <div className="flex gap-10 animate-[scroll_30s_linear_infinite] whitespace-nowrap text-display text-3xl md:text-5xl font-black text-white/30">
                {[...data.artists, ...data.artists].map((a: any, i: number) => (
                  <span key={i}>{a.name} <span className="text-[var(--brand-red)]">·</span></span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.artists.map((a: any) => (
                <div key={a.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[var(--dark-panel)] hover:border-[var(--brand-blue)] transition-colors">
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.name} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-display text-2xl md:text-3xl font-black text-white/80 p-4 text-center" style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--brand-blue) 30%, var(--dark-panel)), color-mix(in oklab, var(--brand-red) 25%, var(--dark-panel)))" }}>
                      {a.name}
                    </div>
                  )}
                  <button
                    onClick={() => toggle(a.id)}
                    aria-label="Favorito"
                    className="absolute top-3 right-3 w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(a.id) ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-white"}`} />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="text-xs uppercase tracking-widest text-[var(--brand-blue)] mb-1">{a.stage}</div>
                    <div className="text-display font-black text-lg leading-tight">{a.name}</div>
                    {a.performance_time && <div className="text-xs text-white/60 mt-1">{a.performance_time}h</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SCHEDULE */}
      {isOn("schedule") && (
        <Schedule
          schedule={data.schedule}
          artists={data.artists}
          favorites={favorites}
          clearFavorites={clear}
          isArtistsOn={isOn("artists")}
        />
      )}

      {/* LOCATION */}
      {isOn("location") && (
        <section id="ubicacion" className="py-20 md:py-28 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <SectionLabel>Ubicación</SectionLabel>
            <h2 className="text-display text-4xl md:text-6xl font-black mb-6">{s?.location_name}</h2>
            <div className="flex items-center gap-2 text-white/70 mb-8">
              <MapPin className="w-5 h-5 text-[var(--brand-red)]" />
              {s?.location_address}
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[var(--dark-panel)] mb-6">
              {s?.location_embed_url ? (
                <iframe src={s.location_embed_url} className="w-full h-full border-0" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40">Mapa próximamente</div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <InfoCard title="Parking">{s?.location_parking_text}</InfoCard>
              <InfoCard title="Acceso">{s?.location_access_text}</InfoCard>
            </div>
            {s?.location_maps_url && (
              <a href={s.location_maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--brand-blue)] text-black font-bold uppercase tracking-wider glow-blue">
                {s.location_button_text}
              </a>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {isOn("faq") && data.faqs.length > 0 && (
        <section id="faq" className="py-20 md:py-28 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-display text-4xl md:text-6xl font-black mb-10">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {data.faqs.map((f: any) => <FAQItem key={f.id} q={f.question} a={f.answer} />)}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      {isOn("final_cta") && (
        <section className="relative py-28 md:py-40 px-4 md:px-8 overflow-hidden">
          <img src={s?.final_cta_background_url || heroArt} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-bg)]/60 via-[var(--dark-bg)]/80 to-[var(--dark-bg)]" />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-display text-5xl md:text-8xl font-black mb-6 text-glow-blue">
              {s?.final_cta_title}
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-10">{s?.final_cta_text}</p>
            <a href={s?.final_cta_button_url || "#entradas"} className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-[var(--brand-red)] text-white font-black uppercase tracking-widest text-lg glow-red hover:scale-105 transition-transform">
              {s?.final_cta_button_text}
            </a>
          </div>
        </section>
      )}

      {/* FOOTER */}
      {isOn("footer") && (
        <footer className="border-t border-white/5 py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-center">
            <div className="text-display text-3xl font-black tracking-widest">
              DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY
            </div>
            <div className="flex gap-4 md:justify-center">
              {s?.footer_instagram_url && <a href={s.footer_instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"><Instagram className="w-5 h-5" /></a>}
              {s?.footer_tiktok_url && <a href={s.footer_tiktok_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"><Music className="w-5 h-5" /></a>}
            </div>
            <div className="text-xs text-white/40 md:text-right space-y-1">
              <div>{s?.footer_copyright}</div>
              <div className="flex gap-3 md:justify-end">
                <a href={s?.footer_legal_url}>Aviso legal</a>
                <a href={s?.footer_privacy_url}>Privacidad</a>
                <a href={s?.footer_cookies_url}>Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      )}
      <style>{`@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-[0.4em] text-[var(--brand-blue)] mb-3">{children}</div>;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-6">
      <div className="text-xs uppercase tracking-widest text-[var(--brand-red)] mb-2">{title}</div>
      <div className="text-white/80">{children}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--dark-panel)] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
        <span className="font-bold">{q}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-white/70">{a}</div>}
    </div>
  );
}

function Countdown({ targetIso, title, subtext, ctaText, ctaUrl }: { targetIso: string; title?: string; subtext?: string; ctaText?: string; ctaUrl?: string }) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  const cells = [["Días", d], ["Horas", h], ["Min", m], ["Seg", sec]] as const;
  return (
    <section className="py-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <SectionLabel>Cuenta atrás</SectionLabel>
        <h3 className="text-display text-2xl md:text-4xl font-black mb-8">{title}</h3>
        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
          {cells.map(([label, val]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-4 md:p-6">
              <div className="text-display text-3xl md:text-6xl font-black text-glow-blue">{String(val).padStart(2, "0")}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/50 mt-1">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-white/60 text-sm mb-6">{subtext}</p>
        {ctaText && ctaUrl && (
          <a href={ctaUrl} className="inline-flex px-6 py-3 rounded-full bg-[var(--brand-blue)] text-black font-bold uppercase tracking-wider glow-blue">{ctaText}</a>
        )}
      </div>
    </section>
  );
}

function Schedule({ schedule, artists, favorites, clearFavorites, isArtistsOn }: any) {
  const [tab, setTab] = useState<string>("all");
  const stages = useMemo(() => Array.from(new Set(schedule.map((x: any) => x.stage))) as string[], [schedule]);
  const tabs = [{ key: "all", label: "Todos" }, ...stages.map((st: string) => ({ key: st, label: st }))];
  if (isArtistsOn) tabs.push({ key: "planning", label: `Mi Planning · ${favorites.length}` });

  const favIds = new Set(favorites);
  const favArtistNames = new Set(artists.filter((a: any) => favIds.has(a.id)).map((a: any) => a.name));

  const items = useMemo(() => {
    if (tab === "all") return schedule;
    if (tab === "planning") {
      return schedule.filter((s: any) => favArtistNames.has(s.custom_artist_name));
    }
    return schedule.filter((s: any) => s.stage === tab);
  }, [tab, schedule, favArtistNames]);

  return (
    <section id="horarios" className="py-20 md:py-28 px-4 md:px-8 bg-[var(--dark-panel)]/40">
      <div className="max-w-5xl mx-auto">
        <SectionLabel>Programación</SectionLabel>
        <h2 className="text-display text-4xl md:text-6xl font-black mb-8">Horarios</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold border transition-colors ${tab === t.key ? "bg-[var(--brand-blue)] text-black border-transparent" : "border-white/10 text-white/70 hover:border-white/30"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "planning" && favorites.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
            <p className="text-white/60 max-w-md mx-auto mb-6">Todavía no has marcado artistas. Toca el corazón en tus artistas favoritos y crea tu planning de la noche.</p>
            <a href="#artistas" className="inline-flex px-6 py-3 rounded-full bg-[var(--brand-blue)] text-black font-bold uppercase tracking-wider">Ver artistas</a>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it: any) => (
              <div key={it.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-[var(--dark-bg)]">
                <div className="text-display text-xl md:text-2xl font-black text-[var(--brand-blue)] w-24 md:w-32 shrink-0">{it.start_time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-display font-bold truncate">{it.custom_artist_name}</div>
                  <div className="text-xs uppercase tracking-widest text-white/50">{it.stage}{it.end_time && ` · hasta ${it.end_time}`}</div>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-white/40 text-center py-8">Sin actuaciones en esta selección.</p>}
          </div>
        )}
        {tab === "planning" && favorites.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 justify-between items-center">
            <button onClick={clearFavorites} className="text-xs uppercase tracking-widest text-white/40 hover:text-[var(--brand-red)]">Borrar planning</button>
            <a href="#entradas" className="px-6 py-3 rounded-full bg-[var(--brand-red)] text-white font-bold uppercase tracking-wider glow-red">Comprar entrada</a>
          </div>
        )}
      </div>
    </section>
  );
}
