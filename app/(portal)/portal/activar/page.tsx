import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ActivarCuentaForm } from "./form";

export default function ActivarCuentaPage() {
  return (
    <main className="flex min-h-[80svh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>Elige una contraseña para tu portal de Loyola Finance Group.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivarCuentaForm />
        </CardContent>
      </Card>
    </main>
  );
}
