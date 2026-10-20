import { useEffect, useState } from "react";

const STEPS = [
  "Cargando…",
  "Detectando el fallo…",
  "Arreglando el fallo…",
  "Ajustando el sonido…",
  "Casi listo…",
];

export function MaintenanceScreen({ title, message }: { title?: string | null; message?: string | null }) {
  const [progress, setProgress] = useState(8);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 96 ? 12 : p + Math.random() * 6));
    }, 450);
    const sid = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2200);
    return () => { clearInterval(id); clearInterval(sid); };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground grain flex items-center justify-center px-6">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-brand-blue/25 blur-[120px] animate-pulse" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-brand-red/20 blur-[120px] animate-pulse" />

      <div className="relative z-10 w-full max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Error</p>
        <h1 className="text-display mt-2 font-black leading-none text-[120px] md:text-[180px]">
          <span className="text-brand-blue text-glow-blue">4</span>
          <span className="text-foreground">0</span>
          <span className="text-brand-red text-glow-red">4</span>
        </h1>
        <h2 className="text-display mt-4 text-2xl md:text-3xl font-bold uppercase">
          {title || "Estamos ajustando el sonido"}
        </h2>
        <p className="mt-3 text-sm md:text-base text-muted-foreground">
          {message || "Volvemos en unos minutos. Gracias por tu paciencia."}
        </p>

        <div className="mt-10">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-white to-brand-red transition-[width] duration-500 ease-out glow-blue"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>{STEPS[step]}</span>
            <span>{Math.floor(Math.min(progress, 100))}%</span>
          </div>
        </div>
      </div>
    </main>
  );
}
