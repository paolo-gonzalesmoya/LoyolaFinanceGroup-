"use client";

import { useActionState } from "react";
import { reclamarLead } from "../actions";
import { Button } from "@/components/ui/button";

export function ReclamarButton({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(reclamarLead.bind(null, leadId), undefined);

  return (
    <form action={action} className="space-y-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Reclamando…" : "Reclamar lead"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
