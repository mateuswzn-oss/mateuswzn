#!/usr/bin/env python3
"""Restringe as regras legadas que ainda vencem dentro de uma área migrada.

O `quem-vence.mjs` diz QUAIS regras ainda pintam a área depois da
migração. As que sobram são sempre do mesmo tipo: seletor amplo, por
elemento (`#app input`) ou por id (`#app #saveProfile`), quase sempre
com `!important`. O desligamento por `:where()` não as alcança — ele
mira nomes de classe, e estas não usam classe nenhuma.

O protocolo diz o que fazer: **restringir o seletor legado**, nunca
empilhar outra regra por cima. Este script faz isso mecanicamente,
acrescentando `:not([data-mw-migrada] *)` a cada parte do seletor. A
regra continua valendo em todas as áreas que ainda não migraram e para
na porta das que migraram.

Uso:
    MW_JSON=1 node tools/ds/quem-vence.mjs profile escuro > /tmp/a.json
    python3 tools/ds/restringe.py /tmp/a.json            # mostra o que faria
    python3 tools/ds/restringe.py /tmp/a.json --aplicar  # edita o index.html

Depois: rodar o quem-vence de novo. O número tem de cair.
"""
import io
import json
import re
import sys

# Duas guardas, não uma. A primeira versão só tinha a de DESCENDENTE, e
# ela não alcança a regra que mira a RAIZ da área — `#loginScreen{...}`,
# por exemplo. A raiz é quem carrega o atributo, e um elemento não é
# descendente de si mesmo: o seletor continuava valendo, e o quem-vence
# continuava acusando a mesma regra depois de "restringida".
GUARDA = ':not([data-mw-migrada]):not([data-mw-migrada] *)'
ARQUIVO = 'index.html'

# Pseudo-elemento tem de ficar no fim: `a::after:not(x)` é inválido.
PSEUDO_ELEM = re.compile(r'(::?(?:before|after|first-line|first-letter|placeholder|selection|marker|backdrop|-webkit-[a-z-]+))\s*$')


def normaliza(s):
    """O navegador devolve o seletor já normalizado (`a, b`); o arquivo tem
    o que a pessoa escreveu (`a,b`, quebras de linha, comentário no meio).
    Comparar os dois exige aproximar as duas formas."""
    s = re.sub(r'/\*.*?\*/', ' ', s, flags=re.S)   # comentário não é seletor
    s = re.sub(r'\s*,\s*', ', ', s)
    return re.sub(r'\s+', ' ', s).strip()


RAIZ = ':not([data-mw-migrada])'
DESC = ':not([data-mw-migrada] *)'


def guarda_um(parte):
    """Acrescenta ao seletor as guardas que faltarem, antes do pseudo-elemento.

    As duas são conferidas SEPARADAMENTE, e isso custou uma sessão. A
    checagem de idempotência era `if ':not([data-mw-migrada]' in p` — um
    prefixo que casa com as duas formas. Rodadas anteriores deixaram
    regras com só a guarda de DESCENDENTE, e a moldura é o primeiro caso
    em que a raiz da área é ela mesma o alvo (`#app .sidebar{...}`).
    Resultado: o script via a guarda velha, dizia "já está restringida",
    e a regra continuava pintando a lateral. O laço rodava para sempre
    relatando "1 regra restringida" e medindo 1 de novo.
    """
    p = parte.strip()
    if not p:
        return p
    falta = ''
    if RAIZ not in p.replace(DESC, ''):
        falta += RAIZ
    if DESC not in p:
        falta += DESC
    if not falta:
        return p
    m = PSEUDO_ELEM.search(p)
    if m:
        return p[:m.start()] + falta + m.group(1)
    return p + falta


