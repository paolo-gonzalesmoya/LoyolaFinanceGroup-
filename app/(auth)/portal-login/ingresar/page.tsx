import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LoginForm } from "../login-form";

export default function IngresarPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <Logo className="h-10 w-auto" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Portal del cliente</CardTitle>
          <CardDescription>Ingresa con tu cuenta de Loyola Finance Group.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-foreground underline-offset-4 hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
