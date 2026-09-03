/* Teste 22 — a cor de destaque alcança TODA peça que se diz de destaque.
 *
 * Por que este teste existe, e por que o 21 não bastava.
 *
 * O 21 mede a ORIGEM: as seis sementes são distintas, `--id-ac` segue a
 * semente, o item ativo da lateral tem seis aparências. Tudo isso passou
 * verde enquanto o botão "Salvar perfil" do Perfil saía CIANO → AZUL com
 * o resto da tela em violeta. A origem estava certa; o que falhava era o
 * DESTINO — uma regra legada pegava o botão pelo id, com !important, e
 * pintava uma cor fixa de outra época.
 *
 * O id é a única brecha por onde a folha velha ainda alcança marcação
 * nova: o isolamento do sistema é feito de NOMES (`ds-*`), e um id não é
 * um nome do sistema. Medido no dia em que este arquivo foi escrito, 169
 * elementos do sistema ainda eram alcançados por regra legada pelo
 * próprio id. Alcançar não é vencer — mas basta uma vencer para o §2
 * quebrar numa tela, e ninguém saber.
 *
 * O que se mede aqui: para cada peça que o sistema DECLARA como de
 * acento (botão primário, item ativo da navegação, selo de acento), a cor
 * tem que mudar quando o acento muda. Uma peça que fica idêntica nas seis
 * cores está pintada por outra pessoa.
 *
 * Uso: node tools/testes/22-acento-alcanca.mjs
 */
import { abre, vaiPara, esperaParar } from './ajuda.mjs';

const CORES = ['indigo', 'ciano', 'violeta', 'verde', 'ambar', 'rosa'];

/* Todas as áreas já reconstruídas no sistema. Vale medir as catorze e não
   só as quatro que eu estava olhando na hora: o defeito que originou este
   teste estava numa tela, e o mesmo defeito estava em OUTRA (o "Salvar
   organização" da Faculdade) — achado pelo próprio teste, não por mim.
   Uma área sem peça de acento é dita em voz alta, para que "nenhum
   achado" nunca queira dizer "nada foi medido". */
const AREAS = ['home', 'profile', 'settings', 'college', 'institutions',
               'subjects', 'projects', 'activities', 'notes', 'files',
               'calendar', 'focus', 'reports', 'support'];

/* Peças que o Design System declara como portadoras do acento. A lista é
   curta de propósito: um botão fantasma é neutro POR DESIGN, e cobrá-lo
   de mudar de cor seria inventar um defeito. */
const PECAS = [
  '.ds-btn-primario',
  '.ds-nav-item.active',
  '.ds-selo-acento',
  '.ds-perfil-visib[data-estado="publico"]'
];
/* Fora da lista, de propósito: `.ds-aba[aria-selected="true"]`.
   A primeira versão deste teste a incluiu e acusou a aba escolhida do
   Perfil em quatro medições. Fui olhar a folha: o estado escolhido de um
   controle segmentado é uma SUPERFÍCIE LEVANTADA (`--mw-sup-1` mais
   sombra), não uma pastilha colorida — decisão do sistema, tomada antes
   desta rodada. A aba não se declara peça de acento, então cobrá-la de
   mudar de cor era o teste inventando um defeito. Um achado que a leitura
   da folha desmente é defeito da régua. */

const SEMENTE = {
  subjects: [{ name: 'Cálculo I', description: 'Limites', progress: 62, semester: 1 }],
  projects: [{ name: 'TCC', description: 'Plataforma', status: 'Em andamento' }],
  activities: [{ name: 'Lista 4', date: '2030-01-01', priority: 'Alta' }],
  notes: [], institutions: [],
  profile: { name: 'Mateus Souza', username: 'mateuswzn', bio: 'Estudo.', links: [], visibility: {} },
  college: { institution: 'UFPA', course: 'Engenharia', semester: 5, area: '' },
  theme: 'dark'
};

const { b, p, erros } = await abre(SEMENTE, { viewport: { width: 1280, height: 900 } });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(50), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

console.log('=== a cor de destaque alcança as peças de destaque ===');

for (const tema of ['escuro', 'claro']) {
  await p.evaluate(t => {
    document.body.classList.toggle('light', t === 'claro');
    document.documentElement.setAttribute('data-ds-tema', t);
  }, tema);

  for (const area of AREAS) {
    await vaiPara(p, area);
    await p.waitForTimeout(600);
    await esperaParar(p, '#view-' + area);

    /* Uma leitura por cor, guardando a APARÊNCIA de cada peça. A peça é
       identificada por um caminho estável (id, ou tag + posição), para
       que as seis leituras falem do mesmo elemento. */
    const leituras = {};
    for (const cor of CORES) {
      leituras[cor] = await p.evaluate(async ({ a, sel }) => {
        document.documentElement.setAttribute('data-acento', a);
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => requestAnimationFrame(r));
        const v = document.getElementById('view-' + sel.area);
        const alvos = [...v.querySelectorAll(sel.pecas.join(','))]
          .filter(e => e.offsetWidth > 0 && e.offsetHeight > 0);
        return alvos.map((e, i) => {
          const cs = getComputedStyle(e);
          return {
            chave: (e.id || e.tagName + '#' + i) + '·' + (e.className || '').toString().slice(0, 30),
            /* As três propriedades por onde um acento chega. Guardadas
               juntas porque uma peça pode carregar a cor no degradê e
               outra no texto — e comparar só uma delas deixaria passar
               metade dos defeitos. */
            visual: cs.backgroundImage + '|' + cs.backgroundColor + '|' + cs.color + '|' + cs.borderColor
          };
        });
      }, { a: cor, sel: { area, pecas: PECAS } });
    }

    /* Nenhuma peça na área é um resultado legítimo (a tela pode não ter
       botão primário); só não pode passar despercebido. */
    const quantas = leituras[CORES[0]].length;
    if (!quantas) { console.log('  ' + (area + ' · ' + tema).padEnd(50), '— sem peça de acento'); continue; }

    const presas = [];
    for (let i = 0; i < quantas; i++) {
      const vistas = new Set(CORES.map(c => (leituras[c][i] || {}).visual));
      if (vistas.size === 1) presas.push(leituras[CORES[0]][i].chave);
    }
    ok(area + ' · ' + tema + ' · ' + quantas + ' peça(s) seguem o acento',
       !presas.length, { presas });
  }
}

await p.evaluate(() => {
  document.body.classList.remove('light');
  document.documentElement.setAttribute('data-ds-tema', 'escuro');
  document.documentElement.setAttribute('data-acento', 'indigo');
});

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
