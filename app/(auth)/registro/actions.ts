"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSsn } from "@/lib/crypto/ssn";

type RegistroState = { error: string | null; correoEnviado?: boolean };

export async function registrarClientePublico(_prevState: RegistroState | undefined, formData: FormData): Promise<RegistroState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const ssnItn = String(formData.get("ssn_itn") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmar_password") ?? "");

  if (!nombre || !correo) return { error: "Completa tu nombre y correo." };
  if (!ssnItn) return { error: "El SSN/ITN es obligatorio — lo necesitamos para consultar tu score de crédito." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirmarPassword) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // signUp (no admin.createUser con email_confirm:true): así Supabase manda
  // el correo de confirmación de verdad y no entrega sesión hasta que el
  // cliente lo confirme. auth/callback ya sabe intercambiar ese link por
  // una sesión real (mismo Route Handler que usa la invitación al portal).
  const { data: signUpData, error: authError } = await supabase.auth.signUp({
    email: correo,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/portal` },
  });

  if (authError || !signUpData.user) {
    const yaExiste = authError?.message?.toLowerCase().includes("already registered");
    return {
      error: yaExiste ? "Ya existe una cuenta con este correo." : `No se pudo crear tu cuenta: ${authError?.message ?? "error desconocido"}`,
    };
  }

  const admin = createAdminClient();

  // verificado queda en false (default de la columna): un cliente que se
  // registra puede cargar su SSN/ITN de una (admin ya puede consultar su
  // score), pero no puede enviar una solicitud real hasta que admin
  // confirme su identidad a mano. tc_aceptado_en/tc_version quedan en null
  // acá a propósito — aceptar los Términos es un paso aparte, después de
  // crear la cuenta (ver /portal/terminos).
  const { error: dbError } = await admin.from("cliente").insert({
    nombre,
    correo,
    telefono,
    direccion,
    ssn_itn_cifrado: encryptSsn(ssnItn),
    auth_user_id: signUpData.user.id,
    registrado_por: null,
  });

  if (dbError) {
    await admin.auth.admin.deleteUser(signUpData.user.id);
    return { error: `No se pudo crear tu cuenta: ${dbError.message}` };
  }

  // Si el proyecto tiene desactivada la confirmación de correo, signUp ya
  // devuelve una sesión activa — en ese caso no hay nada que confirmar,
  // entra directo a aceptar los Términos. Si no, se queda a esperar el
  // clic en el correo (ese link ya manda a /portal, que a su vez redirige
  // a /portal/terminos si todavía no los aceptó).
  if (signUpData.session) redirect("/portal/terminos");

  return { error: null, correoEnviado: true };
}
