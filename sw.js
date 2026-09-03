/* v105 (BETA — A TELA BORRADA NO IPHONE: dois defeitos, um escondendo o
   outro. Nenhum dos dois veio desta reformulação; são de cf0b42a e
   e226e2e, rodadas anteriores.)

   O QUE O MATEUS VIU
   Abriu o menu no iPhone: a tela inteira borrada, nada legível. E as
   vinte e uma etapas da suíte estavam verdes.

   1) EMPILHAMENTO — O VÉU ESTAVA POR CIMA DA GAVETA
   `#mwSidebarScrim` era filho de <body> com z-index:110. A gaveta é
   filha de #app, que tem `isolation:isolate`, com z-index:120. Os dois
   números pareciam certos e NÃO ERAM COMPARÁVEIS: contextos de
   empilhamento diferentes. O #app inteiro — gaveta junto — pintava por
   baixo do véu. Daí o `backdrop-filter` borrar a própria gaveta, e
   `elementFromPoint` no meio dela devolver o véu: tocar em "Disciplinas"
   FECHAVA O MENU em vez de abrir a área.
   Conserto: o véu passa a morar dentro do #app. Os z-index viram
   comparáveis e a regra CSS que a rodada anterior deu por "quebrada" e
   contornou por JS volta a bater.

   2) O QUE O PRIMEIRO ESCONDIA — A GAVETA NÃO FECHAVA
   Consertado o empilhamento, o menu ficava aberto por cima da área
   recém escolhida. O gancho de fechar usava
   `#app .nav button:not([data-mw-migrada])...` — guarda da época em que
   a lateral ainda não tinha migrado para o Design System. Depois que ela
   migrou, o `:not(...)` passou a excluir TODOS os itens, e nenhum
   recebeu o gancho. Ninguém notou porque o véu fechava a gaveta por
   acidente. Agora é delegação na própria lateral, sem guarda.

   TESTE 23 — O TOQUE CHEGA EM QUEM ESTÁ NA TELA
   Por que 21 testes estavam verdes com a tela inutilizável: todos
   acionam controles com `elemento.click()`, que dispara o manipulador
   direto no nó e não passa por teste de acerto. Perguntam "o gancho
   funciona?", nunca "o dedo alcança?". O 23 mede o alcance —
   `elementFromPoint` no centro de cada controle tem que devolver ele
   mesmo — e fecha o ciclo com um toque POR COORDENADA. Conferi que ele
   pega: repondo o defeito, acusa os 12 itens do menu devolvendo
   `mwSidebarScrim`.
*/

/* v104 (BETA — §14 e §15: Configurações lida de cima para baixo)

   "SAIR" ERA A SEGUNDA COISA DA TELA
   Ele morava dentro de Conta, no alto. Numa tela de ajustes o item
   destrutivo no topo é um convite ao clique errado: a mão chega nele
   antes de a leitura começar. Passa a ser a ÚLTIMA categoria, depois de
   Aplicativo — medido, fica nos últimos 110 px de uma tela de 4.105.

   O DIAGNÓSTICO SAI DA UX NORMAL, SEM SER APAGADO
   Ele é ferramenta de manutenção, não recurso do produto, e ocupava um
   grupo inteiro no fim de Configurações. Vira uma divulgação recolhida —
   uma linha, "Diagnóstico avançado", que abre quando alguém precisa.

   Não apaguei porque o critério de saída combinado é a validação em
   Safari, Chrome, iOS, Android, tablet e desktop, e ela ainda não
   aconteceu. Apagar agora seria decidir por antecipação; esconder é o
   que o §15 pede e o que a decisão anterior permite.

   DUAS COISAS QUE SÓ A CAPTURA MOSTROU
   1. "SESSÃO" (categoria) seguido de "Sessão" (grupo) — o mesmo nome
      duas vezes, criado pela própria mudança. O grupo passou a se chamar
      "Sair desta conta", que diz o que ele faz.
   2. Duas divulgações empilhadas com desenhos de seta DIFERENTES: "Por
      que preciso fazer isso?" com o triângulo nativo do navegador, e a
      nova com a minha. Mesma ação, dois glifos, e o nativo muda de forma
      em cada navegador. A seta virou peça do sistema: uma regra em
      `.ds details > summary` serve as duas, e as próximas.

   Medido: etapas 3 (acessibilidade), 7 (contraste) e 12 (teclado)
   verdes, além da 16 na área "settings".
*/

/* v103 (BETA — os defeitos que a CAPTURA mostrou, e a régua nova para
   eles não voltarem)

   Fui olhar as duas capturas do Perfil em vez de reportar teste verde, e
   a tela contava coisas que a suíte não sabia perguntar.

   1) O TÍTULO DO TOPO DIZIA "INÍCIO" COM O PERFIL NA TELA
      O título era pintado embrulhando `showView` — o que cobre a barra
      lateral e a de baixo, mas não a foto do topo, que vai para o Perfil
      por um caminho próprio. Embrulhar o segundo caminho deixaria o
      terceiro quebrado; o título passa a ler a classe `.active` da seção
      visível, que é verdade para qualquer caminho.

   2) OS DOIS BOTÕES DE SALVAR SAÍAM CIANO → AZUL
      Com o resto da tela em violeta — o §2 quebrado, e a suíte verde.
      A causa: regras legadas pegam o botão PELO ID, com !important. O id
      é a única brecha por onde a folha velha alcança marcação nova: o
      isolamento do sistema é feito de NOMES (`ds-*`), e um id não é um
      nome do sistema. Saíram das listas de seletor `#saveProfile`
      (dezenove regras) e `#saveCollege` (oito). Onde o seletor também
      cita `.save-btn` ou `.modal-submit`, só o fragmento do botão saiu:
      o resto segue vestindo as telas ainda não migradas.

   3) A BARRA DE SALVAR COBRIA O CAMPO "@USUÁRIO"
      Medido, não suposto: a barra parava em y=726 e o campo ficava
      embaixo, borrado. Era uma pílula de vidro flutuando no meio do
      formulário; virou rodapé sólido do painel — largura toda, borda em
      cima. Vidro ali seria materialmente defensável (ela se sobrepõe a
      conteúdo), mas atrás dela há texto de formulário, não paisagem.

   4) A ABA "SOBRE" FICAVA FORA DA TELA EM 390px
      E é onde mora toda a edição do Perfil. Rolar funcionava; descobrir
      que dava para rolar, não. Ganhou máscara na borda direita, que some
      sozinha ao chegar ao fim.

   5) OS DADOS ACADÊMICOS QUEBRAVAM COM UM PONTINHO ÓRFÃO
      O separador inline cabia numa linha e, ao quebrar no telefone, a
      segunda começava com um ponto apontando para nada. Viraram chips. E
      o selo passa a dizer "Perfil público" / "Perfil restrito" — o
      conceito do §13 — em vez de "Tudo visível".

   6) A primeira área do app se chamava "Dashboard" na lateral. Início.

   O TESTE 22 — A COR DE DESTAQUE ALCANÇA AS PEÇAS DE DESTAQUE
   O teste 21 mede a ORIGEM (as seis sementes, `--id-ac`, a lateral) e
   estava verde com o botão ciano na tela. O 22 mede o DESTINO: para cada
   peça que o sistema declara como de acento, a cor tem que mudar quando
   o acento muda. Catorze áreas, seis cores, dois temas. Ele achou
   sozinho o segundo botão preso — o "Salvar organização" da Faculdade —
   que eu não tinha visto.

   Medido de passagem: 169 elementos do sistema ainda são alcançados por
   regra legada pelo próprio id. Dois fechados, o resto virou tarefa.
*/

/* v102 (BETA — §13 do prompt mestre: O PERFIL DEIXA DE SER UM FORMULÁRIO)

   O QUE O PERFIL ERA
   Uma tela de Configurações com outro título. Grupos empilhados, um
   rótulo e um campo por linha, foto de 64px perdida no meio. Nada ali
   dizia "esta é uma pessoa" — dizia "preencha estes campos".

   O QUE O PERFIL PASSA A SER
   Uma tela de produto, na ordem em que se lê uma pessoa:

     1. HERO — foto grande (112px no celular, 132px no desktop) com o
        botão de câmera EM CIMA dela, e não numa linha de formulário
        três telas abaixo. Ao lado: o nome em tamanho de título, o
        @usuário, a bio, e os dados acadêmicos como selos separados por
        ponto (instituição · curso · 5º semestre) em vez de quatro
        linhas de rótulo e valor. Links sociais viram ícones.

     2. NÚMEROS — disciplinas, projetos, atividades e progresso numa
        fila só, no mesmo componente que o Início usa. Um só desenho de
        número no app inteiro.

     3. ABAS — Visão geral, Projetos, Atividades e Sobre. A edição toda
        mora em "Sobre": quem entra no Perfil para OLHAR não tropeça num
        formulário, e quem entra para EDITAR tem tudo num lugar só.

   PÚBLICO E PRIVADO (§13)
   O selo ao lado do nome diz, em português, o que a conta está: "Perfil
   público" ou "Perfil privado". Não é enfeite — é o mesmo dado que a
   chave em Sobre grava. Enquanto não existir uma página de perfil que
   outra pessoa possa abrir, o selo diz o que o dado significa hoje e
   não promete uma vitrine que não existe.

   A BARRA DE SALVAR
   Fica colada no fim da aba Sobre, e o painel reserva a altura dela.
   Antes, uma barra grudada cobria o último campo — o defeito que o §14
   chama de "conteúdo coberto".

   O TESTE 16 ESTAVA MEDINDO O NOME, NÃO A COISA
   Ele contava `[data-mw-grupo]` e exigia pelo menos 4 no Perfil. A
   reformulação trocou grupos por faixas e chapas; a contagem foi a zero
   numa tela que ficou MAIS organizada. O teste passou a contar também
   `.ds-faixa` e `.ds-chapa`. Corrigir a régua, não remendar a parede
   para caber na régua velha (§42).
*/

