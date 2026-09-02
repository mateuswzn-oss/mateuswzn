/* Estrutura: invariantes que o navegador não reclama e que quebram
   comportamento em silêncio.

   Por que no DOM vivo e não com grep no arquivo: grep acha "id=" dentro
   de comentário de CSS e dentro de string de JS, e reporta duplicata
   onde não há nenhuma. Foi exatamente esse falso positivo que me fez
   perseguir dois IDs duplicados que não existiam. O DOM depois de o app
   subir é a única fonte que conta.

   Uso: node tools/testes/8-estrutura.mjs */
import { abre, AREAS, vaiPara } from './ajuda.mjs';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

const { b, p, erros } = await abre({
  subjects:[{ name:'Cálculo I', description:'Limites', progress:40 }],
  projects:[{ name:'TCC', description:'App', status:'Em andamento', priority:'Alta', deadline: dia(3) }],
  activities:[{ name:'Lista 4', description:'', date: dia(1), priority:'Alta', subject:'Cálculo I' }],
  notes:[{ title:'Ideia', body:'Texto '.repeat(40), category:'Estudos' }],
  institutions:[{ name:'UFPA', short:'UFPA', kind:'Universidade', course:'Eng', city:'Belém', site:'' }],
  profile:{ name:'Mateus Souza', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'UFPA', course:'Engenharia', area:'', semester:5 }, theme:'dark'
}, { viewport: { width: 1440, height: 950 } });

/* Todas as áreas precisam ter sido abertas ao menos uma vez: parte do
   conteúdo só é escrito quando a área abre, e um ID duplicado que só
   nasce ali passaria despercebido. */
for (const v of AREAS) { await vaiPara(p, v); await p.waitForTimeout(140); }

const achados = await p.evaluate(() => {
  const out = { duplicados: [], forOrfao: [], ariaOrfao: [] };

  // 1. dois elementos com o mesmo id — getElementById devolve o primeiro,
  //    e quem quisesse o segundo mexe silenciosamente no errado
  const porId = {};
  document.querySelectorAll('[id]').forEach(e => { (porId[e.id] = porId[e.id] || []).push(e.tagName); });
  Object.entries(porId).forEach(([id, tags]) => {
    if (tags.length > 1) out.duplicados.push(id + ' (' + tags.join(',') + ')');
  });

  // 2. <label for="x"> sem nenhum #x — o rótulo não rotula nada, e clicar
  //    nele não foca campo nenhum
  document.querySelectorAll('label[for]').forEach(l => {
    const alvo = l.getAttribute('for');
    if (alvo && !document.getElementById(alvo)) out.forOrfao.push(alvo);
  });

  // 3. aria-labelledby / aria-describedby apontando para id que não existe
  ['aria-labelledby', 'aria-describedby'].forEach(attr => {
    document.querySelectorAll('[' + attr + ']').forEach(e => {
      (e.getAttribute(attr) || '').split(/\s+/).filter(Boolean).forEach(id => {
        if (!document.getElementById(id)) out.ariaOrfao.push(attr + '=' + id);
      });
    });
  });

  return out;
});

const rotulos = {
  duplicados: 'IDs duplicados no DOM',
  forOrfao:   'label[for] apontando para id inexistente',
  ariaOrfao:  'aria-labelledby/describedby órfão'
};
let total = 0;
for (const [chave, rotulo] of Object.entries(rotulos)) {
  const v = [...new Set(achados[chave])];
  total += v.length;
  console.log(rotulo.padEnd(42), v.length ? JSON.stringify(v) : 'nenhum');
}

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
console.log('ACHADOS:', total);
await b.close();
process.exit(total || erros.length ? 1 : 0);
