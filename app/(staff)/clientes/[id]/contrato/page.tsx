import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MandatoCobro } from "./mandato-cobro";
import { ContratoForm } from "./contrato-form";
import { VerificarDownpaymentButton } from "./verificar-downpayment";
import { AvanceObraForm, AvanceObraTimeline } from "./avance-obra";
import { getAvanceObraFotoSignedUrl } from "@/lib/storage/avance-obra-fotos";

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
        await supabase
          .from("cuota")
          .select("id, numero, fecha_vencimiento, monto, estado")
          .eq("prestamo_id", prestamo.id)
          .order("numero")
      ).data
    : null;

  const movimientos =
    cuotas && cuotas.length > 0
      ? (
          await supabase
            .from("movimiento_pago")
            .select("id, cuota_id, tipo, monto, resultado, fecha_registro")
            .in(
              "cuota_id",
              cuotas.map((c) => c.id)
            )
            .order("fecha_registro", { ascending: false })
        ).data
      : null;

  const numeroPorCuotaId = new Map((cuotas ?? []).map((c) => [c.id, c.numero]));

  const ESTADO_CUOTA_VARIANT = {
    pendiente: "outline",
    pagada: "default",
    vencida: "secondary",
    en_mora: "destructive",
  } as const;

  const { data: avancesRaw } = contrato?.downpayment_pagado
    ? await supabase
        .from("avance_obra")
        .select("id, etapa, descripcion, foto_url, fecha_registro")
        .eq("contrato_id", contrato.id)
        .order("fecha_registro", { ascending: false })
    : { data: null };

  const avances = avancesRaw
    ? await Promise.all(
        avancesRaw.map(async (avance) => ({
          id: avance.id,
          etapa: avance.etapa,
          descripcion: avance.descripcion,
          fecha_registro: avance.fecha_registro,
          fotoUrl: await getAvanceObraFotoSignedUrl(avance.foto_url),
        }))
      )
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
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.numero}>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell>{c.fecha_vencimiento}</TableCell>
                    <TableCell>${Number(c.monto).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_CUOTA_VARIANT[c.estado]}>{c.estado.replace("_", " ")}</Badge>
                    </TableCell>
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

      {movimientos && movimientos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de cobros</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{numeroPorCuotaId.get(m.cuota_id) ?? "—"}</TableCell>
                    <TableCell className="capitalize">{m.tipo}</TableCell>
                    <TableCell>${Number(m.monto).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={m.resultado === "exitoso" ? "default" : m.resultado === "fallido" ? "destructive" : "secondary"}>
                        {m.resultado}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(m.fecha_registro).toLocaleString("es-PE")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {contrato?.downpayment_pagado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avance de obra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AvanceObraTimeline avances={avances ?? []} />
            <AvanceObraForm clienteId={cliente.id} contratoId={contrato.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