/* v101 (BETA — FASE 1 a 3 do prompt mestre: a auditoria, a identidade e a
   COR DE DESTAQUE que finalmente funciona):

   §6 — O ÍCONE DO APP DESENHAVA "EW"
   Você disse "não utilizar EW", e eu fui procurar. O símbolo de DENTRO do
   app (`mwi-marca`) desenha MW corretamente — mas os PNGs do PWA eram um
   desenho DIFERENTE, de outra rodada: um M angular com pé horizontal no
   topo que, no tamanho da tela de início do iPhone, lê E. Ou seja, a
   identidade tinha dois desenhos, e o que aparecia no seu telefone era o
   errado. Os cinco ícones (192, 512, os dois maskable e o apple-touch)
   passam a sair do MESMO path do símbolo. Uma marca só.

   §2 — A COR DE DESTAQUE: POR QUE ELA NÃO FUNCIONAVA
   Havia um seletor de cor em Configurações desde antes desta rodada. Ele
   não funcionava direito, e a causa tem três partes — todas visíveis na
   tela:

   1. Ele gravava `--id-ac`, `--id-ac-2` e `--id-ac-grad` como ESTILO
      INLINE no <html>. Estilo inline vence qualquer folha, então nenhuma
      regra CSS conseguia participar da cor — incluindo as do tema claro.
   2. Ele escrevia TRÊS dos tokens de acento. `--id-ac-suave` e
      `--id-ac-txt` continuavam com o valor índigo cravado. Ao escolher
      verde, o app ficava verde nos botões e ROXO nos realces e nos links.
      Era daí que vinha a mistura de cores que você viu.
   3. Não havia versão para o tema claro: a mesma cor luminosa ia para
      cima do branco, e o texto branco em cima dela não passava de 4,5:1.

   AGORA: existe UMA SEMENTE por cor e por tema (`--sem-1`/`--sem-2`) e
   todo o resto é DERIVADO com `color-mix` — inclusive os dois tokens que
   faltavam. A função de aplicar voltou a ter uma responsabilidade só:
   escrever o atributo `data-acento`. As 80 regras que leem `--ds-ac` e as
   35 que leem `--mw-ac` passaram a nascer da mesma semente, então
   acompanham sem que exista uma linha "se a cor for verde então...".

   O literal antigo foi APAGADO na origem, não sobrescrito. Enquanto os
   dois existissem, empurrar o novo por especificidade seria exatamente a
   camada em cima que o §42 proíbe.

   E EU QUASE CRIEI UMA SEGUNDA IMPLEMENTAÇÃO
   Antes de encontrar a que já existia, eu tinha escrito um seletor de cor
   novo, com UI própria e lista de cores própria. Seriam dois seletores da
   mesma coisa em Configurações — o "componente duplicado" que o pedido
   proíbe. Apaguei o meu e consertei o que existia, mantendo os seis ids
   originais (índigo, ciano, violeta, verde, âmbar, rosa).

   §5 — A TROCA NÃO PISCA MAIS
   Tema e cor compartilham a mesma transição de 240ms, aplicada só às
   propriedades que mudam de cor (fundo, borda, texto, sombra) e só
   enquanto a troca acontece. Transicionar `all` faria o app inteiro
   rastejar a cada troca de tela.

   §45 — A MATRIZ VIROU TESTE (teste 21)
   Doze combinações olhadas à mão uma vez não garantem nada na décima
   terceira rodada. O teste 21 percorre 6 cores × 2 temas e verifica: que
   a semente muda em todas; que o acento derivado acompanha (se não
   acompanhar, existe valor cravado ou estilo inline no caminho — foi
   assim que o defeito apareceu); e que o item ativo da lateral tem
   aparência distinta em cada cor.
   Custou uma rodada descobrir dois cuidados de medida: comparar só os
   primeiros 44 caracteres do `background-image` dava "tudo igual",
   porque os 44 primeiros são o véu escuro que vem antes do gradiente; e
   as sementes do tema claro moram em `body.light`, então lê-las no <html>
   devolve sempre a do escuro.

   O QUE AINDA NÃO FOI FEITO — e continua na fila do prompt mestre
   Perfil (§13), Configurações reorganizadas (§14), Login (§16), Cadastro
   (§17), busca (§8), notificações (§9), sidebar do desktop (§12), a
   bottom nav com rótulo abaixo do ícone (§11), e as telas de coleção.
   Cada uma vem como TELA RECONSTRUÍDA, no método que a v100 estabeleceu:
   markup novo com nomes do sistema, legado sem alvo apagado.
*/
/* v100 (BETA — A REFORMULAÇÃO DE VERDADE COMEÇA AQUI: o Início e a
   moldura foram RECONSTRUÍDOS, não repintados):

   O QUE ESTAVA ERRADO EM TODAS AS RODADAS ANTERIORES
   Cada mudança minha foi sobre QUAL REGRA CSS pintava o markup existente.
   O markup nunca mudou. O Início emitia `<section class="card">` catorze
   vezes — então, ganhasse a regra que ganhasse, ele renderizava catorze
   cartões. Era isto que você via: "a mesma aplicação com Glassmorphism
   por cima".

   A MEDIDA QUE DESTRAVOU TUDO
   Dos 6.511 seletores do arquivo, apenas 462 (7,1%) alcançam markup que
   NÃO carrega nome de classe legado — e esses 462 são todos de raiz
   (html, body, #app, :root) mexendo em fundo e tokens. Nenhum desenha
   nada dentro de uma tela.
   Conclusão: markup novo com nomes `ds-*` fica fora do alcance do CSS
   antigo por construção. Sem guarda, sem !important, sem camada nova.
   A reformulação passa a ser REESCREVER A TELA, e o legado sem alvo
   simplesmente deixa de casar — e aí pode ser apagado.

   O SISTEMA GANHOU MATERIAIS, E ISSO É O FIM DA PAREDE DE CARTÕES
     CHAPA  conteúdo parado. Sólida, fio de 1px, SEM blur. É a maioria.
     VIDRO  só o que FLUTUA sobre conteúdo: barra de baixo, topo quando
            sobrepõe, diálogos, popovers. Aí a transparência tem função.
     PLANO  nada. Só ritmo e um rótulo (`ds-faixa`) — a peça que quebra a
            grade de caixas, porque a maior parte de uma tela boa é
            conteúdo AGRUPADO, não encaixotado.
   Regra: se não se sobrepõe a nada, não é de vidro. O popover do sino,
   por exemplo, virou chapa — havia texto para ler ali, e vidro só baixava
   o contraste (o teste 20 pegou isso de frente).
   Junto vieram: métricas em linha com divisores (quatro números, UMA
   peça, não quatro caixas), trilho horizontal, linha do tempo, pílula,
   ESTADO DE PARTIDA com ação, e os tokens de movimento (pressão de 90ms,
   entrada em cascata de 34ms, esqueleto).

   O TOPO — reconstruído
   Ele carregava a SAUDAÇÃO ("Olá, Mateus!" mais o curso, duas linhas).
   No telefone isso comia a largura, as três ações não cabiam e o
   navegador as empilhava em coluna — o defeito da sua foto. Não era CSS:
   a saudação estava no lugar errado. Agora o topo carrega só o CONTEXTO
   (o nome da área, uma linha), em UMA linha, com altura proporcional
   (56px no telefone), safe-area como padding, e vidro só quando há
   rolagem. A saudação virou o hero do Início. O bloco que copiava a
   saudação da barra para dentro da tela — remendo sobre o lugar errado,
   com MutationObserver e tudo — foi apagado.

   A BARRA DE BAIXO — cinco lugares
   INÍCIO · FACULDADE · + · ARQUIVOS · PERFIL. O "+" ocupa o centro
   geométrico, que é onde o polegar alcança, e abre o MESMO fluxo de
   criação do "+" do topo (um fluxo, não dois). A Nyc AI saiu da barra e
   foi para o topo com identidade própria: assistente é ação especial,
   não destino de navegação.

   O INÍCIO — de catorze cartões a uma composição
   contexto (data, saudação, semestre, quatro métricas numa linha) →
   agora (a única coisa que pede atenção) → atalhos (trilho) →
   próximos dias (linha do tempo própria) → progresso do semestre →
   disciplinas (trilho) → projetos (trilho) → aulas → o que vem.
   Todos os 42 IDs foram preservados, então nenhuma função de render
   quebrou; o que mudou foi a árvore, os tipos de elemento e cada nome de
   classe.

   DOIS DEFEITOS ESTRUTURAIS QUE APARECERAM AO MEXER
   1. Um script ARRANCAVA o calendário e as aulas de onde o markup os
      punha e os embrulhava num `.mw-home-extras` "lado a lado como no
      vídeo" — deixando a faixa "Próximos dias" com o título e nada
      embaixo. Apagado: posição é do markup, script não muda tela de
      lugar.
   2. O painel do calendário era declarado no Início e um `traz()` o
      arrastava para a área Calendário a cada visita. Agora ele é
      declarado onde vive, e o Início tem a sua própria agenda.

   O QUE A SUÍTE PEGOU, E QUE ESTÁ CORRIGIDO
   · `$('.hello h2').textContent` estourava ao salvar o perfil (a barra
     não tem mais saudação);
   · `--mw-p-gelo-500` dava 4,41–4,49:1 em seis telas — abaixo do mínimo
     por uma casa decimal. Foi para #94a0bd. (É a segunda vez que um
     token de texto empata com o piso do AA; o gelo-300 foi na v99.)
   · o rótulo da Nyc AI estava lendo `--mw-txt-1` sobre o acento — no
     claro, tinta escura sobre violeta. Agora usa `--mw-txt-sobre-acento`.
   · o "Sair" no tema claro media 4,15:1 (branco sobre azul): recebeu o
     véu escuro que o sistema já tinha para esse caso exato.
   · a ação de faixa media 94x17 de alvo de toque: ganhou área sem mudar
     de aparência.

   Contraste: 0 achados em três larguras e dois temas. Suíte: 20/20.

   O QUE AINDA NÃO FOI FEITO — e é a próxima rodada
   Perfil, Configurações, Login/Cadastro, as telas de coleção, a Nyc AI e
   o QA visual das 18 telas. Cada um vem como TELA RECONSTRUÍDA, no mesmo
   método: markup novo com nomes do sistema, legado sem alvo apagado.
*/
/* v99 (BETA — ETAPA 0 DA REFORMULAÇÃO: desfazer as 263 guardas indevidas.
   Não é uma melhoria: é a retirada de um método errado, antes de começar):

   O QUE VOCÊ VIU, E ESTAVA CERTO
   "Você está corrigindo regras, classes e testes, mas visualmente a
   aplicação continua praticamente na mesma base." Fui olhar as telas, uma
   a uma, em vez de olhar os testes. As dez queixas se confirmaram todas.
   E uma delas — o texto colado, `Nenhuma entrega com dataColoque prazo…` —
   não era herança do código antigo. Era defeito MEU, criado pelo método
   que eu vinha chamando de migração.

   O QUE ERA O MÉTODO, E POR QUE ELE NÃO ERA MIGRAÇÃO
   O `restringe.py` pendurava `:not([data-mw-migrada])` no fim de seletores
   antigos, para que a regra parasse na porta das áreas novas. Isso não
   troca nada de lugar: apenas DESLIGA a regra ali. Se o Design System já
   tem substituta, o resultado parece migração. Se não tem, o que sobra é
   ausência — e ausência de `display:block` num `<strong>` é exatamente
   duas frases coladas.

   O NÚMERO QUE FECHA O ASSUNTO
   Das 618 regras guardadas, 263 (43%) declaravam GEOMETRIA — display,
   width, position, height, transform, transition, min-height, overflow,
   flex, min-width, max-width, left. Não é um caso isolado que escapou: é
   quase metade. O método estava desligando o layout do app e chamando
   isso de migração.

   O QUE ESTA VERSÃO FAZ
   1. `tools/ds/desfaz-guarda.py` percorre o index.html e remove a guarda
      de toda regra que declare geometria — as 263. As guardas de PELE
      (cor, fundo, borda, sombra, raio) ficam: essas o DS de fato
      substitui.
   2. Onde a regra MISTURAVA as duas coisas, separei À MÃO — que é o que o
      protocolo já mandava fazer e o script passou a recusar automatizar:
      • `#app .main .card`: geometria fica global, o degradê azul-noite
        (sem par no tema claro) para na porta das áreas migradas;
      • `#searchWrap.search-wrap` e o painel do calendário: as cores
        cravadas viraram `var(--mw-sup-*)` / `var(--mw-borda)`, que mudam
        com o tema.
   3. APAGUEI três declarações legadas que voltaram a ganhar do sistema na
      lateral — `background:transparent` em `.nav button` (duas) e o fundo
      cinza-chumbo do item ativo. A lateral é a única `.nav button` do app
      e já é do sistema; essas regras não tinham mais alvo legítimo.

   O QUE VOLTOU A FUNCIONAR
   - o texto vazio do painel de foco e o da carga voltaram a ser duas
     linhas dentro da caixa, com a caixa desenhada;
   - os dias do calendário no tema escuro voltaram ao azul-noite; saíam
     CINZA porque a regra que os pintava também dava a grade e foi
     desligada inteira;
   - no tema CLARO: os painéis "Foco do semestre" e "Carga de estudos"
     deixaram de ser caixas azul-noite com texto escuro por cima (2:1);
     o painel do calendário, idem (1,48:1); a pílula do item ativo da
     lateral voltou; a lupa deixou de ser uma lápide azul-noite;
   - as 36 telas medidas mudaram entre 10% e 46% de pixels.

   O TESTE QUE FALTAVA — E ISSO IMPORTA MAIS QUE A CORREÇÃO
   A medida de contraste só olhava as ÁREAS (`#view-*`). A moldura —
   lateral, topo, barra de baixo — nunca foi medida. Era ali que, no tema
   claro, o rótulo da Nyc AI estava a 1,06:1 e as linhas de tema/
   configurações/sair a 1,08:1: branco sobre branco, invisíveis, com a
   suíte inteira verde. A moldura entrou na conta como se fosse mais uma
   área, e os quatro achados que ela revelou estão corrigidos com os
   tokens do sistema.

   O NÚMERO HONESTO QUE PIOROU — E O MAPA DO QUE FALTA
   O contador de migração voltou a acusar regra antiga vencendo dentro das
   áreas novas, onde antes marcava 0. Aquele 0 era falso: media "a regra
   antiga foi desligada", não "o DS pinta isto agora". Agora o teste 18
   RELATA em vez de reprovar — porque a única forma de fazê-lo passar hoje
   seria repor as guardas, isto é, o método que acabou de ser desfeito — e
   o log de cada rodada traz o mapa, área por área:

       topo 7 · profile 6 · settings 6 · calendar 5 · lateral 4
       home 3 · focus 3 · login 2 · reports 2 · college 1
       baixo, files, institutions, subjects, projects, activities,
       notes, support: 0

   Esses números são o tamanho real do trabalho que começa, e a métrica que
   tem de cair — por substituição de verdade, nunca por guarda. Quando
   chegar a zero, o 18 volta a ser portão.

   O QUE VEM AGORA
   Na ordem que você pediu: Design System → estrutura → componentes →
   perfil → Início → navegação → login/cadastro → configurações →
   animações → responsividade → QA visual. E a regra que assumo daqui em
   diante: ao fim de cada etapa eu OLHO cada tela e te mostro a captura.
   Vinte testes verdes não significam uma tela boa.
*/
/* v98 (BETA — a gaveta do celular voltou para fora da tela: um defeito
   que EU introduzi na v97, e a ferramenta que o deixou passar):

   O DEFEITO
   No telefone, a barra lateral passou a ficar EM CIMA da tela: 292px de
   largura, altura inteira, empurrando o app todo para baixo (o conteúdo
   começava em y=839, fora da janela). É a mesma classe de coisa que já
   apareceu numa foto sua antes — um pedaço da moldura no lugar errado,
   cobrindo o que importa.

   A CAUSA, E POR QUE ELA VAI VOLTAR SE NÃO FOR CONSERTADA NA RAIZ
   O `restringe.py` mede UMA PROPRIEDADE DE CADA VEZ (cor, fundo, raio) e,
   quando alguma delas vence dentro da área migrada, restringe a REGRA
   INTEIRA. Só que regra antiga costuma misturar as duas coisas: a do
   `mw-responsive` que dá a geometria da gaveta no celular —
   `position:fixed`, `width:min(84vw,292px)`, `transform:translate3d(-105%,0,0)`
   — também declara `background`. O laço a alcançou pela cor e levou a
   geometria junto.

   Não existe "restringir metade de uma regra": ou ela vale, ou não vale.
   Então o script passou a RECUSAR qualquer regra que declare geometria ou
   comportamento (position, inset, width, height, transform, display,
   overflow, transition, pointer-events, touch-action e parentes) e a
   nomeá-la num relatório próprio — "MISTURAM LAYOUT COM PELE: separe à
   mão" — que é exatamente o que o protocolo já manda fazer quando uma
   FOLHA é as duas coisas. Agora vale para a regra também.

   QUEM PEGOU, E POR QUE ISSO NÃO BASTA
   Nenhum teste viu o defeito de frente. Quem reprovou foi o teste de
   TOQUE (5), e por tabela: o cartão do quadro tinha ido parar fora da
   janela e o arraste falhou. Um defeito desse tamanho não pode depender
   de um arraste para aparecer.

   O teste 20 ganhou as duas verificações que faltavam, no modo celular:
   com a gaveta fechada, a lateral tem de estar FORA da tela, e o
   conteúdo tem de começar no topo. Provadas do jeito de sempre —
   reintroduzindo o defeito e vendo as duas reprovarem, depois tirando e
   vendo as duas passarem.

   E UM DETALHE DO RELATÓRIO
   As regras recusadas apareciam também como "não localizadas no
   index.html", o que mandava procurar à mão uma regra que o script
   acabara de ler. Agora contam como encontradas.

/* v97 (BETA — a moldura no Design System: a última superfície):

   Com esta rodada não sobra tela: as catorze áreas, a tela de entrada e
   agora a moldura — barra lateral, barra do topo e barra de baixo —
   estão sob o sistema. 785 regras em 68 folhas chegavam até aqui.

   O QUE PASSOU PARA O SISTEMA
   Os treze itens da lista lateral viraram `ds-nav-item`, e o estado
   ativo passou a ser o do sistema. Junto com isso o `showView` marca
   `aria-current="page"` no item corrente — o que um leitor de tela
   anuncia — mantendo a classe `.active` porque muito código do app a
   lê. Os seis botões de ícone do topo viraram `ds-btn ds-btn-fantasma
   ds-btn-icone`, e o campo de busca, `ds-entrada`.

   O QUE FICOU COM A ÁREA, E POR QUÊ
   A barra de baixo. O sistema TEM uma (`ds-nav-baixo`), e ela é uma
   fileira simples de itens; esta é outra coisa — lente de vidro com
   física de mola, foto de perfil no lugar do hambúrguer, recolher ao
   rolar, máquina de estados própria. Trocá-la pela genérica jogaria
   fora o que várias rodadas construíram. Ela recebeu `ds` e
   `data-mw-migrada` assim mesmo: o que decide COR, RAIO e ESPAÇO ali
   passa a ser o token do sistema; a peça continua da área. Mesma
   decisão do quadro de Projetos, da agenda e do trilho da entrada.

   Também ficaram: o material de vidro da moldura, as nove cores dos
   ícones da lista, a lente que desliza, o recolher da lateral e a
   coreografia de rolagem.

   O PONTO CEGO, DE NOVO — E MAIOR
   O `quem-veste` (criado na v94) achou aqui o mesmo tipo de coisa que
   achou na entrada, e em quantidade: **73 regras** de folhas
   declaradas como "próprias da área" ainda vestindo botões que
   anunciavam `ds-nav-item`. É a mesma lição, escrita de novo: folha não
   é a unidade; regra é. Uma folha de navegação faz layout E pele, e só
   a segunda parte sai.

   E UM DEFEITO NO PRÓPRIO restringe.py
   A checagem de idempotência era `if ':not([data-mw-migrada]' in p` —
   um prefixo que casa com as DUAS formas de guarda. Rodadas anteriores
   deixaram regras com só a guarda de DESCENDENTE, e a moldura é o
   primeiro caso em que a raiz da área é ela mesma o alvo
   (`#app .sidebar{...}`). O script via a guarda velha, dizia "já está
   restringida", e a regra continuava pintando. O laço rodava para
   sempre relatando "1 regra restringida" e medindo 1 de novo. Agora as
   duas formas são conferidas separadamente.

   O QUE ESTÁ VERIFICADO NESTE COMMIT
   Zero regra legada vencendo nas três peças, nos dois temas (seis
   medições). O quem-veste limpo nas dezoito superfícies, nos dois temas
   (trinta e seis medições). O teste 20 verde nos três modos — desktop,
   navegador do celular e app instalado. O teste 13 verde: catorze áreas
   pintadas pelo sistema, nenhuma legada tocada.

   A suíte inteira ainda estava rodando quando este commit foi feito, e
   o resultado dela vem no commit seguinte — verde, ou com a correção do
   que ela achar. Fica dito aqui em vez de afirmado como pronto.

   E UM DEFEITO DO TESTE 13, CORRIGIDO JUNTO
   Ele montava a lista de áreas migradas com
   `#app [data-mw-migrada="1"]` e tirava o nome do `id`. A moldura passou
   a carregar a marca nesta rodada e não tem `id`: entravam dois nomes
   VAZIOS na lista, e a comparação com as áreas medidas acusava "duas
   áreas migradas que o sistema não pinta" para duas coisas que nem são
   área. Agora a lista percorre o mesmo conjunto que a medição —
   `.view[data-mw-migrada][id^=view-]`.

/* v96 (BETA — a navegação ganha teste próprio, antes de ser migrada):

   POR QUE UM TESTE ANTES
   A barra lateral, a barra de baixo e a barra do topo são a última
   superfície a migrar, e a única que toca TODAS as telas. O
   levantamento diz o tamanho: 351 regras em 68 folhas, quase todas com
   !important — contra as 44 folhas da tela de entrada, que já parecia
   pesada. Um defeito aqui não estraga uma área: estraga o caminho para
   todas elas. Foi aqui, também, que apareceu o defeito relatado com duas
   fotos (a barra de baixo por cima da tela de login).

   O teste 20 é a medida "antes": 13 verificações no desktop, 10 no
   navegador do celular e 12 no app instalado.

   TRÊS MOLDURAS, NÃO TRÊS TAMANHOS
   Escrever o teste obrigou a separar o que eu tratava como um só:

     desktop    barra lateral sempre à vista; sem barra de baixo
     celular    a lateral vira gaveta, aberta pelo botão de menu
     instalado  não há botão de menu; quem manda é a barra de baixo

   A diferença entre os dois últimos não é largura, é a regra
   `html:not(.mw-standalone) ... #mwBottomNav{display:none!important}` —
   e é escolha de produto: no navegador a pessoa tem a lateral e o
   hambúrguer; a barra de baixo existe para o app instalado, onde não há
   barra de endereço nem aba.

   UM ACHADO REAL: 42px onde a plataforma pede 44
   Os botões da barra de baixo saíam com 42px de altura. A barra tem 73px
   e 13,4px de recheio vertical — folga de sobra; um `min-height: 44px`
   resolve sem mexer em mais nada, nem na lente, que se posiciona pela
   coluna e não pela altura. É o alvo principal de toque de um app
   instalado; dois pixels contam.

   E CINCO VEZES EM QUE O TESTE ESTAVA ERRADO, NÃO O APP
   Todas viraram comentário no próprio teste, porque todas são fáceis de
   repetir:

   1. "a barra do topo não mostra o perfil" — no desktop `#profileBtn`,
      `#themeToggle` e `#quickAdd` são display:none DE PROPÓSITO: perfil
      e tema moram na lateral, que está sempre à vista. Duplicá-los no
      topo é que seria o defeito. A pergunta certa não é "o botão X está
      no topo?", é "a função X está ao alcance em algum lugar?".
   2. "o menu do sino é invisível" — medido no meio da transição de
      abertura, com opacidade ainda em 0. E o fundo dele vem de
      `background-image` (um degradê), não de `background-color`: olhar
      só a cor dá alpha 0 num menu sólido.
   3. "a barra de baixo não aparece no celular" — ver acima: ela é do app
      instalado.
   4. "a barra de baixo sumiu" — o teste tinha acabado de abrir
      Configurações, que é uma TELA-FOLHA: ali o app marca
      `body.mw-tela-folha`, esconde a barra e mostra a seta de voltar. O
      teste agora afirma esse comportamento em vez de tropeçar nele.
   5. "o perfil da barra de baixo não navega" — ele abre a GAVETA. Foi
      decisão de uma rodada anterior: no app instalado o hambúrguer foi
      substituído pela foto de perfil, e ela virou a porta do menu.

   E uma armadilha de ambiente: acrescentar `mw-standalone` à mão depois
   da abertura não pega — a marca é decidida uma vez, na primeira linha
   de script, a partir de `matchMedia('(display-mode: standalone)')`. O
   modo instalado finge o matchMedia ANTES de a página carregar, pelo
   mesmo caminho do teste 4. O `ajuda.abre()` ganhou a opção `init` para
   isso.

   A migração da navegação em si é a próxima rodada. Esta entrega o que
   protege ela.

   Suíte: 20 de 20.

/* v95 (BETA — o contraste da tela de entrada, medido por pixel pela
   primeira vez, e corrigido):

   POR QUE SÓ AGORA
   O teste 7 mede contraste fotografando a tela e lendo o pixel — a
   única medida honesta num app de gradiente sobre translucidez sobre
   gradiente. Só que ele usa o `abre()`, que ESCONDE a tela de login
   para chegar ao app. Resultado: a única tela que toda pessoa vê antes
   de qualquer outra nunca tinha sido medida.

   Isso passou despercebido enquanto o fundo dela era `#0b0c0e` cravado,
   igual nos dois temas. A migração da rodada passada tirou esse carimbo
   — a tela passou a seguir o tema, o que é uma melhora e é também um
   motivo para medir. O `7b-contraste-login.mjs` faz isso, nas três
   larguras e nos dois temas, e entra no rodar.sh como teste 19.

   O QUE ELE ACHOU, E O QUE FOI FEITO
   1. Os três links de "esqueci" a 10,5px em `--muted2`: 2,8 a 3,98:1.
      O tom mais apagado da paleta antiga, no menor corpo da tela, para
      os links que alguém trancado do lado de fora precisa achar. Agora
      `--mw-txt-2` e 12px.
   2. O item inativo do trilho lateral: 3,39 a 3,89:1. Era `--ds-txt-3`;
      é um controle de navegação, não uma legenda. Agora `--mw-txt-2`.
   3. Os links de acento sobre o cartão claro ("Criar agora.",
      "Entrar."): 2,72:1. Eram `--blue2`, o mesmo #38bdf8 nos dois
      temas. Agora `--mw-ac-txt`, que é o tom de acento pensado para
      TEXTO e muda com o tema.
   4. O botão primário no tema claro: 4,18 a 4,26:1. Uma regra da folha
      da área trocava o degradê ESCURECIDO do sistema pelo degradê cru.
      A regra deixou de alcançar o botão de entrar (que é `ds-btn`) e
      continua valendo para o de criar conta, que é outro componente.
   5. A cápsula do item ativo no celular: 4,27:1 no escuro e 4,12:1 no
      claro (ali a folha clara pintava o texto de escuro sobre o mesmo
      degradê). Agora `--mw-ac-grad-forte` com texto branco nos dois
      temas — a cor de fundo é a mesma nos dois, então quem decide o
      texto é ela, não o tema da página.

   E DOIS FALSOS POSITIVOS DO PRÓPRIO MEDIDOR
   Nenhum dos dois era defeito, e os dois teriam custado uma correção
   errada:

   - O rótulo "Senha" a 1,14:1. A amostragem de fundo olha as faixas
     acima e abaixo da caixa do texto; com o campo FOCADO, logo abaixo
     do rótulo está o anel de foco azul. O rótulo está sobre o cartão.
     A coleta agora tira o foco antes de fotografar.

   - "Bem-vindo de volta." a 1,36:1. O cartão desliza entre entrar e
     criar num trilho com `overflow:hidden`, e o painel que saiu de
     vista continua com uma caixa de posição perfeitamente plausível:
     a amostra media o que estava desenhado naquele ponto da tela, que
     era outra coisa. O painel, medido diretamente, vai de 7:1 a 13,7:1.
     A coleta agora exige que o elemento caiba dentro de cada ancestral
     que recorta — não basta estar dentro da janela.

   O QUEM-VESTE PASSOU A RECEBER O TEMA
   Ele só rodava no escuro, e foi por isso que a regra do item 4 demorou
   a aparecer: uma tela tem dois temas, e medir um é medir metade. Agora
   roda nos dois, para as quinze superfícies.

   E UMA ARMADILHA NO PRÓPRIO RODAR.SH
   A lista de comandos é executada com `eval`, que roda no MESMO shell —
   e vários desses comandos são laços com `|| exit 1` dentro. Quando o
   teste 18 acusou uma falha de verdade, esse `exit` encerrou o rodar.sh
   no meio: sem resumo, sem derrubar o servidor, e com a última linha do
   log ("ninguém de fora — o sistema veste todos") parecendo um teste que
   passou. Custou uma execução inteira, de 25 minutos, para aparecer.
   Cada comando roda agora num subshell.

   A falha que ele estava escondendo era real e do mesmo tipo do item 4:
   uma regra do tema claro pintando `label`, `p`, `span` e `small` dentro
   do painel — e o rótulo já é `ds-rotulo`, a nota já é `ds-corpo`. As
   três saíram da lista; o sistema veste, como deve.

   Suíte: 19 de 19, com o contraste da entrada em zero falha nas três
   larguras e nos dois temas, e o quem-veste limpo nas quinze superfícies
   nos DOIS temas (trinta execuções).

/* v94 (BETA — a tela de entrada no Design System, e dois defeitos reais
   que apareceram enquanto o teste dela era escrito):

   A TELA QUE TRANCA A PESSOA DO LADO DE FORA
   Login e cadastro é a última superfície grande do app e a única cujo
   defeito não tem contorno: um cartão torto em Relatórios é feio; um
   botão de entrar que não responde é o fim da linha. Por isso o teste
   novo (17) cobre o CAMINHO INTEIRO — criar conta, sair, entrar de
   novo — e não só a aparência: troca de painel, rótulos, olho da senha,
   as três etapas, a barra de força, a confirmação que não bate, o
   campo-armadilha, a recuperação, a entrada social desligada, e o
   vazamento em três larguras e dois temas. São 24 verificações.

   DOIS DEFEITOS REAIS, ACHADOS AO ESCREVER O TESTE
   1. A mensagem de erro era apagada pela própria navegação que devia
      mostrá-la. Com senhas diferentes, o envio escrevia "As duas senhas
      não são iguais." e logo depois chamava a troca de etapa, que
      termina limpando a caixa de erro. Quem via isso era quem aperta
      Enter na etapa 2 (o botão de enviar fica escondido ali, mas
      continua sendo o alvo do Enter): o formulário não fazia nada
      visível. Agora a mensagem entra DEPOIS da troca e sobrevive a ela.

   2. O campo-armadilha só era conferido no caminho da nuvem. O handler
      do Supabase começa com `if (!temNuvem()) return;` — então quando a
      rede cai, ou o projeto não está configurado, o cadastro caía no
      caminho local, que não tinha a conferência. É justamente o caminho
      que sobra quando o de cima falha. A armadilha agora vale nos dois,
      e nos dois em silêncio: sem mensagem que ensine o robô a tentar
      outro jeito.

   A MIGRAÇÃO
   Campo, botão do olho, botão primário, botões das etapas, entrada
   social e mensagens passaram para os componentes do sistema. O trilho
   lateral de "Entrar / Criar" chegou a virar `ds-aba` e voltou atrás:
   as abas do sistema são um controle segmentado horizontal, e aquilo é
   uma coluna de dois itens com uma barra que desliza ao lado. Não é a
   mesma peça com outra pele — é outra peça, e fica com a área.

   UM PONTO CEGO DA FERRAMENTA, E A FERRAMENTA NOVA
   O `quem-vence` separa o que acha em três baldes, e um deles — "CSS
   próprio da área" — some do relatório de propósito. O problema é que
   uma folha pode ser as duas coisas: `mw-ds-login` é o layout do cartão
   de entrada (que fica) E era a pele dos campos (que tinha de sair).
   Enquanto ela estava declarada como própria, o relatório dizia "zero
   regras legadas" com os campos ainda vestidos pela folha antiga.

   Daí o `tools/ds/quem-veste.mjs`, que pergunta o contrário: dos
   elementos que carregam uma classe `ds-*`, quais estão sendo pintados
   por quem não é o sistema? Aí não há balde onde se esconder. Na
   primeira execução ele achou três, duas delas em áreas dadas como
   prontas há rodadas:

     entrada       mw-ds-login vestindo os campos
     calendário    mw-calendario vestindo o "Mês / Semana"
     configurações mw-transfere-style vestindo o botão secundário

   As três peles saíram; os componentes do sistema assumiram. Ele agora
   roda para as quinze superfícies, no teste 18.

   Suíte: 19 de 19.

/* v93 (BETA — Início e Arquivos migrados: as 14 áreas agora são pintadas
   pelo Design System):

   O QUE ENTROU
   As duas últimas áreas que ainda usavam as folhas legadas — Início (o
   painel) e Arquivos — foram reescritas com os componentes do sistema:
   `ds-grade`, `ds-resumo`, `ds-cartao`, `ds-secao-cabeca`, `ds-titulo`,
   `ds-rotulo`. Com elas, o contador do teste 13 fecha em 14 de 14:

     14 migrada(s) pintada(s) pelo sistema, 0 legada(s) intocada(s)

   Como nas rodadas anteriores, nada foi empilhado por cima do legado: as
   79 regras que ainda alcançavam as duas telas foram RESTRINGIDAS na
   origem, com `:not([data-mw-migrada] *)`, pelo tools/ds/restringe.py.
   Elas continuam valendo onde ainda não houve migração e param na porta
   das áreas migradas.

   TRÊS FALSOS POSITIVOS DOS MEUS PRÓPRIOS TESTES, CORRIGIDOS
   Os três acusavam defeito onde não havia, e os três já custaram uma
   sessão de depuração cada — por isso ficam anotados aqui e no
   tools/testes/LEIAME.md.

   1. "texto espremido" numa barra de progresso. O `<i>` da barra é vazio
      e está dentro de uma caixa com overflow:hidden; durante a transição
      de largura o scrollWidth passa do clientWidth. A checagem existe
      para pegar TEXTO que some sem reticências — sem texto, não há o que
      sumir. Agora ela exige `(e.textContent || '').trim()`.

   2. Um limiar único de "tem conteúdo" para oito telas diferentes. Ele
      reprovava Faculdade (341px, correta) e teria aprovado uma tela
      vazia. Virou um mínimo por área, medido por altura E por número de
      controles: o Calendário tem 34 controles e 171 caracteres de texto,
      e está certo assim.

   3. "vazamento horizontal" no Início: era um `<rect class="mw-carga-alvo">`
      DENTRO do SVG do gráfico. A checagem sobe pelos ancestrais HTML
      procurando overflow-x, e o recorte do viewport de um SVG não aparece
      dessa forma — a caixa do <rect> passa da tela sem que um pixel seja
      desenhado lá fora. Quem pode vazar de verdade é o <svg>; os filhos
      dele são medidos por ele. Guarda: `if (e.ownerSVGElement) return false;`,
      agora nos cinco arquivos de teste que fazem essa medição, e não só
      em três deles.

   O QUE AINDA FALTA NESTA FRENTE
   Login/cadastro, a barra lateral e a barra de baixo, e a auditoria final
   — que só agora faz sentido: com tudo migrado, dá para APAGAR folhas
   legadas inteiras em vez de restringi-las uma a uma.

/* v92 (BETA — a barra de baixo não aparece mais sobre a tela de login):

   O DEFEITO, RELATADO COM DUAS FOTOS
   Na primeira, a tela inteiramente borrada, nada legível, sem saída
   visível. Na segunda, a tela de login com a barra de baixo por cima —
   Início, Faculdade, Arquivos e Perfil clicáveis sem sessão nenhuma.

   As duas são a mesma coisa, uma atrás da outra.

   A CAUSA
   Uma regra com dois seletores, e só um deles com a trava:

     html body.mw-in-app #mwBottomNav.mwbn,   -> travado no app
     html body #mwBottomNav.mwbn{             -> sem trava
       display: flex !important; ... }

   O lado destravado existia para garantir a especificidade do LAYOUT
   (flex em vez de grade). Só que `display` não é uma propriedade de
   layout como as outras: declarada ali sem a trava, ela vencia os dois
   `#mwBottomNav{display:none!important}` que escondem a barra antes de
   entrar.

   Tocar num daqueles itens marcava uma área como ativa dentro de um #app
   escondido. Desse estado dava para chegar ao véu da gaveta lateral —
   fixo, tela inteira, backdrop-filter: blur(6px), z-index 110 — enquanto
   a gaveta que ele acompanha está em z-index auto. O véu cobre tudo,
   inclusive o menu. É a primeira foto.

   NÃO FOI A MIGRAÇÃO
   A mesma sonda rodada contra o build de antes de todas as migrações
   desta conversa (v87) dá idêntico. O defeito é antigo.

   POR QUE NENHUM TESTE PEGOU
   Todos os dezessete semeiam sessão e entram no app antes de medir.
   Ninguém olhava o único momento em que o defeito existe: a tela de
   login de quem ainda não entrou. E só no app INSTALADO — a barra de
   baixo é escondida por `html:not(.mw-standalone)`, então medir num
   navegador comum passa por um caminho que o defeito nem percorre.

   O QUE MUDOU
   1. `display` da barra só é imposta com body.mw-in-app; o resto da
      regra, que é layout puro e inofensivo fora do app, segue sem a
      trava.
   2. Segunda trava, no mesmo assunto: fora do app o véu da gaveta não
      existe (`html body:not(.mw-in-app) #mwSidebarScrim{display:none}`).
   3. O teste 4 passou a fingir o app instalado e a conferir o que sobra
      na tela de login. Provado contra o defeito real: reintroduzido de
      propósito, ele acusa; corrigido, passa.

   Conferido nos dois sentidos: instalado com sessão, a barra aparece;
   instalado na tela de login, não aparece. */

