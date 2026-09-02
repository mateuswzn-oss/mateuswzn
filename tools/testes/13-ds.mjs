/* Design System: o sistema se sustenta sozinho, e não vaza no app.

   Duas perguntas, e as duas são estruturais:

   1. O DS funciona SEM o app? A galeria carrega só o mw-ds.css. Se algum
      componente dependesse de uma regra legada, ele quebraria ali — e é
      essa prova que sustenta a afirmação "não está empilhado sobre o
      legado". Aqui se mede contraste no pixel, alvo de toque, anel de
      foco e vazamento horizontal, nos dois temas e em quatro larguras.

   2. O DS está INERTE no app? Enquanto nenhuma área foi migrada, não
      existe `.mw-ds` dentro do #app, e a folha não pode ter mudado nada.
      A comprovação é comparar o app com a folha ligada e desligada: se
      um pixel de layout mudar, ela não estava inerte.

   Uso: node tools/testes/13-ds.mjs */
import { chromium } from 'playwright';
import { achaNavegador, ENDERECO, abre, AREAS, vaiPara, esperaParar, pastaSaida } from './ajuda.mjs';
import fs from 'fs';
import path from 'path';

const exe = achaNavegador();
let ruins = 0;
const falha = (m, x) => { console.log('  FALHOU ' + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); ruins++; };

/* ========== 1. A GALERIA, SOZINHA ======================================== */
console.log('=== o sistema sem o app ===');
const b = await chromium.launch(exe ? { executablePath: exe } : {});

for (const tema of ['escuro', 'claro']) {
  for (const [rot, larg] of [['desktop', 1280], ['tablet', 834], ['celular', 390], ['estreito', 320]]) {
    const p = await b.newPage({ viewport: { width: larg, height: 900 } });
    const erros = [];
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load|net::/.test(t)) erros.push('console: ' + t); });
    /* Falha em carregar o CSS tem de ser barulhenta: sem isso o teste
       mediria uma página sem estilo e diria que está tudo bem. */
    let folhaOk = true;
    p.on('response', r => { if (r.url().endsWith('mw-ds.css') && !r.ok()) folhaOk = false; });

    await p.goto(ENDERECO + '/ds/index.html');
    await p.evaluate(t => document.documentElement.setAttribute('data-mw-tema', t), tema);
    await p.waitForTimeout(500);
    await esperaParar(p, 'body');

    const m = await p.evaluate(() => {
      const rolaH = e => { let n = e.parentElement;
        while (n && n !== document.body) { const o = getComputedStyle(n).overflowX;
          if (o === 'auto' || o === 'scroll') return true; n = n.parentElement; } return false; };
      const fora = [...document.querySelectorAll('.mw-ds *')].filter(e => {
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return !rolaH(e) && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => (e.className || e.tagName).toString().slice(0, 34));

      /* alvo de toque: a mesma exceção da WCAG 2.5.8 usada no teste 3 —
         link dentro de frase é dispensado */
      const dentroDeFrase = e => {
        const pai = e.parentElement;
        if (!pai) return false;
        return getComputedStyle(e).display.startsWith('inline')
          && [...pai.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2);
      };
      const pequenos = [...document.querySelectorAll('.mw-ds button, .mw-ds a[href], .mw-ds [role="button"]')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1
          && (r.height < 24 || r.width < 24) && !dentroDeFrase(e); })
        .map(e => (e.className || e.tagName).toString().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));

      /* Toda folha do sistema tem de ter carregado: se o <link> falhar,
         não existe regra nenhuma e tudo "passa".

         Duas armadilhas aqui, e caí nas duas:
         1. cssRules.length conta só o TOPO, e com @layer cada camada
            inteira conta como UMA regra — o arquivo tem sete no topo.
         2. Desde o CSS Nesting, TODA CSSStyleRule tem um `cssRules`
            (vazio, para as regras aninhadas). Então "tem cssRules?" parou
            de significar "é regra de agrupamento": perguntar isso faz o
            contador descer em toda regra comum e contar zero.
         O que distingue de verdade: regra comum tem `style` com
         declarações; @layer/@media/@supports não têm. */
      const contaFundo = lista => {
        let n = 0;
        for (const r of lista) {
          if (r.style && r.style.length) n += 1;
          if (r.cssRules && r.cssRules.length) n += contaFundo(r.cssRules);
        }
        return n;
      };
      let regras = 0;
      for (const f of document.styleSheets) {
        try { if ((f.href || '').includes('mw-ds.css')) regras = contaFundo(f.cssRules); } catch(e){}
      }
      return { fora, pequenos, regras,
               corpoRola: document.documentElement.scrollWidth > innerWidth + 1,
               fundo: getComputedStyle(document.body).backgroundColor };
    });

    const alerta = [];
    if (!folhaOk) alerta.push('a folha não carregou');
    if (m.regras < 150) alerta.push('poucas regras (' + m.regras + ') — a folha carregou vazia?');
    if (m.fora.length) alerta.push('fora da tela: ' + JSON.stringify(m.fora.slice(0, 3)));
    if (m.corpoRola) alerta.push('o corpo rola na horizontal');
    if (m.pequenos.length) alerta.push('alvo pequeno: ' + JSON.stringify(m.pequenos.slice(0, 3)));
    if (erros.length) alerta.push('erros: ' + JSON.stringify(erros.slice(0, 2)));

    console.log('  ' + (tema + ' ' + rot).padEnd(20),
                m.regras + ' regras · ' + m.fundo,
                alerta.length ? '\n      <<< ' + alerta.join('\n      <<< ') : 'ok');
    if (alerta.length) ruins += alerta.length;

    if (larg === 1280) await p.screenshot({ path: path.join(pastaSaida(), `ds-galeria-${tema}.png`), fullPage: true });
    await p.close();
  }
}

