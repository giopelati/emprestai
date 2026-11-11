---
description: Como tratar variáveis de ambiente, chaves e credenciais
globs: ["**/.env*", "**/lib/supabase.ts", "**/*.config.*"]
alwaysApply: false
---

# Segredos e configuração

> leitor: agente
>
> Estado: criada em 05/11/2026; revisada em 10/11/2026 para a ADR-003 e o
> conflito C4 da spec 002 (chave secreta só com pessoa).

## Quando

Ao criar, ler, usar ou documentar variável de ambiente, chave, token, senha ou
URL de banco, e antes de empacotar ou publicar o projeto.

## Classificação

- **Segredo:** `SUPABASE_SECRET_KEY`, `DATABASE_URL` e `DIRECT_URL`. Pela
  ADR-003, o backend não usa nenhuma delas: nenhum segredo de banco vai para a
  Vercel.
- **Segredo de produção, só de pessoa:** `PRODUCAO_SUPABASE_URL`,
  `PRODUCAO_SUPABASE_SECRET_KEY` e `SENHA_PROFESSOR`. Ficam em `.env.producao`,
  só na máquina de quem executa os passos de produção, e são lidos apenas pelos
  scripts `*:producao` (que exigem terminal interativo). O agente não lê, não
  cria e não usa esse arquivo.
- **Segredo pessoal de ferramenta:** `PEXELS_API_KEY`, no `.env` da raiz.
- **Pública:** toda variável com prefixo `VITE_`, porque o Vite a inclui no
  código enviado ao navegador. `SUPABASE_PUBLISHABLE_KEY` também é pública.
- Mesmo pública, o valor real fica em `.env`, fora do Git.
- Banco local: URL e chaves vêm de `npx supabase status`, nunca de `.env`.

## Procedimento

1. Leia a configuração de variáveis de ambiente. Não escreva valor real em
   código.
2. Ao criar uma variável, acrescente o nome, sem valor, ao `.env.example` do
   workspace que a usa.
3. Para saber se uma variável está definida, confira o nome. Não exiba o valor.
4. Nunca dê prefixo `VITE_` a um segredo.
5. Para entregar o projeto como arquivo, parta do que o Git rastreia. Compactar a
   pasta inteira leva junto os arquivos `.env`.
6. Se encontrar um segredo em arquivo rastreado ou no histórico do Git, PARE e
   avise o usuário sem repetir o valor. Não reescreva o histórico nem troque a
   chave por conta própria.

## Verificação

`git ls-files` não lista nenhum `.env` além de `.env.example`, e os arquivos
alterados pela tarefa não contêm valor real de chave, senha ou URL de banco.

## Não faça

- Não escreva valor real em código, documento, teste, log, mensagem de commit ou
  resposta ao usuário.
- Não versione `.env` nem altere o `.gitignore` para permitir isso.
- Não use credencial do Supabase remoto para desenvolver ou testar. Siga
  `rules/restrictions.md`.