/* v91 (BETA — Faculdade, Relatórios, Foco e Calendário no Design System):

   DOZE DE CATORZE
   Sobram Início, e o login/cadastro com a barra lateral e a de baixo —
   que são as três últimas da ordem justamente porque tocam todas as
   outras.

   Estas quatro têm layout próprio em cada uma: uma grade de seis cartões
   em Relatórios, um relógio com anel de progresso em Foco, uma malha de
   dias no Calendário, um formulário em Faculdade. Migrar aqui não é
   trocar o layout — é trocar a CASCA por componentes do sistema (cartão,
   cabeçalho de seção, campo, botão, controle segmentado) e deixar o que
   só existe naquela tela onde está, lendo os tokens do sistema.

   O CALENDÁRIO É MONTADO POR JS
   A área é uma <section> vazia no HTML; a barra Mês/Semana e o cartão da
   semana nascem em tempo de execução. Então a escolha do material
   também: o gerador pergunta ao DOM se a área está migrada e emite um
   conjunto de nomes ou o outro, nunca os dois — a mesma regra que o
   quadro de Projetos e os filtros já seguiam.

   O CICLO MEDIR → RESTRINGIR → MEDIR, DE NOVO
   O legado que ainda alcançava estas quatro era o de sempre: seletor
   amplo, por elemento ou por id, com !important. Foram 2 regras em
   Faculdade, 11 em Relatórios, 18 em Foco e 98 no Calendário, em oito
   passadas — a cada passada, tirada a regra da frente, aparece a que
   estava atrás dela. As quatro terminaram com zero regras legadas
   vencendo lá dentro, nos dois temas.

   UM DEFEITO DE ACESSIBILIDADE QUE A MIGRAÇÃO REVELOU
   As setas de mês do Calendário tinham menos de 24px. O tamanho vinha de
   uma regra legada ampla; restringi-la (que é o que o protocolo manda)
   deixou as setas no tamanho padrão do navegador. Agora são botões de
   ícone do sistema, que carregam o alvo mínimo por definição.

   O TESTE DE ÁREA VIROU O DAS SEIS QUE NÃO SÃO COLEÇÃO
   Perfil, Configurações, Faculdade, Relatórios, Foco e Calendário. As
   checagens comuns valem para todas; a última é própria de cada uma,
   porque "funcionar" quer dizer coisa diferente em cada tela: em
   Relatórios é o número ainda ler o dado, em Foco é o cronômetro andar,
   no Calendário é mês e semana serem dois modos de verdade.

   E uma armadilha do próprio teste: um limiar único de "tem conteúdo"
   reprovava Faculdade (341px, e está certa) e teria aprovado uma tela
   vazia. Os mínimos passaram a ser por área.

   SUÍTE
   17 execuções verdes. Contraste: 0 falhas em 3 larguras x 2 temas, mais
   os dois temas da galeria. */

/* v90 (BETA — Perfil e Configurações no Design System, e o legado que
   mira por id):

   AS ÁREAS
   Com estas duas são OITO áreas sob o sistema, e seis ainda legadas.
   Perfil e Configurações não são coleções: não têm lista, formulário de
   criar nem linha com Editar/Excluir. São telas de campos e
   interruptores, e o que uma migração pode fazer sumir ali é outra coisa
   — um campo que deixa de gravar, um rótulo que se solta do controle,
   uma categoria que desaparece. Por isso ganharam um teste próprio
   (16-ajustes), verde antes e depois nas duas.

   O SISTEMA GANHOU O QUE FALTAVA PARA TELA DE AJUSTE
   Grupo (título, uma linha explicando, e os controles), linha de ajuste,
   título de categoria, grupo de selos, barra de filtros — e, obrigado
   pela migração, duas coisas que eram do app e viraram do sistema: cor
   de link e tamanho de caixa de seleção. As duas vinham de regra global
   do legado; sem elas, a área migrada ficava com o azul padrão do
   navegador e caixas de 13px, abaixo dos 24 que a WCAG pede.

   O LEGADO QUE MIRA POR ID
   Nas duas primeiras migrações bastava o desligamento por :where():
   as regras legadas miravam classes, e tirar a classe da marcação já as
   deixava para trás. Aqui não. Perfil e Configurações são alcançadas por
   id (html body #app #saveProfile{ … !important }) e por elemento
   (#app input, #app select, #app textarea). Nenhum dos dois usa classe,
   então o desligamento por nome não alcança — e contra !important sem
   camada não existe regra que se ACRESCENTE. Eram 22 em Perfil e 52 em
   Configurações.

   O protocolo já dizia o que fazer: restringir o seletor legado. O que
   faltava era não fazer isso à mão 74 vezes. Agora o quem-vence.mjs
   emite os achados em JSON e o tools/ds/restringe.py acrescenta
   :not([data-mw-migrada] *) a cada parte do seletor — medir, restringir,
   medir de novo, até parar de cair.

   TRÊS COISAS QUE O SCRIPT SE RECUSA A TOCAR, cada uma aprendida com um
   defeito de verdade:
     · o reset global button,input,textarea{font:inherit} — restringi-lo
       devolve a fonte do sistema operacional aos controles;
     · mw-alvos e mw-teclado, que são CORREÇÕES válidas para o app
       inteiro — restringidas, os cinco links do Perfil voltaram a 14px;
     · o CSS próprio de cada área — o interruptor do Perfil público virou
       uma caixa de seleção crua de 18px quando foi restringido junto.

   E uma quarta, no desligamento: `button` não pode entrar na lista de
   elementos. O seletor de lá tem id mais atributo, então venceria também
   as regras de CLASSE de botões que só existem numa tela — o interruptor
   do Face ID virou um retângulo de 0px. Campo de formulário é genérico;
   botão, muitas vezes, é componente da área.

   O RELATÓRIO PASSOU A TER TRÊS SEÇÕES
   Legado por substituir, CSS próprio da área, e correções do app
   inteiro — com os números à vista, em vez de uma exceção silenciosa
   escondida no código da ferramenta. O quem-vence também aprendeu que
   `all: revert-layer` declara todas as propriedades: sem isso ele
   acusava como "legado vencendo" justamente a regra que desliga o
   legado.

   SUÍTE
   17 execuções verdes. Contraste: 0 falhas em 3 larguras x 2 temas, mais
   os dois temas da galeria. Zero regras legadas vencendo nas oito áreas
   migradas, nos dois temas. */

