#!/usr/bin/env bash
# Roda a suíte inteira: sobe um servidor estático na raiz do repositório,
# executa cada teste em ordem e derruba o servidor no fim.
#
#   tools/testes/rodar.sh            # tudo
#   tools/testes/rodar.sh 1 5        # só o 1 e o 5
#
# Sai com 0 se tudo passou.
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"
PORTA="${MW_PORTA:-8795}"
export MW_URL="${MW_URL:-http://127.0.0.1:$PORTA}"
export MW_SAIDA="${MW_SAIDA:-$RAIZ/tools/testes/saida}"

# --- Playwright ------------------------------------------------------------
# A resolução de ESM não olha o NODE_PATH, então um Playwright instalado
# globalmente não é enxergado por um "import 'playwright'". Se não houver
# cópia local, aponta a global para dentro do node_modules (que é ignorado
# pelo git, então isto não suja o repositório).
if [ ! -d node_modules/playwright ]; then
  GLOBAL="$(npm root -g 2>/dev/null)"
  if [ -n "$GLOBAL" ] && [ -d "$GLOBAL/playwright" ]; then
    echo "· usando o Playwright global de $GLOBAL"
    mkdir -p node_modules
    ln -sfn "$GLOBAL/playwright" node_modules/playwright
    [ -d "$GLOBAL/playwright-core" ] && ln -sfn "$GLOBAL/playwright-core" node_modules/playwright-core
  else
    echo "Playwright não encontrado. Rode:  npm install" >&2
    exit 1
  fi
fi

# --- servidor --------------------------------------------------------------
if curl -s -o /dev/null --max-time 2 "$MW_URL/index.html"; then
  echo "· servidor já de pé em $MW_URL"
  MEU_SERVIDOR=""
else
  echo "· subindo servidor estático em $MW_URL"
  python3 -m http.server "$PORTA" --bind 127.0.0.1 >/dev/null 2>&1 &
  MEU_SERVIDOR=$!
  for _ in $(seq 1 40); do
    curl -s -o /dev/null --max-time 1 "$MW_URL/index.html" && break
    sleep 0.25
  done
fi
derruba(){ [ -n "$MEU_SERVIDOR" ] && kill "$MEU_SERVIDOR" 2>/dev/null; }
trap derruba EXIT

mkdir -p "$MW_SAIDA"

