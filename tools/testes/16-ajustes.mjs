/* Teste das áreas que NÃO são coleção.
 *
 * O teste 15 mede uma coleção: lista, formulário de criar, linha com
 * Editar/Excluir. Oito áreas do app não têm nada disso — Perfil,
 * Configurações, Faculdade, Relatórios, Foco, Calendário, Início e
 * Arquivos — e o que uma migração pode fazer sumir nelas é outra coisa:
 * um campo que deixa de gravar, um rótulo que se solta do controle, uma
 * categoria que desaparece, um número que para de ler o dado, um
 * cronômetro que não anda mais, um arquivo que some da lista.
 *
 * As checagens comuns valem para todas; a última é própria de cada área,
 * porque "funcionar" quer dizer uma coisa diferente em cada uma.
 *
 * Uso: node tools/testes/16-ajustes.mjs [profile|settings|college|reports|focus|calendar|home|files]
 */
import { abre, vaiPara, esperaParar } from './ajuda.mjs';

const area = process.argv[2] || 'profile';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

/* Relatórios e Calendário só mostram alguma coisa quando existe dado.
   Semeados vazios, os dois passariam em qualquer checagem exibindo zero
   — e é justamente "o número ainda lê o dado?" que se quer medir. */
const SEMENTE = {
  subjects: [{ name: 'Cálculo I', description: 'Limites', progress: 62, semester: 1 },
             { name: 'Física II', description: 'Ondas', progress: 23, semester: 2 }],
  projects: [{ name: 'TCC', description: 'Plataforma', status: 'Em andamento' }],
  activities: [{ name: 'Lista 4', description: '', date: dia(2), priority: 'Alta' },
               { name: 'Prova', description: '', date: dia(-1) }],
  notes: [], institutions: [],
  profile: { name: 'Mateus Souza', email: 'mateus@exemplo.com', photo: '',
             username: 'mateus.wzn', bio: 'Estudo e construo.', skills: ['JS'],
             links: [], visibility: {} },
  college: { institution: 'UFPA', course: 'Engenharia', area: '', semester: 5 },
  theme: 'dark'
};

const { b, p, erros } = await abre(SEMENTE, { viewport: { width: 1280, height: 900 } });

/* Arquivos guarda no IndexedDB deste navegador, não no blob do workspace.
   Semeado vazio, o único caminho medido seria o estado vazio — e some da
   medição justamente o que a área existe para fazer. */
if (area === 'files') {
  await p.evaluate(async () => {
    await new Promise(ok => {
      const req = indexedDB.open('mwArquivos', 1);
      req.onupgradeneeded = () => { const d = req.result;
        if (!d.objectStoreNames.contains('arquivos')) d.createObjectStore('arquivos', { keyPath: 'id' }); };
      req.onsuccess = () => {
        const d = req.result, loja = d.transaction('arquivos', 'readwrite').objectStore('arquivos');
        loja.put({ id:'t1', nome:'aula-03-derivadas.pdf', tipo:'application/pdf', bytes:240000,
                   criadoEm: Date.now(), subject:'Cálculo I', blob: new Blob(['%PDF'], { type:'application/pdf' }) });
        loja.put({ id:'t2', nome:'resumo-ondas.md', tipo:'text/markdown', bytes:1200,
                   criadoEm: Date.now()-1000, subject:'Física II', blob: new Blob(['# ondas'], { type:'text/markdown' }) });
        loja.transaction.oncomplete = () => ok();
      };
      req.onerror = () => ok();
    });
  });
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
}

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
    texto: (v.textContent || '').replace(/\s+/g, ' ').trim().length,
    /* A unidade de leitura destas telas é a CAIXA: um assunto por caixa.
       Em Perfil e Configurações ela se chama grupo de ajuste; em
       Faculdade, Relatórios, Foco e Calendário ela é um cartão; nas telas
       já reformuladas ela é uma faixa (rótulo + conteúdo, sem moldura) ou
       uma chapa (superfície sólida). O nome muda com a migração, então
       conta-se por todos eles.

       O que se mede é a INTENÇÃO — "o assunto está separado do assunto
       seguinte", não "existe uma div com esta classe". Quando a
       reformulação do Perfil trocou os grupos por faixas e chapas, a
       contagem caiu a zero numa tela que ficou MAIS organizada do que
       antes. Corrigir aqui, e não remendar a marcação nova para caber num
       nome velho. */
    caixas: v.querySelectorAll('[data-mw-grupo], .settings-group, .ds-cartao, .card,'
                             + ' .ds-faixa, .ds-chapa').length,
    categorias: [...v.querySelectorAll('[data-mw-categoria], .mw-settings-categoria, .ds-tela-titulo')]
      .map(e => e.textContent.trim()).filter(Boolean)
  };
}, area);
/* Mínimos por área, e não um número só: Faculdade é um cartão de quatro
   campos; Configurações tem catorze grupos. Um limiar único ou aprovaria
   uma tela vazia ou reprovaria uma tela pequena que está certa. */
