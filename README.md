<div align="center">

<img src="icon-192.png" width="88" alt="Mateus Workspace">

# Mateus Workspace

**Organize disciplinas, projetos, atividades e anotações da faculdade em um só lugar.**

[Abrir o app](https://mateuswzn-oss.github.io/mateuswzn/) · PWA instalável · Português (BR)

</div>

---

## O que é

Um espaço de estudos para quem faz faculdade: as matérias do semestre, os projetos em
andamento, o que precisa ser entregue e as anotações — tudo numa interface só, que roda
no navegador e também instala como aplicativo no celular.

Foi feito como Progressive Web App: depois de instalado na tela de início, abre em tela
cheia, sem barra de navegador, e continua funcionando sem internet.

## Funcionalidades

| | |
|---|---|
| **Início** | Painel com o resumo do semestre, próximas entregas e progresso por disciplina |
| **Faculdade** | Disciplinas, carga horária e acompanhamento de andamento |
| **Projetos** | Trabalhos em curso, com estado e prazo |
| **Atividades** | O que precisa ser entregue, ordenado por urgência |
| **Anotações** | Notas de aula e material de estudo |
| **Arquivos** | Materiais anexados às disciplinas |
| **Nyc AI** | Assistente de estudos integrada, para dúvidas de programação e organização |
| **Perfil** | Nome de exibição, foto e preferências |
| **Suporte** | Canal de contato e chamados |

Além disso: tema claro e escuro, desbloqueio por Face ID no iOS (WebAuthn), código de PIN,
e animação de abertura com áudio sincronizado.

## Stack

- **HTML, CSS e JavaScript sem framework.** A interface inteira é escrita à mão — sem
  React, sem build step, sem `node_modules` para servir a página.
- **Service Worker** com estratégia *stale-while-revalidate*: a tela abre instantaneamente
  do cache e busca a versão nova em segundo plano.
- **[Supabase](https://supabase.com)** para contas e sincronização (em migração — ver abaixo).
- **Função serverless** em `api/` para a Nyc AI, hospedada na Vercel.
- **[Playwright](https://playwright.dev)** para os testes de interface.

## Como rodar

Não precisa instalar nada para mexer no app — é um arquivo estático:

```bash
git clone https://github.com/mateuswzn-oss/mateuswzn.git
cd mateuswzn
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

> **Service worker precisa de origem segura.** `localhost` conta como segura, então tudo
> funciona. Abrir o `index.html` direto com duplo clique (`file://`) não funciona: o service
> worker não registra e a instalação como app fica indisponível.

Para trabalhar na Nyc AI, que depende da função serverless:

```bash
npm install
npx vercel dev
```

A chave da API vai em `ANTHROPIC_API_KEY`, como variável de ambiente. Ela nunca aparece no
navegador — a chamada sai do servidor.

## Estrutura

```
index.html                 o app inteiro: marcação, estilos e comportamento
sw.js                      service worker (cache do shell e atualização em segundo plano)
manifest.json              metadados de instalação do PWA
api/ai.js                  função serverless da Nyc AI
supabase/schema.sql        esquema do banco: tabelas, políticas de acesso e funções
vendor/supabase.js         cliente do Supabase, embutido para funcionar offline
tools/testes/              suíte de Playwright (ver tools/testes/LEIAME.md)
tools/gerar-previa.py      gera a prévia publicada em /beta/ a partir da branch de trabalho
icon-*.png, splash/        ícones e telas de abertura
```

### Por que um arquivo só

O `index.html` concentra tudo. É uma decisão deliberada: sem passo de build, o que está no
repositório é exatamente o que roda no navegador, e o deploy é copiar arquivos. O custo é um
arquivo grande — se o projeto crescer mais, vale separar em módulos.

## Situação atual

O endereço público mostra **uma tela de manutenção**. O app está sendo reformulado numa
branch de trabalho (`beta/reformulacao-profissional`), com prévia publicada em
[`/beta/`](https://mateuswzn-oss.github.io/mateuswzn/beta/). A versão estável anterior
está preservada na branch `stable-backup`.

**A prévia não é o produto final.** Ela é a etapa de *estabilização*: generalizar o modelo
de dados, separar Perfil de Configurações, tornar honesto o que ainda não existe, e fechar
os buracos que a suíte de testes encontra. Depois que essa base estiver sólida, vem a
reformulação completa — design system novo, Liquid Glass, dashboard, perfil, configurações,
login/cadastro, comunidade, arquivos com Storage de verdade, e layouts próprios para
celular, tablet, desktop e web.

A ordem é essa de propósito: transformação visual sobre base instável vira retrabalho.

## Testes

```bash
npm run teste            # a suíte inteira
tools/testes/rodar.sh 1  # só o teste 1
```

O script sobe sozinho um servidor estático, roda os testes num Chromium de verdade e
derruba o servidor no fim. Como o app não tem passo de build nem módulos, não há teste
unitário: os defeitos que ele produz são de renderização — texto ilegível, botão espremido,
elemento fora da tela, tela branca no boot — e nenhum deles aparece lendo o código.

São sete testes: regressão das áreas, carga com um semestre inteiro de dados,
acessibilidade, flash branco no boot, Android com toque real, o viewport real de um iPhone,
e contraste WCAG medido no pixel. O que cada um mede, e em quais ambientes a reformulação
já foi de fato validada, está em [`tools/testes/LEIAME.md`](tools/testes/LEIAME.md).

## Contas e sincronização

O sistema de contas está sendo migrado de armazenamento local para o Supabase.

**Como funciona hoje:** as contas vivem no `localStorage` do próprio aparelho, com a senha
guardada como hash SHA-256 e sal por conta. Isso significa que um navegador não enxerga a
conta criada no outro — e, no iOS, o app instalado tem um armazenamento separado do Safari,
então os dois não se falam.

**Para onde está indo:** com o Supabase, a conta passa a viver no servidor. O mesmo login
funciona no navegador e no app, a foto de perfil aparece nos dois, e limpar os dados do
navegador deixa de significar perder tudo. As senhas passam a ser guardadas pelo serviço de
autenticação, com bcrypt, fora do alcance do navegador.

O esquema do banco está em [`supabase/schema.sql`](supabase/schema.sql), com Row Level
Security ativo: cada conta só enxerga as próprias linhas, e essa regra é aplicada pelo banco,
não pelo código do site.

## Deploy

A `main` publica automaticamente no GitHub Pages.

Ao mudar qualquer arquivo da lista `SHELL_URLS` em `sw.js`, é preciso subir o `CACHE_NAME`
junto. Sem isso, quem já tem o app instalado continua servindo a versão antiga do cache,
e a atualização nunca chega.

## Licença

[MIT](LICENSE)
