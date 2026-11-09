"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLAZOS = [12, 18, 24, 36, 48, 60, 72, 84];

type Nivel = { id: string; nombre_nivel: string; score_min: number; score_max: number; tasa_interes: number };

// Simulador del lado de admin: a partir del score consultado en Experian,
// sugiere la tasa según niveles_score, y muestra un cuadro por cada plazo
// que admin marque — así decide qué tasa/plazo usar antes de armar el
// contrato de verdad. El cliente no tiene acceso a esto. La tarjeta elegida
// queda en la URL de esta misma página (?tasa=&cuotas=) — page.tsx (server)
// exige que existan esos dos valores para habilitar "Ir a contrato".
export function SimuladorTasas({ montoSolicitado, niveles, scoreReal }: { montoSolicitado: number; niveles: Nivel[]; scoreReal: number | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nivelPorScore = scoreReal != null ? niveles.find((n) => scoreReal >= n.score_min && scoreReal <= n.score_max) : undefined;

  const cuotasUrl = searchParams.get("cuotas");
  const tasaUrl = searchParams.get("tasa");

  const [tasa, setTasa] = useState(tasaUrl ?? String(nivelPorScore?.tasa_interes ?? niveles[0]?.tasa_interes ?? ""));
  const [plazosElegidos, setPlazosElegidos] = useState<number[]>(cuotasUrl ? [Number(cuotasUrl)] : []);
  const [seleccionado, setSeleccionado] = useState<number | null>(cuotasUrl ? Number(cuotasUrl) : null);

  const tasaNum = Number(tasa) || 0;
  const downpayment = Math.round(montoSolicitado * 0.5 * 100) / 100;
  const financiado = Math.round((montoSolicitado - downpayment) * 100) / 100;

  function limpiarSeleccionEnUrl() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tasa");
    params.delete("cuotas");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  }

  function togglePlazo(p: number) {
    setPlazosElegidos((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)));
    if (seleccionado === p) {
      setSeleccionado(null);
      limpiarSeleccionEnUrl();
    }
  }

  function seleccionarPlazo(plazo: number) {
    setSeleccionado(plazo);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tasa", String(tasaNum));
    params.set("cuotas", String(plazo));
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // tasaNum es ANUAL (mismo criterio que niveles_score.tasa_interes y
  // contrato.tasa_anual) — se divide entre 12 recién acá, para el cálculo.
  const resultados = useMemo(() => {
    if (tasaNum <= 0 || financiado <= 0) return [];
    return plazosElegidos.map((p) => {
      const cronograma = generarCronograma(financiado, tasaNum / 12, p, new Date());
      const cuotaMensual = cronograma[0]?.monto ?? 0;
      const totalCuotas = Math.round(cronograma.reduce((s, c) => s + c.monto, 0) * 100) / 100;
      return { plazo: p, cuotaMensual, totalCuotas };
    });
  }, [plazosElegidos, financiado, tasaNum]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Simulador de tasas y cuotas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {scoreReal != null && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Score consultado:</span> <b className="tabular-nums">{scoreReal}</b>
            {nivelPorScore ? (
              <Badge variant="outline">Nivel {nivelPorScore.nombre_nivel}</Badge>
            ) : (
              <span className="text-muted-foreground">(sin nivel configurado para este rango)</span>
            )}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm tabular-nums">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Solicitado</p>
            <p className="font-medium text-foreground">${montoSolicitado.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Downpayment (50%)</p>
            <p className="font-medium text-foreground">${downpayment.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">A financiar</p>
            <p className="font-medium text-[#D6AD58]">${financiado.toFixed(2)}</p>
          </div>
        </div>

        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="sim_tasa">Tasa anual a probar (%)</Label>
          <Input id="sim_tasa" type="number" min="0" step="0.01" value={tasa} onChange={(e) => setTasa(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            {nivelPorScore ? "Sugerida según el score consultado — puedes editarla." : "Sin score todavía — ingrésala a mano."}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Plazos a comparar</Label>
          <div className="flex flex-wrap gap-3">
            {PLAZOS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={plazosElegidos.includes(p)} onChange={() => togglePlazo(p)} />
                {p} meses
              </label>
            ))}
          </div>
        </div>

        {tasaNum <= 0 && plazosElegidos.length > 0 && (
          <p className="text-sm text-destructive">Ingresa una tasa mayor a 0 para ver la simulación.</p>
        )}

        {resultados.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Haz clic en un plazo para elegirlo — hace falta elegir uno para poder avanzar al contrato.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((r) => {
                const estaSeleccionada = seleccionado === r.plazo && Number(tasaUrl) === tasaNum;
                return (
                  <button
                    key={r.plazo}
                    type="button"
                    onClick={() => seleccionarPlazo(r.plazo)}
                    aria-pressed={estaSeleccionada}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      estaSeleccionada
                        ? "border-[#174EA6] bg-[#174EA6]"
                        : "border-border bg-card hover:border-[#174EA6]/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium tracking-wide uppercase ${estaSeleccionada ? "text-white/60" : "text-muted-foreground"}`}>
                        {r.plazo} cuotas
                      </p>
                      {estaSeleccionada && <Badge className="bg-[#D6AD58] text-[#1a1206]">Seleccionado</Badge>}
                    </div>
                    <p className={`mt-2 text-2xl font-semibold tabular-nums ${estaSeleccionada ? "text-white" : "text-foreground"}`}>
                      ${r.cuotaMensual.toFixed(2)}
                      <span className={`ml-1 text-xs font-normal ${estaSeleccionada ? "text-white/60" : "text-muted-foreground"}`}>/mes</span>
                    </p>
                    <div
                      className={`mt-3 space-y-1 border-t pt-2 text-xs tabular-nums ${
                        estaSeleccionada ? "border-white/15 text-white/70" : "border-border text-muted-foreground"
                      }`}
                    >
                      <p>Tasa: {tasaNum}% anual</p>
                      <p>Total en cuotas: ${r.totalCuotas.toFixed(2)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {niveles.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay niveles de score configurados en Configuración.</p>
        )}
      </CardContent>
    </Card>
  );
}
