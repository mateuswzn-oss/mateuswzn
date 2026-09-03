/* Teste 23 — o toque chega em quem está na tela.
 *
 * POR QUE ESTE TESTE EXISTE
 *
 * O Mateus abriu o menu no iPhone e mandou a foto: a tela inteira
 * borrada, nada legível. As vinte e uma etapas da suíte estavam verdes.
 *
 * A causa era de EMPILHAMENTO. O véu da gaveta (`#mwSidebarScrim`) era
 * filho de `<body>` com `z-index:110`; a gaveta é filha de `#app`, que
 * tem `isolation:isolate`, com `z-index:120`. Os dois números pareciam
 * certos e não eram comparáveis — estavam em contextos diferentes — e o
 * `#app` inteiro, gaveta junto, pintava por baixo do véu. O
 * `backdrop-filter` do véu então borrava a própria gaveta, e
 * `elementFromPoint` no meio dela devolvia o véu: tocar em "Disciplinas"
 * fechava o menu em vez de abrir a área.
 *
 * POR QUE NENHUM TESTE VIU
 * Todos os outros acionam controles com `elemento.click()`, que dispara
 * o manipulador DIRETO no nó e não passa por teste de acerto. Eles
 * respondem "o gancho funciona?", nunca "o dedo alcança?". Um véu mal
 * empilhado, um cartão com z-index alto, um cabeçalho que cresceu:
 * qualquer um desses passa despercebido por `.click()` e deixa a tela
 * inutilizável.
 *
 * O QUE SE MEDE AQUI
 * Para cada controle que deveria estar ao alcance, `elementFromPoint` no
 * centro dele tem que devolver ELE (ou um descendente seu). E, para
 * fechar o ciclo, um toque por COORDENADA precisa produzir o efeito —
 * porque só isso prova que o caminho inteiro, do pixel ao dado, está de
 * pé.
 *
 * Uso: node tools/testes/23-toque-chega.mjs
 */
import { abre, esperaParar } from './ajuda.mjs';

const SEMENTE = {
  subjects: [{ name: 'Cálculo I', description: 'Limites', progress: 62, semester: 1 }],
  projects: [], activities: [], notes: [], institutions: [],
  profile: { name: 'Mateus Souza', username: 'mateuswzn' },
  college: { institution: 'UFPA', course: 'Engenharia', semester: 5 },
  theme: 'dark'
};

const { b, p, erros } = await abre(SEMENTE, { viewport: { width: 390, height: 844 } });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(52), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

console.log('=== o toque chega em quem está na tela · celular (390px) ===');

/* ---- 1. a moldura, com a gaveta FECHADA ------------------------------ */
const moldura = await p.evaluate(() => {
  const alcanca = e => {
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
    const em = document.elementFromPoint(x, y);
    return { chega: !!em && (em === e || e.contains(em)),
             quemPegou: em ? (em.id || String(em.className).slice(0, 28) || em.tagName) : 'nada' };
  };
  const fora = [];
  for (const sel of ['#mwMobileMenu', '#searchToggle', '#notificationBtn',
                     '#mateusAiBtn', '#quickAdd', '#profileBtn']) {
    const e = document.querySelector(sel);
    if (!e || !e.offsetWidth) continue;          // não existe nesta largura: não é defeito
    const r = alcanca(e);
    if (r && !r.chega) fora.push(sel + ' → ' + r.quemPegou);
  }
  for (const e of document.querySelectorAll('#mwBottomNav button')) {
    if (!e.offsetWidth) continue;
    const r = alcanca(e);
    if (r && !r.chega) fora.push('barra de baixo: ' + (e.id || e.dataset.view) + ' → ' + r.quemPegou);
  }
  return fora;
});
ok('todo botão da moldura recebe o toque', !moldura.length, moldura);

/* ---- 2. a gaveta ABERTA ---------------------------------------------- */
await p.evaluate(() => document.getElementById('mwMobileMenu')?.click());
await p.waitForTimeout(900);
await esperaParar(p, '#app .sidebar');

const gaveta = await p.evaluate(() => {
  const fora = [];
  for (const e of document.querySelectorAll('#app .sidebar [data-view]')) {
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    /* Só o que está DENTRO da tela: a lista rola, e um item abaixo da
       dobra não estar ao alcance é a rolagem funcionando, não defeito. */
    if (r.top < 0 || r.bottom > innerHeight) continue;
    const em = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                        Math.round(r.top + r.height / 2));
    if (!(em && (em === e || e.contains(em))))
      fora.push((e.dataset.view || '?') + ' → ' + (em ? (em.id || String(em.className).slice(0, 24)) : 'nada'));
  }
  return fora;
});
ok('todo item da gaveta aberta recebe o toque', !gaveta.length, gaveta);

/* ---- 3. o toque POR COORDENADA leva à área, e fecha a gaveta ---------
   O passo que fecha o ciclo: `elementFromPoint` diz quem está por cima,
   mas só o toque de verdade prova que o caminho inteiro responde. */
const alvo = await p.evaluate(() => {
  const e = document.querySelector('#app .sidebar [data-view="subjects"]');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});
if (!alvo) { ok('achei "Disciplinas" na gaveta', false, {}); }
else {
  await p.mouse.click(alvo.x, alvo.y);
  await p.waitForTimeout(1000);
  const depois = await p.evaluate(() => ({
    tela: document.querySelector('#app .view.active')?.id,
    gavetaAberta: document.getElementById('app').classList.contains('mw-mobile-open'),
    veu: getComputedStyle(document.getElementById('mwSidebarScrim') || document.body).display
  }));
  ok('tocar em "Disciplinas" abre Disciplinas', depois.tela === 'view-subjects', depois);
  ok('e a gaveta fecha ao escolher a área', !depois.gavetaAberta, depois);
}

/* ---- 4. nada de vidro borra a si mesmo --------------------------------
   O sintoma que o Mateus viu antes de qualquer número: a gaveta borrada.
   Um elemento com `backdrop-filter` que fique POR CIMA de outro que
   deveria estar acima dele borra o que não devia. Aqui se mede a regra
   geral: quem tem backdrop-filter e cobre a tela inteira não pode estar
   à frente de um painel que o usuário precisa ler. */
await p.evaluate(() => document.getElementById('mwMobileMenu')?.click());
await p.waitForTimeout(900);
const vidro = await p.evaluate(() => {
  const lat = document.querySelector('#app .sidebar');
  if (!lat) return { erro: 'sem lateral' };
  const r = lat.getBoundingClientRect();
  const em = document.elementFromPoint(Math.round(r.left + r.width / 2),
                                       Math.round(r.top + Math.min(r.height / 2, innerHeight / 2)));
  const cobre = [...document.querySelectorAll('*')].filter(e => {
    const cs = getComputedStyle(e);
    if (cs.backdropFilter === 'none' && cs.webkitBackdropFilter === 'none') return false;
    const b = e.getBoundingClientRect();
    return b.width >= innerWidth * 0.9 && b.height >= innerHeight * 0.9;
  }).map(e => e.id || String(e.className).slice(0, 24));
  return { quemEstaSobreAGaveta: em ? (em.id || String(em.className).slice(0, 28)) : 'nada',
           vidrosDeTelaCheia: cobre,
           gavetaEstaPorCima: !!em && lat.contains(em) };
});
ok('nenhum vidro de tela cheia fica na frente da gaveta', vidro.gavetaEstaPorCima, vidro);

await p.evaluate(() => {
  const a = document.getElementById('app');
  if (a && a.classList.contains('mw-mobile-open')) document.getElementById('mwMobileMenu')?.click();
});

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
