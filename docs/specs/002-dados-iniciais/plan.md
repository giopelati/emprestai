# Plano 002 — Dados iniciais

## Status

Aprovado em 10/11/2026.

## ADRs aplicáveis

- ADR-001: Supabase (Postgres, Auth, Storage), RLS, Jest, TypeScript.
- ADR-002: migration SQL em `supabase/migrations/`, aplicada localmente por
  `npm run db:reset`; produção aplicada por pessoa.
- ADR-003: acesso a dados pela API REST do Supabase; nada de Prisma aqui.

## Bibliotecas

Nenhuma biblioteca de aplicação nova. `supabase` (CLI, ADR-002) e `jest`
(ADR-001) entram como dependências de desenvolvimento em versão exata. `sharp`
**não** entra (spec, conflito C1).

## Solução

### Skill `imagens-equipamentos` (T01)

Scripts Node sem dependência (`fetch`, `crypto`, `fs`):

- `preparar.mjs`: busca no Pexels (`orientation=landscape`), descarta pelo
  `alt` o que indica pessoa, marca ou texto, pula ids usados ou reprovados,
  baixa `src.original` com `fit=crop&w=800&h=600` e recusa o arquivo se o
  cabeçalho JPEG não disser 800×600. Gera folha de revisão HTML no cache
  (`.cache/`, fora do Git).
- `revisar.mjs`: revisão humana, só em TTY. Grava aprovação com revisor e data
  em `supabase/dados/creditos-imagens.json` e reprovação com motivo em
  `supabase/dados/imagens-rejeitadas.json`.
- `enviar.mjs`: valida créditos (12, sem id repetido, com revisão), confere
  800×600, envia `<patrimonio>.jpg` com `x-upsert: true` e confere de novo pela
  URL pública sem credencial.
- Produção: `--producao` lê `PRODUCAO_SUPABASE_*` de `.env.producao`, exige TTY
  e que a pessoa digite a referência do projeto.

As fotos não vão para o Git (licença do Pexels proíbe redistribuir como banco
de imagens); o crédito, a URL de download e o hash vão, e permitem baixar de
novo a mesma foto.

### Migration (T02)

`supabase/migrations/20261111010559_equipamentos.sql`:

- `public.equipamentos` com `patrimonio` único e formato `TI-0000`, `categoria`
  e `situacao` restritas por `check`, `imagem_path`, colunas de crédito e
  `foto_pexels_id` único.
- RLS ligado; política de `select` para `authenticated`; sem política de
  escrita; `revoke` de escrita para `anon` e `authenticated` e de leitura para
  `anon`.
- Bucket `equipamentos` público, só `image/jpeg`, até 1 MB, criado com
  `on conflict do update`.

Tabela nova, sem dados: nenhuma linha existente é afetada.

### Script de dados (T03)

`scripts/dados/popular.mjs`, com a chave secreta do alvo:

1. Envia as imagens pela skill.
2. Lê os patrimônios existentes; cria os novos com a situação da lista e
   atualiza os existentes sem tocar na situação (lacuna L2).
3. Procura a conta do professor pelo e-mail na API admin do Auth; cria ou
   atualiza com `app_metadata.role = colaborador`, e-mail confirmado e a senha
   de `SENHA_PROFESSOR`. Sem senha no alvo local, pula a conta e avisa.

Local: URL e chave vêm de `npx supabase status`; o script recusa host que não
seja local. Produção: só `npm run dados:popular:producao`, por pessoa.

### Testes (T04)

Jest no workspace `backend`, contra o Supabase local:

- TypeScript compilado por `tsc -p tsconfig.test.json` para `dist-test/` e
  executado com `node --experimental-vm-modules` (o backend é ESM).
- Os testes descobrem URL e chaves com `npx supabase status` e abortam se o
  host não for local (`rules/tests.md`).
- Usuários de teste com e-mail `@emprestai.test` e senha aleatória por
  execução. Imagens de teste: JPEG sintético 800×600 gerado no próprio teste,
  só no banco local.
- Comando: `npm test --workspace backend`, após `npm run db:reset`.

## Riscos

- Sem `PEXELS_API_KEY`, T05 não roda. A chave é pessoal e só a dona da conta
  cria.
- O Pexels pode mudar o CDN; nesse caso o envio falha (o tamanho é conferido),
  em vez de publicar imagem errada.
