#!/usr/bin/env python3
"""Quais folhas legadas pintam uma área — e quanto cada uma pesa.

Antes de migrar uma área para o Design System é preciso saber o que a
pinta hoje. Num arquivo com 126 blocos de estilo e seis peles
sobrepostas, essa resposta não cabe na cabeça de ninguém.

O que o script faz: percorre os <style> do index.html, quebra em regras,
e conta quantas alcançam a área pedida — por #view-<area>, por um id ou
classe que só existe dentro dela, ou por um seletor amplo que a atinge de
raspão. Reporta também quantas dessas regras usam !important, porque é
esse número que decide se `all: unset` resolve ou se a regra legada
precisa ser apagada.

Uso:
  python3 tools/ds/dependencias.py subjects
  python3 tools/ds/dependencias.py --areas          lista as áreas
"""
import re, sys, os, collections

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARQ = os.path.join(RAIZ, 'index.html')


def blocos_de_estilo(html):
    """(id do bloco, corpo) para cada <style>."""
    for m in re.finditer(r'<style([^>]*)>(.*?)</style>', html, re.S):
        ident = re.search(r'id="([^"]+)"', m.group(1))
        yield (ident.group(1) if ident else '(sem id)'), m.group(2)


def regras(css):
    """Cada (seletor, corpo). Ignora @media/@supports como envelope: o que
    interessa é o seletor de dentro, e ele aparece na varredura mesmo
    assim porque a chave de abertura da at-rule não tem ':' nem '.'."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel = ' '.join(m.group(1).split())
        if not sel or sel.startswith('@'):
            continue
        yield sel, m.group(2)


def areas_do_app(html):
    return sorted(set(re.findall(r'id="view-([a-z-]+)"', html)))


def alcanca(sel, area, marcas):
    """A regra pode pintar algo dentro desta área?"""
    if ('#view-' + area) in sel:
        return 'direto'
    # id ou classe que só existe dentro desta área
    for marca in marcas:
        if marca in sel:
            return 'por marca'
    # seletor amplo: pega qualquer coisa dentro de #app
    if re.search(r'(^|[\s,>])(\*|body|#app|\.view|\.card|\.list-item|\.section|\.small-btn|\.save-btn|\.add-btn|\.form-field|\.settings-group)\b', sel):
        return 'de raspão'
    return None


def marcas_da_area(html, area):
    """ids e classes que aparecem DENTRO do <section id="view-area"> e em
    nenhuma outra área — são o que identifica a área para o CSS."""
    m = re.search(r'<section[^>]*id="view-%s"' % re.escape(area), html)
    if not m:
        return set()
    ini = m.start()
    # até o próximo <section class="view"
    prox = re.search(r'<section class="view"', html[ini + 10:])
    fim = ini + 10 + prox.start() if prox else len(html)
    dentro = html[ini:fim]
    fora = html[:ini] + html[fim:]
    marcas = set()
    for ident in set(re.findall(r'id="([A-Za-z][\w-]*)"', dentro)):
        if ('id="%s"' % ident) not in fora:
            marcas.add('#' + ident)
    for m2 in re.finditer(r'class="([^"{}]+)"', dentro):
        for c in m2.group(1).split():
            if c.startswith('mw-') and ('class="%s"' % c) not in fora and (' ' + c + ' ') not in fora:
                marcas.add('.' + c)
    return marcas


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    html = open(ARQ, encoding='utf-8').read()
    if sys.argv[1] == '--areas':
        print('áreas:', ', '.join(areas_do_app(html)))
        return 0

    area = sys.argv[1]
    if area not in areas_do_app(html):
        print('não existe #view-%s. Áreas: %s' % (area, ', '.join(areas_do_app(html))))
        return 2

    marcas = marcas_da_area(html, area)
    print('=== dependências de CSS da área "%s" ===' % area)
    print('marcas exclusivas encontradas: %d' % len(marcas))
    print()

    por_bloco = collections.OrderedDict()
    for nome, css in blocos_de_estilo(html):
        conta = collections.Counter()
        importantes = 0
        exemplos = []
        for sel, corpo in regras(css):
            como = alcanca(sel, area, marcas)
            if not como:
                continue
            conta[como] += 1
            if '!important' in corpo:
                importantes += 1
            if como != 'de raspão' and len(exemplos) < 3:
                exemplos.append(sel[:88])
        if conta:
            por_bloco[nome] = (conta, importantes, exemplos)

    if not por_bloco:
        print('nenhuma regra alcança esta área — ela já está livre do legado.')
        return 0

    ordem = sorted(por_bloco.items(),
                   key=lambda x: -(x[1][0]['direto'] * 10 + x[1][0]['por marca'] * 5 + x[1][0]['de raspão']))
    tot_d = tot_m = tot_r = tot_i = 0
    print('%-40s %7s %7s %8s %6s' % ('bloco <style>', 'direto', 'marca', 'raspão', '!imp'))
    print('-' * 74)
    for nome, (conta, imp, exemplos) in ordem:
        print('%-40s %7d %7d %8d %6d' % (nome[:40], conta['direto'], conta['por marca'], conta['de raspão'], imp))
        tot_d += conta['direto']; tot_m += conta['por marca']; tot_r += conta['de raspão']; tot_i += imp
    print('-' * 74)
    print('%-40s %7d %7d %8d %6d' % ('TOTAL', tot_d, tot_m, tot_r, tot_i))

    print('\n-- os blocos que mais pesam, com exemplo de seletor --')
    for nome, (conta, imp, exemplos) in ordem[:6]:
        alvo = conta['direto'] + conta['por marca']
        if not alvo:
            continue
        print('\n  %s  (%d regras específicas, %d com !important)' % (nome, alvo, imp))
        for e in exemplos:
            print('      ' + e)

    print('\n-- leitura --')
    print('  "direto"   pinta #view-%s explicitamente; sai junto com a área.' % area)
    print('  "marca"    usa um id/classe que só existe aqui; idem.')
    print('  "raspão"   seletor amplo (.card, #app, .view...) que pega esta e outras áreas.')
    print('             Estas NÃO podem ser apagadas: precisam do escopo restrito às')
    print('             áreas ainda não migradas, ou do desligamento por :where() da')
    print('             subárvore migrada (ver ds/LEIAME.md).')
    if tot_i:
        print('\n  %d regras usam !important. Onde `all: unset` não vencer, a saída é' % tot_i)
        print('  apagar a regra legada — nunca empilhar outra por cima.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
