#!/usr/bin/env python3
"""Contraste, parte 2 de 2: medição.

Lê o que o 7-contraste-coleta.mjs colheu e calcula a razão de contraste
WCAG de cada texto contra o pixel que está realmente atrás dele.

Por que o pixel e não o CSS: as superfícies deste app são gradiente sobre
translucidez sobre gradiente. getComputedStyle devolve a declaração — que
pode ser 'transparent' — e não a cor que o olho recebe. Só a foto sabe.

Uso:
  python3 tools/testes/7-contraste-medir.py
Requer: Pillow (pip install pillow) e os JSON/PNG já coletados.
"""
import json, collections, re, os, sys
from PIL import Image

SAIDA = os.environ.get('MW_SAIDA') or os.path.join(os.getcwd(), 'tools/testes/saida')

def pixels(im):
    """getdata() está a caminho da remoção no Pillow 14, e
    get_flattened_data() não existe nas versões antigas. Isto funciona
    nas duas."""
    f = getattr(im, 'get_flattened_data', None)
    return f() if f else im.getdata()

def lum(c):
    f = lambda v: (v/255)/12.92 if v/255 <= 0.03928 else (((v/255)+0.055)/1.055)**2.4
    return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2])

def razao(a, b):
    L1, L2 = lum(a), lum(b)
    return (max(L1,L2)+.05) / (min(L1,L2)+.05)

def parse(c):
    n = [float(x) for x in re.findall(r'[\d.]+', c)]
    return tuple(int(x) for x in n[:3])

def invisivel(c):
    """Texto com alpha zero não é texto: é o rótulo do botão em estado
    "carregando", que fica transparente de propósito enquanto o giro roda no
    lugar dele. Medir contraste ali dá 3,3:1 contra o fundo do botão e
    reporta um defeito que não existe — parse() joga o alpha fora."""
    n = [float(x) for x in re.findall(r'[\d.]+', c)]
    return len(n) >= 4 and n[3] == 0

def fundo_proprio(im, box, fg):
    """Elemento com preenchimento próprio: o fundo é a cor mais comum do
    MIOLO da caixa, descartando as que são a cor do texto (e as muito
    próximas dela, que são antialiasing do glifo).

    Amostrar só as bordas não serve aqui: num botão arredondado, as
    linhas de cima e de baixo pegam os cantos, onde aparece o que está
    ATRÁS do botão — e o número sai errado para melhor."""
    x, y, w, h = box
    if w < 8 or h < 6: return None
    cx = im.crop((x+2, y+1, min(x+w-2, im.width), min(y+h-1, im.height)))
    cores = collections.Counter(pixels(cx))
    for c, _ in cores.most_common(12):
        if sum(abs(c[i]-fg[i]) for i in range(3)) > 90:
            return c
    return cores.most_common(1)[0][0] if cores else None

def fundo(im, box):
    """Texto sem preenchimento próprio: o fundo é o que está nas faixas
    imediatamente acima e abaixo da caixa."""
    x, y, w, h = box
    tiras = []
    if y-5 >= 0: tiras.append((x, max(0, y-5), min(x+w, im.width), y-1))
    if y+h+5 <= im.height: tiras.append((x, y+h+1, min(x+w, im.width), y+h+5))
    cores = collections.Counter()
    for t in tiras:
        if t[2]-t[0] < 3 or t[3]-t[1] < 1: continue
        cores.update(pixels(im.crop(t)))
    return cores.most_common(1)[0][0] if cores else None

total = 0
achou_arquivo = False
# Qualquer contraste-*.json que tenha sido colhido: o do app (por largura e
# tema) e o do Design System (contraste-ds-escuro/claro), sem precisar de uma
# lista fixa aqui que sai de sincronia com quem colhe.
import glob
for caminho in sorted(glob.glob(os.path.join(SAIDA, 'contraste-*.json'))):
        rotulo = os.path.basename(caminho)[len('contraste-'):-len('.json')]
        achou_arquivo = True
        d = json.load(open(caminho))
        falhas = []
        for bloco in d['saida']:
            if not os.path.exists(bloco['png']):
                # JSON de uma coleta anterior apontando para uma foto que já
                # não existe: medir o que sobrou daria um relatório parcial
                # com cara de completo.
                raise SystemExit('foto ausente: %s\n'
                                 'O JSON %s é de uma coleta antiga. Rode a coleta de novo.'
                                 % (bloco['png'], rotulo))
            im = Image.open(bloco['png']).convert('RGB')
            for c in bloco['cands']:
                if invisivel(c['cor']): continue
                fg = parse(c['cor'])
                bg = fundo_proprio(im, c['box'], fg) if c.get('pintado') else fundo(im, c['box'])
                if bg is None or fg == bg: continue
                r = razao(fg, bg)
                # WCAG AA: 4.5:1 no texto normal, 3.0:1 no texto grande
                grande = c['px'] >= 24 or (c['px'] >= 18.66 and c['peso'] >= 700)
                m = 3.0 if grande else 4.5
                if r < m:
                    falhas.append((bloco['v'], c['t'], round(r,2), round(c['px']), m, fg, bg))
        total += len(falhas)
        print(f"=== {rotulo}: {len(falhas)} falha(s) ===")
        for f in falhas[:14]:
            print(f"    {f[0]:<13} {f[1][:30]:<32} {f[2]:>5}:1 (mín {f[4]}) txt{f[5]} / bg{f[6]}")

if not achou_arquivo:
    print(f'Nada coletado em {SAIDA}. Rode antes o 7-contraste-coleta.mjs.')
    sys.exit(2)

print('\nTOTAL:', total)
sys.exit(1 if total else 0)
