import { useCallback, useEffect, useState } from 'react';

import { CreditoPexels } from '../components/CreditoPexels';
import {
  CATEGORIAS,
  ErroDaApi,
  SITUACOES,
  formatarData,
  listarEquipamentos,
  solicitarEmprestimo,
} from '../lib/api';
import type { Equipamento } from '../lib/api';

type Aviso = { tipo: 'sucesso' | 'erro'; texto: string } | null;

const ERRO_DE_CARGA = 'Não foi possível carregar o catálogo. Tente novamente.';

function rotuloDoBotao(equipamento: Equipamento): string {
  if (equipamento.comigo) {
    return 'Está com você';
  }
  if (equipamento.situacao === 'manutencao') {
    return 'Em manutenção';
  }
  if (equipamento.situacao === 'emprestado') {
    return 'Emprestado';
  }
  return 'Solicitar';
}

export function CatalogoPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[] | null>(null);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setEquipamentos(await listarEquipamentos());
      setErroDeCarga(null);
    } catch (erro) {
      setErroDeCarga(erro instanceof ErroDaApi && erro.status === 401 ? erro.message : ERRO_DE_CARGA);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function confirmar(equipamento: Equipamento) {
    setEnviando(equipamento.id);
    setAviso(null);
    try {
      const emprestimo = await solicitarEmprestimo(equipamento.id);
      setAviso({
        tipo: 'sucesso',
        texto: `Empréstimo registrado. Devolva até ${formatarData(emprestimo.devolucaoPrevista)}.`,
      });
    } catch (erro) {
      setAviso({
        tipo: 'erro',
        texto: erro instanceof ErroDaApi ? erro.message : 'Não foi possível concluir agora. Tente novamente.',
      });
    } finally {
      setConfirmando(null);
      setEnviando(null);
      await carregar();
    }
  }

  const disponiveis = equipamentos?.filter((e) => e.situacao === 'disponivel').length ?? 0;

  return (
    <main className="protected-page catalogo">
      <header className="protected-page__header">
        <div>
          <p className="eyebrow">Equipamentos internos</p>
          <h1>Catálogo</h1>
          {equipamentos && (
            <p className="page-lead">
              {disponiveis} de {equipamentos.length} equipamentos disponíveis agora
            </p>
          )}
        </div>
      </header>

      <div className="avisos">
        <div role="status" aria-live="polite">
          {aviso?.tipo === 'sucesso' && <p className="aviso aviso--sucesso">{aviso.texto}</p>}
        </div>
        <div role="alert">
          {aviso?.tipo === 'erro' && <p className="aviso aviso--erro">{aviso.texto}</p>}
          {erroDeCarga && <p className="aviso aviso--erro">{erroDeCarga}</p>}
        </div>
      </div>

      {!equipamentos && !erroDeCarga && (
        <p className="carregando" aria-busy="true">
          Carregando equipamentos...
        </p>
      )}

      {equipamentos && (
        <ul className="catalogo-grade" aria-label="Equipamentos">
          {equipamentos.map((equipamento) => {
            const podeSolicitar = equipamento.situacao === 'disponivel';
            const estaConfirmando = confirmando === equipamento.id;
            const estaEnviando = enviando === equipamento.id;
            return (
              <li className="equipamento-card" key={equipamento.id}>
                <img
                  className="equipamento-card__foto"
                  src={equipamento.imagemUrl}
                  width={800}
                  height={600}
                  loading="lazy"
                  alt={equipamento.nome}
                  title={`Foto de ${equipamento.foto.fotografo} no Pexels`}
                />
                <div className="equipamento-card__corpo">
                  <div className="equipamento-card__topo">
                    <p className="equipamento-card__categoria">
                      {CATEGORIAS[equipamento.categoria] ?? equipamento.categoria}
                    </p>
                    <span className={`pill pill--${equipamento.situacao}`}>
                      {SITUACOES[equipamento.situacao]}
                    </span>
                  </div>
                  <h2 className="equipamento-card__nome">{equipamento.nome}</h2>
                  <p className="equipamento-card__patrimonio">{equipamento.patrimonio}</p>

                  {estaConfirmando ? (
                    <div className="equipamento-card__confirmacao">
                      <button
                        className="botao botao--primario"
                        type="button"
                        disabled={estaEnviando}
                        onClick={() => void confirmar(equipamento)}
                      >
                        {estaEnviando ? 'Solicitando...' : 'Confirmar'}
                      </button>
                      <button
                        className="botao"
                        type="button"
                        disabled={estaEnviando}
                        onClick={() => setConfirmando(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`botao${podeSolicitar ? ' botao--primario' : ''}`}
                      type="button"
                      disabled={!podeSolicitar || enviando !== null}
                      onClick={() => {
                        setAviso(null);
                        setConfirmando(equipamento.id);
                      }}
                    >
                      {rotuloDoBotao(equipamento)}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CreditoPexels />
    </main>
  );
}
