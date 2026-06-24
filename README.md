# Canteiro Saudável™

> Plataforma de bem-estar ocupacional e mitigação de custos ocultos com
> absenteísmo na construção civil pesada — concebida para o contrato pleno
> de **1.500 colaboradores fixos** da MIP Engenharia (Pará).

**Copyright © 2026 — Canteiro Saudável™ / Idealizador e Autor Original do PDI.**
Todos os direitos reservados. Ver [`LICENSE`](./LICENSE).

---

## 1. Resumo executivo

Canteiro Saudável é um PWA (Progressive Web App) corporativo que combina:

- **Gamificação clínica** (hidratação, saúde mental, odontologia, ergonomia,
  saúde da mulher) com saturação calibrada de **95 a 120 pontos/dia** para
  evitar farming do catálogo de brindes;
- **Check-in de hidratação via QR Code geocercado**, limitado a **5
  validações/dia/colaborador**, com anti-fraude por GPS no perímetro da obra;
- **Dashboard administrativo** com o gráfico de **Efeito Iceberg de Custos
  Ocultos**, tabela por função operacional (Ajudante, Montador, Mecânico) e
  exportação automática em **PDF/CSV**;
- **Dossiê Financeiro** com a fórmula proprietária de Custo Carregado:
  `Diária Bruta (CCT-PA) × 1,83 (encargos) × 1,5 (hora extra)`, projetando
  exposição de **R$ 5,4 milhões/ano** contra investimento de
  **R$ 76.920/ano** (R$ 51,28 por colaborador/ano).

## 2. Stack técnica

| Camada       | Tecnologia                                                    |
| ------------ | ------------------------------------------------------------- |
| Frontend     | React 19 + TanStack Start v1 (SSR/SSG) + Vite 7               |
| Styling      | Tailwind CSS v4 (tokens semânticos, paleta MIP)               |
| Roteamento   | TanStack Router (file-based, type-safe)                       |
| Estado/Data  | TanStack Query + server functions (`createServerFn`)          |
| Backend      | Lovable Cloud (Postgres + Auth + Storage + Edge)              |
| Segurança    | Row Level Security em todas as tabelas; roles via `has_role`  |
| PWA          | Service Worker próprio, offline-first, push notifications     |
| Deploy       | Cloudflare Workers (edge) via Wrangler                        |

## 3. Decisões de design originais (prova de autoria)

Estas decisões compõem a obra intelectual e são parte do que está protegido
pela [`LICENSE`](./LICENSE):

1. **Modelo Iceberg financeiro** para 1.500 trabalhadores com teto fixo de
   R$ 5,4 Mi (substitui o modelo geométrico Piloto→Escala anterior).
2. **Saturação de pontos 95–120/dia** como mecanismo de proteção do
   catálogo de recompensas — não é arbitrário, é calibrado contra o ROI.
3. **Três personas operacionais canônicas** (Cleiton/B91, Reginaldo/B31,
   Vanderlei/RAC) que demonstram FAP/SAT, escassez de mão de obra
   especializada e produtividade restrita.
4. **Separação rígida** entre `worker` e `admin` (`user_roles` + função
   `has_role` SECURITY DEFINER) para impedir escalonamento de privilégio.
5. **Distribuição do investimento**: 85,6% em brindes locais + 14,4% em
   bolsas EAD — desenhado para reter e qualificar, não apenas premiar.

## 4. Arquitetura de pastas

```
src/
├── routes/          # File-based routing (TanStack)
│   ├── admin.*      # Dashboard administrativo (relatórios, iceberg, etc.)
│   ├── app.*        # App do colaborador (PWA)
│   └── api/public/  # Webhooks e endpoints públicos
├── components/      # UI reutilizável (shadcn + componentes próprios)
│   └── jogos/       # Mecânicas de gamificação
├── lib/             # Server functions (*.functions.ts) e utils
├── integrations/    # Cliente Lovable Cloud (auto-gerado)
└── styles.css       # Design tokens da MIP (laranja + neutros escuros)
```

## 5. Prova de anterioridade

A autoria é comprovada por uma cadeia de evidências:

- **Histórico Git público** com commits assinados (GPG).
- **Hash SHA-256** dos artefatos críticos — gerar com:
  ```bash
  bash scripts/gerar-hash.sh
  ```
  O arquivo `HASHES.txt` resultante deve ser datado e arquivado.
- **Dossiê Financeiro v7** (`.pptx` e `.pdf`) e **Apresentação PDI v20**
  como obras complementares datadas.

## 6. Aviso

Apresentações internas deste material não constituem cessão de direitos.
Qualquer reaproveitamento da arquitetura, do modelo financeiro ou da
combinação de mecânicas aqui descrita exige licenciamento formal.
