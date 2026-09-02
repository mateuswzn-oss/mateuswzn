/* Carga: um semestre inteiro de dados, não três itens de exemplo.
   É sob carga que layout quebra, texto é espremido sem reticências e
   contador estoura. Roda em 1440, 834 e 390.

   Uso: node tools/testes/2-carga.mjs */
import { abre, AREAS, vaiPara, PNG_1X1 } from './ajuda.mjs';

const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const agora = Date.now();
const nomes = ['Cálculo','Álgebra','Física','Química','Algoritmos','Estruturas de Dados','Banco de Dados',
  'Redes','Sistemas Operacionais','Engenharia de Software','Compiladores','Inteligência Artificial'];

const semente = {
  subjects: Array.from({ length: 24 }, (_, i) => ({
    name: nomes[i % nomes.length] + ' ' + (Math.floor(i / nomes.length) + 1),
    description: 'Descrição razoavelmente longa da disciplina para testar quebra de linha e corte de texto',
    progress: (i * 7) % 101, code: 'DISC-' + i, institution: 'UFPA', semester: (i % 8) + 1
  })),
  projects: Array.from({ length: 30 }, (_, i) => ({
    name: 'Projeto ' + (i + 1) + ' com um nome bastante comprido para testar o corte',
    description: 'Resumo do objetivo deste projeto, com algumas linhas de texto para ocupar espaço no cartão.',
    tag: ['Pesquisa','Extensão','Disciplina'][i % 3],
    status: ['Planejamento','Em andamento','Em revisão','Concluído','Arquivado'][i % 5],
    priority: ['Baixa','Média','Alta'][i % 3],
    subject: nomes[i % nomes.length] + ' 1',
    members: 'você, Ana, Bruno', deadline: dia(i - 10)
  })),
  activities: Array.from({ length: 120 }, (_, i) => ({
    name: 'Atividade ' + (i + 1),
    description: 'Detalhes da atividade número ' + (i + 1),
    date: dia(i - 40), priority: ['Baixa','Média','Alta'][i % 3],
    subject: nomes[i % nomes.length] + ' 1'
  })),
  notes: Array.from({ length: 40 }, (_, i) => ({
    title: 'Anotação ' + (i + 1), body: 'Conteúdo '.repeat(30),
    category: ['Estudos','Projeto','Referência','Pessoal'][i % 4]
  })),
  institutions: Array.from({ length: 5 }, (_, i) => ({
    name: 'Instituição de nome muito longo número ' + (i + 1), short: 'INST' + i,
    kind: 'Universidade', course: 'Engenharia', city: 'Belém', site: ''
  })),
  focus: {
    config: { foco: 25, pausa: 5, longa: 15 }, atual: null,
    sessoes: Array.from({ length: 140 }, (_, i) => ({
      id: 'f' + i, tipo: i % 6 === 0 ? 'pausa' : 'foco',
      subject: nomes[i % nomes.length] + ' 1',
      minutos: 15 + (i % 46), fim: agora - i * 5.4e6, completa: i % 4 !== 0
    }))
  },
  profile: { name: 'Mateus Souza', email: 'm@x.com', photo: '', username: 'mateus.wzn',
             bio: 'Bio de tamanho razoável.', skills: ['JS','Python'], links: [], visibility: {} },
  college: { institution: 'Universidade Federal do Pará', course: 'Engenharia de Computação', area: '', semester: 5 },
  theme: 'dark'
};

let ruins = 0;

