import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function LeadsPage() {
  const supabase = await createClient();
  const [{ data: leads }, { data: categorias }] = await Promise.all([
    supabase
      .from("lead")
      .select("id, nombre, estado, categoria_id, fecha_registro")
      .order("fecha_registro", { ascending: false }),
    supabase.from("categoria_servicio").select("id, nombre"),
  ]);

  const nombreCategoria = new Map((categorias ?? []).map((c) => [c.id, c.nombre]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Button render={<Link href="/leads/nuevo" />}>Nuevo lead</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registrado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(leads ?? []).map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                  {lead.nombre}
                </Link>
              </TableCell>
              <TableCell>{nombreCategoria.get(lead.categoria_id) ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{lead.estado}</Badge>
              </TableCell>
              <TableCell>{new Date(lead.fecha_registro).toLocaleDateString("es")}</TableCell>
            </TableRow>
          ))}
          {(!leads || leads.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Sin leads todavía.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
