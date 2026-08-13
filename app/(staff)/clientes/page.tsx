import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClientesPage() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("cliente")
    .select("id, nombre, correo, telefono, fecha_registro, verificado")
    .order("verificado", { ascending: true })
    .order("fecha_registro", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-2">
          {/* <a> a propósito, no <Link>: /clientes/export es un archivo para
              descargar (Content-Disposition: attachment), no una página —
              Link intentaría una transición client-side y rompería la descarga. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <Button variant="outline" render={<a href="/clientes/export" />}>
            Descargar Excel
          </Button>
          <Button render={<Link href="/clientes/nuevo" />}>Nuevo cliente</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(clientes ?? []).map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>
                <Link href={`/clientes/${cliente.id}`} className="hover:underline">
                  {cliente.nombre}
                </Link>
              </TableCell>
              <TableCell>{cliente.correo ?? "—"}</TableCell>
              <TableCell>{cliente.telefono ?? "—"}</TableCell>
              <TableCell>{new Date(cliente.fecha_registro).toLocaleDateString("es")}</TableCell>
              <TableCell>
                {cliente.verificado ? (
                  <Badge variant="outline">Verificado</Badge>
                ) : (
                  <Badge variant="destructive">Sin confirmar</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
          {(!clientes || clientes.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Sin clientes todavía — registra el primero con “Nuevo cliente”.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
