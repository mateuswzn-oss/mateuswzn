/* Dados: o ciclo completo, campo a campo.

   O app é um lugar para guardar coisas. O teste 9 confere que o
   formulário ABRE; este confere que o que foi digitado nele chega ao
   dado, sobrevive a um recarregamento, pode ser corrigido, e que
   editar e excluir agem no item CERTO.

   Esse último ponto não é paranoia: a tela reordena as listas por prazo
   e por semestre, mas os botões Editar e Excluir guardam o índice da
   posição ORIGINAL no array. Se algum dia a ordenação passar a mexer no
   array, os botões começam a agir no item errado sem avisar — e é isso
   que a última parte deste teste vigia.

   Uso: node tools/testes/11-dados.mjs */
import { abre, vaiPara } from './ajuda.mjs';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

/* Um valor por campo, todos distintos, para nenhum poder ser confundido
   com outro se algo trocar as bolas. */
const CASOS = {
  institutions: { name:'Universidade Federal do Acre', short:'UFAC', kind:'Universidade',
                  course:'Engenharia Florestal', city:'Rio Branco', site:'https://ufac.br' },
  subjects:     { name:'Termodinâmica', description:'Primeira e segunda lei', progress:'73',
                  code:'FIS-204', institution:'Universidade Federal do Acre', semester:'4' },
  projects:     { name:'Monografia sobre castanhais', description:'Levantamento de campo',
                  tag:'Pesquisa', status:'Em revisão', priority:'Alta', deadline: dia(21),
                  subject:'Termodinâmica', members:'você, Ana' },
  activities:   { name:'Entregar o relatório de campo', description:'Capítulos 1 a 3',
                  date: dia(5), priority:'Alta', subject:'Termodinâmica' },
  notes:        { title:'Referências do capítulo 2', body:'Odum, 1971; Margalef, 1968.',
                  category:'Referência' }
};

const semente = { subjects:[], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'', course:'', area:'', semester:1 }, theme:'dark' };

const { b, p, erros } = await abre(semente, { viewport: { width: 1440, height: 950 } });
let ruins = 0;
const falha = (m, x) => { console.log('    FALHOU ' + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); ruins++; };

/* Preenche só os campos que o formulário realmente tem: a lista de
   campos vive no app, não aqui, e inventar um campo daria falso
   negativo quando o app mudar. */
async function preenche(tipo, valores){
  return p.evaluate(([tipo, valores]) => {
    const form = document.querySelector(`[data-workspace-form="${tipo}"]`);
    if (!form) return { erro: 'formulário ausente' };
    const usados = [];
    Object.entries(valores).forEach(([campo, valor]) => {
      const el = form.querySelector('#ws-' + tipo + '-' + campo);
      if (!el) return;
      el.value = valor;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      usados.push(campo);
    });
    return { usados };
  }, [tipo, valores]);
}
const envia = tipo => p.evaluate(t => {
  const form = document.querySelector(`[data-workspace-form="${t}"]`);
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}, tipo);

const lista = tipo => p.evaluate(t => JSON.parse(JSON.stringify(window.data[t] || [])), tipo);

/* ---------- 1. criar, com todos os campos ---------------------------------- */
console.log('CRIAR');
for (const [tipo, valores] of Object.entries(CASOS)) {
  await vaiPara(p, tipo); await p.waitForTimeout(400);
  await p.evaluate(t => document.querySelector(`#view-${t} [data-add]`).click(), tipo);
  await p.waitForTimeout(500);
  const { usados, erro } = await preenche(tipo, valores);
  if (erro) { falha(tipo + ': ' + erro); continue; }
  await envia(tipo);
  await p.waitForTimeout(700);

  const itens = await lista(tipo);
  if (itens.length !== 1) { falha(tipo + ': deveria haver 1 item', itens.length); continue; }
  const perdidos = usados.filter(c => String(itens[0][c] ?? '') !== String(valores[c]));
  console.log('  ' + tipo.padEnd(13), usados.length + ' campos preenchidos',
              perdidos.length ? '' : '· todos chegaram ao dado');
  if (perdidos.length) falha(tipo + ': campo não chegou', perdidos.map(c => c + ': esperado ' + valores[c] + ', veio ' + itens[0][c]));
}

