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
| 8 | `8-estrutura.mjs` | invariantes do DOM: IDs duplicados, `label[for]` órfão, `aria-labelledby` apontando para o nada | qualquer um deles |
| 9 | `9-criacao.mjs` | os quatro caminhos de criar (o "+ Adicionar" da área, o atalho do painel, o "+" do topo, o "+" da barra de baixo) abrem o **mesmo** formulário | qualquer um deles abrir outro, ou o modal legado voltar |
| 10 | `10-offline.mjs` | instala o service worker de verdade, desliga a rede e recarrega | o app não abrir, os dados sumirem, ou faltar folha de estilo |
| 11 | `11-dados.mjs` | o ciclo completo nas cinco entidades: criar com todos os campos, recarregar, editar sem apagar o resto, excluir o item certo com a lista reordenada | um campo não chegar ao dado, sumir no reload, a edição zerar campos, ou a exclusão pegar o item errado |
| 12 | `12-teclado.mjs` | operar sem mouse: atalho para o conteúdo, Escape fechando formulário e diálogo, Tab preso dentro do modal, foco voltando para quem abriu | qualquer um deles |
| 13 | `13-ds.mjs` | o Design System carrega **sem o app** (galeria, 2 temas × 4 larguras) e está **inerte dentro dele** enquanto nenhuma área foi migrada | o sistema depender de regra legada, ou a folha mexer no app antes da migração |

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
- **`getBoundingClientRect()` inclui transformações; `offsetWidth` não.** O
  `#app` carrega uma mola de scroll que anima sozinha — `matrix(1.00221…)`
  num quadro, `matrix(0.99997…)` no seguinte. Comparar o rect antes e depois
  de mexer no CSS pega essa animação e acusa o CSS por uma diferença de 1%.
  Foi assim que o teste 13 "provou" que o Design System estava vazando no
  app, sendo que ele não encosta em nada. Para comparar LAYOUT, a caixa de
  layout.
- **Comparar dois momentos não é comparar dois estados.** O app continua
  trabalhando entre uma medição e outra (o painel recalcula, o gráfico
  desenha), então "com o CSS" e "sem o CSS" medidos em sequência diferem por
  causa do tempo. O teste 13 mede ligada → desligada → ligada e só acusa o
  que muda e VOLTA — se as duas medições ligadas já discordarem, o ruído é
  maior que o sinal e ele diz isso em vez de acusar.
- **Desde o CSS Nesting, toda `CSSStyleRule` tem um `cssRules`** (vazio, para
  as regras aninhadas). A pergunta clássica "tem `cssRules`? então é regra de
  agrupamento" virou falsa: um contador escrito assim desce em toda regra
  comum e conta zero. O que distingue de verdade é `style.length` — regra
  comum tem declarações, `@layer`/`@media` não têm. Isso fez o teste 13
  reportar 14 regras num arquivo com 189.
- **`aria-modal="true"` não faz nada sozinho.** É uma declaração para a
  tecnologia assistiva, não um comportamento: o navegador não move o
  foco para dentro, não prende o Tab e não fecha no Escape. Onze
  diálogos do app declaravam isso sem implementar nada — quem usa
  teclado abria um diálogo do qual não conseguia sair. Quem implementa é
  o bloco `mw-teclado`, uma vez, para todos.
- **A tela reordena, o array não.** As listas saem em ordem de prazo e de
  semestre, mas Editar e Excluir guardam o índice da posição ORIGINAL no
  array. É por isso que a última parte do teste 11 embaralha as datas de
  propósito antes de excluir: se algum dia a ordenação passar a mexer no
  array, os botões começam a agir no item errado sem avisar.
- **`localhost` não é a mesma coisa que `127.0.0.1`.** O registro do
  service worker exigia `hostname === 'localhost'` e deixava de fora
  `127.0.0.1` e `[::1]`, que a especificação também trata como seguros.
  O efeito era silencioso: servir a pasta em 127.0.0.1 dava um app sem
  service worker nenhum, sem aviso. `window.isSecureContext` responde
  pelos quatro casos.
- **Um controle que "não faz nada" pode estar fazendo a coisa errada.** O
  "+" da barra de baixo abria um formulário de três campos enquanto o
  "+ Adicionar" da mesma entidade abria um de seis. Nada na tela
  denunciava: os dois abriam *um* formulário. É por isso que o teste 9
  compara os campos, não só se abriu algo.
- **Grep no arquivo não serve para achar ID duplicado.** Ele acha `id="x"`
  dentro de comentário de CSS e dentro de string de JS, e reporta
  duplicata onde não existe nenhuma. O teste 8 mede no DOM depois de o
  app subir e de todas as áreas terem sido abertas, porque parte do
  conteúdo só é escrita quando a área abre.

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
