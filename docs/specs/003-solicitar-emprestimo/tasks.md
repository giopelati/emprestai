# Tarefas 003 — Solicitar empréstimo

Cada tarefa cabe em um commit. Ordem obrigatória.

## T01 — Migration de empréstimos e função de solicitação

- CAs: CA-04, CA-05, CA-06, CA-07, CA-08, CA-10, CA-11
- Arquivos: `supabase/migrations/*_emprestimos.sql`.
- Estado: [x] concluída. Gate CONFORME (`verificacoes/20261111-012007-gate-904e5a0.md`); `npm run db:reset` aplicou as duas migrations do zero.

## T02 — API de catálogo e empréstimos

- CAs: CA-01, CA-04, CA-05, CA-06, CA-07, CA-09, CA-10, CA-11
- Arquivos: `backend/src/**`, `backend/package.json`, `backend/.env.example`,
  `package-lock.json`.
- Estado: [x] concluída. Typecheck e build do backend sem erro.

## T03 — Testes da API

- CAs: CA-01, CA-04 a CA-11
- Arquivos: `backend/test/solicitar-emprestimo.test.ts`, `backend/test/apoio/**`.
- Estado: [x] concluída. `npm test --workspace backend`: 23 testes passaram (13 da 002, 10 da 003) após `npm run db:reset`.

## T04 — Catálogo na tela

- CAs: CA-01, CA-02, CA-03, CA-04, CA-05, CA-06
- Arquivos: `frontend/src/lib/api.ts`, `frontend/src/pages/CatalogoPage.tsx`,
  `frontend/src/components/ProtectedShell.tsx`, `frontend/src/styles/styles.css`,
  `frontend/src/vite-env.d.ts`.
- Estado: [ ] pendente.

## T05 — Meus empréstimos na tela

- CAs: CA-02, CA-09
- Arquivos: `frontend/src/pages/MeusEmprestimosPage.tsx`,
  `frontend/src/components/ProtectedShell.tsx`, `frontend/src/styles/styles.css`.
- Estado: [ ] pendente.

## T06 — Verificação da tela no ambiente local

- CAs: CA-01, CA-02, CA-03, CA-04, CA-05, CA-09
- Arquivos: `docs/specs/003-solicitar-emprestimo/tasks.md` (registro).
- Estado: [ ] pendente.

## T07 — Produção (pessoa)

- CAs: CA-01 a CA-11 em produção
- Passos: aplicar a migration; variáveis da Vercel; publicar; roteiro da seção
  07 do enunciado com conta própria; conferir zero empréstimos na conta do
  professor.
- Arquivos: nenhum; registrar o resultado aqui.
- Estado: [ ] pendente.
