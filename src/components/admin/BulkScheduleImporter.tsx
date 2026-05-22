import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Upload, X, AlertTriangle } from "lucide-react";
import { bulkUpsertSchedule } from "@/lib/admin.functions";

type Stage = { id: string; name: string; slug: string };
type Artist = { id: string; name: string; stage_id?: string | null };

type ParsedItem = {
  start_time: string;
  end_time: string | null;
  artist_name: string;
  stage_name: string;
  error?: string;
};

const EXAMPLE = `MAIN ROOM:
22:00 - 23:00 XAVI METRALLA
23:00 - 00:00 MARC SKUDERO

AREA CLUB:
22:00 - 23:00 MARINA G
23:00 - 00:00 MELÓDIC PEDRO

OPEN AIR:
22:00 - 23:00 NORIMAKI

# o por línea:
00:00 - 01:00 | DJ MORE | MAIN ROOM
01:00 | TONI MASSAMA | MAIN ROOM`;

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const TIME = "(\\d{1,2}[:.]\\d{2})";
const TIME_RE = new RegExp(TIME);
const TIME_RANGE_RE = new RegExp(`${TIME}\\s*[-–—]\\s*${TIME}`);

function normalizeTime(t: string | null | undefined): string | null {
  if (!t) return null;
  const m = t.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function parseText(input: string, stages: Stage[]): ParsedItem[] {
  const lines = input.split(/\r?\n/).map((l) => l.trim());
  const items: ParsedItem[] = [];
  let currentStage = "";

  for (const raw of lines) {
    const line = raw;
    if (!line || line.startsWith("#")) continue;

    // Stage header? e.g.  "MAIN ROOM:" or "OPEN AIR -"
    if (/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 _\-]+\s*[:\-]\s*$/.test(line)) {
      currentStage = line.replace(/[:\-]\s*$/, "").trim();
      continue;
    }

    // Format A: "HH:MM - HH:MM | ARTIST | STAGE" (pipe-separated)
    if (line.includes("|")) {
      const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const timePart = parts[0];
        const range = timePart.match(TIME_RANGE_RE);
        const single = !range && timePart.match(TIME_RE);
        const start = normalizeTime(range ? range[1] : single ? single[1] : null);
        const end = normalizeTime(range ? range[2] : null);
        const artist = parts[1];
        const stage = parts[2] || currentStage;
        if (start && artist) {
          items.push({ start_time: start, end_time: end, artist_name: artist, stage_name: stage });
          continue;
        }
        items.push({ start_time: "", end_time: null, artist_name: line, stage_name: stage, error: "Formato no reconocido" });
        continue;
      }
    }

    // Format B: "HH:MM - HH:MM ARTIST [STAGE?]"  or  "HH:MM ARTIST [STAGE?]"
    const range = line.match(TIME_RANGE_RE);
    if (range) {
      const rest = line.slice(range[0].length).trim();
      const { artist, stage } = splitArtistStage(rest, stages, currentStage);
      items.push({
        start_time: normalizeTime(range[1])!,
        end_time: normalizeTime(range[2]),
        artist_name: artist,
        stage_name: stage,
      });
      continue;
    }
    const single = line.match(/^(\d{1,2}[:.]\d{2})\b/);
    if (single) {
      const rest = line.slice(single[0].length).trim();
      const { artist, stage } = splitArtistStage(rest, stages, currentStage);
      items.push({
        start_time: normalizeTime(single[1])!,
        end_time: null,
        artist_name: artist,
        stage_name: stage,
      });
      continue;
    }

    items.push({ start_time: "", end_time: null, artist_name: line, stage_name: currentStage, error: "Sin hora detectada" });
  }
  return items;
}

function splitArtistStage(rest: string, stages: Stage[], fallback: string): { artist: string; stage: string } {
  // try to find a known stage at the END of the string
  const lower = rest.toLowerCase();
  for (const s of stages) {
    const n = s.name.toLowerCase();
    if (lower.endsWith(n)) {
      return { artist: rest.slice(0, rest.length - s.name.length).trim(), stage: s.name };
    }
  }
  // fallback to current header
  return { artist: rest.trim(), stage: fallback };
}

type Status = "ok" | "new-artist" | "no-stage" | "duplicate" | "error" | "overlap";

