import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClientesPage() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("cliente")
    .select("id, nombre, correo, telefono, fecha_registro")
    .order("fecha_registro", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clientes</h1>
        <Button render={<Link href="/clientes/nuevo" />}>Nuevo cliente</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Registrado</TableHead>
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
            </TableRow>
          ))}
          {(!clientes || clientes.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Sin clientes todavía — registra el primero con "Nuevo cliente".
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
