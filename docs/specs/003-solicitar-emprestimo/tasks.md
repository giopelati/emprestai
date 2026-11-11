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
  `frontend/src/components/CreditoPexels.tsx` (acrescentado: o crédito é
  usado pelas duas telas). `vite-env.d.ts` já tinha `VITE_API_URL` e não mudou.
- Estado: [x] concluída junto com T05 no mesmo commit: as duas mexem nas mesmas
  linhas de `ProtectedShell.tsx` e `styles.css` (abas viraram botões). Typecheck
  e build do frontend sem erro.

## T05 — Meus empréstimos na tela

- CAs: CA-02, CA-09
- Arquivos: `frontend/src/pages/MeusEmprestimosPage.tsx`,
  `frontend/src/components/ProtectedShell.tsx`, `frontend/src/styles/styles.css`.
- Estado: [x] concluída (commit único com T04, ver acima).

## T06 — Verificação da tela no ambiente local

- CAs: CA-01, CA-02, CA-03, CA-04, CA-05, CA-09
- Arquivos: `docs/specs/003-solicitar-emprestimo/tasks.md` (registro).
- Estado: [x] concluída em 10/11/2026.

Ambiente: Supabase local (`npm run db:start`), backend buildado em
`localhost:3000` e Vite em `localhost:5173`, com `SUPABASE_URL`,
`VITE_SUPABASE_URL` e chaves do banco local definidos no processo (vencem os
`.env`). Equipamentos da lista populados com `scripts/dados/popular.mjs` e
imagem **provisória local** 800×600 (fotos reais dependem da T05 da spec 002;
nada disso saiu da máquina). Conta de teste `@emprestai.test`, papel
`colaborador`, senha aleatória. Navegador embutido.

| CA | Passo | Resultado |
|---|---|---|
| CA-01 | Entrar e abrir Catálogo | 12 cards com foto, categoria, nome, patrimônio e pill; `9 de 12 equipamentos disponíveis agora` |
| CA-02 | Ler rodapé e foto | Link `Fotos: Pexels` → `https://www.pexels.com/`; `title` da foto `Foto de <fotógrafo> no Pexels`; nenhum `footer` |
| CA-03 | Cards de TI-0004/0007/0010 | Botão `Em manutenção` desabilitado; disponíveis com `Solicitar` |
| CA-04 | Solicitar → Confirmar no TI-0001 | `Empréstimo registrado. Devolva até 24/11/2026.`; card `Está com você`; `8 de 12` |
| CA-05 | Solicitar TI-0002, TI-0003 e depois TI-0005 | Terceiro ok; quarto mostra em `role="alert"`: `Você já está com 3 itens emprestados. Devolva um para solicitar outro.` |
| CA-09 | Abrir Meus empréstimos | `3 de 3 itens em seu nome · prazo padrão de 14 dias`, três linhas com `Devolver até 24/11/2026` e `Em dia` |
| CA-01/CA-09 | Janela 375×812 | Sem rolagem horizontal no catálogo e em Meus empréstimos; grade em uma coluna |

Não verificado na tela: CA-06 (a mensagem de atraso usa o mesmo caminho de
alerta do CA-05 e está provada na API pelo teste `CA-06`), estado vazio de Meus
empréstimos (provado na API pelo teste `CA-09`), fotos reais.

## T07 — Produção (pessoa)

- CAs: CA-01 a CA-11 em produção
- Passos: aplicar a migration; variáveis da Vercel; publicar; roteiro da seção
  07 do enunciado com conta própria; conferir zero empréstimos na conta do
  professor.
- Arquivos: nenhum; registrar o resultado aqui.
- Estado: [ ] pendente.
