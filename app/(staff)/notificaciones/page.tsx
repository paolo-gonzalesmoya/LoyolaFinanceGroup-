import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MarcarLeidaButton } from "./marcar-leida";

export default async function NotificacionesPage() {
  const usuario = await getStaffUser();
  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "vendedor")) redirect("/dashboard");

  // Sin filtro explícito: la RLS scoped al asesor (vendedor_select en
  // notificacion) ya limita a las de sus propios clientes.
  const supabase = await createClient();
  const { data: notificaciones } = await supabase
    .from("notificacion")
    .select("id, cliente_id, tipo, mensaje, leida, fecha_registro")
    .eq("destinatario", "admin")
    .order("fecha_registro", { ascending: false })
    .limit(100);

  const clienteIds = [...new Set((notificaciones ?? []).map((n) => n.cliente_id).filter((id): id is string => !!id))];
  const { data: clientes } =
    clienteIds.length > 0 ? await supabase.from("cliente").select("id, nombre").in("id", clienteIds) : { data: [] };
  const nombrePorClienteId = new Map((clientes ?? []).map((c) => [c.id, c.nombre]));

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Notificaciones</h1>

      <Card>
        <CardContent>
          {!notificaciones || notificaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay notificaciones todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificaciones.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{n.cliente_id ? (nombrePorClienteId.get(n.cliente_id) ?? "—") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={n.leida ? "outline" : "default"}>{n.tipo.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="max-w-sm">{n.mensaje}</TableCell>
                    <TableCell>{new Date(n.fecha_registro).toLocaleString("es-PE")}</TableCell>
                    <TableCell>{!n.leida && <MarcarLeidaButton notificacionId={n.id} />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
