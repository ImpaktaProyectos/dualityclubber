import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Instagram, MapPin, Music, ShoppingBag, ChevronDown, Youtube, Facebook, Twitter, MessageCircle, Send, Headphones, FileDown, Bus, Clock, ExternalLink } from "lucide-react";
import { getLandingData } from "@/lib/site.functions";
import { useFavorites } from "@/hooks/useFavorites";
import { SectionBackground, resolveSectionBg } from "@/components/SectionBackground";
import { GalleryDisplay } from "@/components/GalleryDisplay";
import { ShopSection } from "@/components/ShopSection";

export const Route = createFileRoute("/")({
  head: ({ loaderData }) => {
    const s: any = (loaderData as any)?.settings;
    const heroImg = s?.hero_image_desktop_url || s?.hero_image_mobile_url;
    const flyer = s?.hero_flyer_enabled ? s?.hero_flyer_url : null;
    const links: any[] = [];
    if (heroImg) links.push({ rel: "preload", as: "image", href: heroImg, fetchpriority: "high" });
    if (flyer) links.push({ rel: "preload", as: "image", href: flyer, fetchpriority: "high" });
    return {
      meta: [
        { title: "DUALITY · AQUA OPEN AIR" },
        { name: "description", content: "Una noche. Dos energías. Un mismo destino. Vive DUALITY." },
        { property: "og:title", content: "DUALITY · AQUA OPEN AIR" },
        { property: "og:description", content: "Una noche. Dos energías. Un mismo destino." },
      ],
      links,
    };
  },
  loader: () => getLandingData(),
  component: Landing,
});


type Section = { section_key: string; is_enabled: boolean; display_mode: string };

