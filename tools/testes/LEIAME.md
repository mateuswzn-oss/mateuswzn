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
| 4 | `4-boot.mjs` | luminância do centro da tela a cada 120ms durante a abertura, **como app instalado**, e o que sobra na tela de login de quem ainda não entrou | um único quadro quase branco, o boot terminando na tela errada, ou chrome do app (barra de baixo, véu da gaveta, `#app`) aparecendo antes de entrar |
| 5 | `5-android-toque.mjs` | Pixel 7 com `hasTouch`: arrastar cartão do quadro com o dedo, tocar nos controles novos, anexar arquivo | o cartão não se move, um alvo some, vazamento |
| 6 | `6-iphone-tamanho.mjs` | o viewport **real** de um iPhone (393×695) contra o nominal (390×844) | vazamento, ou controle escondido atrás da barra de baixo |
| 7 | `7-contraste-coleta.mjs` + `7-contraste-medir.py` | razão de contraste WCAG medida **no pixel**, em 3 larguras × 2 temas | qualquer texto abaixo de 4.5:1 (3.0:1 se grande) |
| 8 | `8-estrutura.mjs` | invariantes do DOM: IDs duplicados, `label[for]` órfão, `aria-labelledby` apontando para o nada | qualquer um deles |
| 9 | `9-criacao.mjs` | os quatro caminhos de criar (o "+ Adicionar" da área, o atalho do painel, o "+" do topo, o "+" da barra de baixo) abrem o **mesmo** formulário | qualquer um deles abrir outro, ou o modal legado voltar |
| 10 | `10-offline.mjs` | instala o service worker de verdade, desliga a rede e recarrega | o app não abrir, os dados sumirem, ou faltar folha de estilo |
| 11 | `11-dados.mjs` | o ciclo completo nas cinco entidades: criar com todos os campos, recarregar, editar sem apagar o resto, excluir o item certo com a lista reordenada | um campo não chegar ao dado, sumir no reload, a edição zerar campos, ou a exclusão pegar o item errado |
| 12 | `12-teclado.mjs` | operar sem mouse: atalho para o conteúdo, Escape fechando formulário e diálogo, Tab preso dentro do modal, foco voltando para quem abriu | qualquer um deles |
| 13 | `13-ds.mjs` | o Design System carrega **sem o app** (galeria, 2 temas × 4 larguras), pinta **exatamente** as áreas migradas e nenhuma outra, e nenhum nome `ds-*` anda solto fora delas | o sistema depender de regra legada, a folha mexer em área não migrada, uma área migrada não mudar ao desligar a folha, ou um `ds-*` aparecer onde o sistema não alcança |
| 14 | `14-suporte.mjs` | a área migrada faz tudo o que fazia: abrir atendimento, validar, conversar, anexar, encerrar, persistir — e nenhuma regra legada vence lá dentro | uma função perder-se na migração, ou o legado voltar a pintar a área |
| 15 | `15-area.mjs <área>` | o teste de área genérico, o "antes e depois" de cada migração: estado vazio, formulário com foco e rótulos, criar pela interface, botões do item ao alcance, **agrupamento e ordem de pé com seis itens**, e nada vazando em 3 larguras × 2 temas. Roda nas seis coleções | qualquer um deles, em qualquer área — migrada ou não |
| 16 | `16-ajustes.mjs <área>` | as **oito** áreas que não são coleção (Perfil, Configurações, Faculdade, Relatórios, Foco, Calendário, Início, Arquivos): conteúdo em caixas, nome acessível em todo controle, alvo de 24px, e nada vazando em 3 larguras × 2 temas — mais uma checagem própria de cada uma (o que se edita grava e sobrevive ao recarregamento; as sete categorias; o tema carimba o `<html>`; os números leem o dado; o cronômetro anda; mês e semana são dois modos de verdade; os números do painel leem o dado; os arquivos guardados aparecem) | qualquer um deles |

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
- **Renomear prefixo de classe alcança o markup, o gerador e a folha — os
  três de uma vez.** A troca `mw-` → `ds-` do Design System pegou de raspão
  nomes do LEGADO (`mw-item-acoes`, `mw-selo`, `mw-resumo-chip`). O CSS
  legado continuou dizendo `.mw-item-acoes`, o DS só pinta sob `.ds`, e
  aqueles elementos ficaram sem regra nenhuma: em Projetos, *Editar* e
  *Excluir* viraram um `<div>` de 0×0 — invisíveis, sem erro no console. O
  teste 13 agora confere estaticamente se todo `ds-*` usado no app existe na
  folha, e no DOM se todo elemento com `ds-*` está dentro de
  `[data-mw-migrada]`.
