# Spec 003 — Solicitar empréstimo

## Status

Em implementação.

## Referências

- `docs/PRD.md` — itens 2 e 3 da primeira versão; regras "no máximo 3 itens",
  "prazo padrão de 14 dias", "quem tem item em atraso não pode pegar outro",
  "equipamento em manutenção não aparece como disponível"; "cada pessoa vê os
  próprios empréstimos".
- `docs/briefings/pratica-sdd-subagentes.md` — briefing "solicitar empréstimo"
  e contrato da skill `imagens-equipamentos` (crédito na tela).
- `docs/adr/001-stack.md`, `docs/adr/002-migrations.md`,
  `docs/adr/003-acesso-a-dados-do-backend.md`.
- `docs/specs/001-login/spec.md` — papéis `colaborador` e `operacoes`, abas
  da navegação.
- `docs/specs/002-dados-iniciais/spec.md` — tabela `equipamentos` e fotos.

## Objetivo

Quem está logado vê o catálogo com foto e situação de cada equipamento,
solicita um item disponível e o empréstimo é criado na hora, respeitando as
regras de Operações. A pessoa vê os próprios empréstimos em aberto com a data
de devolução.

## Conflitos resolvidos

| # | Pedido | Contrariava | Decisão |
|---|---|---|---|
| C1 | Briefing, item 4: "Quem já tem 5 empréstimos em aberto não pode solicitar outro" | PRD: "Cada pessoa pode estar com no máximo 3 itens ao mesmo tempo"; Login (spec 001) já anuncia `3 itens por pessoa` | Limite de **3**. Regra de negócio é do PRD; o briefing é pedido e não muda o PRD. |
| C2 | Briefing, item 3: devolução prevista "14 dias úteis depois" | PRD: "O prazo padrão de devolução é de 14 dias"; Login anuncia `14 dias de prazo` | **14 dias corridos**. O PRD não fala em dias úteis, e dias úteis exigiriam um calendário de feriados que nenhuma fonte define. |
| C3 | Briefing, item 9: catálogo "sem rodapé nem texto de crédito" | Contrato da skill: a tela que exibe as fotos mostra "Fotos: Pexels" com link, exigência das diretrizes da API do Pexels | Mantido **um** link `Fotos: Pexels` abaixo da grade, sem outro rodapé. O nome do fotógrafo fica só no atributo `title` da foto (aparece ao passar o mouse), sem texto visível no card. É o mínimo que cumpre as diretrizes e deixa o catálogo limpo. |

## Lacunas decididas

| # | O que faltava | Decisão |
|---|---|---|
| L1 | Quem pode solicitar | Qualquer pessoa autenticada com papel válido (`colaborador` ou `operacoes`). O PRD fala em "cada pessoa" e põe o limite por pessoa; a navegação já implementada para Operações (`frontend/src/components/ProtectedShell.tsx`, inspirada em `layout.md`) tem `Meus empréstimos`. Sem papel válido, a solicitação é recusada. |
| L2 | O que é "em atraso" | Empréstimo em aberto cuja devolução prevista é **anterior** a hoje. No dia da devolução ainda está em dia. |
| L3 | Qual "hoje" | Data civil em `America/Sao_Paulo`. A regra (recusa por atraso e data de devolução) usa o "hoje" do banco, dentro da função; a marcação `Em atraso` de `Meus empréstimos` usa o mesmo fuso no backend, só para exibir. Ajuste registrado após a rodada 1 de entrega do verificador. |
| L4 | Ordem das recusas, quando mais de uma vale | Equipamento inexistente → equipamento indisponível → atraso → limite. A primeira que se aplica é a mostrada. |
| L5 | O catálogo mostra quem está com o item? | Não. Mostra `Emprestado`; se for da própria pessoa, `Está com você`. O PRD diz que cada pessoa vê os próprios empréstimos; o "Com {pessoa}" do `layout.md` é só inspiração. |
| L6 | Confirmação antes de criar | Sim, no mesmo card: `Solicitar` → `Confirmar` / `Cancelar`. Como devolução está fora do escopo, um clique acidental prenderia o item sem como desfazer. A criação continua imediata após confirmar, sem aprovação de Operações. |
| L7 | Formato da API | `GET /equipamentos`, `POST /emprestimos` com `{ "equipamentoId": "<uuid>" }`, `GET /emprestimos/meus`. Erro: `{ "codigo", "mensagem" }`. |
| L8 | Busca e filtros do catálogo (`layout.md`) | Fora desta spec. |

## Mensagens

