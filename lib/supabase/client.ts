import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Cliente de Supabase para Client Components. Usa la anon key + RLS: nunca
// ve más filas de las que las políticas del usuario autenticado permiten.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
