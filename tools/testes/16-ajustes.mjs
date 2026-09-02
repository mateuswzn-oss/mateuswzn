/* Teste de ÁREA para Perfil e Configurações — o "antes e depois" da
 * migração destas duas.
 *
 * O teste 15 não serve aqui: ele mede uma COLEÇÃO (lista, formulário de
 * criar, linha com Editar/Excluir). Perfil e Configurações não têm
 * lista nenhuma; são telas de campos e interruptores, e o que pode se
 * perder numa migração é outra coisa — um campo que deixa de gravar, um
 * rótulo que se solta do controle, uma categoria que some, um
 * interruptor que volta ao valor antigo depois de recarregar.
 *
 * Uso: node tools/testes/16-ajustes.mjs [profile|settings]
 */
import { abre, vaiPara, esperaParar } from './ajuda.mjs';

const area = process.argv[2] || 'profile';

const SEMENTE = {
  subjects: [], projects: [], activities: [], notes: [], institutions: [],
  profile: { name: 'Mateus Souza', email: 'mateus@exemplo.com', photo: '',
             username: 'mateus.wzn', bio: 'Estudo e construo.', skills: ['JS'],
             links: [], visibility: {} },
  college: { institution: 'UFPA', course: 'Engenharia', area: '', semester: 5 },
  theme: 'dark'
};

const { b, p, erros } = await abre(SEMENTE, { viewport: { width: 1280, height: 900 } });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(48), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

console.log('=== área "' + area + '" ===');
await vaiPara(p, area);
await p.waitForTimeout(700);
await esperaParar(p, '#view-' + area);

/* ---- 1. a tela tem conteúdo, e ele veio do dado gravado ---------------- */
const base = await p.evaluate(a => {
  const v = document.getElementById('view-' + a);
  const vis = e => e.offsetWidth > 0 && e.offsetHeight > 0;
  const controles = [...v.querySelectorAll('input,select,textarea,button')].filter(vis);
  return {
    altura: v.offsetHeight,
    controles: controles.length,
    /* Grupo é a unidade de leitura destas telas: um assunto por caixa. */
    grupos: v.querySelectorAll('[data-mw-grupo], .settings-group, .ds-cartao').length,
    categorias: [...v.querySelectorAll('[data-mw-categoria], .mw-settings-categoria, .ds-tela-titulo')]
      .map(e => e.textContent.trim()).filter(Boolean)
  };
}, area);
ok('a tela tem conteúdo', base.altura > 400 && base.controles >= 5, base);
ok('os assuntos estão em grupos', base.grupos >= 4, base.grupos);

if (area === 'settings') {
  const ESPERADAS = ['Conta', 'Aparência', 'Notificações', 'Segurança', 'IA', 'Privacidade', 'Aplicativo'];
  const faltam = ESPERADAS.filter(c => !base.categorias.some(x => x.includes(c)));
  ok('as sete categorias estão lá', !faltam.length, { faltam, achadas: base.categorias });
}

/* ---- 2. todo controle tem nome acessível ------------------------------
   Um <input> sem rótulo é um campo que o leitor de tela anuncia como
   "editar texto" e mais nada. Aqui a migração é o risco: o rótulo se
   liga ao campo por `for`/`id`, e reescrever a marcação é justamente
   onde esse par se perde. */
const semNome = await p.evaluate(a => {
  const v = document.getElementById('view-' + a);
  const vis = e => e.offsetWidth > 0 && e.offsetHeight > 0;
  const nome = e => {
    if (e.getAttribute('aria-label')) return true;
    const ref = e.getAttribute('aria-labelledby');
    if (ref && ref.split(/\s+/).some(id => document.getElementById(id))) return true;
    if (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) return true;
    if (e.closest('label')) return true;
    if (e.tagName === 'BUTTON' && (e.textContent || '').trim()) return true;
    if (e.title) return true;
    return false;
  };
  return [...v.querySelectorAll('input,select,textarea,button')].filter(vis).filter(e => !nome(e))
    .map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '[' + (e.type || '') + ']');
}, area);
ok('todo controle visível tem nome acessível', !semNome.length, semNome);

/* ---- 3. alvo de toque, com a exceção da WCAG 2.5.8 -------------------- */
const pequenos = await p.evaluate(a => {
  const v = document.getElementById('view-' + a);
  const dentroDeFrase = e => {
    const pai = e.parentElement;
    if (!pai) return false;
    return getComputedStyle(e).display.startsWith('inline')
      && [...pai.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2);
  };
  return [...v.querySelectorAll('button, a[href], [role="button"], input[type="checkbox"], select')]
    .filter(e => { const r = e.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && (r.height < 24 || r.width < 24) && !dentroDeFrase(e); })
    .map(e => (e.id || e.className || e.tagName).toString().slice(0, 28));
}, area);
ok('todo alvo tem 24px (exceção de link em frase)', !pequenos.length, pequenos);

