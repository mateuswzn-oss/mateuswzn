/* A NAVEGAÇÃO: barra lateral, barra de baixo e barra do topo.
 *
 * É a última superfície a migrar, e é a que toca TODAS as telas. Um
 * defeito aqui não estraga uma área: estraga o caminho para todas elas.
 *
 * O levantamento diz o tamanho do problema: 351 regras em 68 folhas
 * alcançam estas três barras, e a maioria com `!important`. Ao lado
 * disso, a tela de entrada — que já parecia pesada — tinha 44 folhas.
 *
 * Este teste é a medida "antes": o que existe hoje e não pode deixar de
 * funcionar depois. Inclui a trava que o usuário encontrou com duas
 * fotos — a barra de baixo aparecendo POR CIMA da tela de login.
 *
 * Uso: node tools/testes/20-navegacao.mjs [desktop|celular]
 */
import { abre, vaiPara, esperaParar, AREAS } from './ajuda.mjs';

/* Três modos, porque são três molduras diferentes e não três tamanhos
   da mesma:
     desktop   — barra lateral sempre à vista, sem barra de baixo
     celular   — lateral vira gaveta, aberta pelo botão de menu
     instalado — sem botão de menu; quem manda é a barra de baixo

   A diferença entre "celular" e "instalado" não é largura: é a regra
   `html:not(.mw-standalone) ... #mwBottomNav{display:none!important}`.
   E a marca `mw-standalone` é decidida UMA vez, na abertura, a partir de
   `matchMedia('(display-mode: standalone)')` — acrescentá-la à mão
   depois não pega, como este teste descobriu do jeito difícil. Por isso
   o modo instalado finge o matchMedia ANTES de a página carregar, que é
   o mesmo caminho do teste 4. */
const modo = process.argv[2] || 'desktop';
const MOVEL = modo === 'celular' || modo === 'instalado';
const LARG = MOVEL ? 390 : 1280;
const ALT  = MOVEL ? 780 : 900;

const { b, p, erros } = await abre({
  subjects:[], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus Souza', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'UFPA', course:'Engenharia', area:'', semester:5 }, theme:'dark'
}, { viewport: { width: LARG, height: ALT },
     init: modo === 'instalado' ? (function(){
       const real = window.matchMedia.bind(window);
       window.matchMedia = q => /display-mode:\s*standalone/.test(q)
         ? { matches: true, media: q, onchange: null, addListener(){}, removeListener(){},
             addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } }
         : real(q);
     }) : undefined });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(50), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

console.log('=== navegação · ' + modo + ' (' + LARG + 'px) ===');
await p.waitForTimeout(600);

/* ---- 1. a barra lateral tem todas as áreas, e cada uma leva lá ------- */
const itens = await p.evaluate(() => [...document.querySelectorAll('#nav button[data-view]')]
  .map(b => ({ view: b.dataset.view, rotulo: (b.textContent||'').trim().slice(0,20) })));
ok('a barra lateral lista as áreas', itens.length >= 12, itens.length);

/* Admin fica fora: ele só aparece para quem tem a marca de admin. */
const NAVEGAVEIS = itens.map(x => x.view).filter(v => v !== 'admin');
const idas = [];
for (const v of NAVEGAVEIS) {
  await p.evaluate(a => document.querySelector(`#nav button[data-view="${a}"]`)?.click(), v);
  await p.waitForTimeout(360);
  const r = await p.evaluate(a => {
    const view = document.getElementById('view-' + a);
    const bt = document.querySelector(`#nav button[data-view="${a}"]`);
    return { existe: !!view, ativa: !!view && view.classList.contains('active'),
             botaoAtivo: !!bt && bt.classList.contains('active'),
             /* Duas ativas ao mesmo tempo é o defeito clássico da barra:
                a marca fica presa na anterior e a pessoa perde a
                referência de onde está. */
             quantasAtivas: document.querySelectorAll('#nav button.active').length };
  }, v);
  if (!(r.existe && r.ativa && r.botaoAtivo && r.quantasAtivas === 1)) idas.push({ v, ...r });
}
ok('cada item da lateral abre a sua área, e só ela fica marcada', !idas.length, idas);

