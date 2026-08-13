"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripeBrowser } from "@/lib/stripe/browser";
import { crearSetupIntent, confirmarMandatoCobro } from "./actions";
import { Button } from "@/components/ui/button";

export function MandatoCobro({ clienteId }: { clienteId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    crearSetupIntent(clienteId).then((result) => {
      if (result.error) setError(result.error);
      else setClientSecret(result.clientSecret);
    });
  }, [clienteId]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!clientSecret) return <p className="text-sm text-muted-foreground">Preparando…</p>;

  return (
    <Elements stripe={getStripeBrowser()} options={{ clientSecret }}>
      <FormularioMandato clienteId={clienteId} />
    </Elements>
  );
}

function FormularioMandato({ clienteId }: { clienteId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentido, setConsentido] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !consentido) return;
    setPending(true);
    setError(null);

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({ elements, redirect: "if_required" });

    if (confirmError) {
      setError(confirmError.message ?? "No se pudo confirmar el método de pago.");
      setPending(false);
      return;
    }

    if (setupIntent?.payment_method) {
      const paymentMethodId =
        typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method.id;
      const result = await confirmarMandatoCobro(clienteId, paymentMethodId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    }

    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consentido}
          onChange={(e) => setConsentido(e.target.checked)}
          className="mt-1"
        />
        El cliente autoriza a Loyola Finance Group a cobrar su cuota mensual automáticamente a este método de pago
        (autopay). Este consentimiento es independiente de la firma del contrato.
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || pending || !consentido}>
        {pending ? "Guardando…" : "Autorizar método de cobro"}
      </Button>
    </form>
  );
}
