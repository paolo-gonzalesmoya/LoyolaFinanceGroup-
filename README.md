# Loyola Finance Group

SaaS de financiamiento y cobranza para negocios de servicios. Ver [`docs/SPEC.md`](docs/SPEC.md) para el contexto de negocio completo (flujo operativo, roles, reglas de mora/comisión, etc.) y [`docs/schema.sql`](docs/schema.sql) para el modelo de datos. Los diagramas del flujo y la matriz de permisos están en [`docs/diagrams/`](docs/diagrams/).

## Stack

Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Storage) + Tailwind CSS + shadcn/ui, en Vercel. Ver la sección "Arquitectura de componentes" de `docs/SPEC.md` para cómo encajan Stripe y Experian.

## Requisitos

- Node.js 20.9+
- Una cuenta de Supabase (el proyecto real se crea aparte, no está incluido acá)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (se puede usar vía `npx supabase`, no hace falta instalarlo global)

## Levantar el proyecto

```bash
npm install
cp .env.local.example .env.local   # completar con los valores reales, ver abajo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Conectar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Copiar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) a `.env.local`.
3. Enlazar el proyecto y aplicar las migraciones (`supabase/migrations/`, corridas en orden):
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-del-proyecto>
   npx supabase db push
   ```
4. Generar los tipos reales (reemplaza el placeholder en `types/database.types.ts`):
   ```bash
   npx supabase gen types typescript --linked > types/database.types.ts
   ```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

CI (`.github/workflows/ci.yml`) corre los tres últimos en cada PR contra `main`.

## Estructura

```
app/
├── (staff)/    # Admin + Vendedor — leads, clientes, cotizaciones, créditos, contratos, dashboard
├── (portal)/   # Portal del cliente (self-service, read-only + método de pago)
├── (auth)/     # Login de staff y del portal
└── api/        # Route Handlers (webhook de Stripe, cron de cobranza)
lib/supabase/   # client.ts (browser), server.ts (RSC/Server Actions/Route Handlers, respeta RLS),
                # admin.ts (service_role, bypasea RLS — solo cron/webhook/ledger)
supabase/migrations/   # Migraciones SQL, en orden. 0001 es docs/schema.sql verbatim.
proxy.ts        # Antes "middleware.ts" — Next.js 16 lo renombró a Proxy.
```

## Estado actual

Scaffolding inicial (esquema en migraciones, auth + RLS base, shell de la app). El resto del roadmap — CRUD de leads/clientes/cotizaciones, integración de Experian y Stripe, motor de cobranza automática, portal del cliente — se construye por fases siguiendo el orden de `docs/SPEC.md` §10.

**Nota de seguridad**: `cliente.ssn_itn_cifrado` se cifra en la capa de aplicación (nunca en la base) y la UI nunca debe mostrar más de los últimos 4 dígitos — ver el comentario de esa columna en `docs/schema.sql` y la migración `..._auth_linkage_rls.sql`.