/* ---- 2. o rodapé da lateral: tema, configurações, sair -------------- */
const tema = await p.evaluate(async () => {
  const antes = document.documentElement.getAttribute('data-ds-tema') ||
                (document.body.classList.contains('light') ? 'claro' : 'escuro');
  document.getElementById('mwSidebarDarkToggle')?.click();
  await new Promise(r => setTimeout(r, 600));
  const depois = document.documentElement.getAttribute('data-ds-tema') ||
                 (document.body.classList.contains('light') ? 'claro' : 'escuro');
  document.getElementById('mwSidebarDarkToggle')?.click();
  await new Promise(r => setTimeout(r, 600));
  const volta = document.documentElement.getAttribute('data-ds-tema') ||
                (document.body.classList.contains('light') ? 'claro' : 'escuro');
  return { antes, depois, volta };
});
ok('o interruptor de tema da lateral troca e volta',
   tema.antes !== tema.depois && tema.antes === tema.volta, tema);

const config = await p.evaluate(async () => {
  document.getElementById('mwSidebarSettings')?.click();
  await new Promise(r => setTimeout(r, 700));
  return { ativa: document.getElementById('view-settings')?.classList.contains('active') };
});
ok('"Configurações" da lateral abre Configurações', config.ativa, config);

const perfil = await p.evaluate(async () => {
  document.getElementById('mwSidebarProfileBtn')?.click();
  await new Promise(r => setTimeout(r, 700));
  return { ativa: document.getElementById('view-profile')?.classList.contains('active') };
});
ok('o cartão de perfil da lateral abre o Perfil', perfil.ativa, perfil);

ok('o botão de sair existe', await p.evaluate(() => !!document.getElementById('mwSidebarLogout')));

/* ---- 3. a barra do topo ---------------------------------------------- */
/* Perguntar "a barra do topo mostra o botão X?" é a pergunta errada, e
   a primeira versão deste teste reprovou o app por causa dela: no
   desktop `#profileBtn`, `#themeToggle` e `#quickAdd` são `display:none`
   de PROPÓSITO — perfil e tema moram na barra lateral, que está sempre
   à vista, e o "+" mora dentro de cada área. Duplicá-los no topo seria
   o defeito, não escondê-los.

   A pergunta certa é a que a pessoa faz: cada função continua ao
   ALCANCE, em algum lugar da moldura? É isso que uma migração da
   navegação pode quebrar de verdade. */
const topo = await p.evaluate(() => {
  const vis = e => { if (!e) return false; const c = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 4 && r.height > 4; };
  const algum = sels => sels.some(s => vis(document.querySelector(s)));
  return {
    tema:  algum(['#themeToggle', '#mwSidebarDarkToggle']),
    perfil: algum(['#profileBtn', '#mwSidebarProfileBtn', '#mwBottomNav [data-view="profile"]']),
    config: algum(['#mwSidebarSettings', '#nav [data-view="settings"]']),
    busca: algum(['#searchToggle', '#globalSearch']),
    sino:  algum(['#notificationBtn']),
    ia:    algum(['#mateusAiBtn'])
  };
});
ok('toda função da moldura está ao alcance em algum lugar',
   Object.values(topo).every(Boolean), topo);

const sino = await p.evaluate(async () => {
  document.getElementById('notificationBtn')?.click();
  /* 400ms media o menu NO MEIO da transição de abertura: opacidade 0 e
     um relatório de "menu invisível" que não existe. Esperar o fim. */
  await new Promise(r => setTimeout(r, 900));
  const m = document.getElementById('notificationMenu');
  const aberto = m && !m.classList.contains('hidden');
  const cs = m ? getComputedStyle(m) : null;
  /* Menu translúcido sobre o conteúdo já foi defeito relatado: tem de
     ter fundo PRÓPRIO e opaco o bastante para ler. E o fundo pode vir
     de `background-image` (é um degradê aqui), não só de
     `background-color` — olhar só a cor dá alpha 0 num menu sólido. */
  const alpha = cs ? Number((cs.backgroundColor.match(/[\d.]+/g)||[0,0,0,1])[3] ?? 1) : 0;
  const temDegrade = !!cs && cs.backgroundImage !== 'none';
  const opaco = cs ? +cs.opacity : 0;
  document.getElementById('notificationBtn')?.click();
  return { aberto, alpha, temDegrade, opaco };
});
ok('o sino abre um menu com fundo próprio e opaco',
   sino.aberto && sino.opaco > .9 && (sino.alpha > .8 || sino.temDegrade), sino);

