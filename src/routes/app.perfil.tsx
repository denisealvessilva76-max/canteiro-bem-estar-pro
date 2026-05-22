import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, LogOut, IdCard, Clock, Phone, Check, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AvatarCapacete } from "@/components/AvatarCapacete";
import { nivelPorPontos, NIVEIS, proximoNivel } from "@/lib/gamificacao";

export const Route = createFileRoute("/app/perfil")({
  component: Perfil,
});

const AVATARS = ['👷', '👷‍♀️', '🧑‍🔧', '👨‍🏭', '🦺', '🧑‍🌾', '👨‍🔧', '👩‍🏭', '🧑‍🚒', '👨‍🌾'];

function Perfil() {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [telefone, setTelefone] = useState((profile as { telefone?: string } | null)?.telefone ?? '');
  const [savingTel, setSavingTel] = useState(false);

  const { data: medalhas } = useQuery({
    queryKey: ['medalhas', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('user_conquistas')
        .select('id, conquistado_em, conquistas(codigo, titulo, descricao, icone, pontos)')
        .eq('user_id', profile!.id);
      return data ?? [];
    },
  });

  const { data: estresseHist } = useQuery({
    queryKey: ['estresse-hist', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('estresse_logs')
        .select('nivel, semana')
        .eq('user_id', profile!.id)
        .order('semana', { ascending: false })
        .limit(8);
      return (data ?? []).reverse();
    },
  });

  if (!profile) return null;

  async function logout() {
    await signOut();
    void navigate({ to: '/' });
  }

  async function escolherAvatar(idx: number) {
    if (!profile) return;
    setSavingAvatar(true);
    await supabase.from('profiles').update({ avatar_id: idx + 1, avatar_url: null }).eq('id', profile.id);
    await refreshProfile();
    setSavingAvatar(false);
    toast.success('Avatar atualizado');
  }

  async function enviarFoto(file: File) {
    if (!profile) return;
    if (file.size > 5_000_000) { toast.error('Foto muito grande (máx 5MB)'); return; }
    setUploadingFoto(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { toast.error('Erro no upload: ' + upErr.message); setUploadingFoto(false); return; }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    await refreshProfile();
    setUploadingFoto(false);
    toast.success('Foto de perfil atualizada!');
  }

  async function salvarTelefone() {
    if (!profile) return;
    setSavingTel(true);
    await supabase.from('profiles').update({ telefone: telefone.trim() }).eq('id', profile.id);
    await refreshProfile();
    setSavingTel(false);
    toast.success('WhatsApp salvo');
  }

  const atualIdx = (profile.avatar_id ?? 1) - 1;
  const fotoUrl = (profile as { avatar_url?: string | null }).avatar_url;

  return (
    <div className="px-5 pb-8 pt-6">
      <Link to="/app/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Início
      </Link>

      <div className="mt-6 rounded-3xl bg-gradient-primary p-6 text-center text-primary-foreground shadow-elevated">
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto de perfil" className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-white/40" />
        ) : (
          <div className="text-7xl">{AVATARS[atualIdx] ?? '👷'}</div>
        )}
        <h1 className="mt-3 text-xl font-extrabold">{profile.nome}</h1>
        <p className="text-sm opacity-85">{profile.cargo ?? 'Trabalhador'}</p>
        <div className="mt-4 flex justify-center gap-3 text-xs">
          <div className="flex items-center gap-1"><IdCard className="h-3.5 w-3.5" /> {profile.matricula}</div>
          <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {profile.turno}</div>
        </div>
        <label className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/20 px-4 text-xs font-bold backdrop-blur">
          <Camera className="h-4 w-4" /> {uploadingFoto ? 'Enviando…' : (fotoUrl ? 'Trocar foto' : 'Enviar foto real')}
          <input type="file" accept="image/*" capture="user" className="hidden" disabled={uploadingFoto}
            onChange={(e) => e.target.files?.[0] && enviarFoto(e.target.files[0])} />
        </label>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5">
        <h2 className="text-base font-bold">Seu capacete</h2>
        <div className="mt-3 flex items-center gap-4">
          <AvatarCapacete pontos={profile.pontos_acumulados} nome={profile.nome} size="lg" showProgress />
          <div className="flex-1 text-sm">
            {(() => {
              const n = nivelPorPontos(profile.pontos_acumulados);
              const info = NIVEIS[n];
              const { proximo, faltam } = proximoNivel(profile.pontos_acumulados);
              return (
                <>
                  <p className="font-bold" style={{ color: info.cor }}>Nível {info.label} {info.emoji}</p>
                  {proximo ? (
                    <p className="text-xs text-muted-foreground">Faltam <b>{faltam} pts</b> para o capacete {NIVEIS[proximo].label} {NIVEIS[proximo].emoji}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nível máximo atingido. Lenda do canteiro! 💎</p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {estresseHist && estresseHist.length > 0 && (
        <div className="mt-5 rounded-3xl border border-border bg-card p-5">
          <h2 className="text-base font-bold">Termômetro de estresse</h2>
          <p className="text-xs text-muted-foreground">Últimas {estresseHist.length} semanas</p>
          <div className="mt-3 flex items-end gap-1.5">
            {estresseHist.map((e, i) => {
              const cor = e.nivel >= 4 ? 'bg-red-500' : e.nivel === 3 ? 'bg-yellow-500' : 'bg-emerald-500';
              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`${cor} rounded-md`} style={{ height: `${e.nivel * 14}px` }} />
                  <p className="mt-1 text-[9px] text-muted-foreground">{(e.semana as string).slice(5)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

        <>
          <h2 className="mt-7 text-base font-bold">🏅 Minhas medalhas</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {medalhas.map((m) => {
              const c = (m as { conquistas: { titulo: string; icone: string | null; descricao: string | null } | null }).conquistas;
              if (!c) return null;
              return (
                <div key={m.id} className="rounded-2xl border border-accent/30 bg-accent/5 p-3 text-center" title={c.descricao ?? ''}>
                  <div className="text-3xl">{c.icone ?? '🏅'}</div>
                  <p className="mt-1 text-[10px] font-bold leading-tight">{c.titulo}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className="mt-7 text-base font-bold">Escolha seu avatar</h2>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {AVATARS.map((a, i) => (
          <button
            key={i}
            disabled={savingAvatar}
            onClick={() => escolherAvatar(i)}
            className={`relative flex aspect-square items-center justify-center rounded-2xl border-2 text-3xl transition ${
              i === atualIdx ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            {a}
            {i === atualIdx && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>

      <h2 className="mt-7 text-base font-bold">WhatsApp</h2>
      <p className="text-xs text-muted-foreground">Para que a equipe de saúde entre em contato quando necessário.</p>
      <div className="mt-2 flex gap-2">
        <input
          value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="numeric"
          placeholder="(31) 9XXXX-XXXX"
          className="h-12 flex-1 rounded-2xl border-2 border-input bg-card px-4 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={salvarTelefone} disabled={savingTel}
          className="flex h-12 items-center gap-1 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          <Phone className="h-4 w-4" /> Salvar
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-primary">{profile.pontos_acumulados}</div>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-accent">{profile.ofensiva_dias}</div>
          <p className="text-xs text-muted-foreground">Dias seguidos</p>
        </div>
      </div>

      <h2 className="mt-7 text-base font-bold">Mais</h2>
      <div className="mt-3 space-y-2">
        <Link to="/app/ranking" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🏆 Ranking</span><span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/app/recompensas" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🎁 Recompensas</span><span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/app/avisos" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🔔 Avisos</span><span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/app/mental" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="font-medium">🧠 Saúde Mental</span><span className="text-muted-foreground">›</span>
        </Link>
      </div>

      <button
        onClick={logout}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-card font-bold text-destructive"
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    </div>
  );
}
