-- "Verificar downpayment" pasó de ser una atestación manual a cobrar de
-- verdad por Stripe (a pedido de Paolo, el downpayment usa el mismo
-- mandato_cobro que las cuotas). Guardamos el PaymentIntent para poder
-- rastrear ese cobro puntual — no encaja en movimiento_pago porque esa
-- tabla exige un cuota_id, y el downpayment no es una cuota.
alter table contrato add column downpayment_stripe_payment_intent_id text;
