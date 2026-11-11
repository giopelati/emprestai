#!/usr/bin/env node
// Passo 2 da skill: revisão visual HUMANA. Só roda em terminal interativo.
// Para cada equipamento, a pessoa escolhe uma das candidatas pelo número, ou 0
// se nenhuma serve. Aprovação vai para supabase/dados/creditos-imagens.json;
// reprovação para supabase/dados/imagens-rejeitadas.json (as duas versionadas).
// Uso: npm run imagens:revisar
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';

import {
  ARQ_CREDITOS,
  ARQ_REJEITADAS,
  ARQ_SELECAO,
  CACHE,
  caminhoCache,
  escreverJson,
  lerJson,
} from './lib.mjs';

const MOTIVOS = {
  1: 'pessoa ou parte de pessoa',
  2: 'marca ou logo legível',
  3: 'texto legível',
  4: 'tela com conteúdo',
  5: 'não mostra o equipamento',
};

// Crédito gravado: tudo da candidata, menos o que só serve à revisão.
function credito(candidata) {
  const { arquivo, titulo, ...resto } = candidata;
  void arquivo;
  void titulo;
  return resto;
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      'A revisão visual é feita por uma pessoa, em terminal interativo. ' +
        'Agentes não aprovam imagens.',
    );
    process.exit(1);
  }
  const selecao = lerJson(ARQ_SELECAO, null);
  if (!selecao) {
    console.error('Nada para revisar. Rode antes: npm run imagens:preparar');
    process.exit(1);
  }
  const pendentes = selecao.itens.filter((item) => item.revisao === 'pendente');
  if (pendentes.length === 0) {
    console.log('Nenhuma imagem pendente de revisão.');
    return;
  }

  const leitor = createInterface({ input: process.stdin, output: process.stdout });
  console.log(`Abra ${CACHE}/revisao.html e olhe cada foto inteira antes de responder.\n`);
  const revisor = (await leitor.question('Seu nome (fica registrado na revisão): ')).trim();
  if (!revisor) {
    leitor.close();
    console.error('Revisão sem nome não vale.');
    process.exit(1);
  }

  const aprovadas = lerJson(ARQ_CREDITOS, []);
  const rejeitadas = lerJson(ARQ_REJEITADAS, []);
  const agora = new Date().toISOString();

  for (const item of pendentes) {
    const total = item.candidatas.length;
    console.log(`\n${item.patrimonio} · ${item.nome} (${total} candidata(s) na folha)`);
    let escolha = NaN;
    while (!(Number.isInteger(escolha) && escolha >= 0 && escolha <= total)) {
      escolha = Number(
        (
          await leitor.question(
            `  Número da foto sem pessoa, marca/logo, texto ou tela com conteúdo (1-${total}), ou 0 se nenhuma serve: `,
          )
        ).trim(),
      );
    }

    if (escolha > 0) {
      const candidata = item.candidatas[escolha - 1];
      copyFileSync(join(CACHE, candidata.arquivo), caminhoCache(item.patrimonio));
      const registro = { ...credito(candidata), revisado_por: revisor, revisado_em: agora };
      const indice = aprovadas.findIndex((a) => a.patrimonio === item.patrimonio);
      if (indice >= 0) {
        aprovadas[indice] = registro;
      } else {
        aprovadas.push(registro);
      }
      continue;
    }

    console.log(
      Object.entries(MOTIVOS)
        .map(([n, m]) => `    ${n}) ${m}`)
        .join('\n'),
    );
    const numero = (await leitor.question('  Motivo principal (número ou texto): ')).trim();
    for (const candidata of item.candidatas) {
      rejeitadas.push({
        patrimonio: item.patrimonio,
        foto_id: candidata.foto_id,
        pagina_url: candidata.pagina_url,
        motivo: MOTIVOS[numero] ?? numero,
        revisado_por: revisor,
        revisado_em: agora,
      });
    }
  }
  leitor.close();

  aprovadas.sort((a, b) => a.patrimonio.localeCompare(b.patrimonio));
  escreverJson(ARQ_CREDITOS, aprovadas);
  escreverJson(ARQ_REJEITADAS, rejeitadas);
  console.log(`\nAprovadas: ${aprovadas.length}/12. Reprovadas no total: ${rejeitadas.length}.`);
  if (aprovadas.length < 12) {
    console.log('Rode de novo: npm run imagens:preparar (as reprovadas não voltam).');
  } else {
    console.log('Todas aprovadas. Commite supabase/dados/*.json.');
  }
}

main().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
