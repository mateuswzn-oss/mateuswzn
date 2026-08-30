/* Versão nova do cache: obrigatória sempre que a estratégia muda, senão
   um app já instalado continua rodando o service worker antigo. */
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
/* v14: reescreve a abertura (ícone e nome revelados por desfoque, sem
   traçado nem trilha de grid abrindo — a causa da falta de
   centralização) e trava overscroll-behavior nos dois eixos (só o
   vertical estava travado; o app instalado ainda "arrastava" de lado
   pelo bounce horizontal). */
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
const CACHE_NAME = 'mw-shell-v14';

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
