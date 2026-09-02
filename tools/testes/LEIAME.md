# Testes do Mateus Workspace

Suíte de Playwright que roda o app de verdade num navegador de verdade e
mede o resultado. Não há teste unitário aqui: o app é um arquivo único com
todo o CSS e o JS embutidos, e os defeitos que ele produz são de
renderização — texto ilegível, botão espremido, elemento fora da tela,
tela branca no boot. Nenhum deles aparece lendo o código; todos aparecem
medindo o pixel.

## Como rodar

```bash
tools/testes/rodar.sh          # a suíte inteira
tools/testes/rodar.sh 1 5      # só os testes 1 e 5
```

O script sobe sozinho um servidor estático na raiz do repositório
(`python3 -m http.server 8795`), roda os testes e derruba o servidor no
fim. Se já houver um servidor no ar, ele reaproveita.

Sai com **0** se tudo passou. Cada teste também pode ser chamado direto:

```bash
node tools/testes/1-regressao.mjs mobile
```

### Dependências

- **Node 18+** e **Playwright**. Se não houver `node_modules/playwright`, o
  `rodar.sh` aponta a instalação global para dentro do `node_modules`
  (que é ignorado pelo git). Numa máquina limpa: `npm install`.
- **Python 3 + Pillow**, só para o teste 7 (a medição de contraste).

### Variáveis

| Variável | Para quê | Padrão |
|---|---|---|
| `MW_PORTA` | porta do servidor estático | `8795` |
| `MW_URL` | endereço do app | `http://127.0.0.1:$MW_PORTA` |
| `MW_CHROME` | caminho do binário do Chromium | detectado em `/opt/pw-browsers` |
| `MW_SAIDA` | onde caem fotos e JSON | `tools/testes/saida/` (ignorado pelo git) |

## O que cada teste faz

| # | Arquivo | O que mede | Falha quando |
|---|---|---|---|
| 1 | `1-regressao.mjs` | as 14 áreas abrem, ficam ativas, não vazam para fora da tela | qualquer área não abre, vaza ou levanta exceção |
| 2 | `2-carga.mjs` | o mesmo, com 24 disciplinas, 30 projetos, 120 atividades, 40 notas e 140 sessões, em 1440/834/390 | vazamento, texto cortado sem reticências, exceção |
| 3 | `3-acessibilidade.mjs` | nome acessível, alvo de toque ≥24px, `aria-*` em elemento que aceita, campo com rótulo, anel de foco | qualquer controle sem nome, rótulo ou anel |
| 4 | `4-boot.mjs` | luminância do centro da tela a cada 120ms durante a abertura | um único quadro quase branco, ou o boot terminando na tela errada |
| 5 | `5-android-toque.mjs` | Pixel 7 com `hasTouch`: arrastar cartão do quadro com o dedo, tocar nos controles novos, anexar arquivo | o cartão não se move, um alvo some, vazamento |
| 6 | `6-iphone-tamanho.mjs` | o viewport **real** de um iPhone (393×695) contra o nominal (390×844) | vazamento, ou controle escondido atrás da barra de baixo |
| 7 | `7-contraste-coleta.mjs` + `7-contraste-medir.py` | razão de contraste WCAG medida **no pixel**, em 3 larguras × 2 temas | qualquer texto abaixo de 4.5:1 (3.0:1 se grande) |

### Por que o contraste é medido em duas etapas

As superfícies deste app são gradiente sobre translucidez sobre gradiente.
`getComputedStyle` devolve a *declaração* — muitas vezes `transparent` — e
não a cor que o olho recebe. Medir pelo CSS aqui produz números
inventados. Então o `.mjs` fotografa e anota as caixas, e o `.py` abre as
fotos e conta os pixels. Um texto dentro de um elemento com preenchimento
próprio (um botão, um chip) é medido contra o **miolo** desse
preenchimento, não contra o que está atrás dele.

## Armadilhas que estes testes já pisaram

Cada uma custou uma sessão de depuração; estão comentadas no código, e
resumidas aqui para quem for escrever um teste novo.

- **Semear depois de navegar não funciona.** O `persistWorkspace()` do
  `beforeunload` da página anterior grava a cópia velha em memória por
  cima da semente. Semear no `addInitScript`, antes do primeiro `goto`.
- **O app apaga o localStorage uma vez por navegador.** Num perfil novo —
  que é o que todo teste usa — essa limpeza sempre dispara e come a
  semente. Marcar `mwZerarTudo-2026-08-e = '1'` é o que um navegador de
  verdade já traria.
- **Elemento além da dobra dentro de um container que rola na horizontal
  não é vazamento.** Sem essa exceção, o quadro de projetos e o calendário
  acusam falha justamente por funcionarem como devem.
- **Medir área escondida dá zero.** Altura, largura e `scrollHeight` de um
  elemento em `display:none` são 0; um teste que não abre a área antes de
  medir aprova qualquer coisa.
- **`-webkit-line-clamp` faz `scrollHeight === clientHeight`.** Para saber
  se um texto está cortado é preciso medir com o corte desligado.
- **`p.dragTo()` emite eventos de mouse.** Num celular o caminho é
  `PointerEvent` de tipo `touch`, que é outro código. O teste 5 monta o
  gesto à mão por isso.

## Onde cada ambiente está validado

O critério de conclusão da reformulação é validar em Safari, Chrome, iOS,
Android, tablet e desktop. Esta é a situação real, sem arredondar:

| Ambiente | Estado | Por qual evidência |
|---|---|---|
| **Chrome / desktop** | medido | testes 1, 2, 3, 4, 7 em 1440px |
| **Tablet** | medido | teste 2 em 834px |
| **Android** | medido | teste 5, Pixel 7 com toque real — o Chrome do Android é o mesmo motor |
| **iOS — tamanho** | medido | teste 6, no viewport 393×695 que o próprio aparelho reportou |
| **iOS — motor (Safari/WebKit)** | **medido uma vez, fora daqui** | relatório do painel de Diagnóstico rodado num iPhone com iOS 18.7 / Safari 27: `backdrop-filter`, `color-mix`, `:has()`, `line-clamp`, `aspect-ratio`, localStorage e IndexedDB todos funcionando |
| **Safari desktop** | **não medido** | não há WebKit nesta máquina |
| **iOS instalado na tela de início (standalone)** | **não medido** | precisa de um aparelho de verdade |

**Por que o WebKit não é testável aqui:** `npx playwright install webkit`
falha com 403 no proxy desta máquina — o host de download
(`playwright.download.prss.microsoft.com`) é barrado. Não é limitação da
suíte; é da rede. O que existe em `/opt/pw-browsers` é só Chromium.

**O que fecha as duas linhas que faltam:** abrir o app num Mac (Safari) e
num iPhone com o app instalado na tela de início, e rodar em cada um o
painel **Configurações › Diagnóstico do aparelho**, que reporta exatamente
o que a tabela acima precisa saber. Foi assim que a linha do iOS deixou de
ser suposição.