for (const [rotulo, vp] of [['1440', {width:1440,height:950}], ['834', {width:834,height:1000}], ['390', {width:390,height:844}]]) {
  console.log('\n========== ' + rotulo + 'px ==========');
  const { b, p, erros } = await abre(semente, { viewport: vp });

  /* Arquivos de verdade, para a área de Arquivos ter carga também. */
  await p.evaluate(() => window.showView('files'));
  await p.waitForTimeout(400);
  const png = Buffer.from(PNG_1X1, 'base64');
  await p.setInputFiles('#mwArqInput', Array.from({ length: 12 }, (_, i) => ({
    name: 'material-' + (i + 1) + (i % 3 === 0 ? '.pdf' : i % 3 === 1 ? '.png' : '.zip'),
    mimeType: i % 3 === 0 ? 'application/pdf' : i % 3 === 1 ? 'image/png' : 'application/zip',
    buffer: i % 3 === 1 ? png : Buffer.from('x'.repeat(5000 * (i + 1)))
  })));
  await p.waitForTimeout(1600);

  for (const area of AREAS) {
    const t0 = Date.now();
    await vaiPara(p, area);
    await p.waitForTimeout(420);
    const r = await p.evaluate(nome => {
      const v = document.getElementById('view-' + nome);
      if (!v) return { erro: 'view ausente' };
      const fora = [...v.querySelectorAll('*')].filter(e => {
        const b = e.getBoundingClientRect();
        if (!b.width && !b.height) return false;
        let pai = e.parentElement, rolavel = false;
        while (pai && pai !== document.body) {
          if (/auto|scroll/.test(getComputedStyle(pai).overflowX)) { rolavel = true; break; }
          pai = pai.parentElement;
        }
        return !rolavel && (b.right > window.innerWidth + 1 || b.left < -1);
      });
      /* Texto cortado sem reticências: sinal de overflow escondido, que é
         pior que vazar — some sem avisar. */
      const espremidos = [...v.querySelectorAll('*')].filter(e => {
        if (e.children.length) return false;
        const cs = getComputedStyle(e);
        return e.scrollWidth > e.clientWidth + 2 && cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis';
      }).length;
      return {
        ativa: v.classList.contains('active'),
        scrollH: document.documentElement.scrollWidth > window.innerWidth + 1,
        fora: fora.length,
        foraQuem: fora.slice(0, 2).map(e => (e.id || e.className || e.tagName).toString().slice(0, 32)),
        espremidos,
        altura: Math.round(v.getBoundingClientRect().height)
      };
    }, area);
    const ms = Date.now() - t0;
    const alerta = (!r.ativa || r.scrollH || r.fora || r.espremidos) ? '  <<<' : '';
    if (alerta) ruins++;
    console.log('  ' + area.padEnd(13), JSON.stringify(r), ms + 'ms' + alerta);
  }
  /* Com 120 atividades a área chegava a 21 mil pixels — umas 54 telas
     de rolagem no celular. Os grupos que não pedem ação começam
     recolhidos; isto vigia que continuem assim, e que a contagem
     apareça (recolher sem dizer quanto sobrou seria esconder). */
  if (rotulo === '390') {
    await vaiPara(p, 'activities');
    await p.waitForTimeout(900);
    const agenda = await p.evaluate(() => ({
      altura: Math.round(document.getElementById('view-activities').getBoundingClientRect().height),
      recolhidos: [...document.querySelectorAll('#activitiesList .mw-agenda-titulo[aria-expanded="false"]')]
        .map(t => t.querySelector('strong').textContent + '=' + t.querySelectorAll('span')[0].textContent),
      itensVisiveis: [...document.querySelectorAll('#activitiesList .list-item')].filter(e => e.offsetParent).length
    }));
    console.log('  agenda recolhida:', JSON.stringify(agenda));
    if (agenda.altura > 12000) { console.log('  <<< a área voltou a ser alta demais'); ruins++; }
    if (!agenda.recolhidos.length) { console.log('  <<< nenhum grupo recolhido com 120 atividades'); ruins++; }
    if (agenda.recolhidos.some(r => !/=\d+$/.test(r))) { console.log('  <<< grupo recolhido sem contagem'); ruins++; }
  }

  console.log('  ERROS JS:', erros.length ? erros : 'nenhum');
  if (erros.length) ruins++;
  await b.close();
}

console.log('\nACHADOS:', ruins);
process.exit(ruins ? 1 : 0);