def guarda(seletor):
    """Cada parte separada por vírgula recebe a guarda. Vírgula dentro de
    :is()/:where()/:not() não separa partes — por isso a contagem de
    parênteses, em vez de um split cru."""
    partes, atual, nivel = [], '', 0
    for ch in seletor:
        if ch == '(':
            nivel += 1
        elif ch == ')':
            nivel -= 1
        if ch == ',' and nivel == 0:
            partes.append(atual); atual = ''
        else:
            atual += ch
    partes.append(atual)
    return ', '.join(guarda_um(x) for x in partes)


def regras(css, base):
    """Devolve (inicio, fim, seletor) de cada regra do bloco, ignorando
    comentário, string e regra-@ de agrupamento."""
    out = []
    i, n = 0, len(css)
    ini_sel = 0
    while i < n:
        if css.startswith('/*', i):
            j = css.find('*/', i + 2)
            i = n if j < 0 else j + 2
            # Um comentário ANTES do seletor não faz parte dele. Sem esta
            # linha, o "seletor" da regra seguinte vinha com o bloco de
            # comentário inteiro grudado na frente e não casava com nada
            # — e o script relatava "não localizada" para regras que
            # estavam ali, na cara.
            if not re.sub(r'/\*.*?\*/', '', css[ini_sel:i], flags=re.S).strip():
                ini_sel = i
            continue
        c = css[i]
        if c in '"\'':
            j = i + 1
            while j < n and css[j] != c:
                j += 2 if css[j] == '\\' else 1
            i = j + 1
            continue
        if c == '}':
            i += 1
            ini_sel = i
            continue
        if c == '{':
            sel = css[ini_sel:i]
            corpo_ini = i
            # pula o corpo, contando chaves
            nivel, j = 1, i + 1
            while j < n and nivel:
                if css.startswith('/*', j):
                    k = css.find('*/', j + 2); j = n if k < 0 else k + 2; continue
                if css[j] == '{': nivel += 1
                elif css[j] == '}': nivel -= 1
                j += 1
            s = sel.strip()
            if s.startswith('@'):
                # regra de agrupamento: desce para dentro dela
                out.extend(regras(css[corpo_ini + 1:j - 1], base + corpo_ini + 1))
            else:
                out.append((base + ini_sel, base + i, sel))
            i = j
            ini_sel = i
            continue
        i += 1
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    dados = json.load(open(sys.argv[1], encoding='utf-8'))
    aplicar = '--aplicar' in sys.argv

    # Regra de reset global (`button,input,textarea{font:inherit}`) não é
    # aparência legada: é o que faz um controle herdar a fonte da página.
    # Restringi-la dentro da área migrada devolveria a fonte do sistema
    # operacional aos controles — o oposto do que a migração quer.
    RESET = {'button, input, textarea'}
    # Folhas que NÃO são aparência legada e não podem ser restringidas:
    # `mw-alvos` existe para dar 24px de alvo de toque a controles pequenos
    # em TODAS as áreas — restringi-la devolve o defeito de acessibilidade
    # exatamente na área que acabou de ser migrada. Foi o que aconteceu na
    # primeira passada em Perfil: os cinco links dos chips voltaram a 14px.
    NAO_RESTRINGIR = {'mw-alvos', 'mw-teclado', 'mw-legado-desligado'}
    # E o CSS próprio da área: o quadro de Projetos, a agenda, o
    # interruptor do Perfil público. Restringi-los desmonta o componente
    # que só existe naquela tela — o interruptor do Perfil virou uma caixa
    # de seleção crua de 18px quando isto aqui não existia. O quem-vence
    # já os separa no relatório; a lista vive nos dois lugares porque os
    # dois precisam concordar sobre o que é legado.
    PROPRIO = {
        'mw-support-style', 'mw-kanban', 'mw-agenda', 'mw-ordem', 'mw-notas',
        'mw-perfil-polido', 'mw-perfil-publico', 'mw-perfil-config-separados',
        'mw-diagnostico', 'mw-transfere-style',
        'mw-preferencias', 'mw-faceid-style', 'mw-conta-style', 'mw-pin-style',
        # A tela de entrada: o cartão de dois painéis, as etapas do
        # cadastro, a barra de força, a recuperação, o carrinho do botão
        # de criar conta e as partículas do fundo. Restringi-los
        # desmonta componentes que só existem ali.
        'mw-ds-login', 'mw-cadastro', 'mw-forca-senha-e-social',
        'mwv2-login-style', 'mateus-login-animation', 'mw-recupera-css',
        'mw-boot-loader-style', 'mateus-original-car-animation',
        'mw-cyan-glass-finish',
        # A moldura: o material de vidro, as cores dos ícones, a lente
        # que desliza, o recolher da lateral, a coreografia de rolagem.
        'mw-sidebar-original-restore', 'sidebar-final-3-point-fix',
        'sidebar-smooth-performance-fix', 'mw-nav-choreography',
        'mw-sidebar-marca', 'mw-identidade-navegacao', 'mw-nav-icon-cores',
        'mw-sidebar-liquid-glass', 'mw-reference-exact-pass',
        'mw-sidebar-top-refinement', 'mw-bottomnav-instagram',
        'mw-ds-bottomnav', 'mw-nav-label-reveal', 'mw-nav-por-contexto',
        'mw-liquid-glass-polish', 'mw-nav-lens-neutral', 'mw-nav-active-lens',
    }
    NAO_RESTRINGIR |= PROPRIO
    alvos = {}
    for r in dados.get('legado', []):
        chave = normaliza(r['sel'])
        if chave in RESET:
            print('pulando (reset global, não é aparência legada): %s' % chave)
            continue
        if r['folha'] in NAO_RESTRINGIR:
            print('pulando (correção que vale para todas as áreas): %s :: %s' % (r['folha'], chave[:60]))
            continue
        # A chave é (folha, seletor), não o seletor sozinho. Duas folhas
        # diferentes escrevem o MESMO seletor com frequência neste
        # arquivo — `#loginScreen, #loginScreen.reference-login` aparece
        # em `mw-smart-gradient-palette` e em `mw-mobile-fix`. Com a
        # chave só no seletor, a segunda sobrescrevia a primeira e uma
        # das duas ficava de fora sem ninguém notar: o relatório dizia
        # "restringidas", o quem-vence continuava acusando, e não havia
        # como saber qual das duas tinha ficado para trás.
        alvos[(r['folha'], chave)] = r['folha']
    if not alvos:
        print('nada a restringir: a área já está limpa.')
        return 0

    html = io.open(ARQUIVO, encoding='utf-8').read()

    # cada <style id="..."> vira um bloco com seu nome
    trocas = []
    for m in re.finditer(r'<style([^>]*)>(.*?)</style>', html, re.S):
        attrs, css = m.group(1), m.group(2)
        idm = re.search(r'id="([^"]+)"', attrs)
        folha = idm.group(1) if idm else 'inline'
        base = m.start(2)
        for ini, fim, sel in regras(css, base):
            chave = normaliza(sel)
            if (folha, chave) in alvos:
                trocas.append((ini, fim, sel, folha))

    achadas = {(fo, normaliza(se)) for _, _, se, fo in trocas}
    faltam = [k for k in alvos if k not in achadas]

    print('regras a restringir: %d de %d relatadas' % (len(trocas), len(alvos)))
    for _, _, sel, folha in trocas:
        print('  %-28s %s' % (folha, normaliza(sel)[:96]))
    if faltam:
        print('\nNÃO localizadas no index.html (conferir à mão):')
        for folha, sel in faltam:
            print('  %-28s %s' % (folha, sel[:96]))

    if not aplicar:
        print('\n(nada foi escrito — repita com --aplicar)')
        return 0

    # de trás para a frente, para os deslocamentos não invalidarem os próximos
    for ini, fim, sel, folha in sorted(trocas, key=lambda x: -x[0]):
        html = html[:ini] + guarda(sel) + html[fim:]
    io.open(ARQUIVO, 'w', encoding='utf-8').write(html)
    print('\n%d regras restringidas em %s.' % (len(trocas), ARQUIVO))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
