// Executar na página aberta no navegador. Não instala nada, não acessa a rede e
// não altera a tela.

// Confere rolagem vertical da página e das colunas, rolagem horizontal da página
// e se cada elemento exigido está inteiro dentro da janela.
window.medirTela = function medirTela({ colunas = [], elementos = [] } = {}) {
  const pagina = document.documentElement;
  const falhas = [];

  const medir = (nome, el) => {
    if (!el) {
      falhas.push(`${nome}: não encontrado`);
      return { nome, ausente: true };
    }
    if (el.scrollHeight > el.clientHeight) {
      falhas.push(`${nome}: rolagem vertical (${el.scrollHeight} > ${el.clientHeight})`);
    }
    return { nome, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  };

  const rolagem = [
    medir('página', pagina),
    ...colunas.map((seletor) => medir(seletor, document.querySelector(seletor))),
  ];

  // Só a página conta na horizontal: decoração cortada por overflow em uma coluna
  // não cria rolagem para quem usa a tela.
  if (pagina.scrollWidth > pagina.clientWidth) {
    falhas.push(`página: rolagem horizontal (${pagina.scrollWidth} > ${pagina.clientWidth})`);
  }

  for (const seletor of elementos) {
    const el = document.querySelector(seletor);
    if (!el) {
      falhas.push(`${seletor}: não encontrado`);
      continue;
    }
    const r = el.getBoundingClientRect();
    const dentro =
      r.height > 0 && r.top >= 0 && r.left >= 0 &&
      r.bottom <= window.innerHeight + 0.5 && r.right <= window.innerWidth + 0.5;
    if (!dentro) {
      falhas.push(`${seletor}: fora da janela (topo ${Math.round(r.top)}, base ${Math.round(r.bottom)})`);
    }
  }

  return {
    ok: falhas.length === 0,
    janela: `${window.innerWidth}x${window.innerHeight}`,
    rolagem,
    falhas,
  };
};

// Confere o elemento focado. Termina as transições antes de ler o estilo, porque
// durante a transição o elemento ainda parece sem destaque.
window.conferirFoco = function conferirFoco() {
  const el = document.activeElement;
  if (!el || el === document.body) {
    return { ok: false, motivo: 'nenhum elemento focado' };
  }
  el.getAnimations().forEach((animacao) => animacao.finish());

  const estilo = getComputedStyle(el);
  const contorno = estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0;
  const anel = estilo.boxShadow !== 'none' && !/0px 0px 0px 0px/.test(estilo.boxShadow);
  const peloTeclado = el.matches(':focus-visible');

  return {
    ok: peloTeclado && (contorno || anel),
    elemento: el.id || el.textContent.trim(),
    peloTeclado,
    janelaEmFoco: document.hasFocus(),
    contorno: contorno ? `${estilo.outlineStyle} ${estilo.outlineWidth} ${estilo.outlineColor}` : null,
    anel: anel ? estilo.boxShadow : null,
  };
};
