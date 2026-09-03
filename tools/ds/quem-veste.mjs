/* Quem VESTE os componentes do sistema dentro de uma área migrada?
 *
 * Este é o irmão do quem-vence, e existe por causa de um ponto cego
 * dele. O quem-vence separa o que acha em três baldes, e um deles —
 * "CSS próprio da área" — some do relatório de propósito: é o quadro de
 * Projetos, a agenda, o cartão de dois painéis da tela de entrada.
 *
 * O ponto cego é que uma folha pode ser as DUAS coisas ao mesmo tempo.
 * `mw-ds-login` é o layout do cartão de entrada (que fica) E era a pele
 * dos campos (que tinha de sair) — e enquanto ela estava declarada como
 * própria, o quem-vence dizia "zero regras legadas" com os campos ainda
 * vestidos pela folha antiga, `!important` e tudo.
 *
 * Então este script pergunta outra coisa: dos elementos que carregam uma
 * classe `ds-*`, quais estão sendo pintados por alguém que não é o
 * sistema? Aí não há balde onde se esconder — se o elemento diz que é do
 * sistema, quem o pinta tem de ser o sistema.
 *
 * Saída vazia = certo. Uso:
 *   node tools/ds/quem-veste.mjs                  (entrada, escuro)
 *   node tools/ds/quem-veste.mjs login claro
 *   node tools/ds/quem-veste.mjs subjects escuro  (uma área do app)
 */
import { chromium } from 'playwright';
import { ENDERECO, achaNavegador } from '/home/user/mateuswzn/tools/testes/ajuda.mjs';
const ep = achaNavegador();
const area = process.argv[2] || 'login';
/* O tema é argumento porque a primeira versão só media o escuro — e no
   claro havia uma regra a mais vestindo o botão primário, que passou
   despercebida por isso. Uma tela tem dois temas; medir um é medir
   metade. */
const tema = process.argv[3] || 'escuro';
const MOLDURA = { lateral: '.sidebar', topo: '.ds-topo', baixo: '#mwBottomNav' };
const RAIZ = area === 'login' ? '#loginScreen' : (MOLDURA[area] || '#view-' + area);
const b = await chromium.launch(ep ? { executablePath: ep } : {});
const p = await b.newPage({ viewport: area === 'baixo'
  ? { width: 390, height: 780 } : { width: 1280, height: 900 } });
await p.addInitScript(a => {
  localStorage.setItem('mwZerarTudo-2026-08-e','1');
  /* Para uma área do app é preciso ter sessão; para a tela de entrada,
     é preciso NÃO ter. */
  if (a.area !== 'login') localStorage.setItem('mwSession','1');
  if (a.tema === 'claro') localStorage.setItem('mwTemaPreferido','light');
  /* A barra de baixo só existe no app instalado — ver o teste 20. */
  if (a.area === 'baixo'){
    const real = window.matchMedia.bind(window);
    window.matchMedia = q => /display-mode:\s*standalone/.test(q)
      ? { matches:true, media:q, onchange:null, addListener(){}, removeListener(){},
          addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return false; } }
      : real(q);
  }
}, { area, tema });
await p.goto(ENDERECO + '/index.html');
await p.waitForFunction(() => !document.getElementById('mwBootLoader') && document.documentElement.classList.contains('mw-login-pronto'), null, {timeout:20000});
await p.waitForTimeout(900);
await p.evaluate(t => {
  document.body.classList.toggle('light', t === 'claro');
  document.documentElement.setAttribute('data-ds-tema', t);
}, tema);
await p.waitForTimeout(600);
if (area !== 'login' && !MOLDURA[area]){
  await p.evaluate(a => {
    const bt = document.querySelector(`#nav button[data-view="${a}"]`);
    if (bt) bt.click(); else if (window.showView) window.showView(a);
  }, area);
  await p.waitForTimeout(900);
}
const achados = await p.evaluate(raiz => {
  const PROPS = ['color','background-color','background-image','border-radius','border-color','font-size','font-weight','padding','box-shadow'];
  const regras = [];
  for (const f of document.styleSheets){
    const folha = f.href ? f.href.split('/').pop() : ((f.ownerNode&&f.ownerNode.id)||'inline');
    const desce=(l,c)=>{for(const r of l){ if(r.cssRules&&r.cssRules.length){desce(r.cssRules,r.name||c);continue;}
      if(!r.selectorText||!r.style)continue; regras.push({folha,camada:c||'',sel:r.selectorText,style:r.style});}};
    try{desce(f.cssRules,null)}catch(e){}
  }
  const espec = s => { const a=(s.match(/#[\w-]+/g)||[]).length, b2=(s.match(/\.[\w-]+|\[[^\]]+\]|:[a-z-]+\(/g)||[]).length,
                       c=(s.match(/(^|[\s>+~])[a-z]+/gi)||[]).length; return a*10000+b2*100+c; };
  const fora = {};
  /* só os elementos que carregam uma classe do sistema */
  for (const el of document.querySelectorAll(raiz + ' [class*="ds-"]')){
    if (!el.getBoundingClientRect().width) continue;
    for (const prop of PROPS){
      let melhor=null;
      for (const r of regras){
        const v = r.style.getPropertyValue(prop) || r.style.getPropertyValue('all');
        if(!v) continue; let m=false; try{m=el.matches(r.sel)}catch(e){continue}
        if(!m) continue;
        const imp = r.style.getPropertyPriority(prop)==='important';
        const peso = (imp?(r.camada?1e8:1e9):0)+espec(r.sel);
        if(!melhor||peso>=melhor.peso) melhor={peso,r,imp};
      }
      if(!melhor) continue;
      const fo = melhor.r.folha;
      if (fo==='mw-ds.css'||fo==='mw-legado-desligado') continue;
      const k = fo+' :: '+melhor.r.sel.slice(0,70);
      (fora[k] = fora[k]||{props:[],ex:''}).props.push(prop);
      if(!fora[k].ex) fora[k].ex = (el.className||'').toString().slice(0,40);
    }
  }
  return Object.entries(fora).map(([k,v])=>({regra:k, props:[...new Set(v.props)].join(','), ex:v.ex}));
}, RAIZ);

console.log('=== "' + area + '" (' + tema + '): quem veste os componentes do sistema ===');
if (!achados.length) console.log('  ninguém de fora — o sistema veste todos.');
for (const a of achados){
  console.log('\n  ' + a.regra);
  console.log('    vence em: ' + a.props + '   (ex.: ' + a.ex + ')');
}
await b.close();
process.exit(achados.length ? 1 : 0);
