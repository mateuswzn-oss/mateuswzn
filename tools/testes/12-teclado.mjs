/* Teclado: dá para operar o app sem mouse.

   Era um pedido explícito desde o começo ("acessibilidade, foco,
   teclado") e estava só meio coberto: o teste 3 media se o anel de foco
   APARECE, não se a pessoa consegue chegar onde precisa e sair de onde
   entrou.

   A sonda que originou este teste achou quatro defeitos, todos
   corrigidos no bloco mw-teclado:
     1. o diálogo de exclusão abria e o foco NÃO ia para dentro dele; o
        Tab continuava passeando pela página atrás, e o Escape não
        fechava — um diálogo aria-modal="true" impossível de operar;
     2. Escape não fechava o formulário de criação;
     3. não havia como pular a barra lateral: 18 Tabs até o conteúdo;
     4. o foco não voltava para onde estava depois de fechar o diálogo.

   Uso: node tools/testes/12-teclado.mjs */
import { abre, vaiPara, esperaParar } from './ajuda.mjs';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

const { b, p, erros } = await abre({
  subjects:[{ name:'Cálculo I', description:'Limites', progress:40 }],
  projects:[{ name:'TCC', description:'App', status:'Em andamento', priority:'Alta', deadline: dia(3) }],
  activities:[{ name:'Lista 4', description:'', date: dia(1), priority:'Alta', subject:'Cálculo I' }],
  notes:[{ title:'Ideia', body:'x', category:'Estudos' }], institutions:[],
  profile:{ name:'Mateus', email:'m@x.com', photo:'', username:'m', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'UFPA', course:'Eng', area:'', semester:5 }, theme:'dark'
}, { viewport: { width: 1440, height: 950 } });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(44), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

/* ---- 1. o primeiro Tab oferece o atalho, e ele aparece de verdade ------- */
await p.evaluate(() => { if (document.activeElement !== document.body) document.activeElement.blur(); });
await p.keyboard.press('Tab');
/* O atalho entra deslizando (160ms). Um tempo fixo mede o meio do
   caminho quando a máquina está ocupada — foi assim que este teste
   falhou dentro da suíte e passou sozinho, reportando topo:-16. */
await p.waitForTimeout(200);
await esperaParar(p, 'body');
const atalho = await p.evaluate(() => {
  const e = document.querySelector('.mw-pular');
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { focado: document.activeElement === e, topo: Math.round(r.top),
           naTela: r.top >= 0 && r.bottom <= innerHeight && r.width > 40 };
});
ok('primeiro Tab é "Pular para o conteúdo"', !!atalho && atalho.focado, atalho);
ok('e ele entra na tela ao receber foco', !!atalho && atalho.naTela, atalho);

await p.keyboard.press('Enter');
await p.waitForTimeout(350);
const destino = await p.evaluate(() => document.activeElement.tagName + '.' + String(document.activeElement.className || '').split(' ')[0]);
ok('Enter leva o foco ao conteúdo', /MAIN|DIV\.main/.test(destino), destino);

/* ---- 2. Escape fecha o formulário de criação e devolve o foco ----------- */
await vaiPara(p, 'subjects'); await p.waitForTimeout(450);
await p.evaluate(() => document.querySelector('#view-subjects .add-btn').click());
await p.waitForTimeout(600);
ok('o formulário abre com o foco no primeiro campo',
   await p.evaluate(() => document.activeElement.id === 'ws-subjects-name'));
await p.keyboard.press('Escape');
await p.waitForTimeout(400);
ok('Escape fecha o formulário',
   await p.evaluate(() => !document.querySelector('.workspace-form.is-open')));
ok('e o foco volta para o "+ Adicionar"',
   await p.evaluate(() => document.activeElement.classList.contains('add-btn')));

/* ---- 3. Enter envia o formulário --------------------------------------- */
await p.evaluate(() => {
  const f = document.querySelector('[data-workspace-form="subjects"]');
  f.classList.add('is-open');
  const c = f.querySelector('#ws-subjects-name');
  c.value = 'Feita pelo teclado'; c.focus();
});
await p.keyboard.press('Enter');
await p.waitForTimeout(700);
ok('Enter no campo envia o formulário',
   await p.evaluate(() => window.data.subjects.some(s => s.name === 'Feita pelo teclado')));

/* ---- 4. o diálogo modal se comporta como modal -------------------------- */
await p.evaluate(() => {
  const bt = document.querySelector('#subjectsList [data-delete]');
  bt.id = 'mwTesteAbriuDialogo';
  bt.focus(); bt.click();
});
await p.waitForTimeout(700);
ok('o diálogo recebe o foco',
   await p.evaluate(() => {
     const d = document.querySelector('.mw-confirm-card');
     return !!d && d.contains(document.activeElement);
   }));

/* o Tab tem de circular DENTRO do diálogo, e não vazar para a página */
const volta = [];
for (let i = 0; i < 5; i++) {
  await p.keyboard.press('Tab');
  volta.push(await p.evaluate(() => {
    const d = document.querySelector('.mw-confirm-card');
    return d && d.contains(document.activeElement);
  }));
}
ok('o Tab não escapa do diálogo', volta.every(Boolean), volta);

await p.keyboard.press('Escape');
await p.waitForTimeout(600);
ok('Escape fecha o diálogo',
   await p.evaluate(() => !document.querySelector('.mw-confirm-backdrop')));
ok('e o foco volta para o botão que o abriu',
   await p.evaluate(() => document.activeElement.id === 'mwTesteAbriuDialogo'),
   await p.evaluate(() => document.activeElement.id || document.activeElement.tagName));

/* ---- 5. a navegação lateral responde ao Enter --------------------------- */
await p.evaluate(() => document.querySelector('#nav button[data-view="projects"]').focus());
await p.keyboard.press('Enter');
await p.waitForTimeout(500);
ok('Enter na navegação troca de área',
   await p.evaluate(() => [...document.querySelectorAll('.view.active')].map(v => v.id)[0] === 'view-projects'));

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
