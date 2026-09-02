import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/* ---------------------------------------------------------------------------
   Base comum de todos os testes.

   Três coisas aqui não são detalhe: onde está o navegador, como a semente
   entra no localStorage, e como o boot é encerrado. Cada uma custou uma
   sessão inteira de depuração antes de virar esta função.
   --------------------------------------------------------------------------- */

export const ENDERECO = process.env.MW_URL || 'http://127.0.0.1:8795';
export const SAIDA = process.env.MW_SAIDA || path.join(process.cwd(), 'tools/testes/saida');

/* O Chromium desta máquina fica fora do node_modules (a imagem já traz um
   em /opt/pw-browsers). Se ele existir, usa; senão deixa o Playwright
   resolver sozinho, que é o que acontece numa máquina comum. */
export function achaNavegador(){
  if (process.env.MW_CHROME) return process.env.MW_CHROME;
  const raiz = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const pasta = fs.readdirSync(raiz)
      .filter(n => /^chromium-\d+$/.test(n))
      .sort().pop();
    if (pasta){
      const alvo = path.join(raiz, pasta, 'chrome-linux', 'chrome');
      if (fs.existsSync(alvo)) return alvo;
    }
  } catch(e){}
  return undefined;   // undefined = "acha você mesmo"
}

export function pastaSaida(){
  fs.mkdirSync(SAIDA, { recursive: true });
  return SAIDA;
}

/**
 * Abre o app já logado, com os dados que o teste quiser, e devolve
 * { navegador, pagina, erros }.
 *
 * @param dados   o objeto que vira localStorage['mateusWorkspaceV4']
 * @param opcoes  { viewport, contexto, debug }
 */
export async function abre(dados, opcoes = {}) {
  const executablePath = achaNavegador();
  const b = await chromium.launch(executablePath ? { executablePath } : {});
  const p = await b.newPage({
    viewport: opcoes.viewport || { width: 1280, height: 900 },
    ...(opcoes.contexto || {})
  });

  const erros = [];
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  p.on('console', m => {
    const t = m.text();
    /* Erro de rede não é erro do app: o proxy desta máquina barra o
       Supabase, e o app já trata isso. O que interessa é exceção de JS. */
    if (m.type() === 'error' && !/ERR_TUNNEL|ERR_PROXY|Failed to load resource|net::/.test(t))
      erros.push('console: ' + t);
  });

  /* Semear ANTES da primeira navegação, não depois.
     Se semear depois e recarregar, o persistWorkspace() do beforeunload
     da página anterior grava a cópia velha em memória por cima do que
     acabou de ser semeado. */
  await p.addInitScript(([d]) => {
    /* O app faz UMA limpeza total do localStorage por navegador, marcada
       por chave própria. Num perfil novo — que é o que todo teste usa —
       ela sempre dispara e apaga a semente antes de o app ler. Marcar
       como já feita é o que um navegador de verdade já traria. */
    localStorage.setItem('mwZerarTudo-2026-08-e', '1');
    /* addInitScript roda em TODA navegação: sem esta guarda, um reload
       dentro do teste apagaria o que o próprio teste acabou de gravar. */
    if (localStorage.getItem('mateusWorkspaceV4') === null) {
      localStorage.setItem('mateusWorkspaceV4', JSON.stringify(d));
    }
    localStorage.setItem('mwSession', '1');
  }, [dados]);

  await p.goto(ENDERECO + '/index.html');

  if (opcoes.debug) {
    const semeado = await p.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('mateusWorkspaceV4')).profile?.name; }
      catch(e){ return 'ERRO'; }
    });
    console.log('[semente logo após o goto]', semeado);
  }

  /* O boot é sequencial de propósito (sair-depois-entrar, sem flash
     branco). 2,6s é o tempo em que ele termina; abaixo disso o teste
     mede a tela de carregamento em vez do app. */
  await p.waitForTimeout(2600);
  await p.evaluate(() => {
    document.getElementById('mwBootLoader')?.remove();
    const l = document.getElementById('loginScreen'); if (l) l.style.display = 'none';
    const a = document.getElementById('app');
    if (a) { a.style.display = ''; a.hidden = false; a.classList.remove('hidden'); }
    document.documentElement.classList.add('mw-login-pronto');
  });
  await p.waitForTimeout(300);

  return { b, p, erros };
}

/* Todas as áreas navegáveis, na ordem em que aparecem na navegação. */
export const AREAS = ['home','college','institutions','subjects','projects','activities',
                      'calendar','focus','reports','notes','files','settings','support','profile'];

export async function vaiPara(p, area){
  await p.evaluate(nome => {
    const bt = document.querySelector(`#nav button[data-view="${nome}"]`);
    if (bt) bt.click();
    else if (nome === 'profile') document.getElementById('profileBtn')?.click();
    else if (window.showView) window.showView(nome);
  }, area);
}

/**
 * Espera a área parar de se mexer antes de medir.
 *
 * Existe porque o teste de contraste falhou uma vez em quatro num texto
 * do Suporte, medindo branco sobre cinza-claro — cor que não existe no
 * tema escuro. O culpado é fotografar durante a animação de entrada: o
 * pixel amostrado é um quadro intermediário, e o número sai inventado.
 * Um tempo fixo maior não resolve, só torna a falha mais rara.
 *
 * getAnimations() cobre transição de CSS e animação de CSS, que é o que
 * este app usa. O teto de 1200ms é para não travar numa animação
 * infinita (o pulso do status "online", por exemplo).
 */
export async function esperaParar(p, seletor, teto = 1200){
  await p.evaluate(async ([sel, teto]) => {
    const alvo = document.querySelector(sel);
    if (!alvo || !document.getAnimations) return;
    const limite = Date.now() + teto;
    while (Date.now() < limite){
      const correndo = document.getAnimations()
        .filter(a => a.playState === 'running'
                  && a.effect && a.effect.target
                  && alvo.contains(a.effect.target)
                  /* animação sem fim não é transição de entrada: ignora */
                  && (a.effect.getComputedTiming().iterations || 1) !== Infinity);
      if (!correndo.length) return;
      await new Promise(r => requestAnimationFrame(r));
    }
  }, [seletor, teto]);
}

/* Um PNG de 1x1 válido, para os testes que precisam de um arquivo real. */
export const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
