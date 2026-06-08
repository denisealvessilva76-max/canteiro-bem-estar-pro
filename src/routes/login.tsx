import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, IdCard, Loader2, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { matriculaToEmail } from "@/lib/canteiro";
import { biometriaDisponivel, buscarCredencial, salvarCredencial } from "@/lib/biometria";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [bioOk, setBioOk] = useState(false);

  useEffect(() => {
    if (!biometriaDisponivel()) return;
    setBioOk(true);
    // Tenta autofill silencioso quando a página abre
    void buscarCredencial("optional").then((c) => {
      if (c) { setMatricula(c.id); setSenha(c.password); }
    });
  }, []);

  async function entrar(mat: string, pwd: string) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: matriculaToEmail(mat), password: pwd,
    });
    setLoading(false);
    if (error) { toast.error("Matrícula ou senha incorretos"); return false; }
    void salvarCredencial(mat, pwd);
    toast.success("Bem-vindo de volta!");
    void navigate({ to: "/app/home" });
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matricula || !senha) return;
    await entrar(matricula, senha);
  }

  async function entrarComBiometria() {
    const c = await buscarCredencial("required");
    if (!c) { toast.error("Nenhuma matrícula salva neste dispositivo."); return; }
    setMatricula(c.id); setSenha(c.password);
    await entrar(c.id, c.password);
  }

  return (
    <div className="min-h-screen bg-gradient-soft px-6 py-8 safe-top">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold text-foreground">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use sua matrícula e senha cadastradas.</p>

        {bioOk && (
          <button
            type="button"
            onClick={entrarComBiometria}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary active:scale-[0.98]"
          >
            <Fingerprint className="h-5 w-5" /> Entrar com digital / Face ID
          </button>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <IdCard className="h-4 w-4" /> Matrícula
            </span>
            <input
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              inputMode="numeric"
              autoComplete="username webauthn"
              placeholder="Ex: 123456"
              className="h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-lg font-medium outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <KeyRound className="h-4 w-4" /> Senha
            </span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password webauthn"
              placeholder="Sua senha"
              className="h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-lg font-medium outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
          </button>
          {bioOk && (
            <p className="text-center text-[11px] text-muted-foreground">
              Após o 1º login, seu celular oferece desbloqueio por digital ou Face ID.
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Primeiro acesso?{' '}
            <Link to="/cadastro" className="font-bold text-primary">Cadastrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
