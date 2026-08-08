import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Nota: desde Next.js 16 esto se llama Proxy (antes Middleware); el archivo
// tiene que llamarse proxy.ts en la raíz del proyecto. El comportamiento es
// el mismo que "middleware" en cualquier guía de Supabase/Next.js anterior.

// Rutas públicas: no requieren sesión. Todo lo demás exige un usuario
// autenticado como chequeo OPTIMISTA (solo mira la cookie, no la base de
// datos). La autorización real — admin vs vendedor vs cliente, fila por
// fila — se resuelve siempre server-side vía RLS y el Data Access Layer de
// cada feature (Fases 1, 2 y 7), nunca aquí.
const PUBLIC_ROUTES = ["/", "/login", "/portal-login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante: dispara el refresh de sesión temprano, antes de construir
  // cualquier respuesta. Si el refresh llega después de que la respuesta ya
  // se armó, la sesión actualizada no se puede escribir y se pierde.
  const { data } = await supabase.auth.getClaims();

  const isPublicRoute = PUBLIC_ROUTES.includes(request.nextUrl.pathname);

  if (!data?.claims && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
