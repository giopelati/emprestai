# Roteiro de produção — prática SDD

Passos que **só uma pessoa** executa (regra da prática: o agente nunca escreve
em produção). Rode em PowerShell ou no terminal do VS Code, na raiz do
projeto: os scripts de produção exigem terminal interativo. Tempo estimado:
25 a 35 minutos.

Estado antes deste roteiro: specs 002 e 003 implementadas e verificadas no
banco local; código nas branches `feat/003-solicitar-emprestimo` dos dois
repositórios (preview da Vercel), produção ainda com a versão do Login.

## 1. Fotos reais (spec 002, T05)

1. Nada de chave: as fotos vêm do Openverse (C5 da spec 002). As candidatas
   já estão em `.cache/imagens-equipamentos/`.
2. Abra o Docker Desktop e rode `npm run db:start`.
3. `npm run imagens:preparar`
4. Abra `.cache/imagens-equipamentos/revisao.html` no navegador e olhe cada
   foto (critérios em `skills/imagens-equipamentos/references/revisao-visual.md`).
5. `npm run imagens:revisar` — responda `s` ou `n` (com motivo) para cada uma.
6. Se reprovou alguma, repita 3 a 5 até ter 12 aprovadas.
7. Conferência local: `npm run db:reset`, `npm run dados:popular`,
   `npm test --workspace backend`.
8. Commit: `git add supabase/dados` e
   `git commit -m "feat(dados): fotos aprovadas na revisão humana (002/T05)"`.
9. Anote em `docs/specs/002-dados-iniciais/tasks.md` (T05): quantas foram
   reprovadas e por quê (está em `supabase/dados/imagens-rejeitadas.json`).

## 2. Banco de produção (specs 002 e 003)

No painel do Supabase do projeto de produção → SQL Editor, rode, nesta ordem,
o conteúdo de:

1. `supabase/migrations/20261111010559_equipamentos.sql`
2. `supabase/migrations/20261111012009_emprestimos.sql`

## 3. Dados de produção (spec 002, T06)

1. Crie `.env.producao` na raiz (fora do Git) com:
   `PRODUCAO_SUPABASE_URL`, `PRODUCAO_SUPABASE_SECRET_KEY` (painel → Project
   Settings → API Keys → secret) e `SENHA_PROFESSOR` (senha padrão da turma).
2. Rode o script `dados:popular` com o sufixo `:producao`
   (`npm run dados:popular:producao`) e digite a referência do projeto quando
   pedir. Saída esperada: 12 linhas "enviada e conferida", "12 criados" e
   "Conta do professor criada".
3. Rode de novo. Esperado: "0 criados, 12 atualizados" e "Conta do professor
   atualizada" — é a prova de que repetir não duplica.
4. Apague `.env.producao` ou guarde fora da pasta do projeto.

## 4. Conta de teste sua (nunca a do professor)

Painel → Authentication → Add user (e-mail seu de teste, senha sua, "Auto
confirm"). Depois, no SQL Editor:

```sql
update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"colaborador"}'
 where email = 'SEU-EMAIL-DE-TESTE';
```

## 5. Variáveis da Vercel

- Projeto do backend (`emprestai-backend`): `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY` e
  `CORS_ORIGIN=https://emprestai-frontend-roan.vercel.app`.
- Projeto do frontend (`emprestai-frontend-roan`):
  `VITE_API_URL=https://emprestai-backend.vercel.app`.

Hoje o backend de produção responde `404` ao preflight de CORS: `CORS_ORIGIN`
não está definida lá.

## 6. Publicar

Nos dois repositórios, abra o PR de `feat/003-solicitar-emprestimo` para
`feat/001-login` (a branch de produção) e faça o merge:

- https://github.com/giopelati/emprestai-backend/compare/feat/001-login...feat/003-solicitar-emprestimo
- https://github.com/giopelati/emprestai-frontend/compare/feat/001-login...feat/003-solicitar-emprestimo

Espere os dois deploys de produção terminarem.

## 7. Roteiro do professor, com a SUA conta (seção 07 do enunciado)

1. Entrar no link da Vercel com a sua conta de teste.
2. Ver os 12 equipamentos, todos com foto do mesmo tamanho.
3. Ver TI-0004, TI-0007 e TI-0010 com `Em manutenção` desabilitado.
4. Solicitar 3 disponíveis: aparecem em `Meus empréstimos` com
   `Devolver até` hoje + 14 dias.
5. Ver que eles deixaram de aparecer como disponíveis.
6. Tentar o quarto: recusa com `Você já está com 3 itens emprestados...`.
7. Entrar com a conta do professor só para conferir que abre e tem zero
   empréstimos (não solicite nada com ela). No SQL Editor:

```sql
select count(*) from public.emprestimos e
  join auth.users u on u.id = e.usuario_id
 where u.email = 'marcelo.grilo@institutojef.org.br';
```

Resultado esperado: `0`. Registre os resultados em
`docs/specs/002-dados-iniciais/tasks.md` (T06) e
`docs/specs/003-solicitar-emprestimo/tasks.md` (T07).

## 8. Fechar a entrega

1. Complete os itens marcados com `PENDENTE` no `ENTREGA.md`.
2. Rode a verificação de entrega das duas specs (subagente
   `verificador-spec`) e só então mude o status das specs para `Pronta` — o
   pre-commit recusa sem relatório `CONFORME` do commit atual.
3. Tag e push (veja a seção "Publicação" do `ENTREGA.md`).
