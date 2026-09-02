/* Teste da tela de LOGIN e CADASTRO — o "antes e depois" da migração.
 *
 * Esta tela é diferente de todas as outras do app em duas coisas, e as
 * duas mudam o que o teste tem de fazer.
 *
 * A primeira: ela está FORA do `#app`. O `ajuda.abre()` existe para
 * pular justamente esta parte — ele semeia `mwSession` e esconde o
 * `#loginScreen`. Aqui é o contrário: o teste tem de parar nela.
 *
 * A segunda: é a única tela cujo defeito TRANCA a pessoa do lado de
 * fora. Um cartão quebrado em Relatórios é feio; um botão de entrar que
 * não responde é o fim da linha. Por isso o teste cobre o caminho
 * inteiro — criar conta, sair, entrar de novo — e não só a aparência.
 *
 * Uso: node tools/testes/17-login.mjs
 */
import { chromium } from 'playwright';
import { ENDERECO, achaNavegador } from './ajuda.mjs';

const executablePath = achaNavegador();
const b = await chromium.launch(executablePath ? { executablePath } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });

const erros = [];
p.on('pageerror', e => erros.push('pageerror: ' + e.message));
p.on('console', m => {
  const t = m.text();
  if (m.type() === 'error' && !/ERR_TUNNEL|ERR_PROXY|Failed to load resource|net::/.test(t))
    erros.push('console: ' + t);
});

/* Sem `mwSession`: é o que faz o app parar na tela de login. A chave de
   zerar tudo continua marcada — num perfil novo ela dispararia e
   apagaria a semente antes de o app ler. */
await p.addInitScript(() => {
  localStorage.setItem('mwZerarTudo-2026-08-e', '1');
});
await p.goto(ENDERECO + '/index.html');
await p.waitForTimeout(2800);

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(50), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};

console.log('=== login e cadastro ===');

/* ---- 1. a tela está lá, e o app não ------------------------------------ */
const inicio = await p.evaluate(() => {
  const l = document.getElementById('loginScreen');
  const a = document.getElementById('app');
  const vis = e => { if (!e) return false; const c = getComputedStyle(e);
    return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .05; };
  return {
    login: vis(l),
    app: vis(a),
    boot: !!document.getElementById('mwBootLoader'),
    alturaCartao: Math.round((document.getElementById('authScene')?.offsetHeight) || 0)
  };
});
ok('a tela de login aparece', inicio.login, inicio);
ok('e o app não aparece atrás dela', !inicio.app, inicio);
ok('o boot já terminou', !inicio.boot, inicio);

/* ---- 2. trocar entre Entrar e Criar ------------------------------------ */
const vis = async id => p.evaluate(x => {
  const e = document.getElementById(x);
  if (!e) return { existe: false };
  const r = e.getBoundingClientRect();
  const c = getComputedStyle(e);
  return { existe: true, largura: Math.round(r.width), opacidade: +c.opacity,
           mostrando: r.width > 40 && +c.opacity > .5 };
}, id);

const paraCriar = await p.evaluate(() => {
  const bt = document.querySelector('#loginScreen [data-view="signup"]');
  if (!bt) return false; bt.click(); return true;
});
await p.waitForTimeout(700);
const criar = await vis('inlineCreateForm');
ok('o botão "Criar" leva ao formulário de cadastro', paraCriar && criar.mostrando, criar);

const voltaEntrar = await p.evaluate(() => {
  const bt = document.querySelector('#inlineCreateForm [data-switch="signin"]');
  if (!bt) return false; bt.click(); return true;
});
await p.waitForTimeout(700);
const entrar = await vis('mwLoginForm');
ok('o link "Entrar." volta para o formulário de entrada', voltaEntrar && entrar.mostrando, entrar);

/* ---- 3. todo campo tem rótulo e altura de toque ------------------------- */
const campos = await p.evaluate(() => {
  const fora = [];
  for (const e of document.querySelectorAll('#mwLoginForm input, #inlineCreateForm input')) {
    if (e.id === 'newWebsite') continue;          /* armadilha de robô: invisível de propósito */
    const r = e.getBoundingClientRect();
    const rot = !!document.querySelector('label[for="' + e.id + '"]');
    /* Campo de etapa escondida mede 0: só interessa o que está na tela. */
    if (!r.height) { if (!rot) fora.push({ id: e.id, motivo: 'sem rótulo' }); continue; }
    if (!rot) fora.push({ id: e.id, motivo: 'sem rótulo' });
    if (r.height < 36) fora.push({ id: e.id, motivo: 'baixo demais', alt: Math.round(r.height) });
  }
  return fora;
});
ok('todo campo tem rótulo e altura de toque', !campos.length, campos);

