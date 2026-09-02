/* Boot: mede a luminância do centro da tela quadro a quadro durante a
   abertura. O que este teste procura é o flash branco — o quadro em que
   o navegador pinta a página em branco antes de o CSS chegar. Zero
   quadros acima de 180 é a aprovação.

   Este teste NÃO usa ajuda.abre(): ele precisa observar justamente a
   parte que o abre() pula.

   Uso: node tools/testes/4-boot.mjs */
import { chromium } from 'playwright';
import { achaNavegador, ENDERECO } from './ajuda.mjs';

const semente = {
  subjects:[{ name:'Cálculo I', description:'', progress:40 }], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus', email:'m@x.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'UFPA', course:'Eng', area:'', semester:5 }, theme:'dark'
};

const exe = achaNavegador();
let ruins = 0;

for (const [rotulo, logado] of [['sem sessão (login)', false], ['com sessão (app)', true]]) {
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load|net::/.test(t)) erros.push('console: ' + t); });

  await p.addInitScript(([d, ses]) => {
    localStorage.setItem('mwZerarTudo-2026-08-e', '1');
    localStorage.setItem('mateusWorkspaceV4', JSON.stringify(d));
    if (ses) localStorage.setItem('mwSession', '1');
  }, [semente, logado]);

  /* waitUntil:'commit' devolve o controle assim que o primeiro byte
     chega — antes disso não há o que fotografar. */
  const amostras = [];
  const t0 = Date.now();
  await p.goto(ENDERECO + '/index.html', { waitUntil: 'commit' });
  for (let i = 0; i < 26; i++) {
    try { amostras.push({ ms: Date.now() - t0, png: await p.screenshot({ clip: { x:150, y:380, width:60, height:60 } }) }); }
    catch(e) {}
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(1200);

  /* A média do recorte é calculada dentro do próprio navegador: é o
     único decodificador de PNG disponível aqui sem dependência extra. */
  const claros = [];
  for (const a of amostras) {
    const media = await p.evaluate(async (b64) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let r = 0, g = 0, bl = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; bl += d[i+2]; }
      const n = d.length / 4;
      return [Math.round(r/n), Math.round(g/n), Math.round(bl/n)];
    }, a.png.toString('base64'));
    claros.push({ ms: a.ms, luz: Math.round((media[0] + media[1] + media[2]) / 3) });
  }
  const brancos = claros.filter(c => c.luz > 180);

  const estado = await p.evaluate(() => ({
    loaderPresente: !!document.getElementById('mwBootLoader'),
    loginVisivel: (() => { const l = document.getElementById('loginScreen'); if (!l) return false;
      const r = l.getBoundingClientRect(); return getComputedStyle(l).display !== 'none' && r.height > 10; })(),
    appVisivel: (() => { const a = document.getElementById('app'); if (!a) return false;
      const r = a.getBoundingClientRect(); return getComputedStyle(a).display !== 'none' && r.height > 10; })()
  }));

  console.log('\n--- ' + rotulo);
  console.log('  luminância do centro (ms:luz):', claros.map(c => c.ms + ':' + c.luz).join(' '));
  console.log('  quadros quase brancos (>180):', brancos.length);
  console.log('  estado final:', JSON.stringify(estado));
  console.log('  ERROS:', erros.length ? erros : 'nenhum');

  /* Sem sessão termina no login; com sessão termina no app. Qualquer
     outro desfecho é regressão do boot. */
  const certo = logado ? (estado.appVisivel && !estado.loginVisivel) : estado.loginVisivel;
  if (!certo) { console.log('  <<< desfecho errado do boot'); ruins++; }
  if (brancos.length) { console.log('  <<< flash branco'); ruins++; }
  if (erros.length) ruins++;
  await b.close();
}

console.log('\nACHADOS:', ruins);
process.exit(ruins ? 1 : 0);
