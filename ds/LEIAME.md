# MW Design System

Sistema de interface do Mateus Workspace. Existe para **substituir** as folhas legadas
área por área — não para se empilhar sobre elas.

```
ds/mw-ds.css      o sistema
ds/index.html     a galeria: todo componente, nos dois temas, em quatro larguras
ds/amostra.html   uma tela do app montada só com o sistema, dentro da galeria

tools/ds/dependencias.py   antes de migrar: que folhas legadas pintam a área
tools/ds/quem-vence.mjs    depois de migrar: que regra legada ainda ganha lá dentro
```

Para ver: `tools/testes/rodar.sh` sobe o servidor, ou `python3 -m http.server 8795` na raiz
e abra `http://127.0.0.1:8795/ds/`.

## Por que um arquivo separado

O `index.html` do app é um arquivo só, deliberadamente. O sistema fica fora dele por três
razões que valem a exceção:

1. **Isolamento demonstrável.** O DS carrega sozinho na galeria, sem uma linha do app. Se
   dependesse de alguma regra legada, a galeria quebraria — e não quebra. Essa é a prova de
   que ele não está empilhado sobre nada.
2. **Substituir exige poder apagar.** Migrar uma área é trocar o CSS dela. Com o sistema em
   arquivo próprio, dá para ver num diff o que saiu e o que entrou.
3. **O service worker já cacheia arquivos soltos** (`vendor/supabase.js`), então isto não
   inventa uma categoria nova no projeto.

O `<link>` entra no `<head>`, antes de qualquer pintura — não há lampejo de conteúdo sem
estilo, porque o navegador não desenha até a folha chegar.

## As três regras da arquitetura

**1. Tudo vive sob `.ds`.** Sem nenhum `.ds` no documento, o arquivo é inerte: não
pinta um pixel. É isso que permite migrar uma área por vez sem que as outras sintam, e é
verificado pelo teste 13.

**2. Nenhum `!important` de componente.** A ordem interna é resolvida por camadas:

```css
@layer mw.base, mw.superficie, mw.componente, mw.utilidade;
```

Camada ordena sem inflar especificidade — o oposto de `!important`, que ordena inflando.
Os oito `!important` do arquivo estão fora da estilização: a classe de leitor de tela, o
bloco de movimento reduzido e o de impressão. Esses três precisam vencer qualquer regra por
definição.

**3. Componente não conhece cor.** Dois níveis de token:

| nível | exemplo | quem lê |
|---|---|---|
| primitivo | `--mw-p-azul-500` | só os semânticos |
| semântico | `--mw-ac`, `--mw-txt-2`, `--mw-sup-1` | os componentes |

Trocar de tema é redefinir os semânticos. Nenhuma regra de componente escreve um valor de
cor — se alguma escrever, o tema claro vai ter um buraco.

## Convenção de nomes

Tudo em português. **Classe do sistema começa com `ds-`; a raiz do escopo é `.ds`.**

```
.ds                    o escopo (raiz da área migrada)
.ds-btn .ds-btn-primario .ds-btn-p     bloco, tom, tamanho
.ds-campo .ds-campo-erro               bloco, estado
--mw-p-*               token primitivo
--mw-e-4 --mw-t-corpo --mw-r-3 --mw-d-media     espaço, tipo, raio, duração
[data-mw-carregando] [data-ds-tema]    estado que o JS liga/desliga
```

O prefixo começou como `mw-`, que era o erro óbvio em retrospecto: o app **já é** o
MW e já era dono de `mw-`. Uma auditoria de colisão encontrou `.mw-selo` (18 regras
legadas), `.mw-btn` (12), `.mw-resumo` (16), `.mw-item` (5), `.mw-filtro` (6) e
`.mw-entrada` (1) — nomes que o sistema também queria. Não havia como escapar
renomeando um por um: renomear é a operação que **cria** o problema seguinte, porque
o mesmo nome aparece em markup estático, em template de JS e em folha de estilo, e
uma substituição cega acerta os três.

