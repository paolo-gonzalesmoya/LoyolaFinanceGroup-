"use client";

import { useState, useTransition } from "react";
import { revelarSsn } from "../actions";
import { Button } from "@/components/ui/button";

export function RevealSsn({ clienteId, mascara }: { clienteId: string; mascara: string }) {
  const [ssn, setSsn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (ssn) {
    return (
      <span className="font-mono">
        {ssn}{" "}
        <button type="button" onClick={() => setSsn(null)} className="text-xs text-muted-foreground hover:underline">
          ocultar
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="font-mono">{mascara}</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await revelarSsn(clienteId);
            if (result.ssn) setSsn(result.ssn);
            else setError(result.error);
          })
        }
      >
        {pending ? "Descifrando…" : "Revelar"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