function Landing() {
  const rawData = Route.useLoaderData();
  const stageNameById = useMemo(() => {
    const m: Record<string, string> = {};
    ((rawData as any).stages ?? []).forEach((st: any) => { m[st.id] = st.name; });
    return m;
  }, [rawData]);
  const data = useMemo(() => ({
    ...rawData,
    artists: (rawData.artists ?? []).map((a: any) => ({ ...a, stage: a.stage || (a.stage_id ? stageNameById[a.stage_id] : null) })),
    schedule: (rawData.schedule ?? []).map((it: any) => ({ ...it, stage: it.stage || (it.stage_id ? stageNameById[it.stage_id] : null) })),
  }), [rawData, stageNameById]);
  const s = data.settings;
  const isOn = (key: string) => {
    const sec = (data.sections as Section[]).find((x) => x.section_key === key);
    return sec?.is_enabled && sec?.display_mode === "visible";
  };
  const eventKey = s?.current_event_key ?? "default";
  const { toggle, clear, isFavorite, favorites } = useFavorites(eventKey);

  useEffect(() => {
    if (!s) return;
    const root = document.documentElement;
    if (s.primary_color) root.style.setProperty("--brand-blue", s.primary_color);
    if (s.secondary_color) root.style.setProperty("--brand-red", s.secondary_color);
    if (s.font_display) root.style.setProperty("--font-display", `"${s.font_display}", system-ui, sans-serif`);
    if (s.font_body) root.style.setProperty("--font-sans", `"${s.font_body}", system-ui, sans-serif`);
    if (s.font_button) root.style.setProperty("--font-button", `"${s.font_button}", system-ui, sans-serif`);
    // load google fonts dynamically
    const families = [s.font_display, s.font_body, s.font_button].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
    if (families.length) {
      const href = `https://fonts.googleapis.com/css2?${families.map((f: string) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900`).join("&")}&display=swap`;
      const id = "duality-dynamic-fonts";
      let link = document.getElementById(id) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
    }
  }, [s]);

  const atmosphere = (data as any).atmosphere ?? null;
  const sectionBgs = (data as any).sectionBackgrounds ?? [];
  const scrollMode: "continuous" | "per-section" = atmosphere?.background_scroll_mode ?? "continuous";
  const isOverridden = (key: string) => {
    const sec = sectionBgs.find((b: any) => b.section_key === key);
    return !!sec && !sec.use_global_background;
  };
  // In continuous mode, the global atmosphere is rendered once as a fixed layer behind the page,
  // and individual sections only paint their own background when they explicitly override the global.
  // In per-section mode, every section paints its own background and there is no fixed global layer.
  const bg = (key: string) => resolveSectionBg(key, atmosphere, sectionBgs);
  const sectionBg = (key: string) =>
    scrollMode === "continuous" && !isOverridden(key) ? null : bg(key);

  const navItems = [
    { key: "tickets", label: "Entradas", href: "#entradas" },
    { key: "artists", label: "Artistas", href: "#artistas" },
    { key: "schedule", label: "Horarios", href: "#horarios" },
    { key: "location", label: "Ubicación", href: "#ubicacion" },
    { key: "faq", label: "FAQ", href: "#faq" },
  ].filter((n) => isOn(n.key));

  // helper: favorite key for a schedule item (prefer artist_id linking)
  const favKeyForSchedule = (it: any) => it.artist_id ?? `sched:${it.id}`;

  return (
    <div className="relative min-h-screen text-foreground pb-24 md:pb-0">
      {/* GLOBAL ATMOSPHERE — only in continuous mode (fixed background across scroll) */}
      {atmosphere && scrollMode === "continuous" && (
        <div className="fixed inset-0 -z-10">
          <SectionBackground cfg={atmosphere} disableScrollBehavior />
        </div>
      )}
      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 h-16">
          <a href="#top" className="flex items-center gap-2">
            {(s?.brand_logo_main_url || s?.header_logo_url) ? (
              <img
                src={s.brand_logo_main_url || s.header_logo_url}
                alt={s?.event_name ?? "DUALITY"}
                style={{ height: `${s?.header_logo_height ?? 36}px` }}
                className="w-auto object-contain"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />

            ) : (
              <span className="text-display text-2xl font-black tracking-widest">
                DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY
              </span>
            )}
          </a>
          <nav className="hidden md:flex gap-7 text-sm uppercase tracking-widest items-center">
            {navItems.map((n) => (
              <a key={n.key} href={n.href} className="hover:text-[var(--brand-blue)] transition-colors">{n.label}</a>
            ))}
            {isOn("countdown") && s?.countdown_datetime && (
              <MiniCountdown targetIso={s.countdown_datetime} />
            )}
          </nav>
          {isOn("tickets") && (
            <a href="#entradas" className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--brand-blue)] text-black font-bold text-sm uppercase tracking-wider hover:scale-105 transition-transform glow-blue">
              Comprar entradas
            </a>
          )}
        </div>
      </header>

      {/* Mobile countdown ribbon */}
      {isOn("countdown") && s?.countdown_datetime && (
        <div className="md:hidden fixed top-16 inset-x-0 z-40 glass border-b border-white/5 flex items-center justify-center h-8">
          <MiniCountdown targetIso={s.countdown_datetime} />
        </div>
      )}

      {/* Mobile sticky buy */}
      {isOn("tickets") && (
        <a href="#entradas" className="md:hidden fixed bottom-4 inset-x-4 z-50 flex items-center justify-center gap-2 py-4 rounded-full bg-[var(--brand-blue)] text-black font-black uppercase tracking-wider glow-blue">
          <ShoppingBag className="w-5 h-5" /> Comprar entradas
        </a>
      )}

      {(() => {
        const renderers: Record<string, () => React.ReactNode> = {
          hero: () => isOn("hero") && <Hero s={s} bg={sectionBg("hero")} extraTopPadding={isOn("countdown") && !!s?.countdown_datetime} />,
          quick_info: () => isOn("quick_info") && data.quickInfo.length > 0 && (
            <section className="relative border-y border-white/5 overflow-hidden">
              <SectionBackground cfg={sectionBg("quick_info")} />
              <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-6 flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide">
                {data.quickInfo.map((q: any) => (
                  <div key={q.id} className="shrink-0 px-4 py-2 rounded-full border border-white/10 text-xs md:text-sm uppercase tracking-widest font-bold text-white/90 whitespace-nowrap">
                    {q.label}{q.value && <span className="text-white/50 normal-case font-normal ml-2">{q.value}</span>}
                  </div>
                ))}
              </div>
            </section>
          ),
          tickets: () => isOn("tickets") && <TicketsSection s={s} bg={sectionBg("tickets")} tiers={(data as any).ticketTiers ?? []} />,
          artists: () => isOn("artists") && data.artists.length > 0 && (
            <ArtistsSection artists={data.artists} isFavorite={isFavorite} toggle={toggle} bg={sectionBg("artists")} />
          ),
          schedule: () => isOn("schedule") && (
            <Schedule
              schedule={data.schedule}
              artists={data.artists}
              favorites={favorites}
              favKeyForSchedule={favKeyForSchedule}
              toggle={toggle}
              isFavorite={isFavorite}
              clearFavorites={clear}
              isArtistsOn={isOn("artists")}
              bg={sectionBg("schedule")}
            />
          ),
          location: () => isOn("location") && (
            <section id="ubicacion" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
              <SectionBackground cfg={sectionBg("location")} />
              <div className="relative max-w-5xl mx-auto">
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
          ),
          gallery: () => isOn("gallery") && data.gallery.length > 0 && (
            <section id="galeria" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
              <SectionBackground cfg={sectionBg("gallery")} />
              <div className="relative max-w-7xl mx-auto">
                <SectionLabel>Galería</SectionLabel>
                <h2 className="text-display text-4xl md:text-6xl font-black mb-10">Momentos DUALITY</h2>
                <GalleryDisplay items={data.gallery as any} layout={s?.gallery_layout} />
              </div>
            </section>
          ),
          shop: () => isOn("shop") && ((data as any).shopProducts ?? []).length > 0 && (
            <ShopSection s={s} products={(data as any).shopProducts} bg={sectionBg("shop")} />
          ),

          buses: () => isOn("buses") && (data.buses ?? []).length > 0 && (
            <section id="buses" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
              <SectionBackground cfg={sectionBg("buses")} />
              <div className="relative max-w-6xl mx-auto">
                <SectionLabel>Transporte</SectionLabel>
                <h2 className="text-display text-4xl md:text-6xl font-black mb-3">Buses oficiales</h2>
                <p className="text-white/60 mb-10 text-lg max-w-2xl">Llega y vuelve sin preocuparte por el coche.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.buses.map((b: any) => {
                    const soldOut = b.status === "sold_out";
                    return (
                      <article key={b.id} className="relative flex flex-col rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-6 transition-all hover:border-[var(--brand-blue)]/50 hover:shadow-[0_0_30px_rgba(0,174,239,0.12)]">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] flex items-center justify-center shrink-0">
                              <Bus className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-black text-xl leading-tight">{b.town}</h3>
                              {b.departure_point && <div className="text-xs text-white/50 mt-0.5">{b.departure_point}</div>}
                            </div>
                          </div>
                          {b.price && <span className="text-lg font-black text-[var(--brand-blue)] whitespace-nowrap">{b.price}</span>}
                        </div>
                        <div className="space-y-2 text-sm text-white/70 mb-5">
                          {b.departure_time && (
                            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-white/40" /><span className="text-white/50 w-16">Ida</span><span className="font-bold text-white">{b.departure_time}</span></div>
                          )}
                          {b.return_time && (
                            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-white/40" /><span className="text-white/50 w-16">Vuelta</span><span className="font-bold text-white">{b.return_time}</span></div>
                          )}
                        </div>
                        {soldOut ? (
                          <span className="mt-auto inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-white/5 text-white/40 font-bold text-xs uppercase tracking-widest">Agotado</span>
                        ) : b.booking_url ? (
                          <a href={b.booking_url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--brand-blue)] text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                            Reservar plaza <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="mt-auto inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest">Próximamente</span>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ),
          authorization: () => isOn("authorization") && s?.authorization_pdf_url && (
            <section id="autorizacion" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
              <SectionBackground cfg={sectionBg("authorization")} />
              <div className="relative max-w-3xl mx-auto text-center">
                <SectionLabel>Menores</SectionLabel>
                <h2 className="text-display text-4xl md:text-6xl font-black mb-4">{s?.authorization_title || "Autorización para menores"}</h2>
                {s?.authorization_description && <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">{s.authorization_description}</p>}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href={s.authorization_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/15 bg-white/5 text-white font-bold uppercase tracking-widest text-sm hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-colors">
                    <ExternalLink className="w-4 h-4" /> Descarga aquí tu autorización
                  </a>
                  <a href={s.authorization_pdf_url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[var(--brand-blue)] text-black font-black uppercase tracking-widest text-sm glow-blue hover:scale-105 transition-transform">
                    <FileDown className="w-4 h-4" /> {s?.authorization_button_text || "Descargar PDF"}
                  </a>
                </div>
              </div>
            </section>
          ),


          faq: () => isOn("faq") && data.faqs.length > 0 && (
            <section id="faq" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
              <SectionBackground cfg={sectionBg("faq")} />
              <div className="relative max-w-3xl mx-auto">
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="text-display text-4xl md:text-6xl font-black mb-10">Preguntas frecuentes</h2>
                <div className="space-y-3">
                  {data.faqs.map((f: any) => <FAQItem key={f.id} q={f.question} a={f.answer} />)}
                </div>
              </div>
            </section>
          ),
          final_cta: () => isOn("final_cta") && (
            <section className="relative py-28 md:py-40 px-4 md:px-8 overflow-hidden">
              <SectionBackground cfg={sectionBg("final_cta")} />
              {s?.final_cta_background_url && (
                <>
                  <img src={s.final_cta_background_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-bg)]/60 via-[var(--dark-bg)]/80 to-[var(--dark-bg)]" />
                </>
              )}
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
          ),
          footer: () => isOn("footer") && (
            <footer className="border-t border-white/5 py-12 px-4 md:px-8">
              <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 items-center">
                <div className="text-display text-3xl font-black tracking-widest">
                  {(s?.brand_logo_light_url || s?.brand_logo_main_url) ? (
                    <img
                      src={s.brand_logo_light_url || s.brand_logo_main_url}
                      alt={s?.event_name ?? "DUALITY"}
                      className="object-contain"
                      style={{ height: `${s?.header_logo_height ?? 48}px` }}
                    />
                  ) : (
                    <>DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY</>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 md:justify-center">
                  {[
                    { url: s?.footer_instagram_url, Icon: Instagram, label: "Instagram", color: "var(--brand-blue)" },
                    { url: s?.footer_tiktok_url, Icon: Music, label: "TikTok", color: "var(--brand-red)" },
                    { url: s?.footer_facebook_url, Icon: Facebook, label: "Facebook", color: "var(--brand-blue)" },
                    { url: s?.footer_youtube_url, Icon: Youtube, label: "YouTube", color: "var(--brand-red)" },
                    { url: s?.footer_twitter_url ?? s?.footer_x_url, Icon: Twitter, label: "Twitter / X", color: "var(--brand-blue)" },
                    { url: s?.footer_spotify_url, Icon: Music, label: "Spotify", color: "var(--brand-blue)" },
                    { url: s?.footer_soundcloud_url, Icon: Headphones, label: "SoundCloud", color: "var(--brand-red)" },
                    { url: s?.footer_whatsapp_url, Icon: MessageCircle, label: "WhatsApp", color: "var(--brand-blue)" },
                    { url: s?.footer_telegram_url, Icon: Send, label: "Telegram", color: "var(--brand-blue)" },
                  ]
                    .filter((x) => x.url)
                    .map(({ url, Icon, label, color }) => (
                      <a
                        key={label}
                        href={url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-colors hover:scale-110"
                        style={{ ["--hover" as any]: color }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
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
          ),
        };
        const ordered = [...(data.sections as any[])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return ordered.map((sec) => (
          <span key={sec.section_key} style={{ display: "contents" }}>{renderers[sec.section_key]?.()}</span>
        ));
      })()}
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

// ============== HERO ==============
function Hero({ s, bg, extraTopPadding }: { s: any; bg?: any; extraTopPadding?: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  const video = isMobile ? s?.hero_video_mobile_url || s?.hero_video_desktop_url : s?.hero_video_desktop_url;
  const image = isMobile ? s?.hero_image_mobile_url || s?.hero_image_desktop_url : s?.hero_image_desktop_url;

  return (
    <section id="top" className={`relative min-h-[100svh] flex items-center overflow-hidden ${extraTopPadding ? "pt-24" : "pt-16"}`}>
      {bg && <SectionBackground cfg={bg} />}
      <div className="absolute inset-0">
        {video ? (
          <video
            key={video}
            src={video}
            autoPlay
            muted
            loop
            playsInline
            poster={image || undefined}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        ) : image ? (
          <img src={image} alt="DUALITY" loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        ) : (
          <div className="absolute inset-0 bg-[var(--dark-bg)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--dark-bg)]/40 to-[var(--dark-bg)]" />
        <div className="absolute inset-0 grain" />
      </div>





      <div className="relative max-w-7xl mx-auto px-4 md:px-8 w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">
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
          {s?.hero_flyer_enabled && s?.hero_flyer_url && (
            <div className="md:hidden mt-10 flex justify-center">
              <img
                src={s.hero_flyer_url}
                alt={`Flyer ${s?.event_name ?? "DUALITY"}`} loading="eager" fetchPriority="high" decoding="async"
                className="rounded-xl border border-white/15 shadow-2xl max-w-[280px] w-full h-auto"
              />
            </div>
          )}
        </motion.div>
        {s?.hero_flyer_enabled && s?.hero_flyer_url && (
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="hidden md:flex justify-center"
          >
            <div className="relative max-w-md w-full">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[var(--brand-blue)]/40 via-transparent to-[var(--brand-red)]/40 blur-2xl opacity-70" />
              <img
                src={s.hero_flyer_url}
                alt={`Flyer ${s?.event_name ?? "DUALITY"}`} loading="eager" fetchPriority="high" decoding="async"
                className="relative rounded-2xl border border-white/15 shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        )}
      </div>
      <ChevronDown className="absolute bottom-6 left-1/2 -translate-x-1/2 w-6 h-6 text-white/40 animate-bounce" />
    </section>
  );
}

// ============== ARTISTS ==============
function ArtistsSection({ artists, isFavorite, toggle, bg }: { artists: any[]; isFavorite: (id: string) => boolean; toggle: (id: string) => void; bg?: any }) {
  const stages = useMemo(() => {
    const set = new Set<string>();
    artists.forEach((a) => a.stage && set.add(a.stage));
    return Array.from(set);
  }, [artists]);
  const [stage, setStage] = useState<string>("all");
  const filtered = stage === "all" ? artists : artists.filter((a) => a.stage === stage);
  const withImage = filtered.filter((a) => a.image_url);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((a) => {
      const k = a.stage || "Otros";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <section id="artistas" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
      {bg && <SectionBackground cfg={bg} />}
      <div className="relative max-w-7xl mx-auto">
        <SectionLabel>Line Up</SectionLabel>
        <h2 className="text-display text-4xl md:text-6xl font-black mb-3">Artistas</h2>
        <p className="text-white/70 mb-8">Marca tus artistas favoritos y crea tu planning de la noche.</p>

        {/* Stage filters */}
        {stages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 -mx-4 px-4 md:mx-0 md:px-0">
            <FilterChip active={stage === "all"} onClick={() => setStage("all")}>Todos</FilterChip>
            {stages.map((st) => (
              <FilterChip key={st} active={stage === st} onClick={() => setStage(st)}>{st}</FilterChip>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 text-white/60">
            No hay artistas visibles en este escenario todavía.
          </div>
        ) : (
          <>
            {/* Nombres por escenario (marquee + ver todos) */}
            <div className="mb-10 border-y border-white/5 py-5 space-y-5">
              {grouped.map(([st, list], gi) => (
                <StageMarquee key={st} stage={st} list={list} index={gi} />
              ))}
            </div>

            {/* Fotos */}
            {withImage.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {withImage.map((a: any) => (
                  <ArtistCard key={a.id} a={a} fav={isFavorite(a.id)} onFav={() => toggle(a.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function StageMarquee({ stage, list, index }: { stage: string; list: any[]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="text-[10px] uppercase tracking-widest text-[var(--brand-blue)]">{stage}</div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          {open ? "Ocultar" : `Ver todos (${list.length})`}
        </button>
      </div>
      {open ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-display text-xl md:text-3xl font-black text-white/70 uppercase py-2">
          {list.map((a: any) => (
            <span key={a.id} className="artist-name-hover">
              {a.name} <span className="text-[var(--brand-red)]">·</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden">
          <div
            className="flex gap-10 whitespace-nowrap text-display text-2xl md:text-4xl font-black text-white/40 uppercase"
            style={{ animation: `scroll ${40 + index * 5}s linear infinite`, animationDirection: index % 2 ? "reverse" : "normal", width: "max-content" }}
          >
            {[...list, ...list].map((a: any, i: number) => (
              <span key={i} className="artist-name-hover cursor-default">
                {a.name} <span className="text-[var(--brand-red)]">·</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold border transition-all ${
        active
          ? "bg-[var(--brand-blue)] text-black border-transparent glow-blue"
          : "border-white/10 text-white/70 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

function ArtistCard({ a, fav, onFav }: { a: any; fav: boolean; onFav: () => void }) {
  return (
    <div className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-[var(--dark-panel)] hover:border-[var(--brand-blue)] transition-all hover:glow-blue">
      {a.image_url ? (
        <img src={a.image_url} alt={a.name} className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-display text-2xl md:text-3xl font-black p-4 text-center artist-name-hover"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--brand-blue) 30%, var(--dark-panel)) 0%, var(--dark-panel) 55%, color-mix(in oklab, var(--brand-red) 28%, var(--dark-panel)) 100%)",
          }}
        >
          <span className="relative z-10">{a.name}</span>
        </div>
      )}
      <button
        onClick={onFav}
        aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        className="absolute top-3 right-3 w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Heart className={`w-5 h-5 ${fav ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-white"}`} />
      </button>
      {a.image_url && (
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          {a.stage && <div className="text-xs uppercase tracking-widest text-[var(--brand-blue)] mb-1">{a.stage}</div>}
          <div className="text-display font-black text-lg leading-tight artist-name-hover">{a.name}</div>
          {a.performance_time && <div className="text-xs text-white/60 mt-1">{a.performance_time}</div>}
        </div>
      )}
      {!a.image_url && (
        <div className="absolute bottom-0 inset-x-0 p-3 text-center bg-gradient-to-t from-black/80 to-transparent">
          {a.stage && <div className="text-[10px] uppercase tracking-widest text-[var(--brand-blue)]">{a.stage}</div>}
          {a.performance_time && <div className="text-xs text-white/60 mt-1">{a.performance_time}</div>}
        </div>
      )}
    </div>
  );
}

// ============== MINI COUNTDOWN (header ribbon) ==============
function MiniCountdown({ targetIso }: { targetIso: string }) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = now === null ? 0 : Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  const items = now === null
    ? [
        { label: "D", val: "--" },
        { label: "H", val: "--" },
        { label: "M", val: "--" },
        { label: "S", val: "--" },
      ]
    : [
        { label: "D", val: String(d).padStart(2, "0") },
        { label: "H", val: String(h).padStart(2, "0") },
        { label: "M", val: String(m).padStart(2, "0") },
        { label: "S", val: String(sec).padStart(2, "0") },
      ];

  return (
    <div className="flex items-center gap-1 text-[10px] md:text-xs uppercase tracking-widest">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-baseline gap-0.5">
          <span className="font-black text-[var(--brand-blue)] tabular-nums">{it.val}</span>
          <span className="text-white/40">{it.label}</span>
          {i < items.length - 1 && <span className="text-white/20 mx-0.5">|</span>}
        </span>
      ))}
    </div>
  );
}

