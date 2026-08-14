import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { RegistroForm } from "../form";

export default function RegistroFormularioPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <Logo className="h-10 w-auto" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Datos de tu cuenta</CardTitle>
          <CardDescription>Completa tus datos para crear tu cuenta en Loyola Finance Group.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistroForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/portal-login/ingresar" className="text-foreground underline-offset-4 hover:underline">
              Ingresa acá
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
