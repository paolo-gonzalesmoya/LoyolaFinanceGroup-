"use client";

import { useActionState } from "react";
import { enviarSolicitudCliente } from "./solicitud-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SolicitudClienteForm() {
  const [state, action, pending] = useActionState(enviarSolicitudCliente, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="monto_solicitado">¿Cuánto necesitas financiar? (USD)</Label>
        <Input id="monto_solicitado" name="monto_solicitado" type="number" step="0.01" min="0" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ssn_itn">SSN / ITN</Label>
        <Input id="ssn_itn" name="ssn_itn" required />
        <p className="text-xs text-muted-foreground">Se guarda cifrado — lo necesitamos para consultar tu score de crédito.</p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar mi solicitud"}
      </Button>
    </form>
  );
}
