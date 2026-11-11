# API do Pexels — o que esta skill usa

Fonte: https://www.pexels.com/api/documentation/ (lida em 10/11/2026).

## Autenticação

Cabeçalho `Authorization: <PEXELS_API_KEY>` (sem `Bearer`). Chave gratuita,
pessoal, criada em https://www.pexels.com/api/ por quem é dono da conta.

## Busca

`GET https://api.pexels.com/v1/search`

| Parâmetro | Uso aqui |
|---|---|
| `query` | campo `busca` de `supabase/dados/equipamentos.json` |
| `orientation` | `landscape` (o destino é 4:3 deitado) |
| `per_page` | 40 (máximo 80) |
| `page`, `size`, `locale` | não usados |

## Campos do objeto Photo usados

`id`, `url` (página da foto), `photographer`, `photographer_url`, `alt`,
`src.original`.

## Tamanho

A documentação não descreve os parâmetros de recorte, mas as variantes de
`src` devolvidas pela própria API usam o CDN com
`?auto=compress&cs=tinysrgb&fit=crop&w=<l>&h=<a>`. A skill aplica
`w=800&h=600` sobre `src.original` e **não confia** no resultado: lê o
cabeçalho JPEG e recusa qualquer coisa diferente de 800×600. Testado em
10/11/2026 com a foto 2014422: devolveu JPEG 800×600.

## Limites

200 requisições por hora e 20.000 por mês. Uma rodada completa faz no máximo
12 buscas. Resposta `429` interrompe o script.

## Atribuição (diretrizes da API)

- Exibir um link visível para o Pexels onde as fotos aparecem — por exemplo
  "Fotos: Pexels" com link para https://www.pexels.com.
- Creditar o fotógrafo quando possível ("Foto de Fulano no Pexels").
- Licença: https://www.pexels.com/license/ — uso gratuito, sem exigência legal
  de atribuição, mas a API exige o link. Não pode redistribuir as fotos como
  banco de imagens; por isso elas não vão para o Git.
