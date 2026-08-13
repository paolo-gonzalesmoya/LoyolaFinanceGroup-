import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClienteUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Simulador } from "./simulador";
import { SolicitudClienteForm } from "./solicitud-form";
import { DownpaymentCheckout } from "./downpayment-checkout";

const ESTADO_CUOTA_VARIANT = {
  pendiente: "outline",
  pagada: "default",
  vencida: "secondary",
  en_mora: "destructive",
} as const;

export default async function PortalPage() {
  const cliente = await getClienteUser();
  if (!cliente) redirect("/portal-login");

  const supabase = await createClient();

  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("id, monto_solicitado, decision, motivo_rechazo")
    .eq("cliente_id", cliente.id)
    .maybeSingle();

  // Sin solicitud todavía: puede simular, y si ya está confirmado, enviar
  // su solicitud real (SSN + monto).
  if (!solicitud) {
    const { data: niveles } = await supabase
      .from("niveles_score")
      .select("id, nombre_nivel, score_min, score_max, tasa_interes")
      .eq("activo", true)
      .order("score_min");

    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>
        <Simulador niveles={niveles ?? []} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            {cliente.verificado ? (
              <SolicitudClienteForm />
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavía estamos confirmando tu identidad. Apenas terminemos, vas a poder enviar tu solicitud real
                acá mismo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (solicitud.decision !== "aprobado") {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Monto solicitado: <b>${Number(solicitud.monto_solicitado).toFixed(2)}</b> ·{" "}
              <Badge variant="outline">{solicitud.decision}</Badge>
            </p>
            {solicitud.decision === "pendiente" && (
              <p className="text-muted-foreground">Estamos evaluando tu solicitud. Te avisamos apenas tengamos una decisión.</p>
            )}
            {solicitud.decision === "rechazado" && solicitud.motivo_rechazo && (
              <p className="text-muted-foreground">Motivo: {solicitud.motivo_rechazo}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: contrato } = await supabase.from("contrato").select("*").eq("solicitud_id", solicitud.id).maybeSingle();

  if (!contrato) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¡Tu solicitud fue aprobada!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Estamos preparando tu contrato — te avisamos apenas esté listo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("id")
    .eq("cliente_id", cliente.id)
    .eq("estado", "activo")
    .maybeSingle();

  if (!contrato.downpayment_pagado) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu contrato está listo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {contrato.numero_cuotas} cuotas · {contrato.tasa_mensual}% mensual · Downpayment inicial: $
              {Number(contrato.downpayment_monto).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <DownpaymentCheckout clienteId={cliente.id} contratoId={contrato.id} tieneMetodoDeCobro={!!mandato} />
      </div>
    );
  }

  const { data: prestamo } = await supabase
    .from("prestamo")
    .select("id, monto_financiado, estado")
    .eq("contrato_id", contrato.id)
    .maybeSingle();

  const { data: cuotas } = prestamo
    ? await supabase.from("cuota").select("id, numero, fecha_vencimiento, monto, estado").eq("prestamo_id", prestamo.id).order("numero")
    : { data: null };

  const { data: saldos } =
    cuotas && cuotas.length > 0
      ? await supabase
          .from("saldo_cuota")
          .select("cuota_id, saldo_pendiente")
          .in(
            "cuota_id",
            cuotas.map((c) => c.id)
          )
      : { data: null };
  const saldoPorCuotaId = new Map((saldos ?? []).map((s) => [s.cuota_id, Number(s.saldo_pendiente)]));

  const { data: notificaciones } = await supabase
    .from("notificacion")
    .select("id, mensaje, fecha_registro")
    .eq("cliente_id", cliente.id)
    .eq("destinatario", "cliente")
    .order("fecha_registro", { ascending: false })
    .limit(10);

  if (!prestamo) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu downpayment ya se cobró — estamos terminando de armar tu cronograma de pagos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu préstamo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Monto financiado: ${Number(prestamo.monto_financiado).toFixed(2)} · {contrato.numero_cuotas} cuotas ·{" "}
            {contrato.tasa_mensual}% mensual
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Estado:</span>
            <Badge variant={prestamo.estado === "activo" ? "outline" : "secondary"}>{prestamo.estado}</Badge>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground">Método de cobro:</span>
            <Badge variant={mandato ? "outline" : "destructive"}>{mandato ? "autorizado" : "sin autorizar"}</Badge>
            <Button size="sm" variant="ghost" render={<Link href="/portal/metodo-pago" />}>
              {mandato ? "Cambiar tarjeta" : "Autorizar método de cobro"}
            </Button>
          </p>
        </CardContent>
      </Card>

      {cuotas && cuotas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cronograma de pagos</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell>{c.fecha_vencimiento}</TableCell>
                    <TableCell>${Number(c.monto).toFixed(2)}</TableCell>
                    <TableCell>${(saldoPorCuotaId.get(c.id) ?? Number(c.monto)).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_CUOTA_VARIANT[c.estado]}>{c.estado.replace("_", " ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {notificaciones && notificaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificaciones recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {notificaciones.map((n) => (
              <p key={n.id} className="border-b pb-2 last:border-0 last:pb-0">
                {n.mensaje}{" "}
                <span className="text-muted-foreground">— {new Date(n.fecha_registro).toLocaleDateString("es-PE")}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
