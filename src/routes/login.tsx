import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin · DUALITY" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Try to claim admin if no admins exist yet
      try {
        const res = await claimFirstAdmin();
        if (res.claimed) toast.success("Cuenta marcada como admin");
      } catch {
        /* ignore */
      }
      toast.success("Bienvenido");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-display text-3xl font-black tracking-widest text-center mb-8">
          DUA<span style={{ color: "var(--brand-red)" }}>L</span><span style={{ color: "var(--brand-blue)" }}>I</span>TY
        </Link>
        <div className="rounded-2xl border border-white/10 bg-[var(--dark-panel)] p-6">
          <h1 className="text-xl font-bold mb-1">Acceso admin</h1>
          <p className="text-white/50 text-sm mb-6">Inicia sesión para gestionar la web.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-white/60">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-white/60">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-[var(--brand-blue)] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--brand-blue)] text-black font-bold py-2.5 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
