import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Lock, RotateCcw, Save, AlertTriangle } from "lucide-react";
import { reorderSections, upsertRow } from "@/lib/admin.functions";

const RECOMMENDED_ORDER = [
  "header", "hero", "quick_info", "countdown", "tickets", "artists", "schedule",
  "gallery", "location", "buses", "authorization", "faq", "final_cta", "footer",
];

type Section = {
  id: string;
  section_key: string;
  section_name: string;
  is_enabled: boolean;
  display_mode: string;
  sort_order: number;
  is_locked?: boolean;
  admin_status?: string;
};

function statusLabel(s: Section) {
  if (!s.is_enabled) return { label: "Oculta", color: "text-white/40 border-white/10" };
  if (s.display_mode === "coming_soon") return { label: "Próximamente", color: "text-amber-300 border-amber-300/30" };
  if (s.display_mode === "hidden") return { label: "Oculta", color: "text-white/40 border-white/10" };
  if (s.admin_status === "incomplete") return { label: "Incompleta", color: "text-orange-300 border-orange-300/30" };
  return { label: "Completa", color: "text-emerald-300 border-emerald-300/30" };
}

function SortableRow({
  s, onToggleEnabled, onChangeDisplayMode,
}: {
  s: Section;
  onToggleEnabled: (s: Section) => void;
  onChangeDisplayMode: (s: Section, v: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id, disabled: s.is_locked });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const status = statusLabel(s);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-[var(--dark-panel)] p-3 md:p-4 ${
        s.is_locked ? "border-white/5 opacity-80" : "border-white/10"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        disabled={s.is_locked}
        className={`shrink-0 p-2 rounded-lg ${
          s.is_locked ? "cursor-not-allowed text-white/20" : "cursor-grab text-white/40 hover:text-white hover:bg-white/5"
        }`}
        title={s.is_locked ? "Sección fija" : "Arrastrar para reordenar"}
      >
        {s.is_locked ? <Lock className="h-4 w-4" /> : <GripVertical className="h-4 w-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{s.section_name}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">{s.section_key}</div>
      </div>

      <span className={`hidden sm:inline-flex text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${status.color}`}>
        {status.label}
      </span>

      <select
        value={s.display_mode}
        onChange={(e) => onChangeDisplayMode(s, e.target.value)}
        className="rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 text-xs"
      >
        <option value="visible">Visible</option>
        <option value="coming_soon">Próximamente</option>
        <option value="hidden">Oculta</option>
      </select>

      <button
        onClick={() => onToggleEnabled(s)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border ${
          s.is_enabled ? "bg-[var(--brand-blue)]/20 border-[var(--brand-blue)]/50" : "border-white/10 text-white/50"
        }`}
      >
        {s.is_enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {s.is_enabled ? "Activa" : "Inactiva"}
      </button>
    </div>
  );
}

export function SectionsReorder({ rows, onSaved }: { rows: Section[]; onSaved: () => void }) {
  const [items, setItems] = useState<Section[]>(() => [...rows].sort((a, b) => a.sort_order - b.sort_order));
  const [dirty, setDirty] = useState(false);
  const reorder = useServerFn(reorderSections);
  const upsert = useServerFn(upsertRow);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ticketsIndex = useMemo(() => items.findIndex((i) => i.section_key === "tickets"), [items]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const moved = arrayMove(items, oldIndex, newIndex);
    // Warning if tickets moved too low
    const movedItem = items[oldIndex];
    if (movedItem.section_key === "tickets" && newIndex > 6) {
      toast.warning("Estás bajando “Entradas”. Esto puede reducir las conversiones de compra.", { icon: <AlertTriangle className="h-4 w-4" /> });
    }
    setItems(moved);
    setDirty(true);
  };

  const onToggleEnabled = async (s: Section) => {
    try {
      await upsert({ data: { table: "page_sections", values: { ...s, is_enabled: !s.is_enabled } } });
      toast.success(s.is_enabled ? "Sección desactivada" : "Sección activada");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };
  const onChangeDisplayMode = async (s: Section, v: string) => {
    try {
      await upsert({ data: { table: "page_sections", values: { ...s, display_mode: v } } });
      toast.success("Visibilidad actualizada");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const saveMut = useMutation({
    mutationFn: () => reorder({ data: { items: items.map((it, idx) => ({ id: it.id, sort_order: idx })) } }),
    onSuccess: () => { toast.success("✓ Orden guardado. La landing se actualizará."); setDirty(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  const restoreRecommended = () => {
    const ranked = [...items].sort((a, b) => {
      const ai = RECOMMENDED_ORDER.indexOf(a.section_key);
      const bi = RECOMMENDED_ORDER.indexOf(b.section_key);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    setItems(ranked);
    setDirty(true);
    toast.info("Orden recomendado aplicado. Pulsa “Guardar orden”.");
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--brand-blue)]/5 to-transparent p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <p className="font-bold">Arrastra las secciones para cambiar el orden de la landing</p>
          <p className="text-xs text-white/50 mt-0.5">Las secciones bloqueadas (🔒) no se pueden mover.</p>
          {ticketsIndex > 6 && (
            <p className="text-xs text-amber-300 mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Entradas está en una posición baja. Se recomienda subirla.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={restoreRecommended}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest px-3 py-2 rounded-full border border-white/10 hover:border-white/30"
          >
            <RotateCcw className="h-3 w-3" /> Orden recomendado
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={!dirty || saveMut.isPending}
            className={`inline-flex items-center gap-2 text-xs uppercase tracking-widest px-4 py-2 rounded-full font-bold ${
              dirty ? "bg-[var(--brand-blue)] text-black" : "bg-white/5 text-white/30 cursor-not-allowed"
            }`}
          >
            <Save className="h-3 w-3" /> {saveMut.isPending ? "Guardando…" : "Guardar orden"}
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((s) => (
              <SortableRow key={s.id} s={s} onToggleEnabled={onToggleEnabled} onChangeDisplayMode={onChangeDisplayMode} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
