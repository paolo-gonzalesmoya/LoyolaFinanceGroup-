"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarSolicitudCredito } from "../actions";
import { Button } from "@/components/ui/button";

export function EliminarSolicitudButton({ clienteId, solicitudId }: { clienteId: string; solicitudId: string }) {
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
          if (!confirm("¿Eliminar esta solicitud? No se puede deshacer.")) return;
          startTransition(async () => {
            const result = await eliminarSolicitudCredito(clienteId, solicitudId);
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Eliminando…" : "Eliminar solicitud"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
