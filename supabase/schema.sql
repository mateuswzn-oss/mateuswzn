-- ============================================================================
-- Mateus Workspace — esquema do Supabase
-- ============================================================================
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar mais de uma vez sem problema: tudo aqui é idempotente.
--
-- O que ele cria:
--   perfis  — nome de usuário, nome de exibição e foto de cada conta
--   dados   — o conteúdo do workspace (disciplinas, projetos, notas...)
--   funções — checar se um username está livre e achar o e-mail de um username
--
-- A senha NÃO mora em nenhuma destas tabelas. Quem guarda é o auth do
-- Supabase, com bcrypt, num schema que o navegador não alcança. É a
-- diferença entre o login de hoje (hash no localStorage, qualquer um com o
-- console lê) e um login de verdade.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Perfis
-- ---------------------------------------------------------------------------
-- Uma linha por conta, com a mesma id do usuário do auth. O `on delete
-- cascade` garante que apagar a conta apaga o perfil junto — sem lixo órfão.
create table if not exists public.perfis (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,
  nome          text not null default '',
  foto          text not null default '',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Mesma regra que o app já aplica no cadastro: 3 a 20 caracteres, minúsculo,
  -- letras, números, ponto e underline. Guardar sempre minúsculo é o que faz
  -- o `unique` acima recusar "Mateus" quando "mateus" já existe.
  constraint perfis_username_formato check (username ~ '^[a-z0-9_.]{3,20}$')
);

-- ---------------------------------------------------------------------------
-- 2. Dados do workspace
-- ---------------------------------------------------------------------------
-- O conteúdo vai inteiro como JSON, no mesmo formato que hoje vive em
-- localStorage['mateusWorkspaceV4']. Guardar assim evita reescrever o app
-- todo agora; dá pra normalizar em tabelas de verdade depois, se valer a pena.
--
-- `versao` é o que resolve o conflito de dois aparelhos editando offline:
-- quem grava manda a versão que leu, e a gravação só passa se ninguém tiver
-- gravado no meio do caminho.
create table if not exists public.dados (
  id            uuid primary key references auth.users(id) on delete cascade,
  conteudo      jsonb not null default '{}'::jsonb,
  versao        bigint not null default 1,
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Carimbo de atualização
-- ---------------------------------------------------------------------------
create or replace function public.marca_atualizacao()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists perfis_atualizado on public.perfis;
create trigger perfis_atualizado
  before update on public.perfis
  for each row execute function public.marca_atualizacao();

drop trigger if exists dados_atualizado on public.dados;
create trigger dados_atualizado
  before update on public.dados
  for each row execute function public.marca_atualizacao();


-- ---------------------------------------------------------------------------
-- 4. Row Level Security — a parte que realmente protege
-- ---------------------------------------------------------------------------
-- A chave `anon` fica visível no código do site, e isso é normal: ela sozinha
-- não abre nada. Quem decide o que cada requisição enxerga são as políticas
-- abaixo, aplicadas pelo banco. Sem RLS ligado, a chave pública leria tudo de
-- todo mundo — por isso estas linhas não são opcionais.
alter table public.perfis enable row level security;
alter table public.dados  enable row level security;

drop policy if exists "perfil proprio: ler"       on public.perfis;
drop policy if exists "perfil proprio: criar"     on public.perfis;
drop policy if exists "perfil proprio: atualizar" on public.perfis;

create policy "perfil proprio: ler"
  on public.perfis for select
  using (auth.uid() = id);

create policy "perfil proprio: criar"
  on public.perfis for insert
  with check (auth.uid() = id);

create policy "perfil proprio: atualizar"
  on public.perfis for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "dados proprios: ler"       on public.dados;
drop policy if exists "dados proprios: criar"     on public.dados;
drop policy if exists "dados proprios: atualizar" on public.dados;

create policy "dados proprios: ler"
  on public.dados for select
  using (auth.uid() = id);

create policy "dados proprios: criar"
  on public.dados for insert
  with check (auth.uid() = id);

create policy "dados proprios: atualizar"
  on public.dados for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Repare que não existe política de DELETE em nenhuma das duas. Sem política,
-- a operação é negada — ninguém apaga a própria linha por acidente nem de
-- propósito. Apagar a conta inteira pelo painel do Supabase continua
-- funcionando, via o cascade lá de cima.


-- ---------------------------------------------------------------------------
-- 5. Criar o perfil junto com a conta
-- ---------------------------------------------------------------------------
-- Roda dentro da mesma transação do cadastro. Se o username já existe, o
-- `unique` estoura, a transação inteira volta atrás e a conta NÃO é criada —
-- que é exatamente a regra que você pediu. O app checa antes pra dar uma
-- mensagem bonita; isto aqui é a rede de segurança pra quando dois cadastros
-- chegarem no mesmo instante.
create or replace function public.cria_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, username, nome)
  values (
    new.id,
    lower(trim(coalesce(new.raw_user_meta_data->>'username', ''))),
    coalesce(new.raw_user_meta_data->>'nome', '')
  );
  insert into public.dados (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.cria_perfil();


-- ---------------------------------------------------------------------------
-- 6. Funções de consulta pública
-- ---------------------------------------------------------------------------
-- Estas duas precisam enxergar as linhas dos outros — checar se um username
-- está livre não teria sentido se só lesse o próprio perfil. Por isso são
-- `security definer`: rodam com a permissão do dono, ignorando o RLS. Cada
-- uma responde uma pergunta só, e nenhuma delas lista nada.

-- Está livre?
create or replace function public.username_livre(nome text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.perfis where username = lower(trim(nome))
  );
$$;

-- Qual o e-mail deste username?
--
-- O login do app é por nome de usuário, mas o auth do Supabase entra por
-- e-mail — então alguém precisa fazer essa ponte. Vale saber o custo: com a
-- chave pública em mãos, dá pra descobrir o e-mail de um username que já se
-- conheça. Não dá pra listar contas nem descobrir senha, e num app de uso
-- pessoal isso é aceitável. Se um dia virar público de verdade, o caminho é
-- mover o login inteiro pra uma Edge Function, e aí o e-mail nunca sai do
-- servidor.
create or replace function public.email_por_username(nome text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select u.email
    from public.perfis p
    join auth.users u on u.id = p.id
   where p.username = lower(trim(nome))
   limit 1;
$$;

revoke all on function public.username_livre(text)     from public;
revoke all on function public.email_por_username(text) from public;
grant execute on function public.username_livre(text)     to anon, authenticated;
grant execute on function public.email_por_username(text) to anon, authenticated;
