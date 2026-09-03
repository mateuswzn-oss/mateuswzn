/* Contraste, parte 1 de 2: coleta.

   Medir contraste pelo CSS não funciona neste app. As superfícies são
   gradiente sobre translucidez sobre gradiente; getComputedStyle devolve
   a declaração, não o que o olho vê. A única medida honesta é o pixel.

   Este arquivo tira as fotos e anota, de cada texto visível, a cor
   declarada, o tamanho, o peso e a caixa. Quem calcula a razão é o
   7-contraste-medir.py, que abre as fotos.

   Uso: node tools/testes/7-contraste-coleta.mjs [largura] [dark|light] */
import { abre, AREAS, vaiPara, pastaSaida, esperaParar, congelaDecoracao } from './ajuda.mjs';
import fs from 'fs';
import path from 'path';

const larg = Number(process.argv[2] || 1440);
const tema = process.argv[3] || 'dark';
const saida = pastaSaida();
const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

const { b, p, erros } = await abre({
  subjects:[{ name:'Cálculo I', description:'Limites', progress:62 }, { name:'Algoritmos', description:'Estruturas', progress:45 }, { name:'Física II', description:'Ondas', progress:23 }],
  projects:[{ name:'TCC', description:'Plataforma acadêmica', status:'Em andamento', priority:'Alta', tag:'Pesquisa' }],
  activities:[{ name:'Lista 4', description:'Cap. 1-3', date: dia(1), priority:'Alta' }, { name:'Prova', date: dia(4) }, { name:'Seminário', date: dia(10) }],
  notes:[{ title:'Ideias', body:'Anotar', category:'Estudos' }],
  institutions:[{ name:'Universidade Federal do Pará', short:'UFPA', kind:'Universidade', course:'Eng.', city:'Belém' }],
  profile:{ name:'Mateus Souza', email:'mateus@exemplo.com', photo:'', username:'mateus.wzn', bio:'Estudo e construo.', skills:['JS'], links:[], visibility:{}, public:true },
  college:{ institution:'UFPA', course:'Engenharia de Computação', area:'', semester:5 }, theme:'dark'
}, { viewport: { width: larg, height: larg < 500 ? 844 : 900 } });

if (tema === 'light') { await p.evaluate(() => document.body.classList.add('light')); await p.waitForTimeout(600); }
await p.waitForTimeout(1200);

/* Arquivos de verdade no IndexedDB, para a área de Arquivos ter o que
   medir — sem isso ela mostra só o estado vazio. */
await p.evaluate(async () => {
  const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
  await new Promise(ok => {
    const req = indexedDB.open('mwArquivos', 1);
    req.onupgradeneeded = () => { const d = req.result;
      if (!d.objectStoreNames.contains('arquivos')) d.createObjectStore('arquivos', { keyPath: 'id' }); };
    req.onsuccess = () => {
      const d = req.result, loja = d.transaction('arquivos', 'readwrite').objectStore('arquivos');
      loja.put({ id:'x1', nome:'aula-03-derivadas.pdf', tipo:'application/pdf', bytes:240000,
                 criadoEm: Date.now(), subject:'Cálculo I', blob: new Blob(['%PDF'.repeat(1000)], { type:'application/pdf' }) });
      loja.put({ id:'x2', nome:'quadro-da-aula.png', tipo:'image/png', bytes:70,
                 criadoEm: Date.now()-1000, subject:'', blob: new Blob([png], { type:'image/png' }) });
      loja.put({ id:'x3', nome:'material.zip', tipo:'application/zip', bytes:60000,
                 criadoEm: Date.now()-2000, subject:'Física II', blob: new Blob(['PK'.repeat(500)], { type:'application/zip' }) });
      loja.transaction.oncomplete = () => ok();
    };
    req.onerror = () => ok();
  });
});
await p.waitForTimeout(700);