/* ---- 4. a barra de baixo -------------------------------------------- */
/* Ela é do APP INSTALADO, não do navegador. A regra que decide isso
   está no `mw-nav-por-contexto`:

     html:not(.mw-standalone) body.mw-in-app #mwBottomNav{display:none!important}

   e é uma escolha de produto, não um defeito: no navegador a pessoa tem
   a lateral e o botão de menu; a barra de baixo existe para o app
   instalado, onde não há barra de endereço nem aba. A primeira versão
   deste teste media no navegador e reprovou quatro verificações de uma
   vez — todas corretas.

   Então o teste veste a marca de instalado, como o teste 4 faz para
   provar o contrário (que ali a barra NÃO pode aparecer).

   E antes de medir, VOLTA para uma área comum. Perfil e Configurações
   são "telas-folha": ali o app marca `body.mw-tela-folha`, esconde a
   barra de baixo e mostra a seta de voltar — de propósito, porque são
   telas de onde se sai, não destinos da navegação principal. A seção 2
   deste teste abre as duas, e a primeira versão media a barra logo
   depois: relatava "a barra de baixo sumiu" para um app que estava
   fazendo exatamente o que devia. */
await p.evaluate(() => document.querySelector('#nav button[data-view="home"]')?.click());
await p.waitForTimeout(600);

