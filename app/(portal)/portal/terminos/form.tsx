"use client";

import { useActionState, useState } from "react";
import { aceptarTerminos } from "./actions";
import { Button } from "@/components/ui/button";

export function AceptarTerminosForm() {
  const [state, action, pending] = useActionState(aceptarTerminos, undefined);
  const [marcado, setMarcado] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="tc_aceptado"
          checked={marcado}
          onChange={(e) => setMarcado(e.target.checked)}
          className="mt-1"
        />
        Leí y acepto los Términos y Condiciones.
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending || !marcado} className="w-full">
        {pending ? "Guardando…" : "Aceptar y continuar"}
      </Button>
    </form>
  );
}
