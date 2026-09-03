#!/usr/bin/env python3
"""Tira a guarda das regras que NUNCA deviam tê-la recebido.

Uma regra CSS é indivisível. Guardá-la com `:not([data-mw-migrada]...)`
desliga a regra INTEIRA dentro das áreas migradas — e regra antiga
costuma misturar aparência com geometria. Guardar pela cor leva o
`display`, o `position` e o `transform` junto.

Foi assim que a gaveta do celular foi parar em cima da tela, e assim que
o `<strong>` do estado vazio deixou de ser bloco e colou no texto:

    .mw-p-vazio strong:not([data-mw-migrada] *){ display: block; }
    →  "Nenhuma entrega com dataColoque prazo nas atividades..."

Este script desfaz isso: percorre o index.html, e em toda regra que
declara geometria ou comportamento, remove a guarda e devolve o seletor
original.

O que ele NÃO faz: decidir o que fazer com a aparência legada que volta
junto. Essa parte é a reconstrução da tela — apagar a folha antiga e
escrever o componente novo. Guardar a regra era o atalho que não
funcionou.

Uso:
    python3 tools/ds/desfaz-guarda.py            # mostra o que faria
    python3 tools/ds/desfaz-guarda.py --aplicar
"""
import io
import re
import sys

sys.path.insert(0, 'tools/ds')
from restringe import regras, e_layout, normaliza, RAIZ, DESC   # noqa: E402

ARQUIVO = 'index.html'


def main():
    aplicar = '--aplicar' in sys.argv
    html = io.open(ARQUIVO, encoding='utf-8').read()

    fora = []          # (inicio, fim, seletor limpo, folha, propriedade)
    for m in re.finditer(r'<style([^>]*)>(.*?)</style>', html, re.S):
        attrs, css = m.group(1), m.group(2)
        idm = re.search(r'id="([^"]+)"', attrs)
        folha = idm.group(1) if idm else 'inline'
        # O bloco de desligamento é o mecanismo, não uma vítima dele.
        if folha == 'mw-legado-desligado':
            continue
        for ini, fim, sel, corpo in regras(css, m.start(2)):
            if 'data-mw-migrada' not in sel:
                continue
            prop = e_layout(corpo)
            if not prop:
                continue
            limpo = sel.replace(RAIZ + DESC, '').replace(DESC, '').replace(RAIZ, '')
            fora.append((ini, fim, limpo, folha, prop))

    print('regras com guarda que declaram geometria: %d' % len(fora))
    por_prop = {}
    for _, _, _, _, p in fora:
        por_prop[p] = por_prop.get(p, 0) + 1
    for p, n in sorted(por_prop.items(), key=lambda x: -x[1])[:12]:
        print('   %-16s %d' % (p, n))

    if not aplicar:
        print('\n(nada foi escrito — repita com --aplicar)')
        return 0

    for ini, fim, limpo, _, _ in sorted(fora, key=lambda x: -x[0]):
        html = html[:ini] + limpo + html[fim:]
    io.open(ARQUIVO, 'w', encoding='utf-8').write(html)
    print('\n%d guardas removidas de %s.' % (len(fora), ARQUIVO))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