- **Um teste que só conta elementos aprova elemento invisível.** O que
  denunciou o 0×0 acima foi medir o TAMANHO do botão, não a presença no DOM.
  `querySelectorAll(...).length` estava certo o tempo todo.
- **Trocar de seletor sem `assert` faz o script mentir.** Uma substituição
  que não casa com nada não é erro em Python: `s.replace()` devolve a string
  intacta e o script imprime "pronto". Toda troca em arquivo grande vai com
  contagem esperada e `assert` — foi assim que uma correção "aplicada" ficou
  duas rodadas sem existir.
- **A área escolhe como apresenta seus itens.** Projetos mostra um quadro
  Kanban por padrão e mantém `#projectsList` no DOM com `display:none`, com
  um botão *Lista* ao lado. Medir a lista escondida dava item de 0×0 e o
  teste acusava "os botões sumiram" — sumira a lista inteira, de propósito.
  O teste 15 pede o modo lista antes de medir.
- **Fundo animado torna a medição de contraste irreprodutível.** O
  `#app::before` é um gradiente de acento a 62% que translada e escala num
  ciclo de 34 s, e o vidro deixa passar. Duas fotos da mesma tela em
  instantes diferentes davam razões diferentes — a mesma área apareceu com 3
  falhas numa rodada e nenhuma na seguinte, sem uma linha ter mudado. A
  `esperaParar` ignora animação infinita de propósito (esperar por ela é
  esperar para sempre); quem resolve é a `congelaDecoracao`, que para essas
  animações num instante escolhido. A coleta fotografa os dois extremos do
  ciclo, que cercam o pior caso.
- **Vidro sobre vidro não tem fundo previsível.** Um `.ds-cartao` dentro de
  outro compõe duas translucidezes sobre o gradiente animado: o mesmo texto
  que dá 4,9:1 na galeria (chão `#020617`, parado) caiu para 3,4:1 dentro do
  app. Cartão dentro de cartão agora é superfície opaca.
- **Semear o dado é o que faz o controle existir para ser medido.** O teste 3
  varria as áreas sem semear nada, então o chip de habilidade do Perfil nunca
  era desenhado e o "×" de 19px dele nunca foi medido. Quem achou foi o teste
  da área, que semeia uma habilidade porque a área é sobre isso.
- **Restringir um seletor legado pode desmontar um componente.** Para tirar o
  legado de dentro de uma área migrada, acrescenta-se `:not([data-mw-migrada] *)`
  ao seletor dele. Só que nem toda regra ampla é aparência legada: um reset
  global (`button,input,textarea{font:inherit}`), uma correção que vale para o
  app inteiro (`mw-alvos`) e o CSS próprio da área (o interruptor do Perfil
  público) precisam continuar valendo. Restringidos junto, devolveram
  respectivamente a fonte do sistema operacional, links de 14px e um
  interruptor virado caixa de seleção crua.
- **`all: revert-layer` declara TODAS as propriedades.** Uma varredura que
  pergunta `getPropertyValue('font-size')` não enxerga a regra de desligamento
  — e acusa como "legado vencendo" justamente a regra que está desligando o
  legado.
