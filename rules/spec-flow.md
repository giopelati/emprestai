# Fluxo obrigatório de specs

## Regra principal

Toda funcionalidade nova do PRD ou alteração de comportamento do produto deve
ter uma spec própria em `docs/specs/<NNN-nome-curto>/`.

A pasta deve conter, obrigatoriamente e nesta ordem:

1. `spec.md` — requisitos e critérios de aceitação verificáveis.
2. `plan.md` — solução técnica derivada da spec e restringida pelos ADRs.
3. `tasks.md` — tarefas derivadas do plano e vinculadas aos critérios de
   aceitação.

Uma autorização direta como "pode fazer", "pode implementar" ou equivalente
não permite pular a criação desses três arquivos. Se já existir uma spec para
a funcionalidade, atualize os arquivos existentes em vez de criar outra.

## Quando

Ao iniciar qualquer funcionalidade nova do PRD ou mudança no comportamento de
uma funcionalidade existente.

## Procedimento

1. Identifique o próximo número e crie `docs/specs/<NNN-nome-curto>/`.
2. Antes de escrever `spec.md`, liste as perguntas que o PRD não responde e
   espere as respostas. Não invente decisões de negócio.
3. Escreva `spec.md` com os comportamentos confirmados e critérios de aceitação
   identificados como `CA-xx`.
4. Derive `plan.md` da spec, cite os ADRs aplicáveis, mostre o plano e espere a
   aprovação antes de escrever código.
5. Derive `tasks.md` do plano aprovado. Cada tarefa deve citar ao menos um
   `CA-xx`, descrever os arquivos previstos e caber em um commit.
6. Execute uma tarefa por vez. Ao terminar cada tarefa, siga `rules/checks.md`.

## Verificação antes de codificar

Confirme que:

- a pasta segue o padrão `NNN-nome-curto`;
- `spec.md`, `plan.md` e `tasks.md` existem;
- o plano está explicitamente aprovado;
- a tarefa atual referencia pelo menos um critério de aceitação;
- o código a alterar está dentro do escopo da tarefa atual.

Se qualquer item estiver ausente, complete o fluxo documental antes de alterar
código de aplicação.

## Não faça

- Não escreva código antes de criar a spec, aprovar o plano e gerar as tarefas.
- Não use PRD, pedido em chat ou `layout.md` como substituto da spec.
- Não crie pasta de spec fora do padrão `NNN-nome-curto`.
- Não crie uma segunda spec para uma funcionalidade que já possui diretório.