const MINIMO = {
  profile:  { caixas: 4, controles: 5 },
  settings: { caixas: 8, controles: 8 },
  college:  { caixas: 1, controles: 4 },
  reports:  { caixas: 4, controles: 4 },
  focus:    { caixas: 3, controles: 5 },
  calendar: { caixas: 1, controles: 8 },
  home:     { caixas: 8, controles: 8 },
  files:    { caixas: 2, controles: 2 }
}[area] || { caixas: 1, controles: 1 };

/* Altura e controles, não quantidade de texto: o Calendário tem 34
   controles e 171 caracteres, porque quase tudo nele é um número de dia
   dentro de um botão. Medir "tem texto" reprovava uma tela cheia. */
ok('a tela tem conteúdo',
   base.altura > 200 && base.controles >= MINIMO.controles, base);
ok('os assuntos estão em caixas', base.caixas >= MINIMO.caixas, { caixas: base.caixas, minimo: MINIMO.caixas });

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

/* ---- 4c. Faculdade: o que se edita grava ------------------------------ */
if (area === 'college') {
  const NOVO = 'Universidade Trocada No Teste';
  const gravou = await p.evaluate(async novo => {
    const campo = document.getElementById('collegeInstitution');
    if (!campo) return { erro: 'não achei #collegeInstitution' };
    campo.value = novo;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    const salvar = [...document.querySelectorAll('#view-college button')]
      .find(b => /salvar/i.test(b.textContent || ''));
    if (!salvar) return { erro: 'não achei o botão de salvar' };
    salvar.click();
    await new Promise(r => setTimeout(r, 700));
    return { noDado: (window.data.college || {}).institution };
  }, NOVO);
  ok('editar e salvar grava no dado', gravou.noDado === NOVO, gravou);

  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2200);
  await vaiPara(p, 'college');
  await p.waitForTimeout(700);
  const depois = await p.evaluate(() => ({
    noDado: (window.data.college || {}).institution,
    naTela: (document.getElementById('collegeInstitution') || {}).value
  }));
  ok('e continua lá depois de recarregar', depois.noDado === NOVO && depois.naTela === NOVO, depois);
}

/* ---- 4d. Relatórios: os números ainda leem o dado ---------------------
   A área é só leitura, então o defeito que uma migração produz aqui é
   silencioso: os cartões continuam bonitos e passam a mostrar zero.
   A semente tem 2 disciplinas, 1 projeto e 2 atividades — se nada disso
   aparecer, a conta parou de ler. */
if (area === 'reports') {
  const r = await p.evaluate(() => {
    const v = document.getElementById('view-reports');
    const txt = (v.textContent || '').replace(/\s+/g, ' ');
    const numeros = [...v.querySelectorAll('strong, b')]
      .map(e => (e.textContent || '').trim())
      .filter(t => /^\d/.test(t));
    return { txt: txt.slice(0, 120), numeros: numeros.slice(0, 14),
             algumNaoZero: numeros.some(t => /^[1-9]/.test(t)) };
  });
  ok('os números leem o dado (nem tudo é zero)', r.algumNaoZero, r);

  const filtro = await p.evaluate(async () => {
    const bts = [...document.querySelectorAll('#view-reports button')]
      .filter(b => /dias|tudo/i.test(b.textContent || ''));
    if (bts.length < 2) return { erro: 'não achei os filtros de período' };
    const antes = document.getElementById('view-reports').textContent;
    bts[bts.length - 1].click();
    await new Promise(r => setTimeout(r, 500));
    return { filtros: bts.length,
             mudou: document.getElementById('view-reports').textContent !== antes };
  });
  ok('os filtros de período existem', !filtro.erro && filtro.filtros >= 2, filtro);
}

/* ---- 4e. Foco: o cronômetro anda -------------------------------------- */
if (area === 'focus') {
  const t = await p.evaluate(async () => {
    const v = document.getElementById('view-focus');
    const mostrador = [...v.querySelectorAll('*')]
      .filter(e => !e.children.length && /^\d{1,2}:\d{2}$/.test((e.textContent || '').trim()))[0];
    if (!mostrador) return { erro: 'não achei o mostrador do cronômetro' };
    const antes = mostrador.textContent.trim();
    const iniciar = [...v.querySelectorAll('button')]
      .find(b => /iniciar|começar/i.test(b.textContent || ''));
    if (!iniciar) return { erro: 'não achei o botão de iniciar' };
    iniciar.click();
    await new Promise(r => setTimeout(r, 1600));
    const depois = mostrador.textContent.trim();
    /* deixa parado de novo, para o teste não seguir com um cronômetro
       correndo por baixo das medições de layout */
    const parar = [...v.querySelectorAll('button')]
      .find(b => /pausar|parar/i.test(b.textContent || ''));
    if (parar) parar.click();
    return { antes, depois, andou: antes !== depois };
  });
  ok('o cronômetro anda quando se manda iniciar', t.andou, t);
}

