import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MandatoCobro } from "./mandato-cobro";
import { ContratoForm } from "./contrato-form";
import { VerificarDownpaymentButton } from "./verificar-downpayment";

export default async function ContratoPage({ params }: PageProps<"/clientes/[id]/contrato">) {
  const { id } = await params;
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("cliente").select("*").eq("id", id).single();
  if (!cliente) notFound();

  const { data: cotizacion } = await supabase.from("cotizacion").select("id").eq("cliente_id", id).maybeSingle();
  if (!cotizacion) redirect(`/clientes/${id}`);

  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("id, decision")
    .eq("cotizacion_id", cotizacion.id)
    .maybeSingle();
  if (!solicitud || solicitud.decision !== "aprobado") redirect(`/clientes/${id}`);

  const [{ data: mandato }, { data: contrato }, { data: items }, { data: lead }, { data: vendedores }] = await Promise.all([
    supabase.from("mandato_cobro").select("id").eq("cliente_id", id).eq("estado", "activo").maybeSingle(),
    supabase.from("contrato").select("*").eq("solicitud_id", solicitud.id).maybeSingle(),
    supabase.from("item_cotizacion").select("subtotal").eq("cotizacion_id", cotizacion.id),
    supabase.from("lead").select("vendedor_id").eq("id", cliente.lead_id).single(),
    supabase.from("usuario").select("id, nombre").eq("rol", "vendedor").eq("activo", true).order("nombre"),
  ]);

  const total = (items ?? []).reduce((suma, item) => suma + Number(item.subtotal), 0);

  const [{ data: comision }, { data: prestamo }] = await Promise.all([
    contrato
      ? supabase.from("comision_vendedor").select("*").eq("contrato_id", contrato.id).maybeSingle()
      : Promise.resolve({ data: null }),
    contrato
      ? supabase.from("prestamo").select("id, monto_financiado").eq("contrato_id", contrato.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const cuotas = prestamo
    ? (
        await supabase.from("cuota").select("numero, fecha_vencimiento, monto").eq("prestamo_id", prestamo.id).order("numero")
      ).data
    : null;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Contrato — {cliente.nombre}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Método de cobro</CardTitle>
        </CardHeader>
        <CardContent>
          {mandato ? <Badge variant="outline">Autorizado</Badge> : <MandatoCobro clienteId={cliente.id} />}
        </CardContent>
      </Card>

      {mandato && !contrato && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <ContratoForm
              clienteId={cliente.id}
              cotizacionId={cotizacion.id}
              solicitudId={solicitud.id}
              total={total}
              vendedores={vendedores ?? []}
              vendedorIdSugerido={lead?.vendedor_id ?? null}
            />
          </CardContent>
        </Card>
      )}

      {contrato && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {contrato.numero_cuotas} cuotas · {contrato.tasa_mensual}% mensual
            </p>
            <p>
              Downpayment: ${Number(contrato.downpayment_monto).toFixed(2)} —{" "}
              <Badge variant="outline">{contrato.downpayment_pagado ? "cobrado" : "pendiente"}</Badge>
            </p>
            {comision && (
              <p>
                Comisión del vendedor: ${Number(comision.monto).toFixed(2)} ({comision.porcentaje}%) —{" "}
                <Badge variant="outline">{comision.estado}</Badge>
              </p>
            )}
            {!contrato.downpayment_pagado && (
              <VerificarDownpaymentButton
                input={{ clienteId: cliente.id, contratoId: contrato.id, cotizacionId: cotizacion.id }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {prestamo && cuotas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cronograma de cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.numero}>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell>{c.fecha_vencimiento}</TableCell>
                    <TableCell>${Number(c.monto).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-sm text-muted-foreground">
              Monto financiado: ${Number(prestamo.monto_financiado).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
