import { getSupabaseClient } from './supabase';

// Contrato da API do backend (spec 003). O frontend não fala com as tabelas:
// só com o Nest, levando o token da sessão do Supabase Auth.

export type Situacao = 'disponivel' | 'emprestado' | 'manutencao';

export interface Equipamento {
  id: string;
  patrimonio: string;
  nome: string;
  categoria: string;
  situacao: Situacao;
  comigo: boolean;
  imagemUrl: string;
  foto: {
    fotografo: string;
    fotografoUrl: string;
    paginaUrl: string;
    licenca: string;
  };
}

export interface EmprestimoCriado {
  id: string;
  equipamentoId: string;
  retiradoEm: string;
  devolucaoPrevista: string;
}

export interface MeuEmprestimo {
  id: string;
  retiradoEm: string;
  devolucaoPrevista: string;
  atrasado: boolean;
  equipamento: {
    id: string;
    patrimonio: string;
    nome: string;
    categoria: string;
    imagemUrl: string;
    fotografo: string;
    licenca: string;
  };
}

export interface MeusEmprestimos {
  limite: number;
  prazoEmDias: number;
  emprestimos: MeuEmprestimo[];
}

export class ErroDaApi extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
    this.name = 'ErroDaApi';
  }
}

const MENSAGEM_GENERICA = 'Não foi possível concluir agora. Tente novamente.';

async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
  if (!base) {
    throw new ErroDaApi('CONFIGURACAO_AUSENTE', MENSAGEM_GENERICA, 0);
  }

  const { data } = await getSupabaseClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ErroDaApi('NAO_AUTENTICADO', 'Sua sessão expirou. Entre novamente.', 401);
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${base}${caminho}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ErroDaApi('REDE', MENSAGEM_GENERICA, 0);
  }

  const corpo: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const { codigo, mensagem } = (corpo ?? {}) as { codigo?: string; mensagem?: string };
    throw new ErroDaApi(codigo ?? 'ERRO', mensagem ?? MENSAGEM_GENERICA, resposta.status);
  }
  return corpo as T;
}

export function listarEquipamentos(): Promise<Equipamento[]> {
  return requisitar('/equipamentos');
}

export function solicitarEmprestimo(equipamentoId: string): Promise<EmprestimoCriado> {
  return requisitar('/emprestimos', {
    method: 'POST',
    body: JSON.stringify({ equipamentoId }),
  });
}

export function listarMeusEmprestimos(): Promise<MeusEmprestimos> {
  return requisitar('/emprestimos/meus');
}

// "2026-11-24" → "24/11/2026", sem passar por fuso horário.
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export const CATEGORIAS: Record<string, string> = {
  notebook: 'Notebook',
  monitor: 'Monitor',
  cabo: 'Cabo',
  camera: 'Câmera',
};

export const SITUACOES: Record<Situacao, string> = {
  disponivel: 'Disponível',
  emprestado: 'Emprestado',
  manutencao: 'Em manutenção',
};
