
# Canteiro Saudável — v1.0

App PWA mobile-first para trabalhadores + painel admin desktop para a equipe de saúde ocupacional, com Supabase, gamificação e operação offline com sincronização.

## Identidade visual (vou criar)

- **Paleta**: branco `#FFFFFF`, verde-claro `#D7F2DC`, verde vivo `#1FB04A` (primário), verde escuro `#0E5A2A`, laranja vivo `#FF8A1F` (acento/CTA), cinza neutro.
- **Tom**: acolhedor, alto contraste, botões grandes (mínimo 56px) pensando em uso com EPI/luvas, ícones generosos, tipografia legível (Inter para corpo, Plus Jakarta Sans para títulos).
- **Mobile-first**: layout em coluna única, navegação inferior com 5 abas (Início, Hidratação, Saúde, Desafios, Perfil). Painel admin = layout desktop com sidebar.

## Arquitetura

- **Stack**: TanStack Start (já configurado) + Tailwind + shadcn + Supabase (Cloud) + framer-motion.
- **Auth custom matrícula+senha**: tabela `users` com `senha_hash` (bcrypt via Edge Function/server fn). Sessão guardada em cookie httpOnly server-side + perfil no contexto React. Admin login separado (mesmo fluxo, role=admin).
- **Offline-first**: IndexedDB (via `idb`) guarda fila de mutações pendentes (check-in, hidratação, sintomas, pressão, fotos de desafios). Worker de sincronização envia lote para Supabase quando `navigator.onLine`. Reads críticos cacheados via TanStack Query com persister.
- **PWA**: manifest + service worker (Workbox) com guard contra iframe Lovable.

## Schema Supabase

Conforme spec do usuário, com pequenos ajustes:
- `profiles` (id=auth-or-uuid, nome, matricula UNIQUE, senha_hash, role, turno, cargo, grupo_risco, peso, altura, exposicao_sol, pontos_acumulados, ofensiva_dias, ultimo_checkin, avatar_id, primeiro_acesso)
- `checkin_diario`, `hidratacao_logs`, `saude_logs` (pressão + sintomas), `desafios`, `progresso_desafios`, `alertas`, `avisos`, `recompensas`, `resgates`, `conquistas`, `user_conquistas`, `parametros` (regras parametrizáveis: pontos, metas).
- RLS: trabalhador só lê/escreve as próprias linhas; admin lê tudo via role check usando tabela `user_roles` separada (padrão de segurança).
- Storage bucket `desafios-fotos` (privado, signed URLs).

## Módulos a entregar

### App Trabalhador (mobile)
1. **Onboarding/Login**: cadastro com matrícula única, senha, turno, peso, altura. Tutorial passo-a-passo no 1º acesso.
2. **Home**: saudação contextual, pontos, ofensiva (chama de fogo), resumo da semana, ações rápidas.
3. **Check-in diário**: emojis de humor + motivo se ruim. +pontos.
4. **Hidratação**: meta calculada (peso × 35ml + ajustes calor/sol/exposição), botões 150/250/300/1000ml, garrafa animada enchendo, escala visual cor de urina (8 níveis) com mensagens.
5. **Saúde**: registro de pressão com classificação automática (Diretriz 2025) + alerta automático ao admin se ≥140/90; sintomas (Costas/Ombros/Cabeça/Outros).
6. **Ergonomia**: ginástica laboral guiada com timer + GIF + áudio TTS, biblioteca de posturas.
7. **Saúde Mental**: SOS CVV 188 (tel:), WhatsApp psicóloga, respiração 4-7-8 com animação círculo expandindo.
8. **Desafios**: lista, aceitar, registrar progresso, upload de foto (galeria/câmera).
9. **Avisos**: feed por categoria com cores, status de leitura.
10. **Ranking/Conquistas/Recompensas**: pódio top 3, lista, loja com resgate.
11. **Perfil**: dados, avatar selecionável, logout.

### Painel Admin (desktop)
1. **Dashboard**: cards (ativos, check-ins do dia, hidratação média, alertas críticos), feed em tempo real (Supabase Realtime), gráficos.
2. **Funcionários**: tabela com filtros, destaque vermelho para sintomas/pressão alta.
3. **Alertas**: lista de alertas críticos, marcar resolvido.
4. **Gestão**: CRUD de desafios, recompensas, avisos. Validação de fotos enviadas.
5. **Parâmetros**: ajustar pontuação e metas.

## Detalhes técnicos

- **Cálculo hidratação**: `peso × 35ml + (exposicao_sol ? 500 : 0) + (calor_dia ? 500 : 0)`. Parametrizável.
- **Pontos** (defaults parametrizáveis): check-in=10, registro hidratação=2, meta hidratação=20, pressão=5, alongamento=15, foto desafio=30, conclusão desafio=pontos_recompensa.
- **Conquistas**: triggers SQL após inserts (ex: 30 dias hidratado = "Mestre da Hidratação").
- **Realtime**: admin assina canais de `alertas` e `saude_logs` para feed ao vivo.
- **Server fns**: `signupWorker`, `loginWorker`, `loginAdmin`, `syncBatch` (recebe fila offline), `validatePhoto`.

## Ordem de implementação

1. Habilitar Lovable Cloud (Supabase) + criar schema completo + RLS + seeds (desafios, avisos, recompensas).
2. Design system completo em `src/styles.css` + tokens semânticos + componentes base (Button hero/grande, Card acolhedor, BottomNav).
3. Auth custom (server fns + contexto + rotas guardadas).
4. App trabalhador — Home, Check-in, Hidratação, Saúde (núcleo crítico).
5. App trabalhador — Ergonomia, Mental, Desafios, Avisos, Ranking, Perfil.
6. PWA + offline-first (IndexedDB + sync queue + service worker).
7. Painel admin — Dashboard, Funcionários, Alertas, Gestão.
8. QA: testar fluxos principais, ajustar.

## Fora do escopo da v1.0 (para iterações futuras)

- Notificações push reais (deixarei estrutura, mas push browser exige config extra).
- Cálculo dinâmico de calor por API meteorológica (uso flag manual + valor padrão alto pra Canaã dos Carajás).
- Vídeos longos de ergonomia (uso GIFs + texto, links externos preparados).
- Integração WhatsApp Business (uso `https://wa.me/` simples).
- Mapa de recursos de saúde mental (lista textual primeiro).

Aprova esse plano? Posso começar pela ativação do Supabase + schema + design system.
