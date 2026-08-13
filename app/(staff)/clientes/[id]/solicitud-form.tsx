"use client";

import { useActionState } from "react";
import { crearSolicitudCredito } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SolicitudCreditoForm({ clienteId }: { clienteId: string }) {
  const [state, action, pending] = useActionState(crearSolicitudCredito.bind(null, clienteId), undefined);

  return (
    <form action={action} className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="monto_solicitado">Monto solicitado (USD)</Label>
        <Input id="monto_solicitado" name="monto_solicitado" type="number" step="0.01" min="0" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear solicitud"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