const baixo = await p.evaluate(() => {
  const nav = document.getElementById('mwBottomNav');
  if (!nav) return { existe: false };
  const cs = getComputedStyle(nav);
  const bts = [...nav.querySelectorAll('button[data-view]')].map(b => ({
    view: b.dataset.view, alt: Math.round(b.getBoundingClientRect().height),
    larg: Math.round(b.getBoundingClientRect().width) }));
  return { existe: true, mostrando: cs.display !== 'none', display: cs.display,
           itens: bts, emApp: document.body.classList.contains('mw-in-app') };
});
if (modo === 'instalado') {
  ok('a barra de baixo aparece no app instalado', baixo.existe && baixo.mostrando, baixo);
  ok('com os cinco caminhos principais', baixo.itens && baixo.itens.length >= 4, baixo.itens);
  ok('e cada um com altura de toque (>=44px)',
     baixo.itens && baixo.itens.every(x => x.alt >= 44), baixo.itens);

  /* O item de PERFIL não navega: ele abre a gaveta lateral. Foi decisão
     de uma rodada anterior — no app instalado o hambúrguer foi
     substituído pela foto de perfil, e ela virou a porta do menu. Um
     teste que espera `view-profile.active` ali reprova o desenho, não o
     defeito. */
  const troca = [];
  for (const it of (baixo.itens || [])) {
    if (it.view === 'profile') continue;
    await p.evaluate(v => document.querySelector(`#mwBottomNav button[data-view="${v}"]`)?.click(), it.view);
    await p.waitForTimeout(420);
    const r = await p.evaluate(v => ({
      ativa: document.getElementById('view-' + v)?.classList.contains('active'),
      marcadas: document.querySelectorAll('#mwBottomNav button.active').length
    }), it.view);
    if (!(r.ativa && r.marcadas === 1)) troca.push({ v: it.view, ...r });
  }
  ok('cada item da barra de baixo abre a sua área', !troca.length, troca);

  const avatar = await p.evaluate(async () => {
    document.querySelector('#mwBottomNav [data-view="profile"]')?.click();
    await new Promise(r => setTimeout(r, 900));
    const aberta = document.body.classList.contains('mw-drawer-open');
    document.getElementById('mwSidebarScrim')?.click();
    await new Promise(r => setTimeout(r, 800));
    return { aberta, fechou: !document.body.classList.contains('mw-drawer-open') };
  });
  ok('e o item de perfil abre o menu lateral', avatar.aberta && avatar.fechou, avatar);

  /* A tela-folha, agora como afirmação e não como acidente: ao abrir
     Configurações a barra sai e a seta de voltar entra; ao voltar, o
     contrário. É o que dá à pessoa um caminho de saída sem depender do
     gesto do sistema — que no app instalado nem sempre existe. */
  const folha = await p.evaluate(async () => {
    document.getElementById('mwSidebarSettings')?.click();
    await new Promise(r => setTimeout(r, 800));
    const nav = document.getElementById('mwBottomNav');
    const volta = document.getElementById('mwBackBtn');
    const dentro = { marca: document.body.classList.contains('mw-tela-folha'),
                     barra: getComputedStyle(nav).display,
                     seta: !!volta && !volta.hidden && getComputedStyle(volta).display !== 'none' };
    volta?.click();
    await new Promise(r => setTimeout(r, 800));
    return { dentro, fora: { marca: document.body.classList.contains('mw-tela-folha'),
                             barra: getComputedStyle(nav).display } };
  });
  ok('numa tela-folha a barra sai e a seta de voltar entra',
     folha.dentro.marca && folha.dentro.barra === 'none' && folha.dentro.seta, folha.dentro);
  ok('e a seta devolve a pessoa à navegação principal',
     !folha.fora.marca && folha.fora.barra !== 'none', folha.fora);

} else if (modo === 'celular') {
  ok('no navegador do celular a barra de baixo não aparece', !baixo.mostrando, baixo);

  /* A GAVETA FECHADA TEM DE ESTAR FORA DA TELA.
     ---------------------------------------------------------------
     Esta verificação nasceu de um defeito que eu mesmo introduzi: um
     laço de restrição alcançou a regra que dá a geometria da gaveta
     (`position:fixed` mais `translate3d(-105%,0,0)`) porque ela também
     declarava `background`. No telefone a lateral passou a ficar EM
     CIMA da tela, 292px de largura, empurrando o app inteiro para
     baixo.

     Nenhum teste viu isso de frente. Quem pegou foi o teste de toque,
     e por tabela: o cartão do quadro tinha ido parar fora da janela, e
     o arraste falhou. Um defeito desse tamanho não pode depender de um
     arraste para aparecer. */
  const gavetaFechada = await p.evaluate(() => {
    const a = document.querySelector('.sidebar');
    const r = a.getBoundingClientRect();
    const m = document.querySelector('.main').getBoundingClientRect();
    return { x: Math.round(r.x), direita: Math.round(r.right), larg: Math.round(r.width),
             mainY: Math.round(m.y), janela: innerWidth };
  });
  ok('com a gaveta fechada, a lateral está fora da tela',
     gavetaFechada.direita <= 4, gavetaFechada);
  ok('e o conteúdo começa no topo, não abaixo dela',
     gavetaFechada.mainY < 80, gavetaFechada);
  /* A gaveta: abre pelo botão de menu, cobre com o véu, fecha no véu. */
  const gaveta = await p.evaluate(async () => {
    document.getElementById('mwMobileMenu')?.click();
    await new Promise(r => setTimeout(r, 700));
    const aberta = document.body.classList.contains('mw-drawer-open');
    const veu = document.getElementById('mwSidebarScrim');
    const veuVis = veu && getComputedStyle(veu).display !== 'none' && +getComputedStyle(veu).opacity > .05;
    const barra = getComputedStyle(document.getElementById('mwBottomNav')).display;
    veu?.click();
    await new Promise(r => setTimeout(r, 700));
    return { aberta, veuVis, barra, fechou: !document.body.classList.contains('mw-drawer-open') };
  });
  ok('o menu lateral abre com véu e fecha ao tocar nele',
     gaveta.aberta && gaveta.veuVis && gaveta.fechou, gaveta);
} else {
  ok('a barra de baixo NÃO aparece no desktop', !baixo.mostrando, baixo);
  const lateral = await p.evaluate(() => {
    const a = document.querySelector('.sidebar');
    const c = a ? getComputedStyle(a) : null;
    return { visivel: !!c && c.display !== 'none', larg: a ? Math.round(a.getBoundingClientRect().width) : 0 };
  });
  ok('e a barra lateral fica sempre à vista', lateral.visivel && lateral.larg > 60, lateral);

  const recolhe = await p.evaluate(async () => {
    const a = document.querySelector('.sidebar');
    const antes = Math.round(a.getBoundingClientRect().width);
    document.getElementById('mwSidebarCollapse')?.click();
    await new Promise(r => setTimeout(r, 700));
    const depois = Math.round(a.getBoundingClientRect().width);
    document.getElementById('mwSidebarCollapse')?.click();
    await new Promise(r => setTimeout(r, 700));
    return { antes, depois, volta: Math.round(a.getBoundingClientRect().width) };
  });
  ok('a lateral recolhe e volta', recolhe.depois < recolhe.antes - 40 && recolhe.volta === recolhe.antes, recolhe);
}

/* ---- 5. a trava que o usuário encontrou ------------------------------ */
/* Duas fotos, num iPhone: a barra de baixo POR CIMA da tela de login,
   com Início/Faculdade/Arquivos/Perfil clicáveis sem sessão nenhuma. A
   causa era uma regra com dois seletores e só um deles travado. O teste
   4 já cobre isso na abertura; aqui a checagem é a da outra ponta —
   tirar a marca de "dentro do app" tem de esconder a barra. */
const semApp = await p.evaluate(async () => {
  document.body.classList.remove('mw-in-app');
  await new Promise(r => setTimeout(r, 300));
  const nav = document.getElementById('mwBottomNav');
  const veu = document.getElementById('mwSidebarScrim');
  const r = { barra: nav ? getComputedStyle(nav).display : 'sem barra',
              veu: veu ? getComputedStyle(veu).display : 'sem véu' };
  document.body.classList.add('mw-in-app');
  return r;
});
ok('sem a marca de "dentro do app", a barra de baixo some',
   semApp.barra === 'none', semApp);
ok('e o véu do menu também', semApp.veu === 'none', semApp);

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