Foi o que aconteceu, e vale como aviso. A troca `mw-` → `ds-` alcançou nomes de
classe do **legado** no meio dos geradores: `mw-item-acoes` virou `ds-item-acoes`,
`mw-selo` virou `ds-selo`, `mw-resumo-chip` virou `ds-resumo-chip`. O CSS legado
continuou dizendo `.mw-item-acoes`; o DS só pinta sob `.ds`; então aqueles elementos
ficaram sem regra nenhuma. Em Projetos, os botões *Editar* e *Excluir* viraram um
`<div>` de 0×0 — sumiram da tela sem erro no console e sem falhar nenhum teste de
layout. Quem pegou foi o teste 15, medindo o item pelo tamanho em vez de pela
presença no DOM.

Desde então o teste 13 faz duas perguntas estáticas a cada rodada: todo nome `ds-*`
usado no `index.html` existe mesmo na folha do sistema, e todo elemento que carrega
um `ds-*` está dentro de `[data-mw-migrada]`. As duas juntas fecham essa porta.

**Cuidado com os tokens:** as *variáveis* do sistema continuam `--mw-*` (não houve
colisão nenhuma ali), enquanto as variáveis próprias do app legado passaram a
`--ds-*` na mesma troca. Fica invertido em relação às classes, e é confuso: classe
`ds-` = sistema, variável `--mw-` = sistema. É dívida conhecida, registrada aqui para
não ser redescoberta com um bug.

Estado que vem do DOM usa o atributo que já significa aquilo (`aria-pressed`,
`aria-current`, `aria-selected`, `disabled`) em vez de uma classe paralela — assim o
visual e a semântica não podem discordar.

## O que o sistema cobre

Tokens (cor, espaço, tipo, raio, sombra, movimento, camada de empilhamento, alvo de toque),
superfícies (vidro e sólido), tipografia por papel, layout (pilha, linha, grade, rolagem
horizontal), e os componentes: **botão** (4 tons × 3 tamanhos × 6 estados), **campo**
(texto, seleção, área, interruptor, erro), **cartão** (vidro, sólido, acionável),
**lista/item**, **selo**, **filtro**, **cartão de número**, **progresso**, **avatar**,
**navegação** (lateral e inferior), **abas**, **tabela**, **estado vazio**, **esqueleto**,
**diálogo** (folha no celular), **aviso**, **cabeçalho de seção**.

Mais: `prefers-reduced-motion`, `prefers-contrast: more`, estilos de impressão, e
`@supports` para onde `backdrop-filter` não existe.

## O protocolo de migração

Uma área por vez. Sem exceção — migrar duas juntas é como o legado virou o que é.

### Antes de tocar em qualquer coisa

1. **Levantar as dependências da área.** Quais folhas legadas a pintam hoje?

   ```bash
   python3 tools/ds/dependencias.py subjects
   ```

   O script devolve os blocos `<style>` que têm regra alcançando `#view-subjects`, quantas
   regras cada um contribui, e quantas usam `!important`. É esse levantamento que diz o
   tamanho real da migração antes de começar.

2. **Fotografar o estado atual.** A suíte inteira, verde, com as fotos guardadas. É o
   "antes" contra o qual o "depois" será comparado.

   ```bash
   tools/testes/rodar.sh
   ```

3. **Listar o que a área FAZ**, não como ela parece: cada botão, cada campo, cada atalho de
   teclado, cada coisa que grava dado. Essa lista vira o teste da área.

### Migrar

4. Marcar a raiz da área com `class="ds"` e `data-mw-migrada="1"`.
5. **Desligar o legado daquela área**, em `<style id="mw-legado-desligado">`:

   ```css
   /* O seletor `:where()` tem especificidade ZERO, então isto não entra na
      guerra: ele só impede as regras antigas de alcançar a subárvore migrada.
      Não é neutralização por força; é por escopo. */
   #view-subjects[data-mw-migrada="1"] :where(.card, .list-item, .small-btn, .section-head){
     all: unset;
   }
   ```

   Onde a regra legada usa `!important` e `all: unset` não basta, a saída é **apagar a
   regra legada** — não empilhar outra por cima. Se ela ainda serve a uma área não migrada,
   restringir o seletor àquela área.
