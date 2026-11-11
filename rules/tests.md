## Quando
Ao escrever, alterar ou remover qualquer teste.

## Procedimento
1. Testes rodam contra o banco local. Nunca contra o remoto.
2. O nome do teste em Jest (ADR-001) começa pelo critério que ele prova:
   `it('CA-03: não solicita autenticação com e-mail inválido', ...)`.
3. Teste de endpoint verifica status E corpo.
4. Tabela com política de acesso tem um teste que prova o bloqueio:
   o mesmo dado, com outro usuário, não retorna.

## Verificação
O comando de testes documentado em `AGENTS.md` passa com o banco local
recém-resetado. Enquanto `AGENTS.md` não documentar esse comando, registre
`não executado: comando não documentado`, como manda `rules/checks.md`.