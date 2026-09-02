/* Android, com toque de verdade.

   O Chrome do Android usa o MESMO motor que o Chromium desta máquina, então
   emular o Pixel 7 aqui não é aproximação: é o mesmo renderizador, com o
   mesmo tamanho, a mesma densidade e — o que importa — hasTouch ligado.
   O que isto valida que o teste de desktop não valida é o gesto: arrastar
   um cartão do quadro com o dedo passa por PointerEvent de tipo 'touch',
   caminho de código diferente do mouse.

   (Safari/WebKit não é testável aqui: o download do WebKit é barrado pelo
   proxy desta máquina. Veja a tabela do LEIAME.)

   Uso: node tools/testes/5-android-toque.mjs */
import { chromium, devices } from 'playwright';
import { achaNavegador, ENDERECO, AREAS, PNG_1X1 } from './ajuda.mjs';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

const semente = {
  subjects:[{ name:'Cálculo I', description:'', progress:40 }],
  projects:[{ name:'TCC', description:'App', status:'Planejamento', priority:'Alta', deadline: dia(3) },
            { name:'Seminário', description:'Slides', status:'Em andamento', priority:'Média', deadline: dia(6) }],
  activities:[{ name:'Lista 4', description:'', date: dia(1), priority:'Alta', subject:'Cálculo I' }],
  notes:[{ title:'Nota', body:'Texto '.repeat(60), category:'Estudos' }], institutions:[],
  focus:{ config:{ foco:25, pausa:5, longa:15 }, atual:null, sessoes:[] },
  profile:{ name:'Mateus', email:'', photo:'', username:'', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'', course:'', area:'', semester:1 }, theme:'dark'
};

const perfil = devices['Pixel 7'] || {
  viewport:{ width:412, height:915 }, deviceScaleFactor:2.625, isMobile:true, hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36'
};

const exe = achaNavegador();
const b = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await b.newContext({ ...perfil });
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', e => erros.push('pageerror: ' + e.message));
p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load|net::/.test(t)) erros.push('console: ' + t); });

await p.addInitScript(([d]) => {
  localStorage.setItem('mwZerarTudo-2026-08-e', '1');
  localStorage.setItem('mateusWorkspaceV4', JSON.stringify(d));
  localStorage.setItem('mwSession', '1');
}, [semente]);
await p.goto(ENDERECO + '/index.html');
await p.waitForTimeout(2800);
await p.evaluate(() => {
  document.getElementById('mwBootLoader')?.remove();
  const l = document.getElementById('loginScreen'); if (l) l.style.display = 'none';
  const a = document.getElementById('app'); if (a) { a.style.display = ''; a.hidden = false; a.classList.remove('hidden'); }
  document.documentElement.classList.add('mw-login-pronto');
});
await p.waitForTimeout(400);

console.log('ambiente:', JSON.stringify(await p.evaluate(() => ({
  toque: 'ontouchstart' in window, pontos: navigator.maxTouchPoints,
  tela: innerWidth + 'x' + innerHeight, dpr: devicePixelRatio,
  ua: navigator.userAgent.slice(0, 58) + '…'
}))));

let ruins = 0;

// ---- 1. ARRASTAR NO QUADRO, COM O DEDO ----
await p.evaluate(() => window.showView('projects'));
await p.waitForTimeout(900);
const antes = await p.evaluate(() => ({
  modo: document.querySelector('.mw-proj-modos button[aria-pressed="true"]')?.textContent,
  status: window.data.projects.map(x => x.name + '=' + x.status),
  cartoes: document.querySelectorAll('.mw-kan-card').length
}));
console.log('\nquadro:', JSON.stringify(antes));

if (antes.cartoes) {
  const cartao = await p.locator('.mw-kan-card').first().boundingBox();
  const colunas = await p.locator('.mw-kan-col').all();
  console.log('  colunas achadas:', colunas.length);
  const destino = colunas.length > 3 ? await colunas[3].boundingBox() : null;
  if (cartao && destino) {
    await p.touchscreen.tap(cartao.x + cartao.width/2, cartao.y + cartao.height/2);
    await p.waitForTimeout(120);
    /* Gesto de dedo montado à mão: toca, segura, arrasta em passos e
       solta. p.dragTo() emite eventos de mouse, que não é o caminho
       que este código percorre num celular. */
    await p.evaluate(async ([cx, cy, dx, dy]) => {
      const alvo = document.elementFromPoint(cx, cy)?.closest('.mw-kan-card');
      if (!alvo) return;
      const ev = (t, x, y) => alvo.dispatchEvent(new PointerEvent(t, { bubbles:true, cancelable:true,
        pointerId:1, pointerType:'touch', isPrimary:true, clientX:x, clientY:y, buttons: t === 'pointerup' ? 0 : 1 }));
      ev('pointerdown', cx, cy);
      for (let i = 1; i <= 12; i++) { ev('pointermove', cx + (dx-cx)*i/12, cy + (dy-cy)*i/12); await new Promise(r => setTimeout(r, 25)); }
      ev('pointerup', dx, dy);
    }, [cartao.x + cartao.width/2, cartao.y + cartao.height/2, destino.x + destino.width/2, destino.y + 60]);
    await p.waitForTimeout(900);
    const depois = await p.evaluate(() => window.data.projects.map(x => x.name + '=' + x.status));
    console.log('  depois de arrastar com o dedo:', JSON.stringify(depois));
    if (JSON.stringify(depois) === JSON.stringify(antes.status)) { console.log('  <<< o cartão não se moveu'); ruins++; }
  }
}

