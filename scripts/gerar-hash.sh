#!/usr/bin/env bash
# Canteiro Saudável™ — Gerador de prova de integridade (SHA-256)
# Copyright (c) 2026 — Todos os direitos reservados.
#
# Uso:   bash scripts/gerar-hash.sh
# Saída: HASHES.txt na raiz do projeto, com data UTC e hash de cada arquivo
#        rastreado pelo Git (exceto node_modules, .output, dist).
#
# Boa prática: após gerar, registre o HASHES.txt + LICENSE em:
#   - commit Git assinado (GPG)
#   - e-mail para você mesmo (timestamp do provedor)
#   - opcionalmente, cartório (autenticação notarial)

set -euo pipefail

cd "$(dirname "$0")/.."

OUT="HASHES.txt"
TS_UTC="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
GIT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'sem-git')"

{
  echo "# Canteiro Saudável™ — Prova de Integridade"
  echo "# Gerado em (UTC): ${TS_UTC}"
  echo "# Commit Git:      ${GIT_COMMIT}"
  echo "# Algoritmo:       SHA-256"
  echo "# ---------------------------------------------------------------"
} > "${OUT}"

# Lista arquivos rastreados pelo Git (ignora node_modules, .output, etc.)
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FILES=$(git ls-files)
else
  # Fallback: tudo exceto pastas pesadas
  FILES=$(find . -type f \
    -not -path './node_modules/*' \
    -not -path './.output/*' \
    -not -path './dist/*' \
    -not -path './.git/*' \
    -not -path './.vinxi/*' \
    | sed 's|^\./||')
fi

# Gera hash de cada arquivo
echo "${FILES}" | while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  sha256sum "$f" >> "${OUT}"
done

# Hash final do próprio HASHES.txt (sem a última linha, para evitar self-reference)
FINAL_HASH=$(sha256sum "${OUT}" | awk '{print $1}')
{
  echo "# ---------------------------------------------------------------"
  echo "# Hash agregador (SHA-256 deste arquivo): ${FINAL_HASH}"
} >> "${OUT}"

echo "✔ ${OUT} gerado com $(wc -l < "${OUT}") linhas."
echo "  Commit Git: ${GIT_COMMIT}"
echo "  Timestamp:  ${TS_UTC}"
echo ""
echo "Próximos passos:"
echo "  1) git add LICENSE README.md HASHES.txt scripts/gerar-hash.sh"
echo "  2) git commit -S -m 'chore: prova de autoria — ${TS_UTC}'"
echo "  3) git push  # cria timeline pública verificável"
