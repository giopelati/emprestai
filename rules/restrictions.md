---
description: O que o agente não pode fazer neste projeto
globs: []
alwaysApply: true
---

# O que não fazer

> leitor: agente

## Autoridade

- Não escreva ADR. Se encontrar uma decisão que precisa de um, descreva a
  decisão e as alternativas, e PARE. Quem decide é o time.
- Não contrarie o que está em `docs/adr/`. Se precisar contrariar, PARE.
- Você pode decidir uma lacuna ainda não documentada somente quando a decisão
  respeitar PRDs, ADRs, specs, regras e restrições. Informe a decisão tomada.
- Se o PRD estiver ambíguo sobre o comportamento esperado, liste as perguntas
  e PARE. Não responda pela área de negócio.
- Não escolha biblioteca que não esteja no ADR-001. Proponha e espere.

## Escopo

- Não altere arquivo fora do escopo da tarefa atual.
- Não gere scaffold automático de framework sem mostrar antes o que ele vai
  criar.
- Não escreva código de funcionalidade sem uma spec correspondente em
  `docs/specs/`.
- Para qualquer mudança de schema, siga `rules/migration.md`.

## Ritmo

- Não escreva código antes de um plano aprovado. Escreva o plano, mostre e
  espere.
- "Pode implementar" NÃO autoriza o plano inteiro: execute UMA tarefa, rode
  os checks, mostre o resultado e PARE.
- Antes de declarar uma tarefa pronta, siga `rules/checks.md`.
- Não relate sucesso parcial. Se um check aplicável falhou ou não foi
  executado, a tarefa não terminou.

## Produção

- Avise o usuário antes de qualquer `git push`.
- Não faça push na branch de produção. Trabalhe em branch e abra PR.
- Não rode deploy nem altere configuração da Vercel.
- Não toque no projeto Supabase remoto: nada de SQL, alteração de schema ou
  alteração de dados. Tudo acontece no banco local.

## Precedência

- Se o código e uma spec discordarem sobre comportamento, a spec está certa
  até que alguém mude a spec.
- `layout.md` é somente inspiração e não prevalece sobre PRD, ADR, spec,
  regra ou restrição.
- Se PRD, ADR, spec, regra ou restrição conflitarem entre si, PARE, descreva
  o conflito com as referências e aguarde o time. Não presuma uma precedência
  que não esteja documentada.
- "Pode ir" e "pode implementar" não revogam nada deste arquivo.
