#!/usr/bin/env node
// Passo 1 da skill: busca no Openverse (só fotos do Flickr, conflito C5 da
// spec 002), descarta o que a triagem automática já reprova, baixa em 800×600
// (conferido por código) e monta a folha de revisão.
// Não envia nada a lugar nenhum. Uso: npm run imagens:preparar
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ARQ_CREDITOS,
  ARQ_EQUIPAMENTOS,
  ARQ_REJEITADAS,
  ARQ_SELECAO,
  CACHE,
  LICENCAS_ACEITAS,
  baixarJpeg,
  caminhoCache,
  exigirTamanho,
  escreverJson,
  idFlickr,
  lerJson,
  motivoAutomatico,
  sha256,
  textoLicenca,
  urlTamanho800,
} from './lib.mjs';

const API = 'https://api.openverse.org/v1/images/';
const POR_PAGINA = 20; // máximo sem chave
const PAGINAS = 2;
const TENTATIVAS = 3;
const CANDIDATAS = 6;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Termo da lista e, se ele não der candidata, o mesmo termo sem as últimas
// palavras ("usb cable white background" → "usb cable white" → "usb cable").
export function termosDeBusca(busca) {
  const palavras = String(busca).trim().split(/\s+/);
  const termos = [];
  for (let n = palavras.length; n >= Math.min(2, palavras.length); n -= 1) {
    termos.push(palavras.slice(0, n).join(' '));
  }
  return termos;
}

async function buscar(termo, pagina) {
  const url = new URL(API);
  url.searchParams.set('q', termo);
  url.searchParams.set('source', 'flickr');
  url.searchParams.set('license', LICENCAS_ACEITAS.join(','));
  url.searchParams.set('aspect_ratio', 'wide');
  url.searchParams.set('page_size', String(POR_PAGINA));
  url.searchParams.set('page', String(pagina));
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa += 1) {
    let resposta;
    try {
      resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (erro) {
      if (tentativa === TENTATIVAS) throw erro;
      await esperar(3000);
      continue;
    }
    if (resposta.status === 429) {
      throw new Error('Limite de requisições do Openverse atingido. Tente mais tarde.');
    }
    if (resposta.ok) {
      return (await resposta.json()).results ?? [];
    }
    // 400/404 aparecem quando a página passa do fim dos resultados.
    if (resposta.status === 400 || resposta.status === 404) {
      return [];
    }
    if (tentativa === TENTATIVAS) {
      throw new Error(`Busca no Openverse falhou (${resposta.status}) para "${termo}".`);
    }
    await esperar(3000);
  }
  return [];
}

// Só fotos 4:3 deitadas (o tamanho _c sai 800×600), com autor identificado.
function utilizavel(foto) {
  return (
    foto.width > 0 &&
    foto.width * 3 === foto.height * 4 &&
    !foto.mature &&
    foto.creator &&
    foto.creator_url &&
    idFlickr(foto.foreign_landing_url)
  );
}

function textoParaTriagem(foto) {
  const tags = (foto.tags ?? []).map((t) => t.name).join(' ');
  return `${foto.title ?? ''} ${tags}`;
}

