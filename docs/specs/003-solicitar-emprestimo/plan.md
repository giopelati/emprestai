# Plano 003 — Solicitar empréstimo

## Status

Aprovado em 10/11/2026. Revisão do crédito na tela (T08, C5 da spec 002)
aprovada por Giovanna Pelati em 11/11/2026.

## ADRs aplicáveis

- ADR-001: React no frontend; Nest REST/MVC no backend; Zod para validar
  entrada; RLS; Jest.
- ADR-002: migration SQL nova em `supabase/migrations/`.
- ADR-003: backend fala com o PostgREST repassando o JWT da pessoa; regra
  atômica em função SQL chamada por RPC; nenhum segredo no backend.

## Bibliotecas

`zod` (ADR-001), versão exata `4.6.7`, no backend. Nada novo no frontend.

## Banco (T01)

Migration `supabase/migrations/<timestamp>_emprestimos.sql`:

- `public.emprestimos (id, equipamento_id → equipamentos, usuario_id →
  auth.users, retirado_em, devolucao_prevista date, devolvido_em)`.
- Índice único parcial `(equipamento_id) where devolvido_em is null`: no máximo
  um empréstimo aberto por equipamento, garantido pelo banco (CA-08).
- RLS: `select` só das próprias linhas (`usuario_id = auth.uid()`); sem
  política de escrita; `revoke` de escrita para `anon` e `authenticated`.
- Função `public.solicitar_emprestimo(p_equipamento_id uuid)`,
  `security definer`, `search_path = ''`, executável só por `authenticated`:
  1. sem `auth.uid()` → `NAO_AUTENTICADO`; papel fora de
     `colaborador`/`operacoes` → `PAPEL_INVALIDO`;
  2. `pg_advisory_xact_lock` pela pessoa (serializa limite e atraso da mesma
     pessoa);
  3. `select ... for update` no equipamento (serializa pedidos ao mesmo item);
  4. recusas na ordem da lacuna L4;
  5. `insert` com `devolucao_prevista = hoje(America/Sao_Paulo) + 14` e
     `update` do equipamento para `emprestado`, na mesma transação.
  Recusa é `raise exception '<CODIGO>'`; o backend traduz o código.
- Tabela nova e vazia: nenhuma linha existente é afetada. `equipamentos` não
  muda de estrutura.

## Backend (T02)

Estrutura MVC em `backend/src/`:

- `config.ts`: lê `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`; ausentes →
  respostas `503` com `CONFIGURACAO_AUSENTE`.
- `supabase/supabase-rest.service.ts`: `fetch` ao PostgREST com `apikey`
  pública e `Authorization` da pessoa.
- `auth/token.ts`: extrai `Bearer`; sem token → `401`.
- `equipamentos/`: `GET /equipamentos` → lista com `imagemUrl` pública
  (`/storage/v1/object/public/equipamentos/<imagem_path>?v=<foto_pexels_id>`),
  crédito e `comigo` (se a pessoa tem empréstimo aberto do item).
- `emprestimos/`: `POST /emprestimos` (Zod: `equipamentoId` uuid) chama a RPC;
  `GET /emprestimos/meus` lista os abertos com o equipamento embutido e
  `atrasado`.
- `erros.ts`: mapa código → HTTP e mensagem da spec; erro do PostgREST com
  JWT inválido → `401`; violação do índice único → `409`.
- CORS continua por `CORS_ORIGIN`.

## Frontend (T04, T05)

- `lib/api.ts`: chama `VITE_API_URL` com o `access_token` da sessão do
  Supabase; erro vira `{ codigo, mensagem }`.
- `ProtectedShell`: abas viram botões; `Catálogo` e `Meus empréstimos`
  renderizam as páginas novas; as demais seguem como placeholder (spec 001).
- `pages/CatalogoPage.tsx`: grade de cards (foto 4:3 com `width=800`
  `height=600`, categoria, nome, patrimônio, pill, botão conforme CA-03),
  confirmação no card (L6), mensagens em região `role="status"` / `role="alert"`,
  link `Fotos: Openverse` (era `Fotos: Pexels` até o C5 da spec 002).
- `pages/MeusEmprestimosPage.tsx`: resumo, lista ordenada, `Em atraso`,
  estado vazio com `Ir ao catálogo`.
- Estilos no `styles.css` existente, com as cores de situação do `layout.md`.

## Testes (T03)

Jest contra o Supabase local, como na spec 002: Nest sobe em porta livre com
`SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` locais; usuários de teste criados
pela API admin local; nomes `CA-xx: ...`; cada teste de endpoint confere status
e corpo; isolamento provado com outra pessoa (`rules/tests.md`).

## Verificação da tela (T06)

Frontend local apontando para o Supabase local e o backend local; medição com
a skill `conferir-tela` e conferência de textos no navegador.

## Produção (T07, pessoa)

Aplicar a migration; configurar na Vercel `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY` e `CORS_ORIGIN` no backend e `VITE_API_URL` no
frontend; publicar; rodar o roteiro da seção 07 do enunciado com conta própria.
