# Plano 001 — Login

## Status

Aprovado pelo usuário em 21/09/2026.

## Base e limites

Este plano deriva de `spec.md` e é restringido pelo ADR `docs/adr/001-stack.md`: React e TypeScript no frontend, Supabase para autenticação/autorização, Nest e REST/MVC para futuro backend e Jest como ferramenta de testes quando testes forem solicitados. Não haverá mudança de schema, migration, policy, banco remoto, Vercel ou backend Nest neste incremento.

O `layout.md` será usado somente como referência visual. A interface terá implementação própria em CSS, sem instalar Nocturne, fontes ou ícones externos.

## Decisões técnicas

1. Inicializar a raiz como projeto privado com npm workspaces apontando para `frontend` e `backend`. Somente o workspace `frontend` receberá manifesto e código neste incremento.
2. Usar Vite como ferramenta de desenvolvimento/build do React. Dependências serão instaladas em versões exatas e atuais no momento da tarefa, sem intervalos abertos.
3. Usar `react`, `react-dom`, `typescript`, `vite` e `@vitejs/plugin-react` para a base; usar `@supabase/supabase-js` para sessão e autenticação. Essas bibliotecas foram propostas ao usuário e autorizadas antes deste plano.
4. Não adicionar roteador: o incremento possui três estados de tela (`login`, destino `catalogo` e destino `operacoes`) controlados pela sessão. As áreas de destino serão shells mínimos para demonstrar proteção, papel e logout, sem implementar suas funcionalidades.
5. Criar uma única instância do cliente Supabase com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, já previstas em `frontend/.env.example`. Segredos não serão lidos, copiados nem versionados.
6. Centralizar autenticação em um serviço pequeno e manter o estado de sessão em um provider React. O provider restaura a sessão antes de renderizar destinos protegidos e observa mudanças de autenticação.
7. Normalizar o papel em uma função pura que só aceita `app_metadata.role` igual a `colaborador` ou `operacoes`. Papel inválido causa `signOut` e erro de acesso configurado.
8. Usar HTML semântico e CSS responsivo próprio. Não adicionar biblioteca de componentes, CSS-in-JS, fonte ou ícones.
9. Não criar testes automatizados sem solicitação explícita. A validação desta tarefa será feita por typecheck e build, além de revisão estática dos CAs; o fluxo real dependerá de Supabase local configurado e usuários locais com metadados válidos.

## Arquitetura do incremento

### Inicialização

`main.tsx` monta `App` dentro de `AuthProvider`. O provider começa em estado `restoring`, consulta a sessão persistida e registra o listener do Supabase. Enquanto isso, `App` exibe uma tela neutra de carregamento para impedir vazamento visual de conteúdo protegido.

### Autenticação

`LoginPage` controla e-mail, senha, validações e estado de envio. A página chama somente a operação de login exposta pelo contexto. Erros retornados pelo serviço são convertidos nos códigos `invalid_credentials`, `network` e `role_not_configured`; detalhes internos do Supabase não são mostrados.

### Autorização de navegação

`App` deriva o destino exclusivamente do papel normalizado da sessão. Colaborador recebe o shell `Catálogo`; Operações recebe o shell `Operações`. Sem sessão ou papel válido, somente o Login é renderizado. O shell oferece `Sair`, que encerra a sessão antes de voltar ao Login.

### Visual

A folha `styles.css` concentra tokens de cor, tipografia, espaçamento, foco e componentes da tela. Em desktop, o Login usa duas colunas próximas da proporção `1.05fr 0.95fr`; em telas estreitas passa para uma coluna e mantém formulário, marca e resumo essencial. Os estados de erro, carregamento, foco e desabilitado terão texto ou atributo semântico além de cor.

## Estrutura completa a criar

Nenhum scaffold automático será usado. Após aprovação, os arquivos serão criados explicitamente nesta estrutura:

```text
emprestai/
├── package.json
├── package-lock.json
├── AGENTS.md                         # apenas comandos comprovados após validação
├── handoff.md                        # atualizado ao concluir uma tarefa
├── backend/                          # permanece sem código neste incremento
├── frontend/
│   ├── .env.example                  # já existe; permanece com as chaves atuais
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── vite-env.d.ts
│       ├── auth/
│       │   ├── AuthContext.tsx
│       │   ├── auth-service.ts
│       │   └── auth-types.ts
│       ├── components/
│       │   ├── Brand.tsx
│       │   └── ProtectedShell.tsx
│       ├── lib/
│       │   └── supabase.ts
│       ├── pages/
│       │   └── LoginPage.tsx
│       └── styles/
│           └── styles.css
└── docs/specs/001-login/
    ├── spec.md                       # já criado
    ├── plan.md                       # este arquivo
    └── tasks.md                      # criado somente após aprovação do plano
```

`node_modules/` e artefatos de build não serão versionados e deverão ser cobertos pelo `.gitignore` antes da instalação.

## Sequência de implementação proposta

1. Derivar `tasks.md`, fazendo cada tarefa citar CAs e caber em um commit.
2. Preparar o monorepo e o workspace React com manifests, configurações e entrypoint mínimo.
3. Criar os tokens visuais, marca e estrutura responsiva do Login para CA-01 e CA-02.
4. Implementar formulário, validação e estados de envio/erro para CA-03, CA-04, CA-05 e CA-09.
5. Integrar Supabase Auth, restauração, papel confiável, proteção, destinos mínimos e saída para CA-06, CA-07, CA-08 e CA-10.
6. Executar os checks aplicáveis, registrar somente comandos comprovados e atualizar `handoff.md`.

As regras permitem executar apenas uma dessas tarefas por autorização; cada tarefa será validada e apresentada antes da próxima.

## Validação

- Registrar `git status --short` antes e depois de cada tarefa.
- Instalar somente dependências listadas e em versões exatas.
- Executar o script de typecheck do frontend em modo não interativo.
- Executar o build de produção do frontend em modo não interativo.
- Não inventar um comando Jest: atualmente não há testes documentados e testes não foram solicitados.
- Revisar estaticamente os CAs associados à tarefa.
- O teste funcional com credenciais será marcado como limitado até existir comando documentado para subir/resetar o Supabase local e contas locais com `app_metadata.role`.
- Após comandos passarem nesta máquina, documentá-los em `AGENTS.md`; antes disso, não tratá-los como comandos confirmados.

## Ajuste — Login fixo na altura da janela (CA-11)

Status: aprovado pelo usuário em 19/10/2026.

- `.login-layout` usa altura igual à da janela (`100svh`, com `100vh` como fallback) e `overflow: hidden`, no lugar da altura mínima de 820px herdada do `layout.md`.
- `.login-hero` e `.login-panel` ocupam a linha da grade com `min-height: 0` e `overflow: hidden`; nenhuma coluna rola.
- Espaçamentos verticais, altura de campos e botão e tamanhos de título usam `clamp()` com unidades `vh`, para encolher em janelas baixas e manter os valores atuais em janelas altas.
- Em telas estreitas (até 50rem) o layout empilhado é mantido como está.
- Somente `frontend/src/styles/styles.css` muda. Validação: typecheck, build e medição no navegador de `scrollHeight` contra `clientHeight` da página e das duas colunas em 1366×560, 1366×640, 1280×720 e 1920×960, com mensagem de erro visível.

## Riscos e pendências conhecidas

- O login real não poderá ser demonstrado sem Supabase local em execução e usuários locais preparados; este plano não acessará o projeto remoto.
- A criação administrativa de usuários e papéis exigirá uma feature futura e possivelmente decisões de schema/policies sujeitas a `rules/migration.md`.
- O local de hospedagem do Nest continua pendente, mas não bloqueia este incremento porque não haverá backend.
- O layout usa Raleway e Nocturne como inspiração; usar pilha tipográfica do sistema e CSS local evita dependências não necessárias.