6. Reescrever a marcação com as classes do sistema — **um conjunto OU o outro, nunca os
   dois.** Onde o mesmo gerador de JS serve área migrada e área legada, ele escolhe:

   ```js
   const migrada = view.hasAttribute('data-mw-migrada');
   const cls = (novo, velho) => migrada ? novo : velho;
   ```

   A primeira tentativa foi emitir os dois nomes juntos, para a área migrada continuar
   sendo alcançada pelo legado "caso faltasse alguma coisa". Medido: **35 regras legadas
   continuavam vencendo** dentro da área dita migrada. Contra
   `html body #app .main .card{ … !important }` não existe regra *acrescentada* que ganhe —
   carregar o nome antigo é continuar sendo pintado por ele. A área migrada não pode
   carregar o nome antigo.

   Pelo mesmo motivo, o que o JS precisa encontrar depois vira **atributo**, não classe:
   `[data-workspace-form]`, `[data-add]`, `[data-mw-linha]`. O nome da classe muda com a
   migração; um teste ou um `querySelector` preso a ele quebra sem que nada tenha
   quebrado no app.
7. Rodar a suíte + o teste da área.
8. **Conferir quem está ganhando dentro da área.** Passar no teste prova que
   nada quebrou; não prova que o sistema é quem pinta.

   ```bash
   node tools/ds/quem-vence.mjs subjects escuro
   node tools/ds/quem-vence.mjs subjects claro
   ```

   O que sobrar na lista são regras legadas que miram o ELEMENTO (`h2`, `p`,
   `button`) em vez de uma classe — o `:where()` do desligamento não as
   alcança, e as que têm `!important` vencem o sistema. Para cada uma,
   **restringir o seletor legado** com `:not([data-mw-migrada] *)`, e não
   empilhar outra regra por cima. Cada migração encurta mais esse alcance,
   até a regra poder sair inteira.

   Na migração de Suporte foram exatamente duas, ambas de
   `mw-smart-light-calendar-polish`, ambas sobre cor de texto no tema claro.

### Depois

9. Comparar com o "antes": nenhuma funcionalidade perdida, nenhum erro de JS, contraste
   mantido ou melhor, nenhum vazamento horizontal.
10. Commit da área sozinha. Migração de duas áreas num commit é irreversível na prática.

### O fallback

Área não migrada continua com o CSS de hoje, intacto — o `.ds` não a alcança e o
desligamento é escopado por `#view-<area>`. Se uma migração der errado, reverter é tirar a
classe da raiz daquela área: as regras legadas voltam a valer sozinhas, porque nunca foram
apagadas globalmente.

## Ordem sugerida das áreas

Da menor superfície de risco para a maior. Cada uma é uma rodada.

| # | área | por que nesta posição |
|---|---|---|
| ✅ 1 | ~~Suporte~~ | **migrada.** 25 verificações de funcionalidade antes e depois, idênticas; zero regra legada vencendo lá dentro |
| ✅ 2 | ~~Instituições~~ | **migrada.** 14 verificações do teste 15 antes e depois, idênticas; zero regra legada vencendo lá dentro, nos dois temas |
| 3 | Disciplinas · Projetos · Atividades · Anotações | mesmo formulário e mesma lista; migram juntas ou brigam entre si |
| 4 | Configurações · Perfil | muitos campos, pouca lógica |
| 5 | Faculdade · Relatórios · Foco · Calendário | layout próprio em cada uma |
| 6 | Início | depende do vocabulário das outras estar pronto |
| 7 | Login / cadastro | fora do `#app`, com regras próprias e seis peles legadas sobrepostas |
| 8 | Barra lateral e barra de baixo | tocam todas as telas; por último, quando o resto já está no sistema |

## O que este sistema não faz

- **Não é uma biblioteca de ícones.** O app já tem um sprite `<symbol>`/`<use>`; o DS
  dimensiona e colore o ícone, não o desenha.
- **Não implementa comportamento.** `aria-modal="true"` no diálogo é aparência; quem move o
  foco, prende o Tab e fecha no Escape é o bloco `mw-teclado` do app. CSS não faz isso, e
  fingir que faz é como o defeito do diálogo nasceu.
- **Não define layout de página.** Grade da área, barra lateral e posição da barra de baixo
  são de cada tela. O sistema dá as peças e o ritmo.
