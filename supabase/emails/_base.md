# Modelos de e-mail do Mateus Workspace

> ⚠️ **Editar modelo exige SMTP próprio.**
> Com o serviço de e-mail embutido do Supabase, os campos de assunto e corpo
> ficam em modo leitura e o painel avisa: *"Configure SMTP personalizado para
> editar modelos"*. Não é limitação do celular nem do navegador — é regra do
> plano. Ligue um serviço de envio em **Authentication → Emails → SMTP
> Settings** antes de tentar colar qualquer coisa aqui.
>
> Ligar SMTP próprio resolve três coisas de uma vez: destrava os modelos, tira
> o limite de poucos e-mails por hora do serviço embutido, e faz o e-mail sair
> de um remetente seu em vez de `noreply@…supabase.io`.

Cole cada arquivo no painel do Supabase, em
**Authentication → Emails → Templates**, no modelo correspondente:

| Arquivo | Template do Supabase | Assunto sugerido |
|---|---|---|
| `confirmar-conta.html` | Confirm signup | `Confirme sua conta — Mateus Workspace` |
| `redefinir-senha.html` | Reset password | `Redefinir sua senha — Mateus Workspace` |

## Decisões de desenho, para quem for mexer depois

**Tabelas e estilo em linha, não flexbox e classes.** Cliente de e-mail não é
navegador: Outlook renderiza com o motor do Word, Gmail remove `<style>` em
boa parte dos casos. O que sobrevive em todo lugar é tabela aninhada com
`style=""` em cada célula. É feio de escrever e é o que funciona.

**A marca é desenhada com texto, não com imagem.** Quase todo cliente
bloqueia imagem remota até a pessoa autorizar — um logo em `<img>` chegaria
como um quadrado vazio na primeira vez, que é justamente quando importa. O
selo "MW" é uma célula com fundo e letra, então aparece sempre.

**O link aparece escrito por extenso embaixo do botão.** Botão é `<a>` com
fundo; quando o cliente remove o fundo, sobra um link comum — e quando
remove o link, a pessoa ainda consegue copiar o endereço à mão.

**Largura de 600px e fundo claro.** 600px é o que cabe em qualquer painel de
leitura sem rolagem lateral. O app é escuro, mas e-mail escuro vira loteria
entre clientes (o modo escuro do Gmail inverte cores por conta própria);
fundo claro com faixa azul-escura no topo dá a identidade sem o risco.
