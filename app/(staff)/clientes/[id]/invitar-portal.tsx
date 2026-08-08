"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { invitarClientePortal } from "../actions";
import { Button } from "@/components/ui/button";

export function InvitarPortalButton({ clienteId }: { clienteId: string }) {
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
        onClick={() =>
          startTransition(async () => {
            const result = await invitarClientePortal(clienteId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Enviando…" : "Invitar al portal"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