/* v89 (BETA — as quatro áreas de coleção no Design System, e oito
   seletores que a migração teria quebrado em silêncio):

   AS ÁREAS
   Disciplinas, Projetos, Atividades e Anotações passaram para o sistema
   numa rodada só, porque compartilham o gerador do formulário, o
   template da linha e os selos: migrar uma sem as outras deixaria o
   mesmo gerador servindo dois materiais ao mesmo tempo. Com Suporte e
   Instituições, são SEIS áreas sob o Design System, todas com zero
   regras legadas vencendo lá dentro, nos dois temas.

   O template da linha, que estava repetido quatro vezes, virou um lugar
   só (mwLinha). Enquanto era só legado isso era repetição; na migração
   viraria armadilha, porque cada cópia teria de aprender a escolher o
   conjunto de classes sozinha.

   OITO SELETORES QUE TERIAM QUEBRADO CALADOS
   Toda migração renomeia classes, e todo querySelector preso a uma
   dessas classes quebra junto — sem erro no console e sem um pixel fora
   do lugar, porque seletor que não casa devolve null e o bloco desiste:

     · a agenda de Atividades procurava .list-item      → a lista voltaria
       à ordem de cadastro, sem os títulos "Atrasadas / Hoje / Esta semana"
     · a ordem por semestre de Disciplinas, idem
     · a ordem por prazo de Projetos, idem
     · o "Ver mais" das Anotações                       → nunca apareceria
     · o filtro (aplica)                                → deixaria de filtrar
     · o monta() do quadro procurava .section-head      → o quadro inteiro
       nunca seria construído
     · o Escape no formulário procurava .add-btn        → o foco cairia no
       <body> em vez de voltar ao botão
     · o filtro de Projetos procurava [data-v] no selo  → "Em andamento" e
       "Concluídos" não achariam nada

   A regra que sai daí: o que o JS precisa achar depois é ATRIBUTO, não
   classe. [data-mw-linha], [data-mw-cabeca], [data-add], [data-filtro],
   data-v. Atributo é dado; o desligamento do legado mata classes e não
   os alcança, e o nome não muda com a migração.

   E uma segunda, sobre guardas: `(typeof mwArea === 'function') &&
   mwArea(a)` parece defensivo e é o contrário. O helper não era global,
   então a expressão dava false calada — e a barra Quadro/Lista e os
   filtros seguiram montando o material antigo dentro de áreas já
   migradas, até serem medidos.

   O TESTE QUE FALTAVA
   Nenhum desses oito aparecia com UM item na lista: todo bloco que
   reordena ou agrupa desiste quando há menos de dois. O teste de área
   agora semeia seis e confere que o agrupamento continua de pé. Provado
   contra o defeito real: reintroduzido de propósito, ele falha; corrigido,
   passa.

   FERRAMENTA
   O quem-vence.mjs passou a separar "legado por substituir" de "CSS
   próprio da área". O quadro de Projetos e a agenda são componentes que
   só existem naquela tela — o sistema não vai ter um quadro Kanban. O que
   se exige deles é que leiam os TOKENS do sistema, e é o que passaram a
   fazer; os dois números ficam à vista no relatório, em vez de uma
   exceção silenciosa. */

/* v88 (BETA — Instituições migrada, e três defeitos que a migração revelou):

   A ÁREA
   Instituições é a segunda tela inteiramente sob o Design System. Mesmo
   protocolo: levantamento de dependências, teste da área verde ANTES de
   tocar em nada, marcação reescrita com os componentes, legado desligado
   por escopo, mesmo teste verde DEPOIS. quem-vence.mjs: 25 elementos
   examinados, zero regras legadas vencendo, nos dois temas.

   O teste da área virou genérico (tools/testes/15-area.mjs <área>) e roda
   nas seis coleções, migradas ou não — é o "antes" da próxima migração
   sem escrever uma linha nova.

   TRÊS DEFEITOS QUE ESTA RODADA REVELOU

   1. UM CONJUNTO DE CLASSES, NÃO OS DOIS.
      O gerador compartilhado das cinco áreas emitia os nomes novos E os
      antigos, para a área migrada "continuar coberta caso faltasse
      alguma coisa". Medido: 35 regras legadas continuavam vencendo lá
      dentro. Contra html body #app .main .card{ … !important } não existe
      regra ACRESCENTADA que ganhe — carregar o nome antigo é continuar
      sendo pintado por ele. Agora o gerador escolhe um conjunto ou o
      outro, e o que o JS precisa achar depois virou atributo
      ([data-workspace-form], [data-add], [data-mw-linha]), que não muda
      com a migração.

   2. BOTÕES DE 0x0 EM PROJETOS, DISCIPLINAS, ATIVIDADES E ANOTAÇÕES.
      O prefixo do Design System mudou de mw- para ds- porque o app já era
      dono de mw- (.mw-selo tinha 18 regras legadas, .mw-btn 12, .mw-resumo
      16). A troca alcançou, sem querer, nomes de classe do LEGADO no meio
      dos geradores: mw-item-acoes virou ds-item-acoes, mw-selo virou
      ds-selo, mw-resumo-chip virou ds-resumo-chip. O CSS legado continuou
      dizendo .mw-item-acoes; o sistema só pinta sob .ds; então aqueles
      elementos ficaram sem regra nenhuma. Editar e Excluir viraram um div
      de 0x0 — sumiram da tela sem erro no console. Catorze trechos
      restaurados. O teste 13 agora confere que todo nome ds-* usado no app
      existe na folha do sistema, e que todo elemento com ds-* está dentro
      de área migrada.

   3. CONTRASTE MEDIDO SOBRE FUNDO ANIMADO NÃO SE REPETE.
      O #app::before é um gradiente de acento a 62% que translada e escala
      num ciclo de 34 s, e o vidro deixa passar. A mesma tela dava 3 falhas
      numa rodada e nenhuma na seguinte, sem uma linha ter mudado. A coleta
      agora congela as animações infinitas e fotografa os dois extremos do
      ciclo, que cercam o pior caso. Com a medição reprodutível apareceram
      duas correções reais: cartão dentro de cartão deixou de ser vidro
      sobre vidro (fundo imprevisível: 3,4:1 dentro do app contra 4,9:1 na
      galeria), e o texto de apoio do app (--mw-muted / --ds-txt-2) passou
      de #a9b6d6 para #b8c4e0, que mede 4,7:1 sobre a superfície mais clara
      onde ele de fato aparece. Contraste: 0 falhas em 3 larguras x 2 temas,
      mais os dois temas da galeria.

   4. O SELETOR DE TEMA DA GALERIA NÃO PEGAVA HAVIA UMA RODADA.
      O carimbo do tema mudou de data-mw-tema para data-ds-tema, e o teste
      13 continuou setando o antigo: as duas passagens mediram o tema
      escuro, e o relatório dizia "claro ok" com a mesma cor de fundo do
      escuro. Um seletor de tema que não pega não levanta erro — só mede
      duas vezes a mesma coisa. Agora os dois temas TÊM de dar fundos
      diferentes, senão o teste acusa. Com o tema claro aplicado de
      verdade: 0 falhas de contraste também nele. */

/* v87 (BETA — Suporte é a primeira área no Design System):
   Migração de verdade: o CSS antigo da área SAIU, não foi coberto.

   O PROTOCOLO, EXECUTADO NA ORDEM
   1. Levantamento (tools/ds/dependencias.py support): 25 regras eram da
      área; 2.492 chegavam de raspão de seletores amplos, 1.586 com
      !important.
   2. Teste da área ANTES de tocar em nada: 25 verificações do que a área
      FAZ — abrir atendimento, validar campo vazio, conversar, anexar,
      encerrar, voltar, persistir no recarregamento, e não vazar em três
      larguras x dois temas. Verde no legado.
   3. Marcação reescrita com os componentes do sistema; a folha
      mw-support-style perdeu as 50 regras de aparência e ficou só com o
      que é desta tela e de mais nenhuma: o mecanismo de trocar de painel
      e o layout da conversa — escrito com os TOKENS do sistema.
   4. Desligamento do legado por escopo, com :where() de especificidade
      zero, restrito a #view-support[data-mw-migrada="1"].
   5. Mesmo teste DEPOIS: as mesmas 25 verificações, verdes.

   TRÊS DEFEITOS QUE A MIGRAÇÃO REVELOU
   1. O app sinalizava o tema pela AUSÊNCIA de body.light. Isso basta para
      o CSS legado, mas quebra o sistema: o fallback dele por
      prefers-color-scheme lê a ausência como "ninguém escolheu" e segue o
      sistema operacional — o app estava no escuro e o cartão veio com o
      vidro do tema claro. Agora o tema é carimbado no <html>,
      positivamente, no boot e a cada troca.
   2. Duas regras legadas miravam o ELEMENTO (body.light #app h1/h2/h3, e
      p/span/small), então o desligamento por classe não as alcançava, e a
      primeira, com !important, vencia o sistema dentro da área migrada.
      Foram RESTRINGIDAS com :not([data-mw-migrada] *) — continuam valendo
      nas treze áreas legadas e param na porta das migradas.
   3. --mw-txt-3 (#7b88a6) media 4,25:1 sobre o vidro que cobre o gradiente
      da canvas do app. O fundo da galeria é mais escuro, e por isso o
      defeito só apareceu quando o sistema encontrou a superfície de
      verdade. Virou #8893af: 4,91:1, ainda abaixo de --mw-txt-2 para a
      hierarquia entre os três níveis sobreviver.

   FERRAMENTA NOVA
   tools/ds/quem-vence.mjs percorre a área migrada e diz qual regra está
   ganhando em cada propriedade. Passar no teste prova que nada quebrou;
   não prova que o sistema é quem pinta. Hoje, em Suporte: zero regras
   legadas vencendo, nos dois temas.

   O teste 13 mudou de pergunta junto com a realidade. Não é mais "a folha
   não pode mexer em nada": é "ela tem de mexer EXATAMENTE nas áreas
   migradas, e em nenhuma outra". Mede as duas metades. */
/* v86 (BETA — o Design System novo, completo e ainda sem tocar em tela nenhuma):
   Primeira metade da reformulação combinada: construir o sistema inteiro
   ANTES de migrar qualquer área, para a transformação visual não acontecer
   sobre base instável.

   O QUE ENTROU
   ds/mw-ds.css     o sistema: 189 regras
   ds/index.html    a galeria: todo componente, nos dois temas, em 4 larguras
   ds/amostra.html  uma tela do MW montada só com o sistema
   ds/LEIAME.md     arquitetura, nomes e o protocolo de migração
   tools/ds/dependencias.py   mapeia o CSS legado que pinta cada área
   tools/testes/13-ds.mjs     mede o sistema isolado e a inércia dele no app

   TRÊS REGRAS QUE FAZEM O "NÃO EMPILHAR" SER VERIFICÁVEL
   1. Tudo vive sob `.mw-ds`. Sem nenhum `.mw-ds` no documento, o arquivo é
      inerte — e o teste 13 comprova isso comparando o app com a folha ligada
      e desligada, área por área: zero diferença nas catorze.
   2. Nenhum !important de componente. A ordem interna é resolvida por
      @layer, que ordena sem inflar especificidade. Os oito do arquivo estão
      fora da estilização (leitor de tela, movimento reduzido, impressão).
   3. Componente não conhece cor: só tokens semânticos. Trocar de tema é
      trocar variáveis, não caçar declarações.

   O QUE O SISTEMA COBRE
   Tokens de cor, espaço, tipo, raio, sombra, movimento, camada e alvo de
   toque. Liquid Glass com desfoque E saturação, brilho de 1px na borda de
   cima, e superfície sólida onde backdrop-filter não existe. Botão (4 tons x
   3 tamanhos x 6 estados), campo, cartão, lista, selo, filtro, cartão de
   número, progresso, avatar, navegação lateral e inferior, abas, tabela,
   estado vazio, esqueleto, diálogo (folha no celular) e aviso. Mais
   prefers-reduced-motion, prefers-contrast e impressão.

   UM DEFEITO DE CONTRASTE, ACHADO E CORRIGIDO NO PRÓPRIO SISTEMA
   No tema claro os selos tinham fundo translúcido a 12-14%. Isso não pinta o
   suficiente para dominar: quem estabelecia o contraste era a PÁGINA atrás
   deles, e "Concluído" media 3,98:1. Os fundos viraram opacos — a mesma
   mistura sobre branco, congelada — e o âmbar desceu de #b45309 para
   #92400e, porque 4,58:1 é passar raspando. Agora zero falha nos dois temas,
   com 169 textos medidos no pixel em sete rolagens da galeria.

   E DOIS DEFEITOS NA MEDIÇÃO, QUE QUASE VIRARAM DEFEITO NO CÓDIGO
   1. O teste acusou o DS de estar vazando no app: tudo 1,2% maior com a
      folha ligada. Não era. O #app tem uma mola de scroll que anima sozinha,
      e getBoundingClientRect() inclui transformações — eu estava medindo a
      animação. offsetWidth ignora transform, que é o que se quer comparar.
   2. O contador de regras dizia 14 num arquivo de 189: desde o CSS Nesting,
      TODA CSSStyleRule tem um `cssRules` (vazio), então "tem cssRules? é
      agrupamento" virou falso. O que distingue é `style.length`.

   A folha já entra no <head> do app e no cache do service worker, inerte.
   Migração das áreas na próxima rodada, uma por vez, na ordem do LEIAME. */
/* v85 (BETA — operar o app sem mouse, e a agenda que cabia em 54 telas):
   Rodada de estabilização. Três frentes, todas medidas antes e depois.

   1. TECLADO. Uma sonda achou quatro defeitos, e o primeiro é sério: o
      diálogo de exclusão abria e o foco NÃO ia para dentro dele. O Tab
      continuava passeando pela página atrás, e o Escape não fechava.
      Ele declara aria-modal="true", que é uma promessa para a
      tecnologia assistiva — mas o navegador não implementa nada disso
      sozinho. Para quem usa teclado, era um diálogo impossível de
      operar e de sair. São ONZE diálogos no app com a mesma declaração,
      por isso o bloco mw-teclado resolve genericamente, e não naquele.
      Também entraram: Escape fechando o formulário de criação, o foco
      voltando para quem abriu o diálogo, e um "Pular para o conteúdo"
      no primeiro Tab — antes eram dezoito Tabs até sair da barra
      lateral, a cada carregamento.

   2. DIÁLOGOS NATIVOS. Nove prompt()/confirm() do sistema operacional
      ainda conviviam com o cartão de confirmação próprio do app, que só
      era usado ao excluir um item. Todos passaram para os diálogos do
      app (mwPedirValor, que já existia, e mwConfirmar, novo): apagar
      todos os dados, definir e remover o código de acesso, sair dos
      outros aparelhos, colar código de conta nos dois lugares, e
      renomear e apagar conversas da Nyc AI. Cada um exigiu passar de
      chamada síncrona para promessa; a sintaxe dos 126 blocos inline
      foi conferida um a um depois.

   3. LISTAS LONGAS. Com 120 atividades a área tinha 21 mil pixels —
      umas 54 telas de rolagem no celular. Agora os grupos que NÃO pedem
      ação ("Mais adiante" e "Sem prazo") começam recolhidos quando são
      grandes; Atrasadas, Hoje e Próximos 7 dias nunca recolhem, porque
      são a razão de a pessoa ter aberto a área. Resultado medido: 8.247
      pixels ao abrir, com "Mais adiante = 72" no título e um clique
      para expandir. Nada é escondido em silêncio: a contagem fica à
      vista, e o título virou botão com aria-expanded.

   O teste 12 vigia o teclado; o teste 2 passou a vigiar a altura da
   agenda sob carga. 13 de 13 verdes.

   Registrado no README: esta prévia é a etapa de ESTABILIZAÇÃO, não o
   produto final. A reformulação completa — design system novo, Liquid
   Glass, comunidade, Storage de verdade, layouts por dispositivo — vem
   depois, sobre esta base. */
/* v84 (BETA — Disciplinas e Anotações ganham o botão Editar):
   Escrevi um teste que faz o ciclo inteiro nas cinco entidades: criar
   preenchendo todos os campos, recarregar, editar, excluir. Ele achou
   uma lacuna que estava em silêncio desde a Fase 1.
   Instituições, Projetos e Atividades tinham "Editar". Disciplinas e
   Anotações, não. Ou seja: para corrigir um erro de digitação no nome de
   uma disciplina era preciso apagar e cadastrar de novo — perdendo, no
   caminho, o progresso, o código, a instituição e o semestre. Nada na
   tela dizia isso; simplesmente não havia o botão.
   A máquina de edição já existia e já era genérica (data-edit="<tipo>"
   mais o índice, com o formulário guardando editIndex). Faltava só o
   botão nas duas listas.
   O que o teste 11 mede, e passou nas cinco:
   - todo campo digitado chega ao dado (6, 6, 8, 5 e 3 campos);
   - tudo sobrevive a um recarregamento, byte a byte;
   - editar corrige o item e NÃO zera os outros campos;
   - excluir age no item certo mesmo com a lista reordenada. Essa última
     parte embaralha as datas de propósito: a tela ordena por prazo, mas
     os botões guardam o índice da posição original no array. Na
     verificação, a ordem na tela era [2], [0], [1], e apagar o primeiro
     da tela removeu exatamente o de índice 2. */
/* v83 (BETA — a promessa de funcionar sem internet, medida pela primeira vez):
   O README diz que o app "continua funcionando sem internet". Isso é uma
   afirmação sobre o service worker, e até aqui ela nunca tinha sido
   medida — só lida na especificação. O teste 10 instala o SW de verdade,
   desliga a rede e recarrega.
   A promessa se sustenta: sem rede o app abre direto no workspace (não
   na tela de login), os dados locais continuam lá, as 181 folhas de
   estilo vêm junto porque o app é um arquivo só, o fundo é pintado, a
   troca de área responde, e nenhum erro de JS aparece.
   Mas o teste começou falhando por um motivo que valia a pena:
   O registro do service worker era guardado por
       location.protocol === 'https:' || location.hostname === 'localhost'
   e isso deixa de fora 127.0.0.1 e [::1], que a especificação também
   trata como contextos seguros. O efeito era silencioso: quem servisse a
   pasta em 127.0.0.1 para testar ficava sem service worker nenhum, sem
   nenhum aviso na tela — e concluiria que o cache offline não funciona.
   Em produção (https) nunca houve problema; o buraco era em
   desenvolvimento. Agora a condição é window.isSecureContext, que é a
   pergunta certa e responde pelos quatro casos de uma vez.
   Fechou também a auditoria de controle morto: os quatro candidatos que
   sobravam (Definir código, Importar backup, Escolher foto, Ajustar) são
   honestos — três abrem o seletor de arquivo e o do código abre um
   prompt. O que parecia inércia era o Playwright dispensando o prompt
   sozinho. Nenhum botão do app fica em silêncio sem fazer nada. */
