/* iPhone: o TAMANHO real, não o motor.

   393x695 não é um número escolhido: é o viewport que o próprio app
   reportou num iPhone com iOS 18.7 e Safari 27, pelo painel de
   Diagnóstico. Note que a altura útil é 695, não 844 — a barra de
   endereço do Safari come 149px, e é exatamente aí que conteúdo some
   atrás da barra de baixo. Este teste roda os dois tamanhos lado a lado
   para deixar essa diferença visível.

   O que ele NÃO valida: o motor. Isto é Chromium desenhando num
   tamanho de iPhone. WebKit não é instalável nesta máquina.

   Uso: node tools/testes/6-iphone-tamanho.mjs */
import { abre, AREAS, pastaSaida } from './ajuda.mjs';
import path from 'path';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const agora = Date.now();

const semente = {
  subjects: Array.from({ length:8 }, (_, i) => ({ name:'Disciplina ' + (i+1), description:'Descrição', progress: i*12, semester:(i%3)+1 })),
  projects: Array.from({ length:6 }, (_, i) => ({ name:'Projeto ' + (i+1), description:'Resumo do projeto',
    status:['Planejamento','Em andamento','Em revisão','Concluído','Arquivado'][i%5], priority:'Alta', deadline: dia(i-2) })),
  activities: Array.from({ length:12 }, (_, i) => ({ name:'Atividade ' + (i+1), description:'Detalhes', date: dia(i-4), priority:'Alta', subject:'Disciplina 1' })),
  notes: [{ title:'Nota longa', body:'Texto '.repeat(80), category:'Estudos' }],
  institutions: [{ name:'UFPA', short:'UFPA', kind:'Universidade', course:'Eng', city:'Belém', site:'' }],
  focus: { config:{ foco:25, pausa:5, longa:15 }, atual:null,
    sessoes: Array.from({ length:20 }, (_, i) => ({ id:'f'+i, tipo:'foco', subject:'Disciplina 1', minutos:25, fim: agora - i*86400e3, completa:true })) },
  profile: { name:'Mateus Souza', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college: { institution:'UFPA', course:'Engenharia', area:'', semester:2 }, theme:'dark'
};

let ruins = 0;

for (const [rot, vp] of [['iPhone real 393x695', { width:393, height:695 }],
                         ['iPhone nominal 390x844', { width:390, height:844 }]]) {
  console.log('\n===== ' + rot + ' =====');
  const { b, p, erros } = await abre(semente, { viewport: vp });
  for (const a of AREAS) {
    await p.evaluate(n => { const bt = document.querySelector(`#nav button[data-view="${n}"]`); if (bt) bt.click(); else window.showView(n); }, a);
    await p.waitForTimeout(380);
    const r = await p.evaluate(nome => {
      const v = document.getElementById('view-' + nome);
      if (!v) return { scrollH:false, fora:0, alturaNav:0, tapados:0 };
      const fora = [...v.querySelectorAll('*')].filter(e => {
        const b = e.getBoundingClientRect();
        if (!b.width && !b.height) return false;
        let pai = e.parentElement, rol = false;
        while (pai && pai !== document.body) { if (/auto|scroll/.test(getComputedStyle(pai).overflowX)) { rol = true; break; } pai = pai.parentElement; }
        return !rol && (b.right > window.innerWidth + 1 || b.left < -1);
      });
      /* O que fica ESCONDIDO atrás da barra de baixo. Num viewport curto
         isto é o defeito mais provável, e o mais fácil de não ver. */
      const nav = document.getElementById('mwBottomNav');
      const alturaNav = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
      const tapados = [...v.querySelectorAll('button,a[href],select,input')].filter(e => {
        const b = e.getBoundingClientRect();
        return b.height > 1 && b.bottom > window.innerHeight - alturaNav && b.top < window.innerHeight;
      }).length;
      return { scrollH: document.documentElement.scrollWidth > window.innerWidth + 1, fora: fora.length,
               foraQuem: fora.slice(0,2).map(e => (e.id || e.className || e.tagName).toString().slice(0,30)),
               alturaNav, tapados };
    }, a);
    const alerta = (r.scrollH || r.fora) ? '  <<<' : '';
    if (alerta) ruins++;
    console.log('  ' + a.padEnd(13), JSON.stringify(r) + alerta);
  }
  console.log('  ERROS:', erros.length ? erros : 'nenhum');
  if (erros.length) ruins++;
  if (vp.height === 695) await p.screenshot({ path: path.join(pastaSaida(), 'iphone-393x695.png') });
  await b.close();
}

console.log('\nACHADOS:', ruins);
process.exit(ruins ? 1 : 0);
