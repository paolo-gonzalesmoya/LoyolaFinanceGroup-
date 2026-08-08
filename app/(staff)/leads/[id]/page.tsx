import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { getFotoSignedUrl } from "@/lib/storage/lead-fotos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReclamarButton } from "./reclamar-button";
import { CompletarDatosForm } from "./completar-form";

export default async function LeadDetallePage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const usuario = await getStaffUser();
  if (!usuario) notFound();

  const supabase = await createClient();

  const { data: lead } = await supabase.from("lead").select("*").eq("id", id).single();
  if (!lead) notFound();

  const [{ data: categoria }, { data: campos }, { data: valores }, fotoDniUrl, fotoReciboUrl] = await Promise.all([
    supabase.from("categoria_servicio").select("nombre").eq("id", lead.categoria_id).single(),
    supabase
      .from("campo_servicio")
      .select("id, nombre_campo, unidad_medida, tipo_dato, opciones")
      .eq("categoria_id", lead.categoria_id),
    supabase.from("valor_campo_lead").select("campo_servicio_id, valor").eq("lead_id", lead.id),
    getFotoSignedUrl(lead.foto_dni_url),
    getFotoSignedUrl(lead.foto_recibo_url),
  ]);

  const valorPorCampo = new Map((valores ?? []).map((v) => [v.campo_servicio_id, v.valor]));

  const puedeReclamar = usuario.rol === "vendedor" && lead.estado === "activo";
  const puedeCompletarDatos =
    lead.estado === "asignado" && (usuario.rol === "admin" || lead.vendedor_id === usuario.id);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{lead.nombre}</h1>
        <Badge variant="outline">{lead.estado}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Categoría:</span> {categoria?.nombre ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Dirección:</span> {lead.direccion ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Teléfono:</span> {lead.telefono ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Correo:</span> {lead.correo ?? "—"}
          </p>
          {(fotoDniUrl || fotoReciboUrl) && (
            <div className="flex gap-4 pt-2">
              {fotoDniUrl && (
                <a href={fotoDniUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Ver foto de DNI
                </a>
              )}
              {fotoReciboUrl && (
                <a href={fotoReciboUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Ver foto de recibo
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {(campos ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campos de {categoria?.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {puedeCompletarDatos ? (
              <CompletarDatosForm leadId={lead.id} campos={campos ?? []} />
            ) : (
              (campos ?? []).map((campo) => (
                <p key={campo.id}>
                  <span className="text-muted-foreground">{campo.nombre_campo}:</span>{" "}
                  {valorPorCampo.get(campo.id) ?? "—"}
                  {campo.unidad_medida && valorPorCampo.get(campo.id) ? ` ${campo.unidad_medida}` : ""}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {puedeReclamar && <ReclamarButton leadId={lead.id} />}
    </div>
  );
}
