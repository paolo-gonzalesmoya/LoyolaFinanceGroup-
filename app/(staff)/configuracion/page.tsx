import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoUsuarioForm, ListaUsuarios } from "./usuarios-forms";
import { NuevoNivelScoreForm, ListaNivelesScore } from "./niveles-score-forms";

export default async function ConfiguracionPage() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: usuarios }, { data: niveles }] = await Promise.all([
    supabase.from("usuario").select("id, nombre, correo, rol, activo").order("nombre"),
    supabase.from("niveles_score").select("id, nombre_nivel, score_min, score_max, tasa_interes, activo").order("score_min"),
  ]);

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Niveles de score y tasa</CardTitle>
        </CardHeader>
        <CardContent>
          <ListaNivelesScore niveles={niveles ?? []} />
        </CardContent>
      </Card>

      <NuevoNivelScoreForm />
    </div>
  );
}
