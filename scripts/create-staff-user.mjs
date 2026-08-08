// Crea un usuario de staff (admin o vendedor): usuario de Supabase Auth +
// su fila en `usuario`, ya enlazadas por auth_user_id.
//
// Uso:
//   node --env-file=.env.local scripts/create-staff-user.mjs <email> <nombre> <admin|vendedor> [password]
//
// Si no se pasa password, se genera una aleatoria y se imprime una sola vez
// — cambiarla después de el primer login (Supabase Dashboard → Authentication
// → Users → ese usuario → "Reset password", o desde la app cuando exista esa
// pantalla).

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const [, , email, nombre, rol, passwordArg] = process.argv;

if (!email || !nombre || !rol || !["admin", "vendedor"].includes(rol)) {
  console.error("Uso: node --env-file=.env.local scripts/create-staff-user.mjs <email> <nombre> <admin|vendedor> [password]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (¿corriste con --env-file=.env.local?).");
  process.exit(1);
}

const password = passwordArg ?? randomBytes(12).toString("base64url");
const generated = !passwordArg;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: authUser, error: authError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (authError) {
  console.error("Error creando el usuario en Supabase Auth:", authError.message);
  process.exit(1);
}

const { data: usuarioRow, error: dbError } = await admin
  .from("usuario")
  .insert({ nombre, correo: email, rol, auth_user_id: authUser.user.id })
  .select()
  .single();

if (dbError) {
  console.error("Usuario de Auth creado, pero falló el insert en `usuario`:", dbError.message);
  console.error("auth_user_id para reintentar a mano:", authUser.user.id);
  process.exit(1);
}

console.log(`Creado: ${nombre} <${email}> (${rol}) — usuario.id=${usuarioRow.id}`);
if (generated) {
  console.log(`Password temporal (guárdala, no se vuelve a mostrar): ${password}`);
}
