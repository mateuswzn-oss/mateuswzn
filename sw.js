/* MODO DE MANUTENÇÃO — temporário, enquanto a reformulação é
   desenvolvida e testada na branch beta.

   Este service worker substitui o real só nesta janela de manutenção:
   ele apaga todos os caches antigos e se desregistra sozinho, forçando
   qualquer aba aberta (ou app instalado na tela de início) a recarregar
   direto da rede — sem isso, quem já tinha o app instalado continuaria
   vendo a cópia antiga em cache em vez da tela "em atualização".

   Quando a versão beta for aprovada, este arquivo volta a ser o service
   worker real (com cache de verdade), restaurado a partir da branch
   beta/da versão estável — nada aqui precisa ser "desfeito" manualmente,
   só sobrescrito pela publicação seguinte. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.map((nome) => caches.delete(nome))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});