// ============== TICKETS ==============


function TicketsSection({ s, bg, tiers }: { s: any; bg?: any; tiers?: any[] }) {
  const mode: string = s?.ticket_mode ?? "visual_tiers";
  const fallback = s?.ticket_fallback_url as string | undefined;
  const isVisual = mode !== "external";

  return (
    <section id="entradas" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
      <SectionBackground cfg={bg} />
      <div className="relative max-w-6xl mx-auto">
        <SectionLabel>Entradas</SectionLabel>
        <h2 className="text-display text-4xl md:text-6xl font-black mb-3">{s?.ticket_title ?? "Compra tus entradas"}</h2>
        <p className="text-white/70 mb-6">{s?.ticket_text ?? "Elige tu tramo y accede a la venta oficial."}</p>

        {s?.ticket_alert_enabled && s?.ticket_alert_text && (
          <TicketAlert text={s.ticket_alert_text} type={s.ticket_alert_type} url={s.ticket_alert_url} />
        )}

        {s?.tier_countdown_enabled && s?.tier_countdown_datetime && (
          <TierCountdown datetime={s.tier_countdown_datetime} text={s.tier_countdown_text} />
        )}

        {isVisual && (
          <VisualTicketTiers
            tiers={tiers ?? []}
            globalUrl={s?.ticket_global_url}
            useGlobal={!!s?.use_global_ticket_url}
          />
        )}

        {mode === "external" && fallback && (
          <div className="rounded-2xl border border-[var(--brand-blue)]/30 bg-[var(--dark-panel)] p-8 md:p-12 text-center space-y-5 glow-blue">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--brand-blue)]">Venta oficial</div>
            <p className="text-white/80 max-w-md mx-auto">
              La compra se completará en la plataforma oficial de venta. Pulsa el botón para abrirla en una pestaña nueva.
            </p>
            <a
              href={fallback}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--brand-blue)] text-black font-black uppercase tracking-widest glow-blue hover:scale-105 transition-transform"
            >
              Comprar entrada
            </a>
          </div>
        )}

        {isVisual && fallback && (
          <div className="mt-6 text-center">
            <a
              href={fallback}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-[var(--brand-blue)] font-bold uppercase tracking-wider text-sm"
            >
              Abrir venta oficial en nueva pestaña
            </a>
          </div>
        )}

        {s?.ticket_trust_text && (
          <p className="text-center mt-8 text-xs uppercase tracking-widest text-white/50">
            {s.ticket_trust_text}
          </p>
        )}
        <p className="text-center mt-2 text-[11px] text-white/40">
          La compra se completará en la plataforma oficial de venta.
        </p>
      </div>
    </section>
  );
}


