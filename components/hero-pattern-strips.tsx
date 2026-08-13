// Dos tiras decorativas para los hero navy — construcción arriba,
// financiamiento abajo. Cada una repite solo horizontalmente (bg-repeat-x),
// nunca como grilla — evita el efecto "papel tapiz" de un único patrón
// repetido en las dos direcciones.
export function HeroPatternStrips() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-repeat-x"
        style={{ backgroundImage: "url('/patterns/strip-construccion.svg')", backgroundSize: "320px 64px" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-repeat-x"
        style={{ backgroundImage: "url('/patterns/strip-financiamiento.svg')", backgroundSize: "320px 64px" }}
      />
    </>
  );
}
