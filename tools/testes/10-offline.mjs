/* Offline: o app abre com a rede desligada.

   O README promete "continua funcionando sem internet". Isso é uma
   afirmação sobre o service worker, e até aqui ela nunca tinha sido
   medida — só lida na especificação. Este teste instala o SW de
   verdade, desliga a rede e recarrega.

   Não usa ajuda.abre(): aquele helper pula o boot, e aqui o boot é
   justamente o que está sendo medido. Também não pode registrar o SW
   num http:// qualquer — só em contexto seguro, e 127.0.0.1 conta como
   seguro justamente por isso.

   Uso: node tools/testes/10-offline.mjs */
import { chromium } from 'playwright';
import { achaNavegador, ENDERECO } from './ajuda.mjs';

const exe = achaNavegador();
const b = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

const erros = [];
p.on('pageerror', e => erros.push('pageerror: ' + e.message));
p.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && !/ERR_TUNNEL|ERR_PROXY|Failed to load resource|net::/.test(t)) erros.push('console: ' + t);
});

await p.addInitScript(() => {
  localStorage.setItem('mwZerarTudo-2026-08-e', '1');
  if (localStorage.getItem('mateusWorkspaceV4') === null) {
    localStorage.setItem('mateusWorkspaceV4', JSON.stringify({
      subjects:[{ name:'Cálculo I', description:'Limites', progress:40 }],
      projects:[], activities:[], notes:[], institutions:[],
      profile:{ name:'Mateus', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
      college:{ institution:'UFPA', course:'Eng', area:'', semester:5 }, theme:'dark'
    }));
  }
  localStorage.setItem('mwSession', '1');
});

let ruins = 0;

// ---- 1. COM REDE: o service worker registra e enche o cache ----
await p.goto(ENDERECO + '/index.html');
const registrou = await p.evaluate(async () => {
  if (!navigator.serviceWorker) return { suportado: false };
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return { suportado: true, pronto: false };
  /* "ready" só garante que existe um SW ativo — não que ele já
     controla ESTA página. Numa primeira visita a página foi carregada
     antes de o SW existir, e só a próxima navegação é controlada. */
  return {
    suportado: true, pronto: true,
    escopo: reg.scope,
    estado: reg.active ? reg.active.state : null,
    controlando: !!navigator.serviceWorker.controller
  };
});
console.log('registro do SW:', JSON.stringify(registrou));
if (!registrou.pronto) { console.log('  <<< o service worker não ficou pronto'); ruins++; }

const cache = await p.evaluate(async () => {
  const nomes = await caches.keys();
  const meu = nomes.find(n => n.startsWith('mw-shell-'));
  if (!meu) return { nomes, guardados: 0 };
  const c = await caches.open(meu);
  const chaves = await c.keys();
  return { nome: meu, guardados: chaves.length, urls: chaves.map(r => new URL(r.url).pathname).sort() };
});
console.log('cache do shell:', JSON.stringify(cache));
if (!cache.guardados) { console.log('  <<< o cache do shell está vazio'); ruins++; }

// segunda visita: agora a página nasce controlada pelo SW
await p.reload();
await p.waitForTimeout(1200);
const controlada = await p.evaluate(() => !!navigator.serviceWorker.controller);
console.log('página controlada pelo SW:', controlada);
if (!controlada) { console.log('  <<< a página não está sob o SW; offline não vai funcionar'); ruins++; }

// ---- 2. SEM REDE: recarrega e vê se o app abre ----
await ctx.setOffline(true);
erros.length = 0;
const resposta = await p.reload({ waitUntil: 'load' }).catch(e => ({ erro: e.message }));
if (resposta && resposta.erro) { console.log('\nSEM REDE: a navegação falhou —', resposta.erro, ' <<<'); ruins++; }
await p.waitForTimeout(3000);

const offline = await p.evaluate(() => {
  const visivel = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return getComputedStyle(el).display !== 'none' && r.height > 10;
  };
  return {
    titulo: document.title,
    onLine: navigator.onLine,
    temApp: !!document.getElementById('app'),
    loaderPresente: !!document.getElementById('mwBootLoader'),
    loginVisivel: visivel(document.getElementById('loginScreen')),
    appVisivel: visivel(document.getElementById('app')),
    /* o dado local tem de continuar lá: é ele que faz o app ser útil
       sem rede, não só abrir */
    disciplinas: (() => {
      try { return (JSON.parse(localStorage.getItem('mateusWorkspaceV4')).subjects || []).length; }
      catch(e) { return -1; }
    })(),
    /* nenhuma folha de estilo pode ter ficado pelo caminho: o app é um
       arquivo só, então se ele veio do cache, o CSS veio junto */
    folhas: document.styleSheets.length,
    corpoPintado: getComputedStyle(document.body).backgroundColor
  };
});
console.log('\nSEM REDE:', JSON.stringify(offline, null, 1));

if (!offline.temApp)                      { console.log('  <<< o documento não é o app'); ruins++; }
if (!offline.appVisivel && !offline.loginVisivel) { console.log('  <<< nem o app nem o login apareceram'); ruins++; }
if (offline.disciplinas < 1)              { console.log('  <<< os dados locais sumiram'); ruins++; }
if (offline.folhas < 10)                  { console.log('  <<< faltam folhas de estilo'); ruins++; }

// navegar entre áreas continua funcionando sem rede
const navegou = await p.evaluate(() => {
  if (typeof window.showView !== 'function') return null;
  window.showView('subjects');
  return [...document.querySelectorAll('.view.active')].map(v => v.id)[0] || null;
});
console.log('trocar de área sem rede:', navegou);
if (navegou !== 'view-subjects') { console.log('  <<< a navegação não respondeu'); ruins++; }

console.log('\nERROS (só os de estar sem rede não contam):', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;

await ctx.setOffline(false);
await b.close();
console.log('\nACHADOS:', ruins);
process.exit(ruins ? 1 : 0);
