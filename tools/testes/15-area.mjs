/* Teste de ÁREA, genérico — o "antes e depois" de cada migração.
 *
 * O teste 11 já cobre o ciclo do dado (criar, recarregar, editar,
 * excluir) nas cinco áreas de coleção. Este cobre o que falta e é o que
 * a migração pode quebrar: a estrutura da tela.
 *
 * Vale para qualquer área de coleção; a próxima migração reusa sem
 * escrever nada.
 *
 * Uso: node tools/testes/15-area.mjs institutions
 */
import { abre, vaiPara, esperaParar } from './ajuda.mjs';

const area = process.argv[2] || 'institutions';
const CAMPO_NOME = { notes: 'title' }[area] || 'name';

const { b, p, erros } = await abre({
  subjects:[], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus Souza', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'', course:'', area:'', semester:1 }, theme:'dark'
}, { viewport: { width: 1280, height: 900 } });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(46), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

console.log('=== área "' + area + '" ===');
await vaiPara(p, area);
await p.waitForTimeout(600);
await esperaParar(p, '#view-' + area);

/* Projetos não mostra uma lista por padrão: mostra um quadro Kanban, e
   deixa `#projectsList` no DOM porém com display:none. Medir a lista
   escondida dava um item de 0x0 e o teste acusava "os botões sumiram"
   quando o que sumira era a lista inteira — de propósito, e com um
   botão "Lista" ao lado para trazê-la de volta.

   Uma área pode escolher como apresenta seus itens. O que o teste tem
   de garantir é que a apresentação em lista, quando existe, funciona;
   então ele pede a lista antes de medir, em vez de supor que ela já
   está na tela. */
const temModos = await p.evaluate(a => {
  const bt = document.querySelector('#view-' + a + ' button[data-modo="lista"]');
  if (!bt) return false;
  bt.click();
  return true;
}, area);
if (temModos) {
  await p.waitForTimeout(500);
  await esperaParar(p, '#view-' + area);
  console.log('  (esta área tem quadro e lista; o teste mede a lista)');
}

/* ---- 1. estado vazio diz o que fazer ------------------------------------ */
const vazio = await p.evaluate(a => {
  const l = document.getElementById(a + 'List');
  const t = (l.textContent || '').trim();
  return { temTexto: t.length > 20, texto: t.slice(0, 54) };
}, area);
ok('o estado vazio explica o que falta', vazio.temTexto, vazio);

/* ---- 2. o formulário abre com foco no primeiro campo -------------------- */
await p.evaluate(a => document.querySelector('#view-' + a + ' [data-add]').click(), area);
await p.waitForTimeout(600);
const form = await p.evaluate(a => {
  const f = document.querySelector(`[data-workspace-form="${a}"]`);
  if (!f) return { existe: false };
  const campos = [...f.querySelectorAll('input,select,textarea')].map(e => ({
    id: e.id,
    rotulo: !!document.querySelector(`label[for="${e.id}"]`),
    alto: Math.round(e.getBoundingClientRect().height),
    fonte: parseFloat(getComputedStyle(e).fontSize)
  }));
  return { existe: true, aberto: f.classList.contains('is-open'),
           foco: document.activeElement.id, campos,
           botoes: [...f.querySelectorAll('button')].map(x => x.textContent.trim()) };
}, area);
ok('o formulário abre', form.existe && form.aberto, form);
ok('com o foco no primeiro campo', (form.foco || '').startsWith('ws-' + area), form.foco);
ok('todo campo tem rótulo', form.campos.every(c => c.rotulo), form.campos.filter(c => !c.rotulo));
ok('todo campo tem altura de toque (>=36px)', form.campos.every(c => c.alto >= 36), form.campos.filter(c => c.alto < 36));

/* ---- 3. criar pela interface, e ver na lista ---------------------------- */
await p.evaluate(([a, campo]) => {
  const f = document.querySelector(`[data-workspace-form="${a}"]`);
  const e = f.querySelector('#ws-' + a + '-' + campo);
  e.value = 'Item de teste da área';
  e.dispatchEvent(new Event('input', { bubbles: true }));
  f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}, [area, CAMPO_NOME]);
await p.waitForTimeout(900);
const naLista = await p.evaluate(a => ({
  itens: document.querySelectorAll('#' + a + 'List > [data-mw-linha], #' + a + 'List > .list-item, #' + a + 'List > .ds-item').length,
  temTexto: (document.getElementById(a + 'List').textContent || '').includes('Item de teste da área'),
  formFechou: !document.querySelector(`[data-workspace-form="${a}"].is-open`)
}), area);
ok('criar pela interface põe o item na lista', naLista.itens === 1 && naLista.temTexto, naLista);
ok('e o formulário fecha depois de salvar', naLista.formFechou);

/* ---- 4. Editar e Excluir estão ao alcance ------------------------------- */
const acoes = await p.evaluate(a => {
  const item = document.querySelector('#' + a + 'List > [data-mw-linha], #' + a + 'List > .list-item, #' + a + 'List > .ds-item');
  if (!item) return { achou: false };
  const bts = [...item.querySelectorAll('button')].map(x => ({
    txt: x.textContent.trim(),
    larg: Math.round(x.getBoundingClientRect().width),
    alt: Math.round(x.getBoundingClientRect().height),
    dentro: x.getBoundingClientRect().right <= item.getBoundingClientRect().right + 1
  }));
  return { achou: true, bts };
}, area);
ok('os botões do item existem e cabem dentro dele',
   acoes.achou && acoes.bts.length >= 1 && acoes.bts.every(x => x.dentro && x.alt >= 24), acoes);

