// Server functions: gestão de contas administrativas
// Apenas usuários com role admin podem criar/atualizar outros admins.
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  if (error || !data) throw new Error('Acesso negado');
}

export const listarAdmins = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: roles } = await supabaseAdmin
      .from('user_roles').select('user_id').eq('role', 'admin');
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return { admins: [] };
    const { data: profiles } = await supabaseAdmin
      .from('profiles').select('id, nome, matricula').in('id', ids);
    // pega email
    const out = await Promise.all((profiles ?? []).map(async (p) => {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(p.id);
      return { id: p.id, nome: p.nome, matricula: p.matricula, email: u.user?.email ?? '' };
    }));
    return { admins: out };
  });

export const criarAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    email: z.string().email(),
    senha: z.string().min(8).max(72),
    nome: z.string().min(2).max(120),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.senha, email_confirm: true,
      user_metadata: { nome: data.nome, matricula: 'ADM-' + data.email.split('@')[0], role: 'admin' },
    });
    if (error || !created.user) throw new Error(error?.message ?? 'Falha ao criar');
    // garante role admin (handle_new_user já cria com role admin via metadata)
    await supabaseAdmin.from('user_roles').upsert({ user_id: created.user.id, role: 'admin' });
    return { id: created.user.id };
  });

export const trocarSenhaAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    userId: z.string().uuid(),
    novaSenha: z.string().min(8).max(72),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.novaSenha });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removerAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error('Você não pode remover a si mesmo');
    await supabaseAdmin.from('user_roles').delete().eq('user_id', data.userId).eq('role', 'admin');
    return { ok: true };
  });
