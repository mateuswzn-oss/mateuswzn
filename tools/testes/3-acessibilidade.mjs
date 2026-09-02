/* Acessibilidade: nome acessível em todo controle, alvo de toque de pelo
   menos 24px, aria em elemento que aceita aria, campo com rótulo, e anel
   de foco visível ao percorrer o Tab.

   Uso: node tools/testes/3-acessibilidade.mjs */
import { abre, AREAS, vaiPara } from './ajuda.mjs';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const semente = {
  subjects: [{ name:'Cálculo I', description:'Limites', progress:40 }, { name:'Física II', description:'Ondas', progress:70 }],
  projects: [{ name:'TCC', description:'App', status:'Em andamento', priority:'Alta', deadline: dia(3) }],
  activities: [{ name:'Lista 4', description:'Cap 1', date: dia(1), priority:'Alta', subject:'Cálculo I' }],
  notes: [{ title:'Ideia', body:'Texto '.repeat(80), category:'Estudos' }],
  institutions: [{ name:'UFPA', short:'UFPA', kind:'Universidade', course:'Eng', city:'Belém', site:'' }],
  focus: { config:{ foco:25, pausa:5, longa:15 }, atual:null,
           sessoes:[{ id:'a', tipo:'foco', subject:'Cálculo I', minutos:25, fim: Date.now()-3600e3, completa:true }] },
  profile: { name:'Mateus', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college: { institution:'UFPA', course:'Eng', area:'', semester:5 }, theme:'dark'
};

const { b, p, erros } = await abre(semente, { viewport: { width: 1440, height: 950 } });
const problemas = [];

for (const area of AREAS) {
  await vaiPara(p, area);
  await p.waitForTimeout(400);

  const r = await p.evaluate(nome => {
    const v = document.getElementById('view-' + nome);
    if (!v) return [];
    const visivel = e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const achados = [];

    // 1. controle interativo sem nome acessível
    v.querySelectorAll('button, a[href], select, input, textarea, [role="button"]').forEach(e => {
      if (!visivel(e)) return;
      const nomeAcc = (e.getAttribute('aria-label') || '').trim()
        || (e.getAttribute('title') || '').trim()
        || (e.textContent || '').trim()
        || (e.id && (document.querySelector(`label[for="${e.id}"]`)?.textContent || '')).trim()
        || (e.closest('label') ? e.closest('label').textContent.trim() : '')
        || (e.getAttribute('placeholder') || '').trim();
      if (!nomeAcc) achados.push({ tipo:'sem-nome', el: e.tagName + '.' + (e.className || '').toString().slice(0,24) + '#' + e.id });
    });

    /* 2. alvo de toque pequeno demais (WCAG 2.5.8: 24x24).
       A norma abre uma exceção explícita para o link que está DENTRO de
       uma frase — ali o tamanho é imposto pela entrelinha do texto ao
       redor, e engordar o alvo desalinharia a linha. Sem essa exceção o
       teste acusa como defeito justamente o que a norma dispensa, e a
       correção "óbvia" piora o texto. */
    const dentroDeFrase = e => {
      const pai = e.parentElement;
      if (!pai) return false;
      const ehLinha = getComputedStyle(e).display.startsWith('inline');
      const temFraseAoRedor = [...pai.childNodes]
        .some(n => n.nodeType === 3 && n.textContent.trim().length > 2);
      return ehLinha && temFraseAoRedor;
    };
    v.querySelectorAll('button, a[href], [role="button"]').forEach(e => {
      if (!visivel(e)) return;
      const r = e.getBoundingClientRect();
      if ((r.height < 24 || r.width < 24) && !dentroDeFrase(e)) {
        achados.push({ tipo:'alvo-pequeno', el:(e.id || e.className || e.tagName).toString().slice(0,30),
                       tam: Math.round(r.width) + 'x' + Math.round(r.height) });
      }
    });

    // 3. aria-pressed/expanded em elemento que não é botão
    v.querySelectorAll('[aria-pressed],[aria-expanded]').forEach(e => {
      if (e.tagName !== 'BUTTON' && e.getAttribute('role') !== 'button')
        achados.push({ tipo:'aria-em-nao-botao', el: e.tagName + '#' + e.id });
    });

    // 4. campo sem rótulo associado
    v.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(e => {
      if (!visivel(e)) return;
      const temLabel = (e.id && document.querySelector(`label[for="${e.id}"]`)) || e.closest('label')
        || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby');
      if (!temLabel) achados.push({ tipo:'campo-sem-rotulo', el: e.tagName + '#' + e.id });
    });

    return achados;
  }, area);

  if (r.length) problemas.push([area, r]);
  console.log(area.padEnd(13), r.length ? JSON.stringify(r) : 'ok');
}

// 5. foco visível: percorre os focáveis e confere que o anel aparece
await p.evaluate(() => window.showView('focus'));
await p.waitForTimeout(400);
const foco = await p.evaluate(() => {
  const v = document.getElementById('view-focus');
  const focaveis = [...v.querySelectorAll('button:not([disabled]), select, input, a[href], [tabindex="0"]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; });
  const semAnel = [];
  for (const e of focaveis) {
    e.focus();
    const cs = getComputedStyle(e);
    const temAnel = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
    if (!temAnel) semAnel.push((e.id || e.className || e.tagName).toString().slice(0, 30));
  }
  return { total: focaveis.length, semAnel };
});
console.log('\nfoco visível em Foco:', JSON.stringify(foco));

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
console.log('ÁREAS COM ACHADO:', problemas.length);
await b.close();
process.exit(problemas.length || foco.semAnel.length || erros.length ? 1 : 0);
