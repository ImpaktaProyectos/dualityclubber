import { useMemo, useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Clock, Plus, Trash2, GripVertical, Sparkles } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { upsertRow, deleteRow, resyncArtistTimes } from "@/lib/admin.functions";

type Stage = { id: string; name: string; slug: string; sort_order?: number; color?: string | null };
type Artist = { id: string; name: string; stage_id?: string | null };
type Slot = {
  id: string;
  artist_id?: string | null;
  custom_artist_name?: string | null;
  stage_id?: string | null;
  stage?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  sort_order?: number;
};

function bumpHour(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t;
  const h = (parseInt(m[1], 10) + 1) % 24;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export function ArtistsScheduleMatrix({
  artists, stages, schedule, onSaved,
}: {
  artists: Artist[]; stages: Stage[]; schedule: Slot[]; onSaved: () => void;
}) {
  const save = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);
  const resync = useServerFn(resyncArtistTimes);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Slot[]>(schedule);
  useEffect(() => { setItems(schedule); }, [schedule]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stagesSorted = useMemo(
    () => [...stages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [stages],
  );

  const slotsByStage = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const it of items) {
      const k = it.stage_id ?? "__none__";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return m;
  }, [items]);

  const assignedIds = useMemo(
    () => new Set(items.map((i) => i.artist_id).filter(Boolean) as string[]),
    [items],
  );

  const afterMutation = async () => {
    try { await resync({}); } catch { /* non-fatal */ }
    onSaved();
  };

  const persistOrder = async (stageId: string, ordered: Slot[]) => {
    setBusy(true);
    try {
      await Promise.all(ordered.map((it, idx) =>
        save({ data: { table: "schedule_items", values: { id: it.id, sort_order: idx } } }),
      ));
      await afterMutation();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  };

  const onDragEnd = (stageKey: string) => async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const list = slotsByStage.get(stageKey) ?? [];
    const oldIdx = list.findIndex((i) => i.id === active.id);
    const newIdx = list.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const moved = arrayMove(list, oldIdx, newIdx).map((it, i) => ({ ...it, sort_order: i }));
    // optimistic update
    const remaining = items.filter((it) => (it.stage_id ?? "__none__") !== stageKey);
    setItems([...remaining, ...moved]);
    await persistOrder(stageKey, moved);
  };

  const updateStart = async (slot: Slot, start: string) => {
    setItems((curr) => curr.map((it) => it.id === slot.id ? { ...it, start_time: start } : it));
    try {
      await save({ data: { table: "schedule_items", values: { id: slot.id, start_time: start } } });
      await afterMutation();
    } catch (e: any) { toast.error(e.message); }
  };

  const setSlotArtist = async (slot: Slot, artistId: string | null) => {
    try {
      await save({ data: { table: "schedule_items", values: {
        id: slot.id,
        artist_id: artistId,
        custom_artist_name: artistId ? null : slot.custom_artist_name ?? null,
      } } });
      // when unassigning, clear the previous artist's performance_time
      if (!artistId && slot.artist_id) {
        await save({ data: { table: "artists", values: { id: slot.artist_id, performance_time: null } } });
      }
      await afterMutation();
    } catch (e: any) { toast.error(e.message); }
  };

  const addSlot = async (stage: Stage) => {
    const existing = slotsByStage.get(stage.id) ?? [];
    const last = existing[existing.length - 1]?.start_time;
    const suggest = last ? bumpHour(last) : "22:00";
    setBusy(true);
    try {
      await save({ data: { table: "schedule_items", values: {
        stage_id: stage.id, stage: stage.name, start_time: suggest,
        is_visible: true, sort_order: existing.length,
      } } });
      await afterMutation();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const removeSlot = async (slot: Slot) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await del({ data: { table: "schedule_items", id: slot.id } });
      if (slot.artist_id) {
        await save({ data: { table: "artists", values: { id: slot.artist_id, performance_time: null } } });
      }
      await afterMutation();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <section className="rounded-2xl border border-[var(--brand-blue)]/30 bg-gradient-to-br from-[var(--brand-blue)]/8 to-transparent p-5 md:p-6 space-y-5">
      <header className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-[var(--brand-blue)] mt-1" />
        <div>
          <h3 className="font-bold">Horarios por escenario</h3>
          <p className="text-xs text-white/60 mt-1">
            Arrastra los slots para reordenarlos. La hora de fin se calcula automáticamente con el siguiente slot del escenario. Los cambios se sincronizan con la ficha del artista, la sección Horarios y la landing.
          </p>
        </div>
      </header>

      {stagesSorted.length === 0 && (
        <p className="text-sm text-white/50">Crea primero al menos un escenario.</p>
      )}

      {stagesSorted.map((st) => {
        const list = slotsByStage.get(st.id) ?? [];
        const unassigned = artists.filter((a) => a.stage_id === st.id && !assignedIds.has(a.id));
        return (
          <div key={st.id} className="rounded-xl border border-white/10 overflow-hidden">
            <div
              className="px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center justify-between gap-2"
              style={{ background: st.color ? `${st.color}22` : "rgba(255,255,255,0.04)" }}
            >
              <span>{st.name} <span className="text-white/40 font-normal normal-case">· {list.length} slots</span></span>
              <button
                onClick={() => addSlot(st)}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold rounded-full border border-[var(--brand-blue)]/50 text-[var(--brand-blue)] px-3 py-1 hover:bg-[var(--brand-blue)]/10"
              >
                <Plus className="h-3 w-3" /> Añadir slot
              </button>
            </div>

            {list.length === 0 ? (
              <div className="px-4 py-3 text-xs text-white/40">Sin horarios. Pulsa “Añadir slot”.</div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(st.id)}>
                <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <ul>
                    {list.map((slot, i) => (
                      <SortableSlot
                        key={slot.id}
                        slot={slot}
                        end={list[i + 1]?.start_time ?? null}
                        currentArtist={artists.find((a) => a.id === slot.artist_id) ?? null}
                        unassigned={unassigned}
                        onStart={(v) => updateStart(slot, v)}
                        onAssign={(id) => setSlotArtist(slot, id)}
                        onUnassign={() => setSlotArtist(slot, null)}
                        onRemove={() => removeSlot(slot)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        );
      })}
    </section>
  );
}

function SortableSlot({
  slot, end, currentArtist, unassigned,
  onStart, onAssign, onUnassign, onRemove,
}: {
  slot: Slot; end: string | null; currentArtist: Artist | null;
  unassigned: Artist[];
  onStart: (v: string) => void;
  onAssign: (id: string) => void;
  onUnassign: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  const [start, setStartLocal] = useState(slot.start_time ?? "");
  useEffect(() => { setStartLocal(slot.start_time ?? ""); }, [slot.start_time]);

  return (
    <li ref={setNodeRef} style={style} className="border-t border-white/5 px-3 py-2.5 flex items-center gap-3 flex-wrap bg-black/10">
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-white/40 hover:text-white cursor-grab rounded hover:bg-white/5"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-white/40" />
        <input
          value={start}
          onChange={(e) => setStartLocal(e.target.value)}
          onBlur={() => { if (start !== (slot.start_time ?? "")) onStart(start); }}
          placeholder="22:00"
          className="w-20 text-sm font-mono rounded bg-black/40 border border-white/10 px-2 py-1"
        />
        <span className="text-white/30 text-xs font-mono">→ {end ?? "—"}</span>
      </div>
      <div className="flex-1 min-w-[160px]">
        {currentArtist ? (
          <div className="flex items-center gap-2">
            <span className="font-bold">{currentArtist.name}</span>
            <button
              onClick={onUnassign}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white"
            >
              Quitar
            </button>
          </div>
        ) : slot.custom_artist_name ? (
          <span className="italic text-white/70">{slot.custom_artist_name}</span>
        ) : (
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) onAssign(e.target.value); }}
            className="rounded bg-black/40 border border-white/10 px-2 py-1 text-xs"
          >
            <option value="">— asignar artista —</option>
            {unassigned.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 text-red-300/70 hover:text-red-300 hover:bg-red-500/10 rounded"
        title="Eliminar slot"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
