"use client";

import { useMemo, useState } from "react";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PLAZOS = [12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120];

type Nivel = { id: string; nombre_nivel: string; score_min: number; score_max: number; tasa_interes: number };

// Simulador del lado de admin: a partir del score consultado en Experian,
// sugiere la tasa según niveles_score, y muestra un cuadro por cada plazo
// que admin marque — así decide qué tasa/plazo usar antes de armar el
// contrato de verdad. El cliente no tiene acceso a esto.
export function SimuladorTasas({ montoSolicitado, niveles, scoreReal }: { montoSolicitado: number; niveles: Nivel[]; scoreReal: number | null }) {
  const nivelPorScore = scoreReal != null ? niveles.find((n) => scoreReal >= n.score_min && scoreReal <= n.score_max) : undefined;

  const [tasa, setTasa] = useState(String(nivelPorScore?.tasa_interes ?? niveles[0]?.tasa_interes ?? ""));
  const [plazosElegidos, setPlazosElegidos] = useState<number[]>([]);

  const tasaNum = Number(tasa) || 0;
  const downpayment = Math.round(montoSolicitado * 0.5 * 100) / 100;
  const financiado = Math.round((montoSolicitado - downpayment) * 100) / 100;

  function togglePlazo(p: number) {
    setPlazosElegidos((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)));
  }

  const resultados = useMemo(() => {
    if (tasaNum <= 0 || financiado <= 0) return [];
    return plazosElegidos.map((p) => {
      const cronograma = generarCronograma(financiado, tasaNum, p, new Date());
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
      <CardContent className="space-y-4">
        {scoreReal != null && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Score consultado:</span> <b>{scoreReal}</b>
            {nivelPorScore ? (
              <Badge variant="outline">Nivel {nivelPorScore.nombre_nivel}</Badge>
            ) : (
              <span className="text-muted-foreground">(sin nivel configurado para este rango)</span>
            )}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Monto solicitado: <b className="text-foreground">${montoSolicitado.toFixed(2)}</b> · Downpayment (50%): $
          {downpayment.toFixed(2)} · A financiar: <b className="text-foreground">${financiado.toFixed(2)}</b>
        </p>

        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="sim_tasa">Tasa mensual a probar (%)</Label>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map((r) => (
              <div key={r.plazo} className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{r.plazo} cuotas</p>
                <p className="mt-1 text-muted-foreground">Monto financiado: ${financiado.toFixed(2)}</p>
                <p className="text-muted-foreground">Tasa: {tasaNum}% mensual</p>
                <p className="mt-1">
                  Cuota mensual: <b>${r.cuotaMensual.toFixed(2)}</b>
                </p>
                <p className="text-muted-foreground">Total en cuotas: ${r.totalCuotas.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
        {niveles.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay niveles de score configurados en Configuración.</p>
        )}
      </CardContent>
    </Card>
  );
}
