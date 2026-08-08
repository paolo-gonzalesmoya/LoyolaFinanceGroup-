import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CambiarPasswordForm } from "./form";

export default async function CuentaPage() {
  const usuario = await getStaffUser();
  if (!usuario) redirect("/login");

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Mi cuenta</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{usuario.nombre}</CardTitle>
          <CardDescription>
            {usuario.correo} · {usuario.rol}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <CambiarPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
