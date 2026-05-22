import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Check, Sparkles } from "lucide-react";
import { upsertRow, deleteRow } from "@/lib/admin.functions";

type Stage = { id: string; name: string; slug: string; sort_order?: number };
type Artist = {
  id: string;
  name: string;
  stage_id?: string | null;
  stage?: string | null;
  performance_time?: string | null;
  sort_order?: number;
};
type ScheduleItem = {
  id: string;
  artist_id?: string | null;
  custom_artist_name?: string | null;
  stage_id?: string | null;
  stage?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  sort_order?: number;
};

const NO_STAGE = "__no_stage__";

function parseFromText(t?: string | null): { start: string; end: string | null } | null {
  if (!t) return null;
  const m = t.match(/(\d{1,2})[:.](\d{2})\s*(?:[-–—]\s*(\d{1,2})[:.](\d{2}))?/);
  if (!m) return null;
  const start = `${m[1].padStart(2, "0")}:${m[2]}`;
  const end = m[3] ? `${m[3].padStart(2, "0")}:${m[4]}` : null;
  return { start, end };
}

export function ArtistsScheduleMatrix({
  artists,
  stages,
  schedule,
  onSaved,
}: {
  artists: Artist[];
  stages: Stage[];
  schedule: ScheduleItem[];
  onSaved: () => void;
}) {
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [busy, setBusy] = useState(false);

  const scheduleByArtist = useMemo(() => {
    const m = new Map<string, ScheduleItem>();
    for (const s of schedule) if (s.artist_id) m.set(s.artist_id, s);
    return m;
  }, [schedule]);

  const groups = useMemo(() => {
    const byStage = new Map<string, Artist[]>();
    for (const a of artists) {
      const key = a.stage_id || NO_STAGE;
      if (!byStage.has(key)) byStage.set(key, []);
      byStage.get(key)!.push(a);
    }
    const orderedStages = [...stages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const result: { stage: Stage | null; artists: Artist[] }[] = [];
    for (const st of orderedStages) {
      const arr = byStage.get(st.id);
      if (arr) result.push({ stage: st, artists: arr });
    }
    const orphans = byStage.get(NO_STAGE);
    if (orphans?.length) result.push({ stage: null, artists: orphans });
    return result;
  }, [artists, stages]);

  const openEditor = (artist: Artist, existing?: ScheduleItem) => {
    const fromText = parseFromText(artist.performance_time);
    setEditingId(artist.id);
    setDraft({
      start: existing?.start_time ?? fromText?.start ?? "",
      end: existing?.end_time ?? fromText?.end ?? "",
    });
  };

  const assign = async (artist: Artist, existing?: ScheduleItem) => {
    if (!draft.start) {
      toast.error("Indica una hora de inicio (HH:MM)");
      return;
    }
    const stage = stages.find((s) => s.id === artist.stage_id);
    setBusy(true);
    try {
      const values: Record<string, unknown> = {
        artist_id: artist.id,
        custom_artist_name: null,
        stage_id: artist.stage_id ?? null,
        stage: stage?.name ?? artist.stage ?? "",
        start_time: draft.start,
        end_time: draft.end || null,
        is_visible: true,
        sort_order: existing?.sort_order ?? 0,
      };
      if (existing?.id) values.id = existing.id;
      await save({ data: { table: "schedule_items", values } });
      // also persist to artist.performance_time so the artist card reflects it
      const txt = draft.end ? `${draft.start} - ${draft.end}` : draft.start;
      await save({ data: { table: "artists", values: { id: artist.id, performance_time: txt } } });
      toast.success(`Horario asignado a ${artist.name}`);
      setEditingId(null);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSchedule = async (item: ScheduleItem) => {
    if (!confirm("¿Eliminar el horario de este artista?")) return;
    setBusy(true);
    try {
      await del({ data: { table: "schedule_items", id: item.id } });
      toast.success("Horario eliminado");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const createFromArtistText = async (artist: Artist) => {
    const parsed = parseFromText(artist.performance_time);
    if (!parsed) return;
    const stage = stages.find((s) => s.id === artist.stage_id);
    setBusy(true);
    try {
      await save({
        data: {
          table: "schedule_items",
          values: {
            artist_id: artist.id,
            custom_artist_name: null,
            stage_id: artist.stage_id ?? null,
            stage: stage?.name ?? artist.stage ?? "",
            start_time: parsed.start,
            end_time: parsed.end,
            is_visible: true,
            sort_order: 0,
          },
        },
      });
      toast.success(`Horario creado para ${artist.name}`);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--brand-blue)]/30 bg-gradient-to-br from-[var(--brand-blue)]/8 to-transparent p-5 md:p-6 space-y-5">
      <header className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-[var(--brand-blue)] mt-1" />
        <div>
          <h3 className="font-bold">Artistas por escenario</h3>
          <p className="text-xs text-white/60 mt-1">
            Todos los artistas agrupados por escenario. Asigna o edita su horario aquí — los cambios se sincronizan automáticamente con la sección de horarios y con la ficha del artista.
          </p>
        </div>
      </header>

      {groups.length === 0 && (
        <p className="text-sm text-white/50">No hay artistas todavía. Añádelos en la pestaña Artistas.</p>
      )}

      {groups.map(({ stage, artists: list }) => (
        <div key={stage?.id ?? NO_STAGE} className="rounded-xl border border-white/10 overflow-hidden">
          <div
            className="px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center gap-2"
            style={{ background: stage?.color ? `${stage.color}22` : "rgba(255,255,255,0.04)" }}
          >
            <span>{stage?.name ?? "Sin escenario asignado"}</span>
            <span className="text-white/40">· {list.length}</span>
          </div>
          <ul className="divide-y divide-white/5">
            {list.map((a) => {
              const item = scheduleByArtist.get(a.id);
              const isEditing = editingId === a.id;
              return (
                <li key={a.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                  <span className="font-medium min-w-[140px]">{a.name}</span>

                  {item ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                      <Clock className="h-3 w-3" />
                      {item.start_time}{item.end_time ? ` – ${item.end_time}` : ""}
                    </span>
                  ) : a.performance_time ? (
                    <span className="text-xs text-amber-300/90">Ficha: {a.performance_time}</span>
                  ) : (
                    <span className="text-xs text-white/40">Sin horario</span>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        value={draft.start}
                        onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                        placeholder="22:00"
                        className="w-20 text-xs rounded bg-black/40 border border-white/10 px-2 py-1 font-mono"
                      />
                      <span className="text-white/40 text-xs">–</span>
                      <input
                        value={draft.end}
                        onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                        placeholder="23:00"
                        className="w-20 text-xs rounded bg-black/40 border border-white/10 px-2 py-1 font-mono"
                      />
                      <button
                        disabled={busy}
                        onClick={() => assign(a, item)}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold rounded-full bg-[var(--brand-blue)] text-black px-3 py-1"
                      >
                        <Check className="h-3 w-3" /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-white/50 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      {!item && a.performance_time && parseFromText(a.performance_time) && (
                        <button
                          disabled={busy}
                          onClick={() => createFromArtistText(a)}
                          className="text-[10px] uppercase tracking-widest font-bold rounded-full border border-amber-300/40 text-amber-300 px-3 py-1 hover:bg-amber-300/10"
                        >
                          Usar horario de la ficha
                        </button>
                      )}
                      <button
                        onClick={() => openEditor(a, item)}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold rounded-full border border-[var(--brand-blue)]/50 text-[var(--brand-blue)] px-3 py-1 hover:bg-[var(--brand-blue)]/10"
                      >
                        <Plus className="h-3 w-3" /> {item ? "Editar horario" : "Asignar horario"}
                      </button>
                      {item && (
                        <button
                          disabled={busy}
                          onClick={() => removeSchedule(item)}
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold rounded-full border border-red-400/40 text-red-300 px-2 py-1 hover:bg-red-500/10"
                          title="Eliminar horario"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
