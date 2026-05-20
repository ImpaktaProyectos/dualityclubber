import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import { upsertRow, deleteRow } from "@/lib/admin.functions";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Stage = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  sort_order: number;
  is_visible: boolean;
};

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function StageRow({ s, onChange, onSave, onDelete }: {
  s: Stage;
  onChange: (s: Stage) => void;
  onSave: (s: Stage) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--dark-panel)] p-3">
      <button {...attributes} {...listeners} className="p-2 cursor-grab text-white/40 hover:text-white">
        <GripVertical className="h-4 w-4" />
      </button>
      <input
        type="color"
        value={s.color ?? "#00AEEF"}
        onChange={(e) => onChange({ ...s, color: e.target.value })}
        className="w-9 h-9 rounded cursor-pointer bg-transparent border border-white/10"
        title="Color del escenario"
      />
      <input
        type="text"
        value={s.name}
        onChange={(e) => onChange({ ...s, name: e.target.value, slug: slugify(e.target.value) })}
        className="flex-1 min-w-0 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
        placeholder="Nombre del escenario"
      />
      <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={s.is_visible}
          onChange={(e) => onChange({ ...s, is_visible: e.target.checked })}
          className="h-4 w-4 accent-[var(--brand-blue)]"
        />
        Visible
      </label>
      <button
        onClick={() => onSave(s)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest bg-[var(--brand-blue)] text-black font-bold"
      >
        <Save className="h-3 w-3" />
      </button>
      <button
        onClick={() => onDelete(s.id)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs uppercase tracking-widest border border-white/10 text-red-300 hover:border-red-400"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export function StagesManager({ rows, onSaved }: { rows: Stage[]; onSaved: () => void }) {
  const [items, setItems] = useState<Stage[]>([...rows].sort((a, b) => a.sort_order - b.sort_order));
  const upsert = useServerFn(upsertRow);
  const del = useServerFn(deleteRow);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onChange = (next: Stage) => setItems(items.map((i) => (i.id === next.id ? next : i)));

  const onSave = async (s: Stage) => {
    try {
      await upsert({ data: { table: "stages", values: { ...s, slug: s.slug || slugify(s.name) } } });
      toast.success("Escenario guardado");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este escenario?")) return;
    try {
      await del({ data: { table: "stages", id } });
      setItems(items.filter((i) => i.id !== id));
      toast.success("Eliminado");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const onCreate = async () => {
    const name = prompt("Nombre del nuevo escenario:");
    if (!name) return;
    try {
      const created: any = await upsert({
        data: { table: "stages", values: { name, slug: slugify(name), sort_order: items.length, is_visible: true, color: "#00AEEF" } },
      });
      if (created) setItems([...items, created]);
      toast.success("Escenario creado");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const moved = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({ ...it, sort_order: idx }));
    setItems(moved);
    // Persist order
    await Promise.all(moved.map((it) => upsert({ data: { table: "stages", values: it } })));
    onSaved();
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--brand-blue)]/5 to-transparent p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <p className="font-bold">Escenarios internos</p>
          <p className="text-xs text-white/50 mt-0.5">
            Se usan en los desplegables de Artistas y Horarios, y en los filtros de la web. No crean una sección visible nueva.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] text-black font-bold px-4 py-2 text-xs uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" /> Nuevo escenario
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((s) => (
              <StageRow key={s.id} s={s} onChange={onChange} onSave={onSave} onDelete={onDelete} />
            ))}
            {items.length === 0 && <p className="text-sm text-white/40">Aún no hay escenarios. Crea el primero.</p>}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
