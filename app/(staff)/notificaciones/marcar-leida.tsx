"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarNotificacionLeida } from "./actions";
import { Button } from "@/components/ui/button";

export function MarcarLeidaButton({ notificacionId }: { notificacionId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await marcarNotificacionLeida(notificacionId);
        router.refresh();
      })}
    >
      {pending ? "…" : "Marcar leída"}
    </Button>
  );
}