/* ---- 4f. Calendário: mês e semana, e a navegação anda ----------------- */
if (area === 'calendar') {
  const c = await p.evaluate(async () => {
    const v = document.getElementById('view-calendar');
    const modos = [...v.querySelectorAll('button')].filter(b => /^(mês|mes|semana)$/i.test((b.textContent || '').trim()));
    const titulo = () => (v.textContent || '').replace(/\s+/g, ' ').slice(0, 60);
    const antesTitulo = titulo();
    const proximo = [...v.querySelectorAll('button')].find(b => /^[›>]$/.test((b.textContent || '').trim()));
    if (proximo) { proximo.click(); await new Promise(r => setTimeout(r, 400)); }
    const mudouMes = titulo() !== antesTitulo;
    let mudouModo = false;
    if (modos.length >= 2) {
      const antes = v.textContent;
      modos[1].click();
      await new Promise(r => setTimeout(r, 500));
      mudouModo = v.textContent !== antes;
      modos[0].click();
      await new Promise(r => setTimeout(r, 400));
    }
    return { modos: modos.length, mudouMes, mudouModo };
  });
  ok('mês e semana são dois modos de verdade', c.modos >= 2 && c.mudouModo, c);
  ok('a navegação de período anda', c.mudouMes, c);
}

/* ---- 4g. Início: os números do painel leem o dado ---------------------
   O painel é a soma de todas as outras áreas. Se ele parar de ler,
   continua bonito e passa a mostrar zero em tudo — o defeito mais
   silencioso que esta tela pode ter. A semente tem 2 disciplinas, 1
   projeto e 2 atividades. */
if (area === 'home') {
  const r = await p.evaluate(() => {
    const v = document.getElementById('view-home');
    const num = id => { const e = document.getElementById(id); return e ? (e.textContent || '').trim() : null; };
    return {
      disciplinas: num('statSubjects'), projetos: num('statProjects'),
      atividades: num('statActivities'), progresso: num('statProgress'),
      resumoVisivel: !!v.querySelector('#mwResumoDia:not([hidden])'),
      atalhos: v.querySelectorAll('#mwAtalhos button, #mwAtalhos a').length
    };
  });
  ok('os números do painel leem o dado',
     r.disciplinas === '2' && r.projetos === '1' && r.atividades === '2', r);
  ok('os atalhos de acesso rápido estão lá', r.atalhos >= 3, r.atalhos);
}

/* ---- 4h. Arquivos: os arquivos guardados aparecem ---------------------
   A área lê do IndexedDB, não do blob do workspace. Uma migração que
   quebre o seletor da lista deixa a tela com o estado vazio — e "nenhum
   arquivo" é indistinguível de "a lista parou de achar os arquivos". */
if (area === 'files') {
  const r = await p.evaluate(() => {
    const v = document.getElementById('view-files');
    const txt = (v.textContent || '').replace(/\s+/g, ' ');
    return {
      temPdf: txt.includes('aula-03-derivadas'),
      temMd: txt.includes('resumo-ondas'),
      linhas: v.querySelectorAll('[data-mw-arquivo], .mw-arq-item, .list-item, .ds-item').length
    };
  });
  ok('os arquivos guardados aparecem na lista', r.temPdf && r.temMd, r);
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
        /* Dentro de um <svg>, quem recorta é o viewport do próprio SVG, e
           isso não aparece como overflow-x em ancestral nenhum. Um <rect>
           de área de toque num gráfico pode ter a caixa passando da tela
           sem que um pixel seja desenhado lá fora. Quem pode vazar de
           verdade é o <svg>; os filhos dele são medidos por ele. */
        if (e.ownerSVGElement) return false;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return !rola(e) && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => (e.id || e.className || e.tagName).toString().slice(0, 30));
      const espremidos = [...v.querySelectorAll('*')].filter(e => {
        if (e.children.length) return false;
        /* Só conta se HOUVER texto. A barra de progresso é um <i> vazio
           dentro de uma caixa com overflow:hidden, e durante a transição
           de largura o scrollWidth passa do clientWidth — o que faz esta
           checagem acusar "texto cortado" num elemento que não tem texto
           nenhum. O defeito que ela existe para pegar é texto que some
           sem reticências; sem texto, não há o que sumir. */
        if (!(e.textContent || '').trim()) return false;
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
