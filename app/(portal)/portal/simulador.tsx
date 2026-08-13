"use client";

import { useMemo, useState } from "react";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLAZOS = [12, 18, 24, 36, 48, 60];

type Nivel = { id: string; nombre_nivel: string; score_min: number; score_max: number; tasa_interes: number };

export function Simulador({ niveles }: { niveles: Nivel[] }) {
  const [monto, setMonto] = useState("5000");
  const [nivelId, setNivelId] = useState(niveles[0]?.id ?? "");
  const [plazo, setPlazo] = useState("24");

  const nivel = niveles.find((n) => n.id === nivelId);
  const montoNum = Number(monto) || 0;

  const resultado = useMemo(() => {
    if (!nivel || montoNum <= 0) return null;
    const downpayment = Math.round(montoNum * 0.5 * 100) / 100;
    const financiado = Math.round((montoNum - downpayment) * 100) / 100;
    const cronograma = generarCronograma(financiado, nivel.tasa_interes, Number(plazo), new Date());
    return { downpayment, financiado, cuotaMensual: cronograma[0]?.monto ?? 0 };
  }, [nivel, montoNum, plazo]);

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
            <Select name="sim_nivel" value={nivelId} onValueChange={(v) => v && setNivelId(v)}>
              <SelectTrigger id="sim_nivel" className="w-full">
                <SelectValue>{() => nivel ? `${nivel.nombre_nivel} (${nivel.score_min}–${nivel.score_max})` : "Elige un nivel"}</SelectValue>
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
            <Label htmlFor="sim_plazo">Plazo</Label>
            <Select name="sim_plazo" value={plazo} onValueChange={(v) => v && setPlazo(v)}>
              <SelectTrigger id="sim_plazo" className="w-full">
                <SelectValue>{(v: string | null) => `${v ?? plazo} meses`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PLAZOS.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p} meses
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {resultado && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p>Downpayment inicial (50%): <b>${resultado.downpayment.toFixed(2)}</b></p>
            <p>Monto a financiar: <b>${resultado.financiado.toFixed(2)}</b></p>
            <p>Cuota mensual estimada: <b>${resultado.cuotaMensual.toFixed(2)}</b> × {plazo} meses</p>
          </div>
        )}
        {niveles.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay niveles de score configurados.</p>
        )}
      </CardContent>
    </Card>
  );
}
