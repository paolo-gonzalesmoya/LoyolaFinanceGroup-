# Loyola Finance Group — Especificación funcional (MVP)

SaaS de financiamiento y cobranza para negocios de servicios (demo: Loyola Finance Group,
construcción — Roofing, Air Conditioning, Home Improvement). Ver `schema.sql` para
las tablas reales; este documento es el contexto de negocio para generar el código.

## 1. Flujo operativo (orden de las fases)

1. **Administración** registra un Lead: contacto, categoría de servicio, foto de
   DNI y de recibo.
2. **Venta**: un vendedor elige un lead disponible (`activo` → `asignado`), agenda
   una visita y completa los datos del cliente (`asignado` → `en_proceso`). El
   vendedor NO elabora la cotización ni ve el SSN/ITN.
3. **Operaciones y crédito (Admin/Paolo)**:
   - Elabora la cotización con los datos que recolectó el vendedor. Si la
     categoría es Roofing, mide las escuadras con la herramienta de medición.
   - Pide autorización y captura el SSN/ITN del cliente (solo el admin).
   - Consulta el score en Experian (queda como registro histórico, nunca se
     sobrescribe — ver `consulta_score`).
   - Decide manualmente: aprueba o rechaza (máximo USD 25,000 financiado). Si
     rechaza, registra el motivo.
4. **Contrato**: el cliente firma, paga el 50% de downpayment (verificado por un
   admin), se define la modalidad (12 a 120 cuotas, tasa mensual, medio de cobro
   vía Stripe) y se calcula la comisión del vendedor (dealer fee), que se
   devenga al firmar y se descuenta del monto entregado.
5. **Construcción**: LC ejecuta la obra y registra avances/entregas (fotos
   inicial / en proceso / final).
6. **Cobranza automática (Stripe)**: en cada fecha de vencimiento, el sistema
   cobra por token con una clave de idempotencia. Si falla, reintenta; si sigue
   sin pagarse, la cuota pasa a mora.
7. **Mora**: 5 días de gracia tras el vencimiento, luego 5% fijo de la cuota +
   1% adicional por semana vencida, con tope de 10%. Cada cargo es una fila
   independiente en el ledger (nunca se modifica una cuota existente).

## 2. Roles

- **Admin**: registra leads, elabora cotizaciones, ve/captura SSN-ITN, aprueba o
  rechaza crédito, ve el dashboard de todos los préstamos, configura el negocio.
- **Vendedor**: elige leads disponibles, completa datos del cliente. No ve datos
  crediticios sensibles ni elabora cotizaciones.
- **Cliente**: ve su propio préstamo, cronograma y avance de obra en el portal
  (self-service, solo lectura + actualizar método de pago).

Matriz completa de permisos en el mockup de diseño (pestaña Diagramas).

## 3. Categorías de servicio (configurable, no hardcodear)

| Categoría | Unidad de medida | Notas |
|---|---|---|
| Roofing | Escuadras | Se mide con herramienta dedicada |
| Air Conditioning | Toneladas | |
| Home Improvement | Horas | Tiene subtipos: Baño, Cocina, Recamara, Pisos, Fences, Ventana, Roofing, Pintura |

Las categorías y sus campos viven en `categoria_servicio` / `campo_servicio` —
agregar una categoría nueva no debe requerir cambios de esquema.

## 4. Máquina de estados

**Lead**: `activo` → `asignado` (vendedor lo elige) → `en_proceso` (datos
completos) → `convertido` (crédito aprobado, pasa a Cliente) | `descartado`.

**Cuota**: `pendiente` → `pagada` (cobro exitoso) | `vencida` (pasó la fecha sin
cobro) → `en_mora` (pasan los días de gracia) → `pagada` (pago tardío, capital +
mora).

**Solicitud de crédito**: `pendiente` → `aprobado` | `rechazado` (con motivo).

## 5. Secuencias clave

**Aprobación de crédito**: Vendedor completa datos → Sistema notifica a Admin →
Admin crea cotización → Admin solicita consulta de score → Sistema llama a
Experian → Experian responde → Sistema guarda en `consulta_score` → Admin
aprueba/rechaza → Sistema notifica al cliente.

**Cobro automático**: Cron diario revisa cuotas que vencen hoy → Sistema crea
cargo en Stripe con clave de idempotencia → Stripe intenta cobrar → Stripe envía
webhook (`charge.succeeded` / `charge.failed`) → Sistema inserta fila en
`movimiento_pago` → si exitoso, marca Cuota `pagada`; si falla, reintenta; si se
agotan los reintentos, marca `vencida`/`en_mora` e inserta un movimiento tipo
Mora.

## 6. Arquitectura de componentes

- **Supabase/Postgres**: fuente de verdad (leads, clientes, contratos, préstamos,
  ledger). Ver `schema.sql`.
- **Tu app (frontend + backend)**: orquesta todo — lee/escribe en Postgres, llama
  a Stripe y Experian, sirve el portal del cliente.
- **Stripe**: tokeniza medios de pago, cobra por API, envía webhooks de
  resultado (éxito/fallo/reembolso/disputa).
- **Experian**: consulta de score vía API, bajo autorización del cliente.
- *A futuro*: HubSpot (sincroniza Leads/Clientes vía API, sin ser la fuente de
  verdad del crédito) y un proveedor de firma electrónica sobre el Contrato.

## 7. Ledger de pagos (regla de oro)

La tabla `movimiento_pago` es **inmutable**: solo se hace INSERT, nunca UPDATE ni
DELETE. El saldo de una cuota se calcula sumando sus movimientos, no leyendo un
campo de estado editable. Cada evento de Stripe (o cargo de mora) es una fila
nueva con su propio `stripe_event_id` / `clave_idempotencia`.

## 8. Fuera de alcance del MVP

- CRM de clientes (se puede integrar HubSpot free más adelante vía API).
- Firma electrónica (DocuSign / Dropbox Sign — agregar en la pantalla de
  Contrato cuando se justifique el costo).

## 9. Ya construido en este MVP (no está fuera de alcance)

- Portal del cliente (escritorio y móvil).
- Cobranza automática vía Stripe.
- Comisión de vendedor con ciclo de vida propio (`devengada`/`pagada`/`revertida`).
- Consulta de score histórica (nunca se sobrescribe).

## 10. Próximo paso técnico

1. Correr `schema.sql` en Supabase.
2. Construir primero el CRUD simple: Lead → Cliente → Cotización (sin Stripe ni
   Experian todavía).
3. Integrar Experian (consulta de score) y Stripe (mandato + cobro automático +
   webhooks) una vez el CRUD esté probado con datos reales.
4. Portal del cliente al final, sobre las mismas tablas.