# --- testes ----------------------------------------------------------------
# nome | comando
declare -a NOMES=(
  "1 regressão · desktop"
  "1 regressão · mobile"
  "2 carga · 1440/834/390"
  "3 acessibilidade"
  "4 boot · flash branco"
  "5 android · toque real"
  "6 iphone · 393x695"
  "7 contraste · coleta + medida"
  "8 estrutura · IDs e rótulos"
  "9 criação · todos os caminhos"
  "10 offline · service worker"
  "11 dados · criar, editar, excluir"
  "12 teclado · operar sem mouse"
  "13 design system · isolado e inerte"
  "14 suporte · área migrada"
  "15 área · estrutura das seis coleções"
  "16 ajustes · as oito áreas que não são coleção"
  "17 entrada · login e cadastro"
  "18 pele · quem veste (RELATÓRIO, não reprova)"
  "19 contraste · tela de entrada"
  "20 navegação · lateral, baixo e topo"
  "21 acento · a matriz tema × cor (§45)"
)
declare -a CMDS=(
  "node tools/testes/1-regressao.mjs"
  "node tools/testes/1-regressao.mjs mobile"
  "node tools/testes/2-carga.mjs"
  "node tools/testes/3-acessibilidade.mjs"
  "node tools/testes/4-boot.mjs"
  "node tools/testes/5-android-toque.mjs"
  "node tools/testes/6-iphone-tamanho.mjs"
  "for l in 1440 834 390; do for t in dark light; do node tools/testes/7-contraste-coleta.mjs \$l \$t || exit 1; done; done; python3 tools/testes/7-contraste-medir.py"
  "node tools/testes/8-estrutura.mjs"
  "node tools/testes/9-criacao.mjs"
  "node tools/testes/10-offline.mjs"
  "node tools/testes/11-dados.mjs"
  "node tools/testes/12-teclado.mjs"
  "node tools/testes/13-ds.mjs && python3 tools/testes/7-contraste-medir.py"
  "node tools/testes/14-suporte.mjs && node tools/ds/quem-vence.mjs support claro | tail -3 && node tools/ds/quem-vence.mjs support escuro | tail -3"
  "for a in institutions subjects projects activities notes; do node tools/testes/15-area.mjs \$a || exit 1; done; node tools/ds/quem-vence.mjs institutions claro | tail -3 && node tools/ds/quem-vence.mjs institutions escuro | tail -3"
  "for a in profile settings college reports focus calendar home files; do node tools/testes/16-ajustes.mjs \$a || exit 1; done; for a in profile settings college reports focus calendar home files; do for t in claro escuro; do node tools/ds/quem-vence.mjs \$a \$t | sed -n 2p; done; done"
  "node tools/testes/17-login.mjs && node tools/ds/quem-vence.mjs login claro | sed -n 2p && node tools/ds/quem-vence.mjs login escuro | sed -n 2p"
  # 18 NÃO REPROVA — e isso é deliberado, não desleixo.
  #
  # O `quem-veste` responde: dos elementos que carregam classe `ds-*`,
  # quantos estão sendo pintados por quem NÃO é o sistema? Enquanto o
  # método das GUARDAS esteve em vigor ele marcava zero — mas era um zero
  # falso: media "a regra antiga foi DESLIGADA ali", não "o sistema pinta
  # isto agora". A Etapa 0 desfez as guardas e o número voltou ao que
  # sempre foi de verdade.
  #
  # Voltar a tratá-lo como portão teria uma só saída: repor as guardas —
  # exatamente o método que quebrou o layout em 263 regras. Então ele
  # RELATA. O número aparece no log a cada rodada, área por área, e o
  # trabalho da migração é fazê-lo cair. Quando chegar a zero por
  # substituição de verdade, volta a ser portão.
  "for a in login lateral topo baixo home files profile settings college reports focus calendar institutions subjects projects activities notes support; do for t in escuro claro; do printf '%-14s %-7s ' \$a \$t; printf '%s regra(s) legada(s) vestindo peça do sistema\\n' \$(node tools/ds/quem-veste.mjs \$a \$t | grep -c ' :: ' || true); done; done; true"
  "for l in 1440 834 390; do for t in dark light; do node tools/testes/7b-contraste-login.mjs \$l \$t || exit 1; done; done; python3 tools/testes/7-contraste-medir.py"
  "for m in desktop celular instalado; do node tools/testes/20-navegacao.mjs \$m || exit 1; done; for a in lateral topo baixo; do for t in claro escuro; do node tools/ds/quem-vence.mjs \$a \$t | sed -n 2p || exit 1; done; done"
  "node tools/testes/21-acento.mjs"
)

SO_ESTES=("$@")
FALHOU=0
RESUMO=()

for i in "${!NOMES[@]}"; do
  n="${NOMES[$i]}"
  num="${n%% *}"
  if [ ${#SO_ESTES[@]} -gt 0 ]; then
    escolhido=0
    for s in "${SO_ESTES[@]}"; do [ "$s" = "$num" ] && escolhido=1; done
    [ $escolhido -eq 0 ] && continue
  fi
  echo
  echo "════════ $n ════════"
  # Subshell, e não `eval` cru: vários comandos desta lista são laços com
  # `|| exit 1` dentro. Como o eval roda no MESMO shell, esse `exit`
  # encerrava o rodar.sh no meio — sem resumo, sem derrubar o servidor, e
  # com a última linha do log parecendo um teste que passou. Custou uma
  # execução inteira de 25 minutos para aparecer.
  if ( eval "${CMDS[$i]}" ); then RESUMO+=("  ok      $n")
  else RESUMO+=("  FALHOU  $n"); FALHOU=1; fi
done

echo
echo "════════ resumo ════════"
printf '%s\n' "${RESUMO[@]}"
[ $FALHOU -eq 0 ] && echo "tudo passou" || echo "há falha(s) acima"
exit $FALHOU
