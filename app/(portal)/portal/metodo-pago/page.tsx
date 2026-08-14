import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClienteUser } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FormularioMetodoPago } from "./formulario";

export default async function MetodoPagoPage() {
  const cliente = await getClienteUser();
  if (!cliente) redirect("/portal-login/ingresar");
  if (!cliente.tc_aceptado_en) redirect("/portal/terminos");

  // El cliente tiene que aceptar los términos de SU contrato antes de poder
  // autorizar un método de cobro — ver 20260814050000_cliente_acepta_contrato.sql.
  const supabase = await createClient();
  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("id")
    .eq("cliente_id", cliente.id)
    .maybeSingle();
  if (solicitud) {
    const { data: contrato } = await supabase
      .from("contrato")
      .select("cliente_acepto_en")
      .eq("solicitud_id", solicitud.id)
      .maybeSingle();
    if (contrato && !contrato.cliente_acepto_en) redirect("/portal/contrato");
  }

  return (
    <div className="max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Método de cobro</CardTitle>
          <CardDescription>Al guardar uno nuevo, se desactiva el anterior.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioMetodoPago />
        </CardContent>
      </Card>
    </div>
  );
}
