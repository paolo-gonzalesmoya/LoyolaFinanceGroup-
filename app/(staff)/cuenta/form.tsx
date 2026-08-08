"use client";

import { useActionState } from "react";
import { cambiarPassword } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CambiarPasswordForm() {
  const [state, action, pending] = useActionState(cambiarPassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmar_password">Repetir contraseña</Label>
        <Input
          id="confirmar_password"
          name="confirmar_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">Contraseña actualizada.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
