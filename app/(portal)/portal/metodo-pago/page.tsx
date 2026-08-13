import { redirect } from "next/navigation";
import { getClienteUser } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FormularioMetodoPago } from "./formulario";

export default async function MetodoPagoPage() {
  const cliente = await getClienteUser();
  if (!cliente) redirect("/portal-login/ingresar");
  if (!cliente.tc_aceptado_en) redirect("/portal/terminos");

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
