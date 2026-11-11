---
name: conferir-tela
description: Mede no navegador se uma tela do frontend cumpre um critério de aceitação de layout ou acessibilidade — rolagem, altura e largura da janela, responsividade, ordem de Tab e foco visível. Use quando pedirem para checar se a tela cabe na janela, se aparece barra de rolagem, se quebra no celular ou se dá para navegar pelo teclado. Não use para criar ou estilizar tela, escolher cor ou tipografia, nem para testar login real, regra de negócio ou backend.
paths: "frontend/**"
---

# Conferir tela

Leitura de código e captura de tela não provam layout. Esta skill produz a
medição que prova.

## Antes de começar

1. Ache em `docs/specs/` o `CA-xx` que descreve o que será conferido. Sem CA,
   pare e diga isso: esta skill não cria requisito.
2. Use os tamanhos de janela e os estados citados no CA ou no `plan.md`. Se eles
   não fixarem tamanhos, use 375×812, 768×1024 e 1366×768 e informe a escolha.

## Procedimento

1. Suba o frontend com o comando de `AGENTS.md`, definindo antes, na mesma
   sessão do terminal, `VITE_SUPABASE_URL=http://127.0.0.1:9` e
   `VITE_SUPABASE_PUBLISHABLE_KEY=chave_falsa_local`. Variável do terminal vence
   o `.env`, e o Supabase remoto fica fora do alcance, como exige
   `rules/restrictions.md`.
2. Confirme nas requisições da página que nada foi para `supabase.co`.
3. Execute `scripts/medir-tela.js` na página. Ele define `medirTela` e
   `conferirFoco`.
4. Para cada tamanho, redimensione, espere 300 ms e rode `medirTela`, passando as
   colunas que não podem rolar e os elementos que o CA exige visíveis:
   `medirTela({ colunas: ['.login-hero'], elementos: ['#email'] })`. Confira no
   campo `janela` do resultado se o tamanho aplicado é o pedido.
5. Repita o passo 4 em cada estado que o CA citar. Para erro de campo, envie o
   formulário vazio. Para erro geral, envie um e-mail e uma senha falsos: o
   endereço inexistente provoca a falha de rede.
6. Para o teclado, clique no primeiro campo e aperte `Tab` de verdade. A cada
   parada, rode `conferirFoco()`.
7. Para envio duplicado, conte as requisições depois de um clique duplo real.
8. Registre a tabela de resultados em `tasks.md` da spec, com data, tamanhos e
   estados.
9. Encerre o servidor.

## Verificação

Todo `medirTela` e todo `conferirFoco` exigidos pelo CA retornam `ok: true`.
Qualquer `ok: false` é divergência, a menos que a causa seja a própria medição.
O que depende de Supabase de verdade fica registrado como `não verificado`.

## Não faça

- Não aprove layout olhando captura de tela ou lendo o CSS.
- Não leia o estilo de foco sem `conferirFoco`: a transição de CSS faz o campo
  parecer sem foco.
- Não teste envio duplicado com dois `requestSubmit()` seguidos: nenhuma pessoa
  dispara dois envios na mesma tarefa do navegador.
- Não use credencial real nem rode a tela com o `.env` apontando para o remoto.
- Não corrija CSS durante a medição: relate a falha e siga `rules/spec-flow.md`.
