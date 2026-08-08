import "server-only";

// Adapter de Experian. Sin credenciales (EXPERIAN_CLIENT_ID sin definir)
// corre en modo mock — Paolo todavía está en conversaciones comerciales con
// Experian (ver docs/SPEC.md §1.3). Cuando haya API real, esta es la única
// función que hay que cambiar; nada del resto de la app conoce la
// diferencia.

export type ConsultaScoreInput = {
  nombre: string;
  ssnItn: string; // texto plano, ya descifrado por quien llama — no loguear
};

export type ConsultaScoreResultado = {
  score: number;
  ingresosMensuales: number;
  capacidadPago: number;
};

const MODO_MOCK = !process.env.EXPERIAN_CLIENT_ID;

export async function consultarScore(input: ConsultaScoreInput): Promise<ConsultaScoreResultado> {
  return MODO_MOCK ? consultarScoreMock(input) : consultarScoreReal(input);
}

// Determinístico por SSN (misma persona -> mismo resultado en la demo),
// pero NO es un cálculo real de riesgo crediticio.
async function consultarScoreMock(input: ConsultaScoreInput): Promise<ConsultaScoreResultado> {
  await new Promise((resolve) => setTimeout(resolve, 400)); // simula latencia de red

  const seed = [...input.ssnItn].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const score = 580 + (seed % 220); // 580–800
  const ingresosMensuales = 2500 + (seed % 15) * 300;
  const capacidadPago = Math.round(ingresosMensuales * 0.35);

  return { score, ingresosMensuales, capacidadPago };
}

async function consultarScoreReal(input: ConsultaScoreInput): Promise<ConsultaScoreResultado> {
  throw new Error(
    `Integración real de Experian todavía no configurada (falta EXPERIAN_CLIENT_ID/CLIENT_SECRET/API_URL en .env.local) — consulta para ${input.nombre}.`
  );
}
