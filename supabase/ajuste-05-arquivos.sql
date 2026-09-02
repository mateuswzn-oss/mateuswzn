-- ============================================================================
-- Mateus Workspace — ajuste 05: espaço para arquivos no servidor
-- ============================================================================
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar mais de uma vez sem problema: tudo aqui é idempotente.
--
-- ATENÇÃO, PARA NÃO HAVER MAL-ENTENDIDO:
-- rodar este arquivo NÃO faz o app começar a sincronizar arquivos. Ele só
-- prepara o lado do servidor. Hoje a área de Arquivos guarda tudo no
-- IndexedDB do próprio navegador, e diz isso na tela. A parte do cliente
-- que usaria este balde ainda não foi escrita — quando for, ela já
-- encontra o espaço pronto e com as regras certas.
--
-- Foi feito assim de propósito: escrever código de rede que não dá para
-- testar aqui, e deixá-lo ligado, seria a forma mais rápida de entregar
-- uma função que parece existir e falha na primeira vez que importa.
--
-- O que este arquivo cria:
--   um balde privado chamado "materiais"
--   quatro políticas de acesso: cada pessoa só enxerga a própria pasta
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. O balde
-- ---------------------------------------------------------------------------
-- `public => false` é o ponto mais importante do arquivo. Num balde
-- público, qualquer pessoa com o endereço do arquivo o baixa, sem login —
-- e endereços vazam (histórico, print, link colado no grupo). Sendo
-- privado, cada download passa por uma URL assinada com prazo, gerada só
-- para quem está autenticado.
--
-- O teto por arquivo é o mesmo que a tela aplica (25 MB). Ter o limite nos
-- dois lados é intencional: a tela avisa cedo e com jeito, o servidor
-- recusa de verdade — validação de cliente não é validação.
insert into storage.buckets (id, name, public, file_size_limit)
values ('materiais', 'materiais', false, 26214400)
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400;


-- ---------------------------------------------------------------------------
-- 2. Quem pode o quê
-- ---------------------------------------------------------------------------
-- A convenção de caminho é "<id do usuário>/<nome do arquivo>", e é dela
-- que sai o isolamento: storage.foldername(name) devolve as pastas do
-- caminho, e comparar a primeira com auth.uid() é o que garante que
-- ninguém alcança a pasta de outra pessoa. Sem isso, um balde privado
-- ainda deixaria QUALQUER pessoa logada ler os arquivos de QUALQUER outra
-- — o que é pior do que parece, porque dá a sensação de estar protegido.
--
-- As políticas são recriadas a cada execução para o arquivo poder rodar de
-- novo depois de uma correção, sem erro de "já existe".

drop policy if exists "materiais: cada um lê a própria pasta"       on storage.objects;
drop policy if exists "materiais: cada um envia na própria pasta"   on storage.objects;
drop policy if exists "materiais: cada um substitui a própria pasta" on storage.objects;
drop policy if exists "materiais: cada um apaga a própria pasta"    on storage.objects;

create policy "materiais: cada um lê a própria pasta"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'materiais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "materiais: cada um envia na própria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materiais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update precisa das duas cláusulas: `using` decide qual linha pode ser
-- alterada, `with check` decide como ela pode ficar depois. Só com `using`,
-- daria para pegar um arquivo da própria pasta e renomeá-lo para dentro da
-- pasta de outra pessoa.
create policy "materiais: cada um substitui a própria pasta"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'materiais'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'materiais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "materiais: cada um apaga a própria pasta"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'materiais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------------
-- 3. Conferindo
-- ---------------------------------------------------------------------------
-- Depois de rodar, isto deve devolver o balde com public = false e as
-- quatro políticas.
--
--   select id, public, file_size_limit from storage.buckets where id = 'materiais';
--   select policyname from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--      and policyname like 'materiais:%';
--
-- Apagar a conta de uma pessoa NÃO apaga os arquivos dela: o Storage não
-- tem cascade como as tabelas têm. Quando a sincronização entrar, isso
-- precisa ser resolvido de propósito — ou por uma função que limpa a pasta
-- ao remover a conta, ou por uma rotina periódica que varre pastas órfãs.
-- Fica anotado aqui para não ser descoberto tarde.
-- ============================================================================
