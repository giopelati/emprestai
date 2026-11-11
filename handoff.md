# Handoff

- Onde parei: `001-login` implementada, mas não pronta. T01 e T06 concluídas; T02 a T05 aguardam CA-05, CA-06, CA-07, a restauração do CA-08 e CA-10 com Supabase local. Evidências em `docs/specs/001-login/tasks.md`.
- Commitado: branch `feat/001-login`, último commit `6332166`, 6 commits à frente de `master` (`f48221f`).
- Não commitado em 05/11/2026: `agents/verificador-spec.md`, `skills/conferir-tela/` e correções em `AGENTS.md`, `handoff.md`, `rules/` e `docs/specs/001-login/`.
- Banco local: nada aplicado. Não há Supabase local documentado, schema, migration ou policy.
- Publicado: `frontend/` em `emprestai-frontend`, branch `feat/001-login` (`08c862b`), e `backend/` em `emprestai-backend`, branch `feat/001-login` (`50dcc4c`). Ambos têm o mesmo conteúdo do commit `6332166`. `docs/`, `rules/` e `agents/` não estão em nenhum remoto.
- Pendente de decisão do time:
  - O backend Nest (`GET /health`, commit `9dc87af`) contraria `spec.md` e `plan.md` e não tem spec.
  - O ADR-001 conflita com a spec em autenticação (RLS × Supabase Auth) e não menciona a Vercel.
  - `agents/verificador-spec.md` ainda não é carregado como subagente; falta definir a ferramenta e o formato.
  - Os arquivos `.env` locais apontam para o Supabase remoto, contra `AGENTS.md` e `rules/restrictions.md`.
  - Faltam pré-requisitos da aula 10: `docs/adr/002-design-system.md`, `rules/operacao.md`, tela de teste do design e tabelas por migration.
  - MCP: nenhum ligado. O Supabase remoto conflita com `rules/restrictions.md`, e o local depende de ser documentado.
- Não fazer: não rode login real com os `.env` atuais, porque tocaria o Supabase remoto; não escreva nem altere ADR; não marque T02 a T05 sem executar a verificação; não inicie o Catálogo sem spec própria.
- Próximo passo: resolva as decisões pendentes e documente o Supabase local para concluir a verificação de T02 a T05.