/* ---- 4b. com vários itens, o agrupamento da área continua de pé --------
   Três áreas reordenam e agrupam a própria lista depois que o render
   termina: a agenda de Atividades ("Atrasadas / Hoje / Esta semana"), a
   ordem por semestre de Disciplinas, a ordem por prazo de Projetos. As
   três achavam as linhas por `.list-item`.

   Esse nome muda quando a área migra para o Design System — e aí cada um
   desses blocos acha ZERO itens e desiste em silêncio: sem erro no
   console, sem pixel fora do lugar, só uma lista que voltou à ordem de
   cadastro e perdeu os títulos. Com um item só na lista nada disso
   aparece, porque todos eles desistem cedo quando há menos de dois.

   Por isso este trecho semeia seis. */
const AGRUPA = {
  activities: '.mw-agenda-titulo',
  subjects:   '.mw-ordem-titulo',
  projects:   null,   /* ordena, mas não põe título: o quadro já agrupa */
  notes:      null,
  institutions: null
};
const varios = await p.evaluate(async ([a, campo]) => {
  const hoje = new Date();
  const dia = n => { const d = new Date(hoje); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
  const datas = [-9, -2, 0, 1, 5, 30];
  window.data[a] = datas.map((d, i) => {
    const o = {};
    o[campo] = 'Item ' + (i + 1);
    o.description = 'linha de teste';
    o.date = dia(d);
    o.semester = (i % 3) + 1;
    o.status = ['Em andamento','Concluído','Em revisão'][i % 3];
    return o;
  });
  window.save();
  await new Promise(r => setTimeout(r, 700));
  const lista = document.getElementById(a + 'List');
  return {
    linhas: lista.querySelectorAll('[data-mw-linha]').length,
    ordem: [...lista.querySelectorAll('[data-mw-linha]')].map(e => (e.textContent||'').trim().slice(0,7))
  };
}, [area, CAMPO_NOME]);
ok('as seis linhas aparecem', varios.linhas === 6, varios);

if (AGRUPA[area]) {
  const g = await p.evaluate(([a, sel]) => {
    const lista = document.getElementById(a + 'List');
    const t = [...lista.querySelectorAll(sel)];
    return { titulos: t.length, rotulos: t.map(x => (x.textContent||'').trim().slice(0,18)) };
  }, [area, AGRUPA[area]]);
  ok('o agrupamento da área continua de pé', g.titulos >= 1, g);
} else {
  /* Sem títulos, o que se pode afirmar é que a área REORDENOU: a ordem
     na tela não é a ordem de cadastro. */
  const reordenou = varios.ordem.join('|') !== ['Item 1','Item 2','Item 3','Item 4','Item 5','Item 6'].map(x=>x.slice(0,7)).join('|');
  console.log('  ' + (area === 'projects' ? 'ordena por prazo (sem títulos)' : 'não agrupa').padEnd(46),
              reordenou ? 'reordenou' : 'ordem de cadastro');
}

/* volta ao estado de um item só, para o resto do teste medir o mesmo de antes */
await p.evaluate(a => { window.data[a] = window.data[a].slice(0,1); window.save(); }, area);
await p.waitForTimeout(500);

/* ---- 5. nada vaza, em três larguras e dois temas ------------------------ */
for (const [rot, larg] of [['desktop', 1280], ['tablet', 834], ['celular', 390]]) {
  for (const tema of ['escuro', 'claro']) {
    await p.setViewportSize({ width: larg, height: 900 });
    await p.evaluate(t => {
      document.body.classList.toggle('light', t === 'claro');
      document.documentElement.setAttribute('data-ds-tema', t);
    }, tema);
    await p.waitForTimeout(420);
    await esperaParar(p, '#view-' + area);
    const m = await p.evaluate(a => {
      const v = document.getElementById('view-' + a);
      const rola = e => { let n = e.parentElement;
        while (n && n !== document.body) { const o = getComputedStyle(n).overflowX;
          if (o === 'auto' || o === 'scroll') return true; n = n.parentElement; } return false; };
      const fora = [...v.querySelectorAll('*')].filter(e => {
        /* Dentro de um <svg>, quem recorta é o viewport do próprio SVG, e
           isso não aparece como overflow-x em ancestral nenhum. Um <rect>
           de área de toque num gráfico pode ter a caixa passando da tela
           sem que um pixel seja desenhado lá fora. Quem pode vazar de
           verdade é o <svg>; os filhos dele são medidos por ele. */
        if (e.ownerSVGElement) return false;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return !rola(e) && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => (e.className || e.tagName).toString().slice(0, 30));
      /* texto cortado sem reticências some sem avisar */
      const espremidos = [...v.querySelectorAll('*')].filter(e => {
        if (e.children.length) return false;
        /* Só conta se HOUVER texto. A barra de progresso é um <i> vazio
           dentro de uma caixa com overflow:hidden, e durante a transição
           de largura o scrollWidth passa do clientWidth — o que faz esta
           checagem acusar "texto cortado" num elemento que não tem texto
           nenhum. O defeito que ela existe para pegar é texto que some
           sem reticências; sem texto, não há o que sumir. */
        if (!(e.textContent || '').trim()) return false;
        const cs = getComputedStyle(e);
        return e.scrollWidth > e.clientWidth + 2 && cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis';
      }).length;
      return { fora, espremidos, corpoRola: document.documentElement.scrollWidth > innerWidth + 1 };
    }, area);
    ok('sem vazamento · ' + rot + ' ' + tema,
       !m.fora.length && !m.espremidos && !m.corpoRola, m);
  }
}
await p.evaluate(() => {
  document.body.classList.remove('light');
  document.documentElement.setAttribute('data-ds-tema', 'escuro');
});

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
