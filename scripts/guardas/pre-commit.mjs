#!/usr/bin/env node
// Hook pre-commit do Git (instalado por `npm install` via core.hooksPath).
//
// 1. Spec só vira "Pronta" com relatório CONFORME do verificador-spec, em modo
//    entrega, sobre o commit atual (HEAD), e no mesmo commit não entra código.
// 2. Nenhum .env, chave, token ou senha literal entra no Git.
import { execFileSync } from 'node:child_process';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

const erros = [];
const preparados = git('diff', '--cached', '--name-only', '--diff-filter=ACMR')
  .split('\n')
  .map((linha) => linha.trim())
  .filter(Boolean);

// ---------- 1. Spec pronta exige verificação ----------
function statusDaSpec(conteudo) {
  const trecho = conteudo.split(/^## Status\s*$/m)[1] ?? '';
  const linha = trecho.split('\n').find((l) => l.trim()) ?? '';
  return linha.trim();
}

let head = '';
try {
  head = git('rev-parse', 'HEAD').trim();
} catch {
  head = '';
}

for (const caminho of preparados) {
  const casamento = caminho.match(/^docs\/specs\/(\d{3}-[a-z0-9-]+)\/spec\.md$/);
  if (!casamento) {
    continue;
  }
  const status = statusDaSpec(git('show', `:${caminho}`));
  if (!/^pronta\b/i.test(status)) {
    continue;
  }
  const pasta = `docs/specs/${casamento[1]}`;
  const relatorios = git('ls-files', '--cached', `${pasta}/verificacoes/`)
    .split('\n')
    .filter((l) => l.endsWith('.md'))
    .sort();
  const ultimo = relatorios.at(-1);
  if (!ultimo) {
    erros.push(
      `${caminho}: status "Pronta" sem relatório do verificador-spec em ${pasta}/verificacoes/.`,
    );
    continue;
  }
  const relatorio = git('show', `:${ultimo}`);
  const conforme = /^\*\*Veredito:\*\* CONFORME\s*$/m.test(relatorio);
  const entrega = /^# Verificação — .*modo entrega/m.test(relatorio);
  const commit = relatorio.match(/\*\*Commit verificado:\*\*\s*([0-9a-f]{40})/)?.[1];
  if (!conforme || !entrega) {
    erros.push(
      `${caminho}: o relatório mais recente (${ultimo}) não é "CONFORME" em modo entrega.`,
    );
  }
  if (commit !== head) {
    erros.push(
      `${caminho}: o relatório mais recente verificou ${commit ?? 'nenhum commit'}, ` +
        `mas o HEAD é ${head || 'vazio'}. Verifique o commit atual de novo.`,
    );
  }
  const foraDaDocumentacao = preparados.filter(
    (p) =>
      !p.startsWith(`${pasta}/`) &&
      !['handoff.md', 'ENTREGA.md', 'AGENTS.md'].includes(p),
  );
  if (foraDaDocumentacao.length > 0) {
    erros.push(
      `${caminho}: o commit que declara a spec pronta não pode levar código não verificado: ` +
        foraDaDocumentacao.join(', '),
    );
  }
}

// ---------- 2. Segredos ----------
for (const caminho of preparados) {
  if (/(^|\/)\.env(\..+)?$/.test(caminho) && !caminho.endsWith('.env.example')) {
    erros.push(`${caminho}: arquivo .env não pode ser versionado.`);
  }
}

const PADROES_SEGREDO = [
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'chave secreta do Supabase'],
  [/sb_publishable_[A-Za-z0-9_-]{10,}/, 'chave do Supabase (valor real fica no .env)'],
  [/eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}/, 'token JWT'],
  [/postgres(ql)?:\/\/[^\s:@]+:[^\s@]+@(?!127\.0\.0\.1|localhost)/, 'URL de banco com senha'],
  [/PEXELS_API_KEY\s*=\s*\S{8,}/, 'chave do Pexels'],
  [/(senha|password)\w*\s*[:=]\s*['"][^'"\s]{6,}['"]/i, 'senha literal'],
];

const diff = git('diff', '--cached', '-U0', '--no-color');
let arquivoAtual = '';
for (const linha of diff.split('\n')) {
  if (linha.startsWith('+++ ')) {
    arquivoAtual = linha.slice(6);
    continue;
  }
  if (!linha.startsWith('+') || linha.startsWith('+++')) {
    continue;
  }
  if (arquivoAtual.endsWith('.env.example') || arquivoAtual.startsWith('scripts/guardas/')) {
    continue;
  }
  for (const [padrao, nome] of PADROES_SEGREDO) {
    if (padrao.test(linha)) {
      erros.push(`${arquivoAtual}: possível ${nome} em linha adicionada.`);
    }
  }
}

if (erros.length > 0) {
  process.stderr.write(`Commit bloqueado pelo pre-commit do Emprestaí:\n- ${erros.join('\n- ')}\n`);
  process.exit(1);
}
