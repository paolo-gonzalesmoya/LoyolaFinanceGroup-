"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmarCliente } from "../actions";
import { Button } from "@/components/ui/button";

export function ConfirmarClienteButton({ clienteId }: { clienteId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await confirmarCliente(clienteId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Confirmando…" : "Confirmar identidad"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
