"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSsn } from "@/lib/crypto/ssn";
import { TC_VERSION } from "./terminos";

export async function registrarClientePublico(_prevState: { error: string } | undefined, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const ssnItn = String(formData.get("ssn_itn") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmarPassword = String(formData.get("confirmar_password") ?? "");
  const tcAceptado = formData.get("tc_aceptado") === "on";

  if (!nombre || !correo) return { error: "Completa tu nombre y correo." };
  if (!ssnItn) return { error: "El SSN/ITN es obligatorio — lo necesitamos para consultar tu score de crédito." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirmarPassword) return { error: "Las contraseñas no coinciden." };
  if (!tcAceptado) return { error: "Tienes que aceptar los Términos y Condiciones para continuar." };

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    const yaExiste = authError?.message?.toLowerCase().includes("already registered");
    return { error: yaExiste ? "Ya existe una cuenta con este correo." : `No se pudo crear tu cuenta: ${authError?.message ?? "error desconocido"}` };
  }

  // verificado queda en false (default de la columna): un cliente que se
  // registra puede cargar su SSN/ITN de una (admin ya puede consultar su
  // score), pero no puede enviar una solicitud real hasta que admin
  // confirme su identidad a mano.
  const { error: dbError } = await admin.from("cliente").insert({
    nombre,
    correo,
    telefono,
    direccion,
    ssn_itn_cifrado: encryptSsn(ssnItn),
    auth_user_id: authUser.user.id,
    registrado_por: null,
    tc_aceptado_en: new Date().toISOString(),
    tc_version: TC_VERSION,
  });

  if (dbError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: `No se pudo crear tu cuenta: ${dbError.message}` };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: correo, password });
  if (signInError) redirect("/portal-login");

  redirect("/portal");
}
