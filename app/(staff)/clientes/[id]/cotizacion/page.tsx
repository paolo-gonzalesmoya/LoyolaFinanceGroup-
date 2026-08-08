import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { CotizacionForm } from "./form";

export default async function NuevaCotizacionPage({ params }: PageProps<"/clientes/[id]/cotizacion">) {
  const { id } = await params;
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("cliente").select("id, nombre").eq("id", id).single();
  if (!cliente) notFound();

  const { data: cotizacionExistente } = await supabase
    .from("cotizacion")
    .select("id")
    .eq("cliente_id", id)
    .maybeSingle();
  if (cotizacionExistente) redirect(`/clientes/${id}`);

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Nueva cotización — {cliente.nombre}</h1>
      <CotizacionForm clienteId={cliente.id} />
    </div>
  );
}
