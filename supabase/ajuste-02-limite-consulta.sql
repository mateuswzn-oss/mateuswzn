-- ============================================================================
-- Mateus Workspace — limite de consulta para as funções públicas
-- ============================================================================
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar mais de uma vez sem problema.
--
-- Por quê: username_livre e email_por_username respondem sem exigir login —
-- é assim que o cadastro e o login por usuário funcionam. Mas isso também
-- significa que, com só a chave pública (visível no código do site), alguém
-- consegue chamar essas funções em sequência e tentar adivinhar nomes de
-- usuário — e, para cada um que existir de verdade, descobrir o e-mail por
-- trás dele. Este arquivo não muda o que as funções respondem; só limita
-- QUANTAS vezes o mesmo aparelho pode perguntar num período curto. Alguém
-- usando o app normalmente nunca chega perto do limite.

create table if not exists public.limite_consulta (
  chave     text primary key,
  contagem  integer not null default 1,
  comeco_em timestamptz not null default now()
);

-- Só as funções abaixo (security definer) leem ou escrevem aqui.
alter table public.limite_consulta enable row level security;

create or replace function public.aplica_limite(p_chave text, p_maximo integer, p_janela_seg integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  linha public.limite_consulta;
begin
  select * into linha from public.limite_consulta where chave = p_chave for update;

  if not found then
    insert into public.limite_consulta (chave, contagem, comeco_em)
    values (p_chave, 1, now());
    return;
  end if;

  if now() - linha.comeco_em > make_interval(secs => p_janela_seg) then
    update public.limite_consulta set contagem = 1, comeco_em = now() where chave = p_chave;
    return;
  end if;

  if linha.contagem >= p_maximo then
    raise exception 'muitas-tentativas';
  end if;

  update public.limite_consulta set contagem = contagem + 1 where chave = p_chave;
end;
$$;

-- A "chave" é o IP de quem chamou, quando o Supabase o expõe no cabeçalho
-- padrão do PostgREST. Sem IP identificável, cai numa chave genérica — pior
-- que por IP, mas ainda limita o total de chamadas no período para todo
-- mundo nessa situação, o que já corta um ataque em massa.
create or replace function public.chave_do_chamador()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1), ''),
    'sem-ip'
  );
$$;

-- Está livre? — até 30 perguntas por minuto por aparelho. Isso é rodar o
-- cadastro dezenas de vezes seguidas; o app só chama isto uma vez por envio
-- do formulário.
create or replace function public.username_livre(nome text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.aplica_limite('username_livre:' || public.chave_do_chamador(), 30, 60);
  return not exists (
    select 1 from public.perfis where username = lower(trim(nome))
  );
end;
$$;

-- Qual o e-mail deste username? — até 15 perguntas por minuto por aparelho.
-- É esta a função que expõe e-mail por username; o limite aqui é o mais
-- importante dos dois.
create or replace function public.email_por_username(nome text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.aplica_limite('email_por_username:' || public.chave_do_chamador(), 15, 60);
  return (
    select u.email
      from public.perfis p
      join auth.users u on u.id = p.id
     where p.username = lower(trim(nome))
     limit 1
  );
end;
$$;

revoke all on function public.username_livre(text)     from public;
revoke all on function public.email_por_username(text) from public;
grant execute on function public.username_livre(text)     to anon, authenticated;
grant execute on function public.email_por_username(text) to anon, authenticated;
