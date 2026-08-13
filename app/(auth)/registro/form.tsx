"use client";

import { useActionState } from "react";
import { registrarClientePublico } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegistroForm() {
  const [state, action, pending] = useActionState(registrarClientePublico, undefined);

  if (state?.correoEnviado) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium">Revisa tu correo para confirmar tu cuenta.</p>
        <p className="text-muted-foreground">
          Te mandamos un link de confirmación. Una vez que lo abras vas a poder entrar al portal — de ahí en
          adelante, un administrador confirma tu identidad para que tu solicitud avance de verdad.
        </p>
      </div>
    );
  }

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

      <p className="text-xs text-muted-foreground">
        Al crear tu cuenta vas a tener que leer y aceptar los Términos y Condiciones como paso siguiente.
      </p>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
