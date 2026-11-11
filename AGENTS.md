# Emprestaí

O Emprestaí controla empréstimos internos de equipamentos para colaboradores e para o time de Operações.
O sistema mostra a disponibilidade dos itens, permite solicitar e registrar devoluções e oferece a Operações uma visão dos empréstimos em aberto.

Negócio em `docs/PRD.md`. Stack decidida em `docs/adr/001-stack.md`.

## Onde olhar

- `docs/PRD.md` — o que o negócio precisa. Não é spec.
- `docs/adr/` — decisões técnicas já tomadas e o motivo delas.
- `docs/specs/<NNN-funcionalidade>/` — spec, plano e tarefas de cada feature.
- `rules/` — como se trabalha aqui. Leia `rules/restrictions.md` sempre.
- `agents/` — agentes especializados do projeto. Ver `## Procedimentos`.
- `skills/` — técnicas que o agente carrega sob demanda. Ver `## Skills`.
- `layout.md` — inspiração de interface; não é fonte normativa. PRDs, ADRs, specs, regras e restrições prevalecem.

## Comandos

Só entram aqui comandos que já foram executados com sucesso nesta máquina.

- instalar dependências: `npm install`.
- verificar tipos do frontend: `npm run typecheck`.
- buildar o frontend: `npm run build`.
- verificar tipos do backend: `npm run typecheck --workspace backend`.
- buildar o backend: `npm run build --workspace backend`.
- rodar o backend buildado: `npm run start --workspace backend` (porta `PORT`, padrão 3000).
- subir o banco local: não documentado.
- rodar o frontend em desenvolvimento: `npm run dev --workspace frontend`. Login real ainda depende do Supabase local.
- rodar os testes: não documentado.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco local.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- Configuração vem de variáveis de ambiente. Ver `backend/.env.example` e `frontend/.env.example`.

## Precedência

Precedência entre fontes, autoridade do agente e avisos antes de `git push` têm um único dono: `rules/restrictions.md`.

## Estado atual do projeto

- O monorepo usa npm workspaces e possui manifestos e lockfile na raiz.
- `docs/specs/001-login/` contém spec, plano aprovado e tarefas da primeira feature.
- O frontend React/Vite implementa Login responsivo, validação, Supabase Auth, papel confiável, restauração de sessão, shells protegidos e logout.
- A autenticação fala diretamente com Supabase Auth; dados e regras de empréstimos permanecem fora desta feature.
- O backend possui aplicação Nest mínima com `GET /health` → `{ "status": "ok" }`; ainda sem regras de negócio.
- Ainda não há testes automatizados, migrations, estratégia de migration ou configuração de CI.
- A subida do Supabase local e a criação de usuários locais por papel ainda não estão documentadas.
- A feature `001-login` está implementada, mas ainda não está pronta: CA-05 a CA-08 e CA-10 dependem de verificação com Supabase local. Ver `docs/specs/001-login/tasks.md`.

## Skills

- Ficam em `skills/<nome>/SKILL.md`.
- No início de cada tarefa, leia só o frontmatter (`name` e `description`) de cada skill. Carregue o corpo do `SKILL.md` apenas quando a tarefa casar com a `description`; abra `references/` só quando o `SKILL.md` mandar.
- Em conflito, `rules/` e `docs/adr/` vencem qualquer skill.

## Procedimentos

| Quando | Siga |
|---|---|
| Sempre | `rules/restrictions.md` |
| Ao iniciar funcionalidade ou mudança de comportamento | `rules/spec-flow.md` |
| Antes de começar a codar uma tarefa | `agents/verificador-spec.md`, modo `gate` |
| Antes de declarar uma tarefa pronta | `rules/checks.md` e `agents/verificador-spec.md`, modo `entrega` |
| Ao mudar schema, tabela ou política de acesso | `rules/migration.md` |
| Ao escrever, alterar ou remover teste | `rules/tests.md` |
| Ao lidar com variável de ambiente, chave ou credencial | `rules/secrets.md` |
| Ao terminar uma tarefa ou fechar a sessão | `rules/handoff.md` |

Se a ferramenta em uso não carregar `agents/verificador-spec.md` como subagente, leia o arquivo e siga o procedimento dele sem editar nada.