/* v82 (BETA — dois formulários para a mesma coisa, e o celular pegava o pior):
   A auditoria desta rodada saiu à procura de controle morto — botão que
   não faz nada e não avisa nada — e achou coisa pior: um que fazia a
   coisa errada em silêncio.
   O app tinha DOIS formulários de nova disciplina. O "+ Adicionar" de
   dentro da área abre o completo: nome, objetivo, progresso, código,
   instituição e semestre. Já o atalho "Adicionar" do painel e o "+" da
   barra de baixo no celular chamavam getElementById('quickAdd').click(),
   e o #quickAdd abria um modal legado de três campos. Ou seja: no
   telefone, o caminho principal de criar entregava o formulário menor, e
   nada na tela dizia isso — os dois abriam "um formulário".
   Agora os quatro caminhos levam ao mesmo lugar, e o teste 9 confere os
   CAMPOS, não só se abriu algo.
   O modal legado saiu junto. Ele já era inalcançável pelo "+ Adicionar":
   o bloco de criação novo escuta o clique na fase de captura do document
   e chama stopImmediatePropagation(), então o onclick que o trecho antigo
   pendurava em cada [data-add] nunca rodava. Só o #quickAdd ainda chegava
   lá. Saíram o markup do #modal, o openModal e o closeModal; as regras de
   CSS que citam #modal ficaram, inertes, porque estão espalhadas por
   cinco folhas antigas em regras de vários seletores.

   Outras duas correções desta rodada:

   1. Contraste. O token --mw-muted (#9db2d4) media 4,41:1 contra a
      superfície mais clara em que ele cai — o .section-card, que é um
      gradiente de branco a 9% — abaixo dos 4,5:1 que a WCAG pede para
      texto de 11px. Virou #a9b6d6, que mede 4,68:1 e é o mesmo valor de
      --ds-txt-2: dois tokens que sempre quiseram dizer a mesma coisa
      agora dizem. Ele governa todo o texto secundário do app (.kicker,
      .project p, .list-item small, .settings-group p, .empty, small).
      A falha só apareceu depois que o colhedor passou a ESPERAR a
      animação de entrada terminar antes de fotografar: antes disso ele
      media um quadro intermediário e o número saía melhor do que é.
   2. Seis blocos <style>/<script> dividiam id com outro bloco
      (mw-final-polish aparecia três vezes). Nada os referenciava, mas o
      id repetido destruía a única informação que ele carregava: qual
      bloco é qual, num arquivo de trinta mil linhas. Agora cada um tem
      nome próprio, e os dois "guarda-tudo" ganharam um comentário no
      topo listando o que mora lá dentro.
      O teste 8 mede isso no DOM vivo, e não com grep: grep acha id="x"
      dentro de comentário de CSS e de string de JS, e foi assim que eu
      persegui dois IDs duplicados que não existiam. */
/* v81 (BETA — a suíte de testes sai do temporário e entra no repositório):
   Até aqui, todo teste desta reformulação vivia num diretório que morre
   quando a sessão acaba. Isso significava que a validação não podia ser
   repetida por ninguém, nem por mim numa sessão seguinte — e o critério
   combinado é justamente "validar em Safari, Chrome, iOS, Android,
   tablet e desktop". Um critério que depende de um teste que não existe
   mais não é verificável.
   Agora são sete testes em tools/testes/, com um rodar.sh que sobe o
   servidor, executa tudo e devolve 0 ou 1: regressão das áreas, carga
   com um semestre inteiro de dados, acessibilidade, flash branco no
   boot, Android com toque de verdade (arrastar cartão do quadro com o
   dedo), o viewport REAL do iPhone (393x695), e contraste WCAG medido
   no pixel em três larguras e dois temas.
   O LEIAME registra também o que NÃO está validado, com o motivo:
   Safari de desktop e iPhone instalado na tela de início continuam sem
   medição, porque o WebKit não é instalável nesta máquina (o proxy
   barra o host de download). Está escrito lá o que fecha essas duas
   linhas.
   Rodar a suíte pela primeira vez encontrou um defeito de verdade:
   seis ações de texto com 13 a 14 pixels de altura — "Abrir projetos"
   no painel e os cinco "Alterar em Configurações"/"Editar em Faculdade"
   do Perfil. Agora têm 24 ou 25. A correção é preenchimento com margem
   negativa: nos chips do Perfil fecha exato (88px de altura antes e
   depois); no cartão do painel sobraram 2px, que é o preço de um alvo
   que sai de 13 para 25.
   O próprio teste também estava errado num ponto: acusava como defeito
   os links "Configurações › Backup" que ficam no MEIO de uma frase. A
   WCAG 2.5.8 dispensa esses explicitamente — o tamanho deles é imposto
   pela entrelinha do texto ao redor, e engordá-los desalinharia o
   parágrafo. A exceção entrou no teste. */
/* v80 (BETA — o primeiro relatório vindo de um iPhone de verdade):
   iOS 18.7, Safari 27, 393x695 a 3x, aberto no navegador. Resultado:
   TUDO que o app precisa funciona. backdrop-filter, color-mix, :has,
   line-clamp, localStorage, e o IndexedDB gravando e lendo arquivo —
   ou seja, a área de Arquivos funciona no iPhone. Espaço disponível:
   38,40 GB. Nenhuma falha.
   Duas correções que o relatório provocou:
   1. A linha "Lente com filtro SVG" saiu. Ela media a coisa errada
      (CSS.supports só diz que a sintaxe é aceita, não que o filtro
      desenha) e reportava um recurso que este app não usa mais — a
      lente está com display:none desde que a barra de baixo foi
      reescrita. No lugar entrou aspect-ratio, que sustenta o anel do
      cronômetro e é usado de verdade.
   2. O comentário do CSS da lente afirmava que o Safari recusa
      backdrop-filter:url(#...). Medido: ele ACEITA. A premissa do
      fallback ("recusa a sintaxe e fica com o blur simples") não vale
      mais, e quem for reativar a lente precisa refazer a estratégia
      antes. Registrado no lugar em vez de deixar a afirmação velha.
   O viewport real é 393x695, e não os 390x844 que os testes usavam. As
   catorze áreas foram reauditadas nessa altura: nada vaza, nada corta. */
/* v79 (BETA — Diagnóstico: o app passa a se medir sozinho):
   Existe por uma limitação honesta: o desenvolvimento é verificado no
   Chromium, e o Safari do iPhone tem diferenças reais justamente no que
   este app usa. Tudo que se afirmava sobre iOS era leitura de
   especificação, não medição.
   Agora, em Configurações › Aplicativo, há uma verificação que RODA no
   aparelho de quem abriu: abre o IndexedDB e grava um registro de
   verdade, escreve e apaga uma chave no localStorage, mede o
   safe-area-inset real, pergunta o espaço disponível, e checa as quatro
   capacidades de CSS de que o desenho depende (backdrop-filter, o mesmo
   com filtro SVG, color-mix e :has). Cada linha diz o que quebra se
   aquilo faltar, e há um relatório em texto para copiar.
   Nada é afirmado por omissão: o que não deu para medir aparece como
   "não deu para medir", que é diferente de "passou".
   Dois defeitos meus, achados no próprio teste desta tela: o suporte a
   :has() era testado com a forma de dois argumentos de CSS.supports,
   que é para declarações e não para seletor — dizia que o Chromium não
   suporta :has(), e um diagnóstico que erra é pior que nenhum. E a
   coluna do valor era "auto", então um valor longo espremia o rótulo
   até quebrar uma letra por linha ("Service worker" saiu na vertical). */
/* v78 (BETA — sai o formulário de conta que nunca abria):
   A auditoria tinha marcado e deixado para depois: existia um segundo
   formulário de criar conta, num modal, preso a #createAccountLink — um
   botão que não existe mais no HTML. O handler nunca era ligado e o
   modal nunca abria. Mesmo morto, ele carregava ids iguais aos do
   formulário vivo (newUsername, newEmail, newPass, newPass2), e foi por
   causa dessa colisão que o cadastro em etapas precisou buscar tudo
   escopado no próprio formulário.
   Saíram as quatro linhas (2.928 caracteres), incluindo a função
   authModal, que só ele usava — conferido antes de apagar: as outras
   duas ocorrências do nome no arquivo eram texto de comentário, e uma
   delas apontava para cá; foi reescrita para apontar para #modal, que
   existe, em vez de virar referência órfã.
   Ids duplicados no documento: de 14 para 10. Os que sobram são três
   pares de <style>/<script> com o mesmo id (não afetam comportamento),
   dois falsos positivos de template literal, e "username" e
   "mwPerfilIniciais", que ficam para uma próxima. */
/* v77 (BETA — ordem em Disciplinas e Projetos, e um conserto que não
   tinha consertado):
   Mesmo defeito de Atividades, em grau menor: as duas listas saíam na
   ordem de cadastro. A resposta é diferente em cada uma, porque a
   pergunta é diferente.
   Disciplinas agrupa por semestre — campo que já existia desde a
   generalização do modelo, mas que não aparecia em lugar nenhum da
   lista. O semestre atual vem marcado. Sem semestre preenchido em
   nenhuma, os títulos somem e sobra uma lista alfabética, que já é
   melhor que ordem de cadastro. A comparação usa localeCompare pt-BR:
   comparação binária põe "Álgebra" depois de "Zoologia".
   Projetos só ordena por prazo, sem títulos: o quadro de cinco colunas
   JÁ é a visão agrupada, e dois agrupamentos competiriam. O prazo está
   visível em cada cartão, então a ordem se explica sozinha.
   CORREÇÃO DE UMA CORREÇÃO: a v75 afirmou ter consertado o contraste do
   subtítulo de seção. Não tinha. A regra nova não levava !important e
   perdia para "html body #app .main .section-head span" — uma regra
   antiga com !important no âncora .main, a mesma armadilha que já
   apareceu neste arquivo. A auditoria reprovou de novo no mesmo
   elemento, com a mesma cor de antes. Agora a especificidade é igual e
   o bloco vem depois; medido, a cor final mudou de fato. */
/* v76 (BETA — Atividades em ordem de prazo):
   Segundo achado da auditoria sob carga, e o mais sério dos dois: a
   lista de atividades saía na ORDEM DE CADASTRO. Uma entrega de amanhã
   podia aparecer embaixo de uma de quarenta dias atrás. Uma lista de
   prazos que não está em ordem de prazo não responde à pergunta que a
   pessoa foi ali fazer — e com 120 atividades isso deixa de ser
   incômodo e vira inutilizável.
   Agora agrupa em Atrasadas, Hoje, Próximos 7 dias, Mais adiante e Sem
   prazo, e ordena por data dentro de cada grupo. Uma regra só: da mais
   antiga para a mais nova. Nos atrasados isso põe em cima o que espera
   há mais tempo; nos futuros, o que vence primeiro.
   É apresentação, não dado: não reordena data.activities. Reordenar o
   array quebraria Editar e Excluir, que guardam o índice da posição
   original — conferido no teste, inclusive a confirmação de exclusão
   nomeando o item certo depois da reordenação.
   Os títulos recontam quando um filtro esconde itens, e o título de um
   grupo que ficou vazio some: cabeçalho sozinho anuncia uma seção que
   não existe. */
/* v75 (BETA — auditoria do conjunto, e o que ela achou):
   Seis áreas novas entraram em sequência, cada uma testada isolada.
   Esta é a primeira varredura do conjunto sob carga real (24
   disciplinas, 120 atividades, 30 projetos, 40 anotações, 140 sessões
   de foco, 12 arquivos), em três tamanhos, mais acessibilidade e boot.
   Três defeitos reais, todos corrigidos:
   1. Numa anotação longa o botão "Excluir" virava "Exc" e VAZAVA para
      fora do cartão. Causa: .list-item é flex e o bloco de texto não
      tinha min-width:0, então ele se recusava a encolher e quem cedia
      era o botão. Vale para as quatro listas, não só anotações.
   2. O corpo da anotação era impresso inteiro: quarenta anotações
      viravam nove mil pixels de rolagem. Agora corta em quatro linhas,
      com "Ver mais" — que só aparece onde o texto de fato transborda.
      Detectar isso exigiu medir com o corte desligado: com
      -webkit-line-clamp, scrollHeight É IGUAL a clientHeight, e a
      verificação óbvia nunca dispara.
   3. Catorze campos com rótulo visível mas sem "for": para um leitor de
      tela eram campos sem nome. Instituição, curso, área, semestre,
      nome, e-mail, usuário, senha. Agora vinculados.
   Mais um acerto de contraste: o subtítulo de seção media 4,48:1 sobre
   a parte clara do gradiente do cartão de Perfil, 0,4% abaixo do AA.
   Subiu de terciário para secundário — é subtítulo, não sussurro.
   Boot conferido nos dois caminhos (com e sem sessão), amostrando a cor
   do centro da tela a cada 120ms: nenhum quadro quase branco. */
/* v74 (BETA — o backup passa a levar os arquivos):
   Conserto de um buraco que a área de Arquivos abriu ontem: o exportador
   serializava só o blob do workspace (localStorage), e os arquivos moram
   no IndexedDB. Quem exportasse, limpasse o navegador e importasse de
   volta perderia todos os materiais — em silêncio, com a tela dizendo
   "Backup exportado". Backup que não leva tudo é pior que backup nenhum,
   porque cria confiança onde não deveria.
   Agora os arquivos entram no MESMO JSON, em base64. Infla uns 33% e não
   é elegante, mas é um formato que qualquer versão futura lê sem
   biblioteca, e evita escrever um gerador de ZIP à mão.
   Compatível nos dois sentidos: backup antigo (sem a chave "arquivos")
   importa como antes e diz que não tinha materiais; backup novo mantém o
   "data" no lugar de sempre.
   O aviso da área de Arquivos deixou de ser só um alerta e passou a ter
   saída: ele aponta para Configurações › Backup.
   O link novo trocou de cor depois de medido: sobre a tarja âmbar do
   aviso, o azul de destaque dava 3,4:1 no escuro e 3,6:1 no claro. Num
   fundo colorido quem marca o link é o sublinhado. */
/* v73 (BETA — Arquivos guardam arquivo de verdade):
   A área dizia "preparada para seus materiais" e não guardava nada. Agora
   guarda: arrastar ou escolher um arquivo o grava no IndexedDB deste
   navegador, ele volta depois de fechar o app, abre, baixa e some quando
   você apaga.
   IndexedDB e não localStorage por um motivo concreto: localStorage
   guarda texto, tem teto de poucos megabytes e é síncrono — um PDF de
   3 MB viraria uns 4 MB de base64 e travaria a tela enquanto grava. O
   IndexedDB guarda o Blob como ele é.
   O que NÃO acontece: nada sobe para o servidor. O aviso está no lugar
   mais visível da área, porque a suposição natural de quem usa um app com
   conta é que o material acompanha a conta — e aqui ainda não acompanha.
   A lista também não entra no blob que sincroniza: se os nomes fossem e
   os arquivos não, o outro aparelho mostraria uma lista que não consegue
   abrir, o que é pior do que não mostrar nada.
   O lado do servidor está pronto e desligado em
   supabase/ajuste-05-arquivos.sql: balde privado, teto de 25 MB e quatro
   políticas isolando a pasta de cada pessoa. Rodar o arquivo não liga a
   sincronização — o código de cliente que a usaria não foi escrito, para
   não entregar rede não testada como se estivesse funcionando. */
/* v72 (BETA — cadastro em etapas e cinco níveis de senha):
   Os campos são os MESMOS de antes, com os mesmos id: mudou só quando
   cada um aparece. Isso é deliberado — quem grava a conta é um handler
   com correção documentada de um bug do iOS, e ele não podia ser
   reescrito só para mudar a apresentação. As etapas são uma casca por
   cima; nenhuma regra nova de validação foi inventada nelas, para a
   etapa não barrar um cadastro que o formulário aceitaria.
   Entrou um campo que faltava: confirmar a senha. Como não existe
   verificação por e-mail neste fluxo, um erro de digitação trancava a
   pessoa para fora de uma conta recém-criada, sem caminho de volta.
   A etapa de faculdade é opcional e escreve direto no college da conta
   nova; em branco, entra vazio, e não com um valor inventado.
   O medidor de senha foi de três para cinco degraus, e agora reconhece
   repetição ("aaaaaaaa") e as senhas mais comuns — oito caracteres sem
   resistência nenhuma não podiam continuar sendo chamados de "média".
   NÃO existe etapa de verificação por código. O fluxo não envia e-mail
   nem SMS; uma etapa que só mostrasse um campo bonito seria exatamente
   a mentira que este projeto não faz. */
/* v71 (BETA — Relatórios):
   A tentação de uma tela de relatórios é preencher o espaço. A regra
   aqui é a oposta: só entra número que possa ser MEDIDO nos dados que
   já existem, e onde o dado não existe o bloco diz que não existe.
   Dá para medir com data de verdade as sessões do Foco (guardam o
   instante em que terminaram) e os prazos de atividades e projetos.
   NÃO dá para medir quando uma atividade foi concluída — o app nunca
   registrou isso — nem quando cada item foi cadastrado, porque não há
   data de criação. Por isso existe um bloco chamado "o que este
   relatório ainda não sabe", e por isso o seletor de período só governa
   o tempo de estudo: nos outros blocos ele seria decorativo, e um
   controle que não faz nada é pior do que controle nenhum.
   Projeto concluído ou arquivado não conta como prazo vencido: cobrar
   uma coisa que já acabou seria alarme falso.
   Relatórios também entra no acesso rápido do painel, pelo mesmo motivo
   que Calendário e Foco entraram — no telefone, é a porta visível. */
/* v70 (BETA — Calendário e Foco alcançáveis no telefone):
   As duas áreas novas existiam e funcionavam, mas no celular só se
   chegava nelas abrindo a gaveta: a barra de baixo tem cinco lugares e
   já estava cheia, e a lista completa mora na barra lateral, que no
   telefone fica escondida. Área que só se alcança por um menu escondido
   é área que não existe para quem usa o app no celular — foi por isso
   que "não estou vendo o calendário" era uma leitura correta da tela.
   Agora as duas estão no acesso rápido do painel inicial, que é a
   primeira coisa que aparece ao abrir. A barra de baixo continua com
   cinco lugares: ela é para o que se usa o tempo todo, não um índice. */
/* v69 (BETA — a prévia deixa de ser servida do cache):
   "Publiquei e não atualizou" tinha uma causa concreta. Este worker é
   registrado pela página da raiz e o escopo dele cobre o site inteiro,
   /beta/ incluído. Tirar o registro da cópia da prévia não a tira do
   escopo: um worker já instalado atende qualquer página abaixo dele.
   E a estratégia daqui é stale-while-revalidate — responde do cache na
   hora e atualiza atrás. Para o app instalado é o comportamento certo;
   para a prévia é o errado, porque depois da primeira visita ela passava
   a mostrar a versão daquele dia até uma segunda abertura.
   Agora /beta/ não passa pelo worker: vai sempre à rede.
   Ressalva honesta: esta correção só vale para quem já tiver a versão
   nova do worker instalada, o que acontece ao abrir o app da raiz uma
   vez. Antes disso, abrir a prévia com uma consulta no fim do endereço
   (?v=algo) força a rede, porque endereço diferente é cache diferente. */
