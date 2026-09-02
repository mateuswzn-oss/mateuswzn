/* Quem ainda vence dentro de uma área migrada?
 *
 * Depois de marcar a raiz com `mw-ds` e desligar o legado por escopo,
 * sobram as regras legadas que miram o ELEMENTO (h2, p, button) em vez de
 * uma classe — a lista de :where() do desligamento não as alcança, e as
 * que têm !important vencem o sistema.
 *
 * Este script percorre cada elemento da área, cada propriedade visual, e
 * diz qual regra está ganhando. O que interessa é a saída "NÃO é do
 * sistema": é essa a lista de regras legadas a restringir.
 *
 * Uso: node tools/ds/quem-vence.mjs support [claro|escuro]
 */
import { abre, vaiPara, esperaParar } from '../testes/ajuda.mjs';

const area = process.argv[2] || 'support';
const tema = process.argv[3] || 'escuro';

const { b, p } = await abre({
  subjects:[], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus Souza', email:'m@x.com', photo:'', username:'m', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'UFPA', course:'Eng', area:'', semester:5 },
  theme: tema === 'claro' ? 'light' : 'dark'
}, { viewport: { width: 1280, height: 900 } });

await vaiPara(p, area);
await p.waitForTimeout(800);
await esperaParar(p, '#view-' + area);

const existe = await p.evaluate(a => !!document.getElementById('view-' + a), area);
if (!existe) { console.log('#view-' + area + ' não está no documento.'); await b.close(); process.exit(2); }

const achados = await p.evaluate(a => {
  const PROPS = ['color','background-color','background-image','border-radius','border-color',
                 'font-size','font-weight','padding','margin','box-shadow','backdrop-filter'];
  const raiz = document.getElementById('view-' + a);
  if (!raiz) return { erro: 'área não encontrada' };
  const alvos = [raiz, ...raiz.querySelectorAll('*')].filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && !['SVG','PATH','SCRIPT','STYLE'].includes(e.tagName);
  });

  /* Junta todas as regras uma vez só; percorrer as folhas por elemento
     custaria minutos num arquivo com 126 blocos. */
  const regras = [];
  for (const f of document.styleSheets) {
    const folha = f.href ? f.href.split('/').pop() : ((f.ownerNode && f.ownerNode.id) || 'inline');
    const emCamada = [];
    const desce = (lista, camada) => {
      for (const r of lista) {
        if (r.cssRules && r.cssRules.length) { desce(r.cssRules, r.name || camada); continue; }
        if (!r.selectorText || !r.style) continue;
        regras.push({ folha, camada: camada || '', sel: r.selectorText, style: r.style });
      }
    };
    try { desce(f.cssRules, null); } catch(e){}
  }

  const espec = sel => {
    /* especificidade grosseira, suficiente para ordenar entre candidatas */
    const a2 = (sel.match(/#[\w-]+/g) || []).length;
    const b2 = (sel.match(/\.[\w-]+|\[[^\]]+\]|:[a-z-]+\(/g) || []).length;
    const c2 = (sel.match(/(^|[\s>+~])[a-z]+/gi) || []).length;
    return a2 * 10000 + b2 * 100 + c2;
  };

  const fora = new Map();
  for (const el of alvos) {
    for (const prop of PROPS) {
      let melhor = null;
      for (const r of regras) {
        const v = r.style.getPropertyValue(prop);
        if (!v) continue;
        let casa = false;
        try { casa = el.matches(r.sel); } catch(e){ continue; }
        if (!casa) continue;
        const imp = r.style.getPropertyPriority(prop) === 'important';
        /* !important sem camada vence !important em camada; fora isso,
           especificidade e depois ordem no documento. */
        const peso = (imp ? (r.camada ? 1e8 : 1e9) : 0) + espec(r.sel);
        if (!melhor || peso >= melhor.peso) melhor = { peso, r, v, imp };
      }
      if (!melhor) continue;
      if (melhor.r.folha === 'mw-ds.css') continue;
      if (melhor.r.folha === 'mw-support-style' || melhor.r.folha === 'mw-legado-desligado') continue;
      const chave = melhor.r.folha + ' :: ' + melhor.r.sel;
      if (!fora.has(chave)) fora.set(chave, { folha: melhor.r.folha, sel: melhor.r.sel, props: new Set(), imp: melhor.imp, exemplo: '' });
      const it = fora.get(chave);
      it.props.add(prop);
      it.imp = it.imp || melhor.imp;
      if (!it.exemplo) it.exemplo = (el.className || el.tagName).toString().slice(0, 34);
    }
  }
  return { total: alvos.length,
           lista: [...fora.values()].map(x => ({ folha: x.folha, sel: x.sel.slice(0, 96),
                                                 props: [...x.props].join(','), imp: x.imp, exemplo: x.exemplo })) };
}, area);

console.log('=== área "' + area + '", tema ' + tema + ' — regras que NÃO são do sistema e ainda vencem ===');
if (achados.erro) { console.log(achados.erro); }
else {
  console.log('elementos examinados:', achados.total, '| regras legadas vencendo:', achados.lista.length);
  achados.lista.sort((x, y) => (y.imp - x.imp) || y.props.length - x.props.length);
  for (const r of achados.lista) {
    console.log('\n  ' + r.folha + (r.imp ? '  [!important]' : ''));
    console.log('    ' + r.sel);
    console.log('    vence em: ' + r.props + '   (ex.: ' + r.exemplo + ')');
  }
  if (!achados.lista.length) console.log('\n  nenhuma — a área está inteiramente sob o Design System.');
}
await b.close();
