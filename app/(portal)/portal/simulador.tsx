"use client";

import { useMemo, useState } from "react";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLAZOS = [12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120];

type Nivel = { id: string; nombre_nivel: string; score_min: number; score_max: number; tasa_interes: number };

export function Simulador({ niveles }: { niveles: Nivel[] }) {
  const [monto, setMonto] = useState("5000");
  const [nivelId, setNivelId] = useState(niveles[0]?.id ?? "");
  const [tasa, setTasa] = useState(String(niveles[0]?.tasa_interes ?? ""));
  const [plazosElegidos, setPlazosElegidos] = useState<number[]>([24]);

  const nivel = niveles.find((n) => n.id === nivelId);
  const montoNum = Number(monto) || 0;
  const tasaNum = Number(tasa) || 0;

  function onNivelChange(id: string) {
    setNivelId(id);
    const n = niveles.find((x) => x.id === id);
    if (n) setTasa(String(n.tasa_interes));
  }

  function togglePlazo(p: number) {
    setPlazosElegidos((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)));
  }

  const downpayment = Math.round(montoNum * 0.5 * 100) / 100;
  const financiado = Math.round((montoNum - downpayment) * 100) / 100;

  const resultados = useMemo(() => {
    if (montoNum <= 0 || tasaNum <= 0) return [];
    return plazosElegidos.map((p) => {
      const cronograma = generarCronograma(financiado, tasaNum, p, new Date());
      const cuotaMensual = cronograma[0]?.monto ?? 0;
      const totalCuotas = Math.round(cronograma.reduce((s, c) => s + c.monto, 0) * 100) / 100;
      return { plazo: p, cuotaMensual, totalCuotas };
    });
  }, [plazosElegidos, financiado, tasaNum, montoNum]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Simula tu financiamiento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Esto es un <b>estimado</b>, no una aprobación — tu tasa real depende de tu score una vez que confirmemos tu
          identidad y evaluemos tu solicitud.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="sim_monto">Monto del proyecto (USD)</Label>
            <Input id="sim_monto" type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sim_nivel">Nivel de score estimado</Label>
            <Select name="sim_nivel" value={nivelId} onValueChange={(v) => v && onNivelChange(v)}>
              <SelectTrigger id="sim_nivel" className="w-full">
                <SelectValue>{() => (nivel ? `${nivel.nombre_nivel} (${nivel.score_min}–${nivel.score_max})` : "Elige un nivel")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {niveles.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.nombre_nivel} ({n.score_min}–{n.score_max})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sim_tasa">Tasa mensual (%)</Label>
            <Input id="sim_tasa" type="number" min="0" step="0.01" value={tasa} onChange={(e) => setTasa(e.target.value)} />
            <p className="text-xs text-muted-foreground">Se sugiere sola según el nivel — puedes editarla.</p>
          </div>
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

        {montoNum > 0 && (
          <p className="text-sm text-muted-foreground">
            Downpayment inicial (50%): <b className="text-foreground">${downpayment.toFixed(2)}</b> · Monto a
            financiar: <b className="text-foreground">${financiado.toFixed(2)}</b>
          </p>
        )}

        {resultados.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map((r) => (
              <div key={r.plazo} className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{r.plazo} meses</p>
                <p className="mt-1">
                  Cuota mensual: <b>${r.cuotaMensual.toFixed(2)}</b>
                </p>
                <p className="text-muted-foreground">Total en cuotas: ${r.totalCuotas.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
        {plazosElegidos.length === 0 && (
          <p className="text-sm text-muted-foreground">Marca al menos un plazo para ver la simulación.</p>
        )}
        {niveles.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay niveles de score configurados.</p>
        )}
      </CardContent>
    </Card>
  );
}
