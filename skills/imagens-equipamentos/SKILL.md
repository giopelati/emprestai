---
name: imagens-equipamentos
description: Obtém, revisa e publica as fotos dos equipamentos do Emprestaí — uma por patrimônio, do Openverse (fotos do Flickr), 800×600, sem repetição, com crédito registrado, num bucket público do Supabase Storage. Use quando pedirem foto, imagem ou crédito de equipamento, trocar a foto de um item, ou popular o bucket `equipamentos`. Não use para logo, landing ou ilustração, nem para escolher biblioteca de imagem.
paths: "skills/imagens-equipamentos/**, supabase/dados/**"
---

# Imagens de equipamentos

Toda foto de equipamento do sistema sai desta skill. Nenhuma outra origem de
imagem de equipamento é aceita, e nenhuma biblioteca de imagem é instalada: o
800×600 vem do tamanho `_c` do Flickr e é conferido por código. Fonte: Openverse
(conflito C5 da spec 002; o Pexels suspendeu chaves novas).

## Quem faz o quê

| Passo | Comando | Quem |
|---|---|---|
| 1. Buscar, triar e baixar | `npm run imagens:preparar` | agente ou pessoa |
| 2. Revisão visual | `npm run imagens:revisar` | **só pessoa** (exige terminal interativo) |
| 3. Enviar ao banco local | `npm run imagens:enviar` | agente ou pessoa |
| 4. Enviar à produção | `npm run imagens:enviar:producao` | **só pessoa** (TTY + confirmação + chave que o agente não tem) |

O agente nunca aprova imagem e nunca envia à produção. Se o passo 2 ou 4 for
necessário, pare e diga à pessoa qual comando rodar.

## Antes de começar

1. A lista de equipamentos é `supabase/dados/equipamentos.json`. Não edite: é
   a lista da prática, igual para todos.
2. A API do Openverse não pede chave. Para detalhes (busca, campos, licenças,
   atribuição), leia `references/openverse-api.md`.

## Procedimento

1. Rode `npm run imagens:preparar`. Ele junta até 6 candidatas por
   equipamento (só 4:3, licença CC0/domínio público/CC BY), pula fotos já usadas
   e reprovadas, descarta pelo título e pelas tags o que indica pessoa, marca ou
   texto e recusa qualquer arquivo que não seja JPEG 800×600. Gera `.cache/imagens-equipamentos/revisao.html`.
2. Peça à pessoa a revisão visual com `npm run imagens:revisar`, seguindo
   `references/revisao-visual.md`. Aprovação grava o crédito em
   `supabase/dados/creditos-imagens.json`; reprovação grava o motivo em
   `supabase/dados/imagens-rejeitadas.json`.
3. Se houve reprovação, volte ao passo 1: as reprovadas não voltam.
4. Com as 12 aprovadas, rode `npm run imagens:enviar` para o banco local
   (precisa de `npm run db:start` e das migrations aplicadas).
5. Commite os dois JSON de `supabase/dados/`. As fotos não vão para o Git:
   ficam no cache local e no bucket.

## O que é garantido por código

- Origem: download só de `live.staticflickr.com`; qualquer outro host é recusado.
- Tamanho: `exigirTamanho` lê o cabeçalho JPEG antes de salvar, antes de
  enviar e depois de enviar, pela URL pública.
- Sem repetição: o envio recusa `foto_id` repetido e o banco tem
  `unique (foto_pexels_id)` (nome mantido; guarda o id do Flickr).
- Créditos: o envio recusa crédito sem `foto_id`, fotógrafo, URL do
  fotógrafo, página, licença ou registro de revisão humana.
- Idempotência: um objeto por patrimônio (`<patrimonio>.jpg`) com
  `x-upsert: true`.
- Produção: `--producao` exige TTY, `PRODUCAO_SUPABASE_*` em `.env.producao` e
  digitar a referência do projeto. O hook `scripts/guardas/bloquear-producao.mjs`
  ainda nega ao agente qualquer comando com `:producao`.

## O que depende de revisão humana

Pessoa, marca ou logo legível, texto e tela com conteúdo. A triagem pelo texto
alternativo só elimina o óbvio; ela não enxerga a foto.

## Verificação

`npm run imagens:enviar` termina com 12 linhas "enviada e conferida", e
`supabase/dados/creditos-imagens.json` tem 12 entradas com `revisado_por`.

## Não faça

- Não instale `sharp` nem outra biblioteca de imagem (ADR-001,
  `rules/restrictions.md`).
- Não edite `creditos-imagens.json` à mão para aprovar uma foto.
- Não use imagem de outra origem, nem como provisória.
