"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripeBrowser } from "@/lib/stripe/browser";
import { crearSetupIntentCliente, confirmarMandatoCobroCliente } from "./actions";
import { Button } from "@/components/ui/button";

export function FormularioMetodoPago() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    crearSetupIntentCliente().then((result) => {
      if (result.error) setError(result.error);
      else setClientSecret(result.clientSecret);
    });
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!clientSecret) return <p className="text-sm text-muted-foreground">Preparando…</p>;

  return (
    <Elements stripe={getStripeBrowser()} options={{ clientSecret }}>
      <Formulario />
    </Elements>
  );
}

function Formulario() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
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
      const result = await confirmarMandatoCobroCliente(paymentMethodId);
      if (result.error) {
        setError(result.error);
      } else {
        setOk(true);
        router.refresh();
      }
    }

    setPending(false);
  }

  if (ok) return <p className="text-sm text-green-600">Listo, guardamos tu nuevo método de cobro.</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!stripe || pending}>
        {pending ? "Guardando…" : "Guardar método de cobro"}
      </Button>
    </form>
  );
}