/* ---- 4. mostrar/ocultar a senha ---------------------------------------- */
const olho = await p.evaluate(() => {
  const c = document.getElementById('password');
  const bt = document.getElementById('togglePassword');
  if (!c || !bt) return { existe: false };
  const antes = c.type; bt.click(); const depois = c.type; bt.click();
  return { existe: true, antes, depois, voltou: c.type === antes };
});
ok('o botão do olho mostra e volta a ocultar a senha',
   olho.existe && olho.antes === 'password' && olho.depois === 'text' && olho.voltou, olho);

/* ---- 5. o cadastro em três etapas -------------------------------------- */
await p.evaluate(() => document.querySelector('#loginScreen [data-view="signup"]').click());
await p.waitForTimeout(650);

const etapa = () => p.evaluate(() => {
  const vistas = [...document.querySelectorAll('#inlineCreateForm .mw-etapa')]
    .filter(e => !e.hidden && e.getBoundingClientRect().height > 0)
    .map(e => e.dataset.etapa);
  const marcado = [...document.querySelectorAll('#mwPassos li')]
    .filter(e => e.getAttribute('aria-current') === 'step').map(e => e.dataset.passo);
  return { vistas, marcado };
});
const e1 = await etapa();
ok('o cadastro começa na etapa 1', e1.vistas.join() === '1' && e1.marcado.join() === '1', e1);

const avanca = n => p.evaluate(x => {
  const bt = document.querySelector('#inlineCreateForm .mw-etapa:not([hidden]) [data-vai="' + x + '"]');
  if (!bt) return false; bt.click(); return true;
}, n);

/* A etapa 1 valida antes de avançar: sem usuário e e-mail ela não sai do
   lugar, e isso é comportamento, não defeito. */
await p.evaluate(() => {
  const u = document.getElementById('newUsername'), e = document.getElementById('newEmail');
  u.value = 'teste.mw'; u.dispatchEvent(new Event('input', { bubbles: true }));
  e.value = 'teste.mw@exemplo.com'; e.dispatchEvent(new Event('input', { bubbles: true }));
});
await avanca(2); await p.waitForTimeout(500);
const e2 = await etapa();
ok('preenchida a etapa 1, ela avança para a 2', e2.vistas.join() === '2' && e2.marcado.join() === '2', e2);

/* ---- 6. a força da senha reage ao que se digita ------------------------- */
const forca = await p.evaluate(async () => {
  const c = document.getElementById('newPass');
  const txt = document.getElementById('mwForcaTexto');
  const barra = document.getElementById('mwForcaBarra');
  const leia = async v => {
    c.value = v; c.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 160));
    return { txt: (txt.textContent || '').trim(),
             larg: Math.round(barra.getBoundingClientRect().width) };
  };
  return { fraca: await leia('123'), media: await leia('Senha123'),
           forte: await leia('S3nh4-muito-Long4-e-boa!') };
});
ok('a barra de força cresce conforme a senha melhora',
   forca.fraca.larg < forca.media.larg && forca.media.larg < forca.forte.larg, forca);
ok('e cada nível tem nome escrito',
   [forca.fraca, forca.media, forca.forte].every(x => x.txt.length > 2), forca);

/* ---- 7. senha e confirmação têm de bater ------------------------------- */
await p.evaluate(() => {
  const a = document.getElementById('newPass'), b2 = document.getElementById('newPass2');
  a.value = 'S3nh4-muito-Long4-e-boa!'; a.dispatchEvent(new Event('input', { bubbles: true }));
  b2.value = 'outra-coisa'; b2.dispatchEvent(new Event('input', { bubbles: true }));
});
await avanca(3); await p.waitForTimeout(450);
await p.evaluate(() => document.getElementById('inlineCreateForm')
  .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
await p.waitForTimeout(700);
const naoBate = await p.evaluate(() => ({
  erro: (document.getElementById('inlineCreateError').textContent || '').trim(),
  criou: !!localStorage.getItem('mwSession')
}));
ok('senha e confirmação diferentes não criam conta', !naoBate.criou && naoBate.erro.length > 3, naoBate);

/* ---- 8. o campo-armadilha barra o robô em silêncio ---------------------- */
const robo = await p.evaluate(async () => {
  document.getElementById('newPass2').value = document.getElementById('newPass').value;
  document.getElementById('newWebsite').value = 'http://spam.exemplo';
  document.getElementById('inlineCreateForm')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 800));
  return { criou: !!localStorage.getItem('mwSession') };
});
ok('o campo-armadilha impede o cadastro de um robô', !robo.criou, robo);

