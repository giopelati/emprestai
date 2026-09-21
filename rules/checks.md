---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa

> leitor: agente

## Quando

Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Preparação

Antes de alterar arquivos, rode `git status --short` e registre o estado
inicial. Não toque em alterações preexistentes fora do escopo da tarefa.

## Procedimento

1. Consulte `AGENTS.md` e rode o comando de testes documentado. Cole a
   última linha da saída na resposta.
2. Se não houver comando de testes documentado, não invente: registre
   `não executado: comando não documentado`. Um check aplicável que não foi
   executado não conta como sucesso.
3. Se a tarefa tocar em schema ou migration, siga `rules/migration.md` e
   execute somente a verificação local definida pela estratégia documentada.
4. Antes de qualquer push, rode o comando de build documentado em
   `AGENTS.md`. Se não houver, registre a limitação e não trate o build como
   aprovado.
5. Rode `git status --short` novamente. Compare com o estado inicial: somente
   as alterações produzidas pela tarefa podem estar no escopo. Liste
   separadamente qualquer alteração preexistente.
6. Se houver spec com critério de aceitação identificado, diga qual CA a
   tarefa atende. Se não houver spec ou CA, diga `não se aplica`; não invente
   um identificador.

## Verificação

Pronto = todos os checks aplicáveis foram executados e terminaram sem falha,
e o estado final do Git não trouxe alteração inesperada em relação ao estado
inicial. Check aplicável não executado é limitação, não sucesso.

## Não faça

- Não relate sucesso parcial. Siga `rules/restrictions.md`.
- Não tente consertar a mesma falha duas vezes seguidas sem mostrar ao
  usuário a saída do erro.
- Não rode teste contra o banco remoto.
