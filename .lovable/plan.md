# Plano de execução — Canteiro Saudável

## ✅ Onda 1 — Bugs críticos + Acesso interno (CONCLUÍDA)
- Código da empresa `00345` no cadastro
- Respiração não bloqueia em "Preparando voz..."
- Hidratação mostra erro real
- Desafios multi-dia sem auto-completar
- `insertOrQueue` retorna erro real (não engole RLS)

## ✅ Onda 2 — Gamificação + Perfil (CONCLUÍDA)
- Foto real de perfil (bucket `avatars`)
- Pódio + filtro Pontos/Ofensiva no ranking
- Imagens em recompensas (bucket `recompensas-imagens`)
- Triggers automáticos para medalhas (checkin_7, hidrata_7, alongou_5, desafio_1)

## ✅ Onda 3 — Push + Reporte de bug + Offline (CONCLUÍDA)
- Service Worker `/sw.js` registrado automaticamente
- Notificações locais (água, alongamento, escovação, check-in) — banner pede permissão
- Push subscription tabela criada (`push_subscriptions`) — quando VAPID configurado, ativa Web Push real
- Botão flutuante "Reportar bug" em todas as telas → `reportes_bug`
- Admin: `/admin/bugs` lista e resolve reportes
- Indicador de "X ações aguardando" + botão sincronizar

## ✅ Onda 4 — Saúde da Mulher + Odontologia (CONCLUÍDA)
- `/app/mulher`: calendário de ciclo, próximo período estimado, educação, lista de UBS/clínicas
- `/app/odonto`: 3 escovações/dia com check, dicas, clínicas
- `/admin/clinicas`: CRUD de UBS e clínicas (tipos: ubs / mulher / odonto / clinica)
- Notificações 3x/dia para escovação (08:30, 13:00, 21:00)

## ⏳ Pendências menores
- **GIFs animados de alongamento**: ainda usando imagens estáticas. Próxima onda pode gerar GIFs com IA ou usar biblioteca livre.
- **Push real (servidor)**: subscription pronta, falta gerar par VAPID + server function para enviar. Notificações locais já funcionam.
- **ElevenLabs**: aguardando teste no celular pra ver se voz toca após as correções.