function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function folhaDeRevisao(selecao) {
  const blocos = selecao.itens
    .map((item) => {
      const cartoes = item.candidatas
        .map(
          (c, i) => `<figure>
    <img src="./${c.arquivo}" width="400" height="300" alt="">
    <figcaption><strong>${i + 1}</strong> · Flickr ${c.foto_id} · ${escaparHtml(c.fotografo)} · ${escaparHtml(c.licenca.split(' — ')[0])}<br>
    <em>${escaparHtml(c.titulo || '(sem título)')}</em></figcaption>
  </figure>`,
        )
        .join('\n');
      return `<section>
  <h2>${escaparHtml(item.patrimonio)} · ${escaparHtml(item.nome)} — ${item.revisao}</h2>
  <div class="grade">
  ${cartoes}
  </div>
</section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><title>Revisão das imagens</title>
<style>
body{font-family:system-ui,sans-serif;background:#161826;color:#e9e9ed;margin:24px}
.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
section{margin-bottom:32px}
figure{margin:0;background:#232532;padding:10px;border-radius:8px}
img{width:100%;height:auto;display:block;border-radius:4px}
figcaption{font-size:13px;line-height:1.5;margin-top:6px}
</style>
<h1>Revisão visual — escolha, para cada equipamento, uma foto que mostre o equipamento sem pessoa (nem parte dela), marca ou logo legível, texto, ou tela com conteúdo</h1>
<p>Depois de olhar, rode <code>npm run imagens:revisar</code> em um terminal e digite o número escolhido (0 se nenhuma serve).</p>
${blocos}
</html>
`;
}

// Junta até CANDIDATAS fotos por equipamento para a pessoa escolher uma.
async function buscarCandidatas(equipamento, usados, rejeitados, descartadas) {
  const candidatas = [];
  for (const termo of termosDeBusca(equipamento.busca)) {
    for (let pagina = 1; pagina <= PAGINAS; pagina += 1) {
      const fotos = await buscar(termo, pagina);
      for (const foto of fotos.filter(utilizavel)) {
        const fotoId = idFlickr(foto.foreign_landing_url);
        if (usados.has(fotoId) || rejeitados.has(fotoId)) {
          continue;
        }
        const motivo = motivoAutomatico(textoParaTriagem(foto));
        if (motivo) {
          descartadas.push({ patrimonio: equipamento.patrimonio, foto_id: fotoId, titulo: foto.title, motivo });
          continue;
        }
        try {
          const downloadUrl = urlTamanho800(foto.url);
          const licenca = textoLicenca(foto);
          const buffer = await baixarJpeg(downloadUrl);
          const arquivo = `${equipamento.patrimonio}-${candidatas.length + 1}.jpg`;
          writeFileSync(join(CACHE, arquivo), buffer);
          usados.add(fotoId);
          candidatas.push({
            patrimonio: equipamento.patrimonio,
            foto_id: fotoId,
            titulo: foto.title ?? '',
            fotografo: foto.creator,
            fotografo_url: foto.creator_url,
            pagina_url: foto.foreign_landing_url,
            download_url: downloadUrl,
            licenca,
            largura: 800,
            altura: 600,
            sha256: sha256(buffer),
            arquivo,
          });
          if (candidatas.length === CANDIDATAS) {
            return candidatas;
          }
        } catch (erro) {
          descartadas.push({
            patrimonio: equipamento.patrimonio,
            foto_id: fotoId,
            titulo: foto.title,
            motivo: `download/tamanho/licença: ${erro.message}`,
          });
        }
      }
      if (fotos.length < POR_PAGINA) break;
    }
  }
  return candidatas;
}

export async function preparar({ log = console.log } = {}) {
  const equipamentos = lerJson(ARQ_EQUIPAMENTOS, []);
  const aprovadas = lerJson(ARQ_CREDITOS, []);
  const rejeitadas = lerJson(ARQ_REJEITADAS, []);
  const rejeitados = new Set(rejeitadas.map((r) => r.foto_id));
  const usados = new Set(aprovadas.map((a) => a.foto_id));
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
      selecao.itens.push({
        patrimonio: equipamento.patrimonio,
        nome: equipamento.nome,
        revisao: 'aprovada',
        candidatas: [{ ...aprovada, arquivo: `${equipamento.patrimonio}.jpg` }],
      });
      log(`${equipamento.patrimonio}: já aprovada (Flickr ${aprovada.foto_id}).`);
      continue;
    }

    const candidatas = await buscarCandidatas(
      equipamento,
      usados,
      rejeitados,
      selecao.descartadas_automaticamente,
    );
    if (candidatas.length === 0) {
      throw new Error(
        `${equipamento.patrimonio}: nenhuma candidata passou na triagem para "${equipamento.busca}".`,
      );
    }
    selecao.itens.push({
      patrimonio: equipamento.patrimonio,
      nome: equipamento.nome,
      revisao: 'pendente',
      candidatas,
    });
    log(`${equipamento.patrimonio}: ${candidatas.length} candidata(s) aguardando revisão.`);
  }

  escreverJson(ARQ_SELECAO, selecao);
  writeFileSync(`${CACHE}/revisao.html`, folhaDeRevisao(selecao), 'utf8');
  log(`Descartadas pela triagem automática: ${selecao.descartadas_automaticamente.length}.`);
  log(`Folha de revisão: ${CACHE}/revisao.html`);
  log('Próximo passo (pessoa, em terminal interativo): npm run imagens:revisar');
  return selecao;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  preparar().catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
}
