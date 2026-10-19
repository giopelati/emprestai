# Spec 001 — Login

## Status

Definida para planejamento.

## Referências

- `docs/PRD.md`
- `docs/adr/001-stack.md`
- `layout.md`, seções 3, 4, 5.1 e 6
- `rules/restrictions.md`

## Objetivo

Permitir que colaboradores e pessoas de Operações iniciem uma sessão segura e sejam encaminhados para a área compatível com seu papel. A tela deve ser a primeira experiência visual do Emprestaí e comunicar as regras centrais do produto sem permitir escolha ou elevação de papel pelo cliente.

## Decisões confirmadas para este incremento

- A identidade será autenticada por e-mail e senha com Supabase Auth.
- O mesmo formulário será usado por Colaborador e Operações.
- O papel virá de `app_metadata.role`, emitido por uma fonte administrativa confiável; o frontend nunca poderá defini-lo.
- Os valores válidos de papel serão `colaborador` e `operacoes`.
- A sessão será persistida e restaurada ao reabrir a aplicação.
- O frontend poderá falar diretamente com o Supabase somente para operações de autenticação e sessão. Regras e dados de empréstimos continuarão fora deste incremento e deverão respeitar a API REST/Nest definida no ADR-001.
- O frontend será preparado para a Vercel; neste incremento, Supabase hospeda autenticação. O destino de hospedagem do Nest permanece fora do escopo porque nenhum backend será criado aqui.
- A interface será construída em React com TypeScript e Vite dentro de npm workspaces.
- A mensagem de falha de autenticação será genérica: `E-mail ou senha inválidos.`
- O atalho inspiracional `Entrar como Operações` não será um mecanismo de troca de papel. A tela informará que o acesso de Operações usa o mesmo formulário.

## Fluxo principal

1. Uma pessoa sem sessão acessa a aplicação e vê o Login.
2. Ela informa e-mail e senha.
3. A aplicação valida o formato básico dos campos e solicita autenticação ao Supabase Auth.
4. Enquanto a solicitação estiver em andamento, os campos e a ação principal ficam indisponíveis.
5. Com uma sessão válida, a aplicação lê o papel confiável da identidade.
6. `colaborador` é encaminhado para Catálogo; `operacoes` é encaminhado para Operações.
7. Ao sair, a sessão é encerrada e a pessoa retorna ao Login.

## Estados alternativos

- Campos ausentes ou e-mail inválido: mostrar orientação junto ao campo e não enviar a solicitação.
- Credenciais recusadas: permanecer no Login e mostrar a mensagem genérica definida nesta spec.
- Falha de rede ou indisponibilidade: permanecer no Login e mostrar `Não foi possível entrar. Tente novamente.`
- Papel ausente ou desconhecido: encerrar a sessão recebida, permanecer no Login e mostrar `Seu acesso ainda não foi configurado. Fale com Operações.`
- Sessão em restauração: mostrar estado de carregamento sem exibir brevemente uma área protegida.

## Requisitos visuais

- Idioma em português do Brasil e tom direto, sem exclamações ou emojis.
- Em telas amplas, usar composição em duas colunas inspirada no layout: apresentação da marca e regras à esquerda; formulário centralizado à direita.
- A área de apresentação deve conter marca, mensagem principal, resumo e as três estatísticas: `3 itens por pessoa`, `14 dias de prazo` e `0 linhas para preencher`.
- O formulário deve conter título `Entrar`, campos `E-mail` e `Senha`, ação primária `Entrar`, orientação para Operações e nota sobre privacidade dos empréstimos.
- Em telas estreitas, usar uma única coluna, preservar o formulário como conteúdo principal e reduzir a área institucional sem criar rolagem horizontal.
- Em telas amplas, o Login ocupa exatamente a altura da janela e é fixo: nem a página nem nenhuma das colunas rola. O conteúdo se compacta verticalmente para caber.
- Estados de foco devem ser claramente visíveis; estado desabilitado deve ser perceptível sem depender somente de cor.
- Não usar pacote externo de design system, fonte ou ícones neste incremento.