/* v68 (BETA — Foco com sessões reais):
   O que faz um cronômetro de estudo prestar não é a animação: é ele
   sobreviver a você sair da tela. Por isso não existe contador guardado.
   O que fica salvo é o instante em que a sessão começou, a duração
   escolhida e quanto tempo ela ficou parada; quanto falta é sempre uma
   conta contra o relógio do aparelho. Trocar de área, minimizar o app ou
   recarregar a página não perde nada, e uma sessão que venceu com o app
   fechado entra no histórico na volta, com a duração que de fato teve —
   o tempo passou, e apagá-la seria mentir sobre o histórico.
   A sessão fica vinculada a uma disciplina do próprio workspace, e o
   histórico mora em data.focus, dentro do mesmo blob que já sincroniza:
   sem tabela nova, sem migração.
   Sessão de menos de um minuto não vira linha, e o aviso do fim é um som
   gerado na hora — sem arquivo para baixar e sem permissão de
   notificação, que este app não tem.
   Junto vieram duas correções medidas em pixel: o anel do relógio não
   aparecia (o token de vidro é um gradiente, e gradiente não é valor
   válido para "stroke"), e o texto branco sobre o gradiente de destaque
   ficava em 4,0–4,4:1 na pílula ativa e no botão principal — abaixo do
   AA. Agora essas superfícies usam o gradiente com um véu escuro. */
/* v67 (BETA — Calendário vira área própria):
   O calendário do mês já existia e funcionava; estava escondido dentro
   do painel inicial, competindo por espaço com o resto do dashboard.
   Em vez de escrever um segundo calendário, este passou a morar numa
   área com nome próprio na navegação — o mesmo painel, promovido, com
   os mesmos dados e as mesmas marcações.
   O que é novo é a visão de semana: sete dias lado a lado lendo os
   prazos das atividades e as marcações do mês, porque "o que tenho
   esta semana" é uma pergunta diferente de "como está o mês".
   A visão escolhida fica guardada.
   A troca entre mês e semana não usa display inline: uma regra antiga
   com !important esconde o painel do mês fora da tela inicial, e regra
   com !important ganha de estilo inline. Então a visibilidade é
   controlada por atributo, com exceção declarada no CSS da área. */
/* v66 (BETA — Projetos ganham quadro):
   As cinco situações já existiam no cadastro; o que faltava era a tela
   em que elas significam alguma coisa. A lista responde "quais projetos
   existem"; o quadro responde "onde cada um está".
   A lista não foi removida — quem tem quinze projetos lê melhor nela.
   O modo escolhido fica guardado.
   O arrasto usa Pointer Events e não a API nativa de arrastar-e-soltar,
   porque a nativa não funciona com o dedo: um quadro que só se opera com
   mouse não serve para metade dos aparelhos em que este app roda. E há
   caminho pelo teclado — setas movem o cartão em foco de coluna,
   devolvendo o foco ao mesmo projeto no destino.
   O quadro não tem dados próprios: move um cartão é editar o mesmo campo
   "status" de sempre, então a mudança aparece na lista, no filtro e nas
   métricas sem nenhuma sincronização entre eles.
   Projeto sem status, ou com "Planejado" de uma versão anterior, cai na
   primeira coluna em vez de sumir do quadro. */
/* v65 (BETA — os dez ícones redesenhados como um conjunto):
   O problema não era cada desenho: era o conjunto não parecer um
   conjunto. "Instituições" era um prédio a traço fino que virava borrão
   a 22px; "Disciplinas" e "Projetos" eram blocos largos e pesados
   enquanto "Arquivos" era uma folhinha estreita — na mesma barra, um
   saltava e o outro sumia; e "Atividades" era uma caixa de seleção, o
   mesmo desenho que o app usa para marcar coisas.
   Agora os dez seguem três regras: massa óptica igual (~18x18 dentro do
   quadro de 24), sólido com vazado em vez de traço fino, e um ícone
   nomeia uma ÁREA, não um controle.
   Junto: os ícones da navegação estavam pequenos e escuros dentro dos
   ladrilhos coloridos — legíveis de perto, sumiam de relance, que é
   como uma barra de navegação é lida. */
/* v64 (BETA — auditoria de contraste medindo o pixel, não a folha):
   A medição por CSS não serve neste app: quase tudo é gradiente sobre
   vidro translúcido, e o "fundo" declarado é transparente — o medidor
   subia a árvore, não achava nada opaco e presumia escuro, gerando 67
   falhas falsas numa tela e nenhuma na mesma tela noutro tamanho.
   Agora texto e fundo são lidos da captura de tela, com o fundo
   amostrado fora da caixa do texto (ou no miolo, para quem tem
   preenchimento próprio, descartando os pixels da cor do glifo).
   De 53 falhas para 0 reais, em 1440/834/390px nos dois temas.
   Corrigido de verdade:
   - duas escalas de texto discordando (--id-txt* e --ds-txt*): a antiga
     agora APONTA para a nova, o que explica por que corrigir uma cor
     não mudava metade das telas;
   - --ds-txt-3 subiu para #8a99c1 no escuro e desceu para #56607a no
     claro — os tons extremos que ainda passam de 4,5:1 em TODAS as
     superfícies medidas, sem achatar a hierarquia;
   - botões primários: branco sobre a ponta violeta do destaque dava
     4,2:1; o degradê é escurecido pela variável, então a correção vale
     para qualquer cor de destaque escolhida;
   - "Sair" era branco sobre azul (4,15:1) e virou vermelho — é uma ação
     que encerra a sessão, não uma navegação;
   - o alternador de tema no claro tinha texto branco sobre superfície
     branca: 1,06:1, invisível.
   Padrão que se repetiu e vale registrar: regras com id+classe de
   camadas antigas venciam as minhas em silêncio, e o valor computado
   dizia uma coisa enquanto o pixel dizia outra. */
/* v63 (BETA — a barra inferior, e as TRÊS lentes que a quebravam):
   O item ativo era marcado por uma "lente" flutuante posicionada por
   script. Ela saiu do lugar: a captura mostrava o ícone da lente e o do
   próprio botão ao mesmo tempo, deslocados, com um círculo branco
   atravessado por uma linha azul.
   Descobrir a causa levou três rodadas porque eram TRÊS lentes
   empilhadas — #mwLiquidLens (seguia o dedo), #mwNavActiveLens (a
   cápsula do item) e .mw-lente-vidro (o círculo) — criadas em rodadas
   diferentes, cada uma posicionada por conta própria. Esconder uma de
   cada vez não mudava nada visível.
   Todas saíram. No lugar, a MESMA pílula da barra lateral: CSS puro,
   sem coordenadas para sincronizar a cada quadro, e ela se abre para
   caber o nome da seção atual.
   Entrou o "+" central, que chama a mesma ação do "+" do topo em vez de
   ter lógica própria.
   Duas armadilhas de especificidade no caminho, ambas minhas: a barra
   continuava em grade (a regra que a impõe está ancorada em
   body.mw-in-app, e sem a mesma âncora a minha perdia por uma classe),
   e o item ativo saía com o nome cortado porque eu havia escrito
   :not(#mwNavMais) — o argumento do :not() entra na conta, e aquele ID
   fazia a regra dos irmãos valer mais que a do ativo. */
/* v62 (BETA — a tela de entrada no material novo):
   As proporções tinham quebrado: o lado da marca media 562px de altura
   dentro de um cartão de 502px e vazava por cima e por baixo dele. Lia
   como um bloco roxo atravessado no meio da tela.
   Agora é uma tela dividida de verdade — trilho de navegação, lado da
   marca com o MW grande, formulário — em vidro, sobre o mesmo campo de
   luz do app. No telefone o lado da marca sai e sobra uma coluna só,
   com Entrar/Criar como pílulas no topo.
   Três defeitos reais no caminho, todos da mesma família:
   (1) o campo de luz não aparecia porque uma pele antiga tem
   "#loginScreen::after{display:none!important}" — descoberto pintando o
   pseudo-elemento de vermelho sólido, que também não aparecia;
   (2) o campo de e-mail é <input id="username"> SEM type, então
   "input[type=text]" não casava com ele: ficava cinza ao lado de outro
   branco, no mesmo formulário;
   (3) o botão de criar conta continuava reto com raio de 999px, porque
   quem pinta o degradê é um filho .mw-btn-inner que tem cantos próprios.
   E o tema claro da entrada, que nunca existiu: os textos continuavam
   nas cores de fundo escuro. Rótulos e campos agora medem 15:1. */
/* v61 (BETA — dashboard vira painel, e o telefone ganha layout próprio):
   O dashboard era uma coluna de cartões de largura cheia, todos com o
   mesmo peso: uma lista, não um painel. Agora é uma grade de doze
   colunas (seis no tablet, uma no telefone) onde o tamanho corresponde
   à importância.
   Dois gráficos entraram, e nenhum é enfeite — a régua foi: se a
   resposta já está escrita em texto ao lado, o gráfico não precisa
   existir. O ANEL responde "quanto do semestre eu andei" (fração do
   todo) e abre, na legenda, as três disciplinas com MENOR progresso,
   que é a pergunta seguinte. A CARGA responde "as entregas estão se
   acumulando?" com a forma da curva ao longo de oito semanas, e cada
   semana tem dica com as entregas reais daquele intervalo.
   No telefone, "Olá, Mateus Souza!" na barra superior media "Olá, Mat…"
   — saudação cortada no meio do nome. Ela desceu para o topo do
   conteúdo, com a largura toda e só o primeiro nome, e a barra ficou
   com marca e ações, como um aplicativo e não como um site encolhido.
   Correção junto: o gráfico em canvas nunca era repintado ao trocar de
   tema, então no claro ficava com as cores pensadas para o escuro —
   parecia falha de contraste, era tinta velha. */
/* v60 (BETA — design system novo: o vidro passa a existir de verdade):
   O app não parecia de vidro porque havia regras ATIVAS desligando o
   vidro: backdrop-filter:none!important, box-shadow:none!important (213
   vezes) e background:#151619!important em .card, .sidebar, .topbar e
   .settings-group, vindas de seis peles antigas empilhadas. Nenhuma
   folha nova produzia vidro — só empilhava mais uma camada perdendo a
   disputa.
   Agora existe uma folha canônica que declara as quatro propriedades de
   superfície de uma vez e ancora nos mesmos seletores das peles antigas,
   vencendo pela ordem do arquivo em vez de por mais !important.
   Junto veio o que faltava para vidro ser vidro: um campo de luz atrás
   de tudo. Desfoque sobre chão liso é cinza, não vidro — o chão entre os
   cartões media (6,10,23), o preto puro. Agora a hierarquia é medida:
   chão (18,23,54), cartão (26,34,77), linha (36,45,85).
   A barra lateral e a superior viraram peças flutuantes com margem, o
   item ativo da navegação é uma superfície que entra por trás dele, e
   claro deixou de ser o escuro invertido: tem paleta própria. */
/* v59 (BETA — Configurações completas: cor de destaque, notificações e IA):
   Duas das sete categorias eram só um aviso de "em breve" — mas as duas
   coisas existiam. O sino já mostrava prazos; o que faltava era decidir
   o que conta como "perto". Ele acendia por QUALQUER prazo futuro,
   inclusive um de noventa dias: um aviso que aparece cedo demais deixa
   de ser aviso e vira ruído. Agora o horizonte é escolhido (padrão 7
   dias) e as aulas de hoje são opcionais.
   A Nyc AI também já guardava conversas; a categoria IA passa a mostrar
   quantas são, permitir apagar tudo, e dizer a verdade sobre a voz —
   se o navegador não transcreve, ele diz isso em vez de prometer.
   Push continua "Em breve", porque precisa de servidor que não existe.
   Aparência ganhou cor de destaque: seis pares que repintam navegação,
   chips, links e marca de uma vez, por variável. */
/* v58 (BETA — o perfil passa a ser uma identidade, não um formulário):
   Tinha nome, e-mail e foto. Agora tem @usuário (com regra explicada em
   vez de correção silenciosa), bio com contador, tecnologias em chips e
   cinco links (Instagram, GitHub, LinkedIn, X, site), cada um com o
   próprio interruptor de exibição.
   O controle de privacidade é campo a campo, e o e-mail nasce OCULTO:
   é um contato direto, não uma apresentação. A prévia mostra exatamente
   o recorte que sairia daqui — se um campo não aparece nela, ele não é
   compartilhado.
   O que NÃO existe está dito uma vez, sem link morto: o endereço público
   ainda não foi construído, então não há nada para compartilhar hoje.
   Três correções que vieram junto:
   (1) "Salvar perfil" atribuía data.profile = {nome,email,foto} e
   apagava em silêncio tudo o que foi listado acima.
   (2) O chip "Usuário" mostrava "—" mesmo com o @ preenchido no campo
   logo abaixo, na mesma tela.
   (3) No tema claro, os painéis de configuração ainda eram pintados de
   bege por uma camada antiga, e o rótulo dos campos era o mesmo azul
   claro do tema escuro — pouco mais de 2:1 sobre fundo claro. Agora
   medem 5,7 a 6,7:1. */
/* v57 (BETA — Instituições viram uma coleção de verdade):
   "Instituição" era um campo de texto solto dentro de Faculdade. Quem
   estuda em duas — graduação numa, técnico ou pós em outra — não tinha
   onde registrar a segunda, e nenhuma disciplina sabia a que instituição
   pertencia. Agora é uma área própria, com a mesma mecânica de
   cadastrar/editar/excluir das outras, e três ligações novas:
   disciplina → instituição, atividade → disciplina, projeto →
   disciplina. Nada disso vem de lista fixa no código: os <select> são
   montados a partir do que a pessoa cadastrou, e o campo Instituição da
   Faculdade continua texto livre (o <datalist>, que existia vazio desde
   sempre, passa a sugerir o que já foi registrado).
   Projetos ganharam o quinto status do quadro (Arquivado) e
   "Planejado" virou "Planejamento".
   Duas correções de fundo no caminho: a fusão dos dados salvos era rasa,
   então uma conta antiga entrava sem os campos novos do perfil; e a
   segunda métrica de cada área repetia a mesma contagem duas vezes sob
   o rótulo "em foco" — número certo, legenda sem sentido. */
/* Versão nova do cache: obrigatória sempre que a estratégia muda, senão
   um app já instalado continua rodando o service worker antigo. */
/* v56 (BETA — a página de Perfil):
   Era a última pendência visual, e tinha quatro problemas de uma vez.
   (1) Abria numa fileira de chips e o avatar ficava enterrado três
   blocos abaixo, no meio do formulário: numa página sobre "quem é
   você", a pessoa aparecia por último. Agora há um cabeçalho com foto
   grande, nome e a linha curso • instituição • semestre.
   (2) Os chips CORTAVAM o valor — "Engenharia de Sof...",
   "Universidade Fede..." — porque eram cinco colunas de largura fixa.
   Passaram a quebrar em linha nova: o valor importa mais do que caber
   numa fileira só.
   (3) O chip de e-mail lia SÓ da conta do servidor e mostrava "—" para
   quem usa sem nuvem ou está sem rede, enquanto o formulário logo
   abaixo, na mesma tela, exibia o e-mail preenchido. Duas respostas
   diferentes a 20px de distância; agora o perfil local é o recuo.
   (4) O avatar do seletor de foto mostrava só a primeira letra ("M")
   enquanto o do topo mostra duas ("MA") — mesmo cálculo nos dois. */
/* v55 (BETA — página de Segurança + o modal que não fechava):
   (1) Segurança era a única das seis páginas do pedido original que
   faltava. Escrita a partir do que o código REALMENTE faz — conferi
   cada afirmação, inclusive o schema do banco: senha nunca guardada
   pelo app, segurança em nível de linha amarrando cada linha ao dono,
   freio contra tentativa em massa, verificação anti-robô, campo
   armadilha, Face ID e PIN do aparelho. E uma seção dizendo o que NÃO
   existe: sem criptografia ponta a ponta, sem certificação de tipo
   nenhum, sem duas etapas, e o painel de administração é visual.
   (2) BUG da Fase 1: o modal de Termos/Ajuda/Sobre (e agora Segurança)
   só fechava no ×. Escape e clique no fundo não faziam nada — os dois
   gestos que a pessoa tenta primeiro, e que funcionam nos outros
   diálogos DESTE mesmo app. O efeito ia além do incômodo: quem apertava
   Escape achava que tinha fechado, clicava noutro link do rodapé e
   continuava vendo a página anterior. Clique DENTRO da caixa não fecha,
   senão selecionar um trecho do texto fecharia a página. */
/* v54 (BETA — o sino nunca acendia, e não era só o sino):
   Auditoria das notificações. O conteúdo é honesto: sai de aula de hoje
   e de prazo de atividade reais, e o estado vazio diz exatamente isso.
   Mas o sino NUNCA acendia, nem com entrega marcada para hoje.
   A causa não estava nas notificações. window.mwDashRefresh é uma
   cadeia: cinco blocos diferentes se penduram nele para atualizar o
   painel a cada save(). Quatro encadeavam certo, guardando o anterior.
   Um atribuía direto — e apagava de uma vez tudo que tinha sido
   encadeado antes: sino, calendário acadêmico, painel de aulas e
   cartões de resumo do início. Todos continuavam na tela, com a
   marcação intacta, e nunca mais atualizavam. Nenhum erro no console.
   Corrigido para preservar, como os outros quatro já faziam. */
/* v53 (BETA — Fase 4, parte 2: busca global de verdade):
   O que existia NÃO era busca global. Um listener de 'input' percorria
   os cartões da TELA ATUAL e escondia com style.display quem não
   batesse com o texto. Três problemas: só enxergava a tela aberta,
   escondia cartões inteiros em vez de apontar itens, e o estado
   ESCAPAVA — quem digitasse e navegasse sem limpar o campo continuava
   com cartões sumidos em outra área, sem pista do motivo.
   Agora procura de verdade em disciplinas, atividades, projetos e
   anotações, agrupa por área, destaca o trecho encontrado e navega ao
   clicar ou com as setas e Enter. A busca ignora acento nos dois
   sentidos: "calculo" acha "Cálculo".
   O listener antigo não foi removido — não dá pra removê-lo sem
   derrubar os outros que dividem o mesmo campo (abrir/fechar a gaveta,
   Escape). Como o bloco novo entra depois, o handler dele roda depois
   no mesmo evento e desfaz o que o antigo escondeu.
   O painel é fixed e pendurado no body: o .search-wrap tem
   overflow:hidden por causa da animação de abrir o campo, e isso
   CORTAVA o painel inteiro — ele existia, media 420x160, e não
   aparecia um pixel. */
