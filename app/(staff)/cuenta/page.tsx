import { redirect } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
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
        <Collapsible className="flex flex-col gap-(--card-spacing)">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-(--card-spacing) text-left">
            <CardTitle className="text-base">Cambiar contraseña</CardTitle>
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 data-[panel-open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <CambiarPasswordForm />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
