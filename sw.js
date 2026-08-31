/* Versão nova do cache: obrigatória sempre que a estratégia muda, senão
   um app já instalado continua rodando o service worker antigo. */
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
const CACHE_NAME = 'mw-shell-v39';

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
