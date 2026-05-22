import { MessageCircle, ShoppingBag } from "lucide-react";
import { SectionBackground } from "@/components/SectionBackground";

export function ShopSection({ s, products, bg }: { s: any; products: any[]; bg?: any }) {
  const phone = (s?.shop_whatsapp_phone || "").replace(/[^\d+]/g, "");
  const defaultMsg = s?.shop_cta_message || "Hola! Quiero pedir información sobre este producto:";
  const buildHref = (p: any) => {
    const msg = p.whatsapp_message?.trim() || `${defaultMsg} ${p.name}${p.price ? ` (${p.price})` : ""}`;
    if (phone) return `https://wa.me/${phone.replace(/^\+/, "")}?text=${encodeURIComponent(msg)}`;
    return s?.shop_fallback_url || `mailto:${s?.footer_email || ""}?subject=${encodeURIComponent(p.name)}&body=${encodeURIComponent(msg)}`;
  };
  const buttonLabel = (p: any) => phone ? (p.button_text || "Pedir por WhatsApp") : (s?.shop_fallback_text || "Contáctanos");

  return (
    <section id="tienda" className="relative py-20 md:py-28 px-4 md:px-8 overflow-hidden">
      <SectionBackground cfg={bg} />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-xs uppercase tracking-[0.4em] text-[var(--brand-blue)] mb-3">Tienda</div>
        <h2 className="text-display text-4xl md:text-6xl font-black mb-3">{s?.shop_title || "Tienda oficial"}</h2>
        {s?.shop_subtitle && <p className="text-white/60 mb-10 text-lg max-w-2xl">{s.shop_subtitle}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p: any) => (
            <article key={p.id} className="group relative flex flex-col rounded-2xl border border-white/10 bg-[var(--dark-panel)] overflow-hidden transition-all hover:border-[var(--brand-blue)]/50 hover:shadow-[0_0_40px_rgba(0,174,239,0.15)]">
              <div className="relative aspect-square bg-black/40 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                {p.is_featured && (
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-[var(--brand-red)] text-white shadow-lg">
                    Destacado
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-black text-lg tracking-wide mb-1">{p.name}</h3>
                {p.description && <p className="text-sm text-white/60 mb-4 flex-1">{p.description}</p>}
                <div className="flex items-center justify-between gap-3 mt-auto pt-3">
                  {p.price && <span className="text-2xl font-black text-[var(--brand-blue)]">{p.price}</span>}
                  <a
                    href={buildHref(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--brand-blue)] text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    {phone && <MessageCircle className="w-4 h-4" />}
                    {buttonLabel(p)}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}