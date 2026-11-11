# ADR 003 — Como o backend acessa os dados

## Status

Aceito em 10/11/2026. Restringe a linha "ORM: Prisma → Zod" do ADR-001 para as
features de empréstimo.

## Contexto

O ADR-001 escolhe, ao mesmo tempo, **RLS** para autenticação de dados e
**Prisma** como ORM. As duas escolhas não convivem sem trabalho extra: o Prisma
abre conexões diretas com um papel privilegiado do Postgres (`DATABASE_URL`),
e uma conexão assim ignora RLS. Para que o RLS valesse, cada consulta do Prisma
teria de rodar numa transação que troca o papel e injeta as claims do JWT
(`set local role authenticated; set_config('request.jwt.claims', ...)`), e o
backend precisaria validar o JWT por conta própria antes disso.

Além disso, o backend roda na Vercel como função serverless: conexão direta ao
Postgres exige pooler e a variável secreta `DATABASE_URL` no deploy.

## Decisão

- O backend Nest continua sendo a única API de empréstimos do frontend
  (REST/MVC, ADR-001).
- O backend acessa os dados pela API REST do próprio Supabase (PostgREST),
  com `fetch` nativo do Node, repassando o JWT da pessoa logada. O Supabase
  valida o token e aplica RLS com a identidade dela.
- Regras que precisam de atomicidade (solicitar empréstimo) ficam numa função
  SQL chamada por RPC, dentro de uma transação do Postgres.
- Zod valida a entrada de cada endpoint (ADR-001).
- O backend usa só variáveis públicas (`SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`). Nenhum segredo do banco vai para a Vercel.
- Prisma não é usado neste incremento.

## Alternativas consideradas

- **Prisma com troca de papel por transação.** Mantém o ORM do ADR-001, mas
  exige `DATABASE_URL` secreta na Vercel, pooler para serverless, validação
  própria de JWT (biblioteca fora do ADR-001) e reimplementa, em cada consulta,
  o que o PostgREST já faz. Descartada para este incremento.
- **Prisma com papel privilegiado e regras de acesso no código.** Abandona o
  RLS do ADR-001. Descartada.
- **Frontend falando direto com o PostgREST.** Elimina o backend, contra o
  REST/Nest do ADR-001 e contra a spec 001, que reserva o acesso direto do
  frontend ao Supabase apenas para autenticação. Descartada.

## Consequências

- Fica mais fácil: o RLS vale para toda leitura e escrita do backend; o deploy
  do backend não guarda segredo de banco.
- Fica mais difícil: consultas complexas viram views ou funções SQL, porque o
  PostgREST não monta SQL arbitrário.
- Se o Prisma voltar a ser necessário, este ADR precisa ser revisto.
