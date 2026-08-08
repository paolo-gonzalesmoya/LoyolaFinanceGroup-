"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verificarDownpayment } from "./actions";
import { Button } from "@/components/ui/button";

type Input = { clienteId: string; contratoId: string; cotizacionId: string };

export function VerificarDownpaymentButton({ input }: { input: Input }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await verificarDownpayment(input);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Verificando…" : "Verificar downpayment recibido"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