const colhido = [];
for (const v of AREAS) {
  await vaiPara(p, v);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(340);
  /* Fotografar durante a animação de entrada dá cor de quadro
     intermediário — e um número de contraste inventado. */
  await esperaParar(p, '#view-' + v);
  const cands = await p.evaluate(nome => {
    const view = document.getElementById('view-' + nome);
    if (!view) return [];
    const out = [];
    view.querySelectorAll('p,span,small,label,li,td,b,strong,em,a,h1,h2,h3,h4,button').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (t.length < 3) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .5) return;
      /* Fora da tela não dá para fotografar; medir a foto de um pedaço
         que não foi renderizado dá número inventado. */
      if (r.width < 10 || r.height < 6 || r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) return;
      /* Um elemento com preenchimento PRÓPRIO (um botão, um chip) tem de
         ser medido contra o próprio preenchimento, não contra o que está
         atrás dele. Sobe até três níveis à procura de quem pinta. */
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
  }, v);
  if (!cands.length) continue;
  /* Dois instantes do ciclo do fundo animado, e não um. O gradiente de
     trás translada e escala; o vidro deixa passar; o pixel atrás do
     texto muda com ele. Uma foto só mede um momento e chama de verdade.
     Os dois extremos do ciclo cercam o pior caso — e, congelados, dão
     sempre o mesmo número. */
  for (const [rot, fase] of [['a', 0], ['b', 1]]) {
    await congelaDecoracao(p, fase);
    await p.waitForTimeout(180);
    const png = path.join(saida, `contraste-${larg}-${tema}-${v}-${rot}.png`);
    await p.screenshot({ path: png });
    colhido.push({ v, png, cands });
  }
}

/* ---- A MOLDURA ----------------------------------------------------------
   Até aqui a medida cobria só as áreas (`#view-*`). A lateral, o topo e a
   barra de baixo ficavam de fora — e foi ali que, no tema claro, sete
   textos estavam saindo brancos sobre branco (1,02:1 no rótulo da Nyc AI)
   sem nenhum teste reclamar. Vinte testes verdes não significam uma tela
   boa; um teste que não olha para um pedaço da tela é um teste que garante
   o pedaço errado. A moldura entra na conta como se fosse mais uma área. */
await vaiPara(p, AREAS[0]);
await p.waitForTimeout(340);
const daMoldura = await p.evaluate(() => {
  const out = [];
  for (const raiz of document.querySelectorAll('.sidebar, .topbar, #mwBottomNav')) {
    raiz.querySelectorAll('p,span,small,label,li,b,strong,em,a,h1,h2,h3,h4,button').forEach(e => {
      if (e.children.length) return;
      const t = (e.textContent || '').trim(); if (t.length < 3) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .5) return;
      if (r.width < 10 || r.height < 6 || r.top < 0 || r.bottom > window.innerHeight || r.left < 0 || r.right > window.innerWidth) return;
      let pintado = false, n = e;
      for (let i = 0; i < 3 && n; i++, n = n.parentElement) {
        const c = getComputedStyle(n);
        const a = (c.backgroundColor.match(/[\d.]+/g) || [0,0,0,1]);
        if (c.backgroundImage !== 'none' || (+(a[3] ?? 1)) > 0.5) { pintado = true; break; }
      }
      out.push({ t: t.slice(0,34), cor: cs.color, px: parseFloat(cs.fontSize), peso: +cs.fontWeight, pintado,
                 box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] });
    });
  }
  return out;
});
if (daMoldura.length) {
  for (const [rot, fase] of [['a', 0], ['b', 1]]) {
    await congelaDecoracao(p, fase);
    await p.waitForTimeout(180);
    const png = path.join(saida, `contraste-${larg}-${tema}-moldura-${rot}.png`);
    await p.screenshot({ path: png });
    colhido.push({ v: 'moldura', png, cands: daMoldura });
  }
}

fs.writeFileSync(path.join(saida, `contraste-${larg}-${tema}.json`), JSON.stringify({ larg, tema, erros, saida: colhido }));
console.log(`coletado ${larg}px ${tema}: ${colhido.length} áreas, ${colhido.reduce((a,s) => a + s.cands.length, 0)} textos | erros JS: ${erros.length ? erros.join(' | ') : 'nenhum'}`);
await b.close();
