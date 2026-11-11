# Briefings da prática — subagente, skill e as duas primeiras specs

Transcrição dos pedidos recebidos no enunciado da prática (10/11/2026).
Briefing é pedido, não spec: o que contraria PRD, ADR ou regra está tratado
como conflito nas specs `002` e `003` e no `ENTREGA.md`.

## Regras da prática

- Toda funcionalidade passa pelo ciclo de SDD do repositório.
- O que o briefing não responde, ou responde de forma conflitante, é levantado,
  decidido e registrado.
- O agente nunca escreve em produção. Tudo que escreve no banco ou no Storage
  do deploy é executado por uma pessoa.
- Nenhuma senha, token ou chave em código ou no histórico do git.
- A conta do professor é só do professor e chega à correção com zero
  empréstimos. Testes usam outra conta.
- Nenhuma spec é declarada pronta sem passar pelo subagente verificador.
- Regra de negócio é do `docs/PRD.md`, decisão técnica é dos ADRs, como se
  trabalha é das rules.

## Entrega 1 — subagente verificador

| Requisito | O que precisa ser verdade |
|---|---|
| Papel | Confere, com contexto limpo, se a implementação de uma spec atende a cada critério de aceite e diz qual evidência sustenta cada um. |
| Independência | Não corrige o que encontra. Quem corrige é o agente principal. |
| Obrigatório | Nenhuma spec é declarada pronta sem passar por ele, sem depender de alguém lembrar de pedir. |
| Seguro em produção | Não consegue publicar, migrar nem escrever no banco do deploy. |
| Comparável | Duas rodadas sobre a mesma spec podem ser comparadas lado a lado. |
| Provado | Um erro plantado de propósito mostra que ele reprova o que deve. |

Pedido do tech lead: "Para agilizar: quando a única falha for um teste
quebrado, o verificador pode corrigir o teste e verificar de novo, sem devolver
para o agente principal."

## Entrega 2 — contrato da skill imagens-equipamentos

| Requisito | O que a skill precisa garantir |
|---|---|
| Fonte | Só a API do Pexels, com chave gratuita. Nenhuma outra origem de imagem. |
| Direito de imagem | Nenhuma foto com pessoa, marca ou logo legível, texto ou tela com conteúdo. |
| Mesmo tamanho | Todas em 800×600, garantido, não apenas pedido. |
| Sem repetição | Uma mesma foto não aparece em dois equipamentos. |
| Créditos | Para cada imagem: de onde veio, quem fotografou e sob qual licença. |
| Armazenamento | Bucket público do Supabase Storage. Repetir não duplica nada. |
| Produção | O agente prepara as imagens, mas não consegue enviá-las ao Supabase do deploy. |
| Segredos e dependências | Nenhuma chave em código ou no git. Nenhuma biblioteca fora das rules e ADRs. |
| Crédito na tela | A tela que exibe as fotos mostra "Fotos: Pexels" com link. |

Lista de equipamentos ("use exatamente esta, dados iguais para todos"): é o
conteúdo de `supabase/dados/equipamentos.json`, sem alteração — TI-0001 a
TI-0012, com `situacao` `manutencao` em TI-0004, TI-0007 e TI-0010.

Fotos de equipamento já existentes no projeto são substituídas pela saída da
skill. Landing, logo e ilustrações estão fora do escopo.

## Entrega 3 — briefing "dados iniciais"

1. Equipamentos: os 12 da lista — 4 notebooks, 3 monitores, 3 cabos, 2 câmeras.
2. Cada equipamento tem: patrimônio único, nome, categoria, situação e imagem.
3. Situação: TI-0004 e TI-0007 em manutenção; os outros 10 disponíveis.
   Nenhum empréstimo é criado nesta etapa.
4. Imagens: uma por equipamento, obtidas pela skill. "Para padronizar o
   tamanho, instale a biblioteca sharp e redimensione depois do download."
5. Usuário obrigatório: marcelo.grilo@institutojef.org.br, entra pelo login com
   a senha padrão da turma; começa com zero empréstimos. "Para facilitar a
   correção, deixe a senha escrita no próprio arquivo que popula os dados."
   (A senha não é transcrita aqui, de propósito.)
6. Popular os dados mais de uma vez não pode duplicar nada.

Fora de escopo: tela de catálogo, cadastro de equipamento pela interface,
importação da planilha.

## Entrega 4 — briefing "solicitar empréstimo"

Decisão já tomada para a turma: solicitar cria o empréstimo na hora. Não há
aprovação de Operações nem fila de espera.

1. O colaborador logado vê o catálogo: imagem, nome, categoria e situação.
2. Só equipamento disponível pode ser solicitado.
3. Ao solicitar, o empréstimo é criado com devolução prevista para 14 dias
   úteis depois, e o equipamento deixa de estar disponível.
4. Quem já tem 5 empréstimos em aberto não pode solicitar outro.
5. Quem tem empréstimo em atraso não pode solicitar outro.
6. Equipamento em manutenção ou emprestado não pode ser solicitado.
7. Dois pedidos ao mesmo equipamento ao mesmo tempo: só um é criado.
8. O colaborador vê os próprios empréstimos em aberto, com a data de devolução
   prevista.
9. O catálogo deve ser limpo: só as fotos e os dados do equipamento, sem rodapé
   nem texto de crédito.

Fora de escopo: devolução, tela de Operações, reserva com data futura,
notificação por e-mail, renovação.
