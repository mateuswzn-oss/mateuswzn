/* Contraste da tela de ENTRADA — o que faltava na coleta do teste 7.
 *
 * O 7-contraste-coleta.mjs usa o `ajuda.abre()`, que esconde a tela de
 * login de propósito para chegar ao app. Resultado: a única tela que
 * toda pessoa vê antes de qualquer outra nunca foi medida.
 *
 * Isso passou despercebido enquanto o fundo dela era `#0b0c0e` fixo,
 * igual nos dois temas. A migração para o Design System tirou esse
 * carimbo: agora ela segue o tema como o resto do app — o que é uma
 * melhora, e é também um motivo para medir.
 *
 * Escreve no MESMO formato do teste 7; quem calcula é o
 * 7-contraste-medir.py, que já lê qualquer `contraste-*.json`.
 *
 * Uso: node tools/testes/7b-contraste-login.mjs [largura] [dark|light]
 */
import { ENDERECO, achaNavegador, pastaSaida } from './ajuda.mjs';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const larg = Number(process.argv[2] || 1440);
const tema = process.argv[3] || 'dark';
const saida = pastaSaida();

const ep = achaNavegador();
const b = await chromium.launch(ep ? { executablePath: ep } : {});
const p = await b.newPage({ viewport: { width: larg, height: larg < 500 ? 844 : 900 } });

const erros = [];
p.on('pageerror', e => erros.push('pageerror: ' + e.message));

await p.addInitScript(t => {
  localStorage.setItem('mwZerarTudo-2026-08-e', '1');
  if (t === 'light') localStorage.setItem('mwTemaPreferido', 'light');
}, tema);
await p.goto(ENDERECO + '/index.html');
/* O boot tem piso de 4,55s: esperar pela condição, nunca por um número. */
await p.waitForFunction(
  () => !document.getElementById('mwBootLoader') &&
        document.documentElement.classList.contains('mw-login-pronto'),
  null, { timeout: 20000 });
await p.waitForTimeout(900);
if (tema === 'light') {
  await p.evaluate(() => document.body.classList.add('light'));
  await p.waitForTimeout(600);
}

const colhido = [];
/* Os dois painéis do cartão: entrar e criar conta. O segundo tem as três
   etapas, e cada uma mostra textos que o outro não tem. */
const PAINEIS = [
  ['entrar', null],
  ['criar-1', 'signup'],
  ['criar-2', 'signup2'],
];

const junta = async rotulo => {
  /* 1,2s, não 500ms. O cartão desliza entre "entrar" e "criar" num
     trilho de 200% de altura, e fotografar no meio do caminho mede o
     texto de um painel sobre o fundo do outro — foi o que produziu
     leituras de 1,1:1 num texto branco sobre um painel azul escuro. */
  await p.waitForTimeout(1200);
  const cands = await p.evaluate(() => {
    const view = document.getElementById('loginScreen');
    if (!view) return [];
    const out = [];
    view.querySelectorAll('p,span,small,label,li,td,b,strong,em,a,h1,h2,h3,h4,button').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (t.length < 3) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .5) return;
      if (r.width < 10 || r.height < 6 || r.top < 0 || r.bottom > window.innerHeight ||
          r.left < 0 || r.right > window.innerWidth) return;
      /* Texto de controle DESLIGADO não entra: os botões de entrada
         social estão desabilitados de propósito ("em breve"), e a WCAG
         não exige contraste mínimo para um controle inativo. */
      if (e.disabled || e.closest('[disabled]')) return;
      let pintado = false, n = e;
      for (let i = 0; i < 3 && n; i++, n = n.parentElement) {
        const c = getComputedStyle(n);
        const a = (c.backgroundColor.match(/[\d.]+/g) || [0,0,0,1]);
        if (c.backgroundImage !== 'none' || (+(a[3] ?? 1)) > 0.5) { pintado = true; break; }
      }
      out.push({ t: t.slice(0,34), cor: cs.color, px: parseFloat(cs.fontSize), peso: +cs.fontWeight, pintado,
                 box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] });
    });
    return out;
  });
  if (!cands.length) return;
  const png = path.join(saida, `contraste-login-${larg}-${tema}-${rotulo}.png`);
  await p.screenshot({ path: png });
  colhido.push({ v: 'login-' + rotulo, png, cands });
};

await junta('entrar');

await p.evaluate(() => document.querySelector('#loginScreen [data-view="signup"]')?.click());
await junta('criar-1');

/* Etapa 2: a barra de força da senha e a confirmação só existem ali. */
await p.evaluate(() => {
  const set = (id, v) => { const e = document.getElementById(id); if (!e) return;
    e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
  set('newUsername', 'mateus.wzn'); set('newEmail', 'mateus@exemplo.com');
  document.querySelector('#inlineCreateForm .mw-etapa:not([hidden]) [data-vai="2"]')?.click();
});
await p.waitForTimeout(400);
await p.evaluate(() => {
  const e = document.getElementById('newPass');
  if (e) { e.value = 'Senha-media-1'; e.dispatchEvent(new Event('input', { bubbles: true })); }
});
await junta('criar-2');

fs.writeFileSync(path.join(saida, `contraste-login-${larg}-${tema}.json`),
                 JSON.stringify({ larg, tema, erros, saida: colhido }));
console.log(`coletado login ${larg}px ${tema}: ${colhido.length} painéis, ` +
            `${colhido.reduce((a,s) => a + s.cands.length, 0)} textos | ` +
            `erros JS: ${erros.length ? erros.join(' | ') : 'nenhum'}`);
await b.close();