/* ---- contraste do sistema, medido no pixel -------------------------------
   Colhe em várias rolagens: a galeria é bem mais alta que a dobra, e uma
   foto só mediria os primeiros trinta textos dizendo que cobriu tudo.
   O JSON sai no formato que o 7-contraste-medir.py já lê. */
console.log('\n=== contraste dos componentes (coleta) ===');

const colhe = pag => pag.evaluate(() => {
  const out = [];
  document.querySelectorAll('.mw-ds p,.mw-ds span,.mw-ds strong,.mw-ds h1,.mw-ds h2,.mw-ds h3,.mw-ds h4,.mw-ds label,.mw-ds button,.mw-ds td,.mw-ds th').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim(); if (t.length < 3) return;
    const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .5) return;
    if (r.width < 10 || r.height < 6 || r.top < 0 || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) return;
    /* elemento com preenchimento próprio é medido contra o próprio
       preenchimento, não contra o que está atrás dele */
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

for (const tema of ['escuro', 'claro']) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(ENDERECO + '/ds/index.html');
  await p.evaluate(t => document.documentElement.setAttribute('data-mw-tema', t), tema);
  await p.waitForTimeout(600);
  await esperaParar(p, 'body');

  const alturaTotal = await p.evaluate(() => document.documentElement.scrollHeight);
  const blocos = [];
  for (let y = 0; y < Math.max(1, alturaTotal - 300); y += 780) {
    await p.evaluate(v => window.scrollTo(0, v), y);
    await p.waitForTimeout(300);
    const png = path.join(pastaSaida(), `ds-contraste-${tema}-${y}.png`);
    await p.screenshot({ path: png });
    blocos.push({ v: 'ds@' + y, png, cands: await colhe(p) });
  }
  fs.writeFileSync(path.join(pastaSaida(), `contraste-ds-${tema}.json`),
                   JSON.stringify({ larg: 1280, tema, erros: [], saida: blocos }));
  const total = blocos.reduce((a, x) => a + x.cands.length, 0);
  console.log('  ' + tema.padEnd(8), total + ' textos em ' + blocos.length + ' rolagens');
  await p.close();
}

await b.close();

