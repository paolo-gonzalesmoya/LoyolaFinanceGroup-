"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cambiarPassword } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ActivarCuentaForm() {
  const [state, action, pending] = useActionState(cambiarPassword, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/portal");
  }, [state?.ok, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Elige una contraseña</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmar_password">Repite la contraseña</Label>
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
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando…" : "Activar mi cuenta"}
      </Button>
    </form>
  );
}
