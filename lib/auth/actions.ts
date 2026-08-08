"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: { error: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
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
