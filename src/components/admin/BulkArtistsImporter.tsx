import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertRow, deleteRow } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Upload, AlertTriangle, CheckCircle2, Eye, X } from "lucide-react";

type ParsedRow = {
  name: string;
  stage: string | null;
  status: "new" | "duplicate" | "no-stage";
  existingId?: string;
};

const EXAMPLE = `MAIN ROOM:
XAVI METRALLA
MARC SKUDERO
DJ MORE

AREA CLUB:
MARINA G
MELÓDIC PEDRO

OPEN AIR:
NORIMAKI
KCHO

// también acepta:
// XAVI METRALLA | MAIN ROOM
// MARC SKUDERO - MAIN ROOM`;

function parseInput(text: string): { name: string; stage: string | null }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("#"));

  const out: { name: string; stage: string | null }[] = [];
  let currentStage: string | null = null;

  for (const raw of lines) {
    // Header form "STAGE:"
    if (/^[^|\-]+:\s*$/.test(raw)) {
      currentStage = raw.replace(/:\s*$/, "").trim();
      continue;
    }
    // Inline "NAME | STAGE" or "NAME - STAGE"
    const sep = raw.includes("|") ? "|" : raw.includes(" - ") ? " - " : null;
    if (sep) {
      const [name, stage] = raw.split(sep).map((s) => s.trim());
      if (name) out.push({ name, stage: stage || currentStage });
      continue;
    }
    // Plain name under a stage block
    out.push({ name: raw, stage: currentStage });
  }
  return out;
}

function annotate(rows: { name: string; stage: string | null }[], existing: any[]): ParsedRow[] {
  const byName = new Map(existing.map((a) => [a.name.toLowerCase().trim(), a]));
  return rows.map((r) => {
    const dup = byName.get(r.name.toLowerCase().trim());
    if (dup) return { ...r, status: "duplicate", existingId: dup.id };
    if (!r.stage) return { ...r, status: "no-stage" };
    return { ...r, status: "new" };
  });
}

export function BulkArtistsImporter({
  existingArtists,
  onSaved,
}: {
  existingArtists: any[];
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);

  const stats = useMemo(() => {
    if (!preview) return null;
    return {
      total: preview.length,
      news: preview.filter((p) => p.status === "new").length,
      dups: preview.filter((p) => p.status === "duplicate").length,
      noStage: preview.filter((p) => p.status === "no-stage").length,
    };
  }, [preview]);

  const baseSort = existingArtists.reduce((m, a) => Math.max(m, a.sort_order ?? 0), 0);

  const runImport = useMutation({
    mutationFn: async (mode: "new" | "update" | "replace") => {
      if (!preview) return;
      if (mode === "replace") {
        for (const a of existingArtists) {
          await del({ data: { table: "artists", id: a.id } });
        }
      }
      let i = 1;
      for (const row of preview) {
        if (mode === "new" && row.status !== "new") continue;
        if (mode === "update" && row.status !== "new" && row.status !== "duplicate") continue;

        const values: any = {
          name: row.name,
          stage: row.stage,
          is_visible: true,
          is_featured: false,
          sort_order: baseSort + i,
        };
        if (mode === "update" && row.existingId) values.id = row.existingId;
        await save({ data: { table: "artists", values } });
        i++;
      }
    },
    onSuccess: () => {
      toast.success("Artistas importados");
      setText("");
      setPreview(null);
      setOpen(false);
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-[var(--brand-blue)]/40 bg-[var(--dark-panel)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-[var(--brand-blue)]" />
          <div>
            <div className="font-bold">Carga rápida de artistas</div>
            <div className="text-xs text-white/50 mt-0.5">
              Pega un listado con artistas y escenarios. Se crean todos de golpe.
            </div>
          </div>
        </div>
        <span className="text-white/40">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="p-4 md:p-5 pt-0 space-y-4 border-t border-white/10">
          <div className="text-xs text-white/60 leading-relaxed">
            Formatos aceptados (mezcla los que quieras):
            <pre className="mt-2 rounded-lg bg-black/40 border border-white/10 p-3 text-[11px] text-white/70 overflow-auto whitespace-pre-wrap">
{EXAMPLE}
            </pre>
          </div>

          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega aquí los artistas…"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm font-mono focus:border-[var(--brand-blue)] outline-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPreview(annotate(parseInput(text), existingArtists))}
              disabled={!text.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
            >
              <Eye className="h-4 w-4" /> Previsualizar carga
            </button>
            {preview && (
              <button
                onClick={() => setPreview(null)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-widest text-white/70"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
            )}
          </div>

          {preview && stats && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <Pill>Total: {stats.total}</Pill>
                <Pill tone="ok">Nuevos: {stats.news}</Pill>
                <Pill tone="warn">Duplicados: {stats.dups}</Pill>
                <Pill tone="err">Sin escenario: {stats.noStage}</Pill>
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--dark-panel)]">
                      <tr className="text-left text-[10px] uppercase tracking-widest text-white/50">
                        <th className="p-2 w-10">#</th>
                        <th className="p-2">Artista</th>
                        <th className="p-2">Escenario</th>
                        <th className="p-2 w-32">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="p-2 text-white/40 tabular-nums">{i + 1}</td>
                          <td className="p-2 font-bold">{r.name}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={r.stage ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPreview((prev) =>
                                  prev!.map((p, idx) =>
                                    idx === i
                                      ? { ...p, stage: v, status: !v ? "no-stage" : p.status === "no-stage" ? (p.existingId ? "duplicate" : "new") : p.status }
                                      : p,
                                  ),
                                );
                              }}
                              className="w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            {r.status === "new" && <Tag tone="ok"><CheckCircle2 className="h-3 w-3" />Nuevo</Tag>}
                            {r.status === "duplicate" && <Tag tone="warn"><AlertTriangle className="h-3 w-3" />Duplicado</Tag>}
                            {r.status === "no-stage" && <Tag tone="err"><AlertTriangle className="h-3 w-3" />Sin escenario</Tag>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  disabled={runImport.isPending || stats.news === 0}
                  onClick={() => runImport.mutate("new")}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
                >
                  Importar solo nuevos ({stats.news})
                </button>
                <button
                  disabled={runImport.isPending || (stats.news === 0 && stats.dups === 0)}
                  onClick={() => runImport.mutate("update")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-widest"
                >
                  Actualizar duplicados + nuevos
                </button>
                <button
                  disabled={runImport.isPending}
                  onClick={() => {
                    if (!confirm("Esto borrará todos los artistas actuales antes de importar. ¿Continuar?")) return;
                    runImport.mutate("replace");
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-red-400/40 text-red-300 px-4 py-2 text-xs uppercase tracking-widest"
                >
                  Reemplazar todos
                </button>
                {runImport.isPending && <span className="text-xs text-white/50 self-center">Importando…</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: "ok" | "warn" | "err" }) {
  const cls =
    tone === "ok"
      ? "border-green-400/40 text-green-300"
      : tone === "warn"
        ? "border-yellow-400/40 text-yellow-300"
        : tone === "err"
          ? "border-red-400/40 text-red-300"
          : "border-white/15 text-white/70";
  return <span className={`px-2.5 py-1 rounded-full border ${cls}`}>{children}</span>;
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "err" }) {
  const cls =
    tone === "ok"
      ? "bg-green-400/15 text-green-300"
      : tone === "warn"
        ? "bg-yellow-400/15 text-yellow-300"
        : "bg-red-400/15 text-red-300";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${cls}`}>{children}</span>;
}
