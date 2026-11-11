#!/usr/bin/env node
// Hook SubagentStop: quando o verificador-spec termina, salva o relatório dele
// em docs/specs/<NNN>/verificacoes/, sem passar pelo agente principal.
// O nome do arquivo leva data, modo e commit, para comparar rodadas.
//
// Uso manual (harness que não executa o hook):
//   node scripts/guardas/salvar-relatorio.mjs --arquivo <relatorio.md>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CABECALHO = /^# Verificação — (\d{3}-[a-z0-9-]+)\b.*modo (gate|entrega)/m;

function textoDoTranscript(caminho) {
  if (!caminho || !existsSync(caminho)) {
    return '';
  }
  const linhas = readFileSync(caminho, 'utf8').split('\n').filter(Boolean);
  for (let i = linhas.length - 1; i >= 0; i -= 1) {
    try {
      const evento = JSON.parse(linhas[i]);
      const conteudo = evento?.message?.content;
      if (evento?.type !== 'assistant' || !Array.isArray(conteudo)) {
        continue;
      }
      const texto = conteudo
        .filter((parte) => parte?.type === 'text')
        .map((parte) => parte.text)
        .join('\n');
      if (CABECALHO.test(texto)) {
        return texto;
      }
    } catch {
      // linha incompleta: ignora
    }
  }
  return '';
}

export function extrairRelatorio(texto) {
  const bruto = String(texto ?? '');
  const inicio = bruto.search(/^# Verificação — /m);
  if (inicio < 0) {
    return null;
  }
  let relatorio = bruto.slice(inicio).trim();
  // Remove cerca de código que o modelo possa ter colocado em volta.
  relatorio = relatorio.replace(/\n```\s*$/, '').trim();
  const cabecalho = relatorio.match(CABECALHO);
  if (!cabecalho) {
    return null;
  }
  const commit = relatorio.match(/\*\*Commit verificado:\*\*\s*([0-9a-f]{7,40})/);
  return {
    spec: cabecalho[1],
    modo: cabecalho[2],
    commit: commit ? commit[1] : 'sem-commit',
    texto: `${relatorio}\n`,
  };
}

export function salvar(relatorio, agora = new Date()) {
  const pasta = join(RAIZ, 'docs', 'specs', relatorio.spec);
  if (!existsSync(pasta)) {
    throw new Error(`spec inexistente: ${relatorio.spec}`);
  }
  const destino = join(pasta, 'verificacoes');
  mkdirSync(destino, { recursive: true });
  const carimbo = agora
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15);
  const arquivo = join(
    destino,
    `${carimbo}-${relatorio.modo}-${relatorio.commit.slice(0, 7)}.md`,
  );
  writeFileSync(arquivo, relatorio.texto, 'utf8');
  return arquivo;
}

const executadoDireto =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (executadoDireto) {
  let texto = '';
  const indice = process.argv.indexOf('--arquivo');
  if (indice > 0) {
    texto = readFileSync(process.argv[indice + 1], 'utf8');
  } else {
    let entrada = {};
    try {
      entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
    } catch {
      entrada = {};
    }
    if (entrada.agent_type && entrada.agent_type !== 'verificador-spec') {
      process.exit(0);
    }
    texto =
      entrada.last_assistant_message ||
      textoDoTranscript(entrada.agent_transcript_path);
  }
  const relatorio = extrairRelatorio(texto);
  if (!relatorio) {
    process.exit(0);
  }
  const arquivo = salvar(relatorio);
  process.stdout.write(`Relatório do verificador salvo em ${arquivo}\n`);
}