/* ---- 4. o que se edita, grava — e sobrevive ao recarregamento ---------
   É a única pergunta que importa numa tela de ajustes, e a única que a
   inspeção visual não responde. */
if (area === 'profile') {
  const NOVO = 'Nome Trocado No Teste';
  const gravou = await p.evaluate(async novo => {
    const campo = document.getElementById('profileName');
    if (!campo) return { erro: 'não achei #profileName' };
    campo.value = novo;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    const salvar = [...document.querySelectorAll('#view-profile button')]
      .find(b => /salvar/i.test(b.textContent || ''));
    if (!salvar) return { erro: 'não achei o botão de salvar' };
    salvar.click();
    await new Promise(r => setTimeout(r, 700));
    return { noDado: (window.data.profile || {}).name };
  }, NOVO);
  ok('editar e salvar grava no dado', gravou.noDado === NOVO, gravou);

  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  await vaiPara(p, 'profile');
  await p.waitForTimeout(700);
  const depois = await p.evaluate(() => ({
    noDado: (window.data.profile || {}).name,
    naTela: (document.getElementById('profileName') || {}).value
  }));
  ok('e continua lá depois de recarregar', depois.noDado === NOVO && depois.naTela === NOVO, depois);
}

if (area === 'settings') {
  /* O tema é o ajuste mais visível da área e o único que muda a tela
     inteira: se ele parar de gravar, o app abre no tema errado toda vez. */
  const antes = await p.evaluate(() => document.body.classList.contains('light'));
  /* Pelo id, e não por uma varredura de texto: procurar o primeiro
     controle cujo texto casa com /tema|claro|escuro/ achava o parágrafo
     de explicação do grupo antes do botão, clicava nele e não acontecia
     nada — e o teste acusava o app por um defeito do próprio teste. */
  const achouBotao = await p.evaluate(() => {
    const bt = document.getElementById('lightModeBtn') || document.getElementById('darkModeBtn');
    if (!bt) return false;
    bt.click();
    return true;
  });
  ok('o alternador de tema existe na área', achouBotao);
  await p.waitForTimeout(700);
  const depoisDoClique = await p.evaluate(() => ({
    corpo: document.body.classList.contains('light'),
    gravado: (window.data || {}).theme,
    carimbo: document.documentElement.getAttribute('data-ds-tema')
  }));
  ok('trocar o tema muda a tela e grava',
     depoisDoClique.corpo !== antes && !!depoisDoClique.gravado, { antes, ...depoisDoClique });
  /* O carimbo do <html> é o que o Design System lê. Se ele não
     acompanhar a troca, a área migrada fica com o vidro do tema errado —
     foi assim que o defeito apareceu na migração do Suporte. */
  ok('e o carimbo do <html> acompanha',
     depoisDoClique.carimbo === (depoisDoClique.corpo ? 'claro' : 'escuro'), depoisDoClique);
  await p.evaluate(() => { document.body.classList.toggle('light', false); });
}

/* ---- 5. nada vaza, em três larguras e dois temas ---------------------- */
for (const [rot, larg] of [['desktop', 1280], ['tablet', 834], ['celular', 390]]) {
  for (const tema of ['escuro', 'claro']) {
    await p.setViewportSize({ width: larg, height: 900 });
    await p.evaluate(t => {
      document.body.classList.toggle('light', t === 'claro');
      document.documentElement.setAttribute('data-ds-tema', t);
    }, tema);
    await p.waitForTimeout(420);
    await esperaParar(p, '#view-' + area);
    const m = await p.evaluate(a => {
      const v = document.getElementById('view-' + a);
      const rola = e => { let n = e.parentElement;
        while (n && n !== document.body) { const o = getComputedStyle(n).overflowX;
          if (o === 'auto' || o === 'scroll') return true; n = n.parentElement; } return false; };
      const fora = [...v.querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return !rola(e) && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => (e.id || e.className || e.tagName).toString().slice(0, 30));
      const espremidos = [...v.querySelectorAll('*')].filter(e => {
        if (e.children.length) return false;
        const cs = getComputedStyle(e);
        return e.scrollWidth > e.clientWidth + 2 && cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis';
      }).length;
      return { fora, espremidos, corpoRola: document.documentElement.scrollWidth > innerWidth + 1 };
    }, area);
    ok('sem vazamento · ' + rot + ' ' + tema,
       !m.fora.length && !m.espremidos && !m.corpoRola, m);
  }
}
await p.evaluate(() => {
  document.body.classList.remove('light');
  document.documentElement.setAttribute('data-ds-tema', 'escuro');
});

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
