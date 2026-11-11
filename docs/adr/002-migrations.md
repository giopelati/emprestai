# ADR 002 — Estratégia de migrations

## Status

Aceito em 10/11/2026. Preenche a linha "Migration: não decidido" do ADR-001.

## Contexto

As features `002-dados-iniciais` e `003-solicitar-emprestimo` precisam das
primeiras tabelas, de políticas RLS, de uma função transacional e de um bucket
do Storage. `rules/migration.md` proibia qualquer mudança de schema enquanto a
estratégia não estivesse documentada, e `rules/restrictions.md` proíbe o agente
de tocar no Supabase remoto.

Duas restrições pesaram:

1. O ADR-001 escolhe RLS como mecanismo de autenticação de dados. Políticas RLS,
   funções `security definer` e buckets do Storage são objetos do Postgres do
   Supabase, fora do que um ORM modela.
2. O banco de produção é escrito só por uma pessoa do time, nunca pelo agente.
   A migration precisa ser um arquivo que essa pessoa consiga ler e aplicar.

## Decisão

- Migrations são arquivos SQL versionados em `supabase/migrations/`, no formato
  do Supabase CLI (`<timestamp>_<nome>.sql`), uma migration por mudança de
  schema de cada spec.
- O Supabase CLI é instalado como dependência de desenvolvimento da raiz, em
  versão exata (`supabase@3.1.0`). Não é biblioteca de aplicação: não entra no
  bundle do frontend nem do backend.
- Local: `npm run db:reset` recria o banco do zero aplicando todas as
  migrations. É o check obrigatório de `rules/migration.md`.
- Produção: a pessoa do time aplica as migrations pendentes, na ordem, com
  `npx supabase db push` (projeto ligado por ela) ou colando cada arquivo no SQL
  Editor do painel. O agente não executa esse passo e não tem a credencial.
- Migration aplicada não é editada. Correção vira migration nova.

## Alternativas consideradas

- **Prisma Migrate.** Prisma está no ADR-001, mas o Migrate gera DDL a partir
  do `schema.prisma` e não representa RLS, policies, funções nem buckets; tudo
  isso viraria SQL manual dentro de migrations do Prisma, com duas fontes de
  verdade para o mesmo schema. Descartada.
- **SQL solto aplicado à mão, sem ferramenta.** Não tem histórico de aplicação
  nem como recriar o banco local do zero de forma repetível. Descartada.

## Consequências

- Fica mais fácil: recriar o banco local idêntico em um comando; revisar a
  migration como texto antes de aplicá-la em produção.
- Fica mais difícil: usar o Prisma como fonte do schema. Se o Prisma for usado
  no futuro, ele lê o schema (introspecção), não o define.
- Precisa de Docker para o banco local.
