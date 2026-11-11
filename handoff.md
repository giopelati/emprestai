# Handoff

- Onde parei: specs 002 e 003 implementadas e verificadas localmente (CONFORME COM LIMITAÇÕES). Faltam só passos de pessoa: 002/T05 (fotos reais, precisa de `PEXELS_API_KEY` e revisão humana), 002/T06 e 003/T07 (produção).
- Commitado: branch `feat/003-solicitar-emprestimo` (contém `feat/002-dados-iniciais`). Relatórios do verificador em `docs/specs/<NNN>/verificacoes/`.
- Banco local: `npm run db:reset` aplica as duas migrations; `npm test --workspace backend` → 23 passed. Nada fica no banco local entre sessões que importe.
- Publicado: `backend/` e `frontend/` (com ENTREGA.md) na branch `feat/003-solicitar-emprestimo` dos repositórios `emprestai-backend` e `emprestai-frontend` (preview da Vercel). Produção (`feat/001-login`) ainda está com o Login. Banco de produção sem as migrations.
- Monorepo (specs, ADRs, rules, subagente, skill) ainda não está em nenhum remoto: criar o repositório `emprestai` e fazer push.
- Não fazer: não aplicar migration nem rodar scripts com sufixo de produção pelo agente; não mudar status de spec para `Pronta` sem rodada CONFORME (o pre-commit recusa); não editar migration já aplicada.
- Próximo passo: siga `docs/producao/roteiro-pratica.md` do passo 1 ao 8.
