"use client";

import { useActionState } from "react";
import { crearContrato } from "./actions";
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
}: {
  clienteId: string;
  solicitudId: string;
  total: number;
}) {
  const [state, action, pending] = useActionState(crearContrato.bind(null, { clienteId, solicitudId }), undefined);
  const downpayment = Math.round(total * 0.5 * 100) / 100;
  const financiado = Math.round((total - downpayment) * 100) / 100;

  return (
    <Card>
      <CardContent>
        <form action={action} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Monto solicitado: ${total.toFixed(2)} · Downpayment (50%): ${downpayment.toFixed(2)} · A financiar: $
            {financiado.toFixed(2)}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="numero_cuotas">Número de cuotas</Label>
              <Select name="numero_cuotas" defaultValue="12">
                <SelectTrigger id="numero_cuotas" className="w-full">
                  <SelectValue>{(value: string | null) => value ?? "12"}</SelectValue>
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
              <Input id="tasa_mensual" name="tasa_mensual" type="number" step="0.01" required />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear contrato"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
