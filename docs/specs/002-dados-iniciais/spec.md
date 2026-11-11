# Spec 002 — Dados iniciais

## Status

Em implementação. Aguarda: revisão visual humana das fotos e execução dos
passos de produção por uma pessoa do time.

## Referências

- `docs/PRD.md` — catálogo com a situação de cada equipamento; equipamento em
  manutenção não aparece como disponível.
- `docs/adr/001-stack.md`, `docs/adr/002-migrations.md`,
  `docs/adr/003-acesso-a-dados-do-backend.md`.
- Briefing "dados iniciais", lista de equipamentos e contrato da skill
  `imagens-equipamentos`: `docs/briefings/pratica-sdd-subagentes.md`.
- `rules/restrictions.md`, `rules/secrets.md`, `rules/migration.md`.

## Objetivo

O sistema em produção tem os 12 equipamentos da prática, cada um com foto, e a
conta do professor para testar, criados de forma repetível e sem segredo no
Git.

## Conflitos resolvidos

| # | Pedido | Contrariava | Decisão |
|---|---|---|---|
| C1 | Briefing, item 4: "instale a biblioteca sharp e redimensione depois do download" | ADR-001 não lista `sharp`; `rules/restrictions.md` proíbe biblioteca fora dos ADRs; contrato da skill: "nenhuma biblioteca fora do que as rules e ADRs permitem" | Sem `sharp`. O recorte 800×600 é pedido ao CDN do Pexels e o tamanho é **garantido** por código que lê o cabeçalho JPEG e recusa o arquivo fora do tamanho, antes e depois do envio. |
| C2 | Briefing, item 5: "deixe a senha escrita no próprio arquivo que popula os dados" | Regra da prática: "nenhuma senha, token ou chave em código ou no histórico do git"; `rules/secrets.md` | A senha vem da variável `SENHA_PROFESSOR`, em `.env.producao` (fora do Git), ou é digitada no terminal. O pre-commit recusa senha literal. |
| C3 | Briefing, item 3: "TI-0004 e TI-0007 em manutenção; os outros 10 disponíveis" | A lista da prática ("use exatamente esta, dados iguais para todos") marca também TI-0010 como `manutencao` | Vale a lista: TI-0004, TI-0007 e TI-0010 em manutenção; 9 disponíveis. A lista é o dado item a item e é declarada igual para todos; o item 3 do briefing é um resumo que diverge dela. |
| C4 | Popular dados e enviar fotos exige a chave secreta do Supabase | `rules/secrets.md` (rascunho) dizia que só o backend usa a chave secreta; ADR-003 diz que o backend não usa segredo | A chave secreta não vai para o backend nem para a Vercel. Só os scripts `*:producao`, executados por pessoa, a leem de `.env.producao`. `rules/secrets.md` foi revisada para classificar essas variáveis. |
| C5 | Contrato da skill: "só a API do Pexels, com chave gratuita" | O Pexels suspendeu a emissão de chaves novas (aviso em https://www.pexels.com/api/, conferido em 11/11/2026); sem chave, a skill não roda | A fonte passa a ser a API do **Openverse** (sem chave), só fotos do Flickr com licença CC0, domínio público ou CC BY. O resto do contrato não muda: 800×600 garantido por código, revisão humana, sem repetição, crédito completo e link de crédito na tela ("Fotos: Openverse"). A coluna `foto_pexels_id` mantém o nome (renomear exigiria migration nova) e guarda o id da foto no Flickr. |

## Lacunas decididas

| # | O que faltava | Decisão |
|---|---|---|
| L1 | Papel da conta do professor | `colaborador` em `app_metadata.role` (spec 001). É o papel que vê Catálogo e Meus empréstimos e pode solicitar. Nome exibido: "Marcelo Grilo". E-mail já confirmado na criação. |
| L2 | O que "não duplicar" significa para a situação | Repetir o processo não altera a situação de equipamento que já existe: a situação só é gravada na criação. Assim, rodar de novo depois de empréstimos reais não "devolve" itens. Nome, categoria e foto são atualizados. |
| L3 | Onde fica a foto e o crédito | Objeto `<patrimonio>.jpg` no bucket público `equipamentos`; no banco, colunas de foto em `equipamentos` (id da foto na origem, fotógrafo, URL do fotógrafo, página, licença). |
| L4 | Formato da imagem | JPEG 800×600 (4:3, orientação deitada). |
| L5 | Quem pode ler e escrever `equipamentos` | Leitura: qualquer pessoa autenticada (RLS). Escrita: só a chave secreta (script de dados). Nenhuma escrita pelo frontend ou pelo backend nesta spec. |
| L6 | Conta do professor já existente | O script encontra pela e-mail e atualiza papel e senha; não cria outra. Não cria nem apaga empréstimos. |

## Comportamento

1. `supabase/dados/equipamentos.json` é a lista da prática, sem alteração.
2. A skill `imagens-equipamentos` obtém uma foto por patrimônio, com revisão
   visual humana, e registra o crédito em `supabase/dados/creditos-imagens.json`.
3. Uma migration cria a tabela `equipamentos`, suas políticas e o bucket
   público `equipamentos`.
4. `npm run dados:popular` (local) e `npm run dados:popular:producao` (só
   pessoa) enviam as fotos, gravam os 12 equipamentos e criam ou atualizam a
   conta do professor.

## Critérios de aceitação

### CA-01 — Doze equipamentos da lista

**Dado** o banco com as migrations aplicadas  
**Quando** os dados são populados  
**Então** existem exatamente os 12 patrimônios de `supabase/dados/equipamentos.json`, cada um com patrimônio único, nome, categoria (`notebook`, `monitor`, `cabo` ou `camera`), situação e imagem, com 4 notebooks, 3 monitores, 3 cabos e 2 câmeras.

### CA-02 — Situação decidida

**Dado** a primeira carga  
**Quando** os dados são populados  
**Então** TI-0004, TI-0007 e TI-0010 estão em `manutencao`, os outros 9 em `disponivel`, e nenhum empréstimo é criado.

### CA-03 — Imagens 800×600 públicas

**Dado** os dados populados  
**Quando** a URL pública de cada imagem é aberta sem login  
**Então** ela responde com JPEG de exatamente 800×600, e um arquivo de outro tamanho é recusado antes do envio.

### CA-04 — Origem, direito de imagem e repetição

**Dado** as imagens enviadas  
**Quando** os créditos são conferidos  
**Então** todas vêm de `live.staticflickr.com`, encontradas pela API do Openverse, cada uma tem revisão humana registrada (quem e quando), nenhum `foto_id` se repete, e o banco recusa uma segunda linha com o mesmo `foto_pexels_id`.

### CA-05 — Créditos registrados

**Dado** cada equipamento  
**Quando** o registro é lido  
**Então** ele tem id da foto na origem, fotógrafo, URL do fotógrafo, página da foto e licença.

### CA-06 — Repetir não duplica

**Dado** os dados já populados e um equipamento com situação alterada depois  
**Quando** o processo roda de novo  
**Então** continuam 12 equipamentos, 12 objetos no bucket e uma conta do professor, e a situação alterada é mantida.

### CA-07 — Conta do professor

**Dado** os dados populados  
**Quando** `marcelo.grilo@institutojef.org.br` entra pelo Login com a senha padrão da turma  
**Então** a sessão é aberta com papel `colaborador` e a conta tem zero empréstimos.

### CA-08 — Acesso aos dados

**Dado** uma pessoa autenticada sem chave secreta  
**Quando** ela tenta inserir, alterar ou apagar um equipamento pela API  
**Então** nada muda; a leitura é permitida a autenticados e negada a anônimos.

### CA-09 — Sem segredo e sem escrita do agente em produção

**Dado** o repositório  
**Quando** os arquivos rastreados são inspecionados  
**Então** não há senha, chave ou token, e os comandos que escrevem em produção recusam execução sem terminal interativo e confirmação da referência do projeto.

## Fora do escopo

- Tela de catálogo (spec 003), cadastro de equipamento pela interface,
  importação da planilha.
- Empréstimos de qualquer tipo.
- Imagens de landing, logo ou ilustração.
