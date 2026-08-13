"use client";

import { useActionState, useMemo, useState } from "react";
import { crearContrato } from "./actions";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CUOTAS = [12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120];

export function ContratoForm({
  clienteId,
  solicitudId,
  total,
  cuotasSugeridas,
  tasaSugerida,
}: {
  clienteId: string;
  solicitudId: string;
  total: number;
  cuotasSugeridas?: string | null;
  tasaSugerida?: string | null;
}) {
  const [state, action, pending] = useActionState(crearContrato.bind(null, { clienteId, solicitudId }), undefined);
  const [numeroCuotas, setNumeroCuotas] = useState(cuotasSugeridas && CUOTAS.includes(Number(cuotasSugeridas)) ? cuotasSugeridas : "12");
  const [tasaMensual, setTasaMensual] = useState(tasaSugerida ?? "");
  const [tilaAceptado, setTilaAceptado] = useState(false);

  const downpayment = Math.round(total * 0.5 * 100) / 100;
  const financiado = Math.round((total - downpayment) * 100) / 100;

  const disclosure = useMemo(() => {
    const tasa = Number(tasaMensual);
    const cuotas = Number(numeroCuotas);
    if (!tasa || tasa <= 0 || !cuotas) return null;
    const cronograma = generarCronograma(financiado, tasa, cuotas, new Date());
    const totalCuotas = cronograma.reduce((suma, c) => suma + c.monto, 0);
    const cargoFinanciero = Math.round((totalCuotas - financiado) * 100) / 100;
    return { cuotaMensual: cronograma[0]?.monto ?? 0, totalCuotas, cargoFinanciero, tasaAnualReferencial: Math.round(tasa * 12 * 100) / 100 };
  }, [tasaMensual, numeroCuotas, financiado]);

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Monto solicitado: ${total.toFixed(2)} · Downpayment (50%): ${downpayment.toFixed(2)} · A financiar: $
            {financiado.toFixed(2)}
          </p>
          {tasaSugerida && (
            <p className="text-sm text-muted-foreground">
              Tasa precargada según el score del cliente (o la simulación que elegiste) — puedes editarla.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="numero_cuotas">Número de cuotas</Label>
              <Select name="numero_cuotas" defaultValue={numeroCuotas} onValueChange={(v) => v && setNumeroCuotas(v)}>
                <SelectTrigger id="numero_cuotas" className="w-full">
                  <SelectValue>{(value: string | null) => value ?? numeroCuotas}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CUOTAS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tasa_mensual">Tasa mensual (%)</Label>
              <Input
                id="tasa_mensual"
                name="tasa_mensual"
                type="number"
                step="0.01"
                value={tasaMensual}
                onChange={(e) => setTasaMensual(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Disclosure — TILA (Truth in Lending)
            </p>
            {disclosure ? (
              <div className="space-y-1 text-sm">
                <p>Monto financiado: ${financiado.toFixed(2)}</p>
                <p>Cargo financiero total: ${disclosure.cargoFinanciero.toFixed(2)}</p>
                <p>Total a pagar en cuotas: ${disclosure.totalCuotas.toFixed(2)}</p>
                <p>Cuota mensual: ${disclosure.cuotaMensual.toFixed(2)} × {numeroCuotas} meses</p>
                <p className="text-muted-foreground">
                  Tasa anual referencial: {disclosure.tasaAnualReferencial}% — el cálculo formal de APR bajo
                  Regulation Z debe confirmarlo un abogado/contador antes de producción.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Completa la tasa mensual para ver el disclosure.</p>
            )}
            <label className="flex items-start gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                name="tila_aceptado"
                checked={tilaAceptado}
                onChange={(e) => setTilaAceptado(e.target.checked)}
                className="mt-1"
                disabled={!disclosure}
              />
              El cliente recibió y revisó esta información antes de firmar.
            </label>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending || !tilaAceptado}>
            {pending ? "Creando…" : "Crear contrato"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