## Critérios de aceitação

### CA-01 — Apresentação do Login

**Dado** que não existe sessão autenticada  
**Quando** a aplicação é aberta  
**Então** o Login é exibido em português com marca, mensagem institucional, três estatísticas, e-mail, senha, ação `Entrar`, orientação de acesso para Operações e nota de privacidade.

### CA-02 — Responsividade e acessibilidade básica

**Dado** o Login  
**Quando** a largura disponível muda entre celular e desktop  
**Então** o conteúdo permanece legível, utilizável e sem rolagem horizontal, os campos possuem rótulos associados, a navegação por teclado segue ordem lógica e o foco é visível.

### CA-03 — Validação local

**Dado** que e-mail ou senha estão ausentes, ou que o e-mail tem formato inválido  
**Quando** a pessoa tenta entrar  
**Então** cada campo inválido recebe orientação associada, o primeiro campo inválido recebe foco e nenhuma autenticação é solicitada.

### CA-04 — Estado de envio

**Dado** que os campos são válidos  
**Quando** a autenticação está em andamento  
**Então** os campos e o botão ficam desabilitados, o botão comunica `Entrando...` e envios duplicados são impedidos.

### CA-05 — Credenciais recusadas

**Dado** que o Supabase recusa as credenciais  
**Quando** a tentativa termina  
**Então** a pessoa permanece no Login, a senha é limpa e a mensagem `E-mail ou senha inválidos.` é anunciada sem revelar qual campo falhou.

### CA-06 — Entrada por papel confiável

**Dado** que a autenticação cria uma sessão com `app_metadata.role` válido  
**Quando** o papel é `colaborador`  
**Então** a entrada aponta para Catálogo  
**E quando** o papel é `operacoes`  
**Então** a entrada aponta para Operações  
**E** nenhuma ação ou parâmetro do cliente permite escolher ou alterar esse papel.

### CA-07 — Papel inválido

**Dado** que a autenticação cria uma sessão sem papel válido  
**Quando** a aplicação avalia a identidade  
**Então** ela encerra essa sessão, retorna ao Login e mostra `Seu acesso ainda não foi configurado. Fale com Operações.`

### CA-08 — Restauração e proteção de sessão

**Dado** que existe uma sessão válida persistida  
**Quando** a aplicação é reaberta  
**Então** a sessão e o papel são restaurados antes de renderizar conteúdo protegido e a pessoa volta à área correspondente  
**E**, sem sessão válida, destinos protegidos retornam ao Login.

### CA-09 — Falha operacional

**Dado** que a tentativa falha por rede ou indisponibilidade  
**Quando** a resposta é processada  
**Então** a pessoa permanece no Login e recebe `Não foi possível entrar. Tente novamente.`.

### CA-10 — Saída

**Dado** que existe uma sessão autenticada  
**Quando** a pessoa aciona `Sair` em uma área protegida  
**Então** a sessão é encerrada e o Login volta a ser exibido.

### CA-11 — Login fixo em telas amplas

**Dado** o Login em uma janela com largura acima de 50rem e altura a partir de 560px  
**Quando** a tela é exibida, inclusive com uma mensagem de erro do formulário visível  
**Então** nem a página nem a área de apresentação nem a área do formulário possuem rolagem vertical  
**E** marca, mensagem principal, estatísticas, campos, ação `Entrar`, orientação para Operações e nota de privacidade permanecem visíveis.

## Fora do escopo

- Cadastro de contas, convite e recuperação ou troca de senha.
- Criação administrativa de usuários e concessão de papéis.
- Schema, migrations e policies RLS.
- Catálogo, empréstimos, devoluções, cadastro de equipamentos e dashboard de Operações.
- Implementação do backend Nest.
- Login social ou autenticação multifator.
- Deploy ou mudança de configuração da Vercel e do Supabase remoto.
