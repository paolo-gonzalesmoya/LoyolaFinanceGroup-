import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClienteUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    .select("id")
    .eq("cliente_id", cliente.id)
    .maybeSingle();

  const { data: contrato } = solicitud
    ? await supabase.from("contrato").select("*").eq("solicitud_id", solicitud.id).maybeSingle()
    : { data: null };

  const { data: prestamo } = contrato
    ? await supabase.from("prestamo").select("id, monto_financiado, estado").eq("contrato_id", contrato.id).maybeSingle()
    : { data: null };

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

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("id")
    .eq("cliente_id", cliente.id)
    .eq("estado", "activo")
    .maybeSingle();

  const { data: notificaciones } = await supabase
    .from("notificacion")
    .select("id, mensaje, fecha_registro")
    .eq("cliente_id", cliente.id)
    .eq("destinatario", "cliente")
    .order("fecha_registro", { ascending: false })
    .limit(10);

  if (!contrato || !prestamo) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold">Hola, {cliente.nombre}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no tienes un préstamo activo. Cuando tu financiamiento esté listo, lo vas a ver acá.
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
