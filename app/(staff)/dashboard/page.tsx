import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diasDeAtraso } from "@/lib/mora/calculo";

function money(monto: number | string) {
  return `$${Number(monto).toFixed(2)}`;
}

// Cadena cuota -> prestamo -> contrato -> solicitud -> cliente vía embeds de
// PostgREST (FK única por columna en cada salto, ver types/database.types.ts)
// para llegar al nombre del cliente sin encadenar fetches manuales.
const CUOTA_CON_CLIENTE = `
  id, numero, fecha_vencimiento, monto,
  prestamo:prestamo_id (
    id,
    contrato:contrato_id (
      id,
      solicitud:solicitud_id ( id, cliente:cliente_id ( id, nombre ) )
    )
  )
`;

function nombreDeCuota(cuota: { prestamo: { contrato: { solicitud: { cliente: { nombre: string } | null } | null } | null } | null }) {
  return cuota.prestamo?.contrato?.solicitud?.cliente?.nombre ?? "—";
}

export default async function DashboardPage() {
  const usuario = await getStaffUser();
  if (!usuario) redirect("/login");

  const hoy = new Date();
  const en7dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
  const hoyStr = hoy.toISOString().slice(0, 10);
  const en7diasStr = en7dias.toISOString().slice(0, 10);

  const supabase = await createClient();

  const [{ data: prestamosActivos }, { data: cuotasVencidas }, { data: proximosCobros }, { data: solicitudesPendientes }, { data: clientesSinVerificar }, { count: contratosSinAceptar }] =
    await Promise.all([
      supabase.from("prestamo").select("id, monto_financiado").eq("estado", "activo"),
      supabase.from("cuota").select(CUOTA_CON_CLIENTE).eq("estado", "vencida").order("fecha_vencimiento", { ascending: true }),
      supabase
        .from("cuota")
        .select(CUOTA_CON_CLIENTE)
        .eq("estado", "pendiente")
        .gte("fecha_vencimiento", hoyStr)
        .lte("fecha_vencimiento", en7diasStr)
        .order("fecha_vencimiento", { ascending: true }),
      supabase.from("solicitud_credito").select("id, monto_solicitado, cliente:cliente_id (id, nombre)").eq("decision", "pendiente"),
      supabase.from("cliente").select("id, nombre, fecha_registro").eq("verificado", false).order("fecha_registro", { ascending: false }),
      supabase.from("contrato").select("id", { count: "exact", head: true }).is("cliente_acepto_en", null),
    ]);

  const carteraActiva = (prestamosActivos ?? []).reduce((sum, p) => sum + Number(p.monto_financiado), 0);
  const montoVencido = (cuotasVencidas ?? []).reduce((sum, c) => sum + Number(c.monto), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">Cartera activa</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{money(carteraActiva)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">Préstamos activos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{prestamosActivos?.length ?? 0}</CardContent>
        </Card>
        <Card className="ring-destructive/40">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">Cuotas vencidas</CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-2 text-2xl font-semibold text-destructive">
            {cuotasVencidas?.length ?? 0}
            <span className="text-sm font-normal text-muted-foreground">{money(montoVencido)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">Pendientes de aceptación</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{contratosSinAceptar ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuotas vencidas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Días de atraso</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cuotasVencidas ?? []).map((cuota) => (
                <TableRow key={cuota.id}>
                  <TableCell>{nombreDeCuota(cuota)}</TableCell>
                  <TableCell>#{cuota.numero}</TableCell>
                  <TableCell>{new Date(cuota.fecha_vencimiento).toLocaleDateString("es")}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{diasDeAtraso(cuota.fecha_vencimiento, hoy)} días</Badge>
                  </TableCell>
                  <TableCell>{money(cuota.monto)}</TableCell>
                </TableRow>
              ))}
              {(!cuotasVencidas || cuotasVencidas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin cuotas vencidas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos cobros (7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Cuota</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(proximosCobros ?? []).map((cuota) => (
                <TableRow key={cuota.id}>
                  <TableCell>{nombreDeCuota(cuota)}</TableCell>
                  <TableCell>#{cuota.numero}</TableCell>
                  <TableCell>{new Date(cuota.fecha_vencimiento).toLocaleDateString("es")}</TableCell>
                  <TableCell>{money(cuota.monto)}</TableCell>
                </TableRow>
              ))}
              {(!proximosCobros || proximosCobros.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin cobros programados en los próximos 7 días.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes sin decidir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(solicitudesPendientes ?? []).map((solicitud) => (
              <Link
                key={solicitud.id}
                href={`/clientes/${solicitud.cliente?.id ?? ""}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span>{solicitud.cliente?.nombre ?? "—"}</span>
                <span className="text-muted-foreground">{money(solicitud.monto_solicitado)}</span>
              </Link>
            ))}
            {(!solicitudesPendientes || solicitudesPendientes.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin solicitudes pendientes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes sin verificar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(clientesSinVerificar ?? []).map((cliente) => (
              <Link key={cliente.id} href={`/clientes/${cliente.id}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <span>{cliente.nombre}</span>
                <span className="text-muted-foreground">{new Date(cliente.fecha_registro).toLocaleDateString("es")}</span>
              </Link>
            ))}
            {(!clientesSinVerificar || clientesSinVerificar.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin clientes por verificar.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
