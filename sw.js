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
const CACHE_NAME = 'mw-shell-v59-beta';

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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (ehApi(url)) return;
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
