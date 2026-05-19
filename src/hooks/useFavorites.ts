import { useEffect, useState, useCallback } from "react";

export function useFavorites(eventKey: string | undefined) {
  const storageKey = eventKey ? `duality:favorites:${eventKey}` : "";
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch { setFavorites([]); }
  }, [storageKey]);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    if (storageKey && typeof window !== "undefined") {
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
    }
  }, [storageKey]);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (storageKey && typeof window !== "undefined") {
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      }
      return next;
    });
  }, [storageKey]);

  const clear = useCallback(() => persist([]), [persist]);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, clear, isFavorite };
}
