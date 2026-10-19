# Tarefas 001 — Login

## Referências

- `spec.md`
- `plan.md`
- `docs/adr/001-stack.md`

## Estado

- [x] T01 — Base React e apresentação responsiva do Login
- [x] T02 — Validação e estados do formulário
- [x] T03 — Autenticação e papel confiável
- [x] T04 — Restauração, proteção e saída
- [x] T05 — Verificação integrada e documentação operacional
- [x] T06 — Login fixo na altura da janela

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
