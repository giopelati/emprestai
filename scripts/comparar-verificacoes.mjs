#!/usr/bin/env node
// Compara duas rodadas do verificador-spec sobre a mesma spec, CA a CA.
// Uso: node scripts/comparar-verificacoes.mjs <relatorio-a.md> <relatorio-b.md>
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

function ler(caminho) {
  const texto = readFileSync(caminho, 'utf8');
  const veredito = texto.match(/\*\*Veredito:\*\*\s*(.+)/)?.[1]?.trim() ?? '?';
  const commit = texto.match(/\*\*Commit verificado:\*\*\s*([0-9a-f]+)/)?.[1]?.slice(0, 7) ?? '?';
  const criterios = new Map();
  for (const linha of texto.split('\n')) {
    const celulas = linha.split('|').map((c) => c.trim());
    if (/^CA-\d+$/.test(celulas[1] ?? '')) {
      criterios.set(celulas[1], celulas[2]);
    }
  }
  return { nome: basename(caminho), veredito, commit, criterios };
}

const [a, b] = process.argv.slice(2).map(ler);
if (!a || !b) {
  process.stderr.write('Uso: node scripts/comparar-verificacoes.mjs <a.md> <b.md>\n');
  process.exit(1);
}

const ids = [...new Set([...a.criterios.keys(), ...b.criterios.keys()])].sort(
  (x, y) => Number(x.slice(3)) - Number(y.slice(3)),
);
const linhas = [
  `| CA | ${a.nome} (${a.commit}) | ${b.nome} (${b.commit}) | Mudou |`,
  '|---|---|---|---|',
  ...ids.map((id) => {
    const antes = a.criterios.get(id) ?? '—';
    const depois = b.criterios.get(id) ?? '—';
    return `| ${id} | ${antes} | ${depois} | ${antes === depois ? '' : 'sim'} |`;
  }),
  `| **Veredito** | ${a.veredito} | ${b.veredito} | ${a.veredito === b.veredito ? '' : 'sim'} |`,
];
process.stdout.write(`${linhas.join('\n')}\n`);
