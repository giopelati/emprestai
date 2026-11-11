# Tarefas 002 — Dados iniciais

Cada tarefa cabe em um commit. Ordem obrigatória.

## T01 — Skill imagens-equipamentos

- CAs: CA-03, CA-04, CA-05, CA-09
- Arquivos: `skills/imagens-equipamentos/**`, `supabase/dados/equipamentos.json`,
  `.env.example`, `package.json` (scripts `imagens:*`), `.gitignore`.
- Estado: [x] concluída. Gate CONFORME na rodada 2 (`verificacoes/20261111-011444-gate-8fdda33.md`).

## T02 — Migration de equipamentos e bucket

- CAs: CA-01, CA-04, CA-08
- Arquivos: `supabase/migrations/20261111010559_equipamentos.sql`,
  `supabase/config.toml`.
- Estado: [x] concluída. `npm run db:reset` recriou o banco local e aplicou a migration.

## T03 — Script de dados

- CAs: CA-01, CA-02, CA-06, CA-07, CA-09
- Arquivos: `scripts/dados/popular.mjs`, `package.json` (scripts `dados:*`).
- Estado: [ ] pendente.

## T04 — Testes automatizados

- CAs: CA-01 a CA-09
- Arquivos: `backend/package.json`, `backend/tsconfig.test.json`,
  `backend/scripts/jest.mjs`, `backend/test/**`, `package-lock.json`,
  `.gitignore`, `AGENTS.md`.
- Estado: [ ] pendente.

## T05 — Fotos reais (pessoa)

- CAs: CA-03, CA-04, CA-05
- Passos: `npm run imagens:preparar` → `npm run imagens:revisar` (pessoa) →
  repetir até 12 aprovadas → `npm run imagens:enviar` → commit de
  `supabase/dados/creditos-imagens.json` e `supabase/dados/imagens-rejeitadas.json`.
- Estado: [ ] pendente — falta `PEXELS_API_KEY`.

## T06 — Produção (pessoa)

- CAs: CA-01 a CA-07 em produção
- Passos: aplicar as migrations pendentes no projeto de produção;
  `npm run dados:popular:producao`; rodar de novo e conferir que nada
  duplicou; entrar com a conta do professor no link da Vercel.
- Arquivos: nenhum; registrar o resultado aqui.
- Estado: [ ] pendente.
