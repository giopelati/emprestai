---
description: Procedimento para qualquer mudança de schema
globs: []
alwaysApply: true
---

# Mudança de schema

> leitor: agente

## Quando

Qualquer tarefa que precise criar, alterar ou remover tabela, coluna,
índice, constraint ou política de acesso — inclusive quando a mudança
parecer trivial.

## Estado da decisão

Decidida em `docs/adr/002-migrations.md`: SQL versionado em
`supabase/migrations/`, aplicado localmente pelo Supabase CLI. Comandos
confirmados estão em `AGENTS.md`.

## Procedimento

1. Antes de gerar ou aplicar qualquer coisa, escreva o DDL pretendido na
   resposta e PARE. O usuário aprova ou corrige.
2. Se a tabela já tiver dados, explique o que acontecerá com as linhas
   existentes. Uma coluna obrigatória nova precisa prever como os valores
   existentes serão tratados.
3. Se a mudança exigir decisões de RLS ou policies não cobertas por ADR ou
   spec, liste as perguntas e PARE. Não presuma um modelo de acesso.
4. Crie a migration com `npx supabase migration new <nome>` e aplique só no
   banco local com `npm run db:reset`, que recria o banco do zero. Depois siga
   `rules/checks.md`.
5. Migration já aplicada não é editada: correção vira migration nova.
6. Se um comando necessário não estiver documentado, não improvise. Informe
   que a aplicação ou a verificação local não pôde ser executada.

## Verificação

Uma mudança de schema só pode ser declarada verificada quando todos os
checks locais definidos pela estratégia documentada tiverem terminado sem
falha, incluindo a criação do banco do zero quando esse check for exigido.

## Não faça

- Não aplique migration em produção, nem com `supabase db push`, nem pelo
  painel. Quem aplica em produção é uma pessoa do time.
- Não invente comando, caminho ou convenção de migration.
- Não toque no Supabase remoto. Siga `rules/restrictions.md`.
