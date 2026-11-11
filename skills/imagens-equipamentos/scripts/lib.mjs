// Funções comuns da skill imagens-equipamentos. Sem dependências externas:
// só Node (fetch, crypto, fs) — rules/restrictions.md e ADR-001.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
export const DADOS = join(RAIZ, 'supabase', 'dados');
export const ARQ_EQUIPAMENTOS = join(DADOS, 'equipamentos.json');
export const ARQ_CREDITOS = join(DADOS, 'creditos-imagens.json');
export const ARQ_REJEITADAS = join(DADOS, 'imagens-rejeitadas.json');
export const CACHE = join(RAIZ, '.cache', 'imagens-equipamentos');
export const ARQ_SELECAO = join(CACHE, 'selecao.json');

export const LARGURA = 800;
export const ALTURA = 600;
export const BUCKET = 'equipamentos';

export function lerJson(caminho, padrao) {
  if (!existsSync(caminho)) {
    return padrao;
  }
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

export function escreverJson(caminho, dados) {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, `${JSON.stringify(dados, null, 2)}\n`, 'utf8');
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function caminhoCache(patrimonio) {
  return join(CACHE, `${patrimonio}.jpg`);
}

export function nomeObjeto(patrimonio) {
  return `${patrimonio}.jpg`;
}

// Lê largura e altura do marcador SOF de um JPEG. Devolve null se não for JPEG.
export function dimensoesJpeg(buffer) {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  let i = 2;
  while (i + 9 < buffer.length) {
    if (buffer[i] !== 0xff) {
      return null;
    }
    const marcador = buffer[i + 1];
    if (marcador === 0xd8 || (marcador >= 0xd0 && marcador <= 0xd7) || marcador === 0x01) {
      i += 2;
      continue;
    }
    const tamanho = buffer.readUInt16BE(i + 2);
    const ehSof =
      marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador);
    if (ehSof) {
      return { altura: buffer.readUInt16BE(i + 5), largura: buffer.readUInt16BE(i + 7) };
    }
    i += 2 + tamanho;
  }
  return null;
}

// Garante, por código, que a imagem é JPEG 800×600. Lança erro caso contrário.
export function exigirTamanho(buffer, origem) {
  const dimensoes = dimensoesJpeg(buffer);
  if (!dimensoes) {
    throw new Error(`${origem}: não é JPEG válido.`);
  }
  if (dimensoes.largura !== LARGURA || dimensoes.altura !== ALTURA) {
    throw new Error(
      `${origem}: ${dimensoes.largura}×${dimensoes.altura}, esperado ${LARGURA}×${ALTURA}.`,
    );
  }
  return dimensoes;
}

// Origem das fotos (spec 002, conflito C5): API do Openverse, só fotos do
// Flickr. O download é sempre do CDN do Flickr.
export const HOST_PERMITIDO = 'live.staticflickr.com';

// Nome curto e URL da licença, a partir dos campos do Openverse.
const NOMES_LICENCA = { cc0: 'CC0', pdm: 'Marca de Domínio Público', by: 'CC BY' };
export const LICENCAS_ACEITAS = Object.keys(NOMES_LICENCA);

export function textoLicenca(foto) {
  const nome = NOMES_LICENCA[foto.license];
  if (!nome || !foto.license_url) {
    throw new Error(`Licença não aceita: ${foto.license ?? '(vazia)'}.`);
  }
  const versao = foto.license_version ? ` ${foto.license_version}` : '';
  return `${nome}${versao} — ${foto.license_url}`;
}

// Id numérico da foto no Flickr, tirado da página da foto.
export function idFlickr(paginaUrl) {
  const achado = /flickr\.com\/photos\/[^/]+\/(\d+)/.exec(String(paginaUrl ?? ''));
  return achado ? Number(achado[1]) : null;
}

// O Flickr publica cada foto em tamanhos fixos. O sufixo `_c` tem 800 px no
// lado maior: numa foto 4:3 deitada, 800×600. O tamanho é conferido depois.
export function urlTamanho800(url) {
  const destino = new URL(url);
  if (destino.hostname !== HOST_PERMITIDO) {
    throw new Error(`Origem não permitida: ${destino.hostname}. Só ${HOST_PERMITIDO}.`);
  }
  const caminho = /^(\/\d+\/\d+_[0-9a-f]+)(_[a-z0-9])?\.jpg$/i.exec(destino.pathname);
  if (!caminho) {
    throw new Error(`URL do Flickr fora do padrão: ${url}`);
  }
  destino.pathname = `${caminho[1]}_c.jpg`;
  destino.search = '';
  return destino.toString();
}

