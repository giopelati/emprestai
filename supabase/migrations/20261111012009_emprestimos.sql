-- Spec 003 — solicitar empréstimo: tabela de empréstimos e a regra atômica.
-- ADR-002 (migration SQL) e ADR-003 (regra em função chamada por RPC, RLS).

create table public.emprestimos (
  id uuid primary key default gen_random_uuid(),
  equipamento_id uuid not null references public.equipamentos (id),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  retirado_em timestamptz not null default now(),
  devolucao_prevista date not null,
  devolvido_em timestamptz,
  check (devolvido_em is null or devolvido_em >= retirado_em)
);

comment on table public.emprestimos is
  'Empréstimos. Criados só por public.solicitar_emprestimo; cada pessoa lê os próprios.';

-- CA-08: no máximo um empréstimo em aberto por equipamento, garantido pelo banco.
create unique index emprestimos_um_aberto_por_equipamento
  on public.emprestimos (equipamento_id)
  where devolvido_em is null;

create index emprestimos_abertos_por_usuario
  on public.emprestimos (usuario_id)
  where devolvido_em is null;

alter table public.emprestimos enable row level security;

-- CA-10: cada pessoa lê só os próprios empréstimos. Sem política de escrita.
create policy "emprestimos: cada pessoa lê os próprios"
  on public.emprestimos
  for select
  to authenticated
  using (usuario_id = (select auth.uid()));

revoke insert, update, delete, truncate on public.emprestimos from anon, authenticated;
revoke select on public.emprestimos from anon;

-- Regra de solicitar empréstimo (spec 003). Recusas por código; o backend
-- traduz para HTTP e mensagem.
create or replace function public.solicitar_emprestimo(p_equipamento_id uuid)
returns public.emprestimos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_papel text := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_situacao text;
  v_abertos integer;
  v_emprestimo public.emprestimos;
begin
  if v_usuario is null then
    raise exception 'NAO_AUTENTICADO';
  end if;

  if v_papel not in ('colaborador', 'operacoes') then
    raise exception 'PAPEL_INVALIDO';
  end if;

  -- Serializa pedidos da mesma pessoa: limite e atraso não podem ser
  -- burlados por dois pedidos simultâneos de itens diferentes.
  perform pg_advisory_xact_lock(hashtextextended(v_usuario::text, 3));

  -- Serializa pedidos ao mesmo equipamento (CA-08).
  select e.situacao
    into v_situacao
    from public.equipamentos e
   where e.id = p_equipamento_id
     for update;

  if not found then
    raise exception 'EQUIPAMENTO_NAO_ENCONTRADO';
  end if;

  if v_situacao <> 'disponivel' then
    raise exception 'EQUIPAMENTO_INDISPONIVEL';
  end if;

  -- L2: em atraso = em aberto com devolução prevista anterior a hoje.
  if exists (
    select 1
      from public.emprestimos m
     where m.usuario_id = v_usuario
       and m.devolvido_em is null
       and m.devolucao_prevista < v_hoje
  ) then
    raise exception 'EMPRESTIMO_EM_ATRASO';
  end if;

  -- C1: limite do PRD, 3 itens ao mesmo tempo.
  select count(*)
    into v_abertos
    from public.emprestimos m
   where m.usuario_id = v_usuario
     and m.devolvido_em is null;

  if v_abertos >= 3 then
    raise exception 'LIMITE_DE_EMPRESTIMOS';
  end if;

  -- C2: 14 dias corridos (PRD).
  insert into public.emprestimos (equipamento_id, usuario_id, devolucao_prevista)
  values (p_equipamento_id, v_usuario, v_hoje + 14)
  returning * into v_emprestimo;

  update public.equipamentos
     set situacao = 'emprestado',
         atualizado_em = now()
   where id = p_equipamento_id;

  return v_emprestimo;
end;
$$;

revoke execute on function public.solicitar_emprestimo(uuid) from public, anon;
grant execute on function public.solicitar_emprestimo(uuid) to authenticated;