function TicketAlert({ text, type, url }: { text: string; type?: string; url?: string }) {
  const color =
    type === "urgency" || type === "last_tickets"
      ? "border-[var(--brand-red)]/50 bg-[var(--brand-red)]/10 text-[var(--brand-red)]"
      : type === "price_change"
      ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
      : "border-[var(--brand-blue)]/40 bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]";
  const inner = (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${color}`}>
      <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
      <span className="flex-1">{text}</span>
      {url && <span className="text-xs uppercase tracking-widest opacity-80">Ver más →</span>}
    </div>
  );
  return (
    <div className="mb-5">
      {url ? <a href={url} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}
    </div>
  );
}

function TierCountdown({ datetime, text }: { datetime: string; text?: string }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(datetime).getTime();
  const diff = Math.max(0, target - now);
  if (!target || diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-widest text-white/70">
      <span className="opacity-70">{text ?? "Cambio de precio en"}:</span>
      <span className="font-black text-[var(--brand-blue)] tabular-nums">{d}d</span>
      <span className="font-black text-[var(--brand-blue)] tabular-nums">{String(h).padStart(2, "0")}h</span>
      <span className="font-black text-[var(--brand-blue)] tabular-nums">{String(m).padStart(2, "0")}m</span>
      <span className="font-black text-[var(--brand-blue)] tabular-nums">{String(s).padStart(2, "0")}s</span>
    </div>
  );
}

const TIER_STATUS_LABEL: Record<string, string> = {
  available: "Disponible",
  last_tickets: "Últimas entradas",
  sold_out: "Agotado",
  coming_soon: "Próximamente",
};

function VisualTicketTiers({ tiers, globalUrl, useGlobal }: { tiers: any[]; globalUrl?: string; useGlobal: boolean }) {
  const visible = (tiers ?? []).filter((t) => t.is_visible !== false && t.status !== "hidden");

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-10 text-center text-white/60">
        No hay entradas disponibles en este momento.
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {visible.map((t) => {
        const status = t.status ?? "available";
        const isFeatured = !!t.is_featured;
        const isSoldOut = status === "sold_out";
        const isComingSoon = status === "coming_soon";
        const isLast = status === "last_tickets";
        const isActive = status === "available" || status === "last_tickets";
        const link = (useGlobal && globalUrl) ? globalUrl : t.purchase_url;
        const currency = t.currency || "€";
        const buttonText = isSoldOut ? "Agotado" : isComingSoon ? "Próximamente" : (t.button_text || "Comprar entrada");
        const badge = t.badge_text || (isLast ? "Últimas entradas" : isFeatured ? "Más vendida" : isSoldOut ? "Agotado" : isComingSoon ? "Próximamente" : null);

        return (
          <div
            key={t.id}
            className={`relative rounded-2xl border bg-[var(--dark-panel)] p-6 flex flex-col transition-transform ${
              isFeatured ? "border-[var(--brand-blue)] shadow-[0_0_30px_var(--blue-glow)] md:scale-[1.03]" : "border-white/10"
            } ${isSoldOut ? "opacity-60" : ""}`}
          >
            {badge && (
              <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black ${
                isLast || isSoldOut
                  ? "bg-[var(--brand-red)] text-white"
                  : isComingSoon
                  ? "bg-white/10 text-white/70 border border-white/20"
                  : "bg-[var(--brand-blue)] text-black"
              } ${isLast ? "animate-pulse" : ""}`}>
                {badge}
              </div>
            )}

            <div className="text-xs uppercase tracking-widest text-white/50">{TIER_STATUS_LABEL[status] ?? status}</div>
            <h3 className="text-display text-2xl md:text-3xl font-black mt-1 mb-2">{t.name}</h3>
            {t.description && <p className="text-sm text-white/60 mb-4">{t.description}</p>}

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-display text-4xl md:text-5xl font-black text-[var(--brand-blue)] tabular-nums">
                {t.price ?? "—"}<span className="text-2xl ml-1">{currency}</span>
              </span>
              {t.previous_price && (
                <span className="text-white/40 line-through text-lg">{t.previous_price}{currency}</span>
              )}
            </div>

            <div className="mt-auto">
              {isActive && link ? (
                <a
                  href={link}
                  target={t.open_in_new_tab === false ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className={`block text-center w-full px-5 py-3 rounded-full font-black uppercase tracking-widest text-sm transition-transform hover:scale-105 ${
                    isFeatured || isLast
                      ? "bg-[var(--brand-blue)] text-black glow-blue"
                      : "bg-white text-black"
                  }`}
                >
                  {buttonText}
                </a>
              ) : (
                <button
                  disabled
                  className="block w-full px-5 py-3 rounded-full font-black uppercase tracking-widest text-sm bg-white/5 text-white/40 border border-white/10 cursor-not-allowed"
                >
                  {buttonText}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ============== SCHEDULE ==============
function Schedule({
  schedule, artists, favorites, favKeyForSchedule, toggle, isFavorite, clearFavorites, isArtistsOn,
}: any) {
  const [tab, setTab] = useState<string>("all");
  const stages = useMemo(() => Array.from(new Set(schedule.map((x: any) => x.stage).filter(Boolean))) as string[], [schedule]);
  const artistById = useMemo(() => Object.fromEntries(artists.map((a: any) => [a.id, a])), [artists]);
  const displayName = (it: any) => it.custom_artist_name || artistById[it.artist_id]?.name || "TBA";

  // Items that belong to "Mi Planning": any schedule entry whose fav key OR linked artist id is in favorites
  const planningItems = useMemo(
    () => schedule.filter((it: any) => isFavorite(favKeyForSchedule(it)) || (it.artist_id && isFavorite(it.artist_id))),
    [schedule, favorites],
  );
  // Favorite artists that have NO matching schedule entry
  const favArtistsNoSchedule = useMemo(() => {
    const scheduledArtistIds = new Set(schedule.map((it: any) => it.artist_id).filter(Boolean));
    return artists.filter((a: any) => isFavorite(a.id) && !scheduledArtistIds.has(a.id));
  }, [artists, schedule, favorites]);

  const planningCount = planningItems.length + favArtistsNoSchedule.length;

  const tabs = [{ key: "all", label: "Todos" }, ...stages.map((st: string) => ({ key: st, label: st }))];
  if (isArtistsOn) tabs.push({ key: "planning", label: `Mi Planning · ${planningCount}` });

  const items = useMemo(() => {
    if (tab === "all") return schedule;
    if (tab === "planning") return planningItems;
    return schedule.filter((s: any) => s.stage === tab);
  }, [tab, schedule, planningItems]);

  return (
    <section id="horarios" className="py-20 md:py-28 px-4 md:px-8 bg-[var(--dark-panel)]/40">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>Programación</SectionLabel>
        <h2 className="text-display text-4xl md:text-6xl font-black mb-8">Horarios</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <FilterChip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</FilterChip>
          ))}
        </div>

        {tab === "planning" ? (
          planningCount === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/60 max-w-md mx-auto mb-6">
                Todavía no has marcado artistas. Toca el corazón en tus artistas favoritos y crea tu planning de la noche.
              </p>
              <a href="#artistas" className="inline-flex px-6 py-3 rounded-full bg-[var(--brand-blue)] text-black font-bold uppercase tracking-wider">Ver artistas</a>
            </div>
          ) : (
            <>
              <PlanningGrid
                items={planningItems}
                stages={stages}
                displayName={displayName}
                favKeyForSchedule={favKeyForSchedule}
                toggle={toggle}
              />
              {favArtistsNoSchedule.length > 0 && (
                <div className="mt-10">
                  <div className="text-xs uppercase tracking-[0.3em] text-[var(--brand-red)] mb-4">Favoritos sin horario confirmado</div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favArtistsNoSchedule.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-[var(--dark-bg)]">
                        <div className="flex-1 min-w-0">
                          <div className="text-display font-bold truncate artist-name-hover">{a.name}</div>
                          <div className="text-xs uppercase tracking-widest text-white/50">
                            {a.stage || "—"} · Horario por confirmar
                          </div>
                        </div>
                        <button
                          onClick={() => toggle(a.id)}
                          aria-label="Quitar de Mi Planning"
                          className="w-10 h-10 rounded-full glass flex items-center justify-center shrink-0 hover:scale-110 transition-transform"
                        >
                          <Heart className="w-5 h-5 fill-[var(--brand-red)] text-[var(--brand-red)]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-10 rounded-2xl border border-[var(--brand-blue)]/30 bg-[var(--dark-panel)]/60 p-6 md:p-8 text-center">
                <p className="text-white/80 mb-5">Ya tienes tu noche preparada. Ahora asegura tu entrada.</p>
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  <a href="#entradas" className="px-6 py-3 rounded-full bg-[var(--brand-red)] text-white font-bold uppercase tracking-wider glow-red hover:scale-105 transition-transform">Comprar entrada</a>
                  <button onClick={clearFavorites} className="px-5 py-3 text-xs uppercase tracking-widest text-white/50 hover:text-[var(--brand-red)]">Borrar planning</button>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="space-y-2">
            {items.map((it: any) => {
              const key = favKeyForSchedule(it);
              const fav = isFavorite(key) || (it.artist_id && isFavorite(it.artist_id));
              return (
                <div key={it.id} className="flex items-center gap-3 md:gap-4 p-4 rounded-xl border border-white/10 bg-[var(--dark-bg)] hover:border-[var(--brand-blue)]/40 transition-colors">
                  <div className="text-display text-xl md:text-2xl font-black text-[var(--brand-blue)] w-20 md:w-32 shrink-0 tabular-nums">{it.start_time || "--:--"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-display font-bold truncate artist-name-hover">{displayName(it)}</div>
                    <div className="text-xs uppercase tracking-widest text-white/50">{it.stage}{it.end_time && ` · hasta ${it.end_time}`}</div>
                  </div>
                  <button
                    onClick={() => toggle(it.artist_id ?? key)}
                    aria-label={fav ? "Quitar de Mi Planning" : "Añadir a Mi Planning"}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center shrink-0 hover:scale-110 transition-transform"
                  >
                    <Heart className={`w-5 h-5 ${fav ? "fill-[var(--brand-red)] text-[var(--brand-red)]" : "text-white/70"}`} />
                  </button>
                </div>
              );
            })}
            {items.length === 0 && <p className="text-white/40 text-center py-8">Sin actuaciones en esta selección.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

// ============== PLANNING GRID ==============
function PlanningGrid({
  items, stages, displayName, favKeyForSchedule, toggle,
}: {
  items: any[];
  stages: string[];
  displayName: (it: any) => string;
  favKeyForSchedule: (it: any) => string;
  toggle: (id: string) => void;
}) {
  // Stages used: prefer the order from `stages`, but only those that have favorites
  const usedStages = useMemo(() => {
    const present = new Set(items.map((it) => it.stage).filter(Boolean));
    const ordered = stages.filter((s) => present.has(s));
    // include any stage that wasn't in the canonical list but appears in items
    items.forEach((it) => { if (it.stage && !ordered.includes(it.stage)) ordered.push(it.stage); });
    return ordered;
  }, [items, stages]);

  // Time slots from start_time of favorited items, sorted
  const slots = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => { if (it.start_time) set.add(it.start_time); });
    return Array.from(set).sort((a, b) => timeOrder(a) - timeOrder(b));
  }, [items]);

  const cellMap = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    slots.forEach((t) => { map[t] = {}; usedStages.forEach((s) => { map[t][s] = []; }); });
    items.forEach((it) => {
      if (!it.start_time || !it.stage) return;
      if (!map[it.start_time]) return;
      if (!map[it.start_time][it.stage]) map[it.start_time][it.stage] = [];
      map[it.start_time][it.stage].push(it);
    });
    return map;
  }, [items, slots, usedStages]);

  if (slots.length === 0 || usedStages.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--dark-bg)]/60 overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `90px repeat(${usedStages.length}, minmax(180px, 1fr))` }}
        >
          {/* Header */}
          <div className="sticky left-0 z-10 bg-[var(--dark-panel)] border-b border-r border-white/10 p-3 text-[10px] uppercase tracking-[0.3em] text-white/40">Hora</div>
          {usedStages.map((st) => (
            <div key={st} className="border-b border-white/10 p-3 text-xs uppercase tracking-[0.3em] font-bold text-[var(--brand-blue)] text-center">
              {st}
            </div>
          ))}
          {/* Rows */}
          {slots.map((time) => (
            <div key={time} className="contents">
              <div className="sticky left-0 z-10 bg-[var(--dark-panel)] border-b border-r border-white/10 p-3 text-display text-lg md:text-xl font-black text-[var(--brand-blue)] tabular-nums flex items-start">
                {time}
              </div>
              {usedStages.map((st) => {
                const entries = cellMap[time]?.[st] ?? [];
                return (
                  <div key={st} className="border-b border-white/5 p-2 min-h-[80px]">
                    {entries.length === 0 ? (
                      <div className="text-white/15 text-xs text-center pt-3">—</div>
                    ) : (
                      <div className="space-y-2">
                        {entries.map((it) => (
                          <div key={it.id} className="rounded-lg border border-[var(--brand-blue)]/30 bg-[var(--dark-panel)] p-2.5 hover:border-[var(--brand-blue)] hover:glow-blue transition-all">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-black artist-name-hover leading-tight truncate">{displayName(it)}</div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{it.stage}</div>
                                <div className="text-[11px] text-white/70 mt-1 tabular-nums">
                                  {it.start_time}{it.end_time ? ` – ${it.end_time}` : ""}
                                </div>
                              </div>
                              <button
                                onClick={() => toggle(it.artist_id ?? favKeyForSchedule(it))}
                                aria-label="Quitar de Mi Planning"
                                className="w-7 h-7 rounded-full glass flex items-center justify-center shrink-0 hover:scale-110 transition-transform"
                              >
                                <Heart className="w-3.5 h-3.5 fill-[var(--brand-red)] text-[var(--brand-red)]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Order times so that early-morning hours (00–07) come after late-night hours (>=18)
function timeOrder(t: string): number {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (isNaN(h)) return 0;
  const adjusted = h < 8 ? h + 24 : h;
  return adjusted * 60 + (isNaN(m) ? 0 : m);
}