/* v52 (BETA — Fase 4, parte 1: o dashboard vira centro de comando):
   Duas peças novas no topo do painel, ambas derivadas SÓ do que já
   existe em data — nenhuma inventa número.
   (1) Resumo do dia: a data por extenso, quantas entregas há pela
   frente, e chips clicáveis com atrasadas, entregas de hoje e a
   próxima. Quando não há nenhuma atividade com prazo a faixa some
   inteira, em vez de exibir uma fileira de zeros, que ocuparia o topo
   dizendo nada.
   (2) Acesso rápido: atalhos para Disciplinas, Projetos, Atividades,
   Arquivos e Anotações, mais Adicionar — que reaproveita o #quickAdd
   que já existe em vez de abrir um segundo fluxo de criação.
   A ligação é o mwDashRefresh, que o renderAll já chama no fim de todo
   save(); encadeamos nele preservando quem estiver lá, porque este
   arquivo tem outros blocos fazendo o mesmo e sobrescrever apagaria os
   anteriores em silêncio.
   O h2 da saudação NÃO foi mexido: mais de dez scripts escrevem nele, e
   disputar isso por um ganho cosmético seria risco sem retorno. A data
   entrou na faixa nova, onde a marcação é minha. */
/* v51 (BETA — o selo Beta/Em breve, que existia sem uso):
   A classe do selo foi criada na Fase 2 e nunca aplicada em lugar
   nenhum. Agora marca três coisas, todas verdadeiras:
   - "Beta" no cabeçalho da Nyc AI, que é o que ela de fato é;
   - "Em breve" nas categorias Notificações e IA das Configurações, que
     não têm nenhum recurso real ainda — antes só um parágrafo explicava
     isso, e quem varre a tela sem ler não percebia.
   Onde já existe recuo honesto e testado (Apple e Google desabilitados
   no login, App Store e Google Play no rodapé) nada mudou: acrescentar
   selo ali seria repetir o aviso, não esclarecer. */
/* v50 (BETA — Fase 2, parte 3: a marca é uma só):
   Só a tela de carregamento desenhava o símbolo de verdade (o M e o W
   traçados, com gradiente). A sidebar, o login, o rodapé e o convite de
   instalação escreviam a palavra "MW" numa fonte — cinco marcas
   diferentes fingindo ser a mesma.
   O glifo virou um <symbol> no sprite, com os MESMOS caminhos do
   carregamento, e os quatro lugares passaram a apontar para ele. Os
   gradientes foram redeclarados no sprite porque os do carregamento
   morrem junto com ele: aquele bloco é removido do documento quando o
   boot termina, e um <use> apontando para um gradiente inexistente
   renderiza sem cor nenhuma.
   As outras três ocorrências de "MW" NÃO foram tocadas: são iniciais do
   usuário (avatar da sidebar, botão de perfil, prévia da foto), que só
   por acaso mostram MW enquanto não há nome. Trocá-las pela marca
   seria trocar a pessoa pelo produto. */
/* v49 (BETA — Fase 2, parte 2: sistema de ícones):
   Os ícones eram 74 <svg> soltos com a geometria escrita à mão no lugar
   de uso, e todos preenchidos — não existia estado de contorno. Agora
   há um sprite de <symbol> no topo do body: uma geometria só por ícone,
   sem fill nem stroke próprios, e o CSS decide o estado (contorno no
   inativo, sólido no ativo). Os detalhes internos usam evenodd para
   virarem furos no estado sólido em vez de sumirem na mancha.
   O mapa de ícones do mw-video-audio-js, que já era o dono da sidebar
   em tempo de execução, passou a apontar para o sprite — antes a
   geometria existia em dois lugares e a marcação sempre perdia para
   ele. Uma regra antiga com dois ids deixava o ícone PREENCHIDO no tema
   claro, ou seja, o contorno não existia na luz; corrigida. */
/* v48 (BETA — sem JavaScript o app explicava nada e parecia travado):
   A tela de carregamento é HTML e CSS puros de propósito, para o fundo
   escuro aparecer já no primeiro quadro. O efeito colateral é que ela
   DESENHA mesmo sem script nenhum — e sem script nada a remove. O
   resultado é uma tela bonita, com a marca MW parada no meio, sem
   nenhum sinal de erro: quem vê conclui que o app quebrou.
   Acontece de verdade em visualizadores de arquivo, em painéis de
   pré-visualização isolados e em navegador com script desativado.
   Agora um <noscript> esconde carregamento, login e app, e mostra o que
   fazer. Descoberto ao mandar uma prévia em arquivo para testar. */
/* v47 (BETA — o botão de criar conta agora mostra que está trabalhando):
   O botão de ENTRAR já mostrava "ENTRANDO..." com giro enquanto falava
   com o servidor; o de CRIAR CONTA não mostrava nada. E a espera ali é
   a maior do app: a checagem de nome de usuário tem prazo de 7s e o
   cadastro mais alguns — numa rede ruim são quase dez segundos de botão
   parado, sem nenhum sinal. A pessoa conclui que não funcionou e clica
   de novo.
   Ao contrário do botão de entrar, o rótulo NÃO é trocado por texto:
   este botão guarda dentro de si a animação do carrinho, e reescrever o
   innerHTML destruiria esses elementos. O miolo some de vista e um giro
   entra por cima, então a animação volta inteira quando o botão volta.
   O botão é devolvido em todas as saídas: sucesso, nome de usuário já
   em uso, e-mail já cadastrado, senha curta e queda de rede. */
/* v46 (BETA — datas legíveis + um bug antigo dos filtros):
   (1) As datas apareciam cruas na tela ("2026-09-22"), que é o formato
   de armazenamento, não de leitura. Agora saem como "22 de setembro",
   com atalho para Hoje, Amanhã e Ontem, nos cinco lugares onde
   apareciam: lista de atividades, prazo dos projetos, próximas
   atividades do painel, notificações e resumo do dashboard.
   A data é montada com new Date(ano, mes-1, dia) e NUNCA com
   new Date('2026-09-22'): a segunda forma é lida como meia-noite UTC e,
   no Brasil (UTC-3), volta um dia atrás. Erro clássico e silencioso,
   que só aparece a oeste de Greenwich.
   O texto "Sem data" foi mantido palavra por palavra porque o filtro
   "Com prazo" procura exatamente por ele.
   (2) BUG ANTIGO, da Fase 1: os filtros de Atividades e Projetos
   escondem itens com el.hidden, mas .list-item tem `display:flex`
   escrito por autor — e regra de autor vence o `[hidden]{display:none}`
   do navegador. O atributo era marcado e o item continuava na tela, sem
   nenhum erro no console: "Atrasadas", "Com prazo", "Em andamento" e
   "Concluídos" nunca filtraram nada desde que foram criados. É a mesma
   armadilha que já tinha aparecido no painel de conversas da Nyc AI. */
/* v45 (BETA — Fase 2, parte 1: identidade visual das referências):
   O arquivo acumulou camadas de pele ao longo do tempo (bege, grafite,
   ciano, "liquid glass"), cada uma com !important e especificidade
   maior que a anterior. Em vez de editar dezenas de regras que hoje
   funcionam, a identidade nova mora numa folha só, no fim do arquivo,
   derivada de tokens — as camadas antigas seguem intactas por baixo e
   voltam a valer se esta folha for removida inteira.
   (1) Tokens de superfície, texto, acento (azul → violeta), raios e
   cores semânticas, definidos nos dois temas. O claro não é a inversão
   do escuro: foi reequilibrado.
   (2) Sidebar com o item ativo em pílula preenchida, como nas imagens.
   Só a pele mudou — quem decide o que está aceso continua sendo o
   estado derivado de .view.active.
   (3) Chips de status/prioridade/prazo num sistema só. Nenhum status
   foi inventado: são os que os dados já têm.
   (4) Cartões de número com tile de ícone, e estados completos de
   botão (hover, pressionado, desabilitado com aparência própria,
   carregando e foco visível pelo teclado).
   Bugs reais encontrados e corrigidos no caminho:
   - os contadores do cabeçalho de área (.workspace-metric) tinham fundo
     escuro fixo, sem variante clara: no tema claro viravam caixas
     cinza-escuro com número ciano sobre cartão branco, ilegíveis;
   - os tons de texto do tema claro davam 3,3–3,6:1, abaixo do mínimo
     AA de 4,5 — reescalonados mantendo a hierarquia entre os níveis;
   - no celular a linha de item deixava só 133px para o texto porque as
     ações dividiam a linha (pior ainda depois que a Fase 1 acrescentou
     o botão Editar): título, data e chips quebravam. Agora empilha;
   - o selo de prazo vinha em caixa alta e em linha separada dos selos
     de status e prioridade, dois pesos diferentes lado a lado. */
/* v44 (BETA — Fase 3 da reformulação, ainda não é a versão estável):
   (1) A Nyc AI passou a guardar as conversas de verdade. Antes cada
   conversa vivia só num array em memória e sumia ao fechar o card.
   Agora ficam em data.aiConversations — o mesmo objeto que já sincroniza
   com o servidor, então não precisou de tabela nova — com lista de
   conversas recentes, nova conversa, renomear e excluir.
   (2) Sugestões clicáveis acima do campo: o placeholder rotativo já
   existia, mas era só decoração e não dava pra usar.
   (3) O estado de "pensando" (os três pontinhos) passou a nascer no
   instante do envio. Antes ele só era criado dentro do typeAnswer, ou
   seja, com a resposta já em mãos — numa rede lenta a conversa ficava
   parada, sem sinal nenhum de que a pergunta tinha saído. A lista de
   mensagens também ganhou aria-busy real.
   (4) Auditoria de voz/microfone. Achados e o que mudou:
     - a transcrição de fala é real (Web Speech API) e continua intacta,
       mas os erros agora dizem o que de fato aconteceu — permissão
       negada, sem microfone, silêncio, sem internet — em vez de sempre
       "permita o microfone";
     - havia um estado "ouvindo" FALSO: o botão pulsava por 8 segundos
       fixos a cada clique, sem gravação nenhuma acontecendo. Removido;
     - em navegador sem transcrição, três scripts diferentes respondiam
       ao mesmo clique com mensagens contraditórias. Agora o botão tem um
       dono só, com rótulo honesto: onde não dá pra ditar, ele assume a
       leitura das respostas em voz alta (que é real) e a barra de status
       explica a limitação;
     - o rótulo "ASSISTENTE DE VOZ" virou "ASSISTENTE ACADÊMICO", que é
       verdade em qualquer navegador.
   (5) O painel de conversas usava opacidade .97 e parecia opaco no
   papel, mas 3% de um texto quase branco sobre fundo quase preto ainda
   lê como fantasma — a conversa aparecia por trás da lista. Virou vidro
   de verdade, com backdrop-filter, e fundo sólido onde o navegador não
   suporta o borrão. */
/* v43 (BETA — Fase 1 da reformulação, ainda não é a versão estável):
   (1) Faculdade deixou de ser presa a graduações de TI — curso, área e
   instituição (campo novo) viraram texto livre com sugestões, e o
   semestre perdeu o teto de 8. O formulário gravava numa chave solta de
   localStorage que a sidebar nunca lia, então o subtítulo mostrava
   "Engenharia de Software" fixo pra qualquer curso salvo; agora tudo
   vive em data.college, o mesmo objeto sincronizado do resto do app.
   (2) Perfil virou tela própria, separada de Configurações (que eram a
   mesma view). Configurações reorganizada em categorias — Conta,
   Aparência, Notificações, Segurança, IA, Privacidade, Aplicativo —
   reaproveitando os grupos existentes, com "em breve" honesto onde o
   recurso ainda não existe. showView() foi exposta como window.showView:
   nunca tinha sido de verdade, e vários scripts já a chamavam assim,
   falhando em silêncio.
   (3) Termos, Ajuda e Sobre saíram de botão morto pra conteúdo real,
   no mesmo padrão do modal de Privacidade.
   (4) Cadastro ganhou indicador de força de senha; a tela de entrar
   ganhou Apple e Google desabilitados com aviso de "em breve" — sem
   fluxo falso, porque OAuth real não existe ainda.
   (5) Projetos ganharam status, prioridade e integrantes; campos que já
   existiam mas não apareciam viraram selos; criar/editar in-place
   (antes só dava pra criar e excluir) e filtros de exibição.
   Auditoria da fase: 3 tamanhos × 2 temas, zero erro de JS, zero scroll
   horizontal, nav sempre sincronizada, scroll sempre no topo ao trocar
   de seção, contraste dos textos novos aprovado em AA nos dois temas, e
   o boot conferido de novo (fundo escuro imediato, login só depois do
   loader sumir, recarga leve na mesma sessão). */
/* v42 (BETA — branch beta/reformulacao-profissional, não é a versão
   estável): primeira leva da auditoria de estabilidade/profissionalismo
   pedida, com achados confirmados e corrigidos de forma isolada —
   (1) placeholder do campo da Nyc AI (o span decorativo, não o
   atributo nativo) não tinha cor própria pro tema claro e ficava quase
   ilegível (azul pálido sobre fundo quase branco); agora tem uma cor
   escura equivalente só pro body.light.
   (2) mensagens da Nyc AI sem overflow-wrap/word-break: uma resposta
   com uma palavra/link bem comprido conseguia estourar a largura do
   balão; agora quebra dentro do card.
   (3) cabeçalho da Nyc AI em tela cheia (#96, header "borrado"): a
   causa real era o cabeçalho ter só um degradê que termina em
   transparent (pensado pro modo compacto) e nenhuma cor opaca por
   baixo — em tela cheia, o texto rolando por trás aparecia raspando/
   embaçado através dele. Corrigido com uma cor opaca por baixo do
   mesmo degradê (visual idêntico no modo compacto, onde não há nada
   atrás pra vazar).
   (4) removido um scrollTo suave morto/contraditório no clique de
   "Suporte" do rodapé — desde o P3 (troca de seção sempre no topo,
   instantânea) esse scroll suave nunca chegava a rodar de verdade e
   contrariava a regra que o P3 existe pra garantir.
   (5) aviso explícito abaixo do interruptor de Face ID nas
   Configurações: é um atalho SÓ deste aparelho (WebAuthn contra o
   autenticador da plataforma, sem nenhum servidor validando nada) —
   não é uma segunda camada de segurança da conta, só evita digitar a
   senha de novo no mesmo dispositivo. Auditoria confirmou que a
   implementação já é uma cerimônia WebAuthn real (não simulada), só
   deixava essa limitação implícita.
   Auditoria também CONFIRMOU (sem necessidade de mudança) que já
   funcionam corretamente: sincronia da nav (sidebar/bottom
   nav/botão-voltar) em todas as 8 views + Configurações como tela-
   folha, scroll-ao-topo instantâneo sem animação ao trocar de seção,
   fundo escuro imediato sem flash branco na abertura, e ausência total
   de qualquer código de áudio no boot. */
/* v41: as duas últimas coisas pedidas na mesma rodada do v40 —
   (1) os 9 ícones da sidebar (Dashboard, Faculdade, Disciplinas,
   Projetos, Atividades, Anotações, Arquivos, Suporte, Painel Admin)
   usavam todos o mesmo fundo cinza no estado parado ("muito genérico,
   muito igual", difícil de diferenciar de relance) — cada um ganhou
   uma cor de destaque própria (dark e light), sem mexer no hover/ativo.
   (2) a silhueta do avatar no card de login/cadastro ganhou dois
   "olhos" (SVG) que se deslocam conforme o tamanho do que já foi
   digitado no usuário/e-mail e fecham quando o campo de senha está
   com foco — a "miniatura com movimento" pedida, presente tanto em
   Entrar quanto em Criar conta (o SVG #heroMediaShared já é
   compartilhado pelos dois formulários). Sem trocar o nome do cache,
   quem já tinha o app instalado continuaria vendo os ícones genéricos
   e a silhueta parada. */
/* v40: rodada de bugs/pedidos relatados com print real de iPhone —
   (1) a folha nativa "Iniciar Sessão" (AutoFill de senha) aparecia por
   cima da tela de CARREGAMENTO, não da de login: o formulário de
   login de verdade (com autocomplete=username/current-password) não
   nascia com display:none quando não havia sessão salva — só ficava
   coberto visualmente pelo preloader, e isso não impede a heurística
   de autofill do sistema (que flutua acima de qualquer z-index da
   página). Agora #loginScreen fica display:none de verdade até
   html.mw-login-pronto (só ligada quando o boot termina por completo).
   (2) o preloader saindo e a tela de baixo entrando aconteciam ao
   MESMO TEMPO (decisão estética antiga) — pedido explícito reverteu
   isso: agora a entrada só começa depois que o preloader já foi
   removido do DOM, sequencial de verdade.
   (3) bug real de CSS: misturar inset:-12px (top/bottom) com
   height:100dvh!important deixava a caixa do preloader
   SOBRE-restringida — o navegador ignorava o bottom declarado e
   recalculava a partir de top+height, deixando uma sobra de 12px sem
   cobrir no rodapé da tela (o "risco/rastro" relatado) e a marca
   descentralizada. Trocado por um inset uniforme só (-16px nos 4
   lados, sem width/height competindo) — cobre e centraliza de
   verdade.
   (4) a cascata de entrada do dashboard (mw-entrando) teve duração e
   atraso cortados quase pela metade — sentia como demora, não como
   cascata rápida.
   (5) puxar-pra-recarregar agora força o modo leve (só giro curto) de
   propósito antes do reload, em vez de confiar cegamente que
   sessionStorage já estava correto — e um bug real nessa mesma chave
   foi corrigido: a rotina de reset único do navegador limpava
   sessionStorage INTEIRO (incluindo a marca que decide boot completo
   vs. leve) no mesmo carregamento em que ela tinha acabado de ser
   gravada.
   (6) a logo "MW" da sidebar trocou o SVG customizado (lido como
   "estradas cruzando") por texto limpo "MW", e o tile deixou de ser
   achatado pro tamanho/raio genérico dos ícones de navegação por uma
   regra de uniformização que não devia alcançá-lo.
   (7) rodapé de login reorganizado: "esqueci senha/usuário" numa
   ponta, um indicador de que o navegador salva a senha na outra.
   Sem trocar o nome do cache, quem já tinha o app instalado
   continuaria vendo todos esses bugs. */
/* v39: três correções de bugs relatados com vídeo/print reais —
   (1) o preloader de saída (.mw-boot-out) desligava pointer-events na
   hora em que a classe entrava, enquanto a opacidade (curva ease-in)
   ainda ficava visualmente quase opaca por boa parte dos 620ms/280ms
   de fade — a tela de login por baixo já ficava clicável enquanto o
   loader ainda parecia cobrir tudo, e um toque nesse instante caía
   direto no campo de usuário/senha e disparava o autofill do
   navegador fora de hora. Agora pointer-events vai dentro do próprio
   @keyframes: continua bloqueando por 85% da animação, só libera nos
   15% finais, quando já não há quase nada visível pra "atravessar".
   (2) a cascata de entrada do dashboard (mw-entrando) foi feita pra
   ser a única responsável pela animação depois do login, mas o
   sistema antigo que ela devia substituir (mwAppReveal no #app,
   mwViewIn na view ativa, mwCardIn com atraso por nth-child nos
   cards) nunca foi removido e os dois brigavam pela mesma propriedade
   ao mesmo tempo — um card podia sair com o NOME do keyframe novo mas
   o ATRASO do antigo. Agora o sistema antigo fica desligado só
   enquanto mw-entrando está ativo (troca normal de aba fora dessa
   janela continua exatamente igual). (3) a logo "MW" da sidebar
   estava sendo achatada pro mesmo tamanho/raio genérico dos ícones de
   navegação (34px/10px) por uma regra de uniformização que não
   devia alcançá-la — devolvida ao tamanho próprio dela (40px/16px,
   com overflow:hidden de verdade) e o texto "WORKSPACE" ao lado
   aumentou de 11px pra 15px. Sem trocar o nome do cache, quem já
   tinha o app instalado continuaria vendo os três bugs. */
