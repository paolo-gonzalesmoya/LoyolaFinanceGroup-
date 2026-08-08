import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Cliente con la service_role key: bypasea RLS por completo.
//
// Úsalo SOLO desde código que corre sin un usuario autenticado de por medio
// y que ya hace su propia autorización explícita: el cron de cobranza, el
// webhook de Stripe, y lib/ledger/movimientos.ts (Fase 6). No lo importes
// desde una Server Action, Route Handler o Server Component que responde a
// una petición de un usuario normal — ahí siempre va lib/supabase/server.ts,
// que sí respeta RLS.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
