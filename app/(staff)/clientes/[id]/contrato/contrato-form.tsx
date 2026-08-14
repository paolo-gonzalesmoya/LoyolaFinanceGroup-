"use client";

import { useActionState, useMemo, useState } from "react";
import { crearContrato } from "./actions";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CUOTAS = [12, 18, 24, 36, 48, 60, 72, 84];

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
  const [tasaAnual, setTasaAnual] = useState(tasaSugerida ?? "");
  const [tilaAceptado, setTilaAceptado] = useState(false);

  const downpayment = Math.round(total * 0.5 * 100) / 100;
  const financiado = Math.round((total - downpayment) * 100) / 100;

  // tasa_anual es lo que carga admin/asesor (y lo que dispara el tope de
  // 9.99% de Paolo) — generarCronograma necesita la tasa periódica mensual,
  // así que se divide entre 12 solo acá, para el cálculo.
  const disclosure = useMemo(() => {
    const tasa = Number(tasaAnual);
    const cuotas = Number(numeroCuotas);
    if (!tasa || tasa <= 0 || !cuotas) return null;
    const cronograma = generarCronograma(financiado, tasa / 12, cuotas, new Date());
    const totalCuotas = cronograma.reduce((suma, c) => suma + c.monto, 0);
    const cargoFinanciero = Math.round((totalCuotas - financiado) * 100) / 100;
    return { cuotaMensual: cronograma[0]?.monto ?? 0, totalCuotas, cargoFinanciero, tasaAnualReferencial: tasa };
  }, [tasaAnual, numeroCuotas, financiado]);

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
              <Label htmlFor="tasa_anual">Tasa anual (%)</Label>
              <Input
                id="tasa_anual"
                name="tasa_anual"
                type="number"
                step="0.01"
                value={tasaAnual}
                onChange={(e) => setTasaAnual(e.target.value)}
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
                  Tasa anual (nominal): {disclosure.tasaAnualReferencial}% — el cálculo formal de APR bajo
                  Regulation Z (método actuarial) debe confirmarlo un abogado/contador antes de producción.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Completa la tasa anual para ver el disclosure.</p>
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
              Confirmo que revisé esta información antes de crear el contrato.
            </label>
            <p className="text-xs text-muted-foreground">
              El cliente todavía tiene que aceptar estos mismos términos desde su portal antes de poder autorizar su
              método de cobro — esto no reemplaza esa aceptación.
            </p>
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
