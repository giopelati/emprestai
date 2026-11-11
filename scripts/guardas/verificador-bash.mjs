#!/usr/bin/env node
// Hook PreToolUse do subagente verificador-spec.
// Lista de permissão: só passa comando de leitura do Git, os checks
// comprovados e o banco LOCAL. Qualquer outro comando é negado (exit 2).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXATOS = new Set([
  'git status --short',
  'git branch --show-current',
  'git rev-parse HEAD',
  'npm run typecheck',
  'npm run build',
  'npm run typecheck --workspace backend',
  'npm run build --workspace backend',
  'npm run db:reset',
  'npm test --workspace backend',
  'npx supabase status',
]);

// Subcomandos de leitura do Git que aceitam argumentos.
const GIT_LEITURA = /^git (log|show|diff|grep|ls-files)( |$)/;

// Encadeamento, redirecionamento, substituição e quebras de linha.
const PERIGOSO = /[;&|<>`\n\r]|\$\(/;

// Opções de comandos de leitura que escrevem em disco ou executam programas.
const OPCOES_PROIBIDAS =
  /(^|\s)(--output|--ext-diff|--textconv|-O\S*|--open-files-in-pager\S*|--exec-path|--git-dir|--work-tree)(=|\s|$)/;

export function avaliar(comandoBruto) {
  const comando = String(comandoBruto ?? '').trim().replace(/[ \t]+/g, ' ');

  if (!comando) {
    return { permitido: false, motivo: 'comando vazio' };
  }
  if (PERIGOSO.test(comando)) {
    return {
      permitido: false,
      motivo: 'encadeamento, redirecionamento ou substituição de comando',
    };
  }
  if (EXATOS.has(comando)) {
    return { permitido: true };
  }
  if (GIT_LEITURA.test(comando)) {
    if (OPCOES_PROIBIDAS.test(comando)) {
      return { permitido: false, motivo: 'opção que escreve ou executa' };
    }
    return { permitido: true };
  }
  return { permitido: false, motivo: 'comando fora da lista do verificador' };
}

function lerEntrada() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
    process.argv[1]?.endsWith('verificador-bash.mjs')) {
  const entrada = lerEntrada();
  const { permitido, motivo } = avaliar(entrada?.tool_input?.command);
  if (!permitido) {
    process.stderr.write(
      `verificador-spec é somente leitura: ${motivo}. ` +
        'Comandos permitidos estão em .claude/agents/verificador-spec.md.\n',
    );
    process.exit(2);
  }
  process.exit(0);
}
