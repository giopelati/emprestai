#!/usr/bin/env node
// Passo 2 da skill: revisão visual HUMANA. Só roda em terminal interativo.
// Aprovação vai para supabase/dados/creditos-imagens.json; reprovação para
// supabase/dados/imagens-rejeitadas.json (as duas versionadas).
// Uso: npm run imagens:revisar
import { createInterface } from 'node:readline/promises';

import {
  ARQ_CREDITOS,
  ARQ_REJEITADAS,
  ARQ_SELECAO,
  CACHE,
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
    console.log(`\n${item.patrimonio} · ${item.nome}`);
    console.log(`  arquivo: ${CACHE}/${item.patrimonio}.jpg`);
    console.log(`  Pexels ${item.pexels_id} · ${item.fotografo} · ${item.pagina_url}`);
    const resposta = (
      await leitor.question('  Tem pessoa, marca/logo, texto ou tela com conteúdo? Aprovar? [s/n] ')
    )
      .trim()
      .toLowerCase();
    if (resposta === 's') {
      const { revisao, nome, alt, ...credito } = item;
      void revisao;
      void nome;
      void alt;
      const indice = aprovadas.findIndex((a) => a.patrimonio === item.patrimonio);
      const registro = { ...credito, revisado_por: revisor, revisado_em: agora };
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
    const numero = (await leitor.question('  Motivo (número ou texto): ')).trim();
    rejeitadas.push({
      patrimonio: item.patrimonio,
      pexels_id: item.pexels_id,
      pagina_url: item.pagina_url,
      motivo: MOTIVOS[numero] ?? numero,
      revisado_por: revisor,
      revisado_em: agora,
    });
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
