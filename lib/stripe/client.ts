import "server-only";
import Stripe from "stripe";

// Instanciación perezosa: si se construyera al cargar el módulo, un
// STRIPE_SECRET_KEY vacío (ej. build sin .env real) tira el proceso entero
// abajo. Así, solo falla si de verdad se intenta usar Stripe sin la key.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Falta STRIPE_SECRET_KEY en las variables de entorno.");
    _stripe = new Stripe(key);
  }
  return _stripe;
}
