-- Spec 002 — dados iniciais: tabela de equipamentos e bucket público de fotos.
-- ADR-002: aplicada localmente por `npm run db:reset`; em produção, por uma
-- pessoa do time.

create table public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  patrimonio text not null unique
    check (patrimonio ~ '^TI-[0-9]{4}$'),
  nome text not null
    check (length(btrim(nome)) > 0),
  categoria text not null
    check (categoria in ('notebook', 'monitor', 'cabo', 'camera')),
  situacao text not null default 'disponivel'
    check (situacao in ('disponivel', 'emprestado', 'manutencao')),
  imagem_path text not null,
  foto_pexels_id bigint not null unique,
  foto_fotografo text not null,
  foto_fotografo_url text not null,
  foto_pagina_url text not null,
  foto_licenca text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.equipamentos is
  'Equipamentos emprestáveis. Escrita só pela chave secreta (script de dados) ou por funções security definer.';
comment on column public.equipamentos.foto_pexels_id is
  'Id da foto no Pexels. Único: a mesma foto não aparece em dois equipamentos.';

alter table public.equipamentos enable row level security;

-- Leitura para qualquer pessoa autenticada. Sem política de escrita: com RLS
-- ligado, insert/update/delete de anon e authenticated não afetam linha alguma.
create policy "equipamentos: leitura para autenticados"
  on public.equipamentos
  for select
  to authenticated
  using (true);

revoke insert, update, delete, truncate on public.equipamentos from anon, authenticated;
revoke select on public.equipamentos from anon;

-- Bucket público: a URL pública abre sem login. Só JPEG, até 1 MB.
-- Sem políticas em storage.objects para anon/authenticated: só a chave
-- secreta envia arquivos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipamentos', 'equipamentos', true, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
