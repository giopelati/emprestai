# Tarefas 001 — Login

## Referências

- `spec.md`
- `plan.md`
- `docs/adr/001-stack.md`

## Estado

`[x]` significa que todos os checks aplicáveis foram executados, como exige `rules/checks.md`. Código implementado com verificação pendente fica em `[ ]`.

- [x] T01 — Base React e apresentação responsiva do Login
- [ ] T02 — Validação e estados do formulário (implementada; faltam CA-05 com Supabase local e e-mail inválido do CA-03 em execução)
- [ ] T03 — Autenticação e papel confiável (implementada; faltam CA-06 e CA-07 com Supabase local)
- [ ] T04 — Restauração, proteção e saída (implementada; faltam restauração do CA-08 e CA-10 com Supabase local)
- [ ] T05 — Verificação integrada e documentação operacional (aguarda T02, T03 e T04)
- [x] T06 — Login fixo na altura da janela

## Evidências de verificação

Executado em 05/11/2026, em `http://localhost:5199`, com `VITE_SUPABASE_URL` apontando para um endereço local inexistente. Nenhuma requisição foi feita ao Supabase remoto.

| Critério | Resultado | Como foi verificado |
|---|---|---|
| CA-01 | Atendido | Sem sessão, o Login mostra marca, mensagem, estatísticas, campos, `Entrar`, orientação para Operações e nota de privacidade. |
| CA-02 | Atendido | Sem rolagem horizontal em 375×812 e 768×1024; rótulos associados; `Tab` segue e-mail, senha e botão; foco visível em campo e botão. |
| CA-03 | Parcial | Campos vazios: orientação nos dois campos, foco no e-mail e nenhuma requisição. E-mail com formato inválido: só leitura de código. |
| CA-04 | Atendido | Durante o envio, campos e botão ficam desabilitados e o botão mostra `Entrando...`; clique duplo real gerou uma requisição. |
| CA-05 | Não verificado | Depende de o Supabase recusar credenciais. Evidência só em leitura de código. |
| CA-06, CA-07 | Não verificados | Dependem de usuários locais com `app_metadata.role`. Evidência só em leitura de código. |
| CA-08 | Parcial | Sem sessão, o Login é exibido. A restauração de sessão válida não foi executada. |
| CA-09 | Atendido | Com falha de rede, a tela permanece no Login e anuncia `Não foi possível entrar. Tente novamente.` em `role="alert"`. |
| CA-10 | Não verificado | Depende de sessão autenticada. Evidência só em leitura de código. |
| CA-11 | Atendido | Em 1366×560, 1366×640, 1280×720 e 1920×960, com erro de campo e com mensagem do formulário, `scrollHeight` é igual a `clientHeight` na página e nas duas colunas, e os elementos exigidos ficam dentro da janela. |

Checks: `npm run typecheck`, `npm run build`, `npm run typecheck --workspace backend` e `npm run build --workspace backend` terminaram sem falha. Testes: `não executado: comando não documentado`.

## T01 — Base React e apresentação responsiva do Login

**Critérios:** CA-01, CA-02  
**Objetivo:** inicializar os npm workspaces e o workspace React/Vite, criar o entrypoint e implementar a apresentação estática, sem autenticação, do Login em CSS próprio.  
**Arquivos previstos:** manifests e lockfile da raiz/frontend, configurações TypeScript/Vite, `.gitignore`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/components/Brand.tsx`, `frontend/src/pages/LoginPage.tsx`, `frontend/src/styles/styles.css` e `frontend/src/vite-env.d.ts`.  
**Verificação:** dependências instaladas em versões exatas, typecheck, build e revisão do markup responsivo/acessível.  
**Limite do commit:** base compilável e tela estática; sem cliente Supabase, regras de autenticação ou shells protegidos.

## T02 — Validação e estados do formulário

**Critérios:** CA-03, CA-04, CA-05, CA-09  
**Objetivo:** adicionar validação local acessível, controle de foco, estado de envio e apresentação normalizada dos erros definidos na spec, ainda com uma porta de autenticação substituível.  
**Arquivos previstos:** `frontend/src/pages/LoginPage.tsx`, tipos locais do formulário e estilos de estados.  
**Verificação:** typecheck, build e revisão de envio inválido, envio único, limpeza da senha e anúncios de erro.  
**Limite do commit:** comportamento do formulário; sem sessão persistida ou autorização.

## T03 — Autenticação e papel confiável

**Critérios:** CA-06, CA-07  
**Objetivo:** configurar o cliente Supabase, autenticar por e-mail/senha e aceitar somente os papéis confiáveis `colaborador` e `operacoes` vindos de `app_metadata.role`.  
**Arquivos previstos:** `frontend/src/lib/supabase.ts`, `frontend/src/auth/auth-types.ts`, `frontend/src/auth/auth-service.ts` e integração do formulário.  
**Verificação:** typecheck, build, variáveis públicas exigidas e revisão dos caminhos de papel válido/inválido.  
**Limite do commit:** login e normalização de papel; sem persistência global ou destino protegido completo.

## T04 — Restauração, proteção e saída

**Critérios:** CA-08, CA-10  
**Objetivo:** criar o provider de autenticação, restaurar sessão sem vazamento visual, observar mudanças, renderizar shells protegidos por papel e encerrar a sessão.  
**Arquivos previstos:** `frontend/src/auth/AuthContext.tsx`, `frontend/src/components/ProtectedShell.tsx`, `frontend/src/App.tsx` e estilos associados.  
**Verificação:** typecheck, build e revisão dos estados restaurando, sem sessão, colaborador, Operações e saída.  
**Limite do commit:** ciclo de sessão completo; sem funcionalidades reais de Catálogo ou Operações.

## T05 — Verificação integrada e documentação operacional

**Critérios:** CA-01 a CA-10  
**Objetivo:** executar os checks aplicáveis, corrigir apenas falhas do incremento, registrar em `AGENTS.md` somente comandos comprovados e atualizar `handoff.md`.  
**Arquivos previstos:** arquivos do Login somente se a validação revelar defeito, `AGENTS.md` e `handoff.md`.  
**Verificação:** typecheck e build comprovados, estado Git comparado e limitações do Supabase local explicitadas.  
**Limite do commit:** verificação e documentação; sem ampliar escopo.

## T06 — Login fixo na altura da janela

**Critérios:** CA-02, CA-11  
**Objetivo:** fazer o Login ocupar exatamente a altura da janela em telas amplas, sem rolagem na página nem nas colunas, compactando os espaçamentos verticais.  
**Arquivos previstos:** `frontend/src/styles/styles.css` e os documentos desta spec.  
**Verificação:** typecheck, build e medição de rolagem no navegador nas alturas listadas no plano, com mensagem de erro visível.  
**Limite do commit:** apenas layout do Login; sem mudança de comportamento do formulário ou da autenticação.
