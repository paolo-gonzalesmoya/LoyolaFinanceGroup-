"use client";

import { useActionState } from "react";
import { crearCliente } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function NuevoClienteForm() {
  const [state, action, pending] = useActionState(crearCliente, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input id="nombre" name="nombre" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" name="correo" type="email" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ssn_itn">SSN / ITN</Label>
        <Input id="ssn_itn" name="ssn_itn" required />
        <p className="text-sm text-muted-foreground">Se guarda cifrado — solo se muestran los últimos 4 dígitos salvo revelado explícito.</p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="autorizado" className="mt-1" />
        El cliente autorizó la captura de sus datos y la consulta de crédito.
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Registrar cliente"}
      </Button>
    </form>
  );
}
