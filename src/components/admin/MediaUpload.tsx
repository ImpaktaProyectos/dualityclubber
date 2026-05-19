import { useRef, useState } from "react";
import { Upload, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Kind = "image" | "video" | "pdf";

const ACCEPT: Record<Kind, string> = {
  image: "image/jpeg,image/png,image/webp,image/avif",
  video: "video/mp4,video/webm",
  pdf: "application/pdf",
};
const MAX_MB: Record<Kind, number> = { image: 10, video: 80, pdf: 15 };

export function MediaUpload({
  label,
  bucket,
  value,
  onChange,
  kind = "image",
  pathPrefix = "",
}: {
  label: string;
  bucket: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  kind?: Kind;
  pathPrefix?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!ACCEPT[kind].split(",").includes(file.type)) {
      toast.error(`Formato no permitido (${file.type})`);
      return;
    }
    if (file.size > MAX_MB[kind] * 1024 * 1024) {
      toast.error(`Máximo ${MAX_MB[kind]}MB`);
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const name = `${pathPrefix ? pathPrefix + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(name, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(name);
      onChange(data.publicUrl);
      toast.success("Archivo subido");
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {value ? (
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
          <div className="aspect-video w-full rounded overflow-hidden bg-black/60 flex items-center justify-center">
            {kind === "image" && <img src={value} alt="" className="w-full h-full object-contain" />}
            {kind === "video" && <video src={value} controls className="w-full h-full" />}
            {kind === "pdf" && (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] text-sm underline truncate">
                Abrir PDF
              </a>
            )}
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs bg-black/50 border border-white/10 rounded px-2 py-1 text-white/60"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-1 text-xs uppercase tracking-widest px-3 py-2 rounded-full border border-white/10 hover:border-white/30"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Reemplazar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center justify-center gap-1 text-xs uppercase tracking-widest px-3 py-2 rounded-full border border-white/10 text-red-300 hover:border-red-400"
            >
              <Trash2 className="w-3 h-3" /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-6 rounded-lg border border-dashed border-white/15 text-sm text-white/60 hover:border-[var(--brand-blue)] hover:text-white transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Subiendo..." : `Subir ${kind === "image" ? "imagen" : kind === "video" ? "vídeo" : "PDF"}`}
        </button>
      )}
    </div>
  );
}
