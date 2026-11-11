#!/usr/bin/env node
// Spec 002 — popula equipamentos, fotos e a conta do professor. Idempotente.
//
// Local (padrão):  npm run dados:popular
// Produção:        npm run dados:popular:producao   (só uma pessoa, com TTY)
//
// A senha do professor NUNCA fica neste arquivo (spec 002, conflito C2): vem de
// SENHA_PROFESSOR (.env.producao, fora do Git) ou é digitada no terminal.
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

import { enviarImagens } from '../../skills/imagens-equipamentos/scripts/enviar.mjs';
import {
  ARQ_CREDITOS,
  ARQ_EQUIPAMENTOS,
  cabecalhosAdmin,
  configDestino,
  lerJson,
  nomeObjeto,
} from '../../skills/imagens-equipamentos/scripts/lib.mjs';

export const EMAIL_PROFESSOR = 'marcelo.grilo@institutojef.org.br';
export const NOME_PROFESSOR = 'Marcelo Grilo';

async function requisitar(config, caminho, init = {}) {
  const resposta = await fetch(`${config.url}${caminho}`, {
    ...init,
    headers: cabecalhosAdmin(config, {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    }),
  });
  const texto = await resposta.text();
  if (!resposta.ok) {
    throw new Error(`${init.method ?? 'GET'} ${caminho} → ${resposta.status} ${texto}`);
  }
  return texto ? JSON.parse(texto) : null;
}

function linhaDoEquipamento(equipamento, credito) {
  return {
    patrimonio: equipamento.patrimonio,
    nome: equipamento.nome,
    categoria: equipamento.categoria,
    imagem_path: nomeObjeto(equipamento.patrimonio),
    foto_pexels_id: credito.pexels_id,
    foto_fotografo: credito.fotografo,
    foto_fotografo_url: credito.fotografo_url,
    foto_pagina_url: credito.pagina_url,
    foto_licenca: credito.licenca,
    atualizado_em: new Date().toISOString(),
  };
}

export async function gravarEquipamentos(config, equipamentos, creditos) {
  const existentes = await requisitar(config, '/rest/v1/equipamentos?select=patrimonio');
  const jaExiste = new Set(existentes.map((e) => e.patrimonio));
  let criados = 0;
  let atualizados = 0;

  for (const equipamento of equipamentos) {
    const credito = creditos.find((c) => c.patrimonio === equipamento.patrimonio);
    const linha = linhaDoEquipamento(equipamento, credito);
    if (jaExiste.has(equipamento.patrimonio)) {
      // Lacuna L2: a situação só é gravada na criação.
      await requisitar(
        config,
        `/rest/v1/equipamentos?patrimonio=eq.${encodeURIComponent(equipamento.patrimonio)}`,
        { method: 'PATCH', body: JSON.stringify(linha), headers: { Prefer: 'return=minimal' } },
      );
      atualizados += 1;
    } else {
      await requisitar(config, '/rest/v1/equipamentos', {
        method: 'POST',
        body: JSON.stringify({ ...linha, situacao: equipamento.situacao }),
        headers: { Prefer: 'return=minimal' },
      });
      criados += 1;
    }
  }
  return { criados, atualizados };
}

async function procurarUsuario(config, email) {
  for (let pagina = 1; pagina <= 50; pagina += 1) {
    const corpo = await requisitar(config, `/auth/v1/admin/users?page=${pagina}&per_page=200`);
    const usuarios = corpo?.users ?? [];
    const achado = usuarios.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (achado) {
      return achado;
    }
    if (usuarios.length < 200) {
      return null;
    }
  }
  return null;
}

export async function garantirProfessor(config, senha) {
  const dados = {
    email: EMAIL_PROFESSOR,
    password: senha,
    email_confirm: true,
    app_metadata: { role: 'colaborador' },
    user_metadata: { full_name: NOME_PROFESSOR },
  };
  const existente = await procurarUsuario(config, EMAIL_PROFESSOR);
  if (existente) {
    await requisitar(config, `/auth/v1/admin/users/${existente.id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
    return { id: existente.id, criado: false };
  }
  const criado = await requisitar(config, '/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  return { id: criado.id, criado: true };
}

export async function popular(
  config,
  {
    senhaProfessor,
    equipamentos = lerJson(ARQ_EQUIPAMENTOS, []),
    creditos = lerJson(ARQ_CREDITOS, []),
    obterImagem,
    log = console.log,
  } = {},
) {
  if (equipamentos.length !== 12) {
    throw new Error(`Esperados 12 equipamentos, encontrados ${equipamentos.length}.`);
  }
  const opcoesEnvio = { creditos, equipamentos, log };
  if (obterImagem) {
    opcoesEnvio.obterImagem = obterImagem;
  }
  await enviarImagens(config, opcoesEnvio);
  const resultado = await gravarEquipamentos(config, equipamentos, creditos);
  log(`Equipamentos: ${resultado.criados} criados, ${resultado.atualizados} atualizados.`);

  if (senhaProfessor) {
    const professor = await garantirProfessor(config, senhaProfessor);
    log(`Conta do professor ${professor.criado ? 'criada' : 'atualizada'} (${EMAIL_PROFESSOR}).`);
    resultado.professor = professor;
  } else {
    log('SENHA_PROFESSOR não definida: conta do professor não foi criada nem alterada.');
  }
  return resultado;
}

async function senhaDoProfessor(alvo) {
  if (process.env.SENHA_PROFESSOR) {
    return process.env.SENHA_PROFESSOR;
  }
  if (alvo === 'producao' && process.stdin.isTTY) {
    const leitor = createInterface({ input: process.stdin, output: process.stdout });
    const senha = await leitor.question('Senha padrão da turma para a conta do professor: ');
    leitor.close();
    return senha.trim();
  }
  return '';
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  (async () => {
    const config = await configDestino();
    const senhaProfessor = await senhaDoProfessor(config.alvo);
    if (config.alvo === 'producao' && !senhaProfessor) {
      throw new Error('Senha do professor vazia. Nada foi feito.');
    }
    await popular(config, { senhaProfessor });
  })().catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
}