export async function baixarJpeg(url) {
  const { hostname } = new URL(url);
  if (hostname !== HOST_PERMITIDO) {
    throw new Error(`Origem não permitida: ${hostname}. Só ${HOST_PERMITIDO}.`);
  }
  const resposta = await fetch(url, { headers: { Accept: 'image/jpeg' } });
  if (!resposta.ok) {
    throw new Error(`Download falhou (${resposta.status}): ${url}`);
  }
  // O Flickr redireciona tamanho inexistente para uma imagem genérica.
  const final = new URL(resposta.url || url).hostname;
  if (final !== HOST_PERMITIDO) {
    throw new Error(`Origem não permitida após redirecionamento: ${final}.`);
  }
  const buffer = Buffer.from(await resposta.arrayBuffer());
  exigirTamanho(buffer, url);
  return buffer;
}

// Triagem automática pelo título e pelas tags da foto. Não substitui a
// revisão humana: só descarta cedo o que já se sabe que não pode entrar.
const PROIBIDAS = [
  ['pessoa', /\b(person|people|man|men|woman|women|girl|boy|child|kid|baby|hands?|fingers?|face|portrait|selfie|holding|typing|working|student|businessman|businesswoman|freelancer|someone|guy|lady|couple|team|employee)\b/i],
  ['marca ou logo', /\b(logo|brand|apple|macbook|imac|iphone|ipad|samsung|dell|lenovo|asus|acer|hp|sony|canon|nikon|fujifilm|fuji|panasonic|olympus|leica|logitech|microsoft|windows|google|lg|razer|msi|gopro|thinkpad|ibm|toshiba|vaio|powerbook|ricoh|kodak|pentax|philips|belkin|benq|viewsonic|eizo|compaq|gateway|polaroid)\b/i],
  ['texto ou tela com conteúdo', /\b(text|code|coding|website|webpage|browser|app|application|chart|graph|dashboard|document|spreadsheet|email|social media|video call|zoom|game|gaming|movie|sign|letters?|words?|quote|screenshot|wallpaper|linux|ubuntu)\b/i],
];

export function motivoAutomatico(alt) {
  const texto = String(alt ?? '');
  for (const [motivo, padrao] of PROIBIDAS) {
    if (padrao.test(texto)) {
      return motivo;
    }
  }
  return null;
}

// ---------- Destino (Supabase) ----------

function hostLocal(url) {
  const { hostname } = new URL(url);
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}

export function configLocal() {
  const saida = execSync('npx supabase status -o json', {
    cwd: RAIZ,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const status = JSON.parse(saida.slice(saida.indexOf('{')));
  const url = status.API_URL;
  const chave = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
  if (!url || !chave || !hostLocal(url)) {
    throw new Error('Supabase local não encontrado. Rode `npm run db:start`.');
  }
  return { alvo: 'local', url, chave };
}

// Produção só com uma pessoa no terminal: exige TTY e digitar a referência do
// projeto. O agente roda sem TTY e não tem PRODUCAO_SUPABASE_SECRET_KEY.
export async function configProducao() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Envio para produção exige uma pessoa no terminal (TTY). ' +
        'Agentes e scripts não interativos não podem executar este passo.',
    );
  }
  const url = process.env.PRODUCAO_SUPABASE_URL;
  const chave = process.env.PRODUCAO_SUPABASE_SECRET_KEY;
  if (!url || !chave) {
    throw new Error(
      'Defina PRODUCAO_SUPABASE_URL e PRODUCAO_SUPABASE_SECRET_KEY em .env.producao (fora do Git).',
    );
  }
  if (hostLocal(url)) {
    throw new Error('PRODUCAO_SUPABASE_URL aponta para o banco local.');
  }
  const referencia = new URL(url).hostname.split('.')[0];
  const leitor = createInterface({ input: process.stdin, output: process.stdout });
  const digitado = await leitor.question(
    `Você vai escrever no Supabase de PRODUÇÃO (${referencia}). Digite a referência do projeto para confirmar: `,
  );
  leitor.close();
  if (digitado.trim() !== referencia) {
    throw new Error('Confirmação não confere. Nada foi enviado.');
  }
  return { alvo: 'producao', url, chave };
}

export async function configDestino(argv = process.argv) {
  return argv.includes('--producao') ? configProducao() : configLocal();
}

export function cabecalhosAdmin(config, extra = {}) {
  return {
    apikey: config.chave,
    Authorization: `Bearer ${config.chave}`,
    ...extra,
  };
}

export function urlPublica(config, patrimonio) {
  return `${config.url}/storage/v1/object/public/${BUCKET}/${nomeObjeto(patrimonio)}`;
}
