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

Só entram aqui comandos que já foram executados com sucesso nesta máquina.

- instalar dependências: `npm install`.
- verificar tipos do frontend: `npm run typecheck`.
- buildar o frontend: `npm run build`.
- verificar tipos do backend: `npm run typecheck --workspace backend`.
- buildar o backend: `npm run build --workspace backend`.
- rodar o backend buildado: `npm run start --workspace backend` (porta `PORT`, padrão 3000).
- subir o banco local: não documentado.
- rodar o projeto: não documentado.
- rodar os testes: não documentado.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco local.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- Configuração vem de variáveis de ambiente. Ver `backend/.env.example` e `frontend/.env.example`.

## Precedência

Se uma spec e o código discordarem sobre comportamento, a spec vence o código.

Agentes podem tomar decisões ainda não documentadas, desde que respeitem PRDs, ADRs, specs, regras e restrições. Devem informar as decisões tomadas.

Avise o usuário antes de qualquer `git push`.

## Estado atual do projeto

- O monorepo usa npm workspaces e possui manifestos e lockfile na raiz.
- `docs/specs/001-login/` contém spec, plano aprovado e tarefas da primeira feature.
- O frontend React/Vite implementa Login responsivo, validação, Supabase Auth, papel confiável, restauração de sessão, shells protegidos e logout.
- A autenticação fala diretamente com Supabase Auth; dados e regras de empréstimos permanecem fora desta feature.
- O backend possui aplicação Nest mínima com `GET /health` → `{ "status": "ok" }`; ainda sem regras de negócio.
- Ainda não há testes automatizados, migrations, estratégia de migration ou configuração de CI.
- A subida do Supabase local e a criação de usuários locais por papel ainda não estão documentadas.

## Procedimentos
