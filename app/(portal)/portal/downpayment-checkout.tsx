"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pagarDownpaymentCliente } from "./downpayment-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DownpaymentCheckout({
  contratoId,
  tieneMetodoDeCobro,
}: {
  clienteId: string;
  contratoId: string;
  tieneMetodoDeCobro: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!tieneMetodoDeCobro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autoriza un método de cobro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Antes de pagar tu downpayment, necesitamos que autorices una tarjeta o cuenta bancaria.
          </p>
          <Button render={<Link href="/portal/metodo-pago" />}>Autorizar método de cobro</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Paga tu downpayment inicial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Este cobro se hace una sola vez, a la tarjeta o cuenta que ya autorizaste. Apenas se confirme, armamos tu
          cronograma de pagos.
        </p>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await pagarDownpaymentCliente(contratoId);
              if (result.error) setError(result.error);
              else router.refresh();
            })
          }
        >
          {pending ? "Cobrando…" : "Pagar downpayment ahora"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
