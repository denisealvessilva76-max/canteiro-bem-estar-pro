import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) { toast.error('Credenciais inválidas'); return; }
    toast.success('Bem-vindo, equipe Saúde');
    void navigate({ to: "/admin/dashboard" });
  }

  return (
    <div className="min-h-screen bg-gradient-soft px-6 py-8 safe-top">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Painel Saúde Ocupacional</h1>
            <p className="text-sm text-muted-foreground">Acesso restrito à equipe</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">E-mail corporativo</span>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com" required
              className="h-12 w-full rounded-2xl border-2 border-input bg-card px-4 text-base outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Senha</span>
            <input
              type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••" required minLength={6}
              className="h-12 w-full rounded-2xl border-2 border-input bg-card px-4 text-base outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar no painel'}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Novas contas administrativas são criadas por gestores já cadastrados, dentro do painel.
          </p>
        </form>
      </div>
    </div>
  );
}
