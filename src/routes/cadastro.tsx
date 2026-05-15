import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { matriculaToEmail } from "@/lib/canteiro";

export const Route = createFileRoute("/cadastro")({
  component: Cadastro,
});

function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    matricula: "", nome: "", senha: "", turno: "diurno" as 'diurno' | 'noturno',
    cargo: "", peso: "", altura: "", telefone: "",
  });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.matricula || !form.nome || form.senha.length < 6) {
      toast.error("Preencha matrícula, nome e senha (mínimo 6 caracteres).");
      return;
    }
    setLoading(true);

    const { data: existe } = await supabase
      .from('profiles').select('id').eq('matricula', form.matricula.trim()).maybeSingle();
    if (existe) {
      setLoading(false);
      toast.error("Essa matrícula já está cadastrada");
      return;
    }

    const { data: signup, error } = await supabase.auth.signUp({
      email: matriculaToEmail(form.matricula),
      password: form.senha,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          matricula: form.matricula.trim(),
          nome: form.nome.trim(),
          turno: form.turno,
          cargo: form.cargo,
          peso: form.peso,
          altura: form.altura,
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message || "Erro ao cadastrar");
      return;
    }
    // grava telefone (após o trigger criar o profile)
    if (signup.user && form.telefone) {
      await supabase.from('profiles').update({ telefone: form.telefone.trim() }).eq('id', signup.user.id);
    }
    setLoading(false);
    toast.success("Cadastro realizado! Bem-vindo!");
    void navigate({ to: "/app/home" });
  }

  return (
    <div className="min-h-screen bg-gradient-soft px-6 py-8 safe-top">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold text-foreground">Primeiro acesso</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cadastre seus dados para começar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Matrícula *" value={form.matricula} onChange={(v) => set('matricula', v)} placeholder="Ex: 123456" inputMode="numeric" />
          <Field label="Nome completo *" value={form.nome} onChange={(v) => set('nome', v)} placeholder="Seu nome" />
          <Field label="WhatsApp" value={form.telefone} onChange={(v) => set('telefone', v)} placeholder="(31) 9XXXX-XXXX" inputMode="numeric" />
          <Field label="Senha (mín. 6) *" type="password" value={form.senha} onChange={(v) => set('senha', v)} placeholder="••••••" />
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Turno</span>
            <div className="grid grid-cols-2 gap-2">
              {(['diurno', 'noturno'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('turno', t)}
                  className={`h-12 rounded-2xl border-2 text-sm font-bold capitalize transition ${
                    form.turno === t
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-card text-foreground'
                  }`}
                >
                  {t === 'diurno' ? '☀️ Diurno' : '🌙 Noturno'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {form.turno === 'diurno' ? '7h30 – 17h30' : '17h30 – 3h30'}
            </p>
          </div>
          <Field label="Cargo" value={form.cargo} onChange={(v) => set('cargo', v)} placeholder="Ex: Pintor" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg)" value={form.peso} onChange={(v) => set('peso', v)} placeholder="70" inputMode="decimal" />
            <Field label="Altura (cm)" value={form.altura} onChange={(v) => set('altura', v)} placeholder="175" inputMode="decimal" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', inputMode,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-base font-medium outline-none focus:border-primary"
      />
    </label>
  );
}