/* v38: duas coisas — (1) o texto "Brasil +55" no seletor de país do
   diálogo de telefone vazava por trás da setinha do combobox (132px
   não bastava); agora trunca com reticências e o DDI vem logo depois
   da bandeira, então mesmo cortado o pedaço que importa continua
   visível. (2) puxar a página pra baixo, parado no topo do scroll,
   agora recarrega — pedido explícito, "igual nos apps e sites". O
   gesto nativo do navegador fazia isso sozinho, mas
   overscroll-behavior-y:none em html,body (que existe pra impedir
   vazamento de scroll de listas internas) desliga esse gesto nativo
   junto; mw-pull-refresh-js refaz o puxão à mão só na página, nunca
   dentro de modais/listas com scroll próprio. Sem trocar o nome do
   cache, quem já tinha o app instalado continuaria sem os dois. */
/* v37: a v35 tentou resolver o círculo quebrado no Safari/iOS testando
   se o navegador ACEITAVA a sintaxe url(#mwLenteFiltro) — e um vídeo
   real de iPhone provou esse teste insuficiente: o Safari aceita a
   sintaxe (então o teste dizia "suportado"), mas não RENDERIZA a
   distorção de verdade, e ainda por cima perde o próprio blur do
   fallback no processo — sobra exatamente o círculo liso do vídeo.
   mwLenteVidroSuportada() agora exclui por PLATAFORMA antes de
   qualquer teste de sintaxe: todo navegador em iOS (Safari, Chrome,
   Firefox, Edge — a Apple obriga todos a usarem o motor WebKit dela
   lá) e o Safari de desktop não recebem a lente. Testado com
   user-agents de iPhone, "Chrome" em iPhone, iPad moderno (que se
   disfarça de Mac) e Safari de macOS — todos ficam sem o círculo; só
   Chrome/Android continua recebendo. Sem trocar o nome do cache, quem
   já tinha o app instalado continuaria vendo o círculo quebrado. */
/* v36: campo de telefone (Configurações → Conta) deixou de ser um
   <input readonly> estático. Agora é: (1) um diálogo próprio
   (window.mwPedirTelefone, mwTelDialog) com seletor de país por
   bandeira + DDI (30 países, Brasil/+55 como padrão) ao lado do campo
   do número, em vez do prompt genérico que só aceitava dígitos crus
   assumindo Brasil; (2) uma exibição de verdade depois de cadastrado —
   bandeira + DDI + número formatado ((DD) 9NNNN-NNNN pro Brasil,
   agrupamento genérico pros demais países), com um selo "Aguardando
   confirmação" enquanto o SMS não foi confirmado, em vez do E.164 cru
   colado num input. mw-conta-js.paraE164BR (só Brasil) virou
   paraE164 (genérico — quem monta o número completo com o DDI certo
   agora é o diálogo). Sem trocar o nome do cache, quem já tinha o app
   instalado continuaria vendo o input antigo. */
/* v35: feedback real, de um iPhone (Safari), confirmou o que o comentário
   da v32 já previa — ali a distorção não é aplicada, e sobrava um círculo
   de vidro liso flutuando sozinho sobre um ícone, que lia como BUG e não
   como efeito. window.mwCriaLenteVidro agora testa de verdade, antes de
   criar qualquer coisa, se o navegador aceitou url(#mwLenteFiltro) como
   filtro válido (lendo o valor computado de volta). Sem esse suporte
   real, a função não cria nada — a barra fica só com o vidro base, sem
   nenhum círculo extra. Sem trocar o nome do cache, quem já tinha o app
   instalado continuaria vendo o círculo quebrado. */
/* v34: desfaz a v33 — a lente na barra da Nyc AI foi mal-entendido
   (o pedido "chat, praticamente igual" era só descrevendo o vídeo de
   referência do WhatsApp, um app de chat, não pedindo pra colocar na
   Nyc AI). A lente continua só na barra de baixo, como na v32.
   window.mwCriaLenteVidro segue genérica (aceita qualquer barra), só
   não é mais chamada pra .mateus-ai-form. */
/* v33: a mesma lente de vidro arrastável (v32) agora também na barra de
   digitar da Nyc AI (.mateus-ai-form), pedido explícito pra ficar
   "praticamente igual" nos dois lugares. window.mwCriaLenteVidro virou
   função reutilizável em vez de código só da barra de baixo; a chamada
   pra Nyc AI acontece no show() do modal (só cria na primeira vez que
   abre, idempotente). Sem trocar o nome do cache, quem já tinha o app
   instalado continuaria sem a lente ali. */
/* v32: lente de vidro arrastável na barra de baixo (pedido explícito,
   com vídeo de referência mostrando a lente do WhatsApp/iOS 26 Liquid
   Glass) — um círculo que a pessoa arrasta sobre a barra e o que está
   atrás DOBRA de verdade perto da borda, não só borra. Usa um filtro
   SVG (feDisplacementMap) aplicado via backdrop-filter:url(#...) —
   funciona onde já testei (Chrome/Edge/Android); no Safari/iOS, que
   historicamente não aplica filtro SVG dentro de backdrop-filter, a
   declaração inteira é ignorada e sobra só um círculo de vidro liso
   (sem quebrar nada, só sem a dobra). Sem trocar o nome do cache, quem
   já tinha o app instalado continuaria sem a lente. */
/* v31: quatro coisas de uma vez —
   1) Navegação diferente por contexto: a cápsula flutuante de baixo
      (Início/Faculdade/...) virou exclusiva de quando o site está
      instalado de verdade (display-mode:standalone / navigator.standalone
      — checado no <head>, antes de qualquer layout). No navegador comum,
      mesmo logado, ela some e quem navega é o menu lateral — reativado o
      botão de hambúrguer no mobile (estava com display:none de uma regra
      antiga, de quando a cápsula ainda cobria sozinha toda a navegação).
   2) "Esqueci minha senha" e "esqueci meu usuário" viraram uma linha só
      no login, em vez de dois blocos empilhados repetindo "esqueci".
   3) As trocas de usuário/e-mail/senha/telefone em Configurações → Conta
      deixaram de usar prompt()/alert() nativos do navegador (a caixinha
      cinza fora do estilo do app) — agora usam um diálogo com a mesma
      cara do de confirmação de identidade (window.mwPedirValor). O
      "esqueci meu usuário" do login também passou a usar esse diálogo.
   4) Vidro da barra de baixo mais forte (blur 26px->38px de base,
      saturate 190%->215%) — o anterior deixava passar detalhe fino
      demais contra fundos com textura; a referência (Instagram) borra
      até virar só cor.
   Sem trocar o nome do cache, quem já tinha o app instalado continuaria
   servindo o index.html de antes, sem nada disso. */
/* v30: cinco coisas de uma vez —
   1) Painel Admin passou a usar dados reais do Supabase, com checagem de
      is_admin no SERVIDOR (ver supabase/ajuste-04-admin-e-extras.sql);
      sem is_admin=true na conta, as funções recusam sozinhas.
   2) "Esqueci meu usuário" (e-mail → usuário) ao lado de "esqueci minha
      senha" na tela de login.
   3) "Sair de todos os outros aparelhos" em Configurações → Sessão
      (Supabase Auth signOut scope:'others', sem lista de sessões).
   4) Botão "Privacidade" do rodapé (existia, não fazia nada) agora abre
      um aviso real sobre o que é guardado — inclusive o log de acessos.
   5) Cadastro ganhou campo-armadilha contra robôs (sempre ativo) e
      plumbing pronta pra Cloudflare Turnstile (captcha), desligada até
      MW_TURNSTILE_SITE_KEY ser preenchida — hoje não muda nada.
   Sem trocar o nome do cache, quem já tinha o app instalado continuaria
   servindo o index.html de antes, sem nada disso. */
/* v29: e-mail do cadastro e da recuperação de senha agora exige formato
   de verdade (não só um "@" solto) — mesma regra que a troca de e-mail
   em Configurações já usava. E entrou telefone com confirmação real por
   SMS: em Configurações → Conta, "Adicionar"/"Alterar" telefone manda um
   código via Supabase Auth (updateUser + verifyOtp), guardado nativamente
   em auth.users (phone / phone_confirmed_at) — sem coluna nova no banco.
   Só funciona de fato depois que um provedor de SMS (Twilio ou outro)
   estiver configurado no painel do Supabase; até lá, o envio do código
   falha com uma mensagem clara em vez de travar. Sem trocar o nome do
   cache, quem já tinha o app instalado continuaria sem essas correções. */
/* v28: o log de acessos (v27) ganhou localização aproximada — antes do
   registra_acesso, o site consulta um serviço público que estima
   cidade/estado/país a partir do IP (sem pop-up de permissão, não é o GPS
   do aparelho). Falhando essa consulta, o acesso ainda é gravado, só sem
   essa parte. Sem trocar o nome do cache, quem já tinha o app instalado
   continuaria gravando o acesso sem localização. */
/* v27: cada carregamento do site chama registra_acesso no Supabase (IP,
   aparelho e página, ver supabase/ajuste-03-log-acessos.sql) — é o log de
   acessos pedido, pra consultar depois pelo Table Editor do Supabase. Só
   dispara quando o cliente do Supabase existe; sem rede/offline, é
   ignorado em silêncio, como todo o resto do módulo mw-nuvem. Sem trocar
   o nome do cache, quem já tinha o app instalado continuaria servindo o
   index.html de antes, sem esse registro. */
/* v26: recarregar a página (mesma aba/app, mesma sessão) deixa de
   repetir a construção completa da marca — agora mostra só um spinner
   mínimo. sessionStorage.mwBooted guarda se a marca já foi vista nesta
   sessão; some quando a aba/app é fechada de verdade, que é exatamente
   quando a construção completa deve voltar a aparecer. */
/* v25: o botão de Instagram do rodapé deixou de redirecionar pro perfil
   real (pedido explícito, "por enquanto") — o ícone/aparência/posição
   continuam intactos, só o clique agora mostra "em breve", igual ao
   Facebook ao lado. */
/* v24: abertura mais impactante (traço mais lento, estalo de luz no fim
   da construção, saída com flash + onda de choque, fundo que "respira"
   e brilho no nome) e a correção do scroll fantasma na tela de
   carregamento — o body por trás do preloader ficava rolável (barra de
   rolagem visível, dava pra "mover" o workspace enquanto ainda estava
   no carregamento) porque `position:fixed` sozinho não impede o
   rubber-band scroll do body no iOS. Agora `html:has(#mwBootLoader),
   body:has(#mwBootLoader){overflow:hidden}` trava o documento inteiro
   enquanto o loader existir, sem depender de nenhum JS rodar a tempo.
   Sem trocar o nome do cache, quem já tinha o app instalado continuaria
   vendo a abertura antiga e o bug de scroll. */
/* v23: pedido explícito — a restauração anterior (v22) ainda tinha ido
   curta demais: voltou só até dc073cc (v15, "torna a revelação
   visível"), que também é uma reescrita feita NESTA conversa a partir
   do pedido original "cadê os efeitos?". O usuário esclareceu: quer o
   estado de ANTES de qualquer pedido de mudança na tela de
   carregamento nesta conversa — ou seja, antes até do v14. index.html
   e sw.js voltam pro commit 789d80e ("Sobe o cache do service worker
   para v13"), o parent exato do commit que iniciou a primeira
   reescrita. É o ícone/nome com traçado SVG (stroke-dashoffset) e
   trilha de grid abrindo, como era antes de todo este histórico. */
/* v7: o index.html passou a carregar o cliente do Supabase e a lógica de
   conta na nuvem. Sem trocar o nome, o app instalado continuaria servindo
   o index antigo do cache — sem login de servidor nenhum. */
/* v6: entrou o cliente do Supabase em vendor/. Ele precisa estar no cache
   do shell, senão o app aberto sem rede não consegue nem decidir que está
   offline — ficaria esperando um script que nunca chega. */
/* v5: o app instalado no iPhone estava servindo uma cópia antiga do
   index.html do cache e, com ela, código anterior às correções de conta e
   sessão. Trocar o nome do cache é o que faz o service worker descartar o
   que guardou e buscar tudo de novo — o `activate` abaixo apaga todo cache
   cujo nome não seja este. */
/* v13: leva ao app instalado tudo que ficou parado nos commits depois
   do v12 — o <form> de login (autopreenchimento correto), a
   Credential Management API, a recarga real após trocar a senha, e a
   remoção do toque/som da abertura. Sem trocar o nome, quem já tinha
   o app instalado continuaria vendo o código de antes de tudo isso,
   e é exatamente por isso que os mesmos bugs pareciam "não corrigidos"
   ali mesmo depois de já resolvidos no navegador. */
/* v12: reforço do preenchimento do preloader no app instalado (iOS) —
   inset maior e altura/largura em dvh/dvw. Sem trocar o nome, quem já
   tinha o app instalado continuaria vendo a borda sem preencher, porque
   o service worker antigo seguiria servindo o index.html de antes. */
const CACHE_NAME = 'mw-shell-v105-beta';

// Caminhos relativos de propósito: o site roda numa subpasta do GitHub
// Pages (ex.: github.io/mateuswzn/), não na raiz do domínio. Um caminho
// absoluto como "/index.html" aponta pra raiz do domínio (404) em vez da
// subpasta real — foi exatamente isso que quebrou o app instalado na
// tela de início (o manifest.json tinha o mesmo erro).
const SHELL_URLS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png',
  './icon-192-maskable.png', './icon-512-maskable.png',
  './apple-touch-icon.png',
  './vendor/supabase.js',
  /* O Design System é uma folha separada, então precisa entrar no cache do
     shell explicitamente — senão o app abre sem estilo quando estiver
     offline, a partir da primeira área migrada. */
  './ds/mw-ds.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

/* ============================================================
   POR QUE ISTO DEIXOU DE SER "NETWORK FIRST"
   ============================================================
   A estratégia anterior tentava a rede PRIMEIRO em toda requisição e só
   caía pro cache quando a rede FALHAVA. Numa rede lenta — que é lenta,
   não quebrada — não existe falha nenhuma: o app simplesmente ESPERA.

   E o que ele espera é o index.html, que tem ~890KB. Medido na gravação
   do app instalado no iPhone: 580ms de tela BRANCA antes de qualquer
   pixel aparecer. Não era a animação travando; era o app parado
   esperando baixar quase um mega antes de desenhar o primeiro quadro.
   Cada abertura pagava esse pedágio de novo.

   Agora o shell usa "stale-while-revalidate": responde do cache na
   hora — abertura instantânea, offline inclusive — e busca a versão
   nova em segundo plano, que fica valendo na próxima abertura. É a
   troca clássica: no máximo uma abertura defasada, em troca de nunca
   mais esperar a rede pra ver a tela.

   /api/ continua fora do cache: a Nyc AI precisa de ida e volta real.
   A checagem virou "inclui /api/" porque o site vive numa SUBPASTA do
   GitHub Pages — o pathname é /mateuswzn/api/ai, então o
   startsWith('/api/') anterior nunca casava e as respostas da IA
   estavam sendo cacheadas junto com o resto. */
const ehApi = (url) => url.pathname.includes('/api/');
/* A PRÉVIA NÃO PASSA POR AQUI.

   O registro deste service worker é feito pela página da raiz, e o
   escopo que ele ganha cobre TODO o site — inclusive /beta/. A cópia da
   prévia até tem o registro removido, mas isso não a tira do escopo: um
   worker já instalado atende qualquer página abaixo dele.

   E a estratégia daqui é stale-while-revalidate: responde do cache na
   hora e atualiza atrás. Para o app instalado isso é o certo (abre
   rápido, funciona sem internet). Para a prévia é exatamente o errado:
   depois de aberta uma vez, ela passava a mostrar a versão daquele dia
   até uma segunda visita — que é como se chega em "publiquei e não
   atualizou". A prévia existe para mostrar o que ACABOU de ser feito,
   então ela vai sempre à rede. */
const ehPrevia = (url) => url.pathname.includes('/beta/');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (ehApi(url) || ehPrevia(url)) return;
  // Só mexe no que é do próprio site.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((cacheado) => {
        const naRede = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              /* AVISO DE VERSÃO NOVA.

                 Stale-while-revalidate tem um efeito colateral
                 conhecido: a versão recém-publicada só apareceria na
                 PRÓXIMA abertura, porque esta já respondeu do cache. Do
                 lado de cá isso vira "abri o app e o problema ainda
                 está lá; só some se eu fechar e abrir de novo".

                 A resposta nova é comparada com a que estava em cache
                 pelo ETag (ou Last-Modified, quando o servidor não
                 manda ETag). Sendo diferente, os clientes são avisados
                 — e a PÁGINA decide o que fazer: recarregar no meio de
                 uma edição do usuário seria pior que a espera.

                 O aviso sai só DEPOIS de o cache.put resolver. Avisando
                 antes, a página recarregava, a recarga era servida do
                 cache que ainda era o antigo, e a trava anti-laço
                 impedia uma segunda tentativa — ficava presa na versão
                 velha. Foi exatamente o que aconteceu no primeiro
                 teste. */
              const antigo = cacheado &&
                (cacheado.headers.get('etag') || cacheado.headers.get('last-modified'));
              const atual = res.headers.get('etag') || res.headers.get('last-modified');
              const mudou = !!(cacheado && atual && antigo && atual !== antigo);
              cache.put(req, res.clone()).then(() => {
                if (!mudou) return;
                return self.clients.matchAll({ includeUncontrolled: true })
                  .then((cs) => cs.forEach((c) => c.postMessage({ tipo: 'mw-versao-nova' })));
              }).catch(() => {});
            }
            return res;
          })
          .catch(() => cacheado || cache.match('./index.html'));
        // Tem no cache? Responde AGORA e atualiza atrás. Não tem?
        // Espera a rede (primeira visita).
        return cacheado || naRede;
      })
    )
  );
});
