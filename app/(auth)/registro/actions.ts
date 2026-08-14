"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSsn } from "@/lib/crypto/ssn";

type RegistroState = { error: string | null };

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

  const admin = createAdminClient();

  // Confirmación de correo desactivada A PROPÓSITO por ahora (pedido
  // explícito de Paolo, 2026-08-14): sin un dominio propio verificado en
  // Resend, Supabase no puede mandar el correo de confirmación a nadie que
  // no sea la cuenta de Resend de Paolo — supabase.auth.signUp() ni
  // siquiera crea la cuenta cuando ese envío falla (lo bloquea por
  // completo). Mientras tanto se crea la cuenta directo con
  // email_confirm:true, como antes de que existiera el paso de
  // confirmación. Para reactivarlo cuando haya dominio verificado: volver
  // a supabase.auth.signUp() con emailRedirectTo (ver git log de este
  // archivo — commit "Correo real: confirmación de registro...").
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    const yaExiste = authError?.message?.toLowerCase().includes("already registered");
    return {
      error: yaExiste ? "Ya existe una cuenta con este correo." : `No se pudo crear tu cuenta: ${authError?.message ?? "error desconocido"}`,
    };
  }

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
    auth_user_id: authUser.user.id,
    registrado_por: null,
  });

  if (dbError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: `No se pudo crear tu cuenta: ${dbError.message}` };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: correo, password });
  if (signInError) redirect("/portal-login/ingresar");

  redirect("/portal/terminos");
}
