# API do Openverse — o que esta skill usa (conflito C5 da spec 002)

O Pexels suspendeu a emissão de chaves novas em 11/11/2026. A fonte passou a
ser `GET https://api.openverse.org/v1/images/`, sem chave (até 20 por página).

| Parâmetro | Uso aqui |
|---|---|
| `q` | campo `busca` da lista; se faltar candidata, o termo sem as últimas palavras |
| `source` | `flickr` (o Flickr publica o tamanho `_c`, 800 px no lado maior) |
| `license` | `cc0,pdm,by` (sem SA, NC ou ND) |
| `aspect_ratio` | `wide`; depois a skill fica só com originais exatamente 4:3 |

Campos usados: `url`, `foreign_landing_url` (id do Flickr), `creator`,
`creator_url`, `license`, `license_version`, `license_url`, `title`, `tags`.

O download troca o sufixo da URL do Flickr por `_c` e só aceita
`live.staticflickr.com`; o cabeçalho JPEG precisa dizer 800×600.
Crédito na tela: link "Fotos: Openverse" e fotógrafo + licença no `title`.
