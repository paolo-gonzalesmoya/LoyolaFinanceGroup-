import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoClienteForm } from "./form";

export default async function NuevoClientePage() {
  const usuario = await getStaffUser();
  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "vendedor")) redirect("/dashboard");

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">Nuevo cliente</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <NuevoClienteForm />
        </CardContent>
      </Card>
    </div>
  );
}
