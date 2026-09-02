#!/usr/bin/env python3
"""Gera /beta/index.html na branch main a partir do index.html da branch beta.

Três diferenças em relação ao app de verdade, e só três:

1. O service worker NÃO é registrado. A prévia não deve competir com o
   app instalado nem gravar uma cópia própria em cache.
2. O título vira "prévia beta", para não se confundir com o app na lista
   de abas.
3. Um carimbo discreto no topo diz qual versão está sendo vista, e some
   sozinho depois de alguns segundos. Ele existe porque "atualizou ou
   não?" era uma pergunta sem resposta possível olhando a tela — e um
   navegador servindo uma cópia antiga é indistinguível de um deploy que
   não saiu.

Uso: python3 tools/gerar-previa.py <index.html da beta> <destino> <versao>
"""
import os
import re
import sys


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        return 1
    origem, destino, versao = sys.argv[1], sys.argv[2], sys.argv[3]

    with open(origem, encoding='utf-8') as f:
        html = f.read()

    # O Design System vive num arquivo separado; a prévia precisa dele ao
    # lado, senão o <link> aponta para o nada dentro de /beta/.
    import shutil
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ds_origem = os.path.join(raiz, 'ds', 'mw-ds.css')
    ds_destino = os.path.join(os.path.dirname(os.path.abspath(destino)), 'ds', 'mw-ds.css')
    if os.path.exists(ds_origem):
        os.makedirs(os.path.dirname(ds_destino), exist_ok=True)
        shutil.copyfile(ds_origem, ds_destino)
        print('design system copiado para', os.path.relpath(ds_destino, raiz))
    else:
        raise SystemExit('ds/mw-ds.css não encontrado — a prévia sairia sem o sistema.')

    # 1) sem service worker
    alvo = "navigator.serviceWorker.register('sw.js').catch(() => {});"
    if html.count(alvo) != 1:
        raise SystemExit(
            'Esperava exatamente um registro de service worker, achei %d. '
            'O texto do registro mudou — conferir antes de publicar.' % html.count(alvo))
    html = html.replace(
        alvo,
        'void 0; /* prévia: sem service worker, para não competir com o app instalado */')

    # 2) título próprio
    html = re.sub(r'<title>.*?</title>',
                  '<title>MW Workspace — prévia beta</title>',
                  html, count=1, flags=re.S)

    # 3) carimbo de versão
    carimbo = '''
<style id="mw-previa-carimbo">
#mwPreviaCarimbo{
  position: fixed; top: 8px; left: 50%; transform: translateX(-50%);
  z-index: 2147483647; pointer-events: none;
  padding: 5px 12px; border-radius: 999px;
  background: rgba(10,14,30,.82); color: #eef2ff;
  border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  font: 600 11px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  letter-spacing: .04em; white-space: nowrap;
  animation: mwPreviaSome 6s ease forwards;
}
@keyframes mwPreviaSome{
  0%{ opacity: 0; transform: translateX(-50%) translateY(-6px) }
  8%{ opacity: 1; transform: translateX(-50%) translateY(0) }
  80%{ opacity: 1 }
  100%{ opacity: 0; transform: translateX(-50%) translateY(-6px); visibility: hidden }
}
@media (prefers-reduced-motion: reduce){
  #mwPreviaCarimbo{ animation: none; opacity: .9 }
}
</style>
<script id="mw-previa-carimbo-js">
(function(){
  'use strict';
  /* O carimbo entra depois do preloader para não brigar com a abertura
     da marca, e sai sozinho. window.MW_PREVIA fica disponível para
     conferir a versão pelo console sem depender de ver o carimbo. */
  window.MW_PREVIA = 'VERSAO_AQUI';
  function mostra(){
    if (document.getElementById('mwPreviaCarimbo')) return;
    var el = document.createElement('div');
    el.id = 'mwPreviaCarimbo';
    el.textContent = 'prévia ' + window.MW_PREVIA;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 6200);
  }
  setTimeout(mostra, 3200);
})();
</script>
'''.replace('VERSAO_AQUI', versao)

    fim = '\n</body>\n</html>'
    if html.count(fim) != 1:
        raise SystemExit('Não achei o fim do documento para inserir o carimbo.')
    html = html.replace(fim, carimbo + fim)

    with open(destino, 'w', encoding='utf-8') as f:
        f.write(html)
    print('prévia gerada: %s (%s)' % (destino, versao))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
