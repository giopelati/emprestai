#!/usr/bin/env node
// Passo 3 da skill: envia ao bucket público `equipamentos` somente imagens
// aprovadas na revisão humana, uma por patrimônio, com upsert (repetir não
// duplica). Confere 800×600 antes de enviar e de novo pela URL pública.
//
// Local (padrão):  npm run imagens:enviar
// Produção:        npm run imagens:enviar:producao   (só uma pessoa, com TTY)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  ARQ_CREDITOS,
  ARQ_EQUIPAMENTOS,
  BUCKET,
  baixarJpeg,
  cabecalhosAdmin,
  caminhoCache,
  configDestino,
  exigirTamanho,
  lerJson,
  nomeObjeto,
  urlPublica,
} from './lib.mjs';

export function validarCreditos(creditos, equipamentos) {
  const erros = [];
  const ids = new Set();
  for (const equipamento of equipamentos) {
    const credito = creditos.find((c) => c.patrimonio === equipamento.patrimonio);
    if (!credito) {
      erros.push(`${equipamento.patrimonio}: sem imagem aprovada na revisão humana.`);
      continue;
    }
    if (!credito.revisado_por || !credito.revisado_em) {
      erros.push(`${equipamento.patrimonio}: crédito sem registro de revisão humana.`);
    }
    for (const campo of ['pexels_id', 'fotografo', 'fotografo_url', 'pagina_url', 'licenca', 'download_url']) {
      if (!credito[campo]) {
        erros.push(`${equipamento.patrimonio}: crédito sem ${campo}.`);
      }
    }
    if (ids.has(credito.pexels_id)) {
      erros.push(`${equipamento.patrimonio}: foto Pexels ${credito.pexels_id} repetida.`);
    }
    ids.add(credito.pexels_id);
  }
  if (erros.length > 0) {
    throw new Error(`Envio recusado:\n- ${erros.join('\n- ')}`);
  }
}

async function obterImagemPadrao(credito) {
  const arquivo = caminhoCache(credito.patrimonio);
  if (existsSync(arquivo)) {
    return readFileSync(arquivo);
  }
  const buffer = await baixarJpeg(credito.download_url);
  writeFileSync(arquivo, buffer);
  return buffer;
}

export async function enviarImagens(
  config,
  {
    creditos = lerJson(ARQ_CREDITOS, []),
    equipamentos = lerJson(ARQ_EQUIPAMENTOS, []),
    obterImagem = obterImagemPadrao,
    log = console.log,
  } = {},
) {
  validarCreditos(creditos, equipamentos);
  const enviados = [];
  for (const equipamento of equipamentos) {
    const credito = creditos.find((c) => c.patrimonio === equipamento.patrimonio);
    const buffer = await obterImagem(credito);
    exigirTamanho(buffer, `${credito.patrimonio}.jpg`);

    const destino = `${config.url}/storage/v1/object/${BUCKET}/${nomeObjeto(credito.patrimonio)}`;
    const resposta = await fetch(destino, {
      method: 'POST',
      headers: cabecalhosAdmin(config, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'max-age=3600',
        'x-upsert': 'true',
      }),
      body: buffer,
    });
    if (!resposta.ok) {
      throw new Error(
        `${credito.patrimonio}: upload falhou (${resposta.status}) ${await resposta.text()}`,
      );
    }

    // Confere como o professor vai ver: URL pública, sem nenhuma credencial.
    const publica = urlPublica(config, credito.patrimonio);
    const conferencia = await fetch(publica);
    if (!conferencia.ok) {
      throw new Error(`${credito.patrimonio}: URL pública não abriu (${conferencia.status}).`);
    }
    exigirTamanho(Buffer.from(await conferencia.arrayBuffer()), publica);
    enviados.push({ patrimonio: credito.patrimonio, url: publica });
    log(`${credito.patrimonio}: enviada e conferida (800×600, pública).`);
  }
  return enviados;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  configDestino()
    .then((config) => enviarImagens(config))
    .catch((erro) => {
      console.error(erro.message);
      process.exit(1);
    });
}
