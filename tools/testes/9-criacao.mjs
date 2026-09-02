/* Criação: todos os caminhos de "criar" levam ao MESMO formulário.

   Existe por um defeito real. O app tinha dois formulários de nova
   disciplina: o de cada área, com seis campos, e um modal legado de
   três. O "+ Adicionar" abria o completo, mas o atalho "Adicionar" do
   painel e o "+" da barra de baixo no celular chamavam
   getElementById('quickAdd').click() — e o #quickAdd abria o legado.
   No telefone, o caminho principal de criar era o pior dos dois, e
   nada na tela dizia isso.

   Uso: node tools/testes/9-criacao.mjs */
import { abre, vaiPara } from './ajuda.mjs';

const semente = { subjects:[], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus', email:'', photo:'', username:'', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'', course:'', area:'', semester:1 }, theme:'dark' };

const CAMPOS_ESPERADOS = ['Nome da disciplina','Objetivo ou descrição','Progresso (%)',
                          'Código da disciplina','Instituição','Semestre'];

async function estado(p){
  return p.evaluate(() => {
    const f = document.querySelector('.workspace-form.is-open');
    return {
      area: [...document.querySelectorAll('.view.active')].map(v => v.id)[0] || null,
      formulario: f ? f.getAttribute('data-workspace-form') : null,
      campos: f ? [...f.querySelectorAll('label')].map(l => l.textContent.trim()) : [],
      foco: document.activeElement.id,
      /* o modal legado não pode voltar por nenhum caminho */
      modalLegado: !!document.getElementById('modal')
    };
  });
}
const fecha = p => p.evaluate(() => {
  document.querySelectorAll('.workspace-form.is-open').forEach(f => f.classList.remove('is-open'));
});

let ruins = 0;
function confere(rotulo, r){
  const ok = r.formulario === 'subjects'
          && r.area === 'view-subjects'
          && !r.modalLegado
          && CAMPOS_ESPERADOS.every(c => r.campos.includes(c));
  console.log('  ' + rotulo.padEnd(26), ok ? 'ok' : 'FALHOU ' + JSON.stringify(r));
  if (!ok) ruins++;
}

/* --- desktop ------------------------------------------------------------- */
{
  const { b, p, erros } = await abre(semente, { viewport: { width: 1440, height: 950 } });
  console.log('DESKTOP 1440px');

  await vaiPara(p, 'subjects'); await p.waitForTimeout(450);
  await p.evaluate(() => document.querySelector('#view-subjects .add-btn').click());
  await p.waitForTimeout(600);
  confere('"+ Adicionar" da área', await estado(p));
  await fecha(p);

  await vaiPara(p, 'home'); await p.waitForTimeout(450);
  await p.evaluate(() => document.querySelector('#mwAtalhos [data-acao="adicionar"]').click());
  await p.waitForTimeout(700);
  confere('atalho "Adicionar"', await estado(p));
  await fecha(p);

  await vaiPara(p, 'home'); await p.waitForTimeout(400);
  await p.evaluate(() => document.getElementById('quickAdd').click());
  await p.waitForTimeout(700);
  confere('"+" do topo', await estado(p));

  if (erros.length) { console.log('  ERROS:', erros); ruins++; }
  await b.close();
}

/* --- celular: o "+" da barra de baixo ------------------------------------ */
{
  const { b, p, erros } = await abre(semente, { viewport: { width: 390, height: 844 } });
  console.log('\nMOBILE 390px');
  await vaiPara(p, 'home'); await p.waitForTimeout(700);

  const achou = await p.evaluate(() => {
    const mais = document.querySelector('#mwBottomNav [data-mw-mais], #mwBottomNav .mw-nav-mais')
      || [...document.querySelectorAll('#mwBottomNav button')]
           .find(b => /^[+＋]$/.test((b.textContent || '').trim())
                   || /adicionar|criar/i.test(b.getAttribute('aria-label') || ''));
    if (!mais) return false;
    mais.click();
    return true;
  });
  if (!achou) { console.log('  "+" da barra de baixo    não encontrado — o teste precisa ser atualizado'); ruins++; }
  else { await p.waitForTimeout(800); confere('"+" da barra de baixo', await estado(p)); }

  if (erros.length) { console.log('  ERROS:', erros); ruins++; }
  await b.close();
}

console.log('\nACHADOS:', ruins);
process.exit(ruins ? 1 : 0);