/* ---------- 2. sobreviver a um recarregamento ------------------------------ */
console.log('\nRECARREGAR');
const antes = await p.evaluate(() => JSON.parse(JSON.stringify(window.data)));
await p.reload();
await p.waitForTimeout(3000);
await p.evaluate(() => {
  document.getElementById('mwBootLoader')?.remove();
  const l = document.getElementById('loginScreen'); if (l) l.style.display = 'none';
  const a = document.getElementById('app'); if (a) { a.style.display = ''; a.hidden = false; a.classList.remove('hidden'); }
});
await p.waitForTimeout(400);
for (const tipo of Object.keys(CASOS)) {
  const agora = await lista(tipo);
  const igual = JSON.stringify(agora) === JSON.stringify(antes[tipo]);
  console.log('  ' + tipo.padEnd(13), igual ? 'intacto' : 'MUDOU');
  if (!igual) falha(tipo + ': o dado mudou ao recarregar', { antes: antes[tipo], depois: agora });
}

/* ---------- 3. editar corrige o item, não cria outro ----------------------- */
console.log('\nEDITAR');
for (const tipo of Object.keys(CASOS)) {
  await vaiPara(p, tipo); await p.waitForTimeout(400);
  const temEditar = await p.evaluate(t => !!document.querySelector(`#${t}List [data-edit]`), tipo);
  if (!temEditar) { console.log('  ' + tipo.padEnd(13), 'sem botão Editar (esta área não oferece)'); continue; }
  await p.evaluate(t => document.querySelector(`#${t}List [data-edit]`).click(), tipo);
  await p.waitForTimeout(600);

  const campoNome = CASOS[tipo].name !== undefined ? 'name' : 'title';
  const novo = 'CORRIGIDO ' + tipo;
  await preenche(tipo, { [campoNome]: novo });
  await envia(tipo);
  await p.waitForTimeout(700);

  const itens = await lista(tipo);
  if (itens.length !== 1) { falha(tipo + ': editar criou um item novo em vez de corrigir', itens.length); continue; }
  if (itens[0][campoNome] !== novo) { falha(tipo + ': a correção não pegou', itens[0][campoNome]); continue; }
  /* o resto do item não pode ter sido zerado pela edição */
  const outros = Object.keys(CASOS[tipo]).filter(c => c !== campoNome && CASOS[tipo][c]);
  const zerados = outros.filter(c => itens[0][c] === '' || itens[0][c] === undefined);
  console.log('  ' + tipo.padEnd(13), 'corrigido, ' + (outros.length - zerados.length) + '/' + outros.length + ' campos preservados');
  if (zerados.length) falha(tipo + ': a edição apagou campos', zerados);
}

/* ---------- 4. excluir age no item certo, com a lista reordenada ----------- */
console.log('\nEXCLUIR o item certo (lista fora da ordem de cadastro)');
await p.evaluate(d => {
  /* de propósito fora de ordem: a tela vai reordenar por prazo, e o
     índice do botão tem de continuar apontando para o array original */
  window.data.activities = [
    { name:'Terceira cadastrada, vence hoje',   description:'', date:d.hoje,   priority:'Alta',  subject:'' },
    { name:'Primeira cadastrada, vence depois', description:'', date:d.longe,  priority:'Baixa', subject:'' },
    { name:'Segunda cadastrada, atrasada',      description:'', date:d.ontem,  priority:'Alta',  subject:'' }
  ];
  window.save();
}, { hoje: dia(0), longe: dia(40), ontem: dia(-1) });
await vaiPara(p, 'activities'); await p.waitForTimeout(900);

const naTela = await p.evaluate(() => [...document.querySelectorAll('#activitiesList > [data-mw-linha]')]
  .filter(e => !e.hidden)
  .map(e => ({ nome: e.querySelector('strong').textContent,
               indice: Number(e.querySelector('[data-index]').getAttribute('data-index')) })));
console.log('  ordem na tela:', naTela.map(x => x.nome.slice(0,28) + ' [' + x.indice + ']').join(' | '));

const primeiro = naTela[0];
const bateAntes = await p.evaluate(l => l.every(x => window.data.activities[x.indice].name === x.nome), naTela);
if (!bateAntes) falha('o índice na tela não aponta para o item certo do array');

await p.evaluate(() => {
  const b = [...document.querySelectorAll('#activitiesList > [data-mw-linha]')].filter(e => !e.hidden)[0].querySelector('[data-delete]');
  b.click();
});
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('.mw-confirm-yes')?.click());
await p.waitForTimeout(800);

const sobraram = (await lista('activities')).map(a => a.name);
console.log('  excluí o primeiro da tela:', primeiro.nome);
console.log('  sobraram:', JSON.stringify(sobraram));
if (sobraram.includes(primeiro.nome)) falha('excluiu o item errado — o que eu mandei apagar continua lá');
if (sobraram.length !== 2) falha('deveriam sobrar 2', sobraram.length);

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
