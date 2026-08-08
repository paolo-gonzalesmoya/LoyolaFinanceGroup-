import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// DAL: única fuente de verdad para "quién es el staff logueado". Cacheada
// por request (React cache) para no repetir la consulta si varios
// componentes del mismo render la llaman.
export const getStaffUser = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const sub = auth?.claims?.sub;
  if (!sub) return null;

  const { data } = await supabase
    .from("usuario")
    .select("id, nombre, correo, rol")
    .eq("auth_user_id", sub)
    .single();

  return data;
});
