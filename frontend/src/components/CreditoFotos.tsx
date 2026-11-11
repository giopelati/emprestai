// Spec 003, CA-02 / conflito C3 (e C5 da spec 002): único crédito visível.
// Fotógrafo e licença de cada foto ficam no atributo `title`.
export function CreditoFotos() {
  return (
    <p className="credito-fotos">
      <a href="https://openverse.org" target="_blank" rel="noreferrer">
        Fotos: Openverse
      </a>
    </p>
  );
}

export function tituloDaFoto(fotografo: string, licenca: string) {
  return `Foto de ${fotografo} · ${licenca.split(' — ')[0]}`;
}
