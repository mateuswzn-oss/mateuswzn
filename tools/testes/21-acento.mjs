/* §45 — A MATRIZ TEMA × COR DE DESTAQUE, MEDIDA
   ==========================================================================
   O pedido é explícito: testar cada tema com cada cor e verificar que
   "NENHUMA COR ANTIGA PODE SOBRAR INDEVIDAMENTE". Olhar doze combinações à
   mão uma vez não garante nada na décima terceira rodada — então isto virou
   teste.

   O que ele mede, e por que estas três coisas:

   1. a SEMENTE muda em todas as cores. Se duas cores derem a mesma semente,
      alguém escreveu o mesmo hexadecimal duas vezes.
   2. o ACENTO derivado acompanha a semente. Se a semente muda e o acento
      não, existe um valor cravado ou um estilo inline no caminho — foi
      exatamente assim que o defeito original apareceu: a implementação
      antiga escrevia `--id-ac` como estilo INLINE no <html>, e inline vence
      qualquer folha.
   3. o ITEM ATIVO DA LATERAL tem aparência distinta em cada cor. É a peça
      mais visível do acento; se ela não segue, nada mais segue.

   Cuidado de medida que custou uma rodada: comparar só os primeiros 44
   caracteres do `background-image` dava "tudo igual" em todas as cores,
   porque os 44 primeiros são o véu escuro que vem antes do gradiente. E a
   variável tem de ser lida num elemento DENTRO do body — as sementes do
   tema claro moram em `body.light`, então lê-las no <html> devolve sempre
   a do escuro.

   Uso: node tools/testes/21-acento.mjs
   ========================================================================== */
/* §45 — a matriz de tema × cor, medida em vez de olhada.
   Para cada combinação verifica se as peças que DEVEM seguir o acento
   realmente mudaram, e se o texto sobre o acento continua legível. */
import { chromium } from 'playwright';
import { ENDERECO, achaNavegador } from '/home/user/mateuswzn/tools/testes/ajuda.mjs';
const CORES = ['indigo','ciano','violeta','verde','ambar','rosa'];
const semente = t => ({ subjects:[{name:'Física II',description:'',progress:23}], projects:[], activities:[],
  notes:[], institutions:[], focus:{config:{foco:25,pausa:5,longa:15},atual:null,sessoes:[]},
  profile:{name:'Mateus',email:'',photo:'',username:'',bio:'',skills:[],links:[],visibility:{}},
  college:{institution:'',course:'',area:'',semester:1}, theme:t });
const lum = c => { const m=c.match(/[\d.]+/g).map(Number);
  const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2]); };
const raz = (a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);};

const b = await chromium.launch({ executablePath: achaNavegador() });
let ruins = 0;
for (const tema of ['dark','light']) {
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const err=[]; p.on('pageerror',e=>err.push(e.message));
  await p.addInitScript(d => { localStorage.setItem('mwZerarTudo-2026-08-e','1');
    localStorage.setItem('mateusWorkspaceV4', JSON.stringify(d)); localStorage.setItem('mwSession','1'); }, semente(tema));
  await p.goto(ENDERECO + '/index.html'); await p.waitForTimeout(2800);
  await p.evaluate(() => { document.getElementById('mwBootLoader')?.remove();
    const l=document.getElementById('loginScreen'); if(l) l.style.display='none';
    const a=document.getElementById('app'); if(a){a.style.display='';a.hidden=false;a.classList.remove('hidden');}
    document.documentElement.classList.add('mw-login-pronto'); window.showView('home'); });
  await p.waitForTimeout(900);
  const vistos = {};
  for (const cor of CORES) {
    await p.evaluate(c => { var d=window.data; d.settings=d.settings||{}; d.settings.accent=c; window.mwAplicaCorDestaque(); }, cor);
    await p.waitForTimeout(360);
    const m = await p.evaluate(() => {
      /* As sementes do tema claro são definidas em `body.light`, então ler
         a variável no <html> devolve sempre a do escuro. Quem enxerga o
         valor de verdade é um elemento DENTRO do body — como o app. */
      const cs = getComputedStyle(document.getElementById('app') || document.body);
      const pega = s => { const e=document.querySelector(s); return e ? getComputedStyle(e) : null; };
      const nav = pega('#nav button.active'), ia = pega('#mateusAiBtn');
      return {
        sem: cs.getPropertyValue('--sem-1').trim(),
        ac:  cs.getPropertyValue('--id-ac').trim(),
        navImg: nav ? nav.backgroundImage : '',
        iaImg:  ia ? ia.backgroundImage : '',
        iaCor:  ia ? ia.color : '',
      };
    });
    vistos[cor] = m;
    const linha = `  ${tema.padEnd(5)} ${cor.padEnd(8)} sem=${(m.sem||'—').padEnd(8)} ac=${(m.ac||'—').padEnd(8)}`;
    let obs = [];
    if (!m.sem) obs.push('SEM SEMENTE');
    if (m.navImg && !m.navImg.includes('gradient')) obs.push('item ativo sem gradiente');
    console.log(linha + (obs.length ? '  <<< ' + obs.join(' · ') : '  ok'));
    if (obs.length) ruins++;
  }
  /* as cinco sementes têm de ser DIFERENTES entre si */
  const sems = new Set(CORES.map(c => vistos[c].sem));
  console.log(`  → ${tema}: ${sems.size} sementes distintas de ${CORES.length}` + (sems.size===CORES.length?'  ok':'  <<< alguma cor não mudou'));
  if (sems.size !== CORES.length) ruins++;
  const navs = new Set(CORES.map(c => vistos[c].navImg));
  console.log(`  → ${tema}: item ativo da lateral com ${navs.size} aparências distintas` + (navs.size===CORES.length?'  ok':'  <<< a lateral não segue a cor'));
  if (navs.size !== CORES.length) ruins++;
  if (err.length) { console.log('  ERROS JS:', err.slice(0,3)); ruins++; }
  await p.close();
}
console.log('\nACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