function normalizeName(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function statusFor(item: ParsedItem, artists: Artist[], stages: Stage[], existingKey: Set<string>): { status: Status; label: string } {
  if (item.error) return { status: "error", label: item.error };
  if (!item.stage_name) return { status: "no-stage", label: "Sin escenario" };
  const key = `${item.start_time}|${normalizeName(item.artist_name)}|${slugify(item.stage_name)}`;
  if (existingKey.has(key)) return { status: "duplicate", label: "Duplicado" };
  const normKey = normalizeName(item.artist_name);
  const artist = artists.find((a) => normalizeName(a.name) === normKey);
  if (!artist) return { status: "new-artist", label: "Se creará el artista" };
  return { status: "ok", label: "OK" };
}

const STATUS_COLOR: Record<Status, string> = {
  ok: "text-emerald-300 border-emerald-300/30",
  "new-artist": "text-[var(--brand-blue)] border-[var(--brand-blue)]/40",
  "no-stage": "text-amber-300 border-amber-300/30",
  duplicate: "text-orange-300 border-orange-300/30",
  error: "text-red-300 border-red-300/30",
  overlap: "text-amber-300 border-amber-300/30",
};

export function BulkScheduleImporter({
  stages, artists, existingSchedule, onSaved,
}: {
  stages: Stage[];
  artists: Artist[];
  existingSchedule: any[];
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedItem[] | null>(null);
  const [createMissingArtists, setCreateMissingArtists] = useState(true);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const importFn = useServerFn(bulkUpsertSchedule);

  const existingKey = useMemo(() => {
    const s = new Set<string>();
    for (const it of existingSchedule) {
      const stageSlug = slugify(it.stage ?? "");
      const name = normalizeName(it.custom_artist_name ?? artists.find((a) => a.id === it.artist_id)?.name ?? "");
      s.add(`${it.start_time}|${name}|${stageSlug}`);
    }
    return s;
  }, [existingSchedule, artists]);

  const onPreview = () => {
    const items = parseText(text, stages);
    setPreview(items);
    if (!items.length) toast.error("No se ha podido extraer ningún horario.");
    else toast.success(`${items.length} horarios detectados. Revisa antes de importar.`);
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error("Pulsa primero Previsualizar.");
      const valid = preview.filter((p) => !p.error && p.start_time && p.artist_name && p.stage_name);
      return importFn({
        data: {
          items: valid.map((p, idx) => ({ ...p, sort_order: idx })),
          options: { createMissingArtists, replaceAll: mode === "replace" },
        },
      });
    },
    onSuccess: (r: any) => {
      toast.success(`✓ ${r.inserted} horarios importados`);
      setPreview(null);
      setText("");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--brand-blue)]/5 to-transparent p-5 md:p-6 space-y-4">
      <header className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-[var(--brand-blue)] mt-1" />
        <div>
          <h3 className="font-bold">Carga rápida de horarios</h3>
          <p className="text-xs text-white/60 mt-1">
            Pega el line-up en el cuadro y pulsa Previsualizar. Admite:
            <code className="mx-1 px-1 bg-black/40 rounded">HH:MM - HH:MM | ARTISTA | STAGE</code>,
            bloques con encabezado <code className="px-1 bg-black/40 rounded">MAIN ROOM:</code>, o
            <code className="mx-1 px-1 bg-black/40 rounded">HH:MM ARTISTA STAGE</code>.
          </p>
        </div>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={EXAMPLE}
        className="w-full font-mono text-xs rounded-lg bg-black/40 border border-white/10 px-3 py-2 placeholder:text-white/20"
      />

      <div className="flex items-center gap-4 flex-wrap text-xs">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={createMissingArtists}
            onChange={(e) => setCreateMissingArtists(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand-blue)]"
          />
          Crear artistas que no existan
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="mode" checked={mode === "append"} onChange={() => setMode("append")} className="accent-[var(--brand-blue)]" />
          Añadir a los actuales
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="mode" checked={mode === "replace"} onChange={() => setMode("replace")} className="accent-[var(--brand-blue)]" />
          Reemplazar TODOS los horarios actuales
        </label>
        <button
          onClick={onPreview}
          disabled={!text.trim()}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/30 px-4 py-2 uppercase tracking-widest font-bold"
        >
          Previsualizar
        </button>
        {preview && (
          <>
            <button
              onClick={() => { setPreview(null); }}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-white/60"
            >
              <X className="h-3 w-3" /> Cancelar
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-5 py-2 uppercase tracking-widest"
            >
              <Upload className="h-3 w-3" /> {mut.isPending ? "Importando…" : "Importar"}
            </button>
          </>
        )}
      </div>

      {preview && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-black/40 text-white/60">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Inicio</th>
                <th className="text-left px-3 py-2">Fin</th>
                <th className="text-left px-3 py-2">Artista</th>
                <th className="text-left px-3 py-2">Escenario</th>
                <th className="text-left px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((it, i) => {
                const st = statusFor(it, artists, stages, existingKey);
                return (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-3 py-2 text-white/40">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">{it.start_time || "—"}</td>
                    <td className="px-3 py-2 font-mono text-white/60">{it.end_time || "—"}</td>
                    <td className="px-3 py-2">{it.artist_name}</td>
                    <td className="px-3 py-2 text-white/70">
                      {it.stage_name || <span className="text-amber-300 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> sin stage</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLOR[st.status]}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
