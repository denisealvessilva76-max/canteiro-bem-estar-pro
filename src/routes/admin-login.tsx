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
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password: senha,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          data: {
            matricula: 'ADM-' + email.split('@')[0],
            nome: 'Admin ' + email.split('@')[0],
            role: 'admin',
          },
        },
      });
      if (error) { setLoading(false); toast.error(error.message); return; }
      // garante role admin
      if (data.user) {
        await supabase.from('user_roles').upsert({ user_id: data.user.id, role: 'admin' });
      }
      toast.success('Conta admin criada');
      void navigate({ to: "/admin/dashboard" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) { setLoading(false); toast.error('Credenciais inválidas'); return; }
      toast.success('Bem-vindo, equipe Saúde');
      void navigate({ to: "/admin/dashboard" });
    }
    setLoading(false);
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
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === 'login' ? 'Entrar no painel' : 'Criar conta admin')}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === 'login' ? 'Primeira vez? Criar conta admin' : 'Já tenho conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
