#!/usr/bin/env node
// Gera os PNGs de ícone/favicon/PWA a partir do símbolo Klyne (o mesmo
// desenho de <symbol id="mwi-marca"> em index.html, viewBox 0 0 64 44),
// renderizando uma página HTML com o Chromium do Playwright e tirando um
// screenshot recortado — não há rsvg-convert/inkscape/imagemagick neste
// ambiente, então esta é a rota disponível para SVG -> PNG.
//
// Uso: node tools/gerar-icones.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..');

// O mesmo path do símbolo Klyne (mantém sincronizado à mão com
// index.html — são só dois <path>, risco baixo de desalinhar).
const SIMBOLO_SVG = (cor) => `
  <path d="M13 8V36" stroke="${cor}" stroke-width="8.5" stroke-linecap="square"/>
  <path d="M52 8 15 22 52 36" stroke="${cor}" stroke-width="8.5" stroke-linecap="square" stroke-linejoin="bevel"/>
`;

function pagina({ tamanho, escalaSimbolo, cor = '#5b6cff', fundo = '#020617' }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    .tile{width:${tamanho}px;height:${tamanho}px;background:${fundo};display:flex;align-items:center;justify-content:center}
    svg{width:${escalaSimbolo * 100}%}
  </style></head><body>
    <div class="tile"><svg viewBox="0 0 64 44" fill="none">${SIMBOLO_SVG(cor)}</svg></div>
  </body></html>`;
}

async function capturar(browser, { arquivo, tamanho, escalaSimbolo, cor, fundo }) {
  const p = await browser.newPage({ viewport: { width: tamanho, height: tamanho }, deviceScaleFactor: 1 });
  await p.setContent(pagina({ tamanho, escalaSimbolo, cor, fundo }));
  await p.locator('.tile').screenshot({ path: arquivo });
  await p.close();
  console.log('gerado:', path.relative(RAIZ, arquivo), `(${tamanho}x${tamanho})`);
}

const browser = await chromium.launch();

// "any": pode ocupar quase a tile inteira, a UI já dá a própria margem.
await capturar(browser, { arquivo: path.join(RAIZ, 'icon-192.png'), tamanho: 192, escalaSimbolo: 0.56 });
await capturar(browser, { arquivo: path.join(RAIZ, 'icon-512.png'), tamanho: 512, escalaSimbolo: 0.56 });

// "maskable": o SO recorta a tile em formas variadas (círculo, squircle...);
// a zona seguravel e ~80% central, entao o simbolo entra menor.
await capturar(browser, { arquivo: path.join(RAIZ, 'icon-192-maskable.png'), tamanho: 192, escalaSimbolo: 0.42 });
await capturar(browser, { arquivo: path.join(RAIZ, 'icon-512-maskable.png'), tamanho: 512, escalaSimbolo: 0.42 });

// apple-touch-icon: o iOS aplica a própria máscara de cantos — manda quadrado
// sem arredondar na mão.
await capturar(browser, { arquivo: path.join(RAIZ, 'apple-touch-icon.png'), tamanho: 180, escalaSimbolo: 0.56 });

await browser.close();
console.log('feito.');
