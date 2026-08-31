-- ============================================================================
-- Mateus Workspace — papel de admin, Painel Admin real e "esqueci meu usuário"
-- ============================================================================
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar mais de uma vez sem problema: tudo aqui é idempotente.
--
-- Depende do ajuste-02 (chave_do_chamador e aplica_limite) e do ajuste-03
-- (tabela acessos) já terem sido rodados.
--
-- ============================================================================
-- 1. Papel de admin
-- ============================================================================
-- O Painel Admin do site (aviso que já existia na tela: "Protótipo visual —
-- sem proteção real de backend") pedia exatamente isto: um campo de papel
-- guardado no SERVIDOR, checado em toda função administrativa — nunca uma
-- checagem só no JavaScript do navegador, que qualquer pessoa consegue abrir
-- no console e contornar.
alter table public.perfis add column if not exists is_admin boolean not null default false;

-- Ninguém consegue virar admin sozinho: sem política de UPDATE
-- pública nesta coluna (as políticas de "perfil próprio: atualizar" do
-- schema.sql são por linha inteira, então convém reforçar explicitamente
-- que só quem já É admin consegue mudar o campo is_admin de QUALQUER
-- linha — inclusive a própria). RLS já bloqueia todo mundo por padrão sem
-- política; esta função é o único caminho.
create or replace function public.sou_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.perfis where id = auth.uid()), false);
$$;

revoke all on function public.sou_admin() from public;
grant execute on function public.sou_admin() to anon, authenticated;

-- Promove ou remove admin de outra conta. Só quem já é admin pode chamar —
-- por isso o BOOTSTRAP do primeiro admin (você) precisa ser manual, uma
-- vez só, rodando à mão (troque 'seu_usuario' pelo seu username de verdade):
--
--   update public.perfis set is_admin = true where username = 'seu_usuario';
--
-- Depois disso, promover mais gente pode ser feito com:
--   select public.definir_admin('outro_usuario', true);
create or replace function public.definir_admin(p_username text, p_valor boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then
    raise exception 'nao-autorizado';
  end if;
  update public.perfis set is_admin = p_valor where username = lower(trim(p_username));
end;
$$;

revoke all on function public.definir_admin(text, boolean) from public;
grant execute on function public.definir_admin(text, boolean) to authenticated;


-- ============================================================================
-- 2. Painel Admin — dados de verdade, só pra quem é admin
-- ============================================================================
-- As três funções abaixo checam sou_admin() na PRIMEIRA linha e recusam
-- (com exceção, sem devolver nenhum dado) quem não for. Isso vale mesmo que
-- alguém chame a função direto pela chave pública, sem passar pelo site —
-- é exatamente o "nunca confiar em checagem no front-end" que o aviso da
-- tela pedia.
create or replace function public.admin_estatisticas()
returns table(usuarios bigint, acessos_24h bigint, ultimo_acesso timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'nao-autorizado'; end if;
  return query
  select
    (select count(*) from public.perfis),
    (select count(*) from public.acessos where criado_em > now() - interval '24 hours'),
    (select max(criado_em) from public.acessos);
end;
$$;

revoke all on function public.admin_estatisticas() from public;
grant execute on function public.admin_estatisticas() to authenticated;

create or replace function public.admin_lista_contas()
returns table(username text, nome text, email text, email_confirmado boolean, is_admin boolean, criado_em timestamptz, ultimo_login timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'nao-autorizado'; end if;
  return query
  select p.username, p.nome, u.email, (u.email_confirmed_at is not null), p.is_admin, p.criado_em, u.last_sign_in_at
    from public.perfis p
    join auth.users u on u.id = p.id
   order by p.criado_em desc
   limit 200;
end;
$$;

revoke all on function public.admin_lista_contas() from public;
grant execute on function public.admin_lista_contas() to authenticated;

-- p_limite tem teto de 200 mesmo que peçam mais — é o mesmo espírito do
-- limite de linhas do diagnóstico manual: o painel é pra visão geral, não
-- pra despejar a tabela inteira numa chamada só.
create or replace function public.admin_lista_acessos(p_limite integer default 50)
returns table(criado_em timestamptz, ip text, cidade text, regiao text, pais text, agente text, pagina text, username text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_admin() then raise exception 'nao-autorizado'; end if;
  return query
  select a.criado_em, a.ip, a.cidade, a.regiao, a.pais, a.agente, a.pagina, p.username
    from public.acessos a
    left join public.perfis p on p.id = a.usuario_id
   order by a.criado_em desc
   limit least(coalesce(p_limite, 50), 200);
end;
$$;

revoke all on function public.admin_lista_acessos(integer) from public;
grant execute on function public.admin_lista_acessos(integer) to authenticated;


-- ============================================================================
-- 3. "Esqueci meu usuário"
-- ============================================================================
-- Espelho de email_por_username (ajuste-02): em vez de usuário → e-mail,
-- aqui é e-mail → usuário. Mesmo limite de 15 por minuto por aparelho, e
-- mesma observação de segurança que já vale pra email_por_username: com a
-- chave pública em mãos dá pra descobrir o username de um e-mail que já se
-- conheça. Não expõe senha nem lista contas, e é o mesmo risco aceito que
-- login por usuário já tinha ao contrário — não é uma categoria nova.
create or replace function public.username_por_email(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.aplica_limite('username_por_email:' || public.chave_do_chamador(), 15, 60);
  return (
    select p.username
      from public.perfis p
      join auth.users u on u.id = p.id
     where u.email = lower(trim(p_email))
     limit 1
  );
end;
$$;

revoke all on function public.username_por_email(text) from public;
grant execute on function public.username_por_email(text) to anon, authenticated;
