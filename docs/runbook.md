# Runbook — cobranza automática

Guía corta para cuando algo falla en el motor de cobranza (Fase 6). Todo lo
de acá es seguro de repetir: el cron y el webhook son idempotentes (clave
de idempotencia en Stripe y en `movimiento_pago.clave_idempotencia`), así
que reintentar nunca duplica un cargo.

## 1. El cron de cobranza no corrió (o corrió con errores)

**Cómo detectarlo:**
- Vercel Dashboard → proyecto → pestaña *Cron Jobs* (o *Logs* del deploy) → confirmar que `/api/cron/collect-installments` se ejecutó hoy y qué devolvió.
- En Supabase, `select * from movimiento_pago where fecha_registro::date = current_date` — si hay cuotas vencidas hoy y no aparece nada, el cron no corrió o no encontró nada que cobrar (revisar por qué).
- `/notificaciones` en la app (admin) — si no llegó ninguna notificación de cobro en un día donde debía haberlas, es señal de que algo falló.

**Cómo re-correrlo a mano:**
```
curl -H "Authorization: Bearer $CRON_SECRET" https://<tu-dominio>/api/cron/collect-installments
```
La respuesta es JSON con el detalle de cada cuota procesada (`resultados`) — sirve para ver exactamente qué pasó con cada una.

## 2. Un webhook de Stripe se perdió o falló

Stripe reintenta automáticamente los webhooks que fallan, durante varios
días. Si hace falta forzarlo:

1. Stripe Dashboard → Developers → Webhooks → el endpoint → pestaña de eventos.
2. Buscar el evento (`payment_intent.succeeded` / `.payment_failed`) por fecha o por el `payment_intent` en cuestión.
3. Botón **Resend** — vuelve a mandarlo a `/api/webhooks/stripe`. Como usa la misma `clave_idempotencia` (guardada en el metadata del PaymentIntent), no duplica el ledger aunque se reenvíe más de una vez.

## 3. El ledger no coincide con lo que muestra Stripe

1. Ubicar el `movimiento_pago.stripe_event_id` (es el id del PaymentIntent, `pi_...`) y buscarlo en el Stripe Dashboard.
2. Si Stripe dice `succeeded` pero no hay fila `exitoso` en el ledger para ese intento → correr el cron a mano (punto 1) o reenviar el webhook (punto 2); alguno de los dos lo va a registrar.
3. Si después de eso sigue sin cuadrar (caso raro — ej. alguien hizo un refund manual desde el Dashboard de Stripe sin pasar por la app), el ledger soporta un movimiento `tipo='ajuste'` para estos casos, pero **hoy no hay pantalla para crearlo** — hay que insertarlo a mano desde el SQL Editor de Supabase con el service role, dejando bien clara la razón en un comentario. No editar ni borrar filas existentes bajo ninguna circunstancia — `movimiento_pago` es insert-only por diseño (trigger + revoke a nivel de base, no es solo una convención de código).

## 4. El proyecto de Supabase se pausó por inactividad

Solo aplica en tier gratuito (ver nota sobre el upgrade a Pro antes de ir a
producción). Reactivar desde el Supabase Dashboard → el proyecto → botón de
"Restore/Resume". Apenas esté arriba, correr el cron a mano (punto 1) para
el/los día(s) perdido(s) — el cron busca cuotas vencidas *hasta hoy*, así
que un solo run recupera varios días atrasados de una vez.

## 5. Correo — confirmación de registro y notificaciones (Resend)

Hay dos envíos de correo distintos, con dos mecanismos distintos:

**a) Correo de confirmación al registrarse (`/registro`)** — lo manda **Supabase Auth** directamente cuando llama `supabase.auth.signUp()`, no el código de la app. Para que salga de verdad (y no del correo por defecto de Supabase, muy limitado):

1. Supabase Dashboard → el proyecto → **Authentication → Emails → SMTP Settings** → activar "Enable Custom SMTP" y cargar:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: la misma `RESEND_API_KEY` que está en `.env.local`
   - Sender email / Sender name: el remitente que se quiera mostrar
2. Confirmar que **Authentication → Sign In / Providers → Email → "Confirm email"** esté activado — si está apagado, `signUp()` da sesión de una y nunca manda el correo (la app ya se adapta a cualquiera de los dos casos, pero para que exista el correo de confirmación esto tiene que estar prendido).

**b) Notificaciones de la app** (aprobación/rechazo de crédito, cobranza, reembolsos) — las manda el código directamente vía la API de Resend (`lib/notificaciones/email.ts`), usando `RESEND_API_KEY` de `.env.local`. No depende de la configuración de Supabase.

**Restricción compartida por las dos:** sin un dominio propio verificado en Resend (`resend.com` → Domains), el remitente `onboarding@resend.dev` **solo entrega al correo con el que se creó la cuenta de Resend** — cualquier otro destinatario rebota en silencio. El dominio ya está comprado (`loyolafinancegroup.com`) — falta:

1. Resend Dashboard → **Domains → Add Domain** → `loyolafinancegroup.com`.
2. Cargar los registros DNS (SPF/DKIM/DMARC) que Resend da ahí en el proveedor donde se compró el dominio. Verificación puede tardar unos minutos a unas horas.
3. Una vez verificado: `RESEND_FROM_EMAIL="Loyola Finance Group <notificaciones@loyolafinancegroup.com>"` en `.env.local`/Vercel, y el mismo remitente en el SMTP Settings de Supabase (punto (a) más arriba).

## 6. Dónde mirar en general

| Qué | Dónde |
|---|---|
| Si el cron/webhook corrieron y qué devolvieron | Vercel Dashboard → Logs |
| Estado real de un cargo | Stripe Dashboard → Payments / Events |
| Estado real de la base | Supabase Dashboard → Table Editor / SQL Editor |
| Notificaciones que vio el admin | `/notificaciones` en la app |
