# Plano de execução — Canteiro Saudável

Escopo grande demais para um turno. Vou entregar em **4 ondas**. Você aprova esta primeira; conforme cada uma fica pronta e validada no celular, eu sigo para a próxima.

---

## ONDA 1 — Bugs críticos + Acesso interno (este turno)

**Acesso interno com código da empresa `00345`**
- Tela de cadastro passa a exigir o campo "Código da empresa".
- Se ≠ `00345`, cadastro é recusado com mensagem clara.
- Mantém `noindex` + `robots.txt` (já feito) e `disable_signup=false` (auto-cadastro continua, mas barrado pelo código).

**Áudio (narração ElevenLabs) — investigar e consertar**
- Verificar logs do server function `obterNarracao` para descobrir o erro real (chave, bucket público, retorno).
- Garantir que o bucket `narracoes` está acessível e que a URL retornada toca.

**Respiração guiada**
- Diagnosticar e consertar o botão/animação na tela de Saúde Mental.

**Hidratação — calcular e mostrar o consumido vs meta**
- Mostrar "X ml de Y ml" e barra de progresso atualizando ao registrar copo.

**Desafios — fluxo multi-dia correto**
- Após 1ª foto, NÃO marcar como "concluído". Continua "em andamento" até completar `duracao_dias`.
- Mostrar status: "Aguardando validação do dia 1" mas com o calendário liberando o dia seguinte.
- Pontos só liberam quando admin valida cada check-in (já existe coluna `validado`).
- Caminhada saudável: já permite anexar foto — verificar e padronizar.

**Auto-diagnóstico ao abrir o app**
- Página inicial roda 1x em background: testa conexão DB, função de narração, e mostra um banner se algo estiver fora do ar.

---

## ONDA 2 — Gamificação + Perfil

- Pódio (top 3) + lista geral com filtro (pontos / check-ins / hidratação).
- Sistema de títulos/medalhas automático ("Mestre da Hidratação" aos 7 dias seguidos, etc.) — via trigger no banco.
- Foto de perfil real (upload no bucket próprio) substituindo o avatar.
- Anexar fotos/imagens na aba de **Brindes (Recompensas)** — campo `imagem_url` já existe; falta UI de upload no admin.

---

## ONDA 3 — Notificações Push + Reporte de Bug + Offline robusto

- Push web (Service Worker + VAPID). Funciona em Android pleno. iPhone precisa "Adicionar à tela inicial" — vou avisar o usuário na 1ª vez.
- Lembretes diários: login, beber água, alongar.
- Botão "Reportar problema" em todo rodapé → cria registro em `reportes_bug` visível no admin.
- Revisar a fila offline (IndexedDB) e mostrar indicador "X ações aguardando sincronizar".

---

## ONDA 4 — Conteúdo novo: Saúde da Mulher + Odontologia + Alongamentos visuais

- Aba **Saúde da Mulher** (cor-de-rosa): calendário menstrual, diário, conteúdos educativos, lista de UBS/clínicas de Canaã dos Carajás (admin cadastra).
- Aba **Odontologia**: dicas, escovação, sinais de alerta, notificações 3x/dia, lista de clínicas (admin cadastra).
- Substituir imagens de alongamento por **GIFs/ilustrações passo-a-passo** com seta de direção (gerar via IA ou usar biblioteca livre).

---

## O que vou fazer agora (Onda 1)

1. Migração: criar tabela `convite_codigos` simples (ou validação direta no formulário com o código `00345` como secret).
2. Atualizar `src/routes/cadastro.tsx` com campo obrigatório.
3. Investigar logs do ElevenLabs (`obterNarracao`) e ajustar.
4. Consertar respiração guiada em `src/routes/app.mental.tsx`.
5. Ajustar `src/routes/app.hidratacao.tsx` para mostrar progresso.
6. Reescrever lógica em `src/routes/app.desafios.tsx` para multi-dia + validação separada de pontos.
7. Adicionar componente `<HealthCheck />` no `__root.tsx` rodando uma vez por sessão.

**Estimativa:** Onda 1 deve caber neste turno. Ondas 2–4 são turnos separados.

Aprova? Ou quer mudar a ordem das ondas?