- **`:where()` no desligamento não pode listar `button`.** O seletor da lista
  tem id mais atributo, então venceria também as regras de CLASSE de botões
  que só existem numa tela: o interruptor do Face ID virou um retângulo de
  0px. Campo de formulário é genérico; botão, muitas vezes, é componente da
  área.
- **Um limiar único reprova tela pequena e aprova tela vazia.** O teste 16
  começou exigindo 400px de altura e 5 controles para toda área. Faculdade
  tem 341px e está certa; o Calendário tem 34 controles e 171 caracteres de
  texto, porque quase tudo nele é um número de dia dentro de um botão. Os
  mínimos passaram a ser por área, e a medida de "tem conteúdo" é altura
  mais controles — não quantidade de texto.
- **Todo teste entrava no app antes de medir — e ninguém olhava a tela de
  login.** A barra de baixo aparecia sobre o login, com Início, Faculdade e
  Perfil clicáveis sem sessão nenhuma; tocar num deles marcava uma área como
  ativa dentro de um `#app` escondido, e dali dava para chegar a uma tela
  inteiramente borrada (o véu da gaveta é fixo, cobre tudo e tem
  `backdrop-filter`), sem nada legível e sem saída visível. Dezessete testes
  verdes e nenhum via, porque todos semeiam sessão e entram. O teste 4 passou
  a medir também o estado de antes de entrar.
- **Uma regra com dois seletores tem duas travas para conferir, não uma.**
  `html body.mw-in-app #x, html body #x { display: flex !important }` — o
  segundo lado existia só para garantir especificidade de layout, mas
  `display` não é layout como as outras: sem a trava, ele vencia os
  `display:none!important` que escondiam o elemento antes do login.
- **Medir num navegador comum não vê o que só existe no app instalado.** A
  barra de baixo é escondida por `html:not(.mw-standalone)`. Sem fingir o
  `display-mode: standalone`, o teste passava por um caminho que o defeito
  nem percorre. O fingimento troca só a consulta de display-mode e delega o
  resto ao `matchMedia` de verdade — senão o app perde
  `prefers-color-scheme` e `prefers-reduced-motion` no meio do boot.
- **"Texto cortado" num elemento sem texto é a barra de progresso.** A
  checagem de texto espremido (`scrollWidth > clientWidth` com
  `overflow:hidden` e sem reticências) acusava dois elementos no Início. Os
  dois eram o `<i>` da barra de progresso: vazio, dentro de uma caixa com
  overflow escondido, e com a largura em transição — durante a animação o
  scrollWidth passa do clientWidth. Sem texto não há o que sumir; a
  checagem passou a exigir texto.
- **Dentro de um `<svg>`, quem recorta é o viewport do SVG.** A checagem de
  vazamento horizontal sobe pelos ancestrais procurando `overflow-x`, e o
  recorte do SVG não aparece assim. Um `<rect>` de área de toque no gráfico
  do Início tinha a caixa passando 7px da tela sem desenhar um pixel lá
  fora — e o teste acusava vazamento numa tela que não vaza. Quem pode
  vazar de verdade é o `<svg>`; os filhos dele são medidos por ele.
- **Seletor que não casa não levanta erro.** É o defeito de migração mais
  comum e o mais silencioso: um `querySelector` preso a uma classe que a
  migração renomeou devolve `null`, o bloco desiste, e não há erro no
  console nem pixel fora do lugar. Na migração das quatro áreas de coleção
  foram OITO lugares assim — a agenda de Atividades, a ordem de Disciplinas
  e de Projetos, o "Ver mais" das Anotações, o filtro, o `monta()` do
  quadro, o foco de volta no Escape, e o filtro de Projetos que procurava
  `[data-v]` num selo que deixara de emiti-lo. A regra: **o que o JS
  precisa achar depois é atributo, não classe.**
- **Um item na lista não testa lista nenhuma.** Todos os blocos que
  reordenam ou agrupam desistem cedo quando há menos de dois itens — então
  um teste que cria UM item passa por cima deles inteiros. O teste 15 semeia
  seis de propósito, e verifica que os títulos de grupo continuam lá.
