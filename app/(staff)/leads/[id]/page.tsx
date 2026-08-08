import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { getFotoSignedUrl } from "@/lib/storage/lead-fotos";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReclamarButton } from "./reclamar-button";
import { CompletarDatosForm } from "./completar-form";
import { ConvertirClienteForm } from "./convertir-cliente-form";

export default async function LeadDetallePage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const usuario = await getStaffUser();
  if (!usuario) notFound();

  const supabase = await createClient();

  const { data: lead } = await supabase.from("lead").select("*").eq("id", id).single();
  if (!lead) notFound();

  const [{ data: categoria }, { data: campos }, { data: valores }, fotoDniUrl, fotoReciboUrl, { data: clienteExistente }] =
    await Promise.all([
      supabase.from("categoria_servicio").select("nombre").eq("id", lead.categoria_id).single(),
      supabase
        .from("campo_servicio")
        .select("id, nombre_campo, unidad_medida, tipo_dato, opciones")
        .eq("categoria_id", lead.categoria_id),
      supabase.from("valor_campo_lead").select("campo_servicio_id, valor").eq("lead_id", lead.id),
      getFotoSignedUrl(lead.foto_dni_url),
      getFotoSignedUrl(lead.foto_recibo_url),
      usuario.rol === "admin"
        ? supabase.from("cliente").select("id").eq("lead_id", lead.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const valorPorCampo = new Map((valores ?? []).map((v) => [v.campo_servicio_id, v.valor]));

  const puedeReclamar = usuario.rol === "vendedor" && lead.estado === "activo";
  const puedeCompletarDatos =
    lead.estado === "asignado" && (usuario.rol === "admin" || lead.vendedor_id === usuario.id);
  const puedeConvertir = usuario.rol === "admin" && lead.estado === "en_proceso" && !clienteExistente;

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

      {clienteExistente && (
        <Button render={<Link href={`/clientes/${clienteExistente.id}`} />} variant="outline">
          Ver cliente
        </Button>
      )}

      {usuario.rol === "admin" && !clienteExistente && lead.estado !== "en_proceso" && (
        <p className="text-sm text-muted-foreground">
          {lead.estado === "activo" && "Todavía no se puede convertir: ningún vendedor lo reclamó."}
          {lead.estado === "asignado" &&
            "Todavía no se puede convertir: falta que el vendedor complete los datos del cliente (arriba)."}
          {(lead.estado === "convertido" || lead.estado === "descartado") &&
            `Este lead está ${lead.estado} y ya no se puede convertir.`}
        </p>
      )}

      {puedeConvertir && <ConvertirClienteForm leadId={lead.id} />}
    </div>
  );
}
