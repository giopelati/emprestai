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

A estratégia de migrations ainda não foi decidida. Não escolha ferramenta,
caminho, convenção, quantidade de migrations nem comando de aplicação.
Se uma tarefa depender dessa decisão, descreva a necessidade e as
alternativas e PARE até que o time documente a escolha.

## Procedimento

1. Antes de gerar ou aplicar qualquer coisa, escreva o DDL pretendido na
   resposta e PARE. O usuário aprova ou corrige.
2. Se a tabela já tiver dados, explique o que acontecerá com as linhas
   existentes. Uma coluna obrigatória nova precisa prever como os valores
   existentes serão tratados.
3. Se a mudança exigir decisões de RLS ou policies não cobertas por ADR ou
   spec, liste as perguntas e PARE. Não presuma um modelo de acesso.
4. Depois que a estratégia de migrations estiver documentada, use somente
   os comandos confirmados no `AGENTS.md` e siga `rules/checks.md`.
5. Se um comando necessário não estiver documentado, não improvise. Informe
   que a aplicação ou a verificação local não pôde ser executada.

## Verificação

Uma mudança de schema só pode ser declarada verificada quando todos os
checks locais definidos pela estratégia documentada tiverem terminado sem
falha, incluindo a criação do banco do zero quando esse check for exigido.

## Não faça

- Não aplique mudança de schema por nenhum meio enquanto a estratégia de
  migrations não estiver documentada.
- Não invente comando, caminho ou convenção de migration.
- Não toque no Supabase remoto. Siga `rules/restrictions.md`.