- **Guarda que degrada em silêncio esconde o defeito que deveria evitar.**
  `(typeof mwArea === 'function') && mwArea(a)` parece defensivo: quando o
  helper não é global, dá `false` calado e a área migrada segue montando o
  material antigo. Ou se exporta o helper, ou se pergunta ao DOM na hora.
- **A checagem estática lê comentário também.** O teste 13 confere se todo
  nome do sistema usado no `index.html` existe na folha — e um nome citado
  dentro de um comentário conta como uso, do mesmo jeito que o grep acha
  `id="x"` dentro de comentário. Quando acontecer, o texto é que muda.
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

- **O boot tem piso de 4,55s, e ele é de propósito.** O `ajuda.abre()`
  arranca o preloader à força porque quer o app; um teste da tela de
  ENTRADA quer o que vem depois dele, e tem de esperar de verdade. A
  primeira versão do teste 17 esperava 2,8s fixos: media a tela de
  carregamento e reprovava oito verificações de uma vez, todas corretas.
  Espere pela condição (`#mwBootLoader` fora do documento e
  `html.mw-login-pronto` presente), nunca por um número.

- **A tela de recuperação de senha são duas, e a que responde é a nova.**
  O `#otpOverlay` do markup antigo continua no documento e ainda reage ao
  clique — mas um handler em captura o fecha e abre o `#mwRecupera`, que
  é o que fala com o Supabase. Medir o antigo dá "não abriu" numa tela
  que abriu certo.

- **Um passo de teste herda o estado do passo anterior.** A caixa de erro
  guardava o aviso do passo 7 e o passo 8 mediu aquele texto achando que
  era o seu. Limpe o que você vai medir antes de medir.

- **Depois de um ciclo de cadastro, a sessão volta sozinha.** O teste 17
  cria conta, entra, sai e recarrega — e algum caminho de entrada
  automática restaura a sessão adiante. A medida de layout começa, por
  isso, de uma recarga limpa, e confere que a tela de login está de pé
  antes de confiar no que mediu. Sem isso ela media `#loginScreen` com
  `display:none` e relatava "o cartão não cabe" para um cartão de 0x0.

- **A caixa de um elemento pode ser plausível e mentirosa.** O cartão de
  entrada desliza entre "entrar" e "criar" num trilho com
  `overflow:hidden`. O painel que saiu de vista continua com uma
  `getBoundingClientRect()` dentro da janela — e uma amostra de pixel
  naquele ponto mede o que está desenhado ali, que é outra coisa. Foi
  assim que "Bem-vindo de volta." (branco sobre um painel medido entre
  7:1 e 13,7:1) apareceu com 1,36:1. Estar dentro da JANELA não basta:
  o elemento tem de caber dentro de cada ancestral que recorta.

- **Foco muda o que está em volta.** A amostragem de fundo olha as
  faixas acima e abaixo da caixa do texto. Com o campo focado, logo
  abaixo do rótulo está o anel de foco azul — e o rótulo, que está sobre
  o cartão, foi relatado a 1,14:1. Tire o foco antes de fotografar.

- **Uma tela tem dois temas; medir um é medir metade.** O
  `quem-veste.mjs` nasceu sem argumento de tema e rodou só no escuro.
  No claro havia uma regra a mais vestindo o botão primário — a que
  trocava o degradê escurecido do sistema pelo cru, e o levava de 6,4:1
  para 4,2:1. Ela passou despercebida por isso.

- **`eval` roda no mesmo shell.** A lista de comandos do `rodar.sh` tem
  laços com `|| exit 1` dentro. Executados por `eval` sem subshell, esse
  `exit` encerra o rodar.sh inteiro: sem resumo, sem derrubar o servidor,
  e com a última linha do log parecendo um teste que passou. Uma falha de
  verdade ficou escondida assim por uma execução inteira. Cada comando
  roda num subshell — `( eval "..." )`.
