"use client";

import { useState, useTransition } from "react";
import { decidirCredito } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Input = { clienteId: string; leadId: string; solicitudId: string; cotizacionId: string };

export function DecisionCredito({ input }: { input: Input }) {
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();

  function decidir(decision: "aprobado" | "rechazado") {
    startTransition(async () => {
      const result = await decidirCredito(input, decision, decision === "rechazado" ? motivo : null);
      setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <Button type="button" disabled={pending} onClick={() => decidir("aprobado")}>
        {pending ? "Procesando…" : "Aprobar"}
      </Button>

      <div className="space-y-1.5">
        <Label htmlFor="motivo_rechazo">Motivo de rechazo (obligatorio para rechazar)</Label>
        <Textarea id="motivo_rechazo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <Button type="button" variant="destructive" disabled={pending} onClick={() => decidir("rechazado")}>
          Rechazar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
