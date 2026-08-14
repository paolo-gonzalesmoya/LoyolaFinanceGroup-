"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { aceptarContratoCliente } from "./actions";
import { Button } from "@/components/ui/button";

export function AceptarContratoForm({ contratoId }: { contratoId: string }) {
  const [aceptado, setAceptado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={aceptado} onChange={(e) => setAceptado(e.target.checked)} className="mt-1" />
        Leí y acepto los términos de mi financiamiento (cuotas, tasa y cargo financiero detallados arriba).
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        disabled={!aceptado || pending}
        onClick={() =>
          startTransition(async () => {
            const result = await aceptarContratoCliente(contratoId);
            if (result.error) setError(result.error);
            else router.push("/portal/metodo-pago");
          })
        }
      >
        {pending ? "Guardando…" : "Aceptar y continuar"}
      </Button>
    </div>
  );
}
