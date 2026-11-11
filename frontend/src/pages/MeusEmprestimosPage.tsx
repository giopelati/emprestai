import { useEffect, useState } from 'react';

import { CreditoPexels } from '../components/CreditoPexels';
import { ErroDaApi, formatarData, listarMeusEmprestimos } from '../lib/api';
import type { MeusEmprestimos } from '../lib/api';

interface MeusEmprestimosPageProps {
  onIrAoCatalogo: () => void;
}

export function MeusEmprestimosPage({ onIrAoCatalogo }: MeusEmprestimosPageProps) {
  const [dados, setDados] = useState<MeusEmprestimos | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    listarMeusEmprestimos()
      .then((resposta) => {
        if (ativo) {
          setDados(resposta);
        }
      })
      .catch((falha: unknown) => {
        if (ativo) {
          setErro(
            falha instanceof ErroDaApi && falha.status === 401
              ? falha.message
              : 'Não foi possível carregar seus empréstimos. Tente novamente.',
          );
        }
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <main className="protected-page meus-emprestimos">
      <header className="protected-page__header">
        <div>
          <p className="eyebrow">Equipamentos com você</p>
          <h1>Meus empréstimos</h1>
          {dados && (
            <p className="page-lead">
              {dados.emprestimos.length} de {dados.limite} itens em seu nome · prazo padrão de{' '}
              {dados.prazoEmDias} dias
            </p>
          )}
        </div>
      </header>

      <div role="alert">{erro && <p className="aviso aviso--erro">{erro}</p>}</div>

      {!dados && !erro && (
        <p className="carregando" aria-busy="true">
          Carregando empréstimos...
        </p>
      )}

      {dados && dados.emprestimos.length === 0 && (
        <section className="estado-vazio">
          <p>Você não está com nenhum equipamento.</p>
          <button className="botao botao--primario" type="button" onClick={onIrAoCatalogo}>
            Ir ao catálogo
          </button>
        </section>
      )}

      {dados && dados.emprestimos.length > 0 && (
        <>
          <ul className="emprestimos-lista" aria-label="Empréstimos em aberto">
            {dados.emprestimos.map((emprestimo) => (
              <li className="emprestimo-linha" key={emprestimo.id}>
                <img
                  className="emprestimo-linha__foto"
                  src={emprestimo.equipamento.imagemUrl}
                  width={800}
                  height={600}
                  alt={emprestimo.equipamento.nome}
                  title={`Foto de ${emprestimo.equipamento.fotografo} no Pexels`}
                />
                <div className="emprestimo-linha__item">
                  <h2>{emprestimo.equipamento.nome}</h2>
                  <p>{emprestimo.equipamento.patrimonio}</p>
                </div>
                <p className="emprestimo-linha__prazo">
                  Devolver até {formatarData(emprestimo.devolucaoPrevista)}
                </p>
                <span className={`pill ${emprestimo.atrasado ? 'pill--atraso' : 'pill--disponivel'}`}>
                  {emprestimo.atrasado ? 'Em atraso' : 'Em dia'}
                </span>
              </li>
            ))}
          </ul>
          <CreditoPexels />
        </>
      )}
    </main>
  );
}
