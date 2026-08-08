"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarCotizacion } from "../actions";
import { Button } from "@/components/ui/button";

export function EliminarCotizacionButton({ clienteId, cotizacionId }: { clienteId: string; cotizacionId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("¿Eliminar esta cotización? No se puede deshacer.")) return;
          startTransition(async () => {
            const result = await eliminarCotizacion(clienteId, cotizacionId);
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Eliminando…" : "Eliminar cotización"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
