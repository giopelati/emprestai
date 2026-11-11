#!/usr/bin/env node
// Passo 1 da skill: busca no Pexels, descarta o que a triagem automática já
// reprova, baixa em 800×600 (conferido por código) e monta a folha de revisão.
// Não envia nada a lugar nenhum. Uso: npm run imagens:preparar
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  ARQ_CREDITOS,
  ARQ_EQUIPAMENTOS,
  ARQ_REJEITADAS,
  ARQ_SELECAO,
  CACHE,
  LICENCA,
  baixarJpeg,
  caminhoCache,
  exigirTamanho,
  escreverJson,
  lerJson,
  motivoAutomatico,
  sha256,
  urlRecortada,
} from './lib.mjs';

const API = 'https://api.pexels.com/v1';
const POR_PAGINA = 40;

async function buscar(chave, termo) {
  const url = new URL(`${API}/search`);
  url.searchParams.set('query', termo);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('per_page', String(POR_PAGINA));
  const resposta = await fetch(url, { headers: { Authorization: chave } });
  if (resposta.status === 429) {
    throw new Error('Limite de requisições do Pexels atingido (200/h). Tente mais tarde.');
  }
  if (!resposta.ok) {
    throw new Error(`Busca no Pexels falhou (${resposta.status}) para "${termo}".`);
  }
  const corpo = await resposta.json();
  return corpo.photos ?? [];
}

function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function folhaDeRevisao(selecao) {
  const cartoes = selecao.itens
    .map(
      (item) => `<figure>
  <img src="./${item.patrimonio}.jpg" width="400" height="300" alt="">
  <figcaption>
    <strong>${escaparHtml(item.patrimonio)} · ${escaparHtml(item.nome)}</strong><br>
    Pexels ${item.pexels_id} · ${escaparHtml(item.fotografo)}<br>
    <em>${escaparHtml(item.alt || '(sem texto alternativo)')}</em><br>
    Situação: ${item.revisao}
  </figcaption>
</figure>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><title>Revisão das imagens</title>
<style>
body{font-family:system-ui,sans-serif;background:#161826;color:#e9e9ed;margin:24px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:20px}
figure{margin:0;background:#232532;padding:12px;border-radius:8px}
img{width:100%;height:auto;display:block;border-radius:4px}
figcaption{font-size:13px;line-height:1.5;margin-top:8px}
</style>
<h1>Revisão visual — reprovar se houver pessoa (ou parte dela), marca ou logo legível, texto, ou tela com conteúdo</h1>
<p>Depois de olhar, rode <code>npm run imagens:revisar</code> em um terminal.</p>
<main>
${cartoes}
</main>
</html>
`;
}

export async function preparar({ chave, log = console.log } = {}) {
  if (!chave) {
    throw new Error('Defina PEXELS_API_KEY no arquivo .env da raiz (fora do Git).');
  }
  const equipamentos = lerJson(ARQ_EQUIPAMENTOS, []);
  const aprovadas = lerJson(ARQ_CREDITOS, []);
  const rejeitadas = lerJson(ARQ_REJEITADAS, []);
  const idsRejeitados = new Set(rejeitadas.map((r) => r.pexels_id));
  const usados = new Set(aprovadas.map((a) => a.pexels_id));
  mkdirSync(CACHE, { recursive: true });

  const selecao = { gerado_em: new Date().toISOString(), itens: [], descartadas_automaticamente: [] };

  for (const equipamento of equipamentos) {
    const aprovada = aprovadas.find((a) => a.patrimonio === equipamento.patrimonio);
    if (aprovada) {
      const arquivo = caminhoCache(equipamento.patrimonio);
      let buffer = existsSync(arquivo) ? readFileSync(arquivo) : null;
      if (!buffer) {
        buffer = await baixarJpeg(aprovada.download_url);
        writeFileSync(arquivo, buffer);
      }
      exigirTamanho(buffer, arquivo);
      selecao.itens.push({ ...aprovada, nome: equipamento.nome, revisao: 'aprovada' });
      log(`${equipamento.patrimonio}: já aprovada (Pexels ${aprovada.pexels_id}).`);
      continue;
    }

    const fotos = await buscar(chave, equipamento.busca);
    let escolhida = null;
    for (const foto of fotos) {
      if (usados.has(foto.id) || idsRejeitados.has(foto.id)) {
        continue;
      }
      const motivo = motivoAutomatico(foto.alt);
      if (motivo) {
        selecao.descartadas_automaticamente.push({
          patrimonio: equipamento.patrimonio,
          pexels_id: foto.id,
          alt: foto.alt,
          motivo,
        });
        continue;
      }
      try {
        const downloadUrl = urlRecortada(foto.src.original);
        const buffer = await baixarJpeg(downloadUrl);
        writeFileSync(caminhoCache(equipamento.patrimonio), buffer);
        escolhida = {
          patrimonio: equipamento.patrimonio,
          nome: equipamento.nome,
          pexels_id: foto.id,
          alt: foto.alt ?? '',
          fotografo: foto.photographer,
          fotografo_url: foto.photographer_url,
          pagina_url: foto.url,
          download_url: downloadUrl,
          licenca: LICENCA,
          largura: 800,
          altura: 600,
          sha256: sha256(buffer),
          revisao: 'pendente',
        };
        break;
      } catch (erro) {
        selecao.descartadas_automaticamente.push({
          patrimonio: equipamento.patrimonio,
          pexels_id: foto.id,
          alt: foto.alt,
          motivo: `download/tamanho: ${erro.message}`,
        });
      }
    }
    if (!escolhida) {
      throw new Error(
        `${equipamento.patrimonio}: nenhuma candidata passou na triagem para "${equipamento.busca}".`,
      );
    }
    usados.add(escolhida.pexels_id);
    selecao.itens.push(escolhida);
    log(`${equipamento.patrimonio}: candidata Pexels ${escolhida.pexels_id} aguardando revisão.`);
  }

  escreverJson(ARQ_SELECAO, selecao);
  writeFileSync(`${CACHE}/revisao.html`, folhaDeRevisao(selecao), 'utf8');
  log(`Descartadas pela triagem automática: ${selecao.descartadas_automaticamente.length}.`);
  log(`Folha de revisão: ${CACHE}/revisao.html`);
  log('Próximo passo (pessoa, em terminal interativo): npm run imagens:revisar');
  return selecao;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  preparar({ chave: process.env.PEXELS_API_KEY }).catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
}
