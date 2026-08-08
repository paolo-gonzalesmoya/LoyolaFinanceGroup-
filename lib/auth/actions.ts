"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completa email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Credenciales inválidas." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInCliente(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completa email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Credenciales inválidas." };
  }

  // El login del portal comparte auth.users con el de staff — si alguien
  // entra acá con credenciales válidas pero que no son de un cliente (por
  // ejemplo, un admin probando el link equivocado), no le damos sesión de
  // portal.
  const { data: cliente } = await supabase.from("cliente").select("id").eq("auth_user_id", data.user.id).maybeSingle();
  if (!cliente) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al portal del cliente." };
  }

  redirect("/portal");
}

export async function signOutCliente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal-login");
}

export async function cambiarPassword(
  _prevState: { error: string | null; ok: boolean } | undefined,
  formData: FormData
) {
  const password = String(formData.get("password") ?? "");
  const confirmar = String(formData.get("confirmar_password") ?? "");

  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres.", ok: false };
  if (password !== confirmar) return { error: "Las contraseñas no coinciden.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message, ok: false };

  return { error: null, ok: true };
}
