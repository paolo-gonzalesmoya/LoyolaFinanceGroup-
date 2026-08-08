import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { ssnLast4 } from "@/lib/crypto/ssn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevealSsn } from "./reveal-ssn";
import { ConsultaScore } from "./consulta-score";
import { DecisionCredito } from "./decision-credito";

export default async function ClienteDetallePage({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("cliente").select("*").eq("id", id).single();
  if (!cliente) notFound();

  const { data: cotizacion } = await supabase
    .from("cotizacion")
    .select("id, requiere_financiamiento, fecha_registro")
    .eq("cliente_id", id)
    .maybeSingle();

  const [{ data: items }, { data: solicitud }, { data: consultas }] = await Promise.all([
    cotizacion
      ? supabase.from("item_cotizacion").select("*").eq("cotizacion_id", cotizacion.id)
      : Promise.resolve({ data: null }),
    cotizacion
      ? supabase
          .from("solicitud_credito")
          .select("id, decision, motivo_rechazo")
          .eq("cotizacion_id", cotizacion.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("consulta_score")
      .select("id, score, ingresos_mensuales, capacidad_pago, fecha_registro")
      .eq("cliente_id", id)
      .order("fecha_registro", { ascending: false }),
  ]);

  const total = (items ?? []).reduce((suma, item) => suma + Number(item.subtotal), 0);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{cliente.nombre}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Dirección:</span> {cliente.direccion ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Teléfono:</span> {cliente.telefono ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Correo:</span> {cliente.correo ?? "—"}
          </p>
          <p className="flex items-center gap-1">
            <span className="text-muted-foreground">SSN/ITN:</span>{" "}
            {cliente.ssn_itn_cifrado ? (
              <RevealSsn clienteId={cliente.id} mascara={ssnLast4(cliente.ssn_itn_cifrado)} />
            ) : (
              "—"
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cotización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!cotizacion && (
            <Button render={<Link href={`/clientes/${cliente.id}/cotizacion`} />}>Crear cotización</Button>
          )}

          {cotizacion && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio unitario</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>${Number(item.precio_unitario).toFixed(2)}</TableCell>
                      <TableCell>${Number(item.subtotal).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell>${total.toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Financiamiento:</span>
                <Badge variant="outline">{cotizacion.requiere_financiamiento ? "Requiere" : "No requiere"}</Badge>
                {solicitud && (
                  <>
                    <span className="text-muted-foreground">· Solicitud de crédito:</span>
                    <Badge variant="outline">{solicitud.decision}</Badge>
                  </>
                )}
              </div>
              {solicitud?.motivo_rechazo && (
                <p className="text-sm text-muted-foreground">Motivo de rechazo: {solicitud.motivo_rechazo}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {cotizacion?.requiere_financiamiento && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consulta de score (Experian)</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsultaScore clienteId={cliente.id} consultas={consultas ?? []} />
          </CardContent>
        </Card>
      )}

      {solicitud?.decision === "pendiente" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisión de crédito</CardTitle>
          </CardHeader>
          <CardContent>
            <DecisionCredito
              input={{
                clienteId: cliente.id,
                leadId: cliente.lead_id,
                solicitudId: solicitud.id,
                cotizacionId: cotizacion!.id,
              }}
            />
          </CardContent>
        </Card>
      )}

      {solicitud?.decision === "aprobado" && (
        <Button render={<Link href={`/clientes/${cliente.id}/contrato`} />}>Ir a contrato</Button>
      )}
    </div>
  );
}
