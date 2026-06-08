# Plano de execução — Canteiro Saudável

## ✅ Ondas 1-2 concluídas
Bugs críticos, gamificação, fotos de perfil, pódio, recompensas, triggers automáticos.

## ✅ Onda 3 — Push + Reporte + Offline (CONCLUÍDA)
SW, notificações locais, push subscriptions, reporte de bug, indicador offline.

## ✅ Onda 4 — Saúde da Mulher + Odontologia (CONCLUÍDA)
Ciclo, próximo período, UBS/clínicas, 3 escovações/dia.

## ✅ Onda 5 — Lembretes por turno (CONCLUÍDA)
Cron pg_cron com `turno` (diurno/noturno/todos), janelas específicas por turno.

## ✅ Onda 6 — Clima reativo + Dente virtual + Triagem admin (CONCLUÍDA)
Header muda com calor, hidratação automática +250/+500ml, dente SVG, "Sorriso de sexta", macro WhatsApp.

## ✅ Onda 7 — Squads + Mural + CSV matrículas (CONCLUÍDA)
Tabelas `squads`, `mural_aplausos`, `matriculas_autorizadas`, ranking per capita, import CSV.

## ✅ Onda 8 — Polish visual + Relatório PDF (CONCLUÍDA)
- `LevelUpToast` celebra mudança bronze→prata→ouro→diamante com animação framer
- Exportação PDF do relatório mensal (jspdf + autotable) com KPIs, agregação por função e lista pessoal

## ✅ Onda 9 — Biometria / login rápido (CONCLUÍDA)
- `src/lib/biometria.ts` via Credential Management API (PasswordCredential)
- Login mostra botão "Entrar com digital / Face ID" em celulares compatíveis
- Cadastro salva credencial automaticamente para próximo acesso por biometria
- Inputs marcados com `autocomplete="username|current-password webauthn"`

## ⏳ Pendências adiadas (dependem de assets externos)
- **Áudio-guias narrados**: aguardando MP3s do RH.
- **GIFs de alongamento**: aguardando arte animada.