// ---- 2. TOQUES NAS ÁREAS QUE A REFORMULAÇÃO ACRESCENTOU ----
for (const [area, alvo, oque] of [
  ['focus',    '#mwFocoPrincipal',                      'iniciar o cronômetro'],
  ['calendar', '#mwCalModos button[data-cal="semana"]', 'trocar para semana'],
  ['reports',  '#view-reports [data-rel-periodo="7"]',  'trocar o período'],
  ['notes',    '#notesList .mw-nota-ver',               'abrir "Ver mais"'],
]) {
  await p.evaluate(a => window.showView(a), area);
  await p.waitForTimeout(700);
  if (!await p.locator(alvo).count()) { console.log('\n' + area + ': alvo não encontrado (' + oque + ')  <<<'); ruins++; continue; }
  const cx = await p.locator(alvo).first().boundingBox();
  await p.touchscreen.tap(cx.x + cx.width/2, cx.y + cx.height/2);
  await p.waitForTimeout(600);
  const r = await p.evaluate(([a]) => {
    if (a === 'focus')    return { botao: document.getElementById('mwFocoPrincipal').textContent,
                                   rodando: !!JSON.parse(localStorage.getItem('mateusWorkspaceV4')).focus?.atual };
    if (a === 'calendar') return { semana: document.getElementById('mwSemanaCard')?.getAttribute('data-mw-oculto') !== '1' };
    if (a === 'reports')  return { periodo: document.getElementById('mwRelTempoPeriodo').textContent };
    if (a === 'notes')    return { aberto: !!document.querySelector('.mw-nota-aberta') };
  }, [area]);
  console.log('\n' + area + ' — ' + oque + ':', JSON.stringify(r));
}

// ---- 3. ANEXAR ARQUIVO ----
await p.evaluate(() => window.showView('files'));
await p.waitForTimeout(600);
await p.setInputFiles('#mwArqInput', [{ name:'foto.png', mimeType:'image/png', buffer: Buffer.from(PNG_1X1, 'base64') }]);
await p.waitForTimeout(1100);
const arqs = await p.evaluate(() => document.querySelectorAll('.mw-arq-item').length);
console.log('\narquivos por toque:', arqs, 'item(ns)');
if (!arqs) ruins++;

// ---- 4. VAZAMENTO EM TODAS AS ÁREAS, NO TAMANHO ANDROID ----
const ruinsArea = [];
for (const a of AREAS) {
  await p.evaluate(n => { const bt = document.querySelector(`#nav button[data-view="${n}"]`); if (bt) bt.click(); else window.showView(n); }, a);
  await p.waitForTimeout(320);
  const r = await p.evaluate(n => {
    const v = document.getElementById('view-' + n);
    if (!v) return { scrollH:false, fora:0 };
    const fora = [...v.querySelectorAll('*')].filter(e => {
      const b = e.getBoundingClientRect();
      if (!b.width && !b.height) return false;
      let pai = e.parentElement, rol = false;
      while (pai && pai !== document.body) { if (/auto|scroll/.test(getComputedStyle(pai).overflowX)) { rol = true; break; } pai = pai.parentElement; }
      return !rol && (b.right > window.innerWidth + 1 || b.left < -1);
    }).length;
    return { scrollH: document.documentElement.scrollWidth > window.innerWidth + 1, fora };
  }, a);
  if (r.scrollH || r.fora) ruinsArea.push(a + ':' + JSON.stringify(r));
}
console.log('\náreas com vazamento em Android:', ruinsArea.length ? ruinsArea : 'nenhuma');
ruins += ruinsArea.length;

console.log('\nERROS:', erros.length ? erros : 'nenhum');
await b.close();
process.exit(ruins || erros.length ? 1 : 0);