| Código | HTTP | Mensagem |
|---|---|---|
| `NAO_AUTENTICADO` | 401 | `Sua sessão expirou. Entre novamente.` |
| `PAPEL_INVALIDO` | 403 | `Seu acesso ainda não foi configurado. Fale com Operações.` |
| `ENTRADA_INVALIDA` | 400 | `Informe um equipamento válido.` |
| `EQUIPAMENTO_NAO_ENCONTRADO` | 404 | `Equipamento não encontrado.` |
| `EQUIPAMENTO_INDISPONIVEL` | 409 | `Este equipamento não está disponível para empréstimo.` |
| `EMPRESTIMO_EM_ATRASO` | 422 | `Você tem empréstimo em atraso. Devolva o item atrasado para solicitar outro.` |
| `LIMITE_DE_EMPRESTIMOS` | 422 | `Você já está com 3 itens emprestados. Devolva um para solicitar outro.` |

Sucesso na tela: `Empréstimo registrado. Devolva até DD/MM/AAAA.`

## Critérios de aceitação

### CA-01 — Catálogo

**Dado** uma pessoa autenticada  
**Quando** ela abre `Catálogo`  
**Então** vê todos os equipamentos, cada um com foto, nome, categoria, patrimônio e situação (`Disponível`, `Emprestado` ou `Em manutenção`), e o cabeçalho `X de Y equipamentos disponíveis agora`.

### CA-02 — Crédito das fotos

**Dado** o catálogo ou `Meus empréstimos` com fotos  
**Quando** a tela é exibida  
**Então** há um link `Fotos: Pexels` para `https://www.pexels.com`, cada foto traz o fotógrafo no atributo `title`, e não há outro rodapé ou bloco de crédito.

### CA-03 — Ação conforme a situação

**Dado** o catálogo  
**Quando** os cards são exibidos  
**Então** só equipamento `disponivel` tem `Solicitar` habilitado; em manutenção mostra `Em manutenção` desabilitado; emprestado a outra pessoa mostra `Emprestado` desabilitado; emprestado à própria pessoa mostra `Está com você` desabilitado.

### CA-04 — Solicitar cria o empréstimo na hora

**Dado** um equipamento disponível e uma pessoa sem atraso e com menos de 3 itens  
**Quando** ela solicita e confirma  
**Então** a API responde `201` com o empréstimo e `devolucaoPrevista` igual a hoje (`America/Sao_Paulo`) mais 14 dias corridos, o equipamento passa a `emprestado`, e a tela mostra `Empréstimo registrado. Devolva até DD/MM/AAAA.` e o card passa a `Está com você`.

### CA-05 — Limite de 3 itens

**Dado** uma pessoa com 3 empréstimos em aberto  
**Quando** ela solicita outro equipamento disponível  
**Então** a API responde `422` com `LIMITE_DE_EMPRESTIMOS` e a mensagem da tabela, nada é criado, e a tela mostra a mensagem.

### CA-06 — Atraso bloqueia

**Dado** uma pessoa com empréstimo em aberto e devolução prevista anterior a hoje  
**Quando** ela solicita outro equipamento disponível  
**Então** a API responde `422` com `EMPRESTIMO_EM_ATRASO` e a mensagem da tabela, nada é criado, e a tela mostra a mensagem.

### CA-07 — Indisponível é recusado no servidor

**Dado** um equipamento em manutenção ou já emprestado  
**Quando** alguém o solicita diretamente pela API  
**Então** a resposta é `409` com `EQUIPAMENTO_INDISPONIVEL`; para id inexistente, `404` com `EQUIPAMENTO_NAO_ENCONTRADO`; para id malformado, `400` com `ENTRADA_INVALIDA`; e nada é criado.

### CA-08 — Pedidos simultâneos

**Dado** um equipamento disponível  
**Quando** duas pessoas o solicitam ao mesmo tempo  
**Então** exatamente uma recebe `201`, a outra recebe `409` com `EQUIPAMENTO_INDISPONIVEL`, e existe um único empréstimo em aberto para ele.

### CA-09 — Meus empréstimos

**Dado** uma pessoa com empréstimos em aberto  
**Quando** ela abre `Meus empréstimos`  
**Então** vê só os próprios, com foto, nome, patrimônio e `Devolver até DD/MM/AAAA`, ordenados pela devolução, com `Em atraso` quando for o caso, e o resumo `N de 3 itens em seu nome · prazo padrão de 14 dias`  
**E**, sem empréstimos, vê `Você não está com nenhum equipamento.` e o botão `Ir ao catálogo`.

### CA-10 — Isolamento

**Dado** empréstimos de duas pessoas  
**Quando** uma consulta os empréstimos, pela API do backend ou direto pela API do Supabase  
**Então** não recebe os da outra; e nenhuma pessoa consegue inserir empréstimo ou alterar equipamento sem passar pela regra.

### CA-11 — Autenticação e papel

**Dado** uma requisição sem token válido  
**Quando** ela chega a qualquer endpoint desta spec  
**Então** a resposta é `401` com `NAO_AUTENTICADO`  
**E** uma pessoa sem papel válido que solicita recebe `403` com `PAPEL_INVALIDO`.

## Fora do escopo

- Devolução, tela de Operações, cadastro de equipamento.
- Reserva com data futura, renovação, notificação por e-mail.
- Busca e filtros do catálogo.
- Fila de espera ou aprovação de Operações.