/* ---- 9. o caminho inteiro: criar conta, sair, entrar de novo ------------ */
const ciclo = await p.evaluate(async () => {
  document.getElementById('newWebsite').value = '';
  document.getElementById('inlineCreateForm')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 1400));
  const contas = localStorage.getItem('mwContas') || localStorage.getItem('mwUsers') || '';
  return {
    sessao: !!localStorage.getItem('mwSession'),
    sucesso: !document.getElementById('signupSuccess')?.classList.contains('hidden'),
    guardou: /teste\.mw/.test(contas) || /teste\.mw/.test(localStorage.getItem('mateusWorkspaceV4') || '')
  };
});
ok('criar conta pela interface chega ao fim', ciclo.sessao || ciclo.sucesso, ciclo);

/* Sair e voltar: o teste recarrega sem a sessão e tenta entrar com a
   conta que acabou de criar. É o que prova que o cadastro gravou algo
   que o login consegue ler — as duas metades do mesmo par. */
await p.evaluate(() => localStorage.removeItem('mwSession'));
await p.reload();
await p.waitForTimeout(2800);
const reentrada = await p.evaluate(async () => {
  const u = document.getElementById('username'), s = document.getElementById('password');
  if (!u || !s) return { campos: false };
  u.value = 'teste.mw'; u.dispatchEvent(new Event('input', { bubbles: true }));
  s.value = 'S3nh4-muito-Long4-e-boa!'; s.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('loginButton').click();
  await new Promise(r => setTimeout(r, 1800));
  const a = document.getElementById('app');
  const vis = a && getComputedStyle(a).display !== 'none';
  return { campos: true, sessao: !!localStorage.getItem('mwSession'), app: !!vis,
           status: (document.getElementById('status').textContent || '').trim().slice(0, 50) };
});
ok('e a conta criada consegue entrar', reentrada.sessao && reentrada.app, reentrada);

/* ---- 10. recuperação de senha abre ------------------------------------- */
await p.evaluate(() => { localStorage.removeItem('mwSession'); });
await p.reload();
await p.waitForTimeout(2800);
const recupera = await p.evaluate(async () => {
  document.getElementById('forgotPasswordLink').click();
  await new Promise(r => setTimeout(r, 700));
  const o = document.getElementById('otpOverlay');
  return { abriu: o && !o.classList.contains('hidden'),
           titulo: (document.getElementById('otpTitle')?.textContent || '').trim() };
});
ok('"Esqueci minha senha" abre a recuperação', recupera.abriu, recupera);
await p.evaluate(() => document.getElementById('otpCancelMethod')?.click());
await p.waitForTimeout(400);

/* ---- 11. entrada social honesta ---------------------------------------- */
const social = await p.evaluate(() => {
  const bts = [...document.querySelectorAll('#loginScreen [data-social]')];
  return { quantos: bts.length,
           todosDesligados: bts.every(x => x.disabled),
           nota: (document.querySelector('.mw-social-nota')?.textContent || '').trim() };
});
ok('os botões de entrada social continuam desligados e avisados',
   social.quantos >= 2 && social.todosDesligados && /em breve/i.test(social.nota), social);

/* ---- 12. nada vaza, em três larguras e dois temas ---------------------- */
for (const [rot, larg, alt] of [['desktop', 1280, 900], ['tablet', 834, 1000], ['celular', 390, 780]]) {
  for (const tema of ['escuro', 'claro']) {
    await p.setViewportSize({ width: larg, height: alt });
    await p.evaluate(t => {
      document.body.classList.toggle('light', t === 'claro');
      document.documentElement.setAttribute('data-ds-tema', t);
    }, tema);
    await p.waitForTimeout(600);
    const m = await p.evaluate(() => {
      const v = document.getElementById('loginScreen');
      const rola = e => { let n = e.parentElement;
        while (n && n !== document.body) { const o = getComputedStyle(n).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; n = n.parentElement; } return false; };
      const fora = [...v.querySelectorAll('*')].filter(e => {
        /* Dentro de um <svg>, quem recorta é o viewport do próprio SVG, e
           isso não aparece como overflow-x em ancestral nenhum. */
        if (e.ownerSVGElement) return false;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return !rola(e) && (r.right > innerWidth + 1 || r.left < -1);
      }).map(e => (e.className || e.tagName).toString().slice(0, 30));
      const cartao = document.getElementById('authScene');
      const c = cartao ? cartao.getBoundingClientRect() : { width: 0, height: 0 };
      return { fora, corpoRola: document.documentElement.scrollWidth > innerWidth + 1,
               cartao: { l: Math.round(c.width), a: Math.round(c.height) } };
    });
    ok('o cartão cabe e nada vaza · ' + rot + ' ' + tema,
       !m.fora.length && !m.corpoRola && m.cartao.l > 240 && m.cartao.a > 240, m);
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
