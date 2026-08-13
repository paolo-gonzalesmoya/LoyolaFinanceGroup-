"use client";

import { useActionState } from "react";
import { registrarClientePublico } from "./actions";
import { TC_TEXTO } from "./terminos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegistroForm() {
  const [state, action, pending] = useActionState(registrarClientePublico, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre completo</Label>
        <Input id="nombre" name="nombre" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="correo">Correo</Label>
          <Input id="correo" name="correo" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ssn_itn">SSN / ITN</Label>
        <Input id="ssn_itn" name="ssn_itn" required />
        <p className="text-xs text-muted-foreground">Se guarda cifrado — lo necesitamos para consultar tu score de crédito.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmar_password">Repite la contraseña</Label>
          <Input id="confirmar_password" name="confirmar_password" type="password" minLength={8} autoComplete="new-password" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Términos y Condiciones</Label>
        <div className="max-h-32 overflow-y-auto rounded-md border p-3 text-xs whitespace-pre-line text-muted-foreground">
          {TC_TEXTO}
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="tc_aceptado" className="mt-1" required />
        Leí y acepto los Términos y Condiciones.
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
