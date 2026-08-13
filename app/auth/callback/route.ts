import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Intercambia el código de la invitación (link que manda Supabase Auth por
// correo) por una sesión real. Único uso hoy: invitación al portal del
// cliente (ver invitarClientePortal) — el cliente cae acá antes de llegar a
// /portal/activar a poner su contraseña por primera vez.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal/activar";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/portal-login/ingresar?error=invitacion_invalida`);
}
