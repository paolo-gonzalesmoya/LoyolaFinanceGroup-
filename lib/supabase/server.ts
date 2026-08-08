import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

// Cliente de Supabase para Server Components, Server Actions y Route
// Handlers. Usa la anon key + RLS (igual que client.ts) — la diferencia es
// que este lee/escribe la sesión desde las cookies de la petición actual.
// Crear uno nuevo por request; nunca reutilizar entre requests.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Desde un Server Component no se pueden escribir cookies.
            // proxy.ts refresca la sesión en cada request, así que esto es
            // seguro de ignorar aquí — ver proxy.ts.
          }
        },
      },
    }
  );
}
