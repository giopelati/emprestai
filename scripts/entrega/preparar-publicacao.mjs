#!/usr/bin/env node
// Prepara as branches locais publicar/backend e publicar/frontend para os dois
// repositórios da turma REST: o conteúdo de backend/ ou frontend/ (git subtree
// split) com o ENTREGA.md da raiz por cima, num commit próprio.
//
// Não faz push. Imprime os comandos para quem publica.
// Uso: node scripts/entrega/preparar-publicacao.mjs
import { execFileSync } from 'node:child_process';

const BRANCH_REMOTA = 'feat/003-solicitar-emprestimo';

function git(args, input) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    input,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

function existe(ref) {
  try {
    git(['rev-parse', '--verify', '--quiet', ref]);
    return true;
  } catch {
    return false;
  }
}

const head = git(['rev-parse', '--short', 'HEAD']);
const blobEntrega = git(['hash-object', '-w', 'ENTREGA.md']);

for (const parte of ['backend', 'frontend']) {
  const split = git(['subtree', 'split', `--prefix=${parte}`]);
  const destino = `publicar/${parte}`;

  // Pais: sem publicação anterior, o split. Com publicação que já contém o
  // split, só ela (avança sem reescrever). Com split novo, as duas (merge),
  // para o push nunca precisar de --force.
  let pais = [split];
  if (existe(destino)) {
    const anterior = git(['rev-parse', destino]);
    try {
      git(['merge-base', '--is-ancestor', split, anterior]);
      pais = [anterior];
    } catch {
      pais = [anterior, split];
    }
  }
  const base = pais[0];

  // Árvore = árvore do split + ENTREGA.md atual na raiz.
  const entradas = git(['ls-tree', split])
    .split('\n')
    .filter((linha) => linha && !linha.endsWith('\tENTREGA.md'));
  entradas.push(`100644 blob ${blobEntrega}\tENTREGA.md`);
  const arvore = git(['mktree'], `${entradas.join('\n')}\n`);

  if (pais.length === 1 && base !== split && git(['rev-parse', `${base}^{tree}`]) === arvore) {
    console.log(`${parte}: nada mudou desde a última publicação (${base.slice(0, 7)}).`);
    git(['update-ref', `refs/heads/${destino}`, base]);
    continue;
  }

  const mensagem =
    `docs: ENTREGA.md da prática (monorepo ${head})\n\n` +
    `Conteúdo de ${parte}/ do monorepo no commit ${head}. Specs, ADRs, rules,\n` +
    'subagente e skill estão no monorepo; os hashes citados no ENTREGA.md são dele.\n';
  const commit = git(['commit-tree', arvore, ...pais.flatMap((p) => ['-p', p]), '-m', mensagem]);
  git(['update-ref', `refs/heads/${destino}`, commit]);
  console.log(`${parte}: ${destino} → ${commit.slice(0, 7)}`);
}

console.log(`
Para publicar (pessoa, depois de conferir):
  git push backend publicar/backend:refs/heads/${BRANCH_REMOTA}
  git push frontend publicar/frontend:refs/heads/${BRANCH_REMOTA}
Para marcar a entrega (o que vier depois da tag não entra):
  git tag -f entrega-pratica-backend publicar/backend
  git tag -f entrega-pratica-frontend publicar/frontend
  git push backend entrega-pratica-backend:refs/tags/entrega-pratica
  git push frontend entrega-pratica-frontend:refs/tags/entrega-pratica`);
