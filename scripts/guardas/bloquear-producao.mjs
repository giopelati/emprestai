#!/usr/bin/env node
// Hook PreToolUse do agente principal (Bash e PowerShell).
// Nega comandos que publicam, migram ou escrevem no deploy. Esses passos são
// executados por uma pessoa do time (rules/restrictions.md, seção Produção).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REGRAS = [
  [/\bsupabase\s+(link|login)\b/i, 'ligar o CLI a um projeto Supabase remoto'],
  [/\bsupabase\s+db\s+(push|pull|dump|remote)\b/i, 'migration ou leitura no banco remoto'],
  [/--linked\b|--db-url\b|--project-ref\b/i, 'alvo remoto no Supabase CLI'],
  [/\bsupabase\s+(functions|secrets|storage|projects)\b/i, 'recurso remoto do Supabase'],
  [/[a-z0-9-]+\.supabase\.(co|com)\b/i, 'URL do Supabase remoto'],
  [/(^|[;&|(]\s*)(npx\s+|npm\s+exec\s+)?vercel(\.cmd|\.exe)?\s/i, 'CLI da Vercel'],
  [/:producao\b|--producao\b/i, 'script de produção (só uma pessoa executa)'],
  [/\bgit\s+push\b.*\bfeat\/001-login\b/i, 'push na branch de produção da Vercel'],
  [/\bgit\s+push\b.*(--force|-f\b|--mirror|--delete)/i, 'push destrutivo'],
  [/(^|[\s'"=/\\])\.env(?!\.example)(\.[a-z]+)?(?=$|[\s'"])/i, 'leitura de .env com valores reais'],
];

export function avaliar(comando) {
  const texto = String(comando ?? '');
  for (const [padrao, motivo] of REGRAS) {
    if (padrao.test(texto)) {
      return { permitido: false, motivo };
    }
  }
  return { permitido: true };
}

const executadoDireto =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (executadoDireto) {
  let entrada = {};
  try {
    entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    entrada = {};
  }
  const { permitido, motivo } = avaliar(entrada?.tool_input?.command);
  if (!permitido) {
    process.stderr.write(
      `Bloqueado: ${motivo}. Produção é escrita só por uma pessoa do time ` +
        '(rules/restrictions.md). Prepare o comando e deixe para ela.\n',
    );
    process.exit(2);
  }
  process.exit(0);
}
