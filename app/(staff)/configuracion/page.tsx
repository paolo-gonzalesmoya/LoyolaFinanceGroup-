import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoUsuarioForm, ListaUsuarios } from "./usuarios-forms";

export default async function ConfiguracionPage() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: usuarios } = await supabase.from("usuario").select("id, nombre, correo, rol, activo").order("nombre");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Configuración del negocio</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuarios de staff</CardTitle>
        </CardHeader>
        <CardContent>
          <ListaUsuarios usuarios={usuarios ?? []} />
        </CardContent>
      </Card>

      <NuevoUsuarioForm />
    </div>
  );
}
