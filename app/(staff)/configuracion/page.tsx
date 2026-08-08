import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NuevaCategoriaForm, NuevoCampoForm } from "./forms";

export default async function ConfiguracionPage() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: categorias }, { data: campos }] = await Promise.all([
    supabase.from("categoria_servicio").select("id, nombre").order("nombre"),
    supabase
      .from("campo_servicio")
      .select("id, categoria_id, nombre_campo, unidad_medida, tipo_dato")
      .order("nombre_campo"),
  ]);

  const camposPorCategoria = new Map<string, typeof campos>();
  for (const campo of campos ?? []) {
    const lista = camposPorCategoria.get(campo.categoria_id) ?? [];
    lista.push(campo);
    camposPorCategoria.set(campo.categoria_id, lista);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Configuración del negocio</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías de servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(categorias ?? []).map((categoria) => (
            <div key={categoria.id} className="rounded-md border p-3">
              <p className="font-medium">{categoria.nombre}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(camposPorCategoria.get(categoria.id) ?? []).map((campo) => (
                  <Badge key={campo.id} variant="secondary">
                    {campo.nombre_campo}
                    {campo.unidad_medida ? ` (${campo.unidad_medida})` : ""}
                  </Badge>
                ))}
                {(camposPorCategoria.get(categoria.id) ?? []).length === 0 && (
                  <span className="text-sm text-muted-foreground">Sin campos todavía.</span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <NuevaCategoriaForm />
      <NuevoCampoForm categorias={categorias ?? []} />
    </div>
  );
}
