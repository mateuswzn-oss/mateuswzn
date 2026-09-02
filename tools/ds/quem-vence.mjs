/* Quem ainda vence dentro de uma área migrada?
 *
 * Depois de marcar a raiz com `ds` e desligar o legado por escopo,
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

const INTEIRO = !!process.env.MW_SEL_INTEIRO;
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
        /* `all: revert-layer` declara TODAS as propriedades de uma vez.
           Lendo só `getPropertyValue(prop)`, a regra de desligamento fica
           invisível para esta varredura — e o relatório acusa como
           "legado vencendo" justamente a regra que está desligando o
           legado. Foi o que fez `button,input,textarea{font:inherit}`
           aparecer como vencedor dentro de áreas onde ele já não vence. */
        const v = r.style.getPropertyValue(prop) || r.style.getPropertyValue('all');
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
      if (melhor.r.folha === 'mw-legado-desligado') continue;
      const chave = melhor.r.folha + ' :: ' + melhor.r.sel;
      if (!fora.has(chave)) fora.set(chave, { folha: melhor.r.folha, sel: melhor.r.sel, props: new Set(), imp: melhor.imp, exemplo: '' });
      const it = fora.get(chave);
      it.props.add(prop);
      it.imp = it.imp || melhor.imp;
      if (!it.exemplo) it.exemplo = (el.className || el.tagName).toString().slice(0, 34);
    }
  }
  return { total: alvos.length,
           lista: [...fora.values()].map(x => ({ folha: x.folha, sel: x.sel,
                                                 props: [...x.props].join(','), imp: x.imp, exemplo: x.exemplo })) };
}, area);

/* Nem toda regra que não vem do mw-ds.css é legado por substituir.
 *
 * Uma área pode ter um componente que só existe nela — o quadro de
 * Projetos, a agenda de Atividades, a conversa do Suporte. O Design
 * System não vai ter um "quadro Kanban": ele dá as peças e o ritmo, e o
 * layout daquela tela é da tela. O que o protocolo exige desse CSS é que
 * ele leia os TOKENS do sistema, para seguir o tema junto com o resto —
 * não que ele deixe de existir.
 *
 * Estes blocos ficam declarados aqui, por área, e são RELATADOS à parte
 * em vez de escondidos: quem lê o resultado vê os dois números. */
const PROPRIO = {
  support:    ['mw-support-style'],
  projects:   ['mw-kanban'],
  activities: ['mw-agenda'],
  subjects:   ['mw-ordem'],
  notes:      ['mw-notas', 'mw-ordem'],
  institutions: [],
  profile:    ['mw-perfil-polido', 'mw-perfil-publico', 'mw-perfil-config-separados'],
  /* `mw-perfil-publico` e `mw-perfil-config-separados` aparecem nas DUAS:
     o interruptor e o selo "Em breve" são componentes que Perfil e
     Configurações compartilham. O bloco é o mesmo; a área que o usa é
     que muda. */
  settings:   ['mw-diagnostico', 'mw-transfere-style', 'mw-preferencias',
               'mw-faceid-style', 'mw-conta-style', 'mw-pin-style',
               'mw-perfil-publico', 'mw-perfil-config-separados'],
  college:    [],
  reports:    ['mw-relatorios'],
  focus:      ['mw-foco'],
  calendar:   ['mw-calendario', 'mw-cal-semana', 'mw-agenda'],
  files:      ['mw-arquivos', 'mw-arq-style'],
  home:       ['mw-comando', 'mw-insights', 'mw-dev-tools', 'mw-graficos', 'mw-painel']
};
const meus = new Set(PROPRIO[area] || []);

/* Terceira categoria, além de "legado" e "próprio da área": CORREÇÃO que
   vale para o app inteiro. `mw-alvos` dá 24px de alvo de toque a
   controles pequenos em todas as áreas; `mw-teclado` implementa foco,
   Tab preso e Escape nos diálogos. Nenhuma das duas é aparência legada —
   restringi-las à porta da área migrada devolveria o defeito que elas
   corrigem, exatamente na tela que acabou de ser refeita. É a mesma
   lista que o restringe.py se recusa a tocar. */
const CORRECOES = new Set(['mw-alvos', 'mw-teclado']);

/* E um reset global, pela mesma razão: `button,input,textarea{font:inherit}`
   é o que faz um controle herdar a fonte da página em vez da fonte do
   sistema operacional. Ele "vence" em font-size num botão que não tem
   texto, e isso não é o legado pintando a área — é o reset fazendo o que
   existe para fazer. */
const RESET = new Set(['button, input, textarea']);

const proprias  = achados.lista ? achados.lista.filter(r => meus.has(r.folha)) : [];
const eCorrecao = r => CORRECOES.has(r.folha) || RESET.has(r.sel.trim());
const correcoes = achados.lista ? achados.lista.filter(eCorrecao) : [];
if (achados.lista) achados.lista = achados.lista.filter(r => !meus.has(r.folha) && !eCorrecao(r));

/* MW_JSON=1 imprime só os achados, em JSON, para o restringe.py consumir:
   medir → restringir → medir de novo, sem ninguém copiar seletor à mão. */
if (process.env.MW_JSON) {
  console.log(JSON.stringify({ area, tema, total: achados.total,
    legado: achados.lista || [], proprias }, null, 1));
  await b.close();
  process.exit(0);
}

console.log('=== área "' + area + '", tema ' + tema + ' — regras que NÃO são do sistema e ainda vencem ===');
if (achados.erro) { console.log(achados.erro); }
else {
  console.log('elementos examinados:', achados.total, '| regras legadas vencendo:', achados.lista.length);
  achados.lista.sort((x, y) => (y.imp - x.imp) || y.props.length - x.props.length);
  for (const r of achados.lista) {
    console.log('\n  ' + r.folha + (r.imp ? '  [!important]' : ''));
    console.log('    ' + (INTEIRO ? r.sel : r.sel.slice(0, 96)));
    console.log('    vence em: ' + r.props + '   (ex.: ' + r.exemplo + ')');
  }
  if (!achados.lista.length) console.log('\n  nenhuma — a área está inteiramente sob o Design System.');
  if (correcoes.length){
    console.log('\n  --- correções que valem para o app inteiro ---');
    console.log('  (alvo de toque, teclado: não são aparência legada e não se restringem)');
    for (const r of correcoes) console.log('    ' + r.folha + ' :: ' + r.sel + '  →  ' + r.props);
  }
  if (proprias.length){
    console.log('\n  --- CSS próprio desta área, mantido de propósito ---');
    console.log('  (componente que só existe aqui; tem de ler os tokens do sistema, não sumir)');
    for (const r of proprias) console.log('    ' + r.folha + ' :: ' + r.sel + '  →  ' + r.props);
  }
}
await b.close();
