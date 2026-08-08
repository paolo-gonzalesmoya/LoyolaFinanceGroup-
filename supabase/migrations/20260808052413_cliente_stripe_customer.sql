-- Fase 4: necesitamos un Stripe Customer por cliente para poder guardar un
-- payment method reusable y cobrarlo off-session más adelante (Fase 6). No
-- existía ninguna columna para trackear esto.
alter table cliente add column stripe_customer_id text;
