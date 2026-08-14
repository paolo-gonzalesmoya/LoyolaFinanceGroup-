import { redirect } from "next/navigation";
import { getClienteUser } from "@/lib/auth/session";
import { TC_TEXTO } from "@/lib/legal/terminos";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AceptarTerminosForm } from "./form";

export default async function TerminosPage() {
  const cliente = await getClienteUser();
  if (!cliente) redirect("/portal-login/ingresar");
  if (cliente.tc_aceptado_en) redirect("/portal");

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Términos y Condiciones</CardTitle>
          <CardDescription>Antes de continuar, léelos y acéptalos — es el último paso para entrar a tu portal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-line text-muted-foreground">
            {TC_TEXTO}
          </div>
          <AceptarTerminosForm />
        </CardContent>
      </Card>
    </div>
  );
}