/* ========== 2. INERTE DENTRO DO APP ====================================== */
console.log('\n=== a folha está inerte no app? ===');
{
  const { b: b2, p, erros } = await abre({
    subjects:[{ name:'Cálculo I', description:'Limites', progress:40 }],
    projects:[{ name:'TCC', description:'App', status:'Em andamento', priority:'Alta' }],
    activities:[{ name:'Lista 4', description:'', date:'2026-09-10', priority:'Alta' }],
    notes:[{ title:'Ideia', body:'x', category:'Estudos' }], institutions:[],
    profile:{ name:'Mateus', email:'m@x.com', photo:'', username:'m', bio:'', skills:[], links:[], visibility:{} },
    college:{ institution:'UFPA', course:'Eng', area:'', semester:5 }, theme:'dark'
  }, { viewport: { width: 1280, height: 900 } });

  /* A pergunta mudou de forma quando a primeira área foi migrada. Não é
     mais "a folha não pode mexer em nada": é "ela tem de mexer EXATAMENTE
     nas áreas migradas, e em nenhuma outra". As duas metades importam —
     a segunda protege o que ainda é legado, e a primeira comprova que o
     sistema é mesmo quem pinta o que foi migrado. */
  const migradas = await p.evaluate(() =>
    [...document.querySelectorAll('#app [data-mw-migrada="1"]')].map(e => e.id.replace('view-', '')));
  console.log('  áreas migradas:', migradas.length ? migradas.join(', ') : 'nenhuma ainda');

  const medeTudo = () => p.evaluate(async (areas) => {
    const r = {};
    for (const a of areas) {
      const bt = document.querySelector(`#nav button[data-view="${a}"]`);
      if (bt) bt.click(); else if (window.showView) window.showView(a);
      await new Promise(x => setTimeout(x, 90));
      const v = document.getElementById('view-' + a);
      if (!v) continue;
      /* offsetWidth/Height e NÃO getBoundingClientRect(): o rect inclui
         transformações, e o #app carrega uma mola de scroll que anima
         sozinha (matrix(1.00221...) num quadro, matrix(0.99997...) no
         seguinte). Medindo o rect, toda comparação pega a animação e
         acusa o CSS por uma diferença de 1%. A caixa de layout ignora
         transform, que é exatamente o que se quer comparar aqui. */
      r[a] = v.offsetWidth + 'x' + v.offsetHeight + '/' + v.querySelectorAll('*').length;
    }
    return r;
  }, AREAS);

  /* Medir uma vez com a folha e uma vez sem NÃO prova nada: entre as duas
     passam segundos em que o app continua trabalhando (o painel recalcula,
     o gráfico desenha), e a diferença que aparece é do TEMPO, não do CSS.
     Foi exatamente esse o falso positivo da primeira versão deste teste.
     Aqui a ordem é ligada → desligada → ligada. Só conta como vazamento o
     que difere na rodada sem a folha E volta ao valor original quando ela
     é religada. Se as duas medições com a folha já discordarem entre si,
     o ruído é maior que o sinal e o teste diz isso em vez de acusar. */
  const achou = await p.evaluate(() => {
    let n = 0;
    for (const f of document.styleSheets) if ((f.href || '').includes('mw-ds.css')) n++;
    return n;
  });
  const liga = ligada => p.evaluate(v => {
    for (const f of document.styleSheets) if ((f.href || '').includes('mw-ds.css')) f.disabled = !v;
  }, ligada);

  if (!achou) {
    console.log('  a folha do sistema NÃO está ligada no app ainda — nada a comparar.');
  } else {
    const ligada1 = await medeTudo();
    await liga(false); await p.waitForTimeout(500);
    const desligada = await medeTudo();
    await liga(true);  await p.waitForTimeout(500);
    const ligada2 = await medeTudo();

    const ruido = Object.keys(ligada1).filter(a => ligada1[a] !== ligada2[a]);
    /* mudou de verdade: difere sem a folha E volta ao original com ela */
    const mudaram = Object.keys(ligada1)
      .filter(a => ligada1[a] !== desligada[a] && ligada1[a] === ligada2[a]);

    console.log('  áreas medidas:', Object.keys(ligada1).length);
    console.log('  ruído entre duas medições com a folha ligada:', ruido.length,
                ruido.length ? '(o app ainda estava trabalhando)' : '');
    console.log('  mudaram ao desligar a folha:', mudaram.length ? mudaram.join(', ') : 'nenhuma');

    const vazam = mudaram.filter(a => !migradas.includes(a));
    const inertes = migradas.filter(a => !mudaram.includes(a) && !ruido.includes(a));
    if (vazam.length) falha('a folha do DS pinta área NÃO migrada', vazam.map(a => a + ': ' + ligada1[a] + ' → ' + desligada[a]));
    if (inertes.length) falha('área migrada não muda ao desligar a folha — o DS não é quem a pinta', inertes);
    if (!vazam.length && !inertes.length)
      console.log('  ' + migradas.length + ' migrada(s) pintada(s) pelo sistema, ' +
                  (Object.keys(ligada1).length - migradas.length) + ' legada(s) intocada(s)');
  }

  if (erros.length) falha('erros de JS no app', erros);
  await b2.close();
}

console.log('\nACHADOS:', ruins);
process.exit(ruins ? 1 : 0);
