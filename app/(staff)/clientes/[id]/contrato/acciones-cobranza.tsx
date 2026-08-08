"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelarPrestamo, reembolsarMovimiento } from "./actions";
import { Button } from "@/components/ui/button";

export function CancelarPrestamoButton({ clienteId, prestamoId }: { clienteId: string; prestamoId: string }) {
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
          if (!confirm("¿Cancelar este préstamo? Dejarán de intentarse cobros automáticos.")) return;
          startTransition(async () => {
            const result = await cancelarPrestamo({ clienteId, prestamoId });
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Cancelando…" : "Cancelar préstamo"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ReembolsarButton({ clienteId, movimientoId }: { clienteId: string; movimientoId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("¿Reembolsar este cobro por Stripe?")) return;
          startTransition(async () => {
            const result = await reembolsarMovimiento({ clienteId, movimientoId });
            if (result.error) setError(result.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Reembolsando…" : "Reembolsar"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
