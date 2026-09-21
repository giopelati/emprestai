# Emprestaí

O Emprestaí controla empréstimos internos de equipamentos para colaboradores e para o time de Operações.
O sistema mostra a disponibilidade dos itens, permite solicitar e registrar devoluções e oferece a Operações uma visão dos empréstimos em aberto.

Negócio em `docs/PRD.md`. Stack decidida em `docs/adr/001-stack.md`.

## Onde olhar

- `docs/PRD.md` — o que o negócio precisa. Não é spec.
- `docs/adr/` — decisões técnicas já tomadas e o motivo delas.
- `docs/specs/<NNN-funcionalidade>/` — spec, plano e tarefas de cada feature.
- `rules/` — como se trabalha aqui. Leia `rules/restrictions.md` sempre.
- `layout.md` — inspiração de interface; não é fonte normativa. PRDs, ADRs, specs, regras e restrições prevalecem.

## Comandos

Só entram aqui comandos que já foram executados com sucesso nesta máquina. Nenhum comando de projeto foi confirmado até agora.

- subir o banco local: não documentado.
- rodar o projeto: não documentado.
- rodar os testes: não documentado.
- buildar: não documentado.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco local.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- Configuração vem de variáveis de ambiente. Ver `backend/.env.example` e `frontend/.env.example`.

## Precedência

Se uma spec e o código discordarem sobre comportamento, a spec vence o código.

Agentes podem tomar decisões ainda não documentadas, desde que respeitem PRDs, ADRs, specs, regras e restrições. Devem informar as decisões tomadas.

Avise o usuário antes de qualquer `git push`.

## Estado atual do projeto

- O repositório contém o PRD, o ADR de stack, o `layout.md`, os diretórios `frontend/` e `backend/` e exemplos de variáveis de ambiente.
- O diretório `rules/` existe, mas `rules/restrictions.md` ainda não existe.
- `docs/specs/` ainda não existe.
- Ainda não há código de aplicação, testes, migrations, manifests de pacotes, lockfile, scripts de projeto ou configuração de CI.
- O monorepo com npm workspaces para `frontend` e `backend` está planejado, mas ainda não foi inicializado.
- A fronteira entre frontend, Nest e Supabase ainda não foi decidida.
- A estratégia de migrations ainda não foi decidida.

## Procedimentos
