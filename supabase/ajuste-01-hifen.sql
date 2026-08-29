-- Ajuste avulso: permitir hífen no nome de usuário.
--
-- A regra original aceitava só letras, números, ponto e underline, mas a
-- validação da tela sempre aceitou hífen também. Com os dois discordando,
-- um nome como "mateus-wzn" passava no cadastro e era recusado pelo banco —
-- e o erro aparecia longe da causa.
--
-- Rode uma vez no SQL Editor. Pode rodar de novo sem problema.
alter table public.perfis drop constraint if exists perfis_username_formato;
alter table public.perfis add  constraint perfis_username_formato
  check (username ~ '^[a-z0-9_.-]{3,20}$');